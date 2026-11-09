import { cookies } from 'next/headers'
import { isPreviewDeploy } from '@/lib/deploy-env'
import { claimErrorCode, isPlaceholderEmail, takeErrorCode } from '@/lib/lineAuth'
import { firstRow, LineRpcError, makeAdmin, rotatePassword, rpc, sha256hex, userFromBearer } from '@/lib/lineServer'

const json = (body: object, status = 200) => Response.json(body, { status })

// POST — confirm a pending LINE link. Needs, at this moment: a valid session (Bearer, checked by Auth) and the one-time
// nonce cookie of the browser that started the link. The pending row is consumed exactly once in the database
// (line_link_take: DELETE … RETURNING under the account lock) — a concurrent replay finds nothing (Codex H2 #2).
//   ordinary account  → line_identity_claim (UNIQUE LINE id / account, same lock as every other writer)
//   LINE-only legacy  → credentials reset first (Codex H1): op begin → password rotated (all sessions revoked)
//                       → reset verified in SQL → commit. The user signs in again with LINE afterwards.
export async function POST(request: Request) {
  if (isPreviewDeploy) return json({ error: 'line_disabled_on_preview' }, 503)
  const user = await userFromBearer(request)
  if (!user) return json({ error: 'LINE_LINK_UNAUTHORIZED' }, 401)
  const cookieStore = await cookies()
  const nonce = cookieStore.get('line_confirm')?.value || ''
  cookieStore.delete('line_confirm')
  const admin = makeAdmin()
  try {
    const take = firstRow(await rpc<{ result: string; line_id: string | null; display_name: string | null }[]>(admin, 'line_link_take', {
      p_user_id: user.id, p_nonce_hash: nonce ? sha256hex(nonce) : null,
    }))
    if (!take || take.result !== 'ok' || !take.line_id) return json({ error: takeErrorCode(take?.result ?? 'missing') }, take?.result === 'missing' || !take ? 404 : 409)
    const lineId = take.line_id

    if (!isPlaceholderEmail(user.email)) {
      const claim = await rpc<string>(admin, 'line_identity_claim', { p_line_id: lineId, p_user_id: user.id, p_method: 'link_confirm', p_actor: `user:${user.id}` })
      if (claim !== 'ok' && claim !== 'already') return json({ error: claimErrorCode(claim) }, 409)
      // rollback-compat copy (never read by this code); a failure here does not change the mapping
      const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, { user_metadata: { line_id: lineId, line_display_name: take.display_name ?? '' } })
      if (metaErr) console.error('[LINE confirm] rollback copy not written')
      return json({ ok: true, already: claim === 'already' })
    }

    // LINE-only legacy account: reset credentials before the mapping exists
    const begin = firstRow(await rpc<{ result: string; ref: string | null; token: string | null }[]>(admin, 'line_legacy_link_begin', {
      p_user_id: user.id, p_line_id: lineId, p_display: take.display_name ?? '',
    }))
    if (!begin || begin.result !== 'ok' || !begin.ref || !begin.token) return json({ error: claimErrorCode(begin?.result ?? 'auth_failed') }, 409)
    const op = { p_ref: begin.ref, p_token: begin.token, p_actor: `self:${user.id}` }
    if (!(await rotatePassword(admin, user.id))) {
      const aborted = await rpc<string>(admin, 'line_op_abort', { ...op, p_reason: 'password rotation failed' })
      console.error('[LINE confirm] credential reset failed; op', begin.ref, 'abort', aborted)
      return json({ error: 'LINE_CREDENTIAL_RESET_FAILED' }, 503)
    }
    const reset = await rpc<string>(admin, 'line_op_mark_reset', op)
    if (reset !== 'ok') {
      // the op stays 'approving' without a recorded reset: it expires; the user can retry or ask for recovery
      console.error('[LINE confirm] reset not verified', begin.ref, reset)
      return json({ error: 'LINE_CREDENTIAL_RESET_FAILED', relogin: true }, 409)
    }
    const commit = await rpc<string>(admin, 'line_op_commit', op)
    if (commit !== 'ok' && commit !== 'already') {
      console.error('[LINE confirm] commit failed (durable state: failed)', begin.ref, commit)
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
