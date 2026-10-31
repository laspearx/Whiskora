# Partner system audit — pet shops & services (read-only, 2026-10-31)

Scope: shops (`/partner/register-shop`, `/shop-dashboard`, `/shops/[id]`, `/marketplace`) and services
(`/partner/register-service`, `/service-dashboard`, `/services/[id]`, `/service-hub`), plus the shared workspace /
member model, storage and default privileges. Farms only where they share the same mechanisms.
Method: code reading + catalog queries. Staging and production catalogs for these tables / buckets / policies are
**identical** (138 lines compared). Production: aggregate counts only. One staging test ran in a transaction that was
rolled back (nothing persisted). No feature built, nothing changed on production.

Production data today: shops 2, services 1 (published 0), service_items 0, service_bookings 0;
workspaces personal 107 / farm 14 / shop 2 / service 1; storage objects: partner-photos 6, shop-assets 0,
service-assets 0. Every shop / service has a workspace whose owner = the entity owner (0 mismatches).

---

## 0. BLOCKER found during the audit (affects farms in production now — not a partner feature)

**Any signed-in user can make themselves "owner" of any farm.**
- `workspaces` policy `workspaces_update`: `USING (owner_id = auth.uid())`, no `WITH CHECK`, no column limits.
  Every user already owns a `personal` workspace and is its member with role `owner` (`handle_new_user`).
- Farm permission functions trust `workspaces.type = 'farm' AND entity_id = <farm>` + membership:
  `is_farm_team`, `can_manage_farm_privacy`, `can_record_pet_weight`, `can_decide_pet_reservation`,
  `can_transfer_pet` (role `owner`), `resolve_pet_tags` (farm_team), dashboard summary.
- **Proven on staging (rolled back):** QA stranger ran one API-level `update workspaces set type='farm',
  entity_id=<another user's farm> where type='personal'` → `is_farm_team`, `can_manage_farm_privacy`,
  `can_record_pet_weight`, **`can_transfer_pet`**, `can_decide_pet_reservation` all went false → **true**.
- `workspaces_insert` (`WITH CHECK owner_id = auth.uid()`) also lets anyone create a farm/shop/service workspace for
  an entity they do not own (staging: allowed); adding members to it is currently blocked only by the bug below.
- Production evidence today: 0 farm / shop / service workspaces whose owner differs from the entity owner
  (no sign of use in the current state; earlier use cannot be excluded from state alone).
- **Status:** hotfix PR `fix/workspace-ownership-guard` (migration `20261101120000_workspace_ownership_guard.sql`) — staging done, production pending review.
- **Fix first, as its own hotfix PR (staging → production), before any partner work:** BEFORE INSERT / UPDATE trigger
  (or policies) on `workspaces` for API roles: `type` / `entity_id` / `owner_id` immutable after insert; insert of
  `farm` / `shop` / `service` only if the caller owns that entity (`farms|shops|services.user_id = auth.uid()::text`)
  and no workspace exists yet for (type, entity_id) — add `unique (type, entity_id)` where entity_id is not null;
  `personal` only by `handle_new_user`. Audit query + regression tests for every function listed above.

---

## 1. What works today
| Area | Files / tables | State |
|---|---|---|
| Partner hub | `web/app/partner/page.tsx` → `farms`, `shops`, `services` by `user_id` | works (lists my entities) |
| Register shop / service | `partner/register-shop`, `partner/register-service` → insert `shops` / `services`, then `workspaces` (+ `workspace_members`), images to bucket `partner-photos` (`<uid>/…`, public) | entity + workspace created; **the member insert fails today** (see §3, error ignored) — dashboards fall back to `shops/services.user_id` so the owner still gets in |
| Business type | separate forms per type; services have `category` (e.g. `cat_hotel`, `pet_care`) and `supported_species`; shops `supported_species` | works (free text / arrays in text columns) |
| Shop dashboard | `shop-dashboard/[id]` (overview, edit, members) → `shops`, logo / cover to `shop-assets` | owner can edit profile + images |
| Service dashboard | `service-dashboard/[id]` (overview, settings, manage-services, members) → `services`, `service_items` CRUD, publish toggle `services.is_published`, images to `service-assets` | owner can edit, manage price list, publish |
| Public pages | `/shops/[id]`, `/services/[id]` (+ `service_items`) | profile, map, `tel:` contact button |
| Service listing | `/service-hub` → `services` where `is_published` | works for category filter (pet-type filter broken, §2) |
| Admin lists | `admin/shops`, `admin/services` | read-only lists |
| Dashboard access check | `shop-dashboard/[id]/layout.tsx` (same for services): workspace membership, else `user_id` | UI guard only; the DB decides writes |

## 2. Started but incomplete (continue the existing code — do not rebuild)
| Item | Evidence | Note |
|---|---|---|
| Products / marketplace | `/marketplace` and shop dashboard read **`products` — table does not exist** (staging + production) → query error, empty page | no product CRUD anywhere; decide: build a small `shop_products` list on the existing shop dashboard, or hide `/marketplace` |
| Members (shop / service / farm) | `*/members/page.tsx`: insert → **42P17 infinite recursion** in `workspace_members` policies (staging, rolled back); role change → **no UPDATE policy** (0 rows, UI shows success) ; delete owner-only | member management is not working for anyone through the API |
| Manager / staff editing | `shops` / `services` policies = `user_id = auth.uid()` only | workspace roles exist in UI but give no write access to the entity |
| Verification of shops / services | no columns / table / admin flow (farms have `farm_verifications` + `/admin/verifications`) | add a review status rather than reusing the farm KYC tables |
| Publish for shops | `shops` has no `is_published`; every shop is public on insert | services already have `is_published` (default false) |
| `/service-hub` pet-type filter | `.contains("pet_types", …)` — column is `supported_species` (text) | error when a pet type is selected |
| Search | `/search` searches `farms.farm_name` only | shops / services not searchable |
| Contact | `tel:` link only; `contact_leads` has `farm_id` only (farm owner reads) | LINE / Facebook fields exist on farms only |
| Bookings | `service_bookings` table + read on the service dashboard; **no create UI**; UPDATE policy lets buyer or owner change any column | out of scope for v1 (not assumed) |
| Address / species storage | arrays written into `text` columns (`supported_species`) | works, but filters need consistent format |

## 3. Permission / file problems to fix before the partner feature goes to production
**Blocks partner v1 (fix in the partner PRs):**
1. §0 workspace takeover (separate hotfix first — it is live for farms).
2. `workspace_members` policies: recursion on INSERT (42P17), no UPDATE policy, owner can add anyone with any role
   incl. `owner`; managers cannot manage. Replace with SECURITY DEFINER RPCs (`add_member`, `set_member_role`,
   `remove_member`) with explicit rules (one owner, owner/manager limits) — same pattern as the reservation RPCs.
3. Storage `shop-assets` / `service-assets` **and `farm-assets`** (live farm images): INSERT / UPDATE (and DELETE for
   shop / service) allowed for **any signed-in user on any path** → anyone can overwrite another business's logo /
   cover. Existing paths (read-only check): `farm-assets` = `<farm id>/…` (10 objects), shop / service code writes
   `<entity id>/…` (0 objects yet) → rule: first folder = an entity id the caller owns (or manages), checked in SQL.
   `partner-photos` has 6 objects under `farms/…` that the current uid-folder policy would not allow — check the
   register-farm upload path in the same PR.
4. Publication gate: shops / services readable by anyone regardless of review (`Public can view …` USING true).
   v1 needs `status` (draft → submitted → approved / rejected) and public SELECT limited to approved + published,
   owner / members / admin see their own drafts.
5. Contact data: `shops` / `services` public SELECT returns all columns (owner_name, exact address, lat / lng, phone).
   Decide what a listing shows publicly; owner personal fields via a view / RPC — same approach as `private_columns`.

**Clean-up (not blocking v1, keep separate):**
- Default privileges (read-only check): `postgres` and `supabase_admin` grant **ALL on new tables / sequences / functions to anon +
  authenticated** in `public`. Today anon + authenticated hold TRUNCATE, TRIGGER and REFERENCES on 27 of 31 public
  tables; 22 sequences usable by anon; 25 public functions executable by anon. Separate grants PR (G). Every new partner table must start with `revoke all … from anon, authenticated` +
  explicit grants + RLS (as `vaccine_reminder_deliveries` does). Changing the defaults themselves stays a separate task.
- Table-level grants: anon / authenticated have ALL (incl. TRUNCATE / REFERENCES / TRIGGER) on every partner table;
  RLS protects rows, but TRUNCATE is not covered by RLS — revoke TRUNCATE / TRIGGER / REFERENCES with the partner PRs.
- `service_bookings` UPDATE without column limits (out of v1 scope).
- Private documents for partner review: none today. If shop / service KYC is wanted, use a private bucket with
  folder = uid (like `verification-docs`), never `partner-photos` (public).

## 4. Proposed v1 scope: register → fill in → submit → publish → users find and contact
- **Register:** keep the existing forms; creation goes through one RPC `create_partner(type, fields)` that inserts
  the entity, its workspace and the owner membership atomically (no client-side three-step inserts).
- **Fill in:** existing edit pages (shop edit, service settings, service items). Images in `shop-assets` /
  `service-assets` under scoped folders. Optional: shop "featured items" as a simple list (no stock / orders).
- **Submit for review:** owner presses "ส่งตรวจ" → `status = 'submitted'`; owner can still edit drafts.
- **Publish:** admin `/admin/shops` / `/admin/services` approve / reject with note → `approved`; owner toggles
  `is_published` only when approved. Public pages + lists show approved + published only.
- **Find:** `/search` covers shops + services (name, category, species, province); `/service-hub` filter fixed;
  shops listed (hub page or tab).
- **Contact:** existing `tel:` plus optional LINE / Facebook fields; a `partner_contact_leads` count (like farms) is optional.
- **Not in v1:** bookings, payment, stock, orders, reviews / ratings, multi-branch.

## 5. PR plan (each staging-first; tests = API checks with QA accounts + E2E on Preview)
**Order (security first, then features):** H → S → G → 1 … 5. H does not wait for S / G.

| # | PR | Contents | Test criteria |
|---|---|---|---|
| H | **Hotfix: workspace ownership** (first; production) — **done on staging, PR open** | trigger + column privileges on `workspaces`; unique (type, entity_id); precheck | stranger cannot repoint / create a workspace for another's farm / shop / service (API 403 / 42501); owner still creates own; all farm permission functions false for the stranger; existing members unaffected; precheck 0 mismatches |
| S | **Storage scoping** (second; production) | `farm-assets`, `shop-assets`, `service-assets` policies: first folder = entity id the caller may edit; check `partner-photos` farm path | other users cannot upload / overwrite / delete; owner (+ allowed roles) can; existing files still served; synthetic files only in tests |
| G | **Grants clean-up** (third) | revoke TRUNCATE / TRIGGER / REFERENCES from anon / authenticated on public tables; review sequences / function EXECUTE per real use; new-table template; default privileges change kept separate | app SELECT / INSERT / UPDATE / DELETE paths unchanged (API + E2E); no TRUNCATE test on production |
| 1 | Members via RPCs | `add/set_role/remove_member` RPCs, drop recursive policies, read policy without recursion | owner adds staff / manager; manager limits; viewer read-only; nobody adds an `owner`; no 42P17; UI shows real errors |
| 2 | Create partner atomically + entity writes by role | `create_partner` RPC; shops / services UPDATE for owner + manager (columns limited); revoke TRUNCATE etc. | failure leaves no half-created entity; manager edits, staff / viewer cannot; anon cannot write |
| 3 | Review + publish | `status` + `review_note` on shops / services (or one `partner_reviews` table), admin approve / reject UI, public SELECT = approved + published, owner / admin see drafts | draft invisible to anon + other users; approved + published visible; unpublish hides; admin-only approve |
| 4 | Search + listings + contact | `/search` shops + services; `/service-hub` species filter fix; shops list; contact fields | only approved + published appear; filters return expected rows; no private fields in public responses |
| 5 | Marketplace decision | either a minimal `shop_products` list (no stock / orders) or hide `/marketplace` | no request to a missing table; products only from published shops |

Rules for all PRs: new tables start with revoke + explicit grants + RLS; no reuse of farm KYC tables; staging API /
E2E first; production steps with precheck / postcheck like the privacy and reservation rollouts.

## 6. Follow-up kept separate (not part of this audit)
- First scheduled vaccine reminder run: 2026-11-01 01:00 UTC — check before 07:00 UTC with
  `supabase/tests/vaccine_reminder_run_check.sql`, the function summary log and send-log statuses (on request; not automated).
