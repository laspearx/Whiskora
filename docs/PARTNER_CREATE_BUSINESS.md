# Create a business atomically (partner PR 2, part 1)

Status 2026-11-01: **live on production since v1.13.0** (step 1 `20261101063842`, origin set, app, step 2 `20261101064204`; record in `docs/STATUS.md`). Staging: both steps.
Follows `docs/PARTNER_SYSTEM_AUDIT.md` §4–5. Out of scope here: review / publish, marketplace, bookings,
payment, CI, and any change to who may edit a business profile (proposal in §6).

## 1. What changes
| | Before | After |
|---|---|---|
| Register farm / shop / service | 3 client writes: entity → workspace → `ensure_workspace_owner_membership`; workspace / owner errors were ignored | one RPC `create_business(p_type, p_fields, p_request_key)` → entity + workspace + owner row in **one transaction** |
| Owner | client sent `user_id` / `owner_id` (checked by RLS / guard) | always `auth.uid()`; no owner argument; `user_id`, `owner_id`, `role`, `id`, … in `p_fields` → refused |
| Fields | anything the table accepts | allow-list per type (§2); unknown key → `22023`; approval / publish columns keep table defaults |
| Photos | any URL | must be a `partner-photos` object **the caller uploaded** under `<farms|shops|services>/<uid>/`, given as the object path or as a URL on **this environment's own Storage origin** (`platform_settings.storage_public_origin`); any other host is refused; the stored value is the canonical URL built from the setting |
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

### Storage origin per environment
`platform_settings` (RLS on, no API grants) holds `storage_public_origin` = `https://<project ref>.supabase.co`. The
migration creates the table **without a value**; `supabase/settings/set_storage_origin.cjs <db-url-file>` sets it from
the connection's own project ref (pooler user `postgres.<ref>` / host `db.<ref>…`), so staging and production values
are never typed or copied. `storage_public_origin.sql` refuses if stored photo URLs point at another Supabase project
(guard against the wrong environment). No value → photos refused (fail closed), businesses without photos still work.
A custom Storage domain would need the check constraint widened (not used today).

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
| `create_business_checks.cjs` step 2 (direct INSERT closed), after the origin fix | **75 / 75** (run twice). New H1–H6: own photo on another website / another Supabase project / `http` / look-alike host / query string / protocol-relative → `22023`, nothing written; object path accepted and stored as the canonical URL; URL and path forms replay to the same business; with another environment's origin set (rolled back) that origin is accepted and this one refused; setting script refuses mismatching stored URLs; no setting → photo refused, no-photo create works. Earlier 64: anon 401; claims table 403; farm / shop / service each = entity + workspace + one owner row for the caller, defaults kept; replay = same ids, nothing new; same key + other data `P0001`; other user + same key → own business; new key → second business allowed; 9 forged / system fields `22023`, extra `p_owner` arg `PGRST202`; other user's photo, wrong folder, external URL, never-uploaded photo, bad / missing / too-long input `22023`; 10 parallel same key → 1 business; 5 parallel different keys → 5 complete; **fault injected at claim / entity (×3 types) / workspace / member / final update → error and row counts unchanged; same key then succeeds**; member RPC / owner-row RPC / storage scoping / guard on the new business; direct INSERT farms / shops / services / workspaces 403; owner UPDATE still works |
| `workspace_guard_checks.cjs` | 21 / 21 in step 1 and step 2 (L1 / L2 / L7 / L8 expect 403 once direct INSERT is closed) |
| `workspace_members_checks.cjs` / `partner_storage_checks.cjs` | 51 / 51, 23 / 23 (re-run after the origin fix) |
| `business_insert_compat_check.cjs` (old-app compat grants, one rolled-back transaction) | old shop + workspace + owner row ok; `is_verified` / `is_published` / other user's `user_id` / foreign farm workspace / personal workspace → `42501`; anon still no INSERT; staging privileges unchanged afterwards |
| Rollback on staging | down (`staging_only/create_business_down_STAGING_ONLY.sql`) → `before`; step 1 → `step1`; step 2 → `step2`; counts unchanged each time |
| E2E on Preview (`register-business.spec.ts`, desktop + mobile; re-run after the origin fix — app code unchanged) | 4 / 4: response dropped after commit → retry → same key, **one** shop with workspace + owner row; server refusal → error shown, nothing saved |
| Full E2E on Preview | 76 passed, 2 skipped (the "listed but not public" pair, `E2E_PRIVATE_LISTED_PET_ID` unset — same as before) |
| Preview bundle | staging ref only |

## 6. Who may edit a business profile (not changed by this PR; direction approved, separate PR)
Today: DB UPDATE on `farms` / `shops` / `services` = entity owner only, **all columns**. The shop / service edit pages
open for managers, but their save matches 0 rows and the page still reports success (known gap in the audit).
Found while testing (rolled back on staging): the owner could set `farms.is_verified = true` / `verified_at` directly —
**closed by PR #29 (v1.12.3, verification guard)**. `services.is_published` can still be switched by the owner without
review (the existing publish button) — **open, to be decided in the review / publish work**, not in the profile PR.
Approved scope for the profile PR:

| Role | Profile fields | Not allowed |
|---|---|---|
| Owner | name, owner name, phone, address + pin, bio, species / category, logo / cover | verification, publish / approval state, `user_id` |
| Manager | bio, phone, logo / cover, species / category (day-to-day content) | name, owner name, address + pin (identity, part of review), verification, publish |
| Staff / viewer | none | everything |

Direction approved 2026-11-01 (owner / manager / staff-viewer as above; `is_published` decided in the review / publish work). Implementation sketch: `update_business_profile(p_type, p_id, p_fields)` with the same allow-list pattern per role
(role from `workspace_role_of`), column privileges so the API cannot UPDATE `is_verified`, `verified_at`,
`verification_status` (except owner → `pending` from the verify page), `is_published`, `user_id`; fix the manager page
to show the real result. Publish / approval rules belong to the review PR (audit PR 3).

## 7. Rollout (production — not done; needs the owner's go-ahead per step)
Order decided 2026-11-01: **#29 (verification guard) first — live since v1.12.3 — then this PR.** Re-checked on staging
with both installed: create_business 75 / 75, workspace guard 21 / 21, verification guard 30 / 30, compat grants
(rolled back) still cannot set verification fields.

**Waiting for the owner (not done by Claude; the read was refused by the tool, so no value is guessed):**
- Read-only, production — origins of stored business photo URLs; expected: only `https://<production ref>.supabase.co`:
  ```sql
  begin read only;
  select substring(u from '^https?://[^/]+') origin, count(*) from (
    select image_url u from farms union all select cover_url from farms union all select image_url from shops
    union all select cover_url from shops union all select image_url from services union all select cover_url from services
    union all select avatar_url from workspaces where type <> 'personal') x where u is not null group by 1 order by 2 desc;
  rollback;
  ```
- The origin itself is set only by `set_storage_origin.cjs` from the production connection (step 4 below), after
  `--dry-run`; it refuses if stored URLs belong to another project.

**Step 1 — RPC (additive, old app keeps working)**
1. Pin the PR head; confirm the sha256 values below and that `web/` differs from main only in the register pages,
   `lib/createBusiness.ts` and `e2e/`.
2. Read-only precheck `create_business_precheck.sql` → `state = before`, `forged_owners = 0`; also read-only: the
   origins of stored business photo URLs (expected: the production project only).
3. Apply `20261101160000` (owner terminal, one transaction, `lock_timeout` 5 s, `schema_migrations` row in the same
   transaction).
4. Set the origin: `set_storage_origin.cjs <production db-url-file> --dry-run`, then without `--dry-run`.
   Postcheck: `state = step1`, `storage_public_origin` = the production URL the app bundle uses, RPC authenticated-only
   + definer, claims / settings tables not API-readable, counts unchanged. QA API checks that write nothing
   (anon 401, forged field 22023, other-host photo 22023, claims 403).
5. Merge the PR (pinned) → bot bump → Production build → smoke with the QA account (register pages load; no
   production business is created unless the owner asks for one and its removal).

**Step 2 — close direct INSERT (only after the new app is live)**
6. Apply `20261101170000`; postcheck `state = step2`; QA direct INSERT 403.

**Recovery** — fix forward. No broad re-grant. If the app itself must be rolled back to the direct-insert register
pages while step 2 is in place, the minimum is `supabase/emergency/business_insert_old_app_compat_DECISION_REQUIRED.sql`
(authenticated only; only the columns the old pages send — never `is_verified`, `verified_at`, `verification_*`,
`is_published`, `id`; workspaces_guard and RLS owner checks stay). Impact: old pages are again non-atomic (half-created
or duplicate businesses possible). Only on the owner's decision; close again with `20261101170000` afterwards.
Step 1 can stay in every case.

**Preview ↔ staging schema** (staging is shared; it is not switched back for old Previews without telling everyone)
| Preview | Needs | On staging today (`step2`) |
|---|---|---|
| this PR (`feat/atomic-business-create`) | step 1 or step 2 | works |
| branches without this PR (register pages insert directly) | `before` / `step1` | **register farm / shop / service fails with 42501** before anything is written; every other page unaffected |
| docs-only / other features | any | unaffected |

Checksums (sha256):
- `20261101160000_create_business_atomic.sql` `6b8c4c785f83f260ccf561975fc14a178271e1a5e932c6436ef981a77721fb70`
- `20261101170000_business_insert_via_rpc_only.sql` `032b7c9195f25d8e08c1f3b084ce239bd880acb45da6d5257f5611d937788ec7`
- `settings/storage_public_origin.sql` `d6d1e0b9cef6b0c3b2deccf45cbc704d859e5a1da66967dc1be3f272666bbeb7`
- `emergency/business_insert_old_app_compat_DECISION_REQUIRED.sql` `6b14799fc9ccccfeacbd2d1042081d4560135058ae2f3fdb0596c8b1dfe9b368`

Staging note: 2 staging businesses had no workspace before this change (fixture data); left as they are.
