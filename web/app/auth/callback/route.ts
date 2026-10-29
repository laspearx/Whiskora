import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { LOCALE_COOKIE, resolveLocale, safeInternalPath, withLocale } from '@/lib/locale'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '')
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const oauthErrorDesc = searchParams.get('error_description')

  // กลับไปภาษาที่ผู้ใช้เลือกไว้ล่าสุด (cookie จาก middleware) แทนการบังคับ /th
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const next = withLocale(safeInternalPath(searchParams.get('next')), locale)

  // LINE (or any OAuth provider) returned an error — redirect to login with message
  if (oauthError) {
    const msg = oauthErrorDesc || oauthError
    return NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=${encodeURIComponent(msg)}`)
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
      return NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=${encodeURIComponent(error.message)}`)
    }
    return NextResponse.redirect(`${siteUrl}${next}`)
  }

  return NextResponse.redirect(`${siteUrl}/${locale}/login?auth_error=missing_code`)
}