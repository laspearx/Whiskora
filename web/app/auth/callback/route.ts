import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '')
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const oauthErrorDesc = searchParams.get('error_description')

  const nextParam = searchParams.get('next') || '/profile'
  const rawNext = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/profile'
  const next = rawNext.startsWith('/th/') || rawNext.startsWith('/en/') ? rawNext : `/th${rawNext}`

  // LINE (or any OAuth provider) returned an error — redirect to login with message
  if (oauthError) {
    const msg = oauthErrorDesc || oauthError
    return NextResponse.redirect(`${siteUrl}/th/login?auth_error=${encodeURIComponent(msg)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${siteUrl}/th/login?auth_error=${encodeURIComponent(error.message)}`)
    }
    return NextResponse.redirect(`${siteUrl}${next}`)
  }

  return NextResponse.redirect(`${siteUrl}/th/login?auth_error=missing_code`)
}