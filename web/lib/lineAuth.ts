// LINE Login → Supabase user, as pure decisions (no I/O) so it can be unit-tested. See docs/SECURITY_PHASE1.md §H2.
//
// Trust chain: the authorization code is exchanged server-to-server (TLS + channel secret) and the LINE user id comes
// from GET /v2/profile with that access token — never from the browser. The id_token / its email is NOT used: LINE does
// not state that the email claim is verified, so an email from LINE must never pick (or create a confirmed) account.
//
// Identity key: app_metadata.line_id — only the service role can write app_metadata. user_metadata is writable by the
// user (supabase.auth.updateUser({ data })), so a legacy user_metadata.line_id is ignored here (one-time backfill copies
// it to app_metadata: supabase/scripts/line_identity_backfill.mjs).

export const LINE_PLACEHOLDER_DOMAIN = 'line.whiskora.internal';
export const placeholderEmail = (lineUserId: string) => `line_${lineUserId}@${LINE_PLACEHOLDER_DOMAIN}`;

export type LineDecision =
  | { action: 'login'; userId: string }
  | { action: 'create'; email: string }
  | { action: 'link'; userId: string }
  | { action: 'already_linked' }               // link mode: this LINE account belongs to the caller already
  | { action: 'error'; code: 'LINE_PROFILE_INVALID' | 'LINE_ACCOUNT_CONFLICT' | 'LINE_LINKED_TO_OTHER' | 'LINE_LINK_UNAUTHORIZED' };

// ids = every user whose app_metadata.line_id equals this LINE user id (normally 0 or 1).
export function decideLine(input: { lineUserId: unknown; mode: string; linkUid: string; ids: string[] }): LineDecision {
  const { lineUserId, mode, linkUid, ids } = input;
  // LINE user ids look like "U" + 32 hex, but that format is not relied on (a too-strict check would lock users out);
  // only a safe, bounded charset is required (it becomes part of a placeholder email and a metadata value).
  if (typeof lineUserId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(lineUserId)) return { action: 'error', code: 'LINE_PROFILE_INVALID' };
  if (ids.length > 1) return { action: 'error', code: 'LINE_ACCOUNT_CONFLICT' }; // never guess between accounts
  if (mode === 'link') {
    if (!linkUid) return { action: 'error', code: 'LINE_LINK_UNAUTHORIZED' };
    if (ids.length === 1) return ids[0] === linkUid ? { action: 'already_linked' } : { action: 'error', code: 'LINE_LINKED_TO_OTHER' };
    return { action: 'link', userId: linkUid };
  }
  if (ids.length === 1) return { action: 'login', userId: ids[0] };
  return { action: 'create', email: placeholderEmail(lineUserId) }; // never the LINE email
}

// app_metadata to write: keep what is there, set line_id (service role only).
export const withLineId = (appMetadata: Record<string, unknown> | undefined, lineUserId: string) => ({ ...(appMetadata || {}), line_id: lineUserId });

// Errors shown to the user: fixed codes only, never upstream bodies (L1).
export const USER_ERROR_CODES = ['LINE_PROFILE_INVALID', 'LINE_ACCOUNT_CONFLICT', 'LINE_LINKED_TO_OTHER', 'LINE_LINK_UNAUTHORIZED',
  'LINE_ACCOUNT_MIGRATION_PENDING', 'LINE_TOKEN_FAILED', 'LINE_SESSION_FAILED', 'state_mismatch', 'missing_code', 'auth_failed'] as const;
