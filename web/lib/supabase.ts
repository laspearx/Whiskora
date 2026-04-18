import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  const missing = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ')
  console.error(`[Whiskora] Missing environment variables: ${missing}`)
  throw new Error(`[Whiskora] Missing environment variables: ${missing}. Set them in Vercel → Settings → Environment Variables.`)
}

export const supabase = createClient(supabaseUrl, supabaseKey)
