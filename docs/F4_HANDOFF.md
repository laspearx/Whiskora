# F4 LINE identity — session handoff (2026-11-10)

For the next Claude Code session. Read this first, then `docs/F4_LINE_IDENTITY.md` (design + review history),
`WHISKORA_PLATFORM_OVERVIEW.md` (platform reference, CLAUDE.md requires reading it) and the staging kit
`supabase/staging/f4_line_identity/`. Owner: "ชัช" (Thai; reports in Thai). No credentials are in this file.

## 0. Current state at a glance
| Item | State |
|---|---|
| Repo / branch | `laspearx/Whiskora` · `security/f4-line-identity` · HEAD `c910a04` (this handoff commit follows it) |
| PR | **#40 Draft, not merged**, base `main` `c29c393` (v1.14.2, live), mergeable clean. PR description is STALE: it still says the migration is applied nowhere — it IS on staging (§6). Update the body only if the owner allows GitHub writes beyond commits |
| Production Supabase | `vhudldcizmbpujedojei` — **F4 migration NOT applied**, no F4 code deployed, nothing changed by F4 |
| Staging Supabase | `wpxcukrwmegwzfccbbga` (Free plan, **no platform backup / PITR**) — F4 migration applied 2026-11-10 03:40 UTC |
| Live app | v1.14.2 (`c29c393`, deployment `dpl_B4tAELvQhkFzm48bP3kXVqZpzNbU`) — still has the old LINE flow (C1–C4 open until F4 ships) |
| Preview | https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app (Vercel SSO protected, Supabase staging, LINE **off**) |
| Phase C (synthetic UAT, real Auth) | 51 PASS / 0 FAIL / 7 NOT VERIFIED |
| Phase D1 (LINE on one Preview) | code merged into the branch, **inert** (allow-lists empty, no Vercel vars, no LINE channel) |
| Phase D2 Part A (owner browser UAT, sessions) | 9/9 PASS by the owner; 3 items still NOT VERIFIED (§10) |
| Release | **NO-GO for production** (§12) |

## 1. Whiskora + auth architecture (short)
Next.js 16.4.5 App Router (`web/`), Supabase (Postgres 17, GoTrue v2.197.0), Vercel (project `prj_Ifb5e0FyDXz5klpRz7n0pYkjxUQq`,
team `team_igA7KcL8SZNq8YQhTJWih0GS`). Production builds only on the bot "chore: bump version" commit
(`web/scripts/vercel-ignore.sh`, `version-bump.yml`). Auth methods: email/password, Google OAuth, LINE Login (custom
routes `web/app/api/auth/line/*`: LINE OAuth → server creates/finds a Supabase user → `generateLink` + `verifyOtp` →
session). LINE-only users have placeholder emails `line_<lineid lower>@line.whiskora.internal`.
Build guard `web/lib/deploy-env-guard.mjs` (run from `next.config.ts`): Preview must use staging and no live secrets.
Production `mailer_autoconfirm: true`; staging Confirm email ON (default mailer only delivers to org members).

## 2. F4 goal
Before F4 (live v1.14.2) the LINE login picked accounts by user-writable `user_metadata.line_id` / LINE email, scanned
`listUsers` page 1, and confirmed links by cookie without a session (findings C1–C4). F4 makes the database the only
source of truth for the LINE ↔ account mapping, makes linking atomic, and migrates legacy LINE-only accounts only after
a verified credential reset (so planted passwords / sessions die). Production audits (aggregate only): 108 users, 24
legacy LINE-only placeholder accounts, 1 Google + claim, 0 duplicates; all 24 "Tier A" signals (not used for any
automatic change).

## 3. Review history (independent reviewer = Codex)
| Rev | Commit | Verdict / findings | Fix |
|---|---|---|---|
| 1 | `193d287` | NO-GO: H1 legacy link kept planted password/sessions; H2 non-atomic link lifecycle; M1 recovery without evidence/approval; M2 partial failure; L1 unchecked writes; L2 recovery pagination | rev 2 |
| 2 | `3da5844` | (re-review, preliminary) #1 internal `f4_*` callable by service_role via Supabase default privileges; #2 re-link after successful unlink (take + claim were 2 RPCs); #3 in-flight GoTrue requests change credentials after rotation | rev 3 |
| 3 | `b8b5720` | **No independent re-review result yet** (Codex output was cut off before its final report) | — |
All rev-1 and rev-2 findings were verified against the code (rev-2 #3 against GoTrue v2.197.0 source: `UserUpdate`
checks the session in middleware, hashes, then opens the transaction).

## 4. What F4 rev 3 does (evidence in parentheses)
- Migration `supabase/migrations/20261110090000_line_identity_map.sql`: tables `line_identities` (UNIQUE line_id,
  UNIQUE user_id), `line_link_pending`, `line_identity_ops`, `line_identity_audit` (append-only trigger),
  `line_credential_freeze`; RLS on, no policies, no grants to anon/authenticated/service_role; 17 SECURITY DEFINER API
  functions (EXECUTE → service_role only), internal `f4_*` helpers executable by nobody; audit sequence revoked;
  advisory locks LINE id → account; migration guard fails on any privilege deviation.
- Atomic confirm: `line_link_confirm` = consume pending + claim (or open legacy op) in one transaction under the unlink
  locks; unlink deletes pending and ends ops.
- Legacy accounts: op begin freezes credentials → app rotates password to a random secret (Auth admin API, revokes all
  sessions) → `line_op_mark_reset` verifies the bcrypt hash is that secret's and no session remains → `line_op_commit`
  re-checks digest / sessions / email_change / identities, then maps.
- Credential freeze triggers on Auth tables (fire only for frozen accounts):
  `f4_credential_freeze` BEFORE UPDATE ON `auth.users` (password/email/email_change/phone/phone_change change),
  `f4_sign_in_freeze` BEFORE INSERT ON `auth.mfa_amr_claims` (no sign-in during op; grace: only otp/magiclink),
  `f4_identity_freeze` BEFORE INSERT/UPDATE OF user_id ON `auth.identities`. Freeze lasts op begin → 10 min after end.
- App: `web/lib/lineServer.ts`, `web/lib/lineAuth.ts`, routes `web/app/api/auth/line/{route,callback,confirm,status}`,
  recovery script `supabase/scripts/line_identity_recovery.mjs` (runbook `docs/LINE_ACCOUNT_RECOVERY.md`).
- Phase D1 (`a22f1b0`): `web/lib/line-uat.mjs` (UAT branch + fixed Preview URL), guard allowance, `lineRoutesDisabled`
  / `isLineUatPreview` in `web/lib/deploy-env.ts`, `web/lib/lineOrigin.ts` (UAT callback trusts only the Preview, never
  www.whiskora.pet). Notifications still use `isPreviewDeploy` (off on every Preview).

## 5. Automated test results (local; mocks clearly marked)
| Suite | Result | Notes |
|---|---|---|
| SQL `supabase/tests/local/f4_line_identity_test.sql` | 100/100 | throwaway Postgres 16, stub reproduces Supabase default privileges |
| Race `web/scripts/line-identity-race.test.mjs` | 8/8 | two real psql sessions, deterministic blocking |
| Unit `line-auth.test.mjs` + guard `deploy-env-guard.test.mjs` + dashboard | 33/33 | guard: 16 allow/refuse cases incl. production URL/key, wrong branch, missing flag, callback origins |
| Integration `web/scripts/line-auth.integration.mjs` | 67/67 | built app + **mock** GoTrue/LINE mirrored into local Postgres with the real migration |
| Playwright F4 / security | 40/40 (intermittent 1 fail) / 42/42 | flaky: `en: legacy confirm…` mobile (UI timing, mocked routes) — fix separately |
| tsc / eslint | OK | |
How to run: Postgres at `/var/lib/postgresql/f4test/data` port 54329 (`F4_PG="-h 127.0.0.1 -p 54329 -U postgres"`);
build for integration with a clean env (`env -i … NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 …`); Playwright needs
`executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'` override.

## 6. Staging migration (approval B, done)
Preflight 11/11; recovery proof on staging itself (apply + 14 checks + rollback script + fingerprint compare in one
transaction, rolled back on purpose → identical fingerprints); applied 03:40 UTC, recorded as
`20261110034009 line_identity_map` (tool version ≠ file `20261110090000`; staging history already diverged from repo);
verify 14/14; smoke: API ok, helpers/tables/sequence denied; Auth rows unchanged. Advisor: +5 INFO (RLS no policy,
intended), +3 WARN search_path on invoker helpers (`f4_valid_line`, `f4_new_ref`, `line_identity_audit_immutable`;
low, fix in a later revision). Kit: `00_preflight`, `05_fingerprint`, `20_verify`, `30_rollback_impact`, `40_rollback`
(drops Auth triggers first; refuses with data unless `f4.rollback_ack`).

## 7. Phase C — synthetic UAT, real Supabase Auth on staging
51 PASS / 0 FAIL / 7 NOT VERIFIED (one first-run FAIL was a test-timing artefact — account < 2 min = `creating` by
design — re-checked PASS). Auth regression with triggers installed: create user, unconfirmed login refused, confirm,
password login, refresh, admin password update (old refresh token revoked), OTP, admin email change — PASS. F4 vs real
Auth: link/replay/unlink-then-old-confirm/concurrent confirms, login_create + OTP, legacy op (planted sign-in and email
change refused by triggers, rotation once, second change refused, reset verified on real bcrypt, commit, grace),
in-flight-first abort, admin recovery — PASS. NOT VERIFIED: public `/signup` with `@example.com` (mailer rejects →
rolls back), `GET/PUT /auth/v1/user` + `/logout` with user JWT from the cloud session (egress proxy → `bad_jwt`), real
LINE + app routes + UI, recovery script on staging. 6 synthetic users deleted; 45/46 snapshot tables byte-identical.

## 8. Staging data notes
- 8 QA seed accounts `a0000000-0000-4000-8000-00000000000{1..8}` — never modify / delete.
- 1 owner browser-UAT account (created via site signup 2026-11-10 ~08:01 UTC) — **keep** (owner wants it for Part A
  remaining tests); delete only when the owner says so. Users now: 9.
- `f4_uat_snapshot` schema (46 tables + manifest + `schema_defs`; password hashes / tokens removed; postgres-only, not in
  Data API exposed schemas) — **do not drop** without approval. It is NOT an independent backup.
- `line_identity_audit`: 16 synthetic rows — keep (append-only; never disable the trigger).
- F4 tables otherwise empty (0 mapping / pending / ops / freeze) as of 08:10 UTC.

## 9. Phase D1 — LINE on one Preview (code done, inert)
Activation needs, in order: (1) owner creates LINE provider `Whiskora Staging` + LINE Login channel (Web, callback
`https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app/api/auth/line/callback`, Developing,
no email permission, testers in Roles); (2) Supabase staging secret key `vercel-preview-uat`; (3) owner computes sha256
locally (`read -rs V; printf %s "$V" | shasum -a 256; unset V`) for the secret key and the channel id and sends ONLY
the hashes; (4) a reviewed commit adds them to `STAGING_SERVICE_KEY_SHA256` / `STAGING_LINE_CHANNEL_ID_SHA256` in
`web/lib/deploy-env-guard.mjs`; (5) owner adds Vercel vars, Preview + branch `security/f4-line-identity` only,
Sensitive: `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `NEXT_PUBLIC_SITE_URL` (Preview URL),
`F4_PREVIEW_LINE_UAT=1`; (6) build log must show `[deploy-env-guard] preview: ok` and `/api/auth/line/status` must
answer 401 (enabled) instead of `{"disabled":true}`. Full guide: `supabase/staging/f4_line_identity/PHASE_D_PREVIEW_PLAN.md`.
Verified so far: Preview bundle (12/12 chunks) has only staging URL + publishable key; simulated builds: wrong branch
blocked, UAT build ok with no secret in `.next/static`; UAT callback never redirects to production. `sb_secret_` keys
work with Auth Admin API / RPC per Supabase docs (gateway translates; 401 from browsers) — confirm with the real key in
Part B.

## 10. Phase D2 — owner browser UAT (kept separate from automated results)
Part A (2026-11-10, Preview `a22f1b0`/`b048cb1`, staging), owner-observed, server logs confirm:
email signup ✔, confirmation mail received ✔, login before confirmation refused ✔, confirm ✔, login after ✔, Profile ✔,
Connections ✔, Dashboard ✔, logout + login again ✔. Server evidence: `GET /auth/v1/user` 200 with the real session
(08:03:02), pre-logout session row deleted, no Postgres errors, F4 tables clean; 4 × `/authorize` 400 `provider is not
enabled` = Google button (Google disabled on staging, expected). Details: `BROWSER_UAT_SESSION.md`.
**Still NOT VERIFIED (Part A):** (1) session refresh with a real session; (2) password update with a real session;
(3) refresh-token refusal after logout (owner-observed). The app has **no change-password / forgot-password screen**.
Console snippets were proposed (they read the token inside the owner's own tab and send nothing elsewhere) but not run;
the owner asked the next session to re-check and offer the safest method — prefer: (1) passive — keep the tab open
> 65 min, reload, then confirm `grant_type=refresh_token` 200 in staging auth logs; (2)/(3) only with explicit owner
consent; never ask for tokens/passwords/keys; never ask to disable browser protections. Otherwise keep NOT VERIFIED.
Part B (LINE login, link, unlink, confirm replay, concurrent confirm, legacy recovery, rotation/revocation): blocked on §9.
Google OAuth: NOT VERIFIED (staging provider disabled; needs a separate staging Google client).

## 11. Remaining limitations / known risks
Access tokens issued before a reset stay valid until `exp` (data access, not credentials); freeze grace assumes no Auth
request lasts > 10 min; Auth-table triggers depend on columns email/email_change/encrypted_password/phone/phone_change/
user_id (a Supabase Auth upgrade changing them could fail — rollback drops triggers); H2 path 1 (email signup → Google
auto-link) open; public signup can create placeholder-looking accounts (review only, never sign-in); 3 advisor WARNs;
migration-history mismatch on staging; staging has no independent backup; flaky Playwright test; app lacks
password-change / reset UI; GitHub reports Dependabot alerts on `main` (out of scope).

## 12. Release blockers (F4 is NOT production-ready)
1. Browser UAT incomplete (Part A 3 items, all of Part B / real LINE OAuth).
2. Independent review of rev 3 (+ D1 guard/route change) not done.
3. H2 path 1 unfixed. 4. Pre-reset access tokens valid until `exp` — confirm production JWT expiry.
5. 10-minute freeze grace assumption accepted by owner? 6. PR #37 must be reconciled (overlaps 7 app files; case-
sensitive evidence SQL). 7. 24 legacy LINE-only users: support channel, reviewer for recovery, user communication.
8. Aggregate check that production password hashes are bcrypt. 9. Production migration plan (history alignment,
backup, lock window) — **not approved**. 10. Post-deploy real LINE smoke + recovery queue watch.

## 13. Approvals (owner)
Approved and DONE: A (privilege fix), B (staging migration), C (synthetic UAT on staging, cleanup), D1 code on PR #40,
D2 Part A browser UAT, commits/pushes to Draft PR #40, read-only staging inspection, read-only Vercel/GitHub checks.
Approved but WAITING on owner: D1 activation inputs (LINE channel, staging secret key, sha256 hashes, Vercel vars).
**NOT approved:** production migration, production deploy, merging PR #40, production secrets / Auth config / env
changes, setting or changing any secret or Vercel variable by Claude, evidence stamping / backfill, editing PR #37 or
#38, deleting `f4_uat_snapshot`, deleting audit rows or disabling the audit trigger, rolling back the staging
migration (E), creating/deleting users beyond what an approval names, deleting the owner's UAT account or QA seeds.

## 14. Security rules the next session must keep
Never put passwords, access/refresh tokens, secret keys, channel secrets or connection strings in the repo, chat
reports or logs; ask only for sha256 fingerprints; never decrypt Vercel env values; production data only as aggregate
counts (no ids / emails / LINE ids); never use real production accounts; never trust `user_metadata` as ownership;
never move a LINE identity without reliable evidence; no auto-merge; do not disable LINE Login on production; do not
disable Vercel SSO; keep notifications off on Preview; stop and report if anything affects normal authentication.
Cloud-session limitation: the egress proxy injects the staging secret key into Supabase requests, so user-JWT endpoints
cannot be tested from the container (`bad_jwt`) — user-session tests must run in the owner's browser.

## 15. First steps for the new session
1. Read this file, `docs/F4_LINE_IDENTITY.md`, `WHISKORA_PLATFORM_OVERVIEW.md`; `git fetch` and confirm HEAD of
   `security/f4-line-identity` and PR #40 state (Draft, unmerged).
2. Read-only staging check: users 9 (8 QA seeds), F4 tables empty except 16 audit rows, 3 `f4_*` triggers present,
   `f4_uat_snapshot` present.
3. Ask the owner which track first: (a) finish Part A (offer the passive refresh test first; console tests only with
   consent), or (b) D1 activation — wait for the two sha256 hashes, then add them in one reviewed commit and verify the
   Preview build + `/api/auth/line/status`.
4. Do not start Part B until the build log shows the allowance and the owner confirms the LINE channel is staging-only.
