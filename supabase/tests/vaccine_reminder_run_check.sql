-- Read-only check of the scheduled vaccine reminder run(s) (cron job 1, 01:00 UTC). Run between 01:00 and 07:00 UTC:
-- pg_net keeps responses for 6 h only (pg_net.ttl). cron "succeeded" = the request was queued, NOT that it worked —
-- the evidence is the HTTP status + body of net._http_response, the function summary log and the send-log statuses.
-- Function log (Supabase logs, source function_logs): line {"fn":"send-push-notifications","summary":{...}} at ~01:00.
select 'cron' k, to_char(start_time at time zone 'utc', 'YYYY-MM-DD HH24:MI:SS') || ' ' || status || ' ' || coalesce(return_message, '') v
  from cron.job_run_details where jobid = 1 and start_time > now() - interval '30 hours'
union all
select 'http', to_char(created at time zone 'utc', 'YYYY-MM-DD HH24:MI:SS') || ' status=' || coalesce(status_code::text, 'none')
       || ' timed_out=' || coalesce(timed_out::text, '-')
       || ' outcome=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'outcome' end, '-')
       || ' dry_run=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'dry_run' end, '-')
       || ' due=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'due' end, '-')
       || ' recipients=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'recipients' end, '-')
       || ' sent=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'sent' end, '-')
       || ' failed=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'failed' end, '-')
       || ' uncertain=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'uncertain' end, '-')
       || ' error=' || coalesce(case when content ~ '^\s*\{' then content::jsonb ->> 'error' end, error_msg, '-')
  from net._http_response where created > now() - interval '6 hours'
union all
select 'deliveries', status || ': ' || count(*) || ' (latest claim ' || to_char(max(claimed_at) at time zone 'utc', 'YYYY-MM-DD HH24:MI') || ')'
  from public.vaccine_reminder_deliveries group by status
union all
select 'state', 'cron_active=' || (select active from cron.job where jobid = 1) || ' schedule=' || (select schedule from cron.job where jobid = 1)
       || ' subscriptions=' || (select count(*) from public.push_subscriptions)
order by 1, 2;
