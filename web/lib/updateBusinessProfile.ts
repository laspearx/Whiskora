import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessType } from '@/lib/createBusiness';

// Fields each role may change (enforced again by update_business_profile on the server —
// supabase/migrations/20261101190000_business_profile_rpc.sql). Owner / role / approval / publish fields are never sent.
const MANAGER_EXTRA: Record<BusinessType, string[]> = {
  farm: ['species'],
  shop: ['supported_species'],
  service: ['supported_species', 'category'],
};
export const managerProfileFields = (type: BusinessType) => ['bio', 'phone', 'image_url', 'cover_url', ...MANAGER_EXTRA[type]];

export type ProfileRole = 'owner' | 'manager';
export type SavedProfile = Record<string, unknown> & { id: number; role: ProfileRole };

/**
 * Save the given profile fields (partial update) and return the profile as stored on the server.
 * A manager's payload is reduced to the manager fields before sending; anything the server refuses throws,
 * so callers only report success after this resolves.
 */
export async function updateBusinessProfile(
  supabase: SupabaseClient,
  type: BusinessType,
  id: number | string,
  fields: Record<string, unknown>,
  role: ProfileRole = 'owner',
): Promise<SavedProfile> {
  const allowed = role === 'manager' ? new Set(managerProfileFields(type)) : null;
  const payload = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== undefined && (!allowed || allowed.has(k))));
  const { data, error } = await supabase.rpc('update_business_profile', { p_type: type, p_id: Number(id), p_fields: payload });
  if (error) throw error;
  if (!data || typeof data !== 'object' || (data as SavedProfile).id == null) throw new Error('บันทึกไม่สำเร็จ (ไม่ได้รับข้อมูลที่บันทึกกลับมา)');
  return data as SavedProfile;
}

/** Readable message for anything thrown by supabase-js / the RPC. */
export const errorMessage = (e: unknown): string =>
  e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
    ? (e as { message: string }).message : String(e);
