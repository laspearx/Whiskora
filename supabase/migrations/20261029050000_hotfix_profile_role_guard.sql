-- ─────────────────────────────────────────────────────────────────────────────
-- HOTFIX: API users must not set or change profiles.role (self-escalation to admin).
-- STATUS: APPLIED TO PRODUCTION (vhudldcizmbpujedojei) on 2026-10-30 via Supabase MCP as migration
--         'hotfix_profile_role_guard' (same statements, without the explicit begin/commit).
--         Pre-change snapshot: supabase/snapshots/2026-10-30_profiles_before_role_hotfix.json
-- Scope: ONLY this guard. No grant/RLS/SELECT changes, no data changes, no existing role touched.
--
-- Why a trigger (not just column grants): anon/authenticated hold table-level INSERT/UPDATE on
-- profiles (relacl …authenticated=arwdDxtm…), RLS limits rows not columns, so a column-level revoke
-- alone would not apply. A BEFORE trigger runs for every INSERT, UPDATE and upsert (ON CONFLICT DO
-- UPDATE) regardless of how the privilege was granted or inherited.
--
-- Who is still allowed to write role:
--   * SECURITY DEFINER functions (current_user = their owner, e.g. postgres) — handle_new_user does
--     not set role at all (signup keeps the column default 'user'); no other function writes profiles.
--   * service_role, postgres / dashboard SQL editor — how admins change roles.
-- Who is blocked: current_user anon or authenticated (all PostgREST requests with anon/user JWTs).
--
-- Production state before (read 2026-10-30): profiles triggers = trg_sync_personal_workspace_name
-- (AFTER UPDATE, unrelated); role default 'user'; no column ACL on role; names below unused.
-- ─────────────────────────────────────────────────────────────────────────────
begin;

create function public.protect_profile_role()
returns trigger
language plpgsql
security invoker            -- must see the real caller in current_user
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.role is distinct from 'user' then
      raise exception 'profiles.role cannot be set by API users' using errcode = '42501';
    elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'profiles.role cannot be changed by API users' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- trigger functions are not meant to be called via /rpc
revoke all on function public.protect_profile_role() from public, anon, authenticated;

create trigger trg_profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

commit;

-- ─── Rollback ────────────────────────────────────────────────────────────────
-- begin;
--   drop trigger if exists trg_profiles_protect_role on public.profiles;
--   drop function if exists public.protect_profile_role();
-- commit;
