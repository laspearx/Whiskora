# Notifications — setup & verification (staging first)

Status 2026-10-29 (updated 2026-10-31 for the vaccine reminder fix): **no reminder has ever been sent** (0 push subscriptions on production). Do every step on staging with test accounts before production. Never paste secret values into Git, tickets or chat.

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

## 4. Vaccine reminder Edge Function — deploy plan (separate from the Vercel app)
The function and its cron job live in **Supabase** only. Merging / deploying the web app on Vercel does **not** deploy
or change the function, and the function deploy does not need a Vercel deploy. Production state 2026-10-31 (read-only):
function v5 (older code than the repo), **`verify_jwt = false` and no secret check** — anyone with the URL can trigger
a run; cron job 1 (`0 1 * * *`) posts with **no** `Authorization` / `x-cron-secret`; the vaccines query fails daily
with PGRST200 and the function answers 200 `{"sent":0}`; 0 push subscriptions, so nothing has ever been sent.

New behaviour (`supabase/functions/send-push-notifications/`, PR "fix vaccine reminders"):
- POST only; `CRON_SECRET` required (missing → 500 `misconfigured`, never open); wrong/missing `x-cron-secret` → 401;
  deployed **with** JWT verification (gateway rejects calls without a valid key: 401).
- Batched reads (vaccines in the Bangkok today+tomorrow window, paged → pets by id → subscriptions by user id); no embed.
- Vaccine rows whose pet no longer exists are skipped and only counted (`orphan_skipped`).
- Send log `vaccine_reminder_deliveries` (migration `20261031150000`): claimed before sending, so retries / a second
  run / two runs at once do not re-send to the same device; failed sends are released for a retry.
- Response / status: `no_due`, `no_recipients`, `no_subscriptions`, `already_sent`, `sent` → 200; any push failure →
  502 (`partial_failure` / `failed`, `failed_status` counts); query error → 500 `query_failed` + `stage`.
  `{"dry_run": true}` (optionally `"as_of"`) reads only. Logs: counts, stage, error code — no names/ids/endpoints/keys.

### Production order (each step its own approval; Vercel untouched)
0. Precheck (read-only): `supabase/tests/vaccine_reminder_precheck.sql` → `before`, check 2/5 ok; 6 = WARN (expected).
1. Apply `supabase/migrations/20261031150000_vaccine_reminder_deliveries.sql` (sha256 in the PR) in one transaction,
   recorded in `supabase_migrations.schema_migrations`. Re-run precheck → `after`, check 3 ok. Harmless to the old function.
2. Owner sets function secrets in the Supabase dashboard (never in Git / chat): `CRON_SECRET` (new random ≥ 32 chars),
   `VAPID_PUBLIC_KEY` (= Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY` of Production), `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`.
   Old function ignores them.
3. Owner stores the same values for cron in Vault: `select vault.create_secret('<CRON_SECRET>', 'cron_secret');`
   `select vault.create_secret('<production anon JWT>', 'functions_anon_key');` (precheck 7 → `2 / 2`).
4. Change **only the command** of cron job 1 (schedule stays `0 1 * * *`), before the deploy:
```sql
select cron.alter_job(job_id := 1, command := $cmd$
  select net.http_post(
    url := 'https://vhudldcizmbpujedojei.supabase.co/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'functions_anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 60000);
$cmd$);
```
   Precheck 5/6 → ok. (The old function ignores the headers, so this step changes nothing by itself.)
5. Deploy the function **with** JWT verification: `supabase functions deploy send-push-notifications --project-ref vhudldcizmbpujedojei`
   (no `--no-verify-jwt`; or the dashboard / MCP with `verify_jwt: true`). Files: `index.ts`, `handler.ts`, `reminders.ts`.
6. Post-deploy checks (no real sends — production has 0 subscriptions; re-check that first, stop if > 0):
   - `curl -X POST <url>` → 401 (gateway); with anon key, no secret → 401; GET → 405.
   - with anon key + secret, `{"dry_run": true}` → 200 with counts (`orphan_skipped` only if an orphan is due).
   - `get_edge_function` shows `verify_jwt: true` and the reviewed files; function logs: one summary line, no PGRST200.
   - next 01:00 UTC run: `net._http_response` status 200 and body `outcome` (not `{"sent":0}`), cron `succeeded`.
7. If something fails: pause only this job — `select cron.alter_job(job_id := 1, active := false);` — and fix forward.
   Do **not** redeploy v5, do **not** turn `verify_jwt` off, do **not** drop the send log. Nothing to revert in Vercel.

Not in scope: back-filling reminders that were missed (none were ever sendable: 0 subscriptions), LINE / email
reminders, the FK `vaccines.pet_id → pets` (see `docs/PROPOSAL_VACCINE_PET_FK.md`).

### Staging state
Function deployed 2026-10-31 (v1, `verify_jwt: true`, files = repo); **no secrets set** (the owner sets them —
an automated attempt was refused), so it answers 500 `misconfigured` to authenticated calls and 401 without a key.
Migration `20261031150000` applied. No cron job on staging (none before either). Logic tests run against staging data
with `supabase/tests/vaccine_reminder_staging.mts` (local mock push service; see the file header).

## 5. Behaviour to verify (test accounts only)
| Check | How | Expected |
|---|---|---|
| Timezone | `vaccine_reminder_staging.mts` (dry run with `as_of` around Bangkok midnight) | window = Bangkok today + tomorrow; 00:00 BKK = 17:00 UTC the day before |
| Opt-in | `/profile/settings` toggle on | one `push_subscriptions` row for the device |
| Opt-out | toggle off | row deleted, no further notifications |
| Duplicate run / retry | run twice the same day, or after a partial failure | devices already sent to are skipped (`already_sent_skipped`); only failed ones are retried |
| Expired subscription | push service 404/410 | subscription row (and its send-log rows) deleted, `expired_removed` > 0 |
| Click target | click notification | opens `/pets/<id>/vaccines` (or `/pets/vaccines/all` for several pets) |
| Permission | only the pet's current `pets.user_id` gets it | after a transfer, the new owner receives reminders, the old owner does not |

Known limits: farm members other than the owner do not receive farm pet reminders; LINE/email reminders have no
scheduler caller yet; a claim left in `sending` (crash after the push, before recording) is not re-sent automatically —
it is reported as `stuck_claims` (prefer a missed reminder over a duplicate).
