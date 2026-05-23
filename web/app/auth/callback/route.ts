import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // อ่านหน้าปลายทางที่ต้องเด้งกลับ (ส่งมาจาก login/register ผ่าน ?next=)
  const nextParam = searchParams.get('next') || '/profile'
  // กัน open-redirect: รับเฉพาะ path ภายในเว็บเท่านั้น
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/profile'

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

    await supabase.auth.exchangeCodeForSession(code)
    // เด้งกลับหน้าที่ผู้ใช้ตั้งใจจะไป (เช่นหน้า id-card ที่เพิ่งกดดู)
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}