import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { isPreviewDeploy } from '@/lib/deploy-env'
import { LOCALE_COOKIE, resolveLocale, safeInternalPath, withLocale } from '@/lib/locale'
import { decideLogin, isValidLineUserId, lookupLine, makePending, toUserErrorCode } from '@/lib/lineAuth'
import { cookieOpts, listAllUsers, makeAdmin, sha256hex } from '@/lib/lineServer'

class LineAuthError extends Error {
  constructor(public code: string, public detail: string) { super(code) }
}

export async function GET(request: Request) {
  const { searchParams, origin: reqOrigin } = new URL(request.url)
  if (isPreviewDeploy) {
    return NextResponse.redirect(`${reqOrigin}/th/login?auth_error=${encodeURIComponent('LINE_DISABLED_ON_PREVIEW')}`)
  }
  const code      = searchParams.get('code')
  const stateBack = searchParams.get('state')
  const lineErr   = searchParams.get('error')

  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  const PRODUCTION_URL = 'https://www.whiskora.pet'
  const rawOrigin = (cookieStore.get('line_origin')?.value || '').replace(/\/$/, '')
  // allow-list เฉพาะโดเมนของเรา — whiskora.vercel.app เป็นเว็บของคนอื่น และ Preview ปิด LINE ไว้แล้ว
  const TRUSTED_ORIGINS = [PRODUCTION_URL, 'https://whiskora.pet']
  const siteUrl = TRUSTED_ORIGINS.includes(rawOrigin) ? rawOrigin : PRODUCTION_URL

  const savedState      = cookieStore.get('line_state')?.value
  const nextPath        = cookieStore.get('line_next')?.value || '/profile'
  const mode            = cookieStore.get('line_mode')?.value === 'link' ? 'link' : 'login'
  const linkUid         = cookieStore.get('line_uid')?.value || ''
  const linkNonce       = cookieStore.get('line_link_nonce')?.value || ''
  const createConfirmed = cookieStore.get('line_create')?.value === '1'
  for (const c of ['line_state', 'line_next', 'line_origin', 'line_mode', 'line_uid', 'line_link_nonce', 'line_create']) cookieStore.delete(c)

  // fixed codes only (never upstream bodies, tokens or emails)
  const fail = (c: string) => NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=${encodeURIComponent(toUserErrorCode(c))}`)
  const linkFail = (c: string) => NextResponse.redirect(`${siteUrl}/${locale}/profile/connections?link_error=${encodeURIComponent(toUserErrorCode(c))}`)

  if (lineErr) return mode === 'link' ? linkFail(lineErr) : fail(lineErr)
  if (!code)   return fail('missing_code')
  if (!savedState || savedState !== stateBack) return fail('state_mismatch') // OAuth CSRF

  const finalDest = withLocale(safeInternalPath(nextPath), locale)

  try {
    // ── 1. exchange code for LINE tokens (server-to-server, channel secret) ──────────────────────────────────────
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

    // ── 2. LINE profile: the LINE user id comes from LINE, never from the browser. id_token / email are not used. ──
    const profileRes = await fetch('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${tokenData.access_token}` } })
    if (!profileRes.ok) throw new LineAuthError('LINE_TOKEN_FAILED', `profile ${profileRes.status}`)
    const lineProfile = await profileRes.json() as { userId?: unknown; displayName?: string; pictureUrl?: string }
    if (!isValidLineUserId(lineProfile.userId)) throw new LineAuthError('LINE_PROFILE_INVALID', 'profile id')
    const lineUserId = lineProfile.userId
    const displayName = String(lineProfile.displayName ?? '').slice(0, 100)

    const admin = makeAdmin()

    // ── 3a. LINK MODE: store a pending link on the session-verified uid only; confirm re-checks the session ───────
    if (mode === 'link') {
      if (!linkUid || !linkNonce) return linkFail('LINE_LINK_UNAUTHORIZED')
      const { data: cur, error: curErr } = await admin.auth.admin.getUserById(linkUid)
      if (curErr || !cur.user) return linkFail('LINE_LINK_UNAUTHORIZED')
      const pending = makePending(lineUserId, displayName, sha256hex(linkNonce), Date.now())
      const { error: upErr } = await admin.auth.admin.updateUserById(linkUid, {
        app_metadata: { ...(cur.user.app_metadata || {}), line_link_pending: pending },
      })
      if (upErr) return linkFail('auth_failed')
      cookieStore.set('line_confirm', linkNonce, cookieOpts(300))
      return NextResponse.redirect(`${siteUrl}/${locale}/profile/connections?confirm_line=1`)
    }

    // ── 3b. LOGIN MODE: app_metadata.line_id only, across ALL users ──────────────────────────────────────────────
    let decision = decideLogin(lineUserId, lookupLine(await listAllUsers(admin), lineUserId), createConfirmed)
    if (decision.action === 'error') return fail(decision.code)
    if (decision.action === 'relink_suggested') return fail('LINE_RELINK_SUGGESTED')

    if (decision.action === 'review') {
      // legacy LINE account (made before F4): no automatic sign-in. Record a server-side recovery request for an admin.
      const ref = crypto.randomBytes(4).toString('hex')
      const { data: old } = await admin.auth.admin.getUserById(decision.userId)
      if (old?.user) {
        await admin.auth.admin.updateUserById(decision.userId, {
          app_metadata: { ...(old.user.app_metadata || {}), line_recovery_request: { line_id: lineUserId, ref, requested_at: new Date().toISOString() } },
        })
      }
      console.warn('[LINE Auth] legacy account needs review', ref)
      return NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=LINE_ACCOUNT_REVIEW&ref=${ref}`)
    }

    if (decision.action === 'create') {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: decision.email,
        email_confirm: true,
        app_metadata:  { line_id: lineUserId, provider: 'line' },
        // user_metadata.line_id: compatibility copy for an app rollback only — never read by this code
        user_metadata: { full_name: displayName, avatar_url: lineProfile.pictureUrl, line_id: lineUserId, line_display_name: displayName, provider: 'line' },
      })
      if (createErr || !created?.user) {
        // e.g. the same LINE user signing in twice at once: the placeholder email is unique, re-read and decide again
        decision = decideLogin(lineUserId, lookupLine(await listAllUsers(admin), lineUserId), createConfirmed)
        if (decision.action !== 'login') {
          if (decision.action === 'review') return NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=LINE_ACCOUNT_REVIEW`)
          throw new LineAuthError('auth_failed', 'create')
        }
      } else {
        await admin.from('profiles').upsert({ id: created.user.id, full_name: displayName, avatar_url: lineProfile.pictureUrl, updated_at: new Date() })
        decision = { action: 'login', userId: created.user.id }
      }
    }

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(decision.userId)
    if (getErr || !target.user?.email) throw new LineAuthError('auth_failed', 'user')

    // ── 4. session: generate an OTP and verify it server-side (avoids the stale-deployment redirect chain) ─────────
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: target.user.email })
    if (linkErr) throw new LineAuthError('LINE_SESSION_FAILED', 'link')
    const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      body: JSON.stringify({ email: target.user.email, token: linkData.properties.email_otp, type: 'magiclink' }),
    })
    if (!verifyRes.ok) throw new LineAuthError('LINE_SESSION_FAILED', `verify ${verifyRes.status}`)
    const sess = await verifyRes.json() as { access_token: string; token_type: string; expires_in: number; refresh_token: string }
    if (!sess.access_token) throw new LineAuthError('LINE_SESSION_FAILED', 'no session')

    // supabase-js (detectSessionInUrl) stores the session from the fragment
    const hash = new URLSearchParams([
      ['access_token',  sess.access_token],
      ['token_type',    sess.token_type  ?? 'bearer'],
      ['expires_in',    String(sess.expires_in ?? 3600)],
      ['refresh_token', sess.refresh_token],
      ['type',          'magiclink'],
    ])
    return NextResponse.redirect(`${siteUrl}${finalDest}#${hash.toString()}`)

  } catch (err: unknown) {
    const c = err instanceof LineAuthError ? err.code : 'auth_failed'
    console.error('[LINE Auth]', c, err instanceof LineAuthError ? err.detail : (err instanceof Error ? err.message.slice(0, 60) : 'error'))
    return mode === 'link' ? linkFail(c) : fail(c)
  }
}
