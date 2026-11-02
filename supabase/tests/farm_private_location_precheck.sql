-- Read-only gate for H1: 20261102110000 (expand: RPC) and 20261102110100 (contract: column grants). Run inside `begin read only; … rollback;`. Aggregates only.
-- state: before (no RPC, columns open) | expanded (RPC present, columns still open — app can switch) | contracted. verdict OK only when no private column is readable by anon /
-- authenticated / PUBLIC and every public column is. other_rights_md5: every other privilege of anon / authenticated /
-- PUBLIC / service_role on farms (all table privileges except SELECT, column UPDATE / INSERT / REFERENCES) + RLS
-- policies of farms — must be identical before and after.
-- exposure_*: how many farms hold a value in each private field (sizes what was public before; no values shown).
with priv(c) as (values ('address'),('house_no'),('room_no'),('moo'),('soi'),('road'),('postal_code'),('lat'),('lng'),('verification_note')),
pub(c) as (values ('id'),('created_at'),('user_id'),('farm_name'),('species'),('phone'),('bio'),('image_url'),('facebook_link'),('line_id'),
  ('is_verified'),('verified_at'),('cover_url'),('updated_at'),('verification_status'),('owner_name'),('sub_district'),('district'),('province')),
roles(r) as (values ('anon'),('authenticated'),('public')),
leaks as (select r || ':' || c x from priv, roles where has_column_privilege(r, 'public.farms', c, 'SELECT')),
missing as (select r || ':' || c x from pub, roles where r <> 'public' and not has_column_privilege(r, 'public.farms', c, 'SELECT')),
other as (
  select string_agg(x, ',' order by x) l from (
    select r || ':' || p || '=' || has_table_privilege(r, 'public.farms', p)::text x
      from (values ('anon'),('authenticated'),('public'),('service_role')) a(r),
           (values ('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN')) b(p)
    union all
    select r || ':' || a.attname || ':' || p || '=' || has_column_privilege(r, 'public.farms', a.attname, p)::text
      from pg_attribute a, (values ('anon'),('authenticated'),('public'),('service_role')) x(r), (values ('INSERT'),('UPDATE'),('REFERENCES')) y(p)
     where a.attrelid = 'public.farms'::regclass and a.attnum > 0 and not a.attisdropped
    union all
    select 'service_role:SELECT=' || has_table_privilege('service_role', 'public.farms', 'SELECT')::text
    union all
    select 'policy:' || polname || ':' || polcmd::text || ':' || coalesce(pg_get_expr(polqual, polrelid), '-') || ':' || coalesce(pg_get_expr(polwithcheck, polrelid), '-')
      from pg_policy where polrelid = 'public.farms'::regclass) s)
select
  case when to_regprocedure('public.get_farm_private(bigint)') is null then 'before'
       when exists (select 1 from leaks) then 'expanded' else 'contracted' end state,
  case when not exists (select 1 from leaks) and not exists (select 1 from missing) then 'OK'
       else 'STOP leaks=' || coalesce((select string_agg(x, ',') from leaks), '-') || ' missing=' || coalesce((select string_agg(x, ',') from missing), '-') end verdict,
  to_regprocedure('public.get_farm_private(bigint)') is not null rpc_present,
  coalesce((select has_function_privilege('anon', 'public.get_farm_private(bigint)', 'EXECUTE') where to_regprocedure('public.get_farm_private(bigint)') is not null), false) rpc_anon,
  md5((select l from other)) other_rights_md5,
  (select count(*) from public.farms) farms,
  (select count(*) from public.farms where coalesce(nullif(trim(house_no), ''), nullif(trim(address), '')) is not null) exposure_address,
  (select count(*) from public.farms where lat is not null and lng is not null) exposure_latlng,
  (select count(*) from public.farms where nullif(trim(postal_code), '') is not null) exposure_postal,
  (select count(*) from public.farms where nullif(trim(verification_note), '') is not null) exposure_verification_note;
