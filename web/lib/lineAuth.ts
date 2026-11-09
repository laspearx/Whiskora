// LINE sign-in / linking decisions as pure functions (no I/O) so every branch is unit-tested. F4 hotfix.
//
// Source of truth: the database (migration 20261110090000_line_identity_map) — table line_identities (UNIQUE LINE id,
// UNIQUE account) changed only through SECURITY DEFINER functions under transaction-scoped locks (Codex H2). The app
// never reads or writes a LINE identity in app_metadata or user_metadata to decide anything; user_metadata.line_id is
// written once at account creation as a rollback copy only.
//
// Legacy LINE-only accounts (made before F4) are never adopted on a LINE sign-in alone. They move only through an
// operation that proves the account AND resets its credentials first (Codex H1):
//   - signed-in legacy link: valid session + LINE OAuth + browser nonce → password rotated (= every session revoked)
//     → reset verified in SQL → mapping; or
//   - admin recovery: request recorded by the LINE sign-in → reviewer approves with ≥ 2 owner checks → same reset → mapping.

export const LINE_PLACEHOLDER_DOMAIN = 'line.whiskora.internal';

// GoTrue lower-cases every email, LINE ids are "U" + 32 hex: the stored placeholder is always lower case.
export const placeholderEmail = (lineUserId: string) => `line_${lineUserId}@${LINE_PLACEHOLDER_DOMAIN}`.toLowerCase();
export const isPlaceholderEmail = (email: string | null | undefined) =>
  !!email && email.toLowerCase().endsWith(`@${LINE_PLACEHOLDER_DOMAIN}`);

// Only a safe, bounded charset (the id becomes part of an email and of SQL arguments). Real ids: U + 32 hex.
export const isValidLineUserId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);

export const PENDING_TTL_SECONDS = 300;

// line_login_resolve() kinds
export type ResolveKind = 'holder' | 'legacy' | 'creating' | 'claims' | 'none' | 'invalid';

export type LoginDecision =
  | { action: 'login'; userId: string }
  | { action: 'create' }                   // fresh placeholder account + claim(login_create)
  | { action: 'review' }                   // legacy account: resume a reset op or record a recovery request; never sign in
  | { action: 'retry' }                    // a concurrent first sign-in of the same LINE id is creating the account
  | { action: 'relink_suggested' }         // only untrusted user_metadata claims exist
  | { action: 'error'; code: 'LINE_PROFILE_INVALID' };

export function decideLogin(kind: ResolveKind | string, userId: string | null, createConfirmed = false): LoginDecision {
  switch (kind) {
    case 'holder': return userId ? { action: 'login', userId } : { action: 'error', code: 'LINE_PROFILE_INVALID' };
    case 'legacy': return { action: 'review' };
    case 'creating': return { action: 'retry' };
    case 'claims': return createConfirmed ? { action: 'create' } : { action: 'relink_suggested' };
    case 'none': return { action: 'create' };
    default: return { action: 'error', code: 'LINE_PROFILE_INVALID' };
  }
}

// LINE-only = placeholder email and no OAuth identity: unlinking LINE would lock the owner out
export const isLineOnly = (u: { email?: string | null; identities?: { provider: string }[] | null }) =>
  isPlaceholderEmail(u.email) && !(u.identities ?? []).some((i) => i.provider !== 'email');

// SQL results → fixed user-facing codes
export const takeErrorCode = (r: string) =>
  r === 'expired' ? 'LINK_PENDING_EXPIRED' : r === 'mismatch' ? 'LINK_PENDING_MISMATCH' : 'LINK_PENDING_MISSING';
export const claimErrorCode = (r: string) => ({
  line_taken: 'LINE_LINKED_TO_OTHER', user_has_other: 'LINE_ALREADY_LINKED', legacy_exists: 'LINE_LEGACY_ACCOUNT_EXISTS',
  legacy_needs_reset: 'LINE_LEGACY_MISMATCH', not_legacy_of_line: 'LINE_LEGACY_MISMATCH', busy: 'LINE_TRY_AGAIN',
} as Record<string, string>)[r] ?? 'auth_failed';

// Errors shown to users: fixed codes only, never upstream bodies.
export const USER_ERROR_CODES = [
  'LINE_PROFILE_INVALID', 'LINE_ACCOUNT_CONFLICT', 'LINE_ACCOUNT_REVIEW', 'LINE_RELINK_SUGGESTED', 'LINE_LINKED_TO_OTHER',
  'LINE_ALREADY_LINKED', 'LINE_LEGACY_ACCOUNT_EXISTS', 'LINE_LEGACY_MISMATCH', 'LINE_LINK_UNAUTHORIZED', 'LINE_TRY_AGAIN',
  'LINE_RELOGIN', 'LINE_CREDENTIAL_RESET_FAILED', 'LINK_PENDING_MISSING', 'LINK_PENDING_EXPIRED', 'LINK_PENDING_MISMATCH',
  'LINE_TOKEN_FAILED', 'LINE_SESSION_FAILED', 'LINE_DISABLED_ON_PREVIEW', 'LINE_CONFIG_MISSING', 'state_mismatch', 'missing_code',
  'access_denied', 'auth_failed',
] as const;
export type UserErrorCode = (typeof USER_ERROR_CODES)[number];
export const toUserErrorCode = (v: string | null | undefined): UserErrorCode =>
  (USER_ERROR_CODES as readonly string[]).includes(v ?? '') ? (v as UserErrorCode) : 'auth_failed';
