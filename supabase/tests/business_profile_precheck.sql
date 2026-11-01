-- Read-only gate before / after 20261101190000 (update_business_profile) and 20261101200000 (UPDATE privileges).
-- State: before | step1 | step2. Counts and catalog facts only; changes nothing.
-- update_rights: EFFECTIVE UPDATE rights of anon / authenticated per table, from has_column_privilege (covers table
-- grants, column grants, PUBLIC and role membership): "ALL", the column list, or "-" for none.
-- step2_verdict: after step 2 the API must keep exactly authenticated farms.verification_status + services.is_published
-- and anon nothing; anything more or less → "STOP …" (report it — do not change other ACLs to make it pass). The verdict is
-- computed in every state on purpose (before / step 1 it is expected to say STOP; only step 2 must say OK).
with cols as (
  select r.role, c.table_name, c.column_name,
         has_column_privilege(r.role, format('public.%I', c.table_name), c.column_name, 'UPDATE') can_update
    from information_schema.columns c cross join (values ('anon'), ('authenticated')) r(role)
   where c.table_schema = 'public' and c.table_name in ('farms', 'shops', 'services')
), per_table as (
  select role, table_name,
         case when bool_and(can_update) then 'ALL'
              when bool_or(can_update) then string_agg(column_name, '+' order by column_name) filter (where can_update)
              else '-' end rights
    from cols group by role, table_name
), granted as (
  select string_agg(role || ':' || table_name || '.' || column_name, ',' order by role, table_name, column_name) list
    from cols where can_update
)
select
  case when to_regprocedure('public.update_business_profile(text,bigint,jsonb)') is null then 'before'
       when exists (select 1 from cols where role = 'authenticated' and table_name = 'shops' and can_update) then 'step1'
       else 'step2' end state,
  (select count(*) from public.farms) farms, (select count(*) from public.shops) shops, (select count(*) from public.services) services,
  (select count(*) from public.services where is_published) services_published,
  (select count(*) from public.farms where verification_status = 'pending') farms_pending,
  (select count(*) from public.workspace_members m join public.workspaces w on w.id = m.workspace_id where w.type <> 'personal' and m.role = 'manager') business_managers,
  coalesce((select has_function_privilege('anon', f, 'EXECUTE') from to_regprocedure('public.update_business_profile(text,bigint,jsonb)') f where f is not null), false) rpc_anon,
  coalesce((select has_function_privilege('authenticated', f, 'EXECUTE') from to_regprocedure('public.update_business_profile(text,bigint,jsonb)') f where f is not null), false) rpc_authenticated,
  (select prosecdef from pg_proc where oid = to_regprocedure('public.update_business_profile(text,bigint,jsonb)')) rpc_definer,
  (select string_agg(role || ':' || table_name || '=' || rights, ' ' order by role, table_name) from per_table) update_rights,
  case when (select list from granted) is not distinct from 'authenticated:farms.verification_status,authenticated:services.is_published'
       then 'OK' else 'STOP update rights = ' || coalesce(left((select list from granted), 400) || case when length((select list from granted)) > 400 then '…' else '' end, 'none') end step2_verdict,
  exists (select 1 from pg_trigger where tgname = 'farms_verification_guard' and not tgisinternal) verification_guard,
  (xpath('/row/v/text()', query_to_xml(case when to_regclass('public.platform_settings') is null then 'select null::text v'
     else 'select value v from public.platform_settings where key = ''storage_public_origin''' end, false, true, '')))[1]::text storage_public_origin;
