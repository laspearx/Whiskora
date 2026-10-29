-- ─────────────────────────────────────────────────────────────────────────────
-- Whiskora: stop direct API reads of private profile / pet-health columns
-- STATUS: PROPOSED — NOT APPLIED (no DB/staging access on 2026-10-30).
-- ORDER: apply FIRST and on its own. No dependency on the reservation/transfer migration.
--
-- Problem (confirmed 2026-10-29 with the anon key, counts only):
--   anon can SELECT profiles.email / phone / address* and pets.allergies / blood_type / …
--   because RLS is row-level and Supabase grants table-level SELECT to anon + authenticated.
--
-- Fix: replace table-level SELECT with column-level SELECT on safe columns, and expose
-- private data only through SECURITY DEFINER functions that check auth.uid().
--
-- App readiness: the web app (branch fix/trust-locale-reservations) already reads through
-- lib/columns.ts + lib/profile.ts and falls back when these functions are missing, so the
-- app can be deployed before or after this migration.
--
-- PRE-CHECKS on staging (must all pass before applying):
--   1. get_pet_health / get_pet_pedigree / get_my_pet_access / admin_get_users / admin_get_stats
--      and every trigger function touching profiles/pets are SECURITY DEFINER, otherwise they
--      lose access to the revoked columns:
--        select proname, prosecdef from pg_proc where pronamespace = 'public'::regnamespace
--          and (prosrc ilike '%profiles%' or prosrc ilike '%pets%');
--   2. Column lists below still match the live tables:
--        select table_name, column_name from information_schema.columns
--         where table_schema='public' and table_name in ('profiles','pets') order by 1, ordinal_position;
--   3. No view / edge function running as anon/authenticated selects the revoked columns.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── profiles ────────────────────────────────────────────────────────────────
-- public card: id, full_name, username, avatar_url, cover_url
-- kept readable for existing admin checks (select role where id = me): role
-- private (owner via get_my_profile only): email, phone, address, house_no, room_no, moo, soi,
--   road, sub_district, district, province, postal_code, location, notif_line, notif_email
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, username, avatar_url, cover_url, role, created_at, updated_at)
  on public.profiles to anon, authenticated;

create or replace function public.get_my_profile()
returns setof public.profiles
language sql stable security definer set search_path = public
as $$ select * from public.profiles where id = auth.uid() $$;

-- exact email match only; returns no email. Signed-in callers only.
create or replace function public.find_user_by_email(p_email text)
returns table (id uuid, full_name text, username text, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.username, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p_email is not null
    and lower(p.email) = lower(trim(p_email))
  limit 1
$$;

-- invite search: exact email, or partial name/username (min 2 chars). No partial email search.
create or replace function public.search_users_for_invite(p_query text)
returns table (id uuid, full_name text, username text, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.username, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and length(trim(coalesce(p_query, ''))) >= 2
    and (
      lower(p.email) = lower(trim(p_query))
      or p.username ilike '%' || trim(p_query) || '%'
      or p.full_name ilike '%' || trim(p_query) || '%'
    )
  limit 5
$$;

revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.find_user_by_email(text) from public, anon;
revoke all on function public.search_users_for_invite(text) from public, anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.find_user_by_email(text) to authenticated;
grant execute on function public.search_users_for_invite(text) to authenticated;

-- ── pets ────────────────────────────────────────────────────────────────────
-- private health (via get_pet_health, tier-checked): blood_type, allergies, chronic_diseases,
-- health_notes, traits. Everything else stays readable subject to existing RLS.
revoke select on public.pets from anon, authenticated;
grant select (
  id, created_at, name, breed, species, gender, color, pattern, coat, ear, leg, eye_color, birth_date,
  status, price, image_url, cover_url, gallery_urls, user_id, farm_id, litter_id, sire_id, dam_id,
  is_public, is_neutered, microchip_number, pet_code, note, vaccine_status, weight,
  pedigree_number, pedigree_image_url, paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam
) on public.pets to anon, authenticated;
-- INSERT/UPDATE grants are unchanged (RLS still decides rows). Writes must not use RETURNING *
-- (app uses .select('id')).

commit;

-- ─── Verification on staging (expected results) ──────────────────────────────
-- as anon (REST, anon key):
--   GET /rest/v1/profiles?select=email&limit=1          → 401/42501 permission denied
--   GET /rest/v1/profiles?select=id,full_name&limit=1    → 200
--   GET /rest/v1/pets?select=allergies&limit=1           → 42501
--   GET /rest/v1/pets?select=id,name&limit=1             → 200
--   POST /rest/v1/rpc/find_user_by_email                 → 42501 (anon has no execute)
-- as test user A (JWT):
--   rpc get_my_profile()                                 → exactly A's row incl. email
--   GET profiles?select=email&id=eq.<B>                  → 42501
--   rpc find_user_by_email('<B's exact email>')          → B's id/name, no email field
--   rpc search_users_for_invite('<first 3 letters of B's email>') → no match by email prefix
--   rpc get_pet_health(<B's pet with health tier = owner>) → empty
-- app smoke (staging): /profile, /profile/edit save, /profile/settings, farm/service/shop edit,
--   register-farm/shop/service prefill, transfer + co-owner lookup, members invite search,
--   /pets/<id>/edit (health fields prefilled), /pets/<id>/id-card blood type, /admin/verifications.

-- ─── Rollback (restores the previous broad table-level SELECT) ───────────────
-- begin;
--   grant select on public.profiles to anon, authenticated;
--   grant select on public.pets to anon, authenticated;
--   drop function if exists public.get_my_profile();
--   drop function if exists public.find_user_by_email(text);
--   drop function if exists public.search_users_for_invite(text);
-- commit;
-- (dropping the functions is optional — the app falls back when they are missing)
