// Server-only helpers for the LINE routes (service role). Never import from client components.
import crypto from 'crypto'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { AuthUserLite } from '@/lib/lineAuth'

export function makeAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const PAGE = 1000
const MAX_PAGES = 50 // 50k users; past that, fail closed instead of deciding on a partial list

// Every auth user (the old code read page 1 only: users past the first 1000 were invisible).
export async function listAllUsers(admin: SupabaseClient): Promise<AuthUserLite[]> {
  const all: AuthUserLite[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE })
    if (error) throw new Error('list_users_failed')
    const users = data?.users ?? []
    for (const u of users) all.push({ id: u.id, email: u.email, app_metadata: u.app_metadata, user_metadata: u.user_metadata, identities: u.identities })
    if (users.length < PAGE) return all
  }
  throw new Error('list_users_too_many')
}

// The signed-in user behind a request's Bearer token. Asks Auth (GET /auth/v1/user), which rejects revoked sessions.
// Uses the public anon key, not the service role: validating a user's own token needs no privilege, and with a new
// secret key (sb_secret_…) the gateway would treat the call as service-role and ignore the user's token.
// The admin parameter is kept for call-site symmetry; it is not used here.
export async function userFromBearer(_admin: SupabaseClient, request: Request): Promise<User | null> {
  const h = request.headers.get('Authorization') || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await anon.auth.getUser(token)
  return error || !data?.user ? null : data.user
}

export const sha256hex = (v: string) => crypto.createHash('sha256').update(v).digest('hex')
export const newNonce = () => crypto.randomBytes(32).toString('hex')

export const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge, path: '/' })
