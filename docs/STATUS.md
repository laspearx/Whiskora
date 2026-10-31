# Production status — 2026-10-29 (UTC)

Snapshot at end of day. No secrets, tokens or personal data in this file; counts are aggregates.

## Live
| | |
| --- | --- |
| App | **v1.5.0**, `74391b7` (bot version bump) on top of merge `0d21314` (PR #8). Live on `https://www.whiskora.pet` since ~19:33 UTC (Vercel production) |
| Tested code | `web/` of `0d21314` = tree `c14e7444a8b6` = `45f6071`; `74391b7` differs only in `web/package.json` version and `web/lib/version.ts` |
| Bundle | contains the production Supabase ref only (no staging ref) |
| Database | unchanged by the deploy: 62 migrations, latest `20261029130713` (role hotfix). `privacy_precheck.sql` → all ok, `state: before` |

## Changed on production today
1. ~13:08 UTC — role hotfix `20261029050000_hotfix_profile_role_guard.sql` (trigger blocks API users from changing `profiles.role`).
2. ~19:31–19:33 UTC — app deploy of PR #8 (`0d21314`, then `74391b7`).
3. Owner, Supabase Auth → URL Configuration:
   - Site URL `https://whiskora.vercel.app` (**a third-party site**, not Whiskora) → `https://www.whiskora.pet`.
   - Redirect URLs reduced to `https://www.whiskora.pet/**` (removed `https://*.vercel.app/**`, the third-party host, localhost, apex).
   - Verified with an invalid-token `/auth/v1/verify` probe (Location header only, never followed): still open at
     19:41:54 UTC, **closed at 19:49:59 UTC** — every non-`www.whiskora.pet` target now falls back to the Site URL;
     `www.whiskora.pet/auth/callback?...` still accepted.

## Tests
| Check | Result |
| --- | --- |
| Staging, production-equal schema (before privacy migration), clean build of `45f6071` | API 80 pass / 24 expected fails; E2E 50/50 |
| Staging after privacy migration | API 107/0; E2E 50/50; postcheck 16/16 |
| Production public smoke (`e2e/public.spec.ts`) on v1.5.0 | 18/18 |
| Production Supabase edge logs after deploy | all 200, no 4xx/5xx, no `42501` |
| Owner manual login | LINE (owner's own admin account, 2026-10-30): login, profile data intact, save + restore, own pet health — **ok**. Email and Google: **not tested** |
| Email-confirmation signup | not testable: Confirm email is OFF (`mailer_autoconfirm: true`); policy unchanged by decision |

## 2026-10-31 — PR #15 deployed (v1.8.0) + transfer access reset on production (UTC; ICT = UTC+7)
| Step | Result |
| --- | --- |
| Pre-merge | PR head `0100fcb87044160a17b4f2ada778bab9fdd60718`; `supabase/` identical to tested `28fe91d` (later commit docs only); no `web/` change vs main `7ab3cdc`; migration sha256 `b3d7ed9f…af63`; no other PR included |
| Precheck (read-only) 08:18:56 | `transfer_access_reset_precheck.sql`: `before`, all ok, no STOP / WARN (0 pending / accepted transfers, 0 co-owners, 0 grants, 0 per-pet settings, 0 farm viewers, 0 weight rows by others); `pet_privacy_precheck.sql` still `after` |
| Merge | 08:19:05, pinned → `78ccd7a`; bot bump `07a01cf` **v1.8.0** (version files only) |
| Deploy | Production `07a01cf` (`whiskora-731e680xk`, Vercel Production env build; no Preview promoted); bundle 08:21:46: production ref 1, staging 0, `1.8.0` |
| Precheck again 08:21:56 | `before`, all ok |
| **Migration** | `20261031082206 transfer_access_reset` applied **08:22:06** (only this file, one transaction incl. the `schema_migrations` row; bytes checked before sending); stored statement sha256 = `b3d7ed9f3189612edff77291bd9fb0bbaea0ae4876c4997f4dd89a8742a1af63` |
| Postcheck catalog 08:22:13 | precheck `after`, all ok; catalog vs staging **identical** (39 lines: md5 + security definer + ACL of 9 functions, policies on `pet_weights` / history / `pet_co_owners` / `access_grants` / `pet_visibility_settings`, trigger definitions, history table columns / indexes / constraints / grants: authenticated SELECT only, anon none, RLS on). `pet_privacy_precheck.sql` still `after`. `reservation_precheck.sql` check 3 showed STOP only because it pinned the old trigger body (intended change; other 4 bodies unchanged; new body = staging) → file updated to accept the successor md5, re-run ok |
| QA HTTP 08:23:21–22 (QA stranger = owner of QA pet 175, QA admin = role user, anon) | **29 / 29**: owner inserts / reads / edits / deletes a test weight row on 175; recorder cannot be changed (403); insert in someone else's name 403; other user insert 403, edit 0 rows, read 0 rows; anon insert 401; rows of 175 back to the original set (0). History: anon 401, other user 0 rows, API insert / update / delete 403. Non-owner co-owner / grant / tier write on 175 → 403 (nothing created). Privacy: pedigree columns 403, `access_grants` column UPDATE 403, other user no health / weight, owner health 1 row, anon private column 401. Transfer: inbox 200, `respond_pet_transfer` missing id → P0002, direct PATCH 0 rows. Global logout 204 ×2 |
| QA browser 08:22–08:23 | edit pet 175 save → reload → restore (pedigree / health / card identical); `/pets/175`, `/pets/175/weight`, `/profile/transfers`, `/p/175` + tree, farm-hub, a farm page: load, 0 Supabase errors, only the production host |
| Data after | weights 49 total / 0 on 175 (as before), co-owners / grants / per-pet settings / history / transfers all 0, QA sessions 0, QA roles user, admins 1 |
| Logs 08:15–08:24 | every ≥ 400 / ERROR = the QA probes above (UA `node`); PostgREST schema reload at 08:22; no browser / customer errors |

**Proven on staging only (not on production):** a real accept with co-owners / grants / tiers / weights, the farm-team
cases, multi-hop chains, double / parallel accept, rollback and the race guard (no real transfer, co-owner or grant was
created on production). Note: a non-owner's co-owner / grant / tier write is refused by the race-guard trigger with the
message "pet ownership changed" (403) before the RLS check — correct outcome, wording could be clearer.
Recovery: fix forward; never re-add "Users manage own pet weights", never restore co-owners / grants by script, never
disable the race guard or the revoke-only trigger, never run the staging-only revert on production; to pause transfers
use `supabase/emergency/reservation_transfer_freeze.sql`.

## 2026-10-31 — Transfer access reset (branch `feat/transfer-access-reset`; staging results — live since v1.8.0)
Migration `20261031120000_transfer_access_reset.sql` sha256 `b3d7ed9f3189612edff77291bd9fb0bbaea0ae4876c4997f4dd89a8742a1af63`.
Same trigger `trg_sync_pet_owner_on_transfer_accept` / same `respond_pet_transfer` transaction; lock order kept
(pets → reservations → transfer, then co-owners / grants / settings — nothing locks those first and then pets).
| On accept | Rule |
| --- | --- |
| co-owners | deleted; one history row each (`pet_transfer_access_revocations`, kind `co_owner`, transfer id, added_by/at) |
| access grants on the pet | active (`revoked_at is null`, incl. expired) → revoked via the v1.7.1 revoke-only trigger (not disabled, no table UPDATE given back); rows kept; history `access_grant` |
| per-pet tiers | every group except overview → `owner`, include_previous_owner false; `private` stays `private`; old rows in history `visibility_setting`; overview + `pets.is_public` kept |
| `owner` tier = | current owner + co-owners the new owner adds + farm team of the pet's current farm (none right after a transfer: farm_id cleared) + platform admin; previous owners only with include_previous_owner; grants do not open `owner` groups (they count for `engaged`) |
| previous owner | receivers of earlier transfers **and** senders of accepted transfers (seller); no access unless the new owner enables include_previous_owner |
| weights | read / write: owner, co-owner, farm owner / manager / staff, admin (viewer read-only via the tier rule); insert only as yourself; recorder `user_id` and `pet_id` cannot be changed (trigger). Closes: any signed-in user could insert weights for any pet |
| race guard | inserts into `pet_co_owners` / `access_grants` lock the pet row FOR SHARE and re-check ownership with fresh data; `pet_visibility_settings` writes re-check without a lock |
| repeat / parallel accept | no-op (status check after lock); history unique per transfer + subject |
| not changed | `pet-documents` files (stay in the old owner's folder — private-files PR), appointments (stay with their creator), grant DELETE, privacy UI |

| Suite (staging / Preview) | Before (current production catalog) | After |
| --- | --- | --- |
| `transfer_access_reset_checks.cjs` — failed/declined accepts keep everything; accept of a farm pet: old owner, co-owner, farm manager/staff/viewer, grantee have nothing (row, groups, health, weights, vaccines); new owner reads/edits/deletes/records weights, cannot take over the recorder; tiers; history; old owner cannot add co-owner / grant / tier afterwards; re-grant by the new owner (co-owner, engaged + grant, previous-owner health for the seller); chain 01 → 05 → 06 → 01; double click; history table access | 41 / **43 failed** | **84 / 84** |
| `transfer_access_race_staging.cjs` — rollback (error / ROLLBACK after accept), races co-owner / grant / tier × both orders, double accept in two sessions | without the guard triggers: **5 of 6 races left access behind** | **10 / 10**, stress 45 runs 0 left-over, 0 deadlocks |
| `pet_privacy_checks.cjs --transfer` (INFO lines are now assertions) | — | **128 / 128** |
| `reservation_api_checks.cjs` / `reservation_concurrency_staging.cjs` | — | 53 / 53; timed 6 + stress 45, 0 inconsistent, 0 deadlocks |
| E2E, real Preview `whiskora-ilwog9uec` (`28fe91d`, staging env, protection kept), 07:46–07:53 + 07:54 UTC | — | **58 / 58** (56 + the 2 private-listed tests run with `E2E_PRIVATE_LISTED_PET_ID=900006`); UI accepts of P4/P5 wrote 9 owner rows each |
| `transfer_access_reset_precheck.sql` | staging + **production (read-only, 07:38 UTC)**: `before`, all ok, no WARN (production: 0 pending transfers, 0 co-owners, 0 grants, 0 per-pet settings, 0 accepted transfers, 0 farm viewers, 0 weight rows by others) | staging `after`, all ok |
| Staging-only revert → re-apply | function md5 after revert = production | ok |

## 2026-10-31 — PR #18 rollout (v1.10.0): send-log history on production; cron job 1 re-enabled (UTC)
| Step | Result |
| --- | --- |
| Pin | PR #18 head `64dc4420757ca790e548f548ca4c3460e0e2286b`; function files = deployed-staging 33/33 set (unchanged since `8c5aea9`); migration sha256 = guard-test 9/9 set |
| Merge | `d12d1dd` → bot `fa447fb` **v1.10.0** (version files only); Vercel Production v1.10.0: bundle production ref 1, staging ref 0, VAPID key unchanged. Merge did not deploy the function |
| Pause | cron job 1 `active = false` 12:58:59 (schedule `0 1 * * *`, command md5 `e7a6a301…` unchanged); in flight: 0 running cron runs, `net.http_request_queue` 0, no function request since 12:40 |
| Precheck right before | 12 = `before`, **13 = ok, 14 = ok**, all other checks ok; rows: send log 0, subscriptions 0, vaccines 45 |
| Migration | **`20261031125922` `vaccine_reminder_delivery_history`** 12:59:23, one transaction; file + stored statement sha256 `a9be8c5e2a11b6dbc03379076dad42ead2857f1cd2130ad98898b4c8b3b35abb`. The apply script first recorded the name as `vaccine_reminder_deliveries` (copied from the previous run); corrected to `vaccine_reminder_delivery_history` on that one `schema_migrations` row (statement unchanged) |
| Function | production **v9**, `verify_jwt: true`, `ezbr_sha256 438346bff5fec2bb8f179ceca1ad87c0ce7b2571c782aa8e96f12c013d66f6d1` = staging v8 (deployed-staging 33/33). Secrets / VAPID untouched. Old function never ran against the new shape (job paused, no calls in between) |
| Checks with the job paused | precheck 12 = `after ok`, 13/14 ok; catalog: user_id / endpoint_hash NOT NULL, hex check, unique (user_id, endpoint_hash, vaccine_id, next_due), subscription FK ON DELETE SET NULL, user FK cascade, RLS on, 0 policies, 0 API grants; rows before = after = 0 (nothing to back-fill); dry-run postcheck **9/9** (HTTP + pg_net with Vault headers); as_of dry runs 2026-09-18 → `no_subscriptions`, 2027-01-27 → `no_recipients` (orphan 1 skipped); send log 0 rows, subscriptions 0 afterwards |
| **Re-enabled** | cron job 1 `active = true` **13:01:52 UTC**, schedule + command unchanged. **Next run 2026-11-01 01:00 UTC (08:00 ICT)** — check before 07:00 UTC (14:00 ICT) with `vaccine_reminder_run_check.sql` + function summary log; nobody watches it automatically |

## 2026-10-31 — Send-log history across unsubscribe / resubscribe (PR #18; staging results — on production since v1.10.0)
| Item | Result |
| --- | --- |
| Migration `20261101090000_vaccine_reminder_delivery_history.sql` (sha256 `a9be8c5e2a11b6dbc03379076dad42ead2857f1cd2130ad98898b4c8b3b35abb`) | staging only. **No automatic delete:** after the back-fill it raises P0001 (counts only) and the whole transaction rolls back if any row cannot be back-filled or would collide on the new key (precheck 13 / 14 report the same). Rows get `user_id` + `endpoint_hash` (SHA-256 hex, not the endpoint); `subscription_id` nullable, **ON DELETE SET NULL**; unique (user_id, endpoint_hash, vaccine_id, next_due); `user_id → auth.users ON DELETE CASCADE`; RLS / ACL unchanged. **Not on production** |
| Function (staging v8, `ezbr 438346bf…`) | de-duplicates on user + endpoint hash; 404/410 releases its claims (no stuck rows now that rows survive); retention: rows > 90 days past `next_due` pruned on every non-dry, non-refused run (best effort, `pruned` count) |
| Tests | unit 8/8 (incl. JS hash = SQL `encode(digest(…,'sha256'),'hex')`); local harness **65/65**; deployed staging **33/33** (function logic unchanged since); migration guard `staging_only/20261101090000_migration_guard_test_STAGING_ONLY.cjs` **9/9**: un-back-fillable row → P0001 "1 row(s)…", rows (2) + schema unchanged; key collision → P0001 "1 key group(s)…", rows + schema unchanged; good data → applied, back-filled (hash = function hash), history kept after subscription delete |
| Behaviour proven | unsubscribe keeps history (subscription_id null); resubscribe with the **same endpoint** → not re-sent; **new endpoint** → sent again (an endpoint hash cannot prove the same device — documented); another account on the same endpoint (shared browser / pet transferred) is **not** blocked; retention prunes 100-day-old rows, keeps 30-day-old, not on dry runs |
| Rollout plan | see `docs/NOTIFICATIONS_SETUP.md` §4 "Send-log history rollout": pause job 1 → confirm no run in flight → migration + matching function → dry run + catalog → only then propose re-enabling. Stuck half-way → keep job 1 paused, fix forward |

## 2026-10-31 — PR #17 merged (v1.9.0) + vaccine reminder cron job 1 ENABLED (UTC)
| Step | Result |
| --- | --- |
| Pin + merge | PR #17 head `864c31286d7a5a323cd5582e78c877fc41f3e89b` (function files = production v8 / staging v7, `ezbr_sha256 cdb4061a…`); merge `6b009f0` → bot `15d01cc` **v1.9.0**; Vercel Production v1.9.0: bundle production ref 1, staging ref 0, VAPID public key unchanged. **Edge Function not redeployed** (running v8 = merged files) |
| Precheck / postcheck 12:37 | precheck `after`, all ok (Vault headers, schedule, RLS/ACL); dry-run postcheck **9/9**; cron command uses Vault, no literal secret (md5 `e7a6a301…`); QA test vaccines 0, QA subscriptions 0, subscriptions 0, send log 0, vaccines 45, migrations latest `20261031110929` |
| **Enabled** | cron job 1 `active = true` at **2026-10-31 12:37:56 UTC**; schedule `0 1 * * *`, command unchanged. No manual send, no back-fill, no QA data |
| **First scheduled run** | **2026-11-01 01:00 UTC (08:00 ICT)**. Check between 01:00 and 07:00 UTC (pg_net TTL 6 h) with `supabase/tests/vaccine_reminder_run_check.sql` + the function summary log + send-log statuses — not cron "succeeded". With 0 subscriptions today the expected outcome is `no_due` / `no_subscriptions` (HTTP 200) unless users subscribe before then. Nobody watches this automatically: it has to be requested |
| If it fails | pause only job 1 (`cron.alter_job(1, active := false)`), fix forward; never v5, never `verify_jwt` off, never delete send-log rows to force a retry |
| Limits | real display verified on **Chrome / Windows only** (FCM); Android, macOS, Firefox, Safari / iOS not verified. Send-log history is lost on unsubscribe (follow-up PR on staging) |

## 2026-10-31 — Real push QA on production (PR #17 QA mode; one account, one device; cron stays inactive; UTC)
| Step | Result |
| --- | --- |
| QA mode | PR #17 (`qa_only_user_id`: keeps only that user's items, 409 unless exactly 1 subscription, title `[ทดสอบ]`, own tag). Staging v7 deployed-staging **29/29** (QA dry run: 1 recipient / 1 device computed, **0 pushes, 0 send-log rows, 0 mock requests**). Production **v8**, `verify_jwt: true`, `ezbr_sha256 cdb4061a25dbd39e75d8e09c03c2ae81f7f5e5d67c6b9657181677ab2d638c4a` = staging v7; dry-run postcheck 9/9 |
| Guard on production | QA dry run before the device was ready → 409 `qa_guard_failed` (subscriptions 0) |
| Round 1 | test vaccine #1 on QA pet 175 (owner QA stranger), due 2026-10-31. Owner subscribed Chrome on Windows (11:46:32); total subscriptions 1. QA dry run would_send 1/1 → **one QA send 11:47:14 → 200 `sent: 1`** (FCM accepted), send-log `sent` 11:47:15. **Not seen on the device**: Windows had Chrome notifications turned off |
| Between rounds | owner turned Windows notifications on and toggled the app switch → app deleted the subscription (12:11:23) and created a new one (12:11:27). **The round-1 send-log row was deleted with it (ON DELETE CASCADE)** — round-1 evidence kept here and in the function log (summary `sent` 11:47:15) |
| Round 2 (owner approved one more send) | test vaccine #1 removed, test vaccine #2 added (only due item); QA dry run: due 1, recipients 1, 1 device → **one QA send 12:26:13 → 200 `sent: 1`**, send-log `sent` 12:26:14 (FCM). **Owner confirmed: notification seen, click opened `/pets/175/vaccines`** → production VAPID pair works end to end |
| Unsubscribe + clean-up 12:30 | owner switched notifications off → subscriptions 0, send log 0 (cascade); test vaccine #2 removed → pet 175 has 0 vaccines, pet row md5 and `is_public` unchanged; vaccines 45 (as before), orphan rows 3 (untouched) |
| Function log 11:39–12:31 | 2 sending runs, both QA mode (11:47:15, 12:26:14); everything else dry runs / 409; no other caller; counts only |
| State | cron job 1 **inactive** (schedule `0 1 * * *`); no scheduled sends; nothing sent to anyone else; no back-fill |

**Follow-up (separate task, not fixed):** send-log rows are deleted when a subscription is deleted (`ON DELETE CASCADE`):
history is lost on unsubscribe, and a user who switches notifications off and on the same day can receive the same
reminder again (new subscription id). Option for a later migration: keep rows with `subscription_id ON DELETE SET NULL`
plus an endpoint hash, and de-duplicate on the hash.

## 2026-10-31 — PR #16 rollout (v1.8.1): new vaccine reminder function on production — installed, dry-run verified, **NOT sending** (UTC)
| Step | Result |
| --- | --- |
| Pin | PR head `44d7b21e5b9421ad0f34e78b4b669f71dbf5f794` on main `07a01cf`; function files + migration sha256 = the deployed-staging set; no `web/` change |
| Precheck (read-only, 11:06) | no STOP; WARN 6 only (cron without headers — allowed fix); subscriptions 0, Vault 0, orphan rows 3 (untouched) |
| Merge | `5cabae6` → bot `881d1c7` **v1.8.1** (version files only). Vercel Production v1.8.1: bundle production ref 1, staging ref 0. **The merge did not deploy the Edge Function** |
| Cron job 1 | recorded (schedule `0 1 * * *`, command posted with no headers, active=true) → **`active = false`** 11:09:16; schedule unchanged |
| Migration | **`20261031110929` `vaccine_reminder_deliveries`** 11:09:29, one transaction; file + stored statement sha256 `86d9dba318b1bdaae6b818058c20908924c9259e5ffb32bbd78debbf64199a8b`; RLS on, 0 policies, no anon/authenticated grants |
| Vault + cron command | Vault was empty → created `cron_secret` (new production value, not staging's) + `functions_anon_key` (production anon JWT), values as query parameters; job 1 command now builds `Authorization` + `x-cron-secret` from Vault (no literal secret; md5 `e7a6a301…`); still inactive |
| Function deploy | production **v6**, `verify_jwt: true`, `ezbr_sha256 cb1a5a922435a28cc6afc5657222f48f5f041e749a6a766b97ea7745a23376c7` = staging v6 (deployed-staging 25/25). Old v5 (open, no secret) replaced 11:11:51 |
| Secrets | owner set `CRON_SECRET`; `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` already present, owner confirmed the public key digest matches the web Production key (sha256 `a6200242…abe65`); no new VAPID pair |
| Before the secret (11:12) | no key 401, bad JWT 401, anon JWT → 500 `misconfigured` (fail closed), GET 405 |
| Postcheck `vaccine_reminder_prod_postcheck.cjs` 11:25:28–11:25:41 | **9/9** — every authenticated call `dry_run: true`. HTTP: no key / bad JWT / no secret / wrong secret 401, GET 405, `as_of` without dry_run 400; dry run 200 `no_due`. pg_net with the cron job's Vault headers: none / JWT only / wrong secret 401, cron headers + dry run **200** (read from `net._http_response`). Send log 0 rows before and after, subscriptions unchanged (0), cron job 1 inactive, table RLS/ACL ok, anon API read 401 |
| Extra dry runs (as_of, 11:26) | 2026-09-18 → 200 `no_subscriptions` (due 1, recipients 1: vaccines → pets → subscriptions all read); 2027-01-27 → 200 `no_recipients` (due 1, **orphan_skipped 1**). Send log still 0 rows |
| Function logs 11:08–11:30 | only our probes; summary lines with counts; config line naming the missing secret before it was set; no PGRST200, no names / ids / endpoints |
| **State now** | installed and verified by dry run; **cron job 1 inactive — no scheduled sends**; no push sent; no back-fill; FK not added; orphans untouched |

To start scheduled sends later (separate approval): re-run `vaccine_reminder_precheck.sql` + the postcheck, then
`select cron.alter_job(job_id := 1, active := true);`, then check the first run with `net._http_response` (≤ 6 h) +
the function summary log — not cron "succeeded". Real-push QA: proposal only (`docs/NOTIFICATIONS_SETUP.md` §4).

## 2026-10-31 — Vaccine reminder fix (PR #16, branch `fix/vaccine-reminders`; staging results — on production since v1.8.1, not sending)
| Item | Result |
| --- | --- |
| Production (read-only) | function **v5** = older code than the repo, **`verify_jwt: false`, no secret check** → callable by anyone with the URL; cron job 1 `0 1 * * *` posts with no auth headers; 0 subscriptions today; Vault 0 secrets; `pg_net.ttl` 6 h, `cron.log_statement` on |
| What we can say about past sends | sampled log days 08-20, 09-15, 10-28, 10-31: 1 call at ~01:00 and vaccines query **400** → no send on those runs (v5 code returns first); 10-01: 1 call (query result not checked). **Not checked:** other days, time before available logs, past subscription counts (today's 0 is not evidence for earlier days) |
| Function | `index.ts` (Deno wiring) + `handler.ts` (logic, injectable) + `reminders.ts` (pure). Batched paged reads, no embed; orphans skipped + counted; POST only; `CRON_SECRET` required; push results: clear failure → released + retried later, **uncertain (no answer) → kept as `uncertain`, not retried**; 200 / 502 / 500; logs = counts, stage, sanitised codes, error type names only |
| Migration `20261031150000_vaccine_reminder_deliveries.sql` | sha256 `86d9dba318b1bdaae6b818058c20908924c9259e5ffb32bbd78debbf64199a8b`; staging re-applied 10:04:57 UTC (status `sending` / `sent` / `uncertain`); RLS on, 0 policies, no anon/authenticated grants |
| Unit (`vaccine_reminder_unit.test.mts`) | **6/6** — Bangkok dates; payload; push result classes (incl. Deno `TypeError` at our timeout → timeout); request built before sending; log hygiene |
| Local harness (`vaccine_reminder_staging.mts`) | **51/51** — staging data as service role via an adapter, local HTTPS mock: auth, Thai dates, no_due / no_subscriptions, send + same-day re-run, 500/429 retry only the failed, item added later, 404/410, refused / 400 / bad keys = clear (released), **received-then-connection-cut + no answer = uncertain, next run sends nothing to them**, each query stage → 500, record failure, 2 concurrent runs × 10, owner change, poisoned errors (endpoint / email / user id / key in message, details, code, throw) → nothing in logs or bodies; real PostgREST: old embed PGRST200 |
| **Deployed staging (`vaccine_reminder_deployed_staging.cjs`)** 10:55:27–10:57:09 UTC, function v6 + owner-set test secrets, pushes only to `qa-push-mock` | **25/25** — no key 401 (gateway), bad JWT 401, valid JWT without / wrong secret 401, GET 405; dry run 200 `would_send` (due 6, orphan 1, no-owner 1) + as_of 23:59:59 BKK; dry runs wrote 0 rows, 0 mock hits; real run 200 sent 3 (mock: 1 encrypted VAPID-signed push per device) and **send log written through PostgREST as service role**; re-run 0 pushes; 500/429 → 502, retry sends only those; 410 → subscription deleted; mock receives then never answers → uncertain (timeout), kept, next run 0 pushes; real DB error (service role SELECT on pets revoked for the test, restored exactly) → 500 `pets` 42501; **pg_net like cron**: no headers 401, JWT only 401, wrong secret 401, planned Vault headers + dry run 200 (0 rows / 0 hits), planned headers real run 200 sent 3; **pg_cron**: a job with a wrong secret ran "succeeded" while the function answered 401; dry-run job "succeeded" + 200 |
| First deployed run (v2 code) | 24/25: in Deno the timeout error is a code-less `TypeError` → labelled `unknown` (still kept as uncertain, no resend). Fixed: elapsed ≥ timeout → `timeout`; unrecognised errors log their type + code only. Re-run 25/25 |
| Logs of the deployed runs (function_logs 10:51–10:58) | only summary / stage lines with counts, stage names, `42501`, `TypeError`; no names, user ids, endpoints, keys |
| Clean-up (checked) | synthetic pets / vaccines / subscriptions / send log / mock hits = 0; temporary cron jobs removed (0 jobs); the 2 Vault secrets created by the run deleted (Vault 0, as before); service role grants on pets as before |
| Left on staging | function v6 + its 3 test secrets; `qa-push-mock` + 2 empty tables (removal: `docs/NOTIFICATIONS_SETUP.md` §4 "Staging state") |
| Not tested | a real browser push service (proposed as a separate QA step); a TCP cut after delivery on the deployed path (the Supabase gateway is in between — covered locally) |
| Sent | nothing outside staging: pushes only to the staging mock / local mock; no LINE / email; no back-fill; no production change |

**Before deploying** (plan: `docs/NOTIFICATIONS_SETUP.md` §4, separate from Vercel): cron job 1 must send `Authorization` +
`x-cron-secret` (from Vault) **before** the new function is deployed, otherwise cron gets 401. Monitor with
`net._http_response` (within 6 h) + the function's summary log + send-log statuses — not with cron "succeeded".
FK `vaccines.pet_id`: proposal only (`docs/PROPOSAL_VACCINE_PET_FK.md`); orphan rows untouched.
`reservation_precheck` check 3 accepts exactly one extra md5 for `sync_pet_owner_on_transfer_accept` (`e722eb…`, the body
from `20261031120000`, = production = staging); the other four bodies stay pinned to single values.

## 2026-10-31 — log watches (production, read-only; UTC)
| Watch | Window | Result |
| --- | --- | --- |
| `private_columns` (applied 2026-10-30 03:43:48) — 24 h **complete** | 03:43:48 → 2026-10-31 03:43:47 (earlier check to 12:50, this one 12:50 → 03:43:47) | logs present every active hour (edge / postgres / postgrest; quiet 13:00–01:00 = no traffic, postgres checkpoints logged → pipeline alive). Non-QA errors: **1** — `GET vaccines …pets!inner(name,user_id)` **400 PGRST200** at 01:00:02 from the vaccine-reminder Edge Function (cron job 1, secret key). Also on 2026-10-28 01:00:01 → **pre-existing** (before both privacy migrations), not caused by them; separate task. Other: 13:21:32 `column d.file_path does not exist` = our own read-only MCP count (mgmt-api); 18:31 `Connection reset by peer` after a forced checkpoint (1 line) |
| v1.7.1 `20261031072347` (applied 07:23:47) — **separate, in progress** until ≥ 2026-11-01 07:24 | **07:23:47 → 08:59:59 checked** (logs present for edge / postgres / postgrest in 07:00 and 08:00 hours; **09:00–09:45: no edge / postgres lines delivered yet at 09:45** — only our read-only supavisor connections — so that hour is not counted as checked) | every 4xx/5xx edge line has UA `node` = QA probes (07:24:31–07:24:35, 08:23:21–08:23:22); our first precheck draft 07:35:54 42P01 (read-only); no request from a browser / user with an error; PostgREST "Thread killed" lines at 07:23:48, 07:25:02, 07:25:32, **07:49:18**, 08:23:49, 08:24:19 (cause not confirmed, see below) |
| v1.8.0 `20261031082206` (applied 08:22:06) — **separate, in progress** until ≥ 2026-11-01 08:22 | **08:22:06 → 08:59:59 checked** (same gap from 09:00) | errors = QA probes 08:23:21–08:23:22 only; 0 user errors |
| "Warp server error: Thread killed by timeout manager" (PostgREST) | 2026-10-28 → 2026-10-31 | **cause not confirmed.** Seen before both migrations (10-28: 01:01:02, 11:23:18, 13:16:18). Some lines come 30–60 s after a request burst (10-28 01:01:02 and 10-31 01:01:02 = 60 s after the cron request; 07:25:02 / 07:25:32 after the QA probes), but 10-30 21:01:18 has no edge / PostgREST request in 20:59–21:02. No failed request is linked to any of them. Next: compare with PostgREST server timeout settings / Supabase support before naming a cause |

## 2026-10-31 — PR #14 deployed (v1.7.1) + pet privacy migration on production (UTC; ICT = UTC+7)
| Step | Result |
| --- | --- |
| Pre-merge | PR head `ae2b7f242720b141f94eafc3b34b7c2ce8e96698` (= tested); main `fae9f56` already in its history; migration in head sha256 `f78da805…3e06`; no other PR included |
| Preview check (staging, migration `f78da805…` applied 07:03 UTC), `whiskora-2x53v1rmk` = `ae2b7f2` | QA owner on P7 (sire P2, dam P8, pedigree no., grandsire): edit → save 204 → reload shows change → restore 204; sire/dam/pedigree fields identical throughout, 0 Supabase errors. Stranger direct pedigree columns 403, anon 401, stranger `get_pet_pedigree_fields(P8)` none. Anon `/p/P7` tree 200: P8 shown, P9 + private P2 hidden; private P2 page hides health; farm-hub loads. Full E2E not re-run (no app change since `1cc44bc`, 58/58) |
| Precheck (read-only) 07:18:23 | `state: before`, all ok incl. 7.6, no STOP / WARN; 10 farm / 0 pet settings, 0 grants, 170 pet-photos objects, 25 pets with pedigree values |
| Merge | 07:18:39, pinned to head → `e880459`; bot bump `7ab3cdc` **v1.7.1** (version files only) |
| Deploy | Production `7ab3cdc` success 07:22:06 (`whiskora-c4nkcnl7s`, Vercel Production env build; no Preview promoted). `e880459` deployed 07:20 before it |
| App on the OLD DB 07:22–07:23 | bundle: production ref 1, staging 0, `1.7.1`; QA stranger edit pet 175: `get_pet_pedigree_fields` 404 (expected) → sire/dam not sent; save → reload → restore, card + health unchanged; `/p/175` tree 200, farm-hub, a farm page load |
| Precheck again 07:23:29 | `before`, all ok |
| **Migration** | `20261031072347 pet_privacy_is_public` applied **07:23:47** (only this file, one transaction incl. the `schema_migrations` row; bytes checked against sha256 before sending); stored statement sha256 = `f78da8057b2a70e43daf267d010b6a495e0e8d5c8d3a5d176314cb6f4c8a3e06` |
| Postcheck catalog 07:23:54 | `pet_privacy_precheck.sql` → `after`, every check ok incl. 7.6; `reservation_precheck.sql` → `after`, ok; `pets.allergies` grants unchanged |
| Postcheck HTTP 07:24:31–35 (QA stranger = owner of pet 175, QA admin = role user, anon) | **22/22**: pedigree columns anon 401 / both signed-in 403; `get_pet_pedigree_fields` anon 401, owner 1 row, other user 0 rows; `get_my_pet_access` other user pedigree false; `get_pet_pedigree` 200; PATCH `access_grants` (random id) `resource_id` / `grantee_id` / `field_group_key` → 403 42501, anon 401, `revoked_at` → 200 / 0 rows; pet-photos list anon + other user → 0; `profiles.email`, `pets.allergies` anon 401; transfer inbox 200, direct PATCH transfers 0 rows, `respond_pet_transfer` missing id → P0002, anon 401 |
| App on the NEW DB 07:24 | bundle as above; QA stranger edit pet 175: RPC 200, save → reload → restore, pedigree fields + health + card identical, 0 Supabase errors; anon `/p/175` + tree, farm-hub, a farm page load, 0 errors. Pet 175 has no pedigree values — the non-empty sire/dam case is proven on staging only |
| Photo URL 07:24:53 | QA stranger uploaded a probe to its own folder (200), public URL 200 (**known limit: public bucket**), own list sees it, anon list 0, deleted (200; row gone). The public URL still answered 200 right after delete (CDN cache) — input for the private-photos PR |
| Data after | 0 grants, 0 per-pet settings, 170 pet-photos objects (unchanged), QA sessions 0 (global logout 204), QA roles user, admins 1, no pet_activities on 175 |
| Logs 07:15–07:30 | every ≥ 400 = QA: 5× `get_pet_pedigree_fields` 404 at 07:22 (app on old DB, QA browser + script), the denial probes 07:24, P0002 probe; postgres 0 ERROR; PostgREST schema reload at 07:23:47 + "Thread killed by timeout manager" ×4 (cause **not confirmed** — see log watch below; no failed request seen with them). No customer request errors |

Rollout used QA accounts / QA pet 175 only; no grant or test data on customer pets. Recovery: fix forward only — never
re-grant pedigree columns or table UPDATE on `access_grants`, never drop `access_grants_revoke_only`, never run the
staging-only revert on production; if needed, close only the failing path.

**Not closed (privacy is not complete):** photo files of private pets stay in a public bucket (a known URL loads, CDN may
serve a deleted file); access given by a previous owner survives a transfer (next PR, staging first); no owner UI for
`is_public` / per-pet tiers; original seller not a previous owner; grant DELETE removes history (unchanged by decision);
`pet-documents` folder check; `verification-docs` public URL.

## 2026-10-30 — privacy migration on production (owner-approved, steps 4–7 of `docs/PRIVACY_ROLLOUT.md`)
| Step | Result |
| --- | --- |
| Gate (03:35 UTC) | project `vhudldcizmbpujedojei` ACTIVE_HEALTHY; live app v1.5.0 = deploy `74391b7` (success), bundle has the production ref only; Redirect URLs probe: only `www.whiskora.pet/**` accepted |
| Precheck before (03:35 and again 03:42) | 6/6 ok, `state: before`, `get_my_profile missing` |
| File | sha256 `b7338da6…7f7e`; non-comment SQL identical to `45f6071` (staging). Body between `begin;`/`commit;` sent via MCP `apply_migration` (which wraps its own transaction) |
| Applied | **03:43:48 UTC**, recorded as `20261030034348 private_columns` (63 migrations). Only this file — reservation migration not applied |
| Precheck after | `state: after`, `get_my_profile present`; anon/authenticated have no SELECT on email/allergies, no UPDATE on role |
| Anon over HTTP (03:44) | `profiles?select=email`, `phone,address`, `*` → 401; `pets?select=allergies`, `blood_type`, `*` → 401; rpc `find_user_by_email` / `get_my_profile` → 401; `profiles?select=id,full_name` and `pets?select=id,name` → 200 |
| Postcheck (rolled back via final `raise exception`; counts only) | **17/17 ok** — 16 rows of `privacy_postcheck.sql` + stranger `get_pet_health(owner's pet)` → 0 rows |

Postcheck accounts: owner = owner's own account (role **admin**), pet = owner's pet (id 10, has health data, no co-owners),
stranger = synthetic QA account (below). **Limit:** the owner account is an admin, so the owner rows do not prove access
for an ordinary (non-admin) owner — that case is covered by the staging postcheck (16/16, synthetic non-admin owner) and
staging E2E 50/50. Denials on production were checked with the ordinary-user stranger account.

### Owner re-test after migration (owner-confirmed, 10:50 ICT = 03:50 UTC, account = owner's admin account)
Confirmed passing by the owner: profile and existing data complete; edit + save + restore succeeded; Jessica's health data
shows as before; `/admin/users` lists users. (Admin account — see the limit above.)

### Synthetic QA account (production) — keep until the owner decides; not deleted automatically
- user id `605f176a-dd3f-4cc7-b4c9-9d814a56f93a`, email `whiskora-qa-stranger-20261030@example.com`, name "Whiskora QA Stranger (postcheck)".
- Created 03:41 UTC via public `/auth/v1/signup` (autoconfirm on → no email sent); role `user`; only its auto-created personal
  workspace; no farm membership, pets or co-ownership; signup session revoked right away (0 sessions). Password stored only
  in `~/.whiskora/prod_qa_stranger_password` (codespace, mode 600).

### Logs
- Baseline 2026-10-29 03:36 → 10-30 03:36 UTC: edge 0 permission errors; postgres 2 `42501` = role-hotfix apply/probe (intentional).
- After apply, checked through 03:44:05 UTC (latest ingested): edge 10 requests = my anon probes; postgres 8 `permission denied`
  = those intended anon probes (03:44:04–05).
- 03:44:06 → 03:50:13 UTC (latest ingested at 03:53 check; covers the owner re-test): edge 57 requests, all 2xx (incl.
  `rpc/get_my_profile`, `rpc/get_pet_health` ×4, `rpc/admin_get_users`, `rpc/admin_get_stats`, `GET profiles` ×2, `PATCH pets` ×2 → 204);
  postgres 4 lines = the postcheck itself (intended, rolled back) + checkpoint. No `PATCH profiles` request appears in this window.
- 03:50:14 → 05:40 UTC (latest ingested 05:36:25): edge 277 requests, 11 ≥ 400; postgres 4 `permission denied`. **All 15 are QA
  tests** (03:59:15 the 409 bug, 03:59:47–48 intended negatives, 03:59:54 the verifications 400 bug, 04:01:12 and 05:35:51 / 05:36:24
  intended admin-RPC denials).
- **App permission errors: 0 so far. 24 h watch NOT complete** — checked continuously 03:43:48 → 05:36:25 UTC; continue until ≥ 2026-10-31 03:44 UTC
  (query `edge_logs` status ≥ 400 and `postgres_logs` `42501`/`permission denied`, excluding the probes listed above).

## 2026-10-30 — production browser QA with synthetic accounts (owner-approved; Thai time, ICT)
Run 10:58–11:01 ICT, Playwright (desktop Chromium) against `https://www.whiskora.pet`. No screenshots/traces kept; only
statuses, counts and booleans recorded. No email/LINE/push sent (no vaccines/reservations created; QA accounts have no
push subscription; `/api/notify` has no caller). No system settings changed.

| # | Case (account) | Result | Evidence |
| --- | --- | --- | --- |
| S1a | Open /profile (stranger, user) | passed 10:59:12 | `rpc/get_my_profile` 200, no "Loading" |
| S1b | Profile edit: save unchanged → change → reload → restore (stranger) | **failed** 10:59:15 | first save = `PATCH /rest/v1/profiles` **409** (only one in 24 h of edge logs besides the role probe). Cause: form sends `username: ''`; `profiles.username` is unique and one row already has `''` → every user with NULL username (96) cannot save. Nothing was written (stranger row unchanged). Predates v1.5.0; not caused by the migration |
| S2a | Create QA pet with synthetic health (stranger as ordinary owner) | passed 10:59:37 | `POST pets` 201, pet id **175** |
| S2b | Read / edit / save / reload / restore health of own QA pet | passed 10:59:41 | prefilled; `PATCH pets` 204 → persisted; `PATCH pets` 204 → restored; `get_pet_health` 200 |
| S2c | Pet ID QR → public page as visitor | passed 10:59:45 | QR → `/p/175`, no login; visitor RPC health has no allergy and page shows none (consistent); no email / phone on page |
| S3a–b | /admin/users, /admin/verifications as ordinary user | passed 10:59:46–47 | redirected to `/th`; `admin_get_users` never called |
| S3c | API as ordinary user | passed 10:59:48 | own role → admin: 403/42501; `admin_get_users` / `admin_get_stats`: 400/P0001 Access denied; other user's email, phone/address, Jessica allergies: 403/42501; Jessica `get_pet_health`: 200, 0 rows; own `get_my_profile`: 1 row |
| S4a | /admin/users (QA admin, temporary) | passed 10:59:53 | `admin_get_users` 200, row count only; no clicks |
| S4b | /admin/verifications (QA admin) | **failed** 10:59:54 | `GET farm_verifications` **400**: page embeds `profiles!user_id` but there is no FK → list always empty (0 rows exist). Also hit at 10:31 ICT (before the migration) — predates it |
| S5a | QA admin demoted to user (11:01:03), new login | passed 11:01:12 | redirected from /admin/users; `admin_get_users` 400/P0001 |
| S5b–c | End QA sessions | done 11:01:12 | global logout with each QA account's own token (204); DB: 0 sessions, 0 live refresh tokens for both |

Scope note: after S2 the stranger owns its own QA pet (id 175) — S2 results are the **ordinary-owner** case for that pet only;
for Jessica and every other user's data the stranger remains **unrelated** (S3). Admin role count after the run: 1 admin (owner), unchanged.

Fix prepared (not deployed): branch `fix/profile-username-admin-verifications` @ `0603963` (from `74391b7`):
username `'' → null`; verifications take applicant name/email from `admin_get_users`. Staging, local build with staging env
only (0 production refs in `.next`): old payload reproduces 409; fixed profile save/change/reload/restore all `PATCH` 204;
verifications 200 with applicant + farm shown; E2E 42 passed / 8 skipped (reservation chain) / 0 failed. Staging data restored.

### QA data on production (kept for re-checks; delete later only with owner approval)
| Item | Id | State |
| --- | --- | --- |
| QA stranger account | `605f176a-dd3f-4cc7-b4c9-9d814a56f93a` | role user, 0 sessions; owns QA pet 175 |
| QA admin account (`whiskora-qa-admin-20261030@example.com`, "Whiskora QA Admin (temp)") | `6417e364-bfc4-4ec6-b112-0f227cc1da8a` | admin 10:57–11:01 ICT, now **user**, 0 sessions; password only in `~/.whiskora/prod_qa_admin_password` |
| QA pet "QA ทดสอบระบบ Whiskora 20261030 (ไม่ใช่สัตว์จริง)" | 175 | `is_public = true` (app default), allergies/traits synthetic, visible at `/p/175` |

## 2026-10-30 — hotfix PR #9 deployed (v1.5.1)
| | |
| --- | --- |
| PR | #9 `fix/profile-username-admin-verifications`, head `3386865` (merged pinned to that SHA, 05:31:14 UTC); only `web/app/profile/edit/page.tsx` + `web/app/admin/verifications/page.tsx`, no migration |
| Live | **v1.5.1**, deploy `3f37410` (bot version bump; differs from `3386865` only in `web/lib/version.ts`, `web/package.json`), success; bundle: production ref only, new code present in both page chunks |
| Fix | blank / whitespace-only username → `null`, other usernames sent unchanged (no trim); duplicate (23505) → clear message. Verifications: no `profiles!user_id` embed; applicant from `admin_get_users` |
| Staging (before PR) | 2 no-username accounts (empty field / spaces only): save→change→reload→restore all PATCH 204, username stays NULL; existing `qa_v` unchanged; duplicate `qa_o` → 409 + message, nothing changed; verifications 0 requests → 200 + empty state; 2 synthetic requests → each card shows its applicant; ordinary user blocked. E2E **50/50, 0 skipped** (P4/P5 reset so the reservation chain ran; the 8 earlier skips were that chain, skipped because `E2E_LISTED_PET_ID*` was unset). Staging data restored afterwards |
| Preview | built with production env (plan not applied); code review: no automatic writes/notifications; production edge logs 05:29–05:31 UTC: 0 write requests |

Post-deploy production QA (ICT):
| Case | Result |
| --- | --- |
| QA stranger (ordinary user, no username): save → change → reload → restore | passed 12:35:50 — `PATCH profiles` 204 ×3 (12:35:39 / :43 / :47), value persisted then restored, username stays NULL. Note: the form writes empty strings, so the stranger's phone/address went NULL → `''` (app behaviour for every save, not new) |
| Ordinary user → /admin/verifications, admin RPC | passed 12:35:51 — redirected to `/th`, `farm_verifications` 0 rows, `admin_get_users` 400/P0001 |
| QA admin (temporarily admin 12:36:01–12:36:16 via SQL) /admin/users, /admin/verifications | passed 12:36:06–08 — `admin_get_users` 200 (count only), `farm_verifications` **200**, empty state (0 requests on production), no 4xx; no clicks |
| QA admin demoted, new login | passed 12:36:25 — redirected, `admin_get_users` 400/P0001; sessions revoked (own token, global) |
Both QA accounts: role user, 0 sessions, 0 live refresh tokens; admins on production: 1 (owner). Owner account: no new re-test needed;
owner's earlier results stay as reported (admin account; no `PATCH profiles` from it seen in logs).

## 2026-10-30 — Preview → staging (branch `chore/preview-staging-env`, not merged; ICT = UTC+7)
Code is done; the Vercel and staging-Auth settings are **waiting for the owner** (this workspace has no Vercel or Supabase
management credentials). Runbook, values, rollback: `docs/PREVIEW_STAGING_PLAN.md`. **Not finished** until the real Preview check passes.

| Check | Result |
| --- | --- |
| Guard unit cases (13: prod/local pass; preview+staging pass; prod URL/key, legacy anon, missing, other project, prod SITE_URL, `whiskora.vercel.app`, secrets set, `sb_secret_` as public key → blocked) | passed 13/13; no value appears in any message |
| `next build` as Preview, no vars (falls back to `web/.env.production`) | passed — build **fails** with 2 messages (URL is production, key is production), names only |
| `next build` as Preview with staging URL + publishable key | passed — guard ok; `.next/static`: staging ref 1 file, production ref 0, production key 0; `isPreviewDeploy` inlined `true` |
| `next build` as Production with `.env.production` | passed — guard ok, production ref in bundle, `isPreviewDeploy` inlined `false` (unchanged behaviour) |
| Local preview-mode build (13:46 ICT), `preview_qa` script | passed — served bundle staging-only; LINE GET/callback → own host `LINE_DISABLED_ON_PREVIEW`; notify 503; login `qa+viewer` → profile save/refresh/restore: PATCH 204 ×2 to staging, staging held then restored the value; 18 Supabase requests, all staging, 0 production |
| E2E against that build (staging) | **50/50, 0 skipped** (P4/P5 reset first; chain leaves them transferred as before) |
| `tsc --noEmit`, eslint on changed files | passed |
| Push `3fe70de` 13:52 ICT → Vercel Preview | **blocked by the guard as intended** (owner-supplied build log, 13:53:00): 9 problems, names only, no values — Supabase URL + key are production; `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `RESEND_API_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` are set for Preview today. So every earlier Preview ran with production secrets. Build used a restored cache → redeploy without cache after the vars change |
| Owner set Preview vars + staging Redirect URLs + bypass; redeploy `c5191f3` **without cache** (14:59 ICT) | blocked by the guard on 1 item only: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Vercel refuses to remove Preview from a public-prefixed var). Fix `b0f9d9a`: guard allows that public key; `lib/push-client.ts` blanks it on Preview |
| Real Preview `b0f9d9a` (`whiskora-ett6yn8oz-…`, push build) 15:30:09–15:30:43 ICT, via Protection Bypass | **passed** — served HTML + 16 JS: staging ref 1, production ref 0, production keys 0, staging key present; production VAPID key not in the bundle; LINE GET/callback 307 to the preview's own login (`LINE_DISABLED_ON_PREVIEW`); notify 503; login `qa+viewer` (email/password) → profile phone change → save → refresh → restore: PATCH 204 ×2 to staging, staging held then restored the value; 20 Supabase requests in the browser, all staging, 0 production |
| Logs for that window (08:28–08:32 UTC) | staging edge: 30 requests, 26 carry the preview host, 2 `PATCH /rest/v1/profiles`; production edge: **0 requests** |
| Production after that (15:33 ICT, read-only) | latest Production deployment still `3f37410` (2026-10-30 05:34 UTC); `www.whiskora.pet`: v1.5.1, production ref 1, staging ref 0. Nothing promoted |
| `web/.env.production` removed (owner confirmed Production has both Supabase vars); guard also checks Production builds | local: Production build without vars → **fails** (missing), with production vars → ok; guard cases 13/13 + 4 production cases pass. Takes effect for Production only when the branch is merged (not approved yet) |
| Real Preview `941b1a1` (`whiskora-dei4hb903-…`, push build, no tracked env file) 15:37:05–15:37:37 ICT | **passed** — same 5 checks as above (staging ref only, LINE/notify off, login + profile save/refresh/restore on staging, 20 Supabase requests all staging). Production edge 08:32–08:39 UTC: 0 requests; Production still `3f37410` |
| **No-cache redeploy** of `941b1a1` (`whiskora-pvfi0sl4z-…`, Ready 16:21 ICT, owner-triggered without build cache; branch alias moved to it) 16:22:50–16:23:23 ICT | **passed** — served HTML + 16 JS: staging ref 1, production ref 0, production keys 0, production VAPID key 0; LINE GET/callback 307 to own host `LINE_DISABLED_ON_PREVIEW`; notify 503; login `qa+viewer` → profile save/refresh/restore: PATCH 204 ×2 on staging, staging value held then restored; 20 Supabase requests all staging. Staging edge 09:22–09:24 UTC: 27 requests (23 with the preview host, 2 profile PATCH); production edge 09:11–09:24 UTC: 0. Production still `3f37410` v1.5.1, production ref only |
| Production read-only after push (13:57 ICT) | passed — latest Production deployment still `3f37410` (v1.5.1); `www.whiskora.pet` bundle: production ref 1, staging ref 0. Nothing promoted |
| Deployment Protection on Preview | on (anonymous → 302 Vercel SSO); kept. Automated check needs "Protection Bypass for Automation" saved by the owner to `~/.whiskora/vercel_bypass` |

## 2026-10-30 — PR #10 deployed (v1.6.0): Preview → staging closed (ICT = UTC+7)
| | |
| --- | --- |
| Pre-merge | main `3f37410`; PR head `d97fe2705b0553628bfd16da362e79c796a64518`; `web/` identical to `941b1a1` (no-cache Preview tested); only PR #10. Owner confirmed Production scope on both Supabase vars |
| Merge | pinned to that head, 16:32:14 ICT → merge `ffa4319`; bot bump `8973463` (v1.6.0, only `web/lib/version.ts` + `web/package.json`) |
| Deploy | Production `8973463` success 16:35:35 ICT (`ffa4319` also built OK first). Built from Vercel Production env — the guard's production check passed, so both Supabase vars are present and point to production. No Preview promoted |

Post-deploy checks (16:36 ICT):
| Check | Result |
| --- | --- |
| Served version / bundle (3 pages + 14 JS) | passed — `1.6.0`; production ref 1, staging ref 0, production publishable key present, staging key 0; VAPID public key present; Preview-only strings absent |
| `/api/auth/line` (not followed) | passed — 307 → `access.line.me/oauth2/v2.1/authorize`, `redirect_uri=https://www.whiskora.pet/api/auth/line/callback`, client_id + state set |
| `/api/notify/send` without secret | passed — 401 `unauthorized` (not 503); nothing sent |
| QA stranger profile save → change → reload → restore | passed 16:36:45 — PATCH 204 ×3 (16:36:35 / :38 / :42), value persisted then restored, username stays NULL |
| Ordinary user → admin | passed 16:36:46 — redirected, `admin_get_users` 400/P0001 (intended) |
| Push setting on Production | passed 16:36:55 — toggle goes past the key check to the permission step ("ต้องอนุญาตการแจ้งเตือนในเบราว์เซอร์ก่อน", not "ยังไม่ได้ตั้งค่า"); permission never granted, `subscribe` stubbed: 0 calls, 0 `push_subscriptions` writes; stranger has 0 push subscriptions |
| Logs 09:24–09:39 UTC | edge 69 / auth 10 / postgres 1, all 09:36:30–09:36:55 = the QA run. Only ≥400/ERROR: 09:36:47 `admin_get_users` 400 + postgres "Access denied" = intended QA denial. App errors 0 |
| QA stranger after | role user, 0 sessions, 0 live refresh tokens; admins on production: 1 |

Limits: Vercel variable *values* were not read (no access) — presence/ref proven by the guard passing in the Production build and by the served bundle. LINE login was not completed (not followed). Push delivery not tested by design.
**Preview → staging: closed.** Branch Previews now build against staging; production values are not given back to Preview (see rollback in `docs/PREVIEW_STAGING_PLAN.md`).

## 2026-10-30 — Reservation → transfer on staging (branch `feat/reservation-transfer-staging`; ICT = UTC+7)
Migration `20261030120000_reservation_transfer_pipeline.sql` (replaces the never-applied draft `20261029200000`), applied on
**staging only** (10:17 UTC, re-applied 10:19 after a fix, rolled back 10:38, re-applied 10:43). Production untouched
(read-only checks only). Details and role table: migration header. Production recovery = freeze + fix forward (see review round 2).

Schema check (read-only, both projects): tables, constraints, indexes, policies, the single trigger
`trg_sync_pet_owner_on_transfer_accept` and function bodies (md5) were identical on staging and production. The existing
trigger already sets `converted`; the migration replaces that function's body (same trigger, no second one).

Holes reproduced on staging **before** the migration (REST API, synthetic accounts). On production no reservation or transfer rows exist at present; that alone does not
prove the holes were never used (not investigated further). The holes stay open on production until the migration:
| Case | Before |
| --- | --- |
| staff inserts a transfer of a farm pet to self, then accepts it | 201, 200 → staff became the owner |
| receiver changes `pet_id` of a transfer to another (private) pet and accepts | 200 → receiver owns the other pet |
| initiator marks a transfer `accepted` (receiver never agreed) | 200 → ownership moved |
| buyer inserts a reservation already `confirmed`, on a private unlisted pet | 201 |
| viewer cancels / staff confirms a reservation directly | 200 / 200 |

Tests after the migration (staging, synthetic only):
| Suite | Result |
| --- | --- |
| `supabase/tests/reservation_api_checks.cjs` (REST, all roles, double clicks, parallel requests, health before/after) | **51/51 passed** (twice) |
| Docker stub (`run_local.sh`): privacy before/after + reservation + transfer | 13 + 37 + 11 + 13 passed, 0 failed; `run_concurrency.sh`: one confirm wins, double confirm/accept → one result |
| E2E, local preview-mode build on staging | 56/56 passed, 0 skipped |
| E2E on the real Preview `whiskora-4661aufyr` (`f4bfb86`, protection kept, bypass cookie), 17:30–17:37 ICT | 56/56 passed |
| Same, after strengthening the "after transfer" check (waits for the pet data, asserts no status pill), 17:43–17:49 ICT | **56/56 passed** |
| `preview_qa` on that Preview (17:37 ICT) | bundle staging-only, LINE/notify off, profile save/restore on staging, 22 Supabase requests all staging |
| Production edge logs 09:39–10:51 UTC | 0 requests (none from the Preview) |
| Staging-only exact rollback (10:38 UTC; not a production step) | functions / policies / triggers hashes = pre-migration baseline; trigger body md5 = production's; privacy column + table grants unchanged before, during and after |
| App on the rolled-back DB (Preview, reservation E2E) | 13/14 — fallback path works (deploy order app → migration is safe); the 1 failure is the expected one: pet stays `ติดจอง` without the migration |
| Production read-only precheck `reservation_precheck.sql` | `state: before`, all ok; counts 0 reservations / 0 transfers / 5 pets `ติดจอง` (set by owners, not touched) |

Owner decisions — **approved as proposed** (2026-10-30 review; buyer self-cancel not added this round):
1. Pet status after an accepted transfer: sale statuses → NULL "not specified", other statuses kept [NULL].
2. Other open reservations of the pet on accept [cancelled].
3. Buyer self-cancel: no UI today; direct UPDATE is now closed for buyers too [not possible — add an RPC if wanted].
4. Co-owners and admins: had write access through `can_manage_pet_visibility`; now read-only for reservations/transfers [read-only].
5. Manager: confirm/cancel yes, send transfer no (matches the UI) [as is].
6. `is_public` after transfer [kept as is].

### Review round 2 (owner review of PR #12; staging only; ICT = UTC+7)
| Item | Change | Result |
| --- | --- | --- |
| Recovery plan | `_down.sql` moved to `supabase/tests/staging_only/…_down_STAGING_ONLY.sql` (warning + refuses without the staging QA seed); production recovery = `supabase/emergency/reservation_transfer_freeze.sql` (2 restrictive insert policies + revoke EXECUTE on the 2 write RPCs) → fix forward → `…_unfreeze.sql` | freeze on staging 18:23 ICT: 4/4 writes blocked, 7/7 reads + privacy probes unchanged; catalog: column/table grants, functions, triggers unchanged, only the 2 freeze policies added; unfreeze → identical to before; open-state run 11/11 |
| Lock order | every write path now locks pets → reservations → transfers (FOR NO KEY UPDATE) and re-reads after locking; confirm also requires the pet to be listed (`pet_not_listed`) | **before the change** (same harness): stress 45 runs → 12 deadlocks (`40P01`); **after**: controlled-timing 6/6 consistent (3 scenarios × both orders), stress 4 × 45 runs → 0 deadlocks, 0 inconsistent states |
| `pet_is_reservable` | was `is_public or status = พร้อมย้ายบ้าน` (copied from the pets policy "Public can view available pets"); now the app's `isPublicListing` rule: listed status **and** `is_public is not false` | API: P6 (พร้อมย้ายบ้าน, is_public=false) readable anonymously (existing design, documented) but not reservable; `/p` shows no reserve button; owner sees a notice that the status makes the page public. Production: 0 such pets now |
| Transfer inbox | `get_my_pending_transfers` also returns `pet_is_public`, `pet_status`, `from_farm_name`; card lists: becomes owner, leaves farm X, sale status cleared (no relist), public page stays as is, manage from the pet page. There is no per-pet privacy setting UI in the app today to link to | E2E checks the notice |
| PR wording | "no rows now ≠ never exploited" | updated |
| Precheck | md5 of all changed bodies; STOP for half-applied state and for data that breaks the new unique indexes; WARN with counts for existing rows the new rules treat differently; never edit real rows to pass | staging before-state + injected synthetic duplicates → STOP/WARN as designed; forced apply aborted as one transaction (state stayed `before`); clean → `after`, all ok except a seed drift WARN (staging reservation 1) |
| Migration checksum | sha256 `00b7cd438e40b3106eebb1e24e0d8a74fec48ccb56b043283424e48dca4bf0f8` (applied on staging 11:25:13 UTC) | |
| Tests | API checks 53/53; Docker stub 13+37+11+13 pass, concurrency script ok; E2E local preview-mode build 58/58 | |
| Real Preview `whiskora-mf5tzetgl` (`d311459`; `web/` = `0f01d48`), protection kept, 18:37–18:44 ICT | E2E **58/58**; `preview_qa` 5/5 (bundle staging-only, LINE/notify off, profile save/restore on staging, 22 Supabase requests all staging); repo scripts after it: API 53/53, concurrency timed 6/6 + stress 45/0 | |
| Production read-only precheck (new file), 18:47 ICT | `state: before`, all 14 checks ok; 0 reservations / 0 transfers / 5 pets ติดจอง | |
| Production logs 10:51–11:50 UTC | log API returned HTTP 500 three times at ~11:46, then answered: edge 116 (real use 11:20–11:26), auth 2, postgres 2 checkpoints; 0 errors; 0 from Preview | |

## 2026-10-30 — PR #12 deployed (v1.7.0) + reservation migration on production (ICT = UTC+7)
| Step | Result |
| --- | --- |
| Pre-merge | main `8973463`; PR head `57d11d67bb61b4f607cb9697588b890b50ea2344`; `web/` + migration identical to tested `0f01d48`; file sha256 `00b7cd43…bf0f8`; only PR #12 (PR #11's commit was already in its history → GitHub marked #11 merged) |
| Precheck (read-only) 19:09 ICT | `state: before`, all 14 checks ok, no STOP/WARN; 0 reservations / 0 transfers / 5 pets ติดจอง |
| Merge | 19:09:17 ICT, pinned to head → `6cce1f4`; bot bump `fae9f56` **v1.7.0** (version files only) |
| Deploy | Production `fae9f56` success 19:12:42 ICT (Vercel Production env; no Preview promoted) |
| App on the OLD DB | bundle: production ref 1, staging 0, v1.7.0, new code present; LINE route 307, notify 401; QA stranger: `/profile/transfers` (inbox RPC 200, empty state), `/profile/pets`, `/p/175` load, 0 Supabase errors (19:14 ICT) |
| Precheck again 19:15:07 ICT | still `before`, 0 rows, no duplicates |
| **Migration** | `20261030121715 reservation_transfer_pipeline` applied **19:17:15 ICT** (12:17:15 UTC) via `apply_migration`; stored statement sha256 = `00b7cd438e40b3106eebb1e24e0d8a74fec48ccb56b043283424e48dca4bf0f8` (= the file) |
| Postcheck (catalog) | `state: after`; one trigger; md5 of 5 changed bodies = staging; policy set as designed; both unique indexes; not-self check NOT VALID; RLS on; `pets.allergies` grants unchanged |
| RPC grants (read from the catalog) | write RPCs + 4 helpers: `authenticated`, `service_role`, owner only — anon/PUBLIC refused (checked over HTTP: 401). `get_my_pending_transfers` after drop/recreate: PUBLIC, anon, authenticated, service_role — same ACL as before the migration; the body returns only `to_user_id = auth.uid()` rows, anon call → 200 with 0 rows (checked) |
| QA denials (create nothing) 19:17:54–56 ICT | 15/15 passed: confirmed-reservation insert 403, reserve for someone else 403, non-owner transfer-to-self 403, owner self-transfer 403, pre-accepted transfer 403, direct PATCH on both tables → 0 rows, both RPCs on a non-existent id → P0002 (HTTP 500 from PostgREST), anon RPCs 401, helpers anon 401, inbox signed-in 200/0 rows |
| Privacy (anon HTTP) | `profiles.email`, `profiles.phone`, `pets.allergies`, `pets.health_notes` → 401; public columns → 200 |
| Pages after the migration (19:18 ICT) | same QA pages load, inbox RPC 200, 0 Supabase errors |
| Data | 0 reservations / 0 transfers after the checks (nothing created); QA accounts role user, 0 sessions; admins 1 |
| Logs 11:50–12:20 UTC | edge 187 (real use from 12:05), auth 13, postgres 18. All ≥400/ERROR lines (12:17:54–12:17:56) = the QA denial probes above + anon privacy probes; plus the migration statement log at 12:17:15. App errors 0, no deadlocks |

**Not tested on production:** the happy path (reserve → confirm → transfer → accept/decline) and farm-role UI — production has no QA farm and real rows were not to be created; those rely on staging (E2E 58/58 on the real Preview, API 53/53, concurrency). No real transfer was performed on production.
Recovery if needed: `supabase/emergency/reservation_transfer_freeze.sql` → fix forward → unfreeze (never the staging-only rollback, never an app rollback below v1.7.0).

## 2026-10-30 — Pet privacy audit + fix on staging (branch `fix/pet-privacy`, not merged; ICT = UTC+7)
Rule applied (owner-approved principle): when a pet is set to not public (`is_public = false`), neither a sale status
nor a field-group tier opens it to anyone who is not its owner / co-owner / farm team / admin (or an access grant).

Read-only audit (catalog on staging = production by md5; production counts only, no data values):
| Path | Finding before | Production today |
| --- | --- | --- |
| pets RLS | `Public can view available pets` (status = พร้อมย้ายบ้าน) returned private pets to anyone, incl. listing queries (farm-hub) | 0 private pets (all 137 public; the app has no control to set private) |
| `viewer_can_see()` (health, pedigree, vaccination, weight, timeline, documents, medical notes) | ignored `is_public`: tier alone decided — anon got the allergies of a private pet with tier public | 1 farm has rows (10): health / medical_notes / documents / dna / pedigree / vaccination / weight = registered — a farm choice; rows kept as they are |
| `get_pet_pedigree()` | walked into private ancestors (name, photo, breed) of a public pet | 0 private ancestors |
| pedigree columns | anon could read sire_id / dam_id / pedigree_number / pedigree_image_url / grand-parent names directly (bypasses tier "owner") | **live leak:** anon read → 200; 25 readable pets have pedigree values |
| storage `pet-photos` | anyone could LIST every user folder + file name (also photos of private pets) | **live leak:** anon list → 60 user folders, 170 objects |
| privacy settings writes | any farm member (staff / viewer) and co-owners could change farm / per-pet tiers via API (UI says read-only) | possible on production now (staging: viewer set farm health tier to public) |
| co-owner / farm team rows | co-owners could not read a private pet row; team only saw farm pets because all are public | — |
| owner controls | no UI for `is_public`; no per-pet tier UI (`pet_visibility_settings` unused); farm privacy page only for farm pets | — |

Fix: migration `20261030140000_pet_privacy_is_public.sql` (sha256 `837a8e3f323ac1702ed67cf65e2356fb63db65bc5782ff83cc3ec5d324f2f3d3`), staging
12:27–12:31 UTC (applied, exact staging-only revert, re-applied twice). App: owner notice text (private pet stays hidden even
when "พร้อมย้ายบ้าน"); E2E for it updated. Column grants: only removals (2619 → 2611 = 8 anon pedigree columns); no grant
widened; revert returns every catalog hash to the pre-migration baseline (functions, policies incl. storage, grants, triggers).

Tests (synthetic accounts: anon, stranger, buyer, owner, co-owner, farm manager / staff / viewer):
| Suite | Before | After |
| --- | --- | --- |
| `supabase/tests/pet_privacy_checks.cjs --transfer` (rows, listing, health / pedigree RPC, private ancestor, pedigree columns, storage list/upsert/delete/public URL, settings writes, after transfer) | 32 passed / **26 failed** (each a leak or role gap above) | **58 / 58** |
| Real Preview `whiskora-2twqry63h` (`1dbcb41`, staging env, protection kept) E2E, 19:38–19:45 ICT | — | **58 / 58** |
| `reservation_api_checks.cjs` | — | 53 / 53 (R2b now asserts the private listed pet is hidden) |
| Preview bundle | — | staging ref only, production ref 0 |
| Precheck `pet_privacy_precheck.sql` | production (read-only): `state: before`, all ok, no WARN | staging: `after`, WARN rows = the synthetic fixtures |

### Review round 2 (owner review of PR #14; staging / Preview only)
| Item | Change | Result |
| --- | --- | --- |
| Pedigree columns for signed-in users | SELECT revoked from `authenticated` too (anon + authenticated: 2619 → 2603 column grants, removals only); new RPC `get_pet_pedigree_fields()` for owner / co-owner / farm team / admin (any tier) or a viewer the pedigree tier allows; `PET_COLUMNS` without pedigree fields; owner edit page loads sire/dam via the RPC and does not send them if loading failed | stranger / buyer / owner direct read → 403; stranger RPC → nothing; owner, co-owner, farm manager / staff / viewer RPC → ok; Preview: owner edit + save keeps sire and pedigree number, 0 Supabase errors |
| Pedigree across generations | walking up from an ancestor needs `viewer_can_see(ancestor, 'pedigree')`; its card needs `pet_visible_to(ancestor)` | public child P7 → anon/stranger see dam P8 (public card) but not P8's sire P9 (P8 pedigree owner-only); owner of P8 sees P9 |
| Grants / previous owner | `granted` only for an active grant of that field group (or a pet-wide grant); grants no longer open the private card; grant create/revoke only by who may change the pet's privacy (was any farm member / co-owner) | vaccination grant → that group + its vaccine rows only, not weight/health/pedigree/documents/card; expired and revoked grants → nothing; staff / co-owner cannot create grants, owner can create + revoke; previous owner sees only groups with "include previous owner" (health yes, weight no), never the private card |
| UI texts | private profile is limited, but **photo files are not private yet — existing photo links still open** (owner notice on `/p` and `/pets/<id>`, transfer inbox) | E2E asserts the photo caveat |
| After-transfer access | proposal only: `docs/PROPOSAL_TRANSFER_ACCESS_RESET.md` (co-owners, grants, per-pet settings, weight rows, documents, previous-owner definition) | not applied |

Migration sha256 now `47123b3b2e96f9acab4bc7f69da8df112c90a6d56eda05fd18f5bb3a1f3f8f95` (staging re-applied 13:11:19 UTC). Tested code `1cc44bc`.
| Suite | Before (revert) | After |
| --- | --- | --- |
| `pet_privacy_checks.cjs --transfer` | 50 passed / **43 failed** | **93 / 93** |
| E2E on the real Preview `whiskora-jl76dl3la` (staging env, protection kept), 20:13–20:20 ICT | — | **58 / 58** |
| `reservation_api_checks.cjs` | — | 53 / 53 |
| Staging-only revert | catalog = production (colpriv, table grants, public + storage policies, functions); re-apply = same "after" hashes | ok |
| `pet_privacy_precheck.sql` | reverted staging (production-equal catalog): `before`, all ok | staging: `after`, all ok (WARN = synthetic fixtures) |

### Review round 3 — access_grants UPDATE (staging only, 2026-10-31)
Found: the UPDATE policy checked `granted_by = auth.uid()` in USING and WITH CHECK, so a grant's creator could edit every
column. Reproduced on staging (synthetic: stranger owns private P10 "A", owner 01 owns private P2 "B"): the creator moved
its P10 grant to P2 with itself as grantee and all groups → `get_my_pet_access` / `get_pet_health` of P2 opened; also
re-target, widen weight → all groups, extend an expired grant, un-revoke; same for a creator who lost the role (staff) and
for the old owner after a transfer (22 failing checks before the fix).
Fix (same migration, section 8): `authenticated` keeps UPDATE on `revoked_at` only (anon none); trigger
`access_grants_revoke_only` allows only active → revoked, sets `revoked_at = now()`, rejects every other change (also for
service roles); policy WITH CHECK requires `revoked_at is not null`. Who may revoke is unchanged: the creator (also after a
transfer / losing the role — only removes access) or who may change the pet's privacy now. A changed grant = revoke + new.
| Suite | Before (round-2 state / revert) | After |
| --- | --- | --- |
| `pet_privacy_checks.cjs --transfer` (fixture adds P10 + a stale-role grant on P6) | 105 / **22 failed** (round 2 code); revert: 59 / 68 failed | **127 / 127** |
| Trigger alone (owner DB role, rolled back) | — | move → 42501; un-revoke → 42501; revoke → ok, time forced to now |
| `reservation_api_checks.cjs` | — | 53 / 53 (run after resetting P2; the privacy `--transfer` run leaves P2 with the buyer) |
| `pet_privacy_precheck.sql` (new 7.6: UPDATE privileges + trigger) | revert: `before`, all ok | `after`, all ok (WARN = synthetic) |
| Staging-only revert → re-apply | ok | ok (07:03:18 UTC) |
Migration sha256 now `f78da8057b2a70e43daf267d010b6a495e0e8d5c8d3a5d176314cb6f4c8a3e06`. No app change (no grant UI); Preview E2E not re-run.
Not changed: the creator may still DELETE its grant (removes access, but the row leaves history).

**Still open (privacy is not closed on every path):** photo files of private pets are in a public bucket (a known URL
still loads); owners have no UI for `is_public` / per-pet tiers; access given by a previous owner survives a transfer
(separate PR); the original seller is not a "previous owner"; grant DELETE removes history; `pet-documents` upload has no folder check;
`verification-docs` uses a public URL on a private bucket.

## Still open
- Privacy (`private_columns`): leak closed 2026-10-30 03:43 UTC; 24 h log watch complete (no non-QA error caused by it; see log watches).
- **Vaccine reminder — fix in PR (branch `fix/vaccine-reminders`, staging only; see section below).** Diagnosis: read-only diagnosis 2026-10-31 — `vaccines.pet_id` (bigint) has **no foreign key** to `pets` (production and staging), so PostgREST cannot embed `pets!inner(name,user_id)` → 400 PGRST200 every day at 01:00 UTC since at least 2026-10-28. The function returns 200 `{sent:0}` on any query error, so cron job 1 shows "succeeded" (7/7 runs). Production: 45 vaccine rows / 23 pets, **3 rows point to a pet that no longer exists** (kept), 0 push subscriptions today. Fix: PR #16 (staging-tested; FK only proposed, not added).
- **Possible session exposure (not found, not excluded).** Logs exist from ~2026-08-01. Google logins in that window
  (14, 25, 29, 30 Aug) all used `redirect_to=www.whiskora.pet` and the session reached www. Before Aug: no logs.
  The wildcard and third-party Site URL were open until 19:49:59 UTC today.
  - Sessions created before closure: 136 sessions / 100 users (OAuth 76/58, OTP incl. LINE 34/25, password 26/17);
    used in last 30 days: 4 sessions / 2 users (1 of them an admin).
  - Option scopes: all pre-closure (136/100) vs OAuth+OTP (110/83) vs OAuth only (76/58).
  - Methods tested on **staging** only: (1) `POST /auth/v1/logout?scope=global` with the user's own token — supported
    API, revokes all that user's refresh tokens, but needs a token per user; (2) `delete from auth.sessions` scoped by
    user + `created_at` — refresh tokens cascade-deleted (`refresh_token_not_found`), `/auth/v1/user` → 403, later
    sessions and other users unaffected. In both, an already-issued access token is still accepted by PostgREST
    until it expires (default 1 h). Nothing revoked on production — awaiting approval of scope + method.
- Preview → staging: done (v1.6.0). Older branches without the guard now also build with the staging Preview vars.
- Apex `whiskora.pet` → Cloudflare 530 / error 1033 (dead tunnel); SEO URLs, sitemap, Pet ID demo QR point there.
- Supabase Facebook provider is enabled. (LINE callback no longer trusts `whiskora.vercel.app` — live in v1.6.0.)
- Reservation/transfer write holes: **closed on production 2026-10-30 12:17 UTC** (`20261030121715`). No rows existed at that time; that alone does not prove they were never used (not investigated).
- Pet privacy: live (v1.7.1). Still open: private photo files, access after transfer (PR `feat/transfer-access-reset`, staging), owner UI for `is_public` / tiers, `pet-documents` folder check, `verification-docs` public URL.
- Small follow-ups: `get_my_pending_transfers` is executable by anon (returns 0 rows) — could be limited to `authenticated`; RPC "not found" errors (P0002) surface as HTTP 500; remove PGRST202 fallbacks after a stable week.
- Other DB items: `admin_get_users` no-arg overload, default privileges
  grant ALL to anon on new tables, leaked-password protection off, 7 functions without `search_path`.

## Backlog (separate tasks, not in the privacy rollout)
- **Private files PR (`pet-photos`, `pet-documents`)** — notes for that task:
  - A deleted `pet-photos` object still answered 200 on its public URL right after delete (2026-10-31 07:24:53, QA probe; row gone from `storage.objects`) → CDN / cache keeps serving it. Moving to a private bucket must cover cache lifetime (`cacheControl` on upload, purge) and old URLs already shared or embedded (ID cards, shares, thumbnails).
  - Revoking access to existing files: private bucket + access check + short signed URLs, including old photos and thumbnails; decide what happens to links already handed out.
  - After a transfer, `pet-documents` files stay in the old owner's folder (old owner can still read them, new owner cannot sign them). Do not copy / move them in a trigger, and do not hand the seller's private documents over automatically — decide per document in the private-files PR.
  - `pet-documents` upload policy has no folder check; `verification-docs` uses `getPublicUrl` on a private bucket.
- Pedigree: direct SELECT of pedigree columns stays allowed by the privacy migration — compare with pedigree privacy tiers.
- PKCE flow + `emailRedirectTo`; drop `whiskora.vercel.app` from LINE callback; remove `NEXT_PUBLIC_*` from `web/.env.production`.
- Full 90-day referer/redirect log scan; apex domain repair.
- Separate from the reservation PR: default privileges (anon/authenticated have ALL on new tables; table-level REVOKE on
  `pet_reservations` / `pet_ownership_transfers`), DNS / apex, PKCE, revoking real user sessions.

## Next start
1. Log watches: v1.7.1 until ≥ 2026-11-01 07:24 UTC; v1.8.0 until ≥ 2026-11-01 08:22 UTC (separate).
2. Vaccine reminders: cron job 1 enabled 2026-10-31 12:37:56 UTC — **check the first run 2026-11-01 01:00–07:00 UTC** with `supabase/tests/vaccine_reminder_run_check.sql` + function summary log. Next: send-log history PR (staging). Separate: FK decision, removing `qa-push-mock` on staging.
3. Reservation → transfer: live (v1.7.0 + `20261030121715`, 19:17:15 ICT). Logs checked 12:17:15 → 12:50 UTC: errors only from the QA denial probes (≤ 12:18 UTC), 0 deadlocks. Production happy path untested (staging only).
4. Pet privacy: live (v1.7.1 + `20261031072347`, 2026-10-31 07:23:47 UTC). Next after the transfer PR: private files (signed URLs, cache, old links), owner UI for `is_public` / tiers.
5. Decide: session revocation scope/method; email/Google login test; QA data clean-up.
