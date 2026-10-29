// ─── Column allow-lists for direct table reads ────────────────────────────────
// Supabase RLS is row-level only. The privacy migration
// (supabase/migrations/20261029100000_private_columns.sql) revokes SELECT on private columns,
// after which `select('*')` on these tables fails — so always read with these lists.

// pets: everything except private health fields. Health comes from RPC get_pet_health()
// (tier-checked server side): blood_type, allergies, chronic_diseases, health_notes, traits.
// One string literal (not '+' concatenation) so supabase-js can type the selected columns.
export const PET_COLUMNS =
  'id, created_at, name, breed, species, gender, color, pattern, coat, ear, leg, eye_color, birth_date, status, price, image_url, cover_url, gallery_urls, user_id, farm_id, litter_id, sire_id, dam_id, is_public, is_neutered, microchip_number, pet_code, note, vaccine_status, weight, pedigree_number, pedigree_image_url, paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam';

// profiles columns any signed-in user (or visitor) may read about someone else.
// email / phone / address fields / notification settings are private — read your own via getMyProfile().
export const PROFILE_PUBLIC_COLUMNS = 'id, full_name, username, avatar_url, cover_url';
