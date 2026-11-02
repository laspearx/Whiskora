import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { isPreviewDeploy } from '@/lib/deploy-env'
import { LOCALE_COOKIE, resolveLocale, safeInternalPath, withLocale } from '@/lib/locale'
import { decideLine, withLineId } from '@/lib/lineAuth'

class LineAuthError extends Error {
  constructor(public code: string, public detail: string) { super(code) }
}

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(request: Request) {
  const { searchParams, origin: reqOrigin } = new URL(request.url)
  if (isPreviewDeploy) {
    return NextResponse.redirect(`${reqOrigin}/th/login?auth_error=${encodeURIComponent('LINE_DISABLED_ON_PREVIEW')}`)
  }
  const code      = searchParams.get('code')
  const stateBack = searchParams.get('state')
  const lineErr   = searchParams.get('error')

  // ── resolve origin from cookie (saved when user clicked the LINE button) ──
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  const PRODUCTION_URL = 'https://www.whiskora.pet'
  const rawOrigin = (cookieStore.get('line_origin')?.value || '').replace(/\/$/, '')
  // allow-list เฉพาะโดเมนของเรา — whiskora.vercel.app เป็นเว็บของคนอื่น และ Preview ปิด LINE ไว้แล้ว
  const TRUSTED_ORIGINS = [PRODUCTION_URL, 'https://whiskora.pet']
  const siteUrl = TRUSTED_ORIGINS.includes(rawOrigin) ? rawOrigin : PRODUCTION_URL

  const fail = (msg: string) =>
    NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=${encodeURIComponent(msg)}`)

  if (lineErr) return fail(lineErr)
  if (!code)   return fail('missing_code')

  // ── verify state ──────────────────────────────────────────────────────────
  const savedState  = cookieStore.get('line_state')?.value
  const nextPath    = cookieStore.get('line_next')?.value || '/profile'
  const mode        = cookieStore.get('line_mode')?.value || 'login'
  const linkUid     = cookieStore.get('line_uid')?.value  || ''
  cookieStore.delete('line_state')
  cookieStore.delete('line_next')
  cookieStore.delete('line_origin')
  cookieStore.delete('line_mode')
  cookieStore.delete('line_uid')

  if (!savedState || savedState !== stateBack) return fail('state_mismatch')

  const finalDest = withLocale(safeInternalPath(nextPath), locale)

  try {
    // ── 1. exchange code for LINE tokens ─────────────────────────────────────
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${siteUrl}/api/auth/line/callback`,
        client_id:     process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    })
    if (!tokenRes.ok) throw new LineAuthError('LINE_TOKEN_FAILED', `token ${tokenRes.status}`)
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new LineAuthError('LINE_TOKEN_FAILED', 'no access token')

    // ── 2. get LINE profile ──────────────────────────────────────────────────
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const lineProfile = await profileRes.json()
    // { userId, displayName, pictureUrl }

    if (!profileRes.ok) throw new LineAuthError('LINE_TOKEN_FAILED', `profile ${profileRes.status}`)

    // ── 3. find the account by app_metadata.line_id ONLY (server-writable; any number of users) ──────────────
    // Not by email (LINE does not state its email claim is verified) and not by user_metadata (user-writable).
    const admin = makeAdmin()
    const { data: idRows, error: lookupErr } = await admin.rpc('find_auth_user_by_line_id', { p_line_id: lineProfile.userId })
    if (lookupErr) throw new LineAuthError('auth_failed', `lookup ${lookupErr.code ?? ''}`)
    const ids = ((idRows ?? []) as unknown[]).map(String)
    const decision = decideLine({ lineUserId: lineProfile.userId, mode, linkUid, ids })

    // ── 4a. LINK MODE — the signed-in user (verified by POST /api/auth/line) adds LINE ─────────────────────────
    if (mode === 'link') {
      const linkFail = (code: string) => NextResponse.redirect(`${siteUrl}/${locale}/profile/connections?link_error=${encodeURIComponent(code)}`)
      if (decision.action === 'already_linked') return NextResponse.redirect(`${siteUrl}/${locale}/profile/connections?linked=line`)
      if (decision.action !== 'link') return linkFail(decision.action === 'error' ? decision.code : 'auth_failed')
      const { data: cur, error: curErr } = await admin.auth.admin.getUserById(decision.userId)
      if (curErr || !cur.user) return linkFail('auth_failed')
      const { error: upErr } = await admin.auth.admin.updateUserById(decision.userId, {
        app_metadata:  withLineId(cur.user.app_metadata, lineProfile.userId),
        user_metadata: { ...cur.user.user_metadata, line_display_name: lineProfile.displayName },
      })
      if (upErr) return linkFail('auth_failed')
      return NextResponse.redirect(`${siteUrl}/${locale}/profile/connections?linked=line`)
    }

    // ── 4b. LOGIN MODE ───────────────────────────────────────────────────────────────────────────────────────
    if (decision.action === 'error') return fail(decision.code)
    let targetEmail: string
    if (decision.action === 'login') {
      const { data: found, error: getErr } = await admin.auth.admin.getUserById(decision.userId)
      if (getErr || !found.user?.email) throw new LineAuthError('auth_failed', 'user')
      targetEmail = found.user.email
    } else if (decision.action === 'create') {
      // new LINE user: placeholder email only — never a (possibly unverified) real address
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: decision.email,
        email_confirm: true,
        app_metadata:  { line_id: lineProfile.userId, provider: 'line' },
        user_metadata: { full_name: lineProfile.displayName, avatar_url: lineProfile.pictureUrl, line_display_name: lineProfile.displayName },
      })
      // the placeholder already exists = a legacy LINE account not yet backfilled → never create a second one
      if (createErr) throw new LineAuthError(/already|exists|registered/i.test(createErr.message) ? 'LINE_ACCOUNT_MIGRATION_PENDING' : 'auth_failed', 'create')
      await admin.from('profiles').upsert({
        id:         created.user.id,
        full_name:  lineProfile.displayName,
        avatar_url: lineProfile.pictureUrl,
        updated_at: new Date(),
      })
      targetEmail = decision.email
    } else {
      throw new LineAuthError('auth_failed', 'decision')
    }

    // ── 5. generate OTP, verify server-side, redirect with session tokens ───────
    // Avoids the Supabase browser-redirect chain which can land on a stale
    // Vercel deployment URL (DEPLOYMENT_NOT_FOUND).
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type:  'magiclink',
      email: targetEmail,
    })
    if (linkErr) throw new LineAuthError('LINE_SESSION_FAILED', 'link')

    // Verify the OTP directly via Supabase REST API (server-to-server, returns JSON)
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          email: targetEmail,
          token: linkData.properties.email_otp,
          type:  'magiclink',
        }),
      },
    )
    if (!verifyRes.ok) throw new LineAuthError('LINE_SESSION_FAILED', `verify ${verifyRes.status}`)
    const sess = await verifyRes.json() as {
      access_token: string; token_type: string; expires_in: number; refresh_token: string
    }
    if (!sess.access_token) throw new LineAuthError('LINE_SESSION_FAILED', 'no session')

    // Redirect browser to final page; supabase-js (detectSessionInUrl: true)
    // will detect the hash fragment and store the session in localStorage.
    const hash = new URLSearchParams([
      ['access_token',  sess.access_token],
      ['token_type',    sess.token_type  ?? 'bearer'],
      ['expires_in',    String(sess.expires_in ?? 3600)],
      ['refresh_token', sess.refresh_token],
      ['type',          'magiclink'],
    ])
    return NextResponse.redirect(`${siteUrl}${finalDest}#${hash.toString()}`)

  } catch (err: unknown) {
    // fixed code to the user; a short internal reason to the log — never upstream bodies, tokens or emails (L1)
    const code = err instanceof LineAuthError ? err.code : 'auth_failed'
    console.error('[LINE Auth]', code, err instanceof LineAuthError ? err.detail : (err instanceof Error ? err.name : 'error'))
    return fail(code)
  }
}
