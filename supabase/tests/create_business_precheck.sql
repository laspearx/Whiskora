-- Read-only gate before / after 20261101160000 (create_business) and 20261101170000 (direct INSERT closed).
-- Counts and catalog facts only. Prints state: before | step1 | step2.
select
  case when to_regprocedure('public.create_business(text,jsonb,uuid)') is null then 'before'
       when has_table_privilege('authenticated', 'public.shops', 'INSERT') then 'step1' else 'step2' end state,
  (select count(*) from public.farms) farms, (select count(*) from public.shops) shops, (select count(*) from public.services) services,
  (select count(*) from public.workspaces where type <> 'personal') business_workspaces,
  (select count(*) from public.workspace_members m join public.workspaces w on w.id = m.workspace_id where w.type <> 'personal' and m.role = 'owner') business_owner_rows,
  -- businesses without a workspace (the half-created state this change prevents)
  (select count(*) from public.farms f where not exists (select 1 from public.workspaces w where w.type = 'farm' and w.entity_id = f.id))
  + (select count(*) from public.shops s where not exists (select 1 from public.workspaces w where w.type = 'shop' and w.entity_id = s.id))
  + (select count(*) from public.services v where not exists (select 1 from public.workspaces w where w.type = 'service' and w.entity_id = v.id)) entities_without_workspace,
  (select count(*) from public.workspaces w where w.type <> 'personal' and public.workspace_entity_owner(w.id) is distinct from w.owner_id) forged_owners,
  to_regclass('public.business_create_requests') is not null requests_table,
  (select relrowsecurity from pg_class where oid = to_regclass('public.business_create_requests')) requests_rls,
  coalesce((select has_table_privilege('authenticated', c, 'SELECT') or has_table_privilege('anon', c, 'SELECT')
              from to_regclass('public.business_create_requests') c where c is not null), false) requests_api_readable,
  coalesce((select has_function_privilege('anon', f, 'EXECUTE') from to_regprocedure('public.create_business(text,jsonb,uuid)') f where f is not null), false) rpc_anon,
  coalesce((select has_function_privilege('authenticated', f, 'EXECUTE') from to_regprocedure('public.create_business(text,jsonb,uuid)') f where f is not null), false) rpc_authenticated,
  (select prosecdef from pg_proc where oid = to_regprocedure('public.create_business(text,jsonb,uuid)')) rpc_security_definer,
  (select string_agg(t, ',' order by t) from unnest(array['farms', 'shops', 'services', 'workspaces']) t
    where has_table_privilege('authenticated', 'public.' || t, 'INSERT')) api_insert_open_on,
  exists (select 1 from pg_trigger where tgname = 'workspaces_guard' and not tgisinternal) guard_trigger,
  to_regprocedure('public.ensure_workspace_owner_membership(uuid)') is not null members_rpc,
  -- Storage origin for create_business photos: must be THIS project's origin (compare with the app's Supabase URL)
  -- dynamic (query_to_xml) so the precheck also runs in state `before`, when platform_settings does not exist yet
  (xpath('/row/v/text()', query_to_xml(case when to_regclass('public.platform_settings') is null then 'select null::text v'
     else 'select value v from public.platform_settings where key = ''storage_public_origin''' end, false, true, '')))[1]::text storage_public_origin,
  exists (select 1 from pg_trigger where tgname = 'qa_cb_fault') qa_fault_triggers_present;
