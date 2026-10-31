-- whiskora-staging ONLY: back to the 20261031150000 shape (to test the back-fill of 20261101090000). Drops history
-- rows whose subscription no longer exists. Never on production (fix forward there).
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
delete from public.vaccine_reminder_deliveries where subscription_id is null;
drop index if exists public.vaccine_reminder_deliveries_next_due_idx;
alter table public.vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_once;
alter table public.vaccine_reminder_deliveries add constraint vaccine_reminder_deliveries_once unique (subscription_id, vaccine_id, next_due);
alter table public.vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_subscription_id_fkey;
alter table public.vaccine_reminder_deliveries alter column subscription_id set not null;
alter table public.vaccine_reminder_deliveries add constraint vaccine_reminder_deliveries_subscription_id_fkey
  foreign key (subscription_id) references public.push_subscriptions(id) on delete cascade;
alter table public.vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_user_id_fkey;
alter table public.vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_endpoint_hash_hex;
alter table public.vaccine_reminder_deliveries drop column user_id, drop column endpoint_hash;
comment on table public.vaccine_reminder_deliveries is
  'Vaccine reminder push log (service role only). Unique per subscription + vaccine + next_due: prevents re-sending on retry.';
