# Security hardening — Phase 1 (prepared, NOT applied)

Status 2026-11-02: code + SQL prepared on local branches (not pushed — a push of app changes would build a Preview).
Nothing applied to staging or production, no Auth setting / credential changed, nothing merged or deployed.
Source: the read-only audit of 2026-11-02 (main `a86b35a`, production catalog + advisors). Tests ran only in a
throwaway local Postgres 17 loaded with a **schema-only** dump of staging (no data) — `supabase/tests/local/run.sh`.

| Item | Branch (head) | Migration (sha256) | App change | Build scope |
|---|---|---|---|---|
| H1 farm exact location private | `security/h1-farm-private-location` (`bd7a273`) | `20261102110000_farm_private_location` (`aeb02c9a…0958`) | yes (6 files + `lib/farmColumns.ts`) | app |
| H2 account linking (LINE) + M5 + L1 | `security/h2-account-linking` (`8f7b4e6`) | `20261102150000_line_identity_lookup` (`6bf9e2fd…42da1`) | yes (callback, route, connections, settings, notify, register) | app |
| M1 farm link guard | `security/m1-farm-link-guard` (`e3a0d13`) | `20261102120000_farm_link_guard` (`fde5c112…b16f`) | no | release |
| M4 `pets.note` private | `security/m4-pet-note-private` (`c420590`) | `20261102130000_pet_note_private` (`79bd2b7c…4314`) | yes (3 lines) | app |
| M7 pet-documents storage | `security/m7-pet-documents-storage` (`7c896b7`) | `20261102140000_pet_documents_storage` (`5609244b…8d01`) | no | release |

Each branch is independent (from main `a86b35a`); every pair, and each with `codex/ux-audit`, merges without
conflict; all five together: tsc OK, local SQL suites **59 / 59**, unit / static **18 / 18**. Shared test harness
files (`supabase/tests/local/{bootstrap,harness}.sql`, `run.sh`) are byte-identical on every branch.
Codex overlap: only M4 touches `web/app/pets/[id]/page.tsx` (one line, also edited on `codex/ux-audit`; merges cleanly).

## H1 — farm exact location (High)
- **Evidence:** production catalog: farms policies "Public can read / view farms" `USING (true)`; anon + authenticated
  table SELECT; the public farm page printed the composed full address (`address` = house no. … , `edit/page.tsx:155`,
  `farm/[id]/page.tsx:147`).
- **Change:** column grants — anon / authenticated read only public columns; private = `address, house_no, room_no,
  moo, soi, road, postal_code, lat, lng, verification_note`; `get_farm_private(farm)` for owner / workspace members /
  admin. Phone, `line_id`, `facebook_link` stay public (the public pet page uses `line_id` as the buyer contact,
  `p/[id]/page.tsx:255`). shops / services unchanged (storefronts; owner decision).
- **Feature impact:** public farm page shows the area (ตำบล อำเภอ จังหวัด) instead of the full address; Google Maps link
  falls back to the area text. Dashboard / verify / pets-create / partner: public columns only (they used none of the
  private ones). Edit page: private fields via the RPC; if that call fails the form does not open (no accidental
  overwrite of the stored address with empty fields).
- **Security tests (local 17 / 17, 14 fail before):** anon / stranger / even the owner cannot select private columns
  directly; `select *` refused; RPC: anon no EXECUTE, stranger 42501, owner / staff / admin ok, unknown farm P0002;
  verify-page `update … returning id` ok, `returning house_no` refused; `update_business_profile` still saves.
  Static: `FARM_PUBLIC_COLUMNS` == migration grant list; no farms query selects `*` / a private column (fails on main).
- **Regression on staging (to approve):** `business_profile_checks.cjs`, `create_business_checks.cjs`,
  `verification_guard_checks.cjs`, `workspace_members_checks.cjs`, E2E full suite on a Preview of this branch.
- **Rollout:** app first (it works on the old grants), then the migration; `farm_private_location_precheck.sql`
  before / after (state, verdict, `other_rights_md5` must not change, exposure counts).
- **Rollback:** app → nothing to undo. DB: `grant select on public.farms to anon, authenticated` restores the old
  exposure — only as an emergency, owner decision; preferred fix forward.
- **Residual:** shops / services exact address; lat / lng no longer shown publicly (if a public map is wanted later,
  a rounded value).

## H2 — account takeover through account linking (High)
**Evidence (code + docs):**
1. Email signup without verification: Confirm email OFF (`mailer_autoconfirm: true`, `docs/STATUS.md:103`), signup at
   `app/register/page.tsx:77`. Supabase links an OAuth identity to an existing user with the same *verified* email
   (supabase.com/docs/guides/auth/auth-identity-linking) — with autoconfirm every email signup counts as verified →
   **pre-registration takeover**: attacker signs up with the victim's email + a password; the victim later signs in with
   Google and lands in that account; the attacker still has the password.
2. LINE callback matched an existing account by the **email from the LINE id_token** (`callback/route.ts:115-117`) and
   created accounts with `email_confirm: true` for it (`:120-123`). LINE does not document that this email is verified
   (developers.line.biz/en/docs/line-login/verify-id-token) → whoever controls a LINE account with the victim's email
   address could sign into the victim's Whiskora account.
3. The LINE identity key was `user_metadata.line_id` — writable by the user (`supabase.auth.updateUser({ data })`);
   lookups used `listUsers(page 1, 1000)` (M5).
4. LINE trust chain itself is sound: code → token endpoint server-to-server (TLS + channel secret), state cookie,
   user id from `/v2/profile` with that access token, redirect origin allow-list.

**Code fix (branch):** identity = `app_metadata.line_id` (service-role-only) via `find_auth_user_by_line_id`
(service_role EXECUTE only, any number of users); no email matching, no email scope, no id_token parsing; new LINE
users get only the placeholder email; >1 account for a LINE id → `LINE_ACCOUNT_CONFLICT` (never a guess); link mode
writes `app_metadata`; unlink via `DELETE /api/auth/line` (refused if LINE is the only way in); notify / settings /
connections read `app_metadata`; fixed error codes only (L1); `signUp` gets `emailRedirectTo`.

**Why the code fix alone is not enough:** path 1 (email pre-registration → Google) is decided inside Supabase Auth.
**Interim measure (Phase 1, needs the owner's approval of an Auth setting):** turn **Confirm email ON** in Auth →
Providers → Email. Effect (Supabase docs): new email signups stay unconfirmed until the link is clicked; OAuth sign-ins
are not linked to unconfirmed users and unconfirmed identities are removed when an identity is linked → path 1 closed
for new signups. Existing users are already confirmed → still sign in as before (no lockout). Email delivery: the
built-in Supabase mailer is rate-limited and not meant for production — acceptable short-term only because signups are
few; a custom SMTP sender (Resend, `lib/notify.ts:39-42` is not configured yet) is needed before growth. To verify on
staging first (same setting there).
Alternative if email must not be required yet: disable new signups on the Email provider only via an Auth hook
(Before User Created) — more work, also an Auth change.

**Existing accounts (read-only audit, to run on approval):** `supabase/tests/account_linking_audit.sql` — counts only:
`prereg_pattern` (password account + OAuth identity added later; also matches honest users), `line_real_email`
(LINE-created with a real email), backfill inputs and duplicates. A list (ids only) for the candidates is a separate
request. **Recovery for a confirmed / suspected case:** revoke the user's sessions (admin sign-out), remove the password
(admin update / force reset when SMTP exists), keep the Google / LINE identity of the real owner, review data changes
in that period, tell the owner through the verified channel.

**Rollout order (production):** 1) audit (read-only) → 2) migration `20261102150000` → 3) backfill dry run
(`supabase/scripts/line_identity_backfill.mjs`, service key from the owner's environment), review conflicts → 4) backfill
`--apply` → 5) deploy the app → 6) Confirm email ON (interim) → 7) custom SMTP + password reset (Phase 2, M6).
**If a LINE user cannot sign in after step 5** (`LINE_ACCOUNT_MIGRATION_PENDING` / `LINE_ACCOUNT_CONFLICT`): run / rerun the
backfill for that account, or set `app_metadata.line_id` by hand after checking ownership; no account is created twice
(the placeholder email blocks a duplicate). **Rollback:** redeploy the previous app — it finds the same accounts, because the new code also keeps a
`user_metadata.line_id` copy (written, never read) and the backfill leaves the legacy value in place; unlink clears both;
the SQL function is additive. (The rolled-back app would of course bring the email matching back.) Confirm email OFF again only
as an owner decision (reopens path 1).
**Tests:** unit 9 / 9 (`line_auth_unit.test.mts`: decisions, conflict, link rules, invalid ids, source has no
email / user_metadata / listUsers / id_token / raw upstream bodies, backfill plan never writes conflicts); local 6 / 6
(lookup: service_role only, app_metadata only, duplicates visible, bad input). **On staging:** LINE is disabled on
Preview — the callback can only be verified on production or with a LINE test channel (decision); Confirm email +
Google pre-registration scenario on staging: sign up X (unconfirmed) → Google X → must be a new / separate account.
**Residual:** a legacy `user_metadata.line_id` that a user forged before the backfill is copied unless it collides
(conflict check); risk low (LINE user ids are not public) — the dry-run report lists counts for review.

## M1 — linking pets / litters to any farm (Medium)
- **Evidence:** column INSERT / UPDATE on `pets.farm_id`, `litters.farm_id`; policies check `user_id` only; no guard.
- **Change:** `caller_can_link_farm(farm)` (caller only) + BEFORE INSERT / UPDATE OF farm_id triggers: via the API
  only the farm owner, workspace owner / manager / staff or an admin may link; unlink / unchanged pass; definer paths
  (transfer accept) unaffected; existing rows untouched.
- **Impact:** a workspace **viewer** can no longer add farm pets (today nothing stops them); owner / manager / staff
  flows (create, bulk-create, add-baby, litters) unchanged.
- **Tests:** local 17 / 17 (9 fail before). Staging regression: reservation / transfer suites, farm pets E2E.
- **Rollback:** `drop trigger pets_farm_link_guard …; drop trigger litters_farm_link_guard …` (safe, data untouched).
- **Precheck:** `farm_link_guard_precheck.sql` counts existing "foreign" links (owner decision; not changed).

## M4 — `pets.note` (Medium)
- **Evidence:** anon / authenticated column SELECT on `note`; farm add-pet form suggests health history there
  (`pets/create/page.tsx:413`); the app never displays it; real health fields already private.
- **Change:** revoke SELECT (note); app no longer selects it (`lib/columns.ts`, `p/[id]/page.tsx`, `pets/[id]/page.tsx`).
- **Impact:** none visible. Writes unchanged. A read path for owner / team = later decision. Other health data checked:
  allergies / chronic_diseases / health_notes / blood_type / traits not readable; `pet_activities` tier-gated;
  `vaccine_status`, `weight`, `microchip_number` still public (Low, separate decision).
- **Tests:** local 8 / 8 (4 fail before); static: no pets select asks for note (caught `/p/[id]` before release).
- **Rollout:** app first, then migration. **Rollback:** `grant select (note) on public.pets to anon, authenticated`.

## M7 — pet-documents storage (Medium)
- **Evidence:** INSERT policy = bucket only; the app writes `<pet id>/<file>` (`pets/[id]/page.tsx:606`) while read /
  update / delete required `<uid>/…` — the owner could not read back (signed URL) what the app uploaded.
- **Change:** `pet_document_folder_access(folder, write)` (caller only); for `<pet id>/…`: write = pet owner (same as
  the `pet_documents` table policy — co-owners / team cannot write documents today, so storage does not open it
  either), read = owner or `viewer_can_see(pet, 'documents')`; unrestricted INSERT dropped; legacy `<uid>/…` read /
  update / delete kept.
- **Tests:** local 11 / 11 (8 fail before). Staging: Storage API upload / signed URL / delete as owner, co-owner,
  stranger (synthetic files only).
- **Rollback:** recreate the old INSERT policy (reopens the hole) — fix forward preferred.
- **Open decision:** co-owner document upload (needs both the table policy and storage).

## L7 / L8 re-assessment
- **L7 `service_bookings`:** UPDATE policy lets the buyer change any column (status, service_id, date) and the service
  owner too — but the app has **no booking write path** (only `service-dashboard/[id]/page.tsx:76` reads) and production
  has 0 rows. Severity stays **Low** now; becomes **Medium** the day bookings launch → before launch: revoke direct
  INSERT / UPDATE and use RPCs (like reservations). `appointments` co-owner insert with any `user_id`: Low.
- **L8 `pet-photos`:** public bucket; listing is closed; private pets' rows (and so `image_url`) are not readable, so
  a URL must already be known (shared earlier, cached, from the owner). **Low–Medium** (docs overview already lists
  it). Real fix = private bucket + signed URLs (app-wide change) → Phase 2.

## Approvals needed (nothing below is done)
1. Push the 6 branches and open draft PRs (app branches build Previews on staging).
2. Staging window: apply the 5 migrations (pre / postcheck each), run staging suites + E2E, Storage API checks.
3. Run `account_linking_audit.sql` on production (read-only counts) and the backfill **dry run**.
4. Auth setting: Confirm email ON (staging, then production) — and the sender decision.
5. Per-item production rollout (order above), each with pre / postcheck and pinned heads.
6. Decisions: shops / services address; public map precision; co-owner documents; `microchip_number` visibility.
