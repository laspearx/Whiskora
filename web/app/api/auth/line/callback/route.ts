import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code      = searchParams.get('code')
  const stateBack = searchParams.get('state')
  const lineErr   = searchParams.get('error')

  // ── resolve origin from cookie (saved when user clicked the LINE button) ──
  const cookieStore = await cookies()
  const siteUrl = cookieStore.get('line_origin')?.value || 'https://whiskora.vercel.app'

  const fail = (msg: string) =>
    NextResponse.redirect(`${siteUrl}/th/login?auth_error=${encodeURIComponent(msg)}`)

  if (lineErr) return fail(lineErr)
  if (!code)   return fail('missing_code')

  // ── verify state ──────────────────────────────────────────────────────────
  const savedState  = cookieStore.get('line_state')?.value
  const nextPath    = cookieStore.get('line_next')?.value || '/profile'
  cookieStore.delete('line_state')
  cookieStore.delete('line_next')
  cookieStore.delete('line_origin')

  if (!savedState || savedState !== stateBack) return fail('state_mismatch')

  const safeNext = nextPath.startsWith('/') ? nextPath : '/profile'
  const finalDest = safeNext.startsWith('/th/') || safeNext.startsWith('/en/')
    ? safeNext : `/th${safeNext}`

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
    if (!tokenRes.ok) throw new Error(`LINE token error: ${await tokenRes.text()}`)
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token from LINE')

    // ── 2. get LINE profile ──────────────────────────────────────────────────
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const lineProfile = await profileRes.json()
    // { userId, displayName, pictureUrl }

    // ── 3. extract email from id_token (OIDC) ────────────────────────────────
    let email: string | null = null
    if (tokenData.id_token) {
      try {
        const b64 = tokenData.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
        email = payload.email || null
      } catch {}
    }
    const userEmail = email ?? `line_${lineProfile.userId}@line.whiskora.internal`

    // ── 4. find or create Supabase user ─────────────────────────────────────
    const admin = makeAdmin()
    const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })

    let target = users.find(
      u => u.user_metadata?.line_id === lineProfile.userId || u.email === userEmail,
    )

    if (!target) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          full_name:  lineProfile.displayName,
          avatar_url: lineProfile.pictureUrl,
          line_id:    lineProfile.userId,
          provider:   'line',
        },
      })
      if (createErr) throw createErr
      target = created.user

      await admin.from('profiles').upsert({
        id:         target.id,
        full_name:  lineProfile.displayName,
        avatar_url: lineProfile.pictureUrl,
        updated_at: new Date(),
      })
    } else {
      // update line_id if missing
      if (!target.user_metadata?.line_id) {
        await admin.auth.admin.updateUserById(target.id, {
          user_metadata: { ...target.user_metadata, line_id: lineProfile.userId },
        })
      }
    }

    // ── 5. generate one-time magic link → redirect user through it ───────────
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type:  'magiclink',
      email: target.email!,
      options: { redirectTo: `${siteUrl}${finalDest}` },
    })
    if (linkErr) throw linkErr

    return NextResponse.redirect(linkData.properties.action_link)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'auth_failed'
    console.error('[LINE Auth]', msg)
    return fail(msg)
  }
}
