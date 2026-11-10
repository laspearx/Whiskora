-- F4 migration (rev. 3) — ROLLBACK IMPACT. READ ONLY: run before any rollback and attach the result to the request.
select 'mapping rows (lost on rollback)' k, count(*)::text v from public.line_identities
union all select 'pending links', count(*)::text from public.line_link_pending
union all select 'ops open / approving / total', count(*) filter (where status = 'open') || ' / ' || count(*) filter (where status = 'approving') || ' / ' || count(*) from public.line_identity_ops
union all select 'accounts frozen now (rollback lifts the freeze)', count(*)::text from public.line_credential_freeze where phase <> 'grace' or until > now()
union all select 'audit rows (export before drop)', count(*)::text from public.line_identity_audit
union all select 'objects outside F4 depending on F4 tables (views / FKs)', count(*)::text from pg_depend d
  join pg_class c on c.oid = d.refobjid and c.relnamespace = 'public'::regnamespace
   and c.relname in ('line_identities', 'line_link_pending', 'line_identity_ops', 'line_identity_audit', 'line_credential_freeze')
  where d.classid = 'pg_rewrite'::regclass or (d.classid = 'pg_constraint'::regclass and d.objid in (select oid from pg_constraint
     where conrelid not in ('public.line_identities'::regclass, 'public.line_link_pending'::regclass, 'public.line_identity_ops'::regclass,
                            'public.line_identity_audit'::regclass, 'public.line_credential_freeze'::regclass)))
union all select 'functions outside F4 mentioning F4 objects', count(*)::text from pg_proc p
  where p.pronamespace not in ('pg_catalog'::regnamespace, 'information_schema'::regnamespace) and p.proname not like 'f4\_%' and p.proname not like 'line\_%'
    and p.prosrc ~ '(line_identities|line_link_pending|line_identity_ops|line_identity_audit|line_credential_freeze|line_link_confirm|line_login_resolve|f4_)'
union all select 'other triggers calling F4 functions', count(*)::text from pg_trigger t join pg_proc p on p.oid = t.tgfoid
  where (p.proname like 'f4\_%' or p.proname like 'line\_%') and t.tgname not in ('line_identity_audit_no_change', 'f4_credential_freeze', 'f4_sign_in_freeze', 'f4_identity_freeze');
-- Export the audit trail first (owner machine only, never committed):
--   \copy (select * from public.line_identity_audit order by id) to 'f4_audit_export.csv' with csv header
