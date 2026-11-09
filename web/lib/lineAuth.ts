// LINE Login / linking decisions as pure functions (no I/O) so every branch is unit-tested. F4 hotfix.
//
// Identity key: app_metadata.line_id ONLY. app_metadata is writable by the service role alone; user_metadata is
// writable by the signed-in user (supabase.auth.updateUser({ data })), so a user_metadata.line_id is never used to pick
// an account, to block one, or to send a notification. It is still written as a copy so that an app rollback to
// v1.14.2 (which reads it) finds the same accounts.
//
// Legacy accounts (made by the old callback, which never set app_metadata) are NOT adopted automatically: staging
// validation showed that nothing server-side separates an account made by our callback from one pre-registered
// through public signup with the same placeholder email (production autoconfirms signups; GoTrue gives admin-created
// users a random password too; identities look the same). A LINE OAuth success proves control of the LINE id, not of
// the old Supabase account. Legacy accounts move to app_metadata only with proof of BOTH:
//   1. session-proven link: the owner is signed in to the old account (valid session) AND completes LINE OAuth, then
//      confirms (POST /api/auth/line/confirm re-checks the session) — see decideLink / pending helpers below;
//   2. admin recovery: a LINE sign-in for a legacy account records a recovery request on that account
//      (app_metadata.line_recovery_request, server-written); an admin reviews and approves it
//      (supabase/scripts/line_identity_recovery.mjs), which also rotates the password (= revokes every session).

export const LINE_PLACEHOLDER_DOMAIN = 'line.whiskora.internal';

// GoTrue lower-cases every email, LINE ids are "U" + 32 hex: the stored placeholder is always lower case.
export const placeholderEmail = (lineUserId: string) => `line_${lineUserId}@${LINE_PLACEHOLDER_DOMAIN}`.toLowerCase();
export const isPlaceholderEmail = (email: string | null | undefined) =>
  !!email && email.toLowerCase().endsWith(`@${LINE_PLACEHOLDER_DOMAIN}`);

// Only a safe, bounded charset (the id becomes part of an email and a metadata value). Real ids: U + 32 hex.
export const isValidLineUserId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);

export const PENDING_TTL_MS = 5 * 60 * 1000;

export type AuthUserLite = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: { provider: string }[] | null;
};

const appLine = (u: AuthUserLite) => (typeof u.app_metadata?.line_id === 'string' ? (u.app_metadata.line_id as string) : null);
const metaLine = (u: AuthUserLite) => (typeof u.user_metadata?.line_id === 'string' ? (u.user_metadata.line_id as string) : null);

export type LineLookup = {
  holders: string[];             // app_metadata.line_id === id (trusted; normally 0 or 1)
  legacyPlaceholder: string | null; // account whose email is this id's placeholder and that has no app_metadata.line_id
  legacyClaims: string[];        // other accounts with only a user_metadata claim (untrusted)
};

// users must be ALL auth users (see listAllUsers): a partial list could miss a holder.
export function lookupLine(users: AuthUserLite[], lineUserId: string): LineLookup {
  const ph = placeholderEmail(lineUserId);
  const holders = users.filter((u) => appLine(u) === lineUserId).map((u) => u.id);
  const placeholderUser = users.find((u) => (u.email ?? '').toLowerCase() === ph && !appLine(u));
  const legacyClaims = users
    .filter((u) => !appLine(u) && metaLine(u) === lineUserId && u.id !== placeholderUser?.id)
    .map((u) => u.id);
  return { holders, legacyPlaceholder: placeholderUser?.id ?? null, legacyClaims };
}

export type LoginDecision =
  | { action: 'login'; userId: string }
  | { action: 'create'; email: string }
  | { action: 'review'; userId: string }   // legacy LINE account: record a recovery request, do not sign in
  | { action: 'relink_suggested' }         // only untrusted claims exist: sign in the usual way and link, or create explicitly
  | { action: 'error'; code: 'LINE_PROFILE_INVALID' | 'LINE_ACCOUNT_CONFLICT' };

export function decideLogin(lineUserId: unknown, found: LineLookup, createConfirmed = false): LoginDecision {
  if (!isValidLineUserId(lineUserId)) return { action: 'error', code: 'LINE_PROFILE_INVALID' };
  if (found.holders.length > 1) return { action: 'error', code: 'LINE_ACCOUNT_CONFLICT' }; // never pick the first
  if (found.holders.length === 1) return { action: 'login', userId: found.holders[0] };
  if (found.legacyPlaceholder) return { action: 'review', userId: found.legacyPlaceholder };
  if (found.legacyClaims.length > 0 && !createConfirmed) return { action: 'relink_suggested' };
  return { action: 'create', email: placeholderEmail(lineUserId) }; // never the email from LINE
}

export type LinkDecision =
  | { action: 'link' }
  | { action: 'already_linked' }
  | { action: 'error'; code: 'LINE_PROFILE_INVALID' | 'LINE_ACCOUNT_CONFLICT' | 'LINE_LINKED_TO_OTHER' | 'LINE_LEGACY_ACCOUNT_EXISTS' };

// callerId = the account proven by a valid session at confirm time.
export function decideLink(lineUserId: unknown, callerId: string, found: LineLookup): LinkDecision {
  if (!isValidLineUserId(lineUserId)) return { action: 'error', code: 'LINE_PROFILE_INVALID' };
  if (found.holders.length > 1) return { action: 'error', code: 'LINE_ACCOUNT_CONFLICT' };
  if (found.holders.length === 1) return found.holders[0] === callerId ? { action: 'already_linked' } : { action: 'error', code: 'LINE_LINKED_TO_OTHER' };
  // a legacy LINE account exists for this id and it is not the caller: linking elsewhere would orphan its data
  if (found.legacyPlaceholder && found.legacyPlaceholder !== callerId) return { action: 'error', code: 'LINE_LEGACY_ACCOUNT_EXISTS' };
  return { action: 'link' };
}

// After writing, re-read: two concurrent links of one id can both pass decideLink (no DB constraint in F4).
export function postWriteCheck(lineUserId: string, users: AuthUserLite[], callerId: string): 'ok' | 'conflict' {
  const holders = users.filter((u) => appLine(u) === lineUserId).map((u) => u.id);
  return holders.length === 1 && holders[0] === callerId ? 'ok' : 'conflict';
}

// ── pending link (server-side, in the linking user's app_metadata) ────────────────────────────────────────────────
export type PendingLink = { line_id: string; display_name: string; nonce_hash: string; exp: number };

export function makePending(lineUserId: string, displayName: string, nonceHash: string, now: number): PendingLink {
  return { line_id: lineUserId, display_name: String(displayName ?? '').slice(0, 100), nonce_hash: nonceHash, exp: now + PENDING_TTL_MS };
}

export function checkPending(pending: unknown, nonceHash: string | null, now: number):
  { ok: true; pending: PendingLink } | { ok: false; code: 'LINK_PENDING_MISSING' | 'LINK_PENDING_EXPIRED' | 'LINK_PENDING_MISMATCH' } {
  const p = pending as Partial<PendingLink> | null | undefined;
  if (!p || typeof p !== 'object' || !isValidLineUserId(p.line_id) || typeof p.nonce_hash !== 'string' || typeof p.exp !== 'number') {
    return { ok: false, code: 'LINK_PENDING_MISSING' };
  }
  if (!nonceHash || !timingSafeEqualHex(p.nonce_hash, nonceHash)) return { ok: false, code: 'LINK_PENDING_MISMATCH' };
  if (p.exp <= now) return { ok: false, code: 'LINK_PENDING_EXPIRED' };
  return { ok: true, pending: p as PendingLink };
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── metadata writers ─────────────────────────────────────────────────────────────────────────────────────────────
export const withLineId = (app: Record<string, unknown> | null | undefined, lineUserId: string) =>
  ({ ...(app || {}), line_id: lineUserId, line_link_pending: null });
export const withoutLineId = (app: Record<string, unknown> | null | undefined) => ({ ...(app || {}), line_id: null, line_link_pending: null });

// LINE is the account's only way in: placeholder email and no OAuth identity → unlinking would lock the owner out.
export const isLineOnly = (u: AuthUserLite) =>
  isPlaceholderEmail(u.email) && !(u.identities ?? []).some((i) => i.provider !== 'email');

// Errors shown to users: fixed codes only, never upstream bodies.
export const USER_ERROR_CODES = [
  'LINE_PROFILE_INVALID', 'LINE_ACCOUNT_CONFLICT', 'LINE_ACCOUNT_REVIEW', 'LINE_RELINK_SUGGESTED', 'LINE_LINKED_TO_OTHER',
  'LINE_LEGACY_ACCOUNT_EXISTS', 'LINE_LINK_UNAUTHORIZED', 'LINK_PENDING_MISSING', 'LINK_PENDING_EXPIRED', 'LINK_PENDING_MISMATCH',
  'LINE_TOKEN_FAILED', 'LINE_SESSION_FAILED', 'LINE_DISABLED_ON_PREVIEW', 'LINE_CONFIG_MISSING', 'state_mismatch', 'missing_code',
  'access_denied', 'auth_failed',
] as const;
export type UserErrorCode = (typeof USER_ERROR_CODES)[number];
export const toUserErrorCode = (v: string | null | undefined): UserErrorCode =>
  (USER_ERROR_CODES as readonly string[]).includes(v ?? '') ? (v as UserErrorCode) : 'auth_failed';
