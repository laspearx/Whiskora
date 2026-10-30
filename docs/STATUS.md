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
- **App permission errors: 0 so far. 24 h watch NOT complete** — checked only up to 03:50:13 UTC; continue until ≥ 2026-10-31 03:44 UTC
  (query `edge_logs` status ≥ 400 and `postgres_logs` `42501`/`permission denied`, excluding the probes listed above).

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
1. Owner's login results (email, Google, LINE) → if OK, confirm Redirect URLs again with the probe.
2. Owner approval for the production privacy migration → follow `docs/PRIVACY_ROLLOUT.md` steps 4–7.
3. Decide session revocation scope/method; move Preview to staging (Vercel Preview env + rebuild + bundle check).
