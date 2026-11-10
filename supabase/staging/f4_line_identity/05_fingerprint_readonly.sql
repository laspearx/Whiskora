-- F4 — state fingerprint. READ ONLY. Hashes and counts only (no ids, emails or LINE ids are returned).
-- Run before the apply, after the apply and after any rollback: Auth rows (users_fp / identities_fp) must never change
-- because of the migration; after a rollback the schema fingerprints must equal the pre-apply values again.
select
 (select count(*) from auth.users) users, (select count(*) from auth.identities) identities, (select count(*) from auth.sessions) sessions,
 (select count(*) from auth.users where lower(email) like '%@line.whiskora.internal') placeholders,
 (select count(*) from auth.users where raw_user_meta_data ? 'line_id') meta_line_claims,
 md5(coalesce((select string_agg(md5(id::text || coalesce(email, '') || coalesce(encrypted_password, '') || coalesce(email_change, '')
   || coalesce(phone, '') || coalesce(raw_user_meta_data::text, '') || coalesce(raw_app_meta_data::text, '')), ',' order by id) from auth.users), '')) users_fp,
 md5(coalesce((select string_agg(md5(id::text || user_id::text || provider || identity_data::text), ',' order by id) from auth.identities), '')) identities_fp,
 md5(coalesce((select string_agg(p.oid::regprocedure::text || md5(p.prosrc) || coalesce(array_to_string(p.proacl, ','), ''), ',' order by p.oid::regprocedure::text)
   from pg_proc p where p.pronamespace = 'public'::regnamespace), '')) public_functions_fp,
 (select count(*) from pg_proc where pronamespace = 'public'::regnamespace) public_functions,
 md5(coalesce((select string_agg(c.relname || ':' || c.relkind::text || ':' || coalesce(array_to_string(c.relacl, ','), ''), ',' order by c.relname)
   from pg_class c where c.relnamespace = 'public'::regnamespace), '')) public_relations_fp,
 (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r') public_tables,
 (select string_agg(tgrelid::regclass::text || '.' || tgname, ',' order by 1) from pg_trigger where not tgisinternal
   and tgrelid in ('auth.users'::regclass, 'auth.identities'::regclass, 'auth.mfa_amr_claims'::regclass, 'auth.sessions'::regclass)) auth_triggers,
 (select count(*) from supabase_migrations.schema_migrations) recorded_migrations,
 now() at time zone 'utc' taken_at_utc;
