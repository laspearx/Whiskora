-- Vaccine reminder send log: one row per (push subscription, vaccine, due date).
-- The Edge Function send-push-notifications claims a row (status 'sending') BEFORE it sends and marks it 'sent'
-- after the push service accepts it. A retry or a second run the same day skips anything already claimed, so a
-- recipient who already got a reminder is not sent the same one again.
--   clear failure (push service answered non-2xx, or the request provably never left) → claim deleted, a later run
--   may send it; expired subscription (404/410) → subscription deleted together with its rows;
--   uncertain (timeout / connection lost after sending — the device may already have it) → status 'uncertain',
--   kept and NOT retried automatically; a crash between claim and record leaves 'sending' (also not retried).
-- Not touched here: vaccines (no FK is added — see docs/PROPOSAL_VACCINE_PET_FK.md), push_subscriptions, cron.
-- Only the service role (Edge Function) reads or writes this table; the API roles get nothing.

create table if not exists public.vaccine_reminder_deliveries (
  id bigint generated always as identity primary key,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  vaccine_id bigint not null references public.vaccines(id) on delete cascade,
  next_due date not null,
  reminder_date date not null,                 -- Asia/Bangkok date of the run that claimed it
  status text not null default 'sending' check (status in ('sending', 'sent', 'uncertain')),
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint vaccine_reminder_deliveries_once unique (subscription_id, vaccine_id, next_due)
);
create index if not exists vaccine_reminder_deliveries_vaccine_idx on public.vaccine_reminder_deliveries (vaccine_id);

alter table public.vaccine_reminder_deliveries enable row level security;
-- no policies: anon / authenticated cannot read or write even if a grant comes back through default privileges
revoke all on public.vaccine_reminder_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.vaccine_reminder_deliveries to service_role;

comment on table public.vaccine_reminder_deliveries is
  'Vaccine reminder push log (service role only). Unique per subscription + vaccine + next_due: prevents re-sending on retry.';
