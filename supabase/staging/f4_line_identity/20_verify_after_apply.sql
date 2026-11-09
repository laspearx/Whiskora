-- F4 migration (rev. 3) — POST-APPLY VERIFICATION. READ ONLY (smoke calls below write nothing). Every row ok = true.
with api(name) as (values ('line_login_resolve'), ('line_identity_of'), ('line_identity_claim'), ('line_identity_release'),
  ('line_link_pending_put'), ('line_link_confirm'), ('line_link_pending_clear'), ('line_link_status'), ('line_recovery_record'),
  ('line_recovery_evidence'), ('line_recovery_begin'), ('line_op_mark_reset'), ('line_op_commit'), ('line_legacy_link_resume'),
  ('line_op_abort'), ('line_recovery_decline'), ('line_recovery_list')),
fns as (select p.oid, p.proname, p.prosecdef, p.proconfig, p.proname in (select name from api) is_api from pg_proc p
         where p.pronamespace = 'public'::regnamespace and (p.proname like 'f4\_%' or p.proname like 'line\_%') and p.prokind = 'f'),
tbl(t) as (values ('line_identities'), ('line_link_pending'), ('line_identity_ops'), ('line_identity_audit'), ('line_credential_freeze')),
checks(name, ok) as (
  select 'all 17 API functions present', (select count(*) from fns where is_api) = 17
  union all select 'old two-step API absent', to_regprocedure('public.line_link_take(uuid,text)') is null
    and to_regprocedure('public.line_legacy_link_begin(uuid,text,text)') is null
  union all select 'API: service_role only', not exists (select 1 from fns where is_api and (not has_function_privilege('service_role', oid, 'EXECUTE')
    or has_function_privilege('anon', oid, 'EXECUTE') or has_function_privilege('authenticated', oid, 'EXECUTE')))
  union all select 'internal helpers: no API role at all (service_role included)', not exists (select 1 from fns where not is_api
    and (has_function_privilege('service_role', oid, 'EXECUTE') or has_function_privilege('anon', oid, 'EXECUTE')
         or has_function_privilege('authenticated', oid, 'EXECUTE')))
  union all select 'every SECURITY DEFINER function has a fixed search_path', not exists (select 1 from fns where prosecdef and proconfig is null)
  union all select 'tables: RLS on, no policies, no API-role privileges', (select bool_and(c.relrowsecurity
      and not exists (select 1 from pg_policy where polrelid = c.oid)
      and not has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      and not has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      and not has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
    from tbl join pg_class c on c.oid = to_regclass('public.' || tbl.t)) and (select count(*) from tbl where to_regclass('public.' || t) is not null) = 5
  union all select 'audit sequence: no API-role privileges', not (has_sequence_privilege('anon', 'public.line_identity_audit_id_seq', 'USAGE,SELECT,UPDATE')
    or has_sequence_privilege('authenticated', 'public.line_identity_audit_id_seq', 'USAGE,SELECT,UPDATE')
    or has_sequence_privilege('service_role', 'public.line_identity_audit_id_seq', 'USAGE,SELECT,UPDATE'))
  union all select 'audit append-only trigger enabled', exists (select 1 from pg_trigger where tgname = 'line_identity_audit_no_change' and tgenabled = 'O')
  union all select 'credential-freeze triggers on auth tables enabled', (select count(*) from pg_trigger where tgenabled = 'O' and
    (tgname, tgrelid) in (('f4_credential_freeze', 'auth.users'::regclass), ('f4_sign_in_freeze', 'auth.mfa_amr_claims'::regclass),
                          ('f4_identity_freeze', 'auth.identities'::regclass))) = 3
  union all select 'uniqueness: LINE id and account', (select count(*) from pg_constraint where conrelid = 'public.line_identities'::regclass and contype in ('p', 'u')) = 2
  union all select 'one active op per account+LINE id', to_regclass('public.line_identity_ops_one_active') is not null
  union all select 'FKs to auth.users cascade (4 tables)', (select count(*) from pg_constraint where confrelid = 'auth.users'::regclass and confdeltype = 'c'
    and conrelid in ('public.line_identities'::regclass, 'public.line_link_pending'::regclass, 'public.line_identity_ops'::regclass,
                     'public.line_credential_freeze'::regclass)) = 4
  union all select 'all F4 tables empty (nothing written by the apply)', (select count(*) from public.line_identities) + (select count(*) from public.line_link_pending)
    + (select count(*) from public.line_identity_ops) + (select count(*) from public.line_identity_audit) + (select count(*) from public.line_credential_freeze) = 0
  union all select 'no account frozen', not exists (select 1 from public.line_credential_freeze)
)
select name, ok from checks order by ok, name;

-- Behaviour smoke, as service_role (writes nothing; expected results in comments):
--   begin; set local role service_role;
--   select kind from public.line_login_resolve('U' || repeat('0', 32));   -- none
--   select kind from public.line_login_resolve('bad id!');                -- invalid
--   select count(*) from public.line_recovery_list();                     -- 0
--   select public.f4_frozen(gen_random_uuid());                           -- ERROR: permission denied (internal helper)
--   select * from public.line_identities;                                 -- ERROR: permission denied
--   rollback;
-- Then the Supabase security advisor: expect only 5 new INFO "RLS enabled, no policy" entries for the F4 tables and no
-- new anon / authenticated SECURITY DEFINER warnings.
