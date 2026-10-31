-- Read-only gate for 20261101140000_public_grants_cleanup.sql (before / after). Counts and hashes only.
select 1 as n, 'state' as check, case when has_function_privilege('anon', 'public.admin_get_stats()', 'execute') then 'before' else 'after' end as result
union all
select 2, 'TRUNCATE / TRIGGER / REFERENCES grants to anon / authenticated / PUBLIC on public tables (after: 0)',
  (select count(*) from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC') and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES'))::text
union all
select 3, 'CRUD table grants anon / authenticated — must be identical before and after',
  (select count(*) || ' / ' || md5(string_agg(table_name || grantee || privilege_type, ',' order by table_name, grantee, privilege_type))
     from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
union all
select 4, 'column grants without REFERENCES — must be identical before and after',
  (select md5(string_agg(table_name || column_name || grantee || privilege_type, ',' order by 1)) from information_schema.column_privileges
     where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type <> 'REFERENCES' and table_name not like 'qa_push_mock%')
union all
select 5, 'every function named in the migration exists with that signature (else STOP)',
  case when (select count(*) from (values ('public.admin_get_action_center()'), ('public.admin_get_platform_overview(timestamptz,timestamptz,timestamptz,timestamptz)'),
       ('public.admin_get_stats()'), ('public.admin_get_users()'), ('public.admin_get_users(text,integer,integer)'), ('public.admin_review_farm_verification(bigint,text,text)'),
       ('public.get_farm_dashboard_summary(bigint)'), ('public.get_my_pending_transfers()'), ('public.resolve_pet_tags(bigint,uuid)'), ('public.handle_new_user()'),
       ('public.sync_personal_workspace_name()'), ('public.sync_pet_owner_on_transfer_accept()'), ('public.whiskora_set_pet_code()')) v(sig)
       where to_regprocedure(sig) is not null) = 13 then 'ok' else 'STOP' end
union all
select 6, 'non-identity sequences in public (keep USAGE for authenticated)',
  coalesce((select string_agg(s.relname, ',') from pg_class s where s.relnamespace = 'public'::regnamespace and s.relkind = 'S'
     and not exists (select 1 from pg_depend d where d.objid = s.oid and d.deptype = 'i')), 'none')
union all
select 7, 'anon EXECUTE on functions kept for public pages (get_pet_health, get_pet_pedigree, get_my_pet_access, viewer_can_see)',
  (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('get_pet_health', 'get_pet_pedigree', 'get_my_pet_access', 'viewer_can_see')
     and has_function_privilege('anon', p.oid, 'execute'))::text || ' / 4'
union all
select 8, 'default privileges of postgres in public (tables / sequences / functions)',
  (select string_agg(d.defaclobjtype::text || ':' || array_to_string(d.defaclacl::text[], ' '), ' | ' order by d.defaclobjtype)
     from pg_default_acl d where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 'public'::regnamespace)
order by 1;
