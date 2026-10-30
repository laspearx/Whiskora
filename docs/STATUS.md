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

## Still open
- Privacy: leak closed 2026-10-30 03:43 UTC; owner re-test passed 03:50 UTC; 24 h log watch in progress (until ≥ 2026-10-31 03:44 UTC).
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
- Preview deployments still use production env (not yet moved to staging). App fallbacks to check:
  `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` (also in tracked `web/.env.production`, used when Preview vars are unset),
  `NEXT_PUBLIC_SITE_URL` (auth callback + LINE route fall back to request origin / `https://www.whiskora.pet`).
- Apex `whiskora.pet` → Cloudflare 530 / error 1033 (dead tunnel); SEO URLs, sitemap, Pet ID demo QR point there.
- Supabase Facebook provider is enabled; LINE callback code still whitelists `whiskora.vercel.app`.
- Other DB items: `pet_reservations` UPDATE policy too broad, `admin_get_users` no-arg overload, default privileges
  grant ALL to anon on new tables, leaked-password protection off, 7 functions without `search_path`.

## Backlog (separate tasks, not in the privacy rollout)
- Pedigree: direct SELECT of pedigree columns stays allowed by the privacy migration — compare with pedigree privacy tiers.
- Pet keeps `ติดจอง` after the buyer accepts the transfer.
- PKCE flow + `emailRedirectTo`; drop `whiskora.vercel.app` from LINE callback; remove `NEXT_PUBLIC_*` from `web/.env.production`.
- Full 90-day referer/redirect log scan; apex domain repair; reservation migration `20261029200000` staging pass.

## Next start
1. Close the privacy rollout round after the 24 h log watch (profile save proven with the QA account after the hotfix; owner re-test not needed).
2. Privacy 24 h log watch until ≥ 2026-10-31 03:44 UTC (10:44 ICT).
3. Review `docs/PREVIEW_STAGING_PLAN.md` (hotfix #9 is deployed as v1.5.1).
4. Decide: session revocation scope/method; email/Google login test; QA data clean-up.
