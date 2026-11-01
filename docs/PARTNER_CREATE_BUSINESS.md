# Create a business atomically (partner PR 2, part 1) — staging only

Status 2026-11-01: on branch `feat/atomic-business-create`, applied on **staging only** (both steps). Not merged, not on
production. Follows `docs/PARTNER_SYSTEM_AUDIT.md` §4–5. Out of scope here: review / publish, marketplace, bookings,
payment, CI, and any change to who may edit a business profile (proposal in §6).

## 1. What changes
| | Before | After |
|---|---|---|
| Register farm / shop / service | 3 client writes: entity → workspace → `ensure_workspace_owner_membership`; workspace / owner errors were ignored | one RPC `create_business(p_type, p_fields, p_request_key)` → entity + workspace + owner row in **one transaction** |
| Owner | client sent `user_id` / `owner_id` (checked by RLS / guard) | always `auth.uid()`; no owner argument; `user_id`, `owner_id`, `role`, `id`, … in `p_fields` → refused |
| Fields | anything the table accepts | allow-list per type (§2); unknown key → `22023`; approval / publish columns keep table defaults |
| Photos | any URL | must be a `partner-photos` object **the caller uploaded** under `<farms|shops|services>/<uid>/` |
| Double submit / lost response | could create two businesses | same caller + same key + same data → same business (`replayed = true`); same key + other data → `P0001` |
| `supported_species` (shops) | JS array sent to a text column | comma-joined, like services (what the dashboards and public pages parse) |
| Direct API INSERT on `farms` / `shops` / `services` / `workspaces` | allowed (guarded) | **closed** by step 2 (`20261101170000`), after the new app is live |

Kept as installed: `workspaces_guard` (API UPDATE of type / entity / owner), member RPCs and invitations, storage
scoping (`can_edit_business_assets`), UPDATE / DELETE rights on businesses. The RPC runs as definer, so it checks
ownership itself: the entity is inserted with `user_id = auth.uid()` and the workspace with `owner_id = auth.uid()`.

## 2. Accepted fields
All types: `<type>_name` (required, ≤ 120), `owner_name` (required, ≤ 120), `phone` (required, ≤ 30), `province`
(required), `lat` / `lng` (required numbers, ±90 / ±180), `bio` (≤ 2000), `address`, `house_no`, `room_no`, `moo`, `soi`,
`road`, `sub_district`, `district`, `postal_code`, `image_url`, `cover_url`.
Farm: `species` (required, free text ≤ 60 — the form allows a custom species). Shop: `supported_species` (required,
list of ids `^[a-z_]{1,30}$`, ≤ 20). Service: `supported_species` + `category` (required, id `^[a-z_]{1,40}$`).
Never accepted: `user_id`, `owner_id`, `role`, `id`, `created_at`, `updated_at`, `is_verified`, `verified_at`,
`verification_status`, `verification_note`, `is_published`, `facebook_link`, `line_id`, `entity_id`, anything else.

## 3. Idempotency
`business_create_requests (user_id, request_key)` primary key, RLS on, no API grants. The claim row is inserted first in
the same transaction (`on conflict do nothing`): a concurrent twin waits on the key, then reads the committed result.
If the transaction fails, the claim rolls back with it, so the key can be retried. Keys are per caller — another user
sending the same key gets their own business. The app (`web/lib/createBusiness.ts`) keeps one key per form content:
a retry of the same form re-sends it; editing the form makes a new key (a further business is allowed by design).
Rows are small and kept; a retention clean-up can be added later if needed.

## 4. Photos left behind when saving fails
Photos are uploaded to `partner-photos/<farms|shops|services>/<uid>/…` before the business exists (Storage is not part
of the transaction). Rule: **nothing is deleted automatically.**
- Failed save: the form keeps the uploaded URLs, so a retry uses the same files (no new upload, no orphan).
- Abandoned form or replaced photo: the file stays. `supabase/tests/partner_photos_orphans.sql` (read-only) counts
  files no farm / shop / service / workspace of **any** user points at, by folder and age (> 7 days).
- Removal, if wanted later, is a separate owner decision: per file, older than the grace period, through the Storage
  API — never files that any row references, never by SQL. Storage policies already limit a user's delete to their own
  folder.

## 5. Tests (staging `wpxcukrwmegwzfccbbga`, synthetic QA accounts; Preview `whiskora-e6etdfxm2` = `9fdbda7`)
| Suite | Result |
|---|---|
| `create_business_checks.cjs` step 1 (RPC only) | 60 / 60 |
| `create_business_checks.cjs` step 2 (direct INSERT closed) | **64 / 64** (run twice): anon 401; claims table 403; farm / shop / service each = entity + workspace + one owner row for the caller, defaults kept; replay = same ids, nothing new; same key + other data `P0001`; other user + same key → own business; new key → second business allowed; 9 forged / system fields `22023`, extra `p_owner` arg `PGRST202`; other user's photo, wrong folder, external URL, never-uploaded photo, bad / missing / too-long input `22023`; 10 parallel same key → 1 business; 5 parallel different keys → 5 complete; **fault injected at claim / entity (×3 types) / workspace / member / final update → error and row counts unchanged; same key then succeeds**; member RPC / owner-row RPC / storage scoping / guard on the new business; direct INSERT farms / shops / services / workspaces 403; owner UPDATE still works |
| `workspace_guard_checks.cjs` | 21 / 21 in step 1 and step 2 (L1 / L2 / L7 / L8 expect 403 once direct INSERT is closed) |
| `workspace_members_checks.cjs` / `partner_storage_checks.cjs` | 51 / 51, 23 / 23 |
| Rollback on staging | down (`staging_only/create_business_down_STAGING_ONLY.sql`) → `before`; step 1 → `step1`; step 2 → `step2`; counts unchanged each time |
| E2E on Preview (`register-business.spec.ts`, desktop + mobile) | 4 / 4: response dropped after commit → retry → same key, **one** shop with workspace + owner row; server refusal → error shown, nothing saved |
| Full E2E on Preview | 76 passed, 2 skipped (the "listed but not public" pair, `E2E_PRIVATE_LISTED_PET_ID` unset — same as before) |
| Preview bundle | staging ref only |

## 6. Proposal — who may edit a business profile (not changed in this PR; needs a decision)
Today: DB UPDATE on `farms` / `shops` / `services` = entity owner only, **all columns**. The shop / service edit pages
open for managers, but their save matches 0 rows and the page still reports success (known gap in the audit).
Found while testing (rolled back on staging): the owner can set `farms.is_verified = true` / `verified_at` directly,
and `services.is_published` without review. Proposed, as a separate PR:

| Role | Profile fields | Not allowed |
|---|---|---|
| Owner | name, owner name, phone, address + pin, bio, species / category, logo / cover | verification, publish / approval state, `user_id` |
| Manager | bio, phone, logo / cover, species / category (day-to-day content) | name, owner name, address + pin (identity, part of review), verification, publish |
| Staff / viewer | none | everything |

Implementation sketch: `update_business_profile(p_type, p_id, p_fields)` with the same allow-list pattern per role
(role from `workspace_role_of`), column privileges so the API cannot UPDATE `is_verified`, `verified_at`,
`verification_status` (except owner → `pending` from the verify page), `is_published`, `user_id`; fix the manager page
to show the real result. Publish / approval rules belong to the review PR (audit PR 3).

## 7. Rollout (production — not done; needs the owner's go-ahead per step)
1. Pin the PR head; confirm migration sha256 (below) and that `web/` differs from main only in the register pages,
   `lib/createBusiness.ts` and `e2e/`.
2. Precheck (read-only): `create_business_precheck.sql` → `state = before`, `forged_owners = 0`; note counts and
   `entities_without_workspace`.
3. Apply **step 1** `20261101160000` (owner terminal, one transaction, `lock_timeout` 5 s, `schema_migrations` row in
   the same transaction). Additive: the old app keeps working (direct inserts still allowed).
4. Postcheck: `state = step1`, RPC authenticated-only + definer, claims table RLS on and not API-readable; counts
   unchanged. QA API checks that create nothing on production (anon 401, forged field 22023, claims 403).
5. Merge the PR (pinned) → bot bump → Production build. Smoke with the QA account: register pages load; no business is
   created on production unless the owner asks for a QA business and its removal.
6. Apply **step 2** `20261101170000` only after the new app is live. Postcheck `state = step2`, direct INSERT 403.
7. Recovery: fix forward. If the old app must come back, undo step 2 only with
   `grant insert on public.farms, public.shops, public.services, public.workspaces to anon, authenticated;`
   (step 1 can stay — nothing else depends on it). Never drop data created through the RPC.

Checksums (sha256):
- `20261101160000_create_business_atomic.sql` `7cae1882053684f079251043edd5bdced1434a85754c3fe50ef5d1390c3be95c`
- `20261101170000_business_insert_via_rpc_only.sql` `032b7c9195f25d8e08c1f3b084ce239bd880acb45da6d5257f5611d937788ec7`

Staging note: 2 staging businesses had no workspace before this change (fixture data); left as they are.
