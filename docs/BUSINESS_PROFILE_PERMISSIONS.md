# Business profile edits by role — staging only

Status 2026-11-01: branch `feat/business-profile-permissions`, applied on **staging only** (both steps). Not merged,
not on production. Scope approved 2026-11-01 (`docs/PARTNER_CREATE_BUSINESS.md` §6). Out of scope: review / publish,
marketplace, bookings, payment.

## 1. What changes
| | Before (production v1.13.0) | After |
|---|---|---|
| Who may edit | DB: entity owner only, **all columns**; shop / service edit pages open for managers but their save matched 0 rows and still said "saved" | `update_business_profile(p_type, p_id, p_fields)`: role from the server — owner = `farms|shops|services.user_id`, manager = workspace member (`workspace_role_of`) |
| Owner fields | everything incl. `is_published`, `user_id` (RLS kept `user_id` = self) | name, owner name, phone, bio, address + pin, logo / cover, species (farm) / supported_species / category |
| Manager fields | none (silent 0 rows) | bio, phone, logo / cover, species / supported_species / category |
| Staff / viewer / others | none | none (42501) |
| Never via the profile RPC | — | `user_id`, owner / role, `id`, timestamps, `is_verified`, `verified_at`, `verification_status`, `verification_note`, `is_published`, `facebook_link`, `line_id`, unknown keys (22023); owner-only key from a manager → 42501 |
| Dashboard logo / cover (farm / shop / service overview) | direct UPDATE, error ignored, picture replaced on screen anyway (shops / services sent a non-existent `updated_at` → never saved) | RPC; the picture is set from the value the RPC returns (stored row); refusal → error alert, picture unchanged |
| Shop edit / service settings | success after any non-error response (manager: 0 rows, still "saved") | success only after the RPC returns the stored profile; the form is refilled from that row (`lib/businessProfileForm.ts`: 0 / '' / null replace old values), then `router.back()` — the overview loads the row again; managers see identity fields locked |
| Farm edit (owner only) | error alert or `router.back()` + `router.refresh()` | same navigation; success only after the RPC returned the stored row; the overview reloads from the server (the form itself is not refilled before leaving) |
| Farm UI | owner-only `/edit`, owner-only photo change | unchanged (owner-only). The RPC also allows a farm manager's content fields; opening farm UI to managers is a separate decision |
| Direct API UPDATE | all columns (RLS: owner) | step 2: only `farms.verification_status` (verify page; #29 trigger rules) and `services.is_published` (existing publish button, owner via RLS) |
| Workspace | name / avatar not kept in step after renames | renames / logo changes are mirrored to the business workspace |

Photos (new value): only on this environment's Storage origin (`platform_settings.storage_public_origin`), as an
existing object in `<type>-assets/<entity id>/…` (dashboard uploads, `?t=<digits>` cache-busting kept) or in
`partner-photos/<type>s/<caller uid>/…` uploaded by the caller (register uploads). **An unchanged value is kept as it is**
— existing URLs (including empty strings / other formats) are never re-validated or rewritten. `null` clears.

Not changed: storage policies (`can_edit_business_assets`: owner / manager may upload to the business folder),
member RPCs, workspace guard, verification guard, create_business, SELECT / INSERT / DELETE grants and RLS policies.

## 2. Tests (staging + Preview `whiskora-ozrp43jju` = `57c13ec`, synthetic QA accounts)
| Suite | Result |
|---|---|
| `business_profile_checks.cjs` step 1 / step 2 | **161 / 161** each — per type: owner saves identity + content (response = stored row, workspace renamed), partial update, 14 forbidden keys 22023, invalid values 22023, manager content ok / identity 42501 / `is_published` refused, staff / viewer / stranger / other owner 42501, anon 401, unknown id 404; photos: dashboard asset `?t=` ok, manager cover ok, staff upload refused by storage, register photo ok, other business folder / other user's photo / other site / other project / bad query / never uploaded / other bucket refused, legacy and empty values kept unchanged, null clears; direct UPDATE refused in step 2; publish button unchanged (owner yes, manager 0 rows); verify request path still works and `is_verified` still refused |
| Regression (step 2) | verification guard 30 / 30, create_business 75 / 75, storage 23 / 23, workspace guard 21 / 21, members 51 / 51 (verification F2 / F6 and create_business D4 now edit through the RPC once direct UPDATE is closed) |
| E2E `business-profile.spec.ts` (desktop + mobile) | 10 / 10: owner save → stored value; server refusal → error, no success, nothing saved; manager sees locked identity fields and sends only bio / phone / species; staff redirected; dashboard cover change saved with `?t=`; tampered photo URL refused, picture unchanged |

Leftover on staging: 3 tiny synthetic files per API run in `farm-assets/<deleted QA farm id>/` (no API delete policy;
SQL deletes on storage are blocked) and the E2E covers in `shop-assets/990201/`.

## 3. Rollout (production — not done; each step on the owner's go-ahead)
**Step 1 — RPC (additive; the live app keeps working)**
1. Pin the PR head; check sha256 below; `web/` = tested Preview.
2. Read-only `business_profile_precheck.sql` → `before`; note counts (services published, farms pending, managers).
3. Apply `20261101190000` (one transaction, `lock_timeout` 5 s, `schema_migrations` row in the same transaction).
4. Postcheck → `step1`; QA probes that write nothing (anon 401, forbidden key 22023, someone else's business 42501).
5. Merge (pinned) → bot bump → Production build; confirm the edit pages / dashboards call `update_business_profile`.

**Step 2 — limit direct UPDATE (only after the new app is live)**
6. Apply `20261101200000`; postcheck → `step2` and `step2_verdict = OK` (effective UPDATE rights of anon / authenticated
   from table grants, column grants and PUBLIC = exactly authenticated `farms.verification_status` + `services.is_published`).
   Any `STOP …` → stop and report; do not change other ACLs to make it pass.

**Recovery — fix forward.** If a page breaks after step 2, hide that entry and fix it in a new PR; do not re-grant
UPDATE on farms / shops / services. Rolling the **app** back to v1.13.0 while step 2 is applied is not a clean fallback —
what that version would do (read from its code):
| v1.13.0 path | Result after step 2 |
|---|---|
| Farm edit, shop edit, service settings | UPDATE refused (42501) → error alert, nothing saved |
| Farm / shop / service overview: change logo / cover | the old code ignores the error and puts the new picture on screen; **nothing is saved** and the old picture returns on reload (shops / services already behaved like this before; farms did save) — misleading |
| Verify page (`verification_status` → pending), publish button (`is_published`) | keep working (column grants kept) |
So an app rollback would need step 2 undone, and that only on a separate owner decision with the exact columns
(never a broad UPDATE grant). The preferred path is to keep step 2 and fix the new app forward.

Checksums (sha256):
- `20261101190000_business_profile_rpc.sql` `c3fff819d85028617fa447f35173712dc99ebd744f052ea312a00948fe02bb8f`
- `20261101200000_business_profile_update_privileges.sql` `1d37f90c5eb0275408d9d8cbcc5c289d4055d4665ca2e54a48cda4613b9949a2`

**Preview ↔ staging:** staging is at step 2. Previews without this PR: profile saves and dashboard photo changes fail
with an error (no data change); everything else unaffected. Not switched back without telling everyone.
