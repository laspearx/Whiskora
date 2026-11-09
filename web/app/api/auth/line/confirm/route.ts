import { cookies } from 'next/headers'
import { isPreviewDeploy } from '@/lib/deploy-env'
import { claimErrorCode, takeErrorCode } from '@/lib/lineAuth'
import { firstRow, LineRpcError, makeAdmin, rotatePassword, rpc, sha256hex, userFromBearer } from '@/lib/lineServer'

const json = (body: object, status = 200) => Response.json(body, { status })

// POST — confirm a pending LINE link. Needs, at this moment: a valid session (Bearer, checked by Auth) and the one-time
// nonce cookie of the browser that started the link. ONE database call (line_link_confirm) consumes the pending row and
// maps it — or, for a LINE-only legacy account, opens the credential-reset op — in a single transaction under the same
// locks as unlink: a concurrent replay finds nothing (Codex H2 #2) and an unlink that returned ok stays final (re-review #2).
//   LINE-only legacy → credentials reset first (Codex H1): the op froze the account's credentials; the password is
//   rotated to a random secret (all sessions revoked); SQL verifies that the one change it let through is this secret,
//   then commits. In-flight Auth requests admitted before the rotation cannot change credentials (re-review #3).
export async function POST(request: Request) {
  if (isPreviewDeploy) return json({ error: 'line_disabled_on_preview' }, 503)
  const user = await userFromBearer(request)
  if (!user) return json({ error: 'LINE_LINK_UNAUTHORIZED' }, 401)
  const cookieStore = await cookies()
  const nonce = cookieStore.get('line_confirm')?.value || ''
  cookieStore.delete('line_confirm')
  const admin = makeAdmin()
  try {
    const c = firstRow(await rpc<{ result: string; line_id: string | null; display_name: string | null; ref: string | null; token: string | null }[]>(
      admin, 'line_link_confirm', { p_user_id: user.id, p_nonce_hash: nonce ? sha256hex(nonce) : null, p_actor: `user:${user.id}` }))
    const result = c?.result ?? 'missing'
    if (['missing', 'mismatch', 'expired'].includes(result)) return json({ error: takeErrorCode(result) }, result === 'missing' ? 404 : 409)

    if (result === 'ok' || result === 'already') {
      // rollback-compat copy (never read by this code); a failure here does not change the mapping
      const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, { user_metadata: { line_id: c!.line_id, line_display_name: c!.display_name ?? '' } })
      if (metaErr) console.error('[LINE confirm] rollback copy not written')
      return json({ ok: true, already: result === 'already' })
    }
    if (result !== 'legacy' || !c?.ref || !c.token) return json({ error: claimErrorCode(result) }, 409)

    // LINE-only legacy account: reset credentials before the mapping exists
    const op = { p_ref: c.ref, p_token: c.token, p_actor: `self:${user.id}` }
    const secret = await rotatePassword(admin, user.id)
    if (!secret) {
      const aborted = await rpc<string>(admin, 'line_op_abort', { ...op, p_reason: 'password rotation failed or refused' })
      console.error('[LINE confirm] credential reset failed; op', c.ref, 'abort', aborted)
      return json({ error: 'LINE_CREDENTIAL_RESET_FAILED' }, 503)
    }
    const reset = await rpc<string>(admin, 'line_op_mark_reset', { ...op, p_secret: secret })
    if (reset !== 'ok') {
      // not the app's own rotation, or sessions survived: back out (no mapping; the freeze stays for its grace period)
      const aborted = await rpc<string>(admin, 'line_op_abort', { ...op, p_reason: `reset not verified: ${reset}` })
      console.error('[LINE confirm] reset not verified', c.ref, reset, 'abort', aborted)
      return json({ error: 'LINE_CREDENTIAL_RESET_FAILED', relogin: true }, 409)
    }
    const commit = await rpc<string>(admin, 'line_op_commit', op)
    if (commit !== 'ok' && commit !== 'already') {
      console.error('[LINE confirm] commit failed (durable state: failed)', c.ref, commit)
      return json({ error: claimErrorCode(commit), relogin: true }, 409)
    }
    return json({ ok: true, relogin: true })
  } catch (e) {
    console.error('[LINE confirm]', e instanceof LineRpcError ? e.message : 'error')
    return json({ error: 'auth_failed' }, 500)
  }
}

// DELETE — the user declines the pending link (result checked, Codex L1).
export async function DELETE(request: Request) {
  if (isPreviewDeploy) return json({ error: 'line_disabled_on_preview' }, 503)
  const user = await userFromBearer(request)
  if (!user) return json({ error: 'LINE_LINK_UNAUTHORIZED' }, 401)
  ;(await cookies()).delete('line_confirm')
  try {
    const r = await rpc<string>(makeAdmin(), 'line_link_pending_clear', { p_user_id: user.id })
    return r === 'ok' ? json({ ok: true }) : json({ error: 'auth_failed' }, 500)
  } catch {
    return json({ error: 'auth_failed' }, 500)
  }
}
