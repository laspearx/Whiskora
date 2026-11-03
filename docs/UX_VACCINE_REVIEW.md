# Owner vaccine UX — local review, not deployed

Latest continuation: see **2026-11-03 continuation** below. Earlier results are historical and
must not be treated as verification of a later code tree.

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

### PR #33 review follow-up: failed reads and route races (2026-11-02)

Review base: `0a059e571dc28022df94dda2a1345cd0b206f01d`.

- Every `fetchPetData` starts with cleared vaccine records/error, access/error, health,
  pedigree and selected category. The loaded pet is cleared while loading. A route mismatch
  renders the loader before effects run, so the previous pet's categories cannot flash.
- A per-load sequence invalidates callbacks on another load, route cleanup or unmount.
  Pet, access, health, pedigree, vaccine/related reads, signed URLs, transfer results and the
  loading finalizer check that the request is still current before applying state.
- Failed vaccine reads explicitly replace records with an empty array; overview also refuses
  to render rows while in error, matching the vaccine category and shared summary.
- Failed/missing/rejected access results show an explicit Thai alert and retain null access,
  so unconfirmed categories and vaccine write actions stay closed. Backend rules are unchanged.

New mock scenarios run on both desktop and mobile (20 total cases now defined):

1. Existing gallery delete action triggers a real `fetchPetData` reload after successful history;
   the mock intercepts its synthetic PATCH, then rejects the next vaccine read. Overview and
   vaccine category show errors with no old rows. No real data is written.
2. Existing pedigree Link navigates to another pet with held vaccine/access responses; browser
   Back restores the first pet before the held responses are released. The current pet's name,
   summary, access and add-link destination survive the late responses.
3. Rejected access RPC shows the alert, with no categories, history or vaccine write link.

Actual verification evidence (no claim of a complete 20/20 regression pass):

| Check | Result |
| --- | --- |
| Vaccine unit tests | **22/22 passed** |
| TypeScript | **Passed**, including the final post-browser check |
| ESLint, changed mock spec | Passed |
| Pet detail ESLint vs review base | **9 errors / 49 warnings on both**, no new rule/severity/message diagnostics; existing debt remains |
| Diff whitespace check | Passed |
| New reload + route-race cases | **4/4 passed**, desktop + mobile, in `2026-11-02T05-54-48-978Z-172570` |
| New access-error cases | **2/2 passed**, desktop + mobile, in `2026-11-02T06-07-15-447Z-187203` |
| Expanded 20-case regression | **Incomplete / runtime blocked**, details below |

First full attempt (`2026-11-02T04-50-32-829Z-104516`): 6 passed, one URL assertion timeout
while the create route took 41 seconds to compile, one gallery test interrupted, remaining cases
unrun. Trace/context identified the cold-compilation wait and the hidden gallery-delete control.
The test now hovers the image before clicking and allows 90 seconds for the unchanged exact
create URL assertion. No content, count, access or error assertion was removed.

Second full attempt (`2026-11-02T05-06-44-240Z-126656`): 2 passed, 3 runtime failures
(`page.goto: Page crashed` plus recorded `page-crash`), 15 unrun. Stopped our runner through its
own exec session; lifecycle logs show normal teardown of its owned server. No other process
was stopped. Read-only host snapshot at 05:12 UTC: load 13.16/9.63/6.48, 2749 MB available,
no cgroup OOM events. This does not establish the crash cause. The later scoped run enabled
`pw:browser` diagnostics and tested only the six new cases, rather than looping the regression.
Four passed; two access-error checks hit a strict selector collision with Next's route announcer.
The selector was narrowed to the actual alert text; only those two cases were rerun and passed.
All six new cases therefore have passing evidence across the two scoped runs. Browser tests
are finished; full-regression runtime failures remain a review limitation.

One interrupted development run left malformed generated `.next/dev/types` files. They were
preserved at `/tmp/vaccine-review-corrupt-dev-types-20261102`, regenerated by Next, and excluded
from Git. Production code/configuration and assertions were not weakened to hide those errors.
Local raw logs remain at `/tmp/vaccine-ui-review-state*.log`,
`/tmp/vaccine-ui-state-newcases.log` and `/tmp/vaccine-ui-state-access-final.log`;
results, traces and lifecycle ledgers remain in ignored `web/test-results/vaccine-mock/`.

Preview access limitation remains: the previous head's GitHub Vercel status was success, but the
Vercel connector returned team authorization **403** for metadata/build logs. That is not proof
that a new Preview uses staging. No alternate credential/channel, env change, guard bypass,
Preview browser request, QA login, staging read/write/reset, database regression or production
deployment was attempted. Mock tests do not verify RLS, persistence or reminder delivery.

## Draft PR

Title: Fix pet appointment summaries and mobile vaccine navigation

Pet detail previously hid category navigation on mobile, and its duplicated vaccine summaries
inferred coverage from free-text names and compared date-only appointments against timestamps.
Overview and health now share a neutral recorded-appointment summary using Bangkok calendar dates.
Readable categories remain switchable on mobile, and only the primary owner sees direct links to
the existing vaccine-create form. Stored data and backend permissions are unchanged.

## 2026-11-03 continuation

### Starting state and recovered evidence

- Actual branch / HEAD: `codex/ux-audit` / `4195a27e5bb29e4cce393f6b6a7a42eb257a505d`.
  Working tree was clean, including untracked files; local vs cached upstream was 0 ahead / 0 behind.
  GitHub read-only metadata confirmed Draft PR #33 at that exact head and PR #37 at
  `26e4b4fdecf96dad2647b7182c229c315ca07bb7`. No existing work was reset or replaced.
- The PR #33 description already recorded a complete **20/20** run on `4195a27`, newer than
  this document. Recovered local `2026-11-02T07-39-49-737Z-254933/results.json` agrees:
  expected 20, unexpected/flaky/skipped 0; lifecycle logs show normal child/wrapper exit 0.
  Spec, config and server-wrapper hashes match the PR description. This is verified historical
  evidence for `4195a27` only; it is not reused as a pass for the changes below.
- The requested HQ Monitor object `6683320d587b811af7cfa3abdc9bf8837919a585` is not present
  in this repository's object store (`git cat-file -t` failed), and HEAD has no tracked `monitor/`
  tree. No monitor files, other branches, other worktrees or refs were changed to locate it.

### Changes within the pet-profile UX scope

- Keep the existing load-sequence guards for pet, access, vaccine, health, pedigree, signed URL,
  ownership-transfer and loading-finalizer responses. Clear all pet-scoped read state on reload,
  including image selection, activity/weight/document history, signed URLs, co-owners and pending
  transfer. Close pet-scoped dialogs and clear transfer targets. This avoids stale ancillary data
  when the next read fails or the next pet has no image/history.
- Subscribe to the existing Supabase auth-state events on this page. Sign-out or a changed user
  invalidates reads and clears the profile immediately; sign-out redirects to login and a changed
  signed-in identity reloads permissions. Auth reads are deferred outside the auth callback to
  avoid locking it. Cleanup unsubscribes and cancels the scheduled refresh. No Auth setting or
  shared auth infrastructure was changed.
- Existing primary-owner controls now wait for a successful access result. The hero's weight
  recording link also requires the primary owner and weight access. Hero health/weight values wait
  for their read group. Vaccine write links keep the primary-owner + vaccination-access rule.
- Combined timeline entries now honor vaccination / medical-notes read groups; failed vaccine
  reads cannot appear in the timeline. This closes an alternate rendering path even when a mock
  response contains records for a denied group. Real authorization remains the server's job.
- Catch rejected health reads without an unhandled rejection. Invalidate QR-generation callbacks
  when the share URL changes, so a previous route cannot replace the current route's QR. Preserve
  the current URL's QR across same-pet refreshes; clearing it during every reload would otherwise
  leave it blank because the URL-dependent generation effect does not rerun.
- Visual inspection of the mobile screenshot exposed an existing permanent `Loading...` in an
  empty pedigree. Pedigree reads now have explicit pending, empty and error states. An empty or
  denied result says there is no displayable data; a failed RPC shows a load error. Both the
  completion and error paths still respect the load sequence. The mock suite now has **18 cases
  per viewport (36 total)**, including a pedigree-error case and QR-preservation assertions.
- Expanded the original ten scenarios per viewport with anonymous access, inaccessible private
  pets, transport failure, cross-tab sign-out with pending reads, changed-account access denial,
  sign-out after visible history and refresh after an ownership change. Existing scenarios now
  also exercise Forward navigation, stale image/weight cleanup and denied timeline rendering.
  Auth-state cases use the SDK's real BroadcastChannel notification handler with synthetic local
  sessions; they do not verify password/LINE login, server token revocation or a real account.
  Ownership refresh uses an intercepted existing gallery action and a changed mock owner;
  it does not execute a transfer or certify database grant-reset behavior.

### Runtime investigation and verification

**Final UI status: incomplete / environment blocked. Do not claim 36/36 or independent-review
readiness.** The production page's final hash is `6182d1b3a3807dc4e4a4c4c7ff8dd366b06ad1896842c96f1040cd01d0a08621`.
The Desktop 18/18 result above/below uses that same production page; it predates the added CDP
diagnostics in the mock spec. The final diagnostic-spec run has **0 passed, 1 runtime failure,
35 unrun**, not a complete regression. No results from different trees/runs are combined into
a passing total. The old `4195a27` 20/20 remains historical evidence for that commit only.

- The first sandbox attempt failed before any case started: `connect EPERM 127.0.0.1:3217`.
  This is a localhost sandbox restriction; the authorized host run can open the dedicated port.
  No test-server, browser, deployment or application configuration was weakened.
- First host attempt of the expanded suite: 8 passed, 1 assertion failure, 21 unrun. The new
  Forward assertion expected `/placeholder-pet.jpg`, but the existing owner empty-photo UI
  correctly renders `/icons/icon-paw-pink.png`. The exact expected icon was corrected; no stale
  image, permission or content assertion was removed. Chromium and owned server exited normally.
- Next expanded attempt: 13 passed, 1 harness failure, 20 unrun. Back reached an opaque
  `about:blank` document and the synthetic-session init script attempted localStorage there.
  The harness now restricts seeding to the local mock origin and seeds only once per tab, so
  subsequent document/history navigation cannot silently sign a logged-out user back in.
  The logout/Back case now follows the real pedigree Link to the second pet, signs out while
  its reads are held, releases them, then returns to the first pet through browser Back and
  checks the login redirect. All page-error assertions remain enabled.
- Scoped auth/ownership validation after that harness fix: **8/8 passed**, desktop 4 + mobile 4,
  no retries, 1.7 minutes (`/tmp/whiskora-ux-auth-regression.log`). This is a scoped result only;
  the complete final regression is reported separately rather than assembled from earlier runs.
- Full 34-case attempt before the QR/pedigree changes: **27 passed, 1 runtime failure, 6 unrun**.
  In `/tmp/whiskora-ux-regression-complete.log`, mobile Chromium reported Network Service
  crash/restart at **04:19:59.738 UTC**, GPU process exit 15 at **04:20:05.290**, then the owned
  Next child exited **143 at 04:20:09.287**, with `forwardedSignal: null`. Playwright did not
  begin server teardown until **04:20:12.116**. This distinguishes premature runtime termination
  from normal teardown; it does **not** identify the sender or cause. The failing case recorded
  `page.goto: Page crashed` and `page-crash`, not a content/permission assertion failure.
  Read-only snapshot at 04:20 UTC: load **55.40 / 24.19 / 14.69**, 2642 MB available, no cgroup
  OOM events; `/dev/shm` 3.9 GB available. At 04:24, load fell to 11.14 / 19.28 / 14.72;
  pids.current 385, pids max events 0, CPU quota `max 100000`. These snapshots do not establish
  causation. No unrelated process was stopped and no other workstream was modified.
- After that interruption, TypeScript found malformed generated `.next/dev/types/routes.d.ts`
  and `validator.ts`. Their directory was preserved at
  `/tmp/whiskora-ux-interrupted-dev-types-20261103`, and Next regenerates it on the next local
  server start. No source/configuration/type-check exclusion was changed to hide the errors.
  Final checks below are run against regenerated output after the server stops.
- A project-isolated attempt (`--project=desktop`, then `--project=mobile`) retained all cases,
  one worker, zero retries and fresh servers. Desktop **18/18 passed** in 2.6 minutes
  (`2026-11-03T04-29-41-984Z-113143`); all 18 observations have zero errors/crashes/unexpected
  endpoints/writes, with normal exit 0. Mobile then **7 passed, 1 runtime failure, 10 unrun**
  (`2026-11-03T04-36-45-042Z-121674`): `locator.hover: Target crashed` and `page-crash`.
  In that run the server stayed alive until normal teardown and exited 0. This is a second
  observed failure mode, not the earlier premature server exit. The 04:41 snapshot had load
  4.83 / 6.84 / 8.47 and still no OOM events, so high host load alone is not an established cause.
  Logs: `/tmp/whiskora-ux-desktop-final.log`, `/tmp/whiskora-ux-mobile-final.log`.
- Tried removing the forced full-Chromium channel to use the installed default Chromium Headless
  Shell (build 1248), without a download/upgrade or assertion change. That attempt also failed:
  **3 passed, 1 runtime failure, 32 unrun** (`2026-11-03T04-47-23-861Z-131808`). Added CDP
  `Target.targetCrashed` recording captured **`target-crash:killed:15`** while clicking timeline.
  The mock config was then restored exactly to its starting hash
  `e02b24fe255893977d6f5b40185cd5a255bac387d6f8ada456e3b223c41c34c4`.
  Headless Shell is not presented as a fix; the final diff does not change browser configuration.
- A task-only temporary config `/tmp/whiskora-ux-signals.config.mjs` imports the restored config,
  retains all 36 cases, metrics, assertions, one worker and zero retries, and launches the same
  full Chromium through `/tmp/whiskora-ux-signal-browser`. That wrapper uses installed `strace`
  (`--seccomp-bpf -f -tt -e trace=none -e signal=SIGTERM`), recording signals only, not syscall
  arguments, request bodies, credentials or environment. An initial module-interop setup error
  occurred before any test/server started; `--list` was then checked to show all 36 cases.
- **Decisive signal evidence:** `/tmp/whiskora-ux-browser-signals.log` records renderer PID
  147620 at **05:00:38.390944 UTC** receiving
  `SIGTERM {si_code=SI_USER, si_pid=0, si_uid=61876}`; five more browser processes receive
  the same sender metadata through **05:00:50.074094**. CDP records `killed:15`, including
  the page renderer. Browser teardown starts later, around **05:01:11**, and server teardown
  at **05:01:23.018**. Normal cleanup signals at **05:01:22.612413** / **05:01:22.649112**
  instead identify the Chrome parent **PID 145682 / UID 1000**. Thus the earlier UID-61876
  signals are distinguishable from this run's normal cleanup. The sender identity/policy behind
  PID 0 / UID 61876 remains unknown; no process is blamed or stopped. This identifies user-sent
  SIGTERM termination in this diagnostic run, not an application JavaScript exception or proof
  of the cause of every earlier crash. No cgroup OOM event was observed.
- Diagnostic result: **0 passed, 1 runtime failure, 35 unrun** in
  `2026-11-03T04-56-54-733Z-142352`; first navigation aborted with renderer kills. Reporter
  `skipped: 35` means unrun after `--max-failures=1`, not source-level test skips. Raw output:
  `/tmp/whiskora-ux-signal-regression.log`. The owned browser/strace and server exited normally
  during teardown; no test process remains intentionally running. Further browser loops stopped
  because the UID-61876 SIGTERM sender cannot be controlled within this task's authorization.
  A stable test window/host without that termination is needed for the complete 36-case run.
- Historical renderer crashes on 2026-11-01/02 still have no established root cause. The earlier
  no-OOM snapshots do not prove why those processes crashed. Today's DBus/GLib warnings alone
  are not evidence of a renderer crash. Cold route compilation is tracked separately from crashes.
- Pre-final-static checks: vaccine unit **22/22**, TypeScript and mock-spec ESLint passed before
  the QR/pedigree changes. The subsequent TypeScript attempt hit only the generated-file errors
  described above; final regenerated-output checks are recorded below. Page ESLint
  remains **9 errors / 49 warnings**, identical rule/severity/message multiset to `4195a27`;
  these are existing debt, not a whole-page lint pass. Whitespace diff check passed.

Final static checks after all browser processes stopped:

| Check | Final result |
| --- | --- |
| TypeScript `tsc --noEmit --incremental false`, including regenerated dev types | **Passed**, exit 0 |
| ESLint, final mock spec + restored mock config | **Passed**, exit 0 |
| Vaccine unit tests | **22/22 passed**, zero skipped/failed |
| Existing pet-page ESLint vs `4195a27` | 9 errors / 49 warnings on both; no added rule/severity/message diagnostics |
| Whitespace diff | Passed |
| Added-line credential-pattern scan | Zero findings; not a general secret-audit certification |

Combined final static/unit output: `/tmp/whiskora-ux-final-static-unit.log` (unit output; the
preceding TypeScript and targeted ESLint commands were quiet and the `&&` chain exited 0).
No source/configuration was changed after these checks. Final SHA-256:

- Pet page: `6182d1b3a3807dc4e4a4c4c7ff8dd366b06ad1896842c96f1040cd01d0a08621`
- Mock spec with CDP diagnostics: `b384476b10a59f776c4d0680d4f81043534b5d348d2fd014956bed17fce31411`
- Restored mock config: `e02b24fe255893977d6f5b40185cd5a255bac387d6f8ada456e3b223c41c34c4`
- Unchanged server wrapper: `e15d9a4df6031d45bc3a9577c81566756c04b36570a82ed4858f4248f11ebb9f`

### Preview status (read-only)

- GitHub's Vercel status for `4195a27` is success, targeting deployment
  `4XbU3KC3PHkb2mD7LJ9a4gFMLJUZ` under `laspearxs-projects`.
- A new connector `GET /v13/deployments/{idOrUrl}` with the explicit team scope again returned
  **403 forbidden: Not authorized: Trying to access resource under scope laspearxs-projects**.
  This identifies a **connector/team permission** failure at the metadata API. It does not identify
  Deployment Protection, an application auth error, a bad Preview hostname or application failure.
  Configuration and current staging binding remain unverified because metadata cannot be read.
- **Preview application verification is incomplete.** No alternate identity/channel, protection
  bypass, share URL, credentials pull, env change, Auth change or Preview application request was
  used. No staging/production database was read, written, reset or migrated in this continuation.

### Static compatibility with Security Phase 1 / PR #37

- Compared to the pinned security head only; did not merge, check out or edit Claude's branches.
  The common base is `38860b2806b0d4f1b503d49b98e25fb16e5a7aee`.
- Shared production-code path: `web/app/pets/[id]/page.tsx`. PR #37 removes `note` from its
  explicit pet select (M4). A three-way text merge using temporary copies of the
  final UX file and temporary copies returns exit **0**, with no conflict markers, no `note`
  select, and both the auth-state and timeline guards preserved. No actual branch merge occurred.
- `web/package.json` also combines textually without conflict: #37's version **1.14.1** and
  both vaccine test scripts are retained in the temporary merged JSON. Actual branch files and
  version **1.14.0** remain unchanged; this is static merge evidence, not a version update.
- **Ordering dependency:** standalone #33 still has the old `note` select. It must not be used
  against the M4 contract schema without retaining #37's removal. A conflict-free textual merge
  is not approval to deploy the old app after that contract migration.
- Vaccines, ownership tables/RPCs, RLS predicates, privacy grants, backend auth and storage
  policies are unchanged by #33. Related reads keep the existing server authorization; denied
  reads and fresh ownership/access results discard old UI state. M7 signed-URL authorization
  stays server-side; this UX does not provide fallback credentials or bypass policies.
- No database/RLS/Storage API regression, real ownership transfer, token-revocation test or
  combined-branch execution was performed. Existing unrelated gallery/document/activity write
  authorization is not certified by the vaccine mock suite. Those remain backend/security review
  boundaries; this work does not redesign their role matrix.

Only the pet detail page, local mock spec and this review document are in this continuation's
diff. No push, PR mutation, merge, deployment, migration, secrets or environment changes.

### Handoff status

- Full UI regression on the final tree is **not passed**; hold the requested independent-review
  readiness / merge gate until the complete 36-case suite runs on a stable host. Code and partial
  evidence are available for inspection, with the above restrictions made explicit.
- Preview verification is still incomplete. RLS, real private/account authorization, persistence,
  credential login/token revocation, storage API authorization and real ownership-transfer grant
  reset are not established by these mocks. No production deployment is approved by this work.
- New commits stay local on `codex/ux-audit`; remote Draft PR #33 remains at `4195a27` until
  the owner separately authorizes a push. PR #37 and HQ Monitor were not modified.
