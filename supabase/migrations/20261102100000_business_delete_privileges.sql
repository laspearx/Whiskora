-- STATUS: proposed — staging first; production only on the owner's go-ahead (docs/BUSINESS_DELETE_PRIVILEGES.md).
-- Removes direct API DELETE on farms / shops / services / workspaces (incl. personal workspaces) for anon and
-- authenticated. Nothing in the app, Edge Functions, cron or the RPCs deletes these rows through the API; the system paths
-- (auth.users → workspaces ON DELETE CASCADE, SECURITY DEFINER functions, service_role, the database owner) keep working.
-- Unchanged: every other privilege (SELECT / INSERT / UPDATE incl. column grants, TRUNCATE, REFERENCES, TRIGGER,
-- MAINTAIN), the RLS policies (the "manage own" FOR ALL policies stay; without the grant they no longer allow DELETE),
-- triggers, FKs, storage policies, data. Not added here: FKs, orphan clean-up, soft delete, closing a business.
-- If a DELETE right is still effective afterwards (a PUBLIC grant or role membership), the migration aborts: report it,
-- never widen or re-grant anything to make it pass.
do $$
declare t text;
begin
  foreach t in array array['farms', 'shops', 'services', 'workspaces'] loop
    if to_regclass(format('public.%I', t)) is null then raise exception 'STOP: public.% missing', t; end if;
    if not (select relrowsecurity from pg_class where oid = format('public.%I', t)::regclass) then
      raise exception 'STOP: RLS off on public.%', t;
    end if;
  end loop;
end $$;

revoke delete on public.farms, public.shops, public.services, public.workspaces from anon, authenticated;

do $$
declare t text; r text;
begin
  foreach t in array array['farms', 'shops', 'services', 'workspaces'] loop
    foreach r in array array['anon', 'authenticated', 'public'] loop
      if has_table_privilege(r, format('public.%I', t), 'DELETE') then
        raise exception 'STOP: % still has effective DELETE on public.% (PUBLIC grant or role membership) — report, do not re-grant', r, t;
      end if;
    end loop;
  end loop;
end $$;
