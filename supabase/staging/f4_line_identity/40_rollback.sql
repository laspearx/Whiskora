-- F4 migration (rev. 3) — ROLLBACK. Needs its own approval. Order: (1) the app stops calling the F4 functions
-- (redeploy without F4), (2) 30_rollback_impact_readonly.sql + audit export, (3) this file.
-- Removes the three triggers on the Auth tables FIRST (so Auth never calls a dropped function), then the F4 functions
-- and the five tables. Touches no Auth row and no other object. Refuses while mapping rows or ops in progress exist,
-- unless the session sets:  set f4.rollback_ack = 'drop-with-data';
begin;
set local lock_timeout = '5s';
do $$ declare n bigint := 0; begin
  if to_regclass('public.line_identities') is not null then
    execute 'select (select count(*) from public.line_identities) + (select count(*) from public.line_identity_ops where status in (''open'', ''approving''))' into n;
  end if;
  if n > 0 and current_setting('f4.rollback_ack', true) is distinct from 'drop-with-data' then
    raise exception 'STOP: F4 holds % mapping / active op rows — export them and set f4.rollback_ack first', n;
  end if;
end $$;
drop trigger if exists f4_credential_freeze on auth.users;
drop trigger if exists f4_sign_in_freeze on auth.mfa_amr_claims;
drop trigger if exists f4_identity_freeze on auth.identities;
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
            and (p.proname like 'f4\_%' or p.proname ~ '^line_(login_resolve|identity_|link_|recovery_|legacy_link_|op_)')
            and p.proname <> 'line_identity_audit_immutable'
  loop execute format('drop function %s restrict', f); end loop;
end $$;
drop table if exists public.line_credential_freeze, public.line_identity_audit, public.line_identity_ops, public.line_link_pending, public.line_identities restrict;
drop function if exists public.line_identity_audit_immutable() restrict;
do $$ begin
  if exists (select 1 from pg_class c where c.relnamespace = 'public'::regnamespace and c.relname in
               ('line_identities', 'line_link_pending', 'line_identity_ops', 'line_identity_audit', 'line_credential_freeze'))
     or exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
               and (p.proname like 'f4\_%' or p.proname ~ '^line_(login_resolve|identity_|link_|recovery_|legacy_link_|op_)'))
     or exists (select 1 from pg_trigger where tgname in ('f4_credential_freeze', 'f4_sign_in_freeze', 'f4_identity_freeze')) then
    raise exception 'STOP: F4 objects still present after rollback';
  end if;
end $$;
commit;
-- If the apply was recorded by the Supabase migration tool, its supabase_migrations.schema_migrations row is removed
-- separately (same approval), by the version it recorded.
