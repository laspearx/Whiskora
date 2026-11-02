# Project HQ — Discord monitoring (first version, prepared, NOT installed)

Status 2026-11-02: branch `ops/discord-monitoring` (from main `38860b2`), PR #35 (draft), separate from PR #34. Code in
`ops/monitor/`, tested with mocks only. Nothing sent to Discord, no schedule, no secret, no new repo, no runtime account,
nothing on production changed. No AI agent acts on production: the monitor only reads public pages and posts to Discord.

Owner direction (review of `2dffcff`): target = a new **private repo `project-hq-ops`** (not created yet; the code moves
there once this review passes); **Whiskora only**; **every 30 min**; per-project routes **whiskora-alerts /
whiskora-releases** (existing Discord structure — no shared channel to create); no DB role / migration for the cron
check yet; Whiskora's build-scope stays as it is (the monitor does not merge into Whiskora).

## 1. What exists today (surveyed)
| Item | State |
|---|---|
| GitHub repo `laspearx/Whiskora` | public; one workflow (`version-bump.yml`); Actions secrets / variables not readable from this session (403) |
| Vercel | Production `www.whiskora.pet`; footer shows `V1.14.0` (`web/lib/version.ts` → `Footer.tsx`) |
| Supabase | pg_cron job 1 (vaccine reminders 01:00 UTC) → Edge Function; manual check `supabase/tests/vaccine_reminder_run_check.sql`; no watcher |
| Monitoring / Discord | none |

## 2. Runtime — GitHub Actions in the private repo `project-hq-ops`
Facts (GitHub docs, checked 2026-11-02):
- Private repos on GitHub Free: included usage **USD 12 / month**, shown as money; Linux x64 2-core **USD 0.006 / min**.
- **Each job is rounded up to a whole minute** ("GitHub rounds the minutes and partial minutes each job uses up to the
  nearest whole minute").
- The included amount belongs to the **account**: every private repo's Actions use (and other metered products that
  draw from it) shares it — whether anything else already uses it is visible only in Billing.
- Schedule: shortest 5 min; runs may be **delayed or dropped** under load (avoid minute 0); default branch only.

Cost of this monitor (30 min, 1 job / run): 48 runs / day × 28–31 days = **1,344–1,488 runs / month**, each billed
**≥ 1 min** (2 min if a run passes 60 s, e.g. slow sites + Discord retries: budget 60 s + checks 10 s each).
- all runs ≤ 1 min: 1,344–1,488 min ≈ **USD 8.06–8.93**;
- if every run took 2 min: 2,688–2,976 min ≈ USD 16.13–17.86 (**over** the USD 12);
- manual runs, retries and **any other private-repo Actions use on the account** come on top.
So 30 min is **not guaranteed** to stay inside the included amount. Before any schedule: check Billing (current use,
spending limit / budget = USD 0 so nothing is charged), measure real run time from a few manual runs, get approval.
Paid usage stays off.

Other runtimes considered: Cloudflare Workers Free (100,000 requests / day, 5 cron triggers / account, 10 ms CPU) — new
account + state store, later option; Vercel Cron / Supabase pg_cron — inside the watched system, not suitable.
Sources: docs.github.com/en/billing/reference/actions-runner-pricing ·
docs.github.com/en/billing/concepts/product-billing/github-actions ·
docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows ·
docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching · github.com/actions/download-artifact ·
developers.cloudflare.com/workers/platform/limits · docs.discord.com/developers/topics/rate-limits ·
docs.discord.com/developers/resources/webhook

## 3. Config — one file per project
- `ops/monitor/monitor.json`: `routes.monitor` (monitor's own problems → `DISCORD_WEBHOOK_WHISKORA_ALERTS` while
  Whiskora is the only project), defaults (timeout 10 s, 2 failures in a row → down, 1 pass → recovered, reminder every
  6 h while down, release mismatch alert after 60 min), canaries, delivery limits, intended interval 30 min.
- `ops/monitor/projects/whiskora.json`: `routes.alerts = DISCORD_WEBHOOK_WHISKORA_ALERTS` (→ #whiskora-alerts),
  `routes.releases = DISCORD_WEBHOOK_WHISKORA_RELEASES` (→ #whiskora-releases); checks: home, login, farm-hub
  (HTTP 200), release (footer version vs `web/lib/version.ts` on main).
- likanara / natchworks / glowlog: `enabled: false`, URLs `null` (none guessed); the validator refuses to enable a
  project with an unknown URL or without its own (or a shared) alerts / releases route.
- Routes are **names of env vars**; a URL in a route is refused. New project = one JSON + its two webhook secrets.

## 4. Behaviour
| Rule | How |
|---|---|
| alerts ≠ releases | `#whiskora-alerts`: down / recovered / served ≠ main for > 60 min; `#whiskora-releases`: served version changed |
| release wording | only observed facts: **"ตรวจพบเวอร์ชันที่เสิร์ฟเปลี่ยน: a → b · ตรงกับ main / ไม่ตรงกับ main (main = x) / เทียบ main ไม่ได้ (…)"**. Never "deployed" / "build OK" (a footer number does not prove either), no GitHub Release links |
| no noise | nothing for passing checks; 1 failure is not an alert, 2 in a row are; one reminder per 6 h while down; first sight of a version is a baseline |
| down and back | 🔴 down, 🟢 recovered with duration and last reason |
| grouping | one message per project per run |
| site ≠ monitor | all canaries failing → no site is judged (states untouched), "ตัวตรวจมีปัญหา (ไม่ใช่เว็บล่ม)" instead; check bugs, unreadable version / main source, delivery failures and lost state are monitor problems |
| timeout / rate limit | 10 s per probe and per post; 429 → `retry_after` (float s) / `Retry-After`; `X-RateLimit-Remaining: 0` → wait `Reset-After`; 5xx / timeout → up to 3 attempts; delivery budget 60 s |
| not delivered | kept in the outbox (max 50, 24 h); 401 / 403 / 404 → stop using that webhook, "replace the secret"; 400 → dropped + reported; exit 1 → GitHub's failed-run notice |
| secrets | webhook URLs only from env; logs redact webhook URLs; `allowed_mentions: {parse: []}` |
| modes | **preview** (default): prints what would be posted (incl. the outbox), **changes and writes no state**, counts nothing as sent · **trial** (`--trial-state f`): advances a separate state file, posts nothing; refused if it is the real state file · **send**: only with `--send` **and** `MONITOR_SEND=1` |

### State between runs
State = open incidents (down since …, last reminder), release baseline, monitor health, outbox. Text is stable (sorted,
counters capped, no run timestamp), so a healthy run produces the same file as the one before.
| Storage (first version) | Rights | Limits |
|---|---|---|
| **Artifact `monitor-state` (recommended)** — upload after each run, next run downloads the newest via the REST API | `GITHUB_TOKEN` `actions: read` (+ the upload that every job may do); **no new credential**, no write to code | not permanent: retention set to 7 days (retention defaults / maxima and storage billing for private repos **not verified** this round — check in Billing / Settings → Actions before choosing); deleting a run deletes its artifacts; assumes expired artifacts stay listed as `expired` (not verified — if they disappear, a long gap looks like a first run and the loss notice is skipped) |
| Actions cache | none extra | evicted after **7 days without access**, 10 GB / repo with oldest-first eviction, restore from current or default branch — can vanish at any time |
| Commit to a `monitor-state` branch | `contents: write` for the workflow (it could then push to any branch of that repo; branch protection on private repos may need a paid plan — not checked) | durable, history; more rights than needed for v1 |

Missing / corrupt state (detected on load: no file after earlier state existed, invalid JSON, wrong shape / version):
the run starts fresh and posts at once (no threshold) to the monitor route: incidents being tracked are forgotten — one
still failing is reported "down" again after the threshold, the "recovered" message of the old incident never comes;
undelivered messages from the outbox are lost; the served version becomes the new baseline. `--first-run` (no earlier
state at all) starts silently.

Tests: `node --test ops/monitor/test/*.test.mjs` → **33 / 33** (mock fetch + fake clock): thresholds, reminder,
recovery, grouping, timeout, canary outage, check bug, release baseline / change + main match / main unreadable /
mismatch alert / pattern drift, 429 short + beyond budget + outbox, bucket wait, Discord timeout + 5xx, 404, missing /
wrong secret, no mentions, 2,000 chars, preview with a pending outbox (state identical, nothing sent), previews before
switching to send (alert still posted), trial (own state, no post), CLI refuses trial = real state, save → load across
runs (incident → recovery with duration; outbox delivered next run), stable text on healthy runs, missing / corrupt /
unsupported state (notice + re-detection), first run silent, no secret in config, redaction.

## 5. Knowing that the monitor stopped
| | What it is | What it can / cannot tell |
|---|---|---|
| GitHub failed-run notice | e-mail when a run fails (exit 1: delivery problem, config error, bug) | only runs that **ran** and failed; a disabled schedule, an account / billing stop or dropped runs send nothing |
| Weekly status post (optional, not built) | the monitor posts a short summary once a week | a person must notice that it **did not come**; it **cannot** detect its own absence |
| External heartbeat (not set up) | each run pings an outside service; the service alerts when pings stop | the only one that detects "not running at all"; needs an account with an outside service (cost / terms not checked) — owner decision, nothing signed up |

## 6. Vaccine cron (design only — nothing changed, no DB role / migration this round)
Proof of a real run (`docs/NOTIFICATIONS_SETUP.md` §4): `cron.job_run_details` "succeeded" is **not** proof; proof =
`net._http_response` of the run (HTTP 200 + `outcome`, kept **6 h**), the function summary log line, and
`vaccine_reminder_deliveries` by status. Least privilege for a later automatic check: one `SECURITY DEFINER` function
returning aggregates only + a dedicated login role with only `EXECUTE` on it (not anon / authenticated / service_role,
no Management API token), its connection string as a runtime secret, checked once a day ~01:30 UTC.

## 7. Install plan (each step on the owner's go-ahead)
**Discord (existing Project HQ structure, private):** in **#whiskora-alerts**: Edit Channel → Integrations → Webhooks →
New Webhook → name `Project HQ Monitor` → Copy Webhook URL; same in **#whiskora-releases**. No new channel, no bot,
no Administrator, no invites. Don't paste the URLs in chat, Git or files. (Menu names from Discord's usual layout.)
**GitHub (after `project-hq-ops` exists, private):** Settings → Secrets and variables → Actions → Secrets:
`DISCORD_WEBHOOK_WHISKORA_ALERTS`, `DISCORD_WEBHOOK_WHISKORA_RELEASES`. Leave variable `MONITOR_SEND` unset.
Billing: confirm current Actions use and set the budget / spending limit to USD 0 for metered Actions.
**Then (on approval):** move `ops/monitor/` there; copy `workflow.example.yml` to `.github/workflows/monitor.yml` with
actions pinned to SHAs, **manual trigger only**; a few manual preview runs (log only, no post, measure run time);
`MONITOR_SEND=1` + one manual run → expect no post when healthy; schedule only after Billing + approval.
Rollback: unset `MONITOR_SEND` (instant preview), disable the workflow, or delete the webhook in Discord.

## 8. Open decisions
- Create `project-hq-ops` (private) and move the code — after this review.
- State storage (§4): artifact (recommended) / cache / state branch.
- Schedule + Billing check (§2); heartbeat option (§5); vaccine-cron role (§6, later).
- URLs of likanara / natchworks / glowlog.
