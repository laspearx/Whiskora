-- DECISION REQUIRED before use — never run automatically, never as part of a rollout script.
-- Purpose: only if the app must be rolled back to a version whose register pages insert directly (≤ v1.12.x) while
-- 20261101170000 is applied. Grants the minimum the old pages use; everything else stays closed.
--
-- What it opens (authenticated only — anon stays closed):
--   farms / shops / services: INSERT of the columns the old register pages send, nothing else. Not grantable here:
--     id, created_at, updated_at, is_verified, verified_at, verification_status, verification_note, is_published,
--     facebook_link, line_id. RLS "Users can manage own …" still forces user_id = auth.uid().
--   workspaces: INSERT (type, name, owner_id, entity_id, avatar_url). workspaces_guard still refuses personal
--     workspaces, foreign owners and entities the caller does not own; unique (type, entity_id) still holds.
-- Impact while open: old pages again write in 3 steps — a failure between steps can leave a business without a
--   workspace / owner row (dashboards still let the entity owner in), and a double submit can create two businesses.
--   create_business keeps working for the new app. Close again with
--   supabase/migrations/20261101170000_business_insert_via_rpc_only.sql as soon as the rollback ends.
grant insert (user_id, farm_name, owner_name, species, phone, bio, address, house_no, room_no, moo, soi, road,
              sub_district, district, province, postal_code, lat, lng, image_url, cover_url) on public.farms to authenticated;
grant insert (user_id, shop_name, owner_name, phone, bio, address, house_no, room_no, moo, soi, road, sub_district,
              district, province, postal_code, lat, lng, image_url, cover_url, supported_species) on public.shops to authenticated;
grant insert (user_id, service_name, owner_name, phone, category, bio, address, house_no, room_no, moo, soi, road,
              sub_district, district, province, postal_code, lat, lng, image_url, cover_url, supported_species)
  on public.services to authenticated;
grant insert (type, name, owner_id, entity_id, avatar_url) on public.workspaces to authenticated;
