-- Read-only gate for the vaccine reminder fix (20261031150000_vaccine_reminder_deliveries.sql + Edge Function
-- send-push-notifications). Run before applying, after applying, and after the cron / function steps.
-- ok / STOP / WARN / info. Counts only. Never edit or delete real rows (incl. orphan vaccines) to make it pass.
with
applied as (select to_regclass('public.vaccine_reminder_deliveries') is not null a),
bkk as (select (now() at time zone 'Asia/Bangkok')::date d),
job as (select * from cron.job where command ilike '%send-push-notifications%')
select 1 as n, 'state' as check, case when (select a from applied) then 'after' else 'before' end as result
union all
select 2, 'columns the function reads have the reviewed types',
  case when (select count(*) from information_schema.columns where table_schema = 'public' and (
               (table_name = 'vaccines' and (column_name, data_type) in (('id', 'bigint'), ('pet_id', 'bigint'), ('next_due', 'date'), ('vaccine_name', 'text')))
            or (table_name = 'pets' and (column_name, data_type) in (('id', 'bigint'), ('name', 'text'), ('user_id', 'uuid')))
            or (table_name = 'push_subscriptions' and (column_name, data_type) in (('id', 'uuid'), ('user_id', 'uuid'), ('endpoint', 'text'), ('p256dh', 'text'), ('auth', 'text'))))) = 12
       then 'ok' else 'STOP: column types differ from the reviewed state' end
union all
select 3, 'send log table: RLS on, no policies, no API grants (after)',
  case when not (select a from applied) then 'ok (before)'
       when (select relrowsecurity from pg_class where oid = to_regclass('public.vaccine_reminder_deliveries'))
        and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vaccine_reminder_deliveries')
        and not exists (select 1 from information_schema.role_table_grants where table_schema = 'public'
                          and table_name = 'vaccine_reminder_deliveries' and grantee in ('anon', 'authenticated', 'PUBLIC'))
        and exists (select 1 from pg_constraint where conname = 'vaccine_reminder_deliveries_once')
       then 'ok' else 'STOP' end
union all
select 4, 'no FK vaccines.pet_id → pets was added by this change (FK is a separate decision)',
  case when exists (select 1 from pg_constraint where conrelid = 'public.vaccines'::regclass and contype = 'f') then 'WARN: vaccines has a FK now — check it was decided' else 'ok' end
union all
select 5, 'cron: exactly one job calls the function, schedule unchanged (0 1 * * *)',
  case when (select count(*) from job) = 1 and (select schedule from job) = '0 1 * * *' then 'ok'
       else 'STOP: ' || (select count(*) from job) || ' job(s) / schedule ' || coalesce((select string_agg(schedule, ',') from job), '-') end
union all
select 6, 'cron command sends Authorization + x-cron-secret (required BEFORE deploying the new function)',
  case when (select command from job) ilike '%x-cron-secret%' and (select command from job) ilike '%authorization%' then 'ok'
       else 'WARN: command sends no auth headers — the new function (verify_jwt + CRON_SECRET) would answer 401' end
union all
select 7, 'vault secret names present (values not read): cron_secret, functions_anon_key',
  (select count(*) from vault.secrets where name in ('cron_secret', 'functions_anon_key'))::text || ' / 2'
union all
select 8, 'info: vaccines due today/tomorrow (Bangkok) / of them pointing to a missing pet / subscriptions',
  (select count(*) from public.vaccines, bkk where next_due >= bkk.d and next_due < bkk.d + 2)::text || ' / ' ||
  (select count(*) from public.vaccines v, bkk where v.next_due >= bkk.d and v.next_due < bkk.d + 2
     and not exists (select 1 from public.pets p where p.id = v.pet_id))::text || ' / ' ||
  (select count(*) from public.push_subscriptions)::text
union all
select 9, 'info: orphan vaccine rows (pet missing) total / distinct pet ids / with a future next_due — kept as is',
  (select count(*) from public.vaccines v where not exists (select 1 from public.pets p where p.id = v.pet_id))::text || ' / ' ||
  (select count(distinct pet_id) from public.vaccines v where not exists (select 1 from public.pets p where p.id = v.pet_id))::text || ' / ' ||
  (select count(*) from public.vaccines v, bkk where v.next_due >= bkk.d and not exists (select 1 from public.pets p where p.id = v.pet_id))::text
union all
select 10, 'info: function responses kept by pg_net (status: count)',
  coalesce((select string_agg(s, ', ') from (select coalesce(status_code::text, 'none') || ': ' || count(*) s from net._http_response group by status_code order by 1) x), 'none')
union all
select 11, 'info: send log rows by status (after)',
  case when not (select a from applied) then '-' else
    -- dynamic so the query still parses before the table exists
    (xpath('/row/s/text()', query_to_xml($q$select coalesce(string_agg(s, ', '), '0') s from (select status || ': ' || count(*) s
       from public.vaccine_reminder_deliveries group by status order by 1) x$q$, false, true, '')))[1]::text end
order by 1;
