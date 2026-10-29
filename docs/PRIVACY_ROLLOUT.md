# Privacy fix — staging & production rollout

Status 2026-10-30: **applied on staging only** (`whiskora-staging`, ref `wpxcukrwmegwzfccbbga`). Production
(`vhudldcizmbpujedojei`) has only the role hotfix; the read leak (anon can read `profiles.email/phone/address`
and `pets` health columns) is **still open on production**. Nothing below has been done on production.

## What ships (pinned)
| Item | Value |
| --- | --- |
| App | `web/` tree `c14e7444a8b6` = `web/` of commits `25f37b8` … `45f6071` and every later commit that does not touch `web/` (check: `git diff --stat 45f6071 <release sha> -- web` is empty) |
| Migration | `supabase/migrations/20261029100000_private_columns.sql` as in the release commit (sha256 `b7338da6…7f7e`), applied **alone**. Its SQL (non-comment lines) is identical to what was applied on staging from `45f6071`; only header comments changed |
| Gate | `supabase/tests/privacy_precheck.sql` (read-only) |
| Verify | `supabase/tests/privacy_postcheck.sql` (rolled-back transaction, counts only) |
| **Not** in this rollout | `20261029200000_reservation_transfer_pipeline.sql`, dropping the `admin_get_users` no-arg overload, `pet_reservations` UPDATE policy, default privileges, leaked-password protection, push/email setup |

## Evidence (2026-10-30, app built from a clean `git archive 45f6071`, staging env only — 0 production refs in the bundle)
| Staging schema state | API checks (`staging_api_checks.py`) | E2E desktop + mobile | Server log |
| --- | --- | --- | --- |
| = production today (grants, policies, functions, triggers diffed; only pg_net differs), no reservation RPC | 80 pass / 24 fail — all 24 are the known leak or the not-yet-created RPCs | **50 / 50**, 0 skipped | 0 errors |
| after `20261029100000` (applied with psql, same file) | **107 / 0 / 0 skipped** | **50 / 50**, 0 skipped | 0 errors |

- `privacy_precheck.sql`: all ok on staging **and on production** (read-only, 2026-10-30). Production also has
  `pet_ownership_transfers.reservation_id`, the `converted`-setting transfer trigger, and no
  `farm_set_reservation_status` — same as staging.
- `privacy_postcheck.sql` on staging after the migration: 16 / 16 ok (anon, unrelated user, owner).
- Reservation → transfer E2E (reserve, confirm, double-click, send transfer, buyer accepts) passes in both states
  using the app's fallback path; the reservation row ends `converted` via the existing trigger.
- Not covered: email-confirmation signup (needs a real inbox), Google/LINE login, push/email notifications.

## Why not a privacy-only branch
`ae19b10` (privacy readiness) conflicts with `main` in 4 files and builds on the earlier commits of this branch
(columns, profile helpers, pages they rewrote). A split branch would be a new, untested combination. The whole
branch was instead tested against the production-equal schema, before and after the migration (above).
Consequence: the app deploy also ships the other changes in the PR (trust copy, locale, i18n, homepage, roles,
reservation fallback UI) — review the PR as a whole.

## Production plan (each step needs the owner's go-ahead; stop on any failure)
1. **Freeze**: PR head approved; record its sha; confirm `git diff --stat 45f6071 <sha> -- web` is empty.
   Otherwise rebuild + rerun the staging evidence first.
2. **Deploy the app only** (merge → Vercel production from `main`, or promote the PR's preview build).
   Do not touch the database in this step.
3. **Smoke test production (before migration)**: `E2E_BASE_URL=https://<prod> npx playwright test e2e/public.spec.ts`;
   sign in with one internal account → /profile, /profile/edit (save), /pets/<id>/edit (health prefilled),
   transfer lookup by email, member invite search, /admin/users list non-empty, /admin/verifications.
   Watch Vercel + Supabase logs ~30 min. If anything fails here, roll the app back (safe: the DB is unchanged).
4. **Gate**: run `privacy_precheck.sql` on production → every row `ok = t` and `state: before`.
   Note the time; pick a low-traffic window.
5. **Apply** `20261029100000_private_columns.sql` exactly as committed (check `sha256sum` against the value above) via Supabase MCP
   `apply_migration` (name `private_columns`, so it is recorded in migration history like the hotfix).
   It is one transaction — on error nothing changes.
6. **Verify immediately**:
   - `privacy_precheck.sql` → `state: after`, `get_my_profile present`.
   - `privacy_postcheck.sql` with `owner` = the owner's own account, `stranger` = a second internal account,
     `pet` = one of the owner's pets → all `ok = t` (anon, unrelated user, owner).
   - Anon over HTTP (status codes only): `profiles?select=email` → 401/403, `profiles?select=id,full_name` → 200,
     `pets?select=allergies` → 401/403, `pets?select=id,name` → 200.
   - Repeat the signed-in smoke of step 3 with the internal account.
7. **Watch** Vercel/Supabase logs for `42501` / `permission denied` from app requests for 24 h.

## If the app misbehaves after step 5
- **Fix forward.** Find the failing request in the logs (it will be a `select('*')` or a private column read),
  switch it to the lists in `web/lib/columns.ts` / the RPCs in `web/lib/profile.ts`, and deploy.
- **Never re-grant table-level SELECT** (or column SELECT on email/phone/address/health) to make a page work.
  If one feature is broken, disable or hide that feature instead.
- **Do not roll the app back to `main` / any build before `25f37b8`** after step 5: that code does ~29 reads the
  migration denies (profiles/pets `select('*')`, email columns, profile upserts) and would break more pages.
  Vercel Instant Rollback goes to exactly such a build — only use it to a deployment whose `web/` tree is
  `c14e7444a8b6` or later and compatible.
- The migration's commented rollback block re-opens the leak (and the role column grant). It is an incident
  measure only: needs the owner's explicit decision, time-boxed, re-apply after the fix.
- The fallbacks in `lib/profile.ts` cannot re-open access: they only run when an RPC is missing, and the direct
  query is still subject to the revoked grants (it fails closed).

## After a stable week (separate changes)
- Remove the PGRST202 fallbacks in `lib/profile.ts` and the reservations page.
- `20261029200000_reservation_transfer_pipeline.sql`: own staging pass first (`reservation_cases.sql`, concurrency
  script, reservation E2E), then its own production approval.

## Staging tooling
- Schema copy: `supabase/staging/dump_restore.sh` (+ `platform_objects.sql`); synthetic accounts:
  `supabase/staging/seed_synthetic.sql` (`@example.com`, password only in `~/.whiskora/staging_qa_password`).
- Staging is left in the **after-migration** state.
