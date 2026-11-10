import { lineRoutesDisabled } from '@/lib/deploy-env'
import { firstRow, makeAdmin, rpc, userFromBearer } from '@/lib/lineServer'

// GET — LINE link state of the signed-in account, from the database (the only source of truth since F4).
export async function GET(request: Request) {
  if (lineRoutesDisabled) return Response.json({ linked: false, pending: null, legacy: false, disabled: true })
  const user = await userFromBearer(request)
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const s = firstRow(await rpc<{ line_id: string | null; pending_display_name: string | null; pending_expires_at: string | null; legacy: boolean }[]>(
      makeAdmin(), 'line_link_status', { p_user_id: user.id }))
    return Response.json({
      linked: !!s?.line_id,
      pending: s?.pending_expires_at ? { display_name: s.pending_display_name ?? '' } : null,
      legacy: !!s?.legacy,
    })
  } catch {
    return Response.json({ error: 'status_failed' }, { status: 500 })
  }
}
