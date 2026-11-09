// Server-only helpers for the LINE routes (service role). Never import from client components.
import crypto from 'crypto'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export function makeAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// Every identity change goes through these SQL functions (migration 20261110090000_line_identity_map).
// Any transport / SQL error throws: callers fail closed and never report success for a write that did not happen.
export class LineRpcError extends Error {
  constructor(public fn: string) { super(`rpc ${fn} failed`) }
}
export async function rpc<T>(admin: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await admin.rpc(fn, args)
  if (error) throw new LineRpcError(fn)
  return data as T
}
export const firstRow = <T>(rows: T[] | null | undefined): T | null => (Array.isArray(rows) && rows.length ? rows[0] : null)

// The signed-in user behind a request's Bearer token. Asks Auth (GET /auth/v1/user), which rejects revoked sessions.
// Uses the public anon key, not the service role: validating a user's own token needs no privilege, and with a new
// secret key (sb_secret_…) the gateway would treat the call as service-role and ignore the user's token.
export async function userFromBearer(request: Request): Promise<User | null> {
  const h = request.headers.get('Authorization') || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await anon.auth.getUser(token)
  return error || !data?.user ? null : data.user
}

// Rotating the password through the Auth admin API revokes every session and refresh token of the account
// (GoTrue UpdatePassword with no session → Logout). Access tokens already issued stay valid until they expire.
export async function rotatePassword(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { error } = await admin.auth.admin.updateUserById(userId, { password: crypto.randomBytes(32).toString('base64url') })
  return !error
}

export const sha256hex = (v: string) => crypto.createHash('sha256').update(v).digest('hex')
export const newNonce = () => crypto.randomBytes(32).toString('hex')

export const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge, path: '/' })
