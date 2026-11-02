# Owner vaccine UX — local review, not deployed

## Baseline and scope

- Audit reference: `d0e519ac555000222f7ed096eb1000fd2331e2fa`.
- Fix base: `d0e519ac555000222f7ed096eb1000fd2331e2fa` (unchanged at start).
- Worktree: `/workspaces/Whiskora-codex`; branch: `codex/ux-audit`.
- Reconfirmed on this base: mobile CSS hides category navigation while content remains conditional;
  overview/health duplicate name matching and compare date-only values with the current timestamp.
- Scope: pet detail summary, category navigation and owner vaccine-create entry points only.
  No business profile permissions, migrations, RLS/RPC changes, server reminders, privacy settings,
  auth, Calendar, card downloads or multi-step writes.

## Behavior

- One calendar-date calculation and one health-summary component serve overview and health.
- Appointment buckets preserve all records: no history; missing due date; invalid due date;
  overdue; due today; future appointment. A mixture shows every applicable bucket and its count.
  Failed reads are shown as errors, never as "no history".
- Date-only input must be a real `YYYY-MM-DD`; today's date comes from `Asia/Bangkok`,
  independent of the browser/server timezone. No date-only to current-time comparison.
- Legacy `vaccines` includes free text, deworming and flea treatments. This PR deliberately
  reports recorded care/appointments without classifying vaccine types, equating "วัคซีนรวม"
  with FVRCP, inferring coverage or changing stored names. No affirmative vaccine checkmark.
- Category navigation keeps the existing per-group access rule and waits for the access result.
  Selected content also follows the allowed categories. Mobile uses the existing horizontal scroller.
- Add-vaccine links go directly to `/pets/<id>/vaccines/create`. They require the primary owner
  and vaccination read access, matching the existing create page's primary-owner restriction.
  Co-owners/farm readers do not gain a write action through this change.

## Local verification

Run from `web/` after `npm ci` (Chromium must be installed for Playwright):

```sh
npm run test:unit:vaccine
npm run test:ui:vaccine
npx tsc --noEmit --incremental false
```

Unit tests use Node's native TypeScript support (tested with Node 24). UI tests run the actual
Next.js pages on `127.0.0.1:3217`, with an intercepted `/mock-supabase` endpoint, synthetic session,
and intercepted external HTTP requests; no real credentials, environment files or database needed.
The mock suite has its own config, ignores shared `E2E_BASE_URL`/storage state, refuses server reuse,
blocks service workers and checks navigation without submitting the create form.
The normal E2E config excludes these local-only tests.

Mock browser results cannot prove real database authorization, staging integration, persistence or
reminder delivery. No staging/production access, data creation/cleanup, push, merge or deploy is
part of this review.

### Results (2026-11-01, local)

| Check | Evidence / result |
| --- | --- |
| `npm run test:unit:vaccine` | **22/22 passed**, Node 24.21.0; also 22/22 with `TZ=America/Los_Angeles` |
| `npx tsc --noEmit --incremental false` | **passed** after final code/test changes |
| ESLint: new helper, component, unit test, mock spec and mock config | **passed** |
| ESLint: existing pet detail page vs audit base | 13 errors / 49 warnings → 9 errors / 49 warnings; no added rule/severity/message diagnostics. Remaining findings are existing debt, not a clean whole-page lint pass |
| Desktop browser observations in an earlier local mock run | Actual overview showed missing, overdue, today and future appointment buckets without positive vaccine checkmarks; health category could be selected and rendered the same summary. Summary/category screenshots were inspected during that run. This is partial evidence, not a completed test pass |
| Full desktop/mobile mock suite | **Not passed / blocked by unstable local runtime.** Early harness selector/text-normalisation mistakes were corrected. Chromium repeatedly reported `Target crashed`; some subsequent runs ended with Next webServer exit **143** before tests began. Cause not established. Final attempt ran no UI cases; no mobile or read-only/denied-action pass is claimed |
| Full production build / real authorization / persistence / reminders | **Not tested** |

The mock suite contains 7 cases on each of desktop and mobile: owner navigation + create-form
destination; owner empty state; read-only viewer; denied vaccination category; pending access;
failed vaccine read; all other categories denied by fieldAccess. It does not submit the form.
The read-only action checks cover vaccine entry points in overview and the vaccine category;
unrelated document/gallery/note actions are outside this PR's changes and are not certified by it.
These are written checks pending a complete run,
not evidence that those flows passed. Playwright Clock was replaced by a Date-only test stub so
application/auth timers remain native; the final harness change also still needs browser validation.

Review status: code and unit/static evidence are available; **hold push pending UI verification**.
To finish verification, use a stable local Next.js/Chromium runtime with an available localhost
port 3217 and run `npm run test:ui:vaccine`. No real account, Supabase instance or staging data is
needed. If shared staging becomes necessary later, coordinate a preview/environment, synthetic
accounts, pet fixtures and an agreed test window before any access or writes.

### Follow-up diagnostics and scheduled pause (2026-11-01)

The owner reserved the shared staging/QA fixtures for Claude's PR #31 test window (approximately
60 minutes after its start). Browser tests in this Codespace are **paused until the owner says
Claude is finished**; elapsed time alone is not permission to resume. No browser run has been
started during this pause. No staging access, shared QA account or fixture reset is allowed.

Read-only host diagnostics at 07:55:35 UTC used `free -m`, `uptime`,
`cat /sys/fs/cgroup/memory.events`, `ss -ltnp` and
`ps -eo pid,ppid,pgid,stat,pcpu,pmem,rss,comm --sort=-rss` (no arguments/environment output).
Available memory was 2648 MB; load averages 0.63 / 3.60 / 6.20; `oom` / `oom_kill` were zero;
there was no listener on Codex's dedicated port 3217. This snapshot does **not** prove why an
earlier renderer crashed or exclude resource contention at the time of that crash.
The restricted sandbox hid the host process table and refused netlink, so the host inspection
was read-only outside that sandbox. No process was stopped.

Playwright's installed `lib/runner/index.js` webServer plugin rejects its process-exit promise
with "was not able to start" while waiting for readiness. That wording alone does not establish
the lifecycle phase or sender of a termination signal. Previous runs did not retain sufficient
signal/lifecycle logs, so their **143 cause is unresolved**, not classified as OOM or an app bug.

Prepared local-only instrumentation (not executed yet):

- `scripts/vaccine-mock-server.mjs` logs timestamped spawn/owned-child PID, received signal,
  child exit code/signal and wrapper exit. It refuses a busy port and only forwards a received
  signal to the exact child it spawned. Credentials are not inherited or logged.
- Mock config still uses port 3217, one worker, zero retries, no existing-server reuse. Its
  graceful teardown applies only to the process group Playwright created for this mock server.
- Each attempt has its own `test-results/vaccine-mock/<timestamp>-<pid>/` directory, containing
  `server-events.jsonl`, `case-events.jsonl`, `results.json` and failure artifacts. Prior failure
  traces will not be overwritten by the next run.
- The case ledger records every scheduled case, case start/end, worker and status. Per-case
  attachments record mock API paths, unexpected endpoints, attempted writes, page errors and
  explicit renderer-crash events, without session headers or request bodies. Unknown mock API
  paths fail with 501 rather than silently returning an empty success response.
- Assertions now also check the exact counts in each summary bucket and every denied category.
  No existing assertions were removed. These stronger checks still need an actual browser run.

After the owner ends the scheduling pause, planned command from `web/`:

```sh
DEBUG=pw:webserver npm run test:ui:vaccine
```

Correlate Playwright's "WebServer available" / "Terminating the WebServer" messages with the
server and case ledgers. A signal after the teardown marker is expected cleanup; a server exit
before readiness or with unfinished cases is premature, with sender/cause left unknown unless
additional evidence identifies it. Record runtime failures separately from assertion failures.
Do not restart a passed suite without a new change or unresolved concern. The lifecycle wrapper
has passed `node --check web/scripts/vaccine-mock-server.mjs`. A one-off in-memory `node`
self-check transpiled the reporter with TypeScript and ran it with stubbed filesystem calls:
all 4 JSONL events (run-begin, case-begin, case-end with failure, run-end) parsed separately and
retained case identity/status. It launched no browser/server and wrote no files. This verifies
the ledger format only, not Playwright integration. `git diff --check` also passed. The new
reporter/config/server changes have not yet been verified together in a browser run.
No CI/Vercel configuration or application code was changed in this follow-up preparation.

### Completed local verification (2026-11-02)

The owner explicitly lifted the browser-test pause: Claude completed PR #31 and returned
fixtures on 2026-11-01 at 08:13 UTC. Work resumed in `/workspaces/Whiskora-codex`, branch
`codex/ux-audit`, with the existing uncommitted changes preserved. No other worktree,
staging/QA account or shared fixture was accessed, and no unrelated process was stopped.
Only `.last-run.json` existed before this session; there was no existing complete passing run.

| Check | Result |
| --- | --- |
| `npm run test:unit:vaccine` | **22/22 passed**, Node 24.21.0 (non-failing module-type warning) |
| `npx tsc --noEmit --incremental false` | **passed** |
| ESLint: component, helper, unit test, mock spec/reporter/config/server wrapper | **passed** |
| `git diff --check` | **passed** |
| `DEBUG=pw:webserver npm run test:ui:vaccine` | **14/14 passed**, desktop 7 + mobile 7, one worker, zero retries; 2.4 minutes |

The first attempt was blocked by sandbox localhost permissions (`EPERM`) before any case
started; this is a runtime restriction, not an assertion failure. After escalation, one full
run passed without application or test changes. No assertions were removed or weakened.
The successful run was not repeated.

Evidence (ignored local artifacts, not included in the commit):

- `web/test-results/vaccine-mock/2026-11-02T03-22-11-954Z-15363/`: `results.json`,
  `case-events.jsonl`, `server-events.jsonl` and per-case observations in the JSON report.
- `/tmp/vaccine-ui-20261102-host.log`: complete Playwright/webServer output.
- JSON stats: expected 14, unexpected 0, skipped 0, flaky 0. Ledger: 14 case starts,
  14 passed case ends, run-end passed.
- All 14 mock observations: no page errors, crashes, unexpected API paths or detected writes.
- WebServer available at 03:22:52.276 UTC; teardown began at 03:24:34.869 UTC,
  followed by wrapper SIGTERM at 03:24:34.873 UTC, child exit code 0 at 03:24:35.070 UTC,
  and wrapper exit code 0. This termination is expected cleanup after completed cases.
  The causes of older crashes/exit 143 remain unresolved.

React review: summary remains a pure typed component, shared calculations derive during render,
list keys are stable, and category buttons expose selection via `aria-pressed` inside labelled
navigation. No new hook, dependency or backend behavior was introduced.

Current review status: **local verification complete; ready for local commit/review before push**.
Earlier blocked/pause statements above are historical and superseded by this section.
Limitations remain: mock tests do not prove real database authorization, staging integration,
form persistence or reminder delivery; form submission and full production build were not tested.
Existing pet-page lint debt remains as documented above. Runtime warnings about workspace
lockfiles, middleware convention and logo sizing were observed; they did not fail the suite.
No push, merge, deployment, migration, RPC, cron or Edge Function changes were made.

### Verification after merging main (2026-11-02)

- Preserved reference commit `d0d5b3465acbd53a3b048b945d6bebdbbb9b1473` and merged
  `origin/main` (`38860b2806b0d4f1b503d49b98e25fb16e5a7aee`) without rewriting history.
  Merge commit: `2abe4ad34047bac898304e2b68af15e370a9a15c`. No conflicts.
- `web/package.json` remains version **1.14.0**, with both vaccine test scripts retained.
  Diff against main contains only the 11 vaccine UX/test/review files; PR #31/#32 code,
  rollout documents and existing Preview env guard are unchanged relative to main.
- Post-merge checks: **unit 22/22**, **local/mock UI 14/14** (desktop 7 + mobile 7,
  port 3217, one worker, zero retries, 2.9 minutes), TypeScript and targeted ESLint passed.
  Diff whitespace check passed. No passing suite was repeated without a new code change.
- Run evidence is ignored locally under
  `web/test-results/vaccine-mock/2026-11-02T04-08-28-902Z-52367/`;
  full output is `/tmp/vaccine-ui-merged-main.log`. All 14 case observations have no page
  errors, renderer crashes, unexpected mock API paths or detected writes.
- Teardown started at 04:11:20.945 UTC, wrapper received SIGTERM at 04:11:20.947 UTC,
  child and wrapper exited with code 0 at 04:11:21.371 UTC. Browser tests are finished.
- Pre-push inspection: no runtime logs, traces, cookie/session files, tokens or browser
  artifacts are included in Git. Synthetic session construction remains test code only;
  the credential-pattern scan of changed files returned no findings.
- Claude has reserved staging for DELETE tests. No Preview browser request, staging
  read/write, shared QA login or fixture reset was performed. Only Preview build metadata
  and build logs may be inspected until the owner explicitly lifts this restriction.
  No migration/RPC/cron/Edge Function, environment configuration, merge to main or production
  deployment is part of this work. Mock/RLS/persistence/reminder limitations above still apply.

## Draft PR

Title: Fix pet appointment summaries and mobile vaccine navigation

Pet detail previously hid category navigation on mobile, and its duplicated vaccine summaries
inferred coverage from free-text names and compared date-only appointments against timestamps.
Overview and health now share a neutral recorded-appointment summary using Bangkok calendar dates.
Readable categories remain switchable on mobile, and only the primary owner sees direct links to
the existing vaccine-create form. Stored data and backend permissions are unchanged.
