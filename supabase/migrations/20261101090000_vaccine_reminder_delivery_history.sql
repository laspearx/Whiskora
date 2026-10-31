-- Vaccine reminder send log survives unsubscribe / resubscribe.
-- Before: rows hung off push_subscriptions (ON DELETE CASCADE) and were unique per subscription id → switching
-- notifications off and on deleted the history and a new subscription row could get the same reminder again.
-- After:
--   * each row also records the recipient (user_id) and a SHA-256 hash of the push endpoint (endpoint_hash, hex);
--   * subscription_id becomes optional and is set to NULL when the subscription is deleted (history kept);
--   * de-duplication key = (user_id, endpoint_hash, vaccine_id, next_due):
--       - same endpoint again (app re-subscribe without a browser unsubscribe) → not re-sent;
--       - a NEW endpoint is treated as a new destination (an endpoint hash cannot prove it is the same device);
--       - another account is never blocked by this account's rows (user_id is part of the key), e.g. a shared
--         browser, or a pet transferred to a new owner who subscribes from the same browser.
--   * user_id → auth.users ON DELETE CASCADE (account deletion removes its history);
--     vaccine_id → vaccines ON DELETE CASCADE (unchanged).
--   * retention: the function deletes rows whose next_due is more than 90 days in the past (best effort, per run).
-- Service role only (RLS on, no policies, no API grants) — unchanged.

alter table public.vaccine_reminder_deliveries add column if not exists user_id uuid;
alter table public.vaccine_reminder_deliveries add column if not exists endpoint_hash text;

-- back-fill existing rows from their subscription (rows without one cannot be attributed → removed; there are none
-- on production at the time of writing: the table was emptied by the QA clean-up)
update public.vaccine_reminder_deliveries d
   set user_id = s.user_id, endpoint_hash = encode(extensions.digest(s.endpoint, 'sha256'), 'hex')
  from public.push_subscriptions s
 where s.id = d.subscription_id and (d.user_id is null or d.endpoint_hash is null);
delete from public.vaccine_reminder_deliveries where user_id is null or endpoint_hash is null;

alter table public.vaccine_reminder_deliveries alter column user_id set not null;
alter table public.vaccine_reminder_deliveries alter column endpoint_hash set not null;
alter table public.vaccine_reminder_deliveries
  add constraint vaccine_reminder_deliveries_endpoint_hash_hex check (endpoint_hash ~ '^[0-9a-f]{64}$');
alter table public.vaccine_reminder_deliveries
  add constraint vaccine_reminder_deliveries_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.vaccine_reminder_deliveries alter column subscription_id drop not null;
alter table public.vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_subscription_id_fkey;
alter table public.vaccine_reminder_deliveries
  add constraint vaccine_reminder_deliveries_subscription_id_fkey foreign key (subscription_id)
  references public.push_subscriptions(id) on delete set null;

alter table public.vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_once;
alter table public.vaccine_reminder_deliveries
  add constraint vaccine_reminder_deliveries_once unique (user_id, endpoint_hash, vaccine_id, next_due);
create index if not exists vaccine_reminder_deliveries_next_due_idx on public.vaccine_reminder_deliveries (next_due);

comment on table public.vaccine_reminder_deliveries is
  'Vaccine reminder push log (service role only). Unique per user + endpoint hash + vaccine + next_due; kept when the subscription is deleted; pruned 90 days after next_due.';
