-- Read-only gate for 20261029100000_private_columns.sql. Run right before applying (staging or production):
--   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/privacy_precheck.sql
-- Every row must say ok = true. Prints catalog facts only, never user rows.
-- `state` tells whether the migration is already applied (after = applied, before = not yet).
begin transaction read only;

with
expected_pets(col) as (values ('id'),('created_at'),('name'),('breed'),('species'),('gender'),('color'),('pattern'),
  ('coat'),('ear'),('leg'),('eye_color'),('birth_date'),('status'),('price'),('image_url'),('cover_url'),('gallery_urls'),
  ('user_id'),('farm_id'),('litter_id'),('sire_id'),('dam_id'),('is_public'),('is_neutered'),('microchip_number'),
  ('pet_code'),('note'),('vaccine_status'),('weight'),('pedigree_number'),('pedigree_image_url'),('paternal_grandsire'),
  ('paternal_granddam'),('maternal_grandsire'),('maternal_granddam'),
  ('blood_type'),('allergies'),('chronic_diseases'),('health_notes'),('traits')),
expected_profiles(col) as (values ('id'),('full_name'),('username'),('avatar_url'),('cover_url'),('role'),('created_at'),
  ('updated_at'),('email'),('phone'),('address'),('house_no'),('room_no'),('moo'),('soi'),('road'),('sub_district'),
  ('district'),('province'),('postal_code'),('location'),('notif_line'),('notif_email')),
live as (select table_name::text t, column_name::text col from information_schema.columns
         where table_schema = 'public' and table_name in ('profiles', 'pets')),
checks(name, ok, detail) as (
  -- 1. every column the migration grants/revokes exists (a missing one aborts the whole migration)
  select 'columns named in migration exist',
         not exists (select 1 from expected_pets e where not exists (select 1 from live where t='pets' and col=e.col))
         and not exists (select 1 from expected_profiles e where not exists (select 1 from live where t='profiles' and col=e.col)),
         coalesce((select string_agg(t||'.'||col, ', ') from (
            select 'pets' t, col from expected_pets except select t, col from live where t='pets'
            union all select 'profiles', col from expected_profiles except select t, col from live where t='profiles') m), 'none missing')
  union all
  -- 2. live columns the migration does not list (they become unreadable for anon/authenticated — decide before applying)
  select 'no unlisted columns',
         not exists (select 1 from live l where (t='pets' and col not in (select col from expected_pets))
                                           or (t='profiles' and col not in (select col from expected_profiles))),
         coalesce((select string_agg(t||'.'||col, ', ') from live l where (t='pets' and col not in (select col from expected_pets))
                                           or (t='profiles' and col not in (select col from expected_profiles))), 'none')
  union all
  -- 3. invoker functions touching profiles/pets (they lose revoked columns). Known safe: whiskora_set_pet_code (id + pet_code
  --    only); protect_profile_role (hotfix trigger, must run as the caller, reads only NEW/OLD)
  select 'no unexpected SECURITY INVOKER functions on profiles/pets',
         not exists (select 1 from pg_proc where pronamespace='public'::regnamespace and not prosecdef
                     and (prosrc ~* '\mprofiles\M' or prosrc ~* '\mpets\M')
                     and proname not in ('whiskora_set_pet_code', 'protect_profile_role')),
         coalesce((select string_agg(proname, ', ') from pg_proc where pronamespace='public'::regnamespace and not prosecdef
                     and (prosrc ~* '\mprofiles\M' or prosrc ~* '\mpets\M')), 'none')
  union all
  -- 4. no views that read these tables as the caller
  select 'no views on profiles/pets',
         not exists (select 1 from information_schema.view_table_usage where table_schema='public' and table_name in ('profiles','pets')),
         coalesce((select string_agg(view_schema||'.'||view_name, ', ') from information_schema.view_table_usage
                   where table_schema='public' and table_name in ('profiles','pets')), 'none')
  union all
  -- 5. role guard from the production hotfix is in place (the migration also removes the role column grant)
  select 'role guard trigger present',
         exists (select 1 from pg_trigger where tgrelid='public.profiles'::regclass and tgname='trg_profiles_protect_role' and not tgisinternal),
         ''
  union all
  -- 6. functions the app relies on after the migration (SECURITY DEFINER, so unaffected by column grants)
  select 'app RPCs present and SECURITY DEFINER',
         (select count(*) from pg_proc where pronamespace='public'::regnamespace and prosecdef
            and proname in ('get_pet_health','get_pet_pedigree','get_my_pet_access','admin_get_users','admin_get_stats')) >= 5,
         (select string_agg(proname||case when prosecdef then '' else '(INVOKER!)' end, ', ' order by proname) from pg_proc
            where pronamespace='public'::regnamespace and proname in ('get_pet_health','get_pet_pedigree','get_my_pet_access','admin_get_users','admin_get_stats'))
)
select name, ok, detail from checks
union all
select 'state: ' || case when has_table_privilege('anon', 'public.profiles', 'SELECT') then 'before (leak open)'
                         else 'after (table SELECT revoked)' end,
       true, 'get_my_profile ' || case when to_regprocedure('public.get_my_profile()') is null then 'missing' else 'present' end;

rollback;
