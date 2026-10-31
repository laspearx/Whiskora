-- Public schema grants clean-up: remove privileges the API roles never need, keep every privilege the app uses.
-- Inventory (read-only, production = staging): every public table has RLS; no PUBLIC table grants; anon /
-- authenticated hold TRUNCATE / TRIGGER / REFERENCES on 27 of 31 tables (RLS does not cover TRUNCATE); sequences are
-- identity sequences (their privileges are not checked on INSERT) except farm_verifications_id_seq (serial default);
-- default privileges of `postgres` give ALL on new tables / sequences / functions to anon + authenticated, and new
-- functions are also executable by PUBLIC.
-- Not touched: SELECT / INSERT / UPDATE / DELETE and column grants (RLS + existing column privileges decide those),
-- functions the app or policies call with that role, service_role, `supabase_admin` default privileges (postgres is
-- not a member of supabase_admin — separate request to the platform owner).

-- 1. tables: TRUNCATE / TRIGGER / REFERENCES from the API roles
do $$
declare r record;
begin
  for r in select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated, public', r.relname);
  end loop;
end $$;

-- 2. sequences: identity sequences need no grant for INSERT → none for the API roles;
--    farm_verifications.id uses a serial default (nextval needs USAGE) → keep USAGE for authenticated only
do $$
declare r record;
begin
  for r in select s.relname, (d.deptype = 'i') is_identity
             from pg_class s left join pg_depend d on d.objid = s.oid and d.classid = 'pg_class'::regclass
                  and d.refclassid = 'pg_class'::regclass and d.deptype in ('a', 'i')
            where s.relnamespace = 'public'::regnamespace and s.relkind = 'S' loop
    if r.is_identity then
      execute format('revoke all on sequence public.%I from anon, authenticated, public', r.relname);
    else
      execute format('revoke all on sequence public.%I from anon, public', r.relname);
      execute format('revoke select, update on sequence public.%I from authenticated', r.relname);
      execute format('grant usage on sequence public.%I to authenticated', r.relname);
    end if;
  end loop;
end $$;

-- 3. functions, decided one by one from the real callers
--    3a. admin RPCs (check role = 'admin' inside; called by signed-in admins) → not anon / PUBLIC
revoke execute on function public.admin_get_action_center() from public, anon;
revoke execute on function public.admin_get_platform_overview(timestamptz, timestamptz, timestamptz, timestamptz) from public, anon;
revoke execute on function public.admin_get_stats() from public, anon;
revoke execute on function public.admin_get_users() from public, anon;
revoke execute on function public.admin_get_users(text, integer, integer) from public, anon;
revoke execute on function public.admin_review_farm_verification(bigint, text, text) from public, anon;
grant execute on function public.admin_get_action_center() to authenticated;
grant execute on function public.admin_get_platform_overview(timestamptz, timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_get_stats() to authenticated;
grant execute on function public.admin_get_users() to authenticated;
grant execute on function public.admin_get_users(text, integer, integer) to authenticated;
grant execute on function public.admin_review_farm_verification(bigint, text, text) to authenticated;
--    3b. signed-in only RPCs (use auth.uid(); anon gets nothing useful)
revoke execute on function public.get_farm_dashboard_summary(bigint) from public, anon;
revoke execute on function public.get_my_pending_transfers() from public, anon;
grant execute on function public.get_farm_dashboard_summary(bigint) to authenticated;
grant execute on function public.get_my_pending_transfers() to authenticated;
--    3c. resolve_pet_tags(pet, viewer): no app caller, not in any policy / view; callers are SECURITY DEFINER
--        (viewer_can_see, pet_visible_to, get_pet_pedigree_fields). Direct calls let anyone ask who is a co-owner /
--        buyer / grantee of a pet for any viewer id → API roles lose direct EXECUTE
revoke execute on function public.resolve_pet_tags(bigint, uuid) from public, anon, authenticated;
--    3d. trigger functions: EXECUTE is only checked when a trigger is created, never when it fires → not callable by API roles
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_personal_workspace_name() from public, anon, authenticated;
revoke execute on function public.sync_pet_owner_on_transfer_accept() from public, anon, authenticated;
revoke execute on function public.whiskora_set_pet_code() from public, anon, authenticated;
--    kept on purpose: get_pet_health / get_pet_pedigree / get_my_pet_access (anon on /p/[id]); viewer_can_see,
--    is_farm_team, can_manage_pet_visibility, auth_user_owned_workspace_ids (used in RLS policies the API roles hit);
--    pet_visible_to, tags_satisfy_tier, whiskora_* code helpers (no data beyond what the caller can already read)

-- 4. default privileges for objects `postgres` creates in public from now on
alter default privileges for role postgres in schema public revoke truncate, trigger, references on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke select, update on sequences from authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;
-- EXECUTE for PUBLIC on new functions is a global default; a per-schema entry cannot remove it, so this one is global
-- (functions created by postgres in any schema; Supabase-managed schemas are created by supabase_admin, not affected)
alter default privileges for role postgres revoke execute on functions from public;
-- (service_role keeps its defaults; new RPCs must grant EXECUTE to authenticated / anon explicitly when needed)
