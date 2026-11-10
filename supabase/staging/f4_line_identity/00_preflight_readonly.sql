-- F4 migration 20261110090000_line_identity_map (rev. 3) — PREFLIGHT. READ ONLY: run before an approved apply.
-- Expected: every row ok = true. Any false → stop and report; do not apply.
with expect(name, ok) as (
  select 'no F4 table / index / sequence exists yet', not exists (select 1 from pg_class c where c.relnamespace = 'public'::regnamespace
    and c.relname in ('line_identities', 'line_link_pending', 'line_identity_ops', 'line_identity_audit', 'line_credential_freeze',
                      'line_identity_ops_one_active', 'line_identity_audit_id_seq'))
  union all select 'no F4 function exists yet', not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace
    and (p.proname like 'f4\_%' or p.proname ~ '^line_(login_resolve|identity_|link_|recovery_|legacy_link_|op_)'))
  union all select 'no F4 trigger exists yet', not exists (select 1 from pg_trigger where tgname in
    ('line_identity_audit_no_change', 'f4_credential_freeze', 'f4_sign_in_freeze', 'f4_identity_freeze'))
  union all select 'PR #37 LINE objects absent (not reconciled with F4)', to_regprocedure('public.find_auth_user_by_line_id(text)') is null
    and to_regprocedure('public.legacy_line_evidence(text)') is null
  union all select 'API roles exist', (select count(*) from pg_roles where rolname in ('anon', 'authenticated', 'service_role')) = 3
  union all select 'migration role can read / reference / trigger the auth tables', (select bool_and(has_table_privilege('auth.' || t, 'SELECT')
    and has_table_privilege('auth.' || t, 'REFERENCES') and has_table_privilege('auth.' || t, 'TRIGGER'))
    from unnest(array['users', 'identities', 'sessions', 'mfa_amr_claims']) t)
  union all select 'auth columns used by F4 exist', (select count(*) from information_schema.columns where table_schema = 'auth' and
    (table_name, column_name) in (('users', 'encrypted_password'), ('users', 'email'), ('users', 'email_change'), ('users', 'phone'),
      ('users', 'phone_change'), ('users', 'deleted_at'), ('users', 'raw_user_meta_data'), ('identities', 'provider'),
      ('identities', 'identity_data'), ('sessions', 'user_id'), ('mfa_amr_claims', 'session_id'), ('mfa_amr_claims', 'authentication_method'))) = 12
  union all select 'pgcrypto in schema extensions (bcrypt verification)', to_regprocedure('extensions.crypt(text,text)') is not null
  union all select 'password hashes are bcrypt (else the reset cannot be verified)', not exists (select 1 from auth.users
    where coalesce(encrypted_password, '') <> '' and encrypted_password !~ '^\$2[aby]\$')
  union all select 'built-ins present', to_regprocedure('pg_catalog.sha256(bytea)') is not null
    and to_regprocedure('pg_catalog.hashtextextended(text,bigint)') is not null and to_regprocedure('pg_catalog.gen_random_uuid()') is not null
  union all select 'no lock waits right now', not exists (select 1 from pg_locks where not granted)
)
select name, ok from expect order by ok, name;

-- context (aggregate counts only; never ids / emails / LINE ids)
select (select count(*) from auth.users) users,
       (select count(*) from auth.users where lower(email) like '%@line.whiskora.internal') placeholder_accounts,
       (select count(*) from auth.users where raw_user_meta_data ? 'line_id') user_meta_line_claims,
       (select count(*) from auth.sessions) sessions,
       (select count(*) from supabase_migrations.schema_migrations) recorded_migrations;
