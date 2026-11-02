# Project HQ — Discord monitoring (first version, prepared, NOT installed)

Status 2026-11-02: branch `ops/discord-monitoring` (from main `38860b2`), separate from PR #34. Code in `ops/monitor/`,
tested with mocks only. Nothing sent to Discord, no schedule enabled, no secret created, nothing on production changed.
No AI agent acts on production: the monitor only reads public pages and posts to Discord.

## 1. What exists today (surveyed)
| Item | State |
|---|---|
| GitHub repo `laspearx/Whiskora` | **public**; one workflow (`version-bump.yml`, push to main); Actions secrets / variables not readable from this session (403) |
| Vercel | Production `www.whiskora.pet`, Previews protected; footer shows `V1.14.0` (`web/lib/version.ts` → `Footer.tsx`) |
| Supabase | pg_cron job 1 (vaccine reminders 01:00 UTC) → Edge Function `send-push-notifications`; manual run check `supabase/tests/vaccine_reminder_run_check.sql`; no automatic watcher (`docs/NOTIFICATIONS_SETUP.md` §4) |
| Monitoring / Discord | none in the repo |
| Build scope | `ops/**` is classified `app` by `web/scripts/build-scope.sh` → merging this into Whiskora as is would bump the version and build Production (decision D2) |

## 2. Runtime (no terminal, no Codespace) — recommendation: GitHub Actions
| Option | Cost (checked 2026-11-02) | Limits | Fit |
|---|---|---|---|
| **GitHub Actions, scheduled workflow** | Public repo + standard runners: **free**. Private repo: included usage on GitHub Free = **USD 12 / month** (shown as money, not minutes); Linux x64 2-core **USD 0.006 / min** (≈ 2,000 min / month — my arithmetic). Per-job rounding not stated on that page — treat each run as ≥ 1 min until measured. | shortest schedule **5 min**; runs can be **delayed or dropped** under load (avoid minute 0); runs only on the default branch; **public repos: schedules auto-disabled after 60 days without repo activity** | secrets UI built in, logs, failure e-mails to the owner, no extra account |
| Cloudflare Workers (Cron Triggers) | Free plan: 100,000 requests / day, **5 cron triggers per account**, 10 ms CPU / invocation, 50 subrequests / invocation | state needs KV / D1 (own limits, not checked); new account + wrangler deploy | possible later; more setup |
| Vercel Cron | not checked (Hobby limits not verified this round) | runs inside the thing it watches | not suitable as an outside watcher |
| Supabase pg_cron + Edge Function | — | inside the watched system; would change cron / functions (out of scope) | no |

Private-repo arithmetic (if D1 = private): every 15 min ≈ 2,880 runs / month → over the included USD 12 if each run is
billed as 1 min; every 30 min ≈ 1,440 → inside. Public repo: free at any interval ≥ 5 min.
Sources: docs.github.com/en/billing/concepts/product-billing/github-actions ·
docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows (schedule) ·
developers.cloudflare.com/workers/platform/limits · docs.discord.com/developers/topics/rate-limits ·
docs.discord.com/developers/resources/webhook

## 3. Config — one file per project
- `ops/monitor/monitor.json`: routes (**names of env vars**, never URLs), defaults (timeout 10 s, 2 failures in a row →
  down, 1 pass → recovered, reminder every 6 h while down, release lag 45 min), canaries, delivery limits.
- `ops/monitor/projects/<id>.json`: `enabled`, `checks` (`http`: url, expected status, optional text / max ms;
  `release`: page + version pattern, optional source of the expected version), optional own `routes`.
- Enabled now: **whiskora** (home, login, farm-hub, release: served footer version vs `web/lib/version.ts` on main).
  **likanara, natchworks, glowlog: disabled, URLs `null`** — the validator refuses to enable a project with an unknown URL.
- New project later = one new JSON file (+ its own webhook env var name if it should post to its own channel).

## 4. Behaviour
| Rule | How |
|---|---|
| alerts ≠ releases | `alerts` route: site down / recovered / release lag; `releases` route: new version seen live |
| no noise | nothing posted for passing checks; 1 failure is not an alert (2 in a row are); one reminder per 6 h while down; first sight of a version is a baseline |
| down **and** back to normal | `down` → 🔴, `recovered` → 🟢 with duration |
| grouping | one message per project per run (several failing checks = one post) |
| site problem ≠ monitor problem | if every canary fails, the run judges no site (states untouched) and reports **"ตัวตรวจมีปัญหา (ไม่ใช่เว็บล่ม)"** instead; bugs in a check, unreadable version / release source, delivery failures are monitor issues too, with their own down / recovered |
| timeout | 10 s per probe (AbortController); Discord post 10 s |
| rate limit | 429 → waits `retry_after` (float seconds) / `Retry-After`; `X-RateLimit-Remaining: 0` → waits `Reset-After` before the next post on that webhook; 5xx / timeout → up to 3 attempts; total delivery budget 60 s |
| not delivered | kept in the state outbox for the next run (max 50, max 24 h); 401 / 403 / 404 → stop using that webhook this run, "replace the secret"; 400 → dropped + reported; the run exits 1 → GitHub's failed-run e-mail is the fallback signal |
| secrets | webhook URLs only from env (runtime secrets); config refuses URLs as route values; logs redact any webhook URL; payload `allowed_mentions: {parse: []}` (no @everyone / roles) |
| safety switch | dry run unless **both** `--send` and `MONITOR_SEND=1` |

Tests: `node --test ops/monitor/test/*.test.mjs` → **23 / 23** (mock fetch + fake clock: thresholds, reminder,
recovery, grouping, timeout, canary outage, check bug, release baseline / new version / lag / pattern drift, 429 short
and beyond budget + outbox, bucket wait, timeout + 5xx retry, 404, missing / wrong secret, no mentions, 2,000 chars,
dry run, redaction, no secret in config). Dry run against the live public pages (GET only, no Discord):
4 checks, 0 failing, served 1.14.0 = main 1.14.0, 0 messages.

## 5. Vaccine cron (design only — nothing changed)
Evidence of a real run (from `docs/NOTIFICATIONS_SETUP.md` §4): `cron.job_run_details` "succeeded" is **not** proof.
Proof = `net._http_response` of the run (status 200 + `outcome`, kept **6 h**), the function summary log line, and
`vaccine_reminder_deliveries` by status (`uncertain` / stuck `sending` need a person).
Least privilege for an automatic check (needs a separate owner decision + migration + secret — not done):
- one `SECURITY DEFINER` function, e.g. `ops_vaccine_run_status()`, returning **aggregates only** (last run time, HTTP
  status, outcome, counts by delivery status, job active) — no rows, no user ids, no tokens;
- a dedicated login role with **only `EXECUTE` on that function** (no table grants, not `anon` / `authenticated`, not
  service_role, no Management API token); its connection string as a runtime secret;
- run once a day ~01:30 UTC (inside the 6 h window); alert when no run / HTTP ≠ 200 / outcome error / uncertain > 0;
  recovered on the next good day.

## 6. Install plan (each step on the owner's go-ahead)
**ชัช in Discord (Project HQ server, private; menu names from Discord's usual layout — the help page could not be fetched this round):**
1. Create a category (e.g. `ops`) visible only to you: Edit Category → Permissions → `@everyone` → View Channel ✗.
   Channels inside: `#alerts`, `#releases` (sync permissions with the category). No client rooms, no invites, no bot.
2. In `#alerts`: Edit Channel → Integrations → Webhooks → New Webhook → name `Project HQ Monitor` → Copy Webhook URL.
   Same in `#releases`. (Needs Manage Webhooks — you have it as server owner. No bot, no Administrator.)
3. Do **not** paste the URLs in chat, in Git or in any file.

**ชัช in GitHub (repository chosen in D1):**
4. Settings → Secrets and variables → Actions → **Secrets** → New: `DISCORD_WEBHOOK_ALERTS`, `DISCORD_WEBHOOK_RELEASES`.
5. Same page → **Variables**: leave `MONITOR_SEND` unset for the first manual run (dry run in the log).

**Then (on approval, by Claude):** copy `ops/monitor/workflow.example.yml` to `.github/workflows/monitor.yml` with
actions pinned to SHAs and only `workflow_dispatch`; you run it once (Actions → Run workflow) → dry-run log; set
`MONITOR_SEND=1` → one manual run → expect **no** post (all healthy). Optional: one test post to `#alerts` only if you
want to see the format. Then un-comment the schedule.
Rollback: unset `MONITOR_SEND` (instant dry run) or disable the workflow; delete the webhook in Discord to revoke it.

## 7. Decisions for the owner
- **D1 Runtime home:** (a) a new **private** repo `project-hq-ops` (recommended: the project list stays private; costs
  per §2 — 30-min interval stays inside the free USD 12, 15-min may not) or (b) a new public repo (free; URLs and project
  names public; schedule disabled after 60 days without activity) or (c) inside Whiskora (public; needs D2).
- **D2** If (c): add `ops/` to the `none` list of `web/scripts/build-scope.sh` (otherwise every monitor change bumps the
  version and builds Production).
- **D3 Interval:** 15 or 30 min (alerts need 2 failures → first alert after 30–60 min of downtime).
- **D4 Channels:** one `#alerts` + `#releases` for all projects (per-project routes possible later), names / category.
- **D5 Vaccine-cron check (§5):** whether to add the DB role + function (a migration on production + a new secret).
- **D6 "Is the monitor itself running?"** GitHub e-mails failed scheduled runs by default (to the user who last edited the schedule; not re-checked), but a disabled / never-started schedule sends
  nothing. Options: a weekly "still running" post (off by default), or an external heartbeat service (not checked).
- URLs of likanara / natchworks / glowlog (none guessed).

Not done / limits: no real Discord post, no schedule, no secrets, no new repo, no runtime account; Cloudflare / Vercel
costs not fully verified; GitHub per-job minute rounding not confirmed on the billing page; state lives in the Actions
cache (GitHub evicts caches unused for 7 days — from GitHub docs, not re-checked this round — a gap longer than that restarts from a fresh baseline: possibly one extra alert).
