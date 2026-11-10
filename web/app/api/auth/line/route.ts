import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { isLineUatPreview, lineRoutesDisabled } from '@/lib/deploy-env'
import { lineAuthorizeSiteUrl } from '@/lib/lineOrigin'
import { isLineOnly } from '@/lib/lineAuth'
import { cookieOpts, makeAdmin, newNonce, rpc, userFromBearer } from '@/lib/lineServer'

// POST — start linking LINE to the signed-in account (Bearer session required). The uid and a nonce go into short
// httpOnly cookies; the callback stores the LINE id as a PENDING link on this account only, and nothing is linked
// until POST /api/auth/line/confirm re-checks the session (F4: the old flow linked straight from the cookie).
export async function POST(request: Request) {
  if (lineRoutesDisabled) return Response.json({ error: 'line_disabled_on_preview' }, { status: 503 })
  const user = await userFromBearer(request)
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  // body.uid (sent by older clients) must match the session when present
  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  if (body?.uid && body.uid !== user.id) return Response.json({ error: 'forbidden' }, { status: 403 })

  const cookieStore = await cookies()
  cookieStore.set('line_uid', user.id, cookieOpts(600))
  cookieStore.set('line_link_nonce', newNonce(), cookieOpts(600))
  return Response.json({ ok: true })
}

// DELETE — unlink LINE from the signed-in account: line_identity_release (same lock as every other writer, so an
// in-flight confirm cannot bring the link back). Refused when LINE is the only way in (placeholder, no OAuth identity).
export async function DELETE(request: Request) {
  if (lineRoutesDisabled) return Response.json({ error: 'line_disabled_on_preview' }, { status: 503 })
  const user = await userFromBearer(request)
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (isLineOnly(user)) return Response.json({ error: 'line_only_login' }, { status: 409 })
  const admin = makeAdmin()
  try {
    const r = await rpc<string>(admin, 'line_identity_release', { p_user_id: user.id, p_actor: `user:${user.id}` })
    if (r !== 'ok' && r !== 'none') return Response.json({ error: 'unlink_failed' }, { status: 500 })
  } catch {
    return Response.json({ error: 'unlink_failed' }, { status: 500 })
  }
  // rollback-compat copy (never read by the new code); the mapping above is what counts
  const { error } = await admin.auth.admin.updateUserById(user.id, { user_metadata: { line_id: null, line_display_name: null } })
  if (error) console.error('[LINE unlink] rollback copy not cleared')
  return Response.json({ ok: true })
}

// GET — redirect to LINE OAuth (login, or link after POST above)
export async function GET(request: Request) {
  const { searchParams, origin: reqOrigin } = new URL(request.url)
  // Preview ใช้ staging และไม่มี LINE channel สำหรับทดสอบ → ปิด LINE login และอยู่บนโดเมน Preview เดิม
  if (lineRoutesDisabled) {
    return NextResponse.redirect(`${reqOrigin}/th/login?auth_error=${encodeURIComponent('LINE_DISABLED_ON_PREVIEW')}`)
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || reqOrigin

  // If user is on a deployment-specific URL, bounce to the stable branch URL first
  // so that cookies and redirect_uri are on the same domain
  if (reqOrigin !== origin) {
    const stableUrl = new URL(`${origin}/api/auth/line`)
    searchParams.forEach((v, k) => stableUrl.searchParams.set(k, v))
    return NextResponse.redirect(stableUrl.toString())
  }

  const next = searchParams.get('next') || '/profile'
  const mode = searchParams.get('mode') === 'link' ? 'link' : 'login'

  if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
    console.error('[LINE Auth] Missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET env vars')
    return NextResponse.redirect(`${origin}/th/login?auth_error=${encodeURIComponent('LINE_CONFIG_MISSING')}`)
  }

  // redirect_uri ต้องตรงกับที่ลงทะเบียนใน LINE Developers เสมอ (ห้ามใช้ origin ของ request เป็น fallback บน Vercel)
  const siteUrl = lineAuthorizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, isLineUatPreview)

  const state = crypto.randomBytes(16).toString('hex')
  const cookieStore = await cookies()

  // link mode: uid + nonce come only from the session-verified POST, never from the URL
  if (mode === 'link') {
    const uid = cookieStore.get('line_uid')?.value || ''
    const nonce = cookieStore.get('line_link_nonce')?.value || ''
    if (!uid || !nonce) {
      return NextResponse.redirect(`${origin}/th/profile/connections?link_error=LINE_LINK_UNAUTHORIZED`)
    }
  } else {
    cookieStore.delete('line_uid')
    cookieStore.delete('line_link_nonce')
  }

  const opts = cookieOpts(600)
  cookieStore.set('line_state',  state,   opts)
  cookieStore.set('line_next',   next,    opts)
  cookieStore.set('line_origin', siteUrl, opts)
  cookieStore.set('line_mode',   mode,    opts)
  // explicit "create a new LINE account" after LINE_RELINK_SUGGESTED (login mode only)
  cookieStore.set('line_create', mode === 'login' && searchParams.get('create') === '1' ? '1' : '', opts)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINE_CHANNEL_ID!,
    redirect_uri:  `${siteUrl}/api/auth/line/callback`,
    state,
    // no email scope: an email from LINE never picks or creates an account (F4)
    scope: 'profile openid',
  })

  return NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`)
}
