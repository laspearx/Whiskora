import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // 🌟 จุดสำคัญ: ต้องใส่ await หน้า cookies() สำหรับ Next.js เวอร์ชั่นใหม่ 🌟
    const cookieStore = await cookies() 
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // แลกเปลี่ยน Code เป็น Session เพื่อล็อกอิน
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ล็อกอินสำเร็จ พากลับหน้าแรก
      return NextResponse.redirect(`${origin}`)
    }
  }

  // ถ้ามีปัญหา ให้เด้งกลับไปหน้า Login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}