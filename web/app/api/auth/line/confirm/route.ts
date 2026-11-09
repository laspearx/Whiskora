import { cookies } from 'next/headers'
import { isPreviewDeploy } from '@/lib/deploy-env'
import { checkPending, decideLink, lookupLine, postWriteCheck, withLineId } from '@/lib/lineAuth'
import { listAllUsers, makeAdmin, sha256hex, userFromBearer } from '@/lib/lineServer'

// POST — confirm a pending LINE link. Requires, at this moment: a valid session (Bearer, checked by Auth), the pending
// link stored on THAT account by the callback, the matching one-time nonce cookie from the same browser, and no expiry.
// The pending link is consumed on any outcome (no replay).
export async function POST(request: Request) {
  if (isPreviewDeploy) return Response.json({ error: 'line_disabled_on_preview' }, { status: 503 })
  const admin = makeAdmin()
  const user = await userFromBearer(admin, request)
  if (!user) return Response.json({ error: 'LINE_LINK_UNAUTHORIZED' }, { status: 401 })

  const cookieStore = await cookies()
  const nonce = cookieStore.get('line_confirm')?.value || ''
  cookieStore.delete('line_confirm')

  const app = (user.app_metadata || {}) as Record<string, unknown>
  const check = checkPending(app.line_link_pending, nonce ? sha256hex(nonce) : null, Date.now())
  // consume first: a second request with the same nonce finds nothing
  const consumed = { ...app, line_link_pending: null }
  if (!check.ok) {
    if (app.line_link_pending) await admin.auth.admin.updateUserById(user.id, { app_metadata: consumed })
    return Response.json({ error: check.code }, { status: check.code === 'LINK_PENDING_MISSING' ? 404 : 409 })
  }
  const lineUserId = check.pending.line_id

  const decision = decideLink(lineUserId, user.id, lookupLine(await listAllUsers(admin), lineUserId))
  if (decision.action === 'error') {
    await admin.auth.admin.updateUserById(user.id, { app_metadata: consumed })
    return Response.json({ error: decision.code }, { status: 409 })
  }
  if (decision.action === 'already_linked') {
    await admin.auth.admin.updateUserById(user.id, { app_metadata: consumed })
    return Response.json({ ok: true, already: true })
  }

  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: withLineId(app, lineUserId),
    // compatibility copy for an app rollback only — never read by the new code
    user_metadata: { ...(user.user_metadata || {}), line_id: lineUserId, line_display_name: check.pending.display_name },
  })
  if (upErr) return Response.json({ error: 'auth_failed' }, { status: 500 })

  // no DB constraint in F4: re-read; if another account got the same id at the same time, undo ours (fail safe)
  if (postWriteCheck(lineUserId, await listAllUsers(admin), user.id) === 'conflict') {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...app, line_id: null, line_link_pending: null },
      user_metadata: { ...(user.user_metadata || {}), line_id: null, line_display_name: null },
    })
    return Response.json({ error: 'LINE_ACCOUNT_CONFLICT' }, { status: 409 })
  }
  return Response.json({ ok: true })
}

// DELETE — the user declines the pending link.
export async function DELETE(request: Request) {
  if (isPreviewDeploy) return Response.json({ error: 'line_disabled_on_preview' }, { status: 503 })
  const admin = makeAdmin()
  const user = await userFromBearer(admin, request)
  if (!user) return Response.json({ error: 'LINE_LINK_UNAUTHORIZED' }, { status: 401 })
  ;(await cookies()).delete('line_confirm')
  await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...(user.app_metadata || {}), line_link_pending: null } })
  return Response.json({ ok: true })
}
