import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 🌟 เพิ่มการดึง 'next' เผื่อชัชอยากให้มัน Redirect กลับไปหน้าเดิมที่จากมา
  const next = searchParams.get('next') ?? '/'

  if (code) {
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
            // 🌟 ปรับปรุงการเซ็ตค่าให้รองรับ Next.js context
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // 🔐 แลกเปลี่ยน Code เป็น Session (สมัคร/ล็อกอินให้อัตโนมัติที่จุดนี้)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ ล็อกอินสำเร็จ พากลับหน้าแรก หรือหน้าที่ระบุไว้ใน 'next'
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ❌ ถ้ามีปัญหา (เช่น Code หมดอายุ หรือ User ยกเลิก) ให้เด้งกลับหน้า Login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}