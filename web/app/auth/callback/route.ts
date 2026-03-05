import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // 1. ถ้าไม่มี code ส่งมา (เช่น มาเป็น # แทน) ให้ดีดกลับหน้า login ทันที
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code_detected`)
  }

  try {
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
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth Error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)

  } catch (err) {
    console.error('Runtime Error:', err)
    return NextResponse.redirect(`${origin}/login?error=callback_crash`)
  }
}