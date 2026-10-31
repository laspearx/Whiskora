# Notifications — setup & verification (staging first)

Status 2026-10-29 (updated 2026-10-31 for the vaccine reminder fix): no vaccine reminder push was sent **on the days whose logs were checked** (see §4); other days and the time before the available logs are not checked. Do every step on staging with test accounts before production. Never paste secret values into Git, tickets or chat.

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
or change the function, and the function deploy does not need a Vercel deploy.

**Production since 2026-10-31 11:11 UTC (v1.8.1):** function **v6** (`verify_jwt: true`, `CRON_SECRET` set, VAPID pair unchanged and matching the web key), migration `20261031110929`, Vault `cron_secret` + `functions_anon_key`, cron job 1 command with Vault headers and **`active = false`** — dry-run verified, no scheduled sends. Steps 0–6 below are done; step 7 starts with re-enabling the job (separate approval). Details: `docs/STATUS.md`.

**Production state before (2026-10-31, read-only):** function v5 (older code than the repo), **`verify_jwt = false` and no
secret check** → anyone with the URL can trigger a run. Cron job 1 (`0 1 * * *`) posts with **no** `Authorization` /
`x-cron-secret`. 0 push subscriptions *today*. What the evidence shows about sends — and what it does not:
- Sampled log days 2026-08-20, 09-15, 10-28, 10-31: one function call at ~01:00 UTC (cron) and the vaccines query
  answered **400** → by the v5 code that run returned before sending. 10-01: one call at 01:00 (the query result was not
  checked that day). `net._http_response` keeps 6 h only: the one row left (10-31) is 200 `{"sent":0}`.
- **Not shown:** days that were not sampled, anything before the logs we can query, and how many subscriptions existed
  in the past (today's 0 says nothing about earlier days). Other callers of the open URL would have hit the same failing
  query on the checked days, but that is not proof for unchecked days.

### Behaviour of the new function (`supabase/functions/send-push-notifications/`)
- POST only; `CRON_SECRET` required (missing → 500 `misconfigured`, never open); wrong/missing `x-cron-secret` → 401;
  deployed **with** JWT verification (gateway: no key / bad JWT → 401).
- Batched reads (vaccines in the Bangkok today+tomorrow window, paged → pets by id → subscriptions by user id); no embed;
  vaccine rows whose pet no longer exists are skipped and only counted (`orphan_skipped`).
- Send log `vaccine_reminder_deliveries` (migration `20261031150000`), one row per (subscription, vaccine, next_due),
  claimed **before** the push:

| Push result | Examples | Claim | Retried by a later run? |
|---|---|---|---|
| accepted | 201 | `sent` | no |
| expired | 404 / 410 | subscription deleted (rows cascade) | no |
| clear failure | any other HTTP status (429, 500, 400 …); request could not be built (bad keys); connection refused / DNS / TLS before sending | released (deleted) | **yes** |
| uncertain | no answer: timeout (in Deno a `TypeError` after our 10 s timeout), connection lost after sending, unrecognised error | `uncertain` | **no** — a person decides |
| crash between push and record | — | stays `sending` (`stuck_claims` after 15 min) | **no** |

- Statuses: 200 = `no_due` / `no_recipients` / `no_subscriptions` / `already_sent` / `sent`; **502** = any failed or
  uncertain push (`partial_failure` / `failed` / `uncertain`, with `failed_status` / `uncertain_reason` counts);
  500 = `query_failed` + `stage` + code, or `internal_error`. `{"dry_run": true}` (optionally `"as_of"`) reads only.
- Logs and bodies: counts, stage names, SQLSTATE / PGRST codes, error **type** names — never error messages, pet names,
  user ids, endpoints or keys (tested with errors that carry such text).
- Limits: de-duplication is per subscription (device); a user who re-subscribes gets a new subscription and may get the
  same reminder again. Uncertain / stuck rows mean a reminder may be **missed** rather than sent twice. In Deno a refused
  connection may also surface as a code-less `TypeError` → counted as uncertain (not retried) rather than as a clear failure.

### Production order (each step its own approval; Vercel untouched)
0. Precheck (read-only): `supabase/tests/vaccine_reminder_precheck.sql` → `before`, checks 2/5 ok; 6 = WARN (expected).
1. Apply `supabase/migrations/20261031150000_vaccine_reminder_deliveries.sql` (sha256 in the PR) in one transaction,
   recorded in `supabase_migrations.schema_migrations`. Re-run precheck → `after`, check 3 ok. Harmless to the old function.
2. Owner sets function secrets in the Supabase dashboard (never in Git / chat): `CRON_SECRET` (new random ≥ 32 chars),
   `VAPID_PUBLIC_KEY` (= Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY` of Production), `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`.
   The old function ignores them.
3. Owner stores the same values for cron in Vault (SQL editor; parameter values are not logged, but never put a
   secret literally into a cron command — `cron.log_statement = on` writes the command text to the Postgres log):
   `select vault.create_secret('<CRON_SECRET>', 'cron_secret');` and
   `select vault.create_secret('<production anon JWT>', 'functions_anon_key');` → precheck 7 = `2 / 2`.
4. **Before** the new function goes live, change **only the command** of cron job 1 (schedule stays `0 1 * * *`):
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
   Precheck 5/6 → ok. The old function ignores the headers. **If step 5 ran first, every cron call would get 401**
   (shown on staging: a call without headers → 401).
5. Deploy the function **with** JWT verification: `supabase functions deploy send-push-notifications --project-ref vhudldcizmbpujedojei`
   (no `--no-verify-jwt`). Files: `index.ts`, `handler.ts`, `reminders.ts` (sha256 in the PR).
6. Post-deploy checks (re-check `select count(*) from push_subscriptions` first; if > 0, only the dry run below):
   - `curl -X POST <url>` → 401; anon key without secret → 401; GET → 405.
   - anon key + secret, `{"dry_run": true}` → 200 `would_send` / `no_due` with counts; send log unchanged.
   - `get_edge_function`: `verify_jwt: true`, files = the reviewed ones.
7. Monitoring the daily run — **`cron.job_run_details` "succeeded" is not evidence of a send**: it only means the SQL
   ran and the HTTP request was queued (shown on staging: a run with a wrong secret is "succeeded" while the function
   answered 401). Evidence, in this order:
   - `net._http_response` for the run: `status_code` and the body's `outcome` / counts. **`pg_net.ttl` = 6 h** → check
     before ~07:00 UTC, or rely on the next item.
   - Function log line `{"fn":"send-push-notifications","summary":{…}}` (and `stage` lines on errors).
   - `vaccine_reminder_deliveries` by status (precheck 11): `uncertain` / old `sending` rows need a person.
   Handling `uncertain` / stuck rows (manual, after checking with the user / device if possible): leave them (no resend),
   or delete the specific rows to allow one more attempt on the next run.
8. If something fails: pause only this job — `select cron.alter_job(job_id := 1, active := false);` — and fix forward.
   Do **not** redeploy v5, do **not** turn `verify_jwt` off, do **not** drop the send log. Nothing to revert in Vercel.

Not in scope: back-filling missed reminders, LINE / email reminders, the FK `vaccines.pet_id → pets`
(`docs/PROPOSAL_VACCINE_PET_FK.md`), the 3 orphan vaccine rows on production (kept as they are).

**Scheduled sends ON since 2026-10-31 12:37:56 UTC** (cron job 1 `active = true`, `0 1 * * *`, Vault headers;
function v8 = `main` after PR #17, v1.9.0). First run 2026-11-01 01:00 UTC. Check each run within 6 h with
`supabase/tests/vaccine_reminder_run_check.sql` (HTTP status + outcome from `net._http_response`, send-log statuses)
and the function summary log. Display verified on Chrome / Windows only.

**Real push QA on production — done 2026-10-31 (PR #17 QA mode):** one account (QA stranger), one device (Chrome on
Windows), test vaccine on QA pet 175; `{"qa_only_user_id": "<uuid>"}` → only that user, 409 unless exactly one
subscription, title `[ทดสอบ]`. Round 2 seen + clicked through to `/pets/175/vaccines`; everything removed afterwards
(see `docs/STATUS.md`). Turning cron job 1 on is the next, separate approval.

**Earlier proposal — staging browser push QA (not done):** one QA account, one device, one message.
- Today every Preview has push switched off (`web/lib/push-client.ts`, `isPreviewDeploy` → no VAPID key). Keep that.
- Separate, limited channel: a dedicated QA branch whose Vercel Preview env (branch-scoped, that branch only) holds the
  **staging** VAPID public key and a QA flag; a small code change lets push subscribe only when both are present and
  refuses the production key. General Previews stay without push; no production key on any Preview.
- Run: QA account subscribes on that Preview (staging) → one synthetic staging vaccine due → one non-dry run of the
  staging function → notification seen and clicked (`/pets/<id>/vaccines`) → unsubscribe in the app → subscription row
  and send-log rows gone → remove the vaccine row, the QA branch env and the branch.
- This sends one real push through the browser vendor's push service to that one device. VAPID pair check for
  production (private key ↔ web key) is only provable by a real push; same approval question for production later.

### Staging state (2026-10-31)
- `send-push-notifications` v6, `verify_jwt: true`; owner set `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
  (staging test values, not production). Migration `20261031150000` applied (with `uncertain`).
- `qa-push-mock` (staging-only mock push endpoint, `verify_jwt: false`, answers only tags listed in
  `qa_push_mock_modes`, else 404). Tables `qa_push_mock_modes` / `qa_push_mock_hits` (empty).
  **To remove it:** Supabase Dashboard → project **whiskora-staging** (`wpxcukrwmegwzfccbbga`) → Edge Functions →
  `qa-push-mock` → … menu / Settings → **Delete function** → confirm the name. Then SQL editor (staging):
  `drop table public.qa_push_mock_hits, public.qa_push_mock_modes;`. Re-create from `supabase/tests/staging_only/` when needed.
- No cron job, no Vault secret, no push subscription, no synthetic rows left (checked after the runs).
- Tests: `supabase/tests/vaccine_reminder_deployed_staging.cjs` (deployed function + pg_net + pg_cron, mock only),
  `vaccine_reminder_staging.mts` (local logic harness), `vaccine_reminder_unit.test.mts`.

## 5. Behaviour to verify (test accounts only)
| Check | How | Expected |
|---|---|---|
| Timezone | `vaccine_reminder_staging.mts` (dry run with `as_of` around Bangkok midnight) | window = Bangkok today + tomorrow; 00:00 BKK = 17:00 UTC the day before |
| Opt-in | `/profile/settings` toggle on | one `push_subscriptions` row for the device |
| Opt-out | toggle off | row deleted, no further notifications |
| Duplicate run / retry | run twice the same day, or after a partial failure | devices already sent to are skipped (`already_sent_skipped`); only clear failures are retried; uncertain ones are not |
| Expired subscription | push service 404/410 | subscription row (and its send-log rows) deleted, `expired_removed` > 0 |
| Click target | click notification | opens `/pets/<id>/vaccines` (or `/pets/vaccines/all` for several pets) |
| Permission | only the pet's current `pets.user_id` gets it | after a transfer, the new owner receives reminders, the old owner does not |

Known limits: farm members other than the owner do not receive farm pet reminders; LINE/email reminders have no
scheduler caller yet; see the limits under §4 (per-device de-duplication, uncertain → possibly missed, not duplicated).
