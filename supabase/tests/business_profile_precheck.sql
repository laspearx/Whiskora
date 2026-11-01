-- Read-only gate before / after 20261101190000 (update_business_profile) and 20261101200000 (UPDATE privileges).
-- State: before | step1 | step2. Counts and catalog facts only.
select
  case when to_regprocedure('public.update_business_profile(text,bigint,jsonb)') is null then 'before'
       when has_table_privilege('authenticated', 'public.shops', 'UPDATE') then 'step1' else 'step2' end state,
  (select count(*) from public.farms) farms, (select count(*) from public.shops) shops, (select count(*) from public.services) services,
  (select count(*) from public.services where is_published) services_published,
  (select count(*) from public.farms where verification_status = 'pending') farms_pending,
  -- managers who will be able to edit content (owner rows are the entity owners themselves)
  (select count(*) from public.workspace_members m join public.workspaces w on w.id = m.workspace_id where w.type <> 'personal' and m.role = 'manager') business_managers,
  coalesce((select has_function_privilege('anon', f, 'EXECUTE') from to_regprocedure('public.update_business_profile(text,bigint,jsonb)') f where f is not null), false) rpc_anon,
  coalesce((select has_function_privilege('authenticated', f, 'EXECUTE') from to_regprocedure('public.update_business_profile(text,bigint,jsonb)') f where f is not null), false) rpc_authenticated,
  (select prosecdef from pg_proc where oid = to_regprocedure('public.update_business_profile(text,bigint,jsonb)')) rpc_definer,
  -- after step 2 these must be exactly: farms verification_status | services is_published
  (select string_agg(table_name || '.' || column_name, ',' order by table_name, column_name) from information_schema.column_privileges
    where table_schema = 'public' and table_name in ('farms', 'shops', 'services') and grantee = 'authenticated' and privilege_type = 'UPDATE'
      and (select count(*) from information_schema.column_privileges c2 where c2.table_schema = 'public' and c2.table_name = column_privileges.table_name
             and c2.grantee = 'authenticated' and c2.privilege_type = 'UPDATE') < 5) api_update_columns_if_limited,
  (select string_agg(t, ',' order by t) from unnest(array['farms', 'shops', 'services']) t where has_table_privilege('anon', 'public.' || t, 'UPDATE')) anon_update_open_on,
  exists (select 1 from pg_trigger where tgname = 'farms_verification_guard' and not tgisinternal) verification_guard,
  (xpath('/row/v/text()', query_to_xml(case when to_regclass('public.platform_settings') is null then 'select null::text v'
     else 'select value v from public.platform_settings where key = ''storage_public_origin''' end, false, true, '')))[1]::text storage_public_origin;
