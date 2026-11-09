-- Read-only gate before / after 20261102120000 (M1). Run inside `begin read only; … rollback;`. Aggregates only.
-- state: before | after (triggers present). foreign_*: existing rows linked to a farm whose owner / owner-manager-staff
-- the row's user is NOT — either a legitimate history (e.g. a member who has since left) or a forged link. The
-- migration does not touch them; they are listed by count only, for a separate owner decision.
select
  case when exists (select 1 from pg_trigger where tgname = 'pets_farm_link_guard') and exists (select 1 from pg_trigger where tgname = 'litters_farm_link_guard')
       then 'after' else 'before' end state,
  (select count(*) from public.pets where farm_id is not null) pets_linked,
  (select count(*) from public.pets p where p.farm_id is not null and not (
      exists (select 1 from public.farms f where f.id = p.farm_id and f.user_id = p.user_id::text)
      or exists (select 1 from public.workspaces w where w.type = 'farm' and w.entity_id = p.farm_id
                  and public.workspace_role_of(w.id, p.user_id) in ('owner', 'manager', 'staff')))) foreign_pets,
  (select count(*) from public.litters where nullif(trim(farm_id), '') is not null) litters_linked,
  (select count(*) from public.litters l where nullif(trim(l.farm_id), '') is not null and l.farm_id ~ '^\d+$' and not (
      exists (select 1 from public.farms f where f.id = l.farm_id::bigint and f.user_id = l.user_id::text)
      or exists (select 1 from public.workspaces w where w.type = 'farm' and w.entity_id = l.farm_id::bigint
                  and public.workspace_role_of(w.id, l.user_id) in ('owner', 'manager', 'staff')))) foreign_litters,
  (select count(*) from public.litters where nullif(trim(farm_id), '') is not null and farm_id !~ '^\d+$') litters_bad_farm_id,
  coalesce((select has_function_privilege('anon', 'public.caller_can_link_farm(bigint)', 'EXECUTE') where to_regprocedure('public.caller_can_link_farm(bigint)') is not null), false) helper_anon;
