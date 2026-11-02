import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { isPreviewDeploy } from '@/lib/deploy-env'
import { LINE_PLACEHOLDER_DOMAIN } from '@/lib/lineAuth'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// POST — ใช้สำหรับ link mode เท่านั้น: ตรวจ session แล้วตั้ง cookie ที่ verified
export async function POST(request: Request) {
  if (isPreviewDeploy) return Response.json({ error: 'line_disabled_on_preview' }, { status: 503 })
  const authHeader = request.headers.get('Authorization') || ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!accessToken) return Response.json({ error: 'unauthorized' }, { status: 401 })

  let uid = ''
  try {
    const body = await request.json()
    uid = body?.uid || ''
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }
  if (!uid) return Response.json({ error: 'missing_uid' }, { status: 400 })

  const admin = makeAdmin()
  const { data: { user }, error } = await admin.auth.getUser(accessToken)
  if (error || !user || user.id !== uid) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()
  const opts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' }
  cookieStore.set('line_uid',          uid,    opts)
  cookieStore.set('line_uid_verified', 'true', opts)

  return Response.json({ ok: true })
}

// DELETE — unlink LINE from the signed-in account. The link lives in app_metadata.line_id (server-writable only).
// Refused when LINE is the account's only way to sign in (placeholder email and no other provider) — no lockout.
export async function DELETE(request: Request) {
  if (isPreviewDeploy) return Response.json({ error: 'line_disabled_on_preview' }, { status: 503 })
  const authHeader = request.headers.get('Authorization') || ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!accessToken) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const admin = makeAdmin()
  const { data: { user }, error } = await admin.auth.getUser(accessToken)
  if (error || !user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const placeholder = (user.email || '').endsWith(`@${LINE_PLACEHOLDER_DOMAIN}`)
  const otherProviders = (user.identities || []).filter(i => i.provider !== 'email')
  if (placeholder && otherProviders.length === 0) return Response.json({ error: 'line_only_login' }, { status: 409 })
  const { line_id: _drop, ...rest } = (user.app_metadata || {}) as Record<string, unknown>
  void _drop
  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...rest, line_id: null },
    user_metadata: { ...(user.user_metadata || {}), line_id: null, line_display_name: null }, // rollback-compat copy too
  })
  if (upErr) return Response.json({ error: 'unlink_failed' }, { status: 500 })
  return Response.json({ ok: true })
}

// GET — redirect ไปยัง LINE OAuth
export async function GET(request: Request) {
  const { searchParams, origin: reqOrigin } = new URL(request.url)
  // Preview ใช้ staging และไม่มี LINE channel สำหรับทดสอบ → ปิด LINE login และอยู่บนโดเมน Preview เดิม
  if (isPreviewDeploy) {
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
  const mode = searchParams.get('mode') || 'login'

  // ตรวจสอบ env vars ที่จำเป็น
  if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
    console.error('[LINE Auth] Missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET env vars')
    return NextResponse.redirect(`${origin}/th/login?auth_error=${encodeURIComponent('LINE_CONFIG_MISSING')}`)
  }

  // ใช้ NEXT_PUBLIC_SITE_URL เป็น base URL ของ redirect_uri เสมอ
  // เพื่อให้ตรงกับที่ลงทะเบียนใน LINE Developers ไม่ว่า Vercel จะใช้ URL ไหน
  // ห้ามใช้ `origin` จาก request.url เป็น fallback เพราะบน Vercel มันอาจเป็น
  // internal compute-instance URL (เช่น whiskora-f74p5-...vercel.app) ที่หมดอายุ
  // ก่อนที่ browser จะ follow redirect → DEPLOYMENT_NOT_FOUND
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.whiskora.pet').replace(/\/$/, '')

  const state = crypto.randomBytes(16).toString('hex')
  const cookieStore = await cookies()

  // link mode: uid ต้องมาจาก POST ที่ verified แล้วเท่านั้น ไม่รับจาก URL
  let uid = ''
  if (mode === 'link') {
    const verified = cookieStore.get('line_uid_verified')?.value === 'true'
    uid = cookieStore.get('line_uid')?.value || ''
    cookieStore.delete('line_uid_verified')
    if (!verified || !uid) {
      return NextResponse.redirect(`${origin}/th/profile/connections?link_error=unauthorized`)
    }
  }

  const opts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' }
  cookieStore.set('line_state',  state,   opts)
  cookieStore.set('line_next',   next,    opts)
  cookieStore.set('line_origin', siteUrl, opts)
  cookieStore.set('line_mode',   mode,    opts)
  cookieStore.set('line_uid',    uid,     opts)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.LINE_CHANNEL_ID!,
    redirect_uri:  `${siteUrl}/api/auth/line/callback`,
    state,
    // no email scope: the LINE email is not used to pick or create accounts (docs/SECURITY_PHASE1.md §H2)
    scope: 'profile openid',
  })

  return NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`)
}
