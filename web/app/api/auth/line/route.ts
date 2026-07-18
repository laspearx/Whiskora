import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// POST — ใช้สำหรับ link mode เท่านั้น: ตรวจ session แล้วตั้ง cookie ที่ verified
export async function POST(request: Request) {
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

// GET — redirect ไปยัง LINE OAuth
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') || '/profile'
  const mode = searchParams.get('mode') || 'login'

  // ตรวจสอบ env vars ที่จำเป็น
  if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
    console.error('[LINE Auth] Missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET env vars')
    return NextResponse.redirect(`${origin}/th/login?auth_error=${encodeURIComponent('LINE_CONFIG_MISSING')}`)
  }

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
  cookieStore.set('line_state',  state,  opts)
  cookieStore.set('line_next',   next,   opts)
  cookieStore.set('line_origin', origin, opts)
  cookieStore.set('line_mode',   mode,   opts)
  cookieStore.set('line_uid',    uid,    opts)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: `${origin}/api/auth/line/callback`,
    state,
    scope: 'profile openid email',
  })

  return NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`)
}
