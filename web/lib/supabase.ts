import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  const missing = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ')
  throw new Error(`[Whiskora] Missing environment variables: ${missing}`)
}

// createBrowserClient (จาก @supabase/ssr) เก็บ session ทั้งใน localStorage และ cookies
// ทำให้ middleware อ่าน session จาก cookies ได้ถูกต้อง
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
