// Farm columns readable through the API (migration 20261102110000_farm_private_location). The exact location and
// the admin's verification note are private: owner / workspace members / admins read them via get_farm_private().
// Never select('*') on farms — PostgREST would ask for private columns and the whole request fails (42501).
import type { SupabaseClient } from '@supabase/supabase-js';

// one literal (not concatenated) so supabase-js can type the selected row
export const FARM_PUBLIC_COLUMNS = 'id, created_at, user_id, farm_name, species, phone, bio, image_url, facebook_link, line_id, is_verified, verified_at, cover_url, updated_at, verification_status, owner_name, sub_district, district, province' as const;

export type FarmPrivate = {
  address: string | null; house_no: string | null; room_no: string | null; moo: string | null; soi: string | null;
  road: string | null; postal_code: string | null; lat: number | null; lng: number | null; verification_note: string | null;
};

// Private fields of one farm for the people who manage it. Returns null (with the error) when the caller may not see
// them or the call fails — callers must not fall back to showing anything else.
export async function getFarmPrivate(supabase: SupabaseClient, farmId: number | string): Promise<{ data: FarmPrivate | null; error: unknown }> {
  const { data, error } = await supabase.rpc('get_farm_private', { p_farm_id: Number(farmId) });
  const row = Array.isArray(data) ? data[0] : data;
  return { data: (row as FarmPrivate) ?? null, error };
}

// Area shown on public pages instead of the exact address.
export function farmPublicArea(f: { sub_district?: string | null; district?: string | null; province?: string | null } | null | undefined): string | null {
  const parts = [f?.sub_district, f?.district, f?.province].map((x) => (x || '').trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}
