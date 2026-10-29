import { supabase } from './supabase';

// RPCs from supabase/migrations/20261030_private_columns.sql. Until that migration is applied
// the functions do not exist (PostgREST PGRST202) and we fall back to the old direct query,
// so the app works in both states. Remove the fallbacks once production has the migration.
const missing = (error: { code?: string } | null) => error?.code === 'PGRST202';

// Callers read different subsets of the row into their own local types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MyProfile = any;

/** Your own full profile row (incl. email, phone, address, notification settings). */
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase.rpc('get_my_profile');
  if (!error) return (Array.isArray(data) ? data[0] : data) ?? null;
  if (!missing(error)) throw error;
  const { data: row } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return row as MyProfile | null;
}

export type UserCard = { id: string; full_name: string | null; username: string | null; avatar_url: string | null };

/** Exact email match only — returns the public card, never the email itself. */
export async function findUserByEmail(email: string): Promise<UserCard | null> {
  const e = email.trim().toLowerCase();
  const { data, error } = await supabase.rpc('find_user_by_email', { p_email: e });
  if (!error) return (Array.isArray(data) ? data[0] : data) ?? null;
  if (!missing(error)) throw error;
  const { data: row } = await supabase.from('profiles').select('id, full_name, username, avatar_url').eq('email', e).maybeSingle();
  return row as UserCard | null;
}

/** Invite search: exact email, or partial name/username. No partial email matching (enumeration). */
export async function searchUsersForInvite(q: string): Promise<UserCard[]> {
  const term = q.trim();
  const { data, error } = await supabase.rpc('search_users_for_invite', { p_query: term });
  if (!error) return (data || []) as UserCard[];
  if (!missing(error)) throw error;
  const safe = term.replace(/[,()%*]/g, ' ');
  const { data: rows } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`email.eq.${safe.toLowerCase()},username.ilike.%${safe}%,full_name.ilike.%${safe}%`)
    .limit(5);
  return (rows || []) as UserCard[];
}
