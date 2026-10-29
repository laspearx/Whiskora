# Privacy fix — staging & production rollout

Status 2026-10-30: **nothing applied anywhere.** Supabase MCP connected; production inventory done read-only (see overview → Known gaps). Org LaspearX is on the free plan with a single project (production) and no branches. Migrations validated only on a local
synthetic Postgres (`supabase/tests/`, 64/64 checks + concurrency). The production leak
(anon can read `profiles.email/phone/address` and `pets` health columns) is still open.

## What is needed from the project owner
1. **DB access for Claude**: run `/mcp` in Claude Code → "claude.ai Supabase" → authorize the org that owns the Whiskora project. (Read-only checks first; nothing is changed on production without an explicit go-ahead.)
2. **A staging database** — pick one:
   - Free: a second project on the Supabase free plan (the free plan has a small limit on active free projects — check the dashboard for a free slot; no cost if one is available).
   - Paid: Supabase Branching or an extra project on a paid org (billed compute) — confirm cost before creating.
3. **Schema copy to staging** (schema only, no user rows): `supabase db dump --schema-only` from production (needs the DB connection string or an access token), restore into staging. Do not copy `auth.users` / `profiles` rows.
4. **Staging test accounts** (email+password, synthetic): farm owner, manager, staff, viewer, buyer, unrelated user; one farm workspace with those memberships; one pet with status `เปิดจอง`.

## Staging steps (in order)
1. Read-only inventory: tables/columns of `profiles`, `pets`, `vaccines`, `pet_activities`, `pet_weights`, `pet_documents`; all RLS policies; table + column grants for `anon`/`authenticated`; functions with `prosecdef`; triggers on `pets`, `pet_reservations`, `pet_ownership_transfers`; existing indexes/constraints on reservations/transfers.
2. Compare with the migrations; run the PRE-CHECKS in `20261029100000_private_columns.sql`. Any SECURITY INVOKER function that reads revoked columns must be fixed first.
3. Baseline: run the privilege checks (`supabase/tests/privacy_checks.sql` helper + cases with staging UUIDs) → expect the leak.
4. Apply `20261029100000_private_columns.sql` **alone**. Re-run checks → expect denied for private columns, RPCs working.
5. Also check with signed-in unrelated user: `vaccines`, `pet_activities`, `pet_weights`, `pet_documents`, storage `pet-documents` / `verification-docs`.
6. Deploy the app branch to a staging Vercel environment pointing at staging Supabase; run `E2E_BASE_URL=<staging> E2E_*=… npm run test:e2e` — the signed-in suite must report **0 skipped**; then the manual checklist in `web/e2e/README.md`.
7. Separately apply `20261029200000_reservation_transfer_pipeline.sql`; run `reservation_cases.sql` with staging UUIDs and the reservation part of the E2E suite.

## Production order (after staging passes and on explicit approval)
1. **Deploy the app first** (it works before and after the migration; RPC calls fall back while functions are missing).
2. Smoke-test production as a visitor (public spec) and one internal account.
3. Apply `20261029100000_private_columns.sql` in a low-traffic window.
4. Immediately verify (anon key, no user data printed): `profiles?select=email` and `pets?select=allergies` → permission denied; `profiles?select=id,full_name` → 200; sign in with an internal account and open /profile, /profile/edit (save), /pets/<id>/edit (health fields prefilled), transfer lookup, member invite search, /admin/verifications.
5. Watch Vercel/Supabase logs for `42501 permission denied` from app requests for 24 h.
6. Later, after its own staging pass: `20261029200000_reservation_transfer_pipeline.sql`.
7. After a stable week: remove the PGRST202 fallbacks in `lib/profile.ts` and the reservations page.

## If something breaks after step 3
- Fix forward first: find the failing query in logs (it will be a `select('*')` / private column read) and change it to the column lists in `lib/columns.ts`.
- Do **not** re-grant table-level SELECT to make a page work. If a full rollback is unavoidable, run the commented rollback block in the migration (it re-opens the leak — treat as an incident, time-box it, and re-apply after the fix).
- The fallbacks in `lib/profile.ts` cannot re-open access: they only run when the RPC is missing, and then the direct query is still subject to the revoked column grants (it fails closed and returns nothing).
