import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isLineUatPreview, lineRoutesDisabled } from '@/lib/deploy-env'
import { lineCallbackSiteUrl } from '@/lib/lineOrigin'
import { LOCALE_COOKIE, resolveLocale, safeInternalPath, withLocale } from '@/lib/locale'
import { decideLogin, isValidLineUserId, PENDING_TTL_SECONDS, placeholderEmail, toUserErrorCode } from '@/lib/lineAuth'
import { cookieOpts, firstRow, makeAdmin, rpc, sha256hex } from '@/lib/lineServer'

class LineAuthError extends Error {
  constructor(public code: string, public detail: string) { super(code) }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function GET(request: Request) {
  const { searchParams, origin: reqOrigin } = new URL(request.url)
  if (lineRoutesDisabled) {
    return NextResponse.redirect(`${reqOrigin}/th/login?auth_error=${encodeURIComponent('LINE_DISABLED_ON_PREVIEW')}`)
  }
  const code      = searchParams.get('code')
  const stateBack = searchParams.get('state')
  const lineErr   = searchParams.get('error')

  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  // allow-list เฉพาะโดเมนของเรา (whiskora.vercel.app เป็นเว็บของคนอื่น). Production: www.whiskora.pet / whiskora.pet.
  // UAT Preview (F4 Phase D): ONLY its own fixed URL — never production (lib/lineOrigin.ts)
  const siteUrl = lineCallbackSiteUrl(cookieStore.get('line_origin')?.value, isLineUatPreview)

  const savedState      = cookieStore.get('line_state')?.value
  const nextPath        = cookieStore.get('line_next')?.value || '/profile'
  const mode            = cookieStore.get('line_mode')?.value === 'link' ? 'link' : 'login'
  const linkUid         = cookieStore.get('line_uid')?.value || ''
  const linkNonce       = cookieStore.get('line_link_nonce')?.value || ''
  const createConfirmed = cookieStore.get('line_create')?.value === '1'
  for (const c of ['line_state', 'line_next', 'line_origin', 'line_mode', 'line_uid', 'line_link_nonce', 'line_create']) cookieStore.delete(c)

  // fixed codes only (never upstream bodies, tokens or emails)
  const fail = (c: string, extra = '') => NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=${encodeURIComponent(toUserErrorCode(c))}${extra}`)
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

    // ── 3a. LINK MODE: only a pending row for the session-verified uid; never touches the mapping (Codex H2 #1) ──
    if (mode === 'link') {
      if (!linkUid || !linkNonce) return linkFail('LINE_LINK_UNAUTHORIZED')
      const put = await rpc<string>(admin, 'line_link_pending_put', {
        p_user_id: linkUid, p_line_id: lineUserId, p_display: displayName, p_nonce_hash: sha256hex(linkNonce), p_ttl_seconds: PENDING_TTL_SECONDS,
      })
      if (put !== 'ok') return linkFail('LINE_LINK_UNAUTHORIZED')
      cookieStore.set('line_confirm', linkNonce, cookieOpts(PENDING_TTL_SECONDS))
      return NextResponse.redirect(`${siteUrl}/${locale}/profile/connections?confirm_line=1`)
    }

    // ── 3b. LOGIN MODE: the database decides (line_login_resolve) ─────────────────────────────────────────────────
    const resolve = async () => firstRow(await rpc<{ kind: string; user_id: string | null }[]>(admin, 'line_login_resolve', { p_line_id: lineUserId }))
    let userId: string | null = null
    for (let attempt = 0; attempt < 6 && !userId; attempt++) {
      const r = await resolve()
      const d = decideLogin(r?.kind ?? 'invalid', r?.user_id ?? null, createConfirmed)
      if (d.action === 'login') { userId = d.userId; break }
      if (d.action === 'error') return fail(d.code)
      if (d.action === 'relink_suggested') return fail('LINE_RELINK_SUGGESTED')
      if (d.action === 'retry') { await sleep(400); continue }
      if (d.action === 'review') {
        // a signed-in legacy link that already reset the credentials is finished by this sign-in (proves LINE again)
        const resumed = await rpc<string>(admin, 'line_legacy_link_resume', { p_line_id: lineUserId })
        if (resumed === 'ok' || resumed === 'already') continue
        // otherwise: no automatic sign-in — record an admin recovery request (reference shown only if recorded)
        const ref = await rpc<string | null>(admin, 'line_recovery_record', { p_line_id: lineUserId, p_display: displayName })
        console.warn('[LINE Auth] legacy account needs review', ref ?? 'request-not-recorded')
        return fail('LINE_ACCOUNT_REVIEW', ref && /^[0-9a-f]{8}$/.test(ref) ? `&ref=${ref}` : '')
      }
      // create: fresh placeholder account, then claim it in the database (UNIQUE LINE id / account)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: placeholderEmail(lineUserId),
        email_confirm: true,
        app_metadata:  { provider: 'line' },
        // user_metadata.line_id: compatibility copy for an app rollback only — never read by this code
        user_metadata: { full_name: displayName, avatar_url: lineProfile.pictureUrl, line_id: lineUserId, line_display_name: displayName, provider: 'line' },
      })
      if (createErr || !created?.user) { await sleep(300); continue } // e.g. a concurrent first sign-in made it: resolve again
      const claim = await rpc<string>(admin, 'line_identity_claim', { p_line_id: lineUserId, p_user_id: created.user.id, p_method: 'login_create', p_actor: 'system:line-callback' })
      if (claim !== 'ok' && claim !== 'already') {
        // never leave an unclaimed placeholder behind (it would look like a legacy account)
        const { error: delErr } = await admin.auth.admin.deleteUser(created.user.id)
        console.error('[LINE Auth] claim after create failed', claim, delErr ? 'cleanup-failed' : 'cleaned-up')
        if (delErr) throw new LineAuthError('auth_failed', 'cleanup')
        continue
      }
      const { error: profErr } = await admin.from('profiles').upsert({ id: created.user.id, full_name: displayName, avatar_url: lineProfile.pictureUrl, updated_at: new Date() })
      if (profErr) console.error('[LINE Auth] profile upsert failed (account is linked; profile can be edited later)')
      userId = created.user.id
    }
    if (!userId) return fail('LINE_TRY_AGAIN')

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId)
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
