import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') || '/profile'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whiskora.vercel.app'

  const state = crypto.randomBytes(16).toString('hex')

  const cookieStore = await cookies()
  cookieStore.set('line_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })
  cookieStore.set('line_next', next,  { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: `${siteUrl}/api/auth/line/callback`,
    state,
    scope: 'profile openid email',
  })

  return NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`)
}
