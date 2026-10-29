# Notifications — setup & verification (staging first)

Status 2026-10-29: code exists; **nothing below has been configured or sent yet** (no access to Vercel / Supabase / Resend from the dev environment). Do every step on staging with test accounts before production. Never paste secret values into Git, tickets or chat.

## 1. Variables the code actually reads

| Name | Where | Public? | Used by |
|---|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel env (web) | yes — shipped to the browser | `lib/push-client.ts` (subscribe) |
| `VAPID_PUBLIC_KEY` | Supabase function secret | yes, but must be **the same value** as above | Edge Function |
| `VAPID_PRIVATE_KEY` | Supabase function secret | **secret** | Edge Function |
| `VAPID_EMAIL` | Supabase function secret | no (contact, `mailto:...`) | Edge Function |
| `CRON_SECRET` | Supabase function secret | **secret** | Edge Function — when set, callers must send header `x-cron-secret` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | injected automatically into Edge Functions | **secret** (service role) | Edge Function |
| `RESEND_API_KEY` | Vercel env | **secret** | `lib/notify.ts` (no caller yet) |
| `RESEND_FROM` | Vercel env | no | `lib/notify.ts` — e.g. `Whiskora <noreply@<verified-domain>>` |
| `LINE_CHANNEL_ACCESS_TOKEN` | Vercel env | **secret** | `lib/notify.ts` (no caller yet) |
| `INTERNAL_API_SECRET` | Vercel env | **secret** | `/api/notify/send` bearer check |

## 2. Sender domain (Resend)
- `whiskora.com` is **not ours** (nameservers `ns1/ns2.afternic.com` = parked domain). Do not send from it.
- `whiskora.pet` (Cloudflare DNS) has **no** `resend._domainkey` record yet → not verified in Resend.
- To enable email: add `whiskora.pet` in Resend → add the DKIM/SPF (`send.` MX/TXT) records it shows in Cloudflare → wait for "Verified" in Resend → set `RESEND_FROM`. Until then `sendEmail()` refuses to send.

## 3. Web Push keys
```bash
npx web-push generate-vapid-keys      # run locally; store the private key only in Supabase secrets
supabase secrets set --project-ref <staging-ref> VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_EMAIL=mailto:<team address> CRON_SECRET=<random 32+ chars>
```
Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same public key) in the staging Vercel environment and redeploy staging.

## 4. Deploy the Edge Function (staging)
```bash
supabase functions deploy send-push-notifications --project-ref <staging-ref>
```
There is no `supabase/config.toml`, so the function keeps the default `verify_jwt = true`: callers need `Authorization: Bearer <valid key/JWT>` **and** (because `CRON_SECRET` is set) `x-cron-secret`. Manual check:
```bash
curl -i -X POST "https://<staging-ref>.supabase.co/functions/v1/send-push-notifications" \
  -H "Authorization: Bearer $STAGING_ANON_KEY" -H "x-cron-secret: $CRON_SECRET"
# expect 200 {"sent":N,"expired":M}; without x-cron-secret expect 401
```

## 5. Schedule (pg_cron + pg_net), 08:00 Asia/Bangkok = 01:00 UTC
Store the values in Vault first (`select vault.create_secret('<value>', 'cron_secret');` and `'functions_anon_key'`), then:
```sql
select cron.schedule('vaccine-reminders', '0 1 * * *', $$
  select net.http_post(
    url := 'https://<staging-ref>.supabase.co/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'functions_anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
$$);
-- verify: select * from cron.job; select * from cron.job_run_details order by start_time desc limit 5;
-- rollback: select cron.unschedule('vaccine-reminders');
```

## 6. Behaviour to verify (test accounts only)
| Check | How | Expected |
|---|---|---|
| Timezone | vaccine `next_due` = Bangkok today and tomorrow; invoke at 00:30 UTC (07:30 BKK) | both included; title "วันนี้…" when any is today |
| Opt-in | `/profile/settings` toggle on | one `push_subscriptions` row for the device |
| Opt-out | toggle off | row deleted, no further notifications |
| Duplicate run | invoke twice the same day | device shows one notification (same `tag`); the function itself does not keep a send log |
| Expired subscription | unsubscribe in browser devtools, invoke | push service returns 404/410, row deleted, `expired` count > 0 |
| Click target | click notification | opens `/pets/<id>/vaccines` (or `/pets/vaccines/all` for several pets) |
| Permission | only the pet's current `pets.user_id` gets it | after a transfer, the new owner receives reminders, the old owner does not |

Known limits: no per-user send log (a second run on the same day re-sends, replaced on the device by `tag`); farm members other than the owner do not receive farm pet reminders; LINE/email reminders have no scheduler caller yet.
