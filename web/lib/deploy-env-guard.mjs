// ตรวจ env ตอน build (เรียกจาก next.config.ts) — Preview ต้องชี้ Supabase staging เท่านั้น
// และต้องไม่มี secret ของบริการจริง (LINE / Resend / service role / push)
// ข้อความ error แสดงแค่ชื่อตัวแปร ไม่แสดงค่า
import { createHash } from 'node:crypto'

const PRODUCTION_SUPABASE_REF = 'vhudldcizmbpujedojei'
const PREVIEW_SUPABASE_REFS = ['wpxcukrwmegwzfccbbga'] // staging
// sha256 ของ publishable / legacy anon key ของ production (เทียบโดยไม่เก็บค่าจริงในโค้ด)
const PRODUCTION_KEY_SHA256 = [
  '42427c7c65459928ba5940936e335de756884a7ebc10497db4415acca6edee82',
  'e011c00b6bf366a363a0d37eeb7662dde0b9e823fdcdc319ad1b46c637628248',
]
const PRODUCTION_HOSTS = ['whiskora.pet', 'www.whiskora.pet', 'whiskora.vercel.app']
// ห้ามมีบน Preview: บริการเหล่านี้ยังไม่มีค่าทดสอบ จึงปิดไว้ (โค้ดฝั่ง runtime ก็ปิดซ้ำอีกชั้น)
// NEXT_PUBLIC_VAPID_PUBLIC_KEY ไม่อยู่ในรายการ: เป็น public key และ Vercel ไม่ให้แยก scope ได้ — ปิดใน lib/push-client.ts แทน
const PREVIEW_FORBIDDEN = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'LINE_CHANNEL_ID',
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'VAPID_PRIVATE_KEY',
]

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

function jwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) } catch { return null }
}

function supabaseRef(url) {
  try {
    const u = new URL(url)
    const m = u.hostname.match(/^([a-z0-9]+)\.supabase\.co$/)
    return u.protocol === 'https:' && m ? m[1] : null
  } catch { return null }
}

/** คืนรายการปัญหา (ข้อความไม่มีค่า secret) — ว่าง = ผ่าน */
export function checkDeployEnv(env = process.env) {
  const problems = []
  const target = env.VERCEL_ENV || 'local'
  const url = env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // ทุก environment: key ที่ฝังลง client ต้องไม่ใช่ secret / service role
  if (key.startsWith('sb_secret_') || jwtPayload(key)?.role === 'service_role') {
    problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is a secret/service-role key (would be shipped to browsers)')
  }

  if (target === 'preview') {
    if (!url) problems.push('NEXT_PUBLIC_SUPABASE_URL is missing')
    if (!key) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
    const ref = url ? supabaseRef(url) : null
    if (url && ref === PRODUCTION_SUPABASE_REF) problems.push('NEXT_PUBLIC_SUPABASE_URL points to the PRODUCTION Supabase project')
    else if (url && !PREVIEW_SUPABASE_REFS.includes(ref)) problems.push('NEXT_PUBLIC_SUPABASE_URL is not the staging Supabase project')
    if (key && PRODUCTION_KEY_SHA256.includes(sha256(key))) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is a PRODUCTION key')
    const keyRef = key ? jwtPayload(key)?.ref : undefined
    if (keyRef && !PREVIEW_SUPABASE_REFS.includes(keyRef)) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY belongs to a non-staging project')
    const site = env.NEXT_PUBLIC_SITE_URL
    if (site) {
      let host = ''
      try { host = new URL(site).hostname } catch { problems.push('NEXT_PUBLIC_SITE_URL is not a valid URL') }
      if (PRODUCTION_HOSTS.includes(host)) problems.push('NEXT_PUBLIC_SITE_URL points to production — leave it unset on Preview')
    }
    for (const name of PREVIEW_FORBIDDEN) {
      if (env[name]) problems.push(`${name} must not be set for Preview (service disabled on Preview)`)
    }
  }
  return problems
}

export function assertDeployEnv(env = process.env) {
  const problems = checkDeployEnv(env)
  if (problems.length) {
    throw new Error(
      `[deploy-env-guard] ${env.VERCEL_ENV || 'local'} build blocked:\n  - ${problems.join('\n  - ')}\n` +
      'Fix the Vercel environment variables for this scope (see docs/PREVIEW_STAGING_PLAN.md).',
    )
  }
  console.log(`[deploy-env-guard] ${env.VERCEL_ENV || 'local'}: ok`)
}
