# Whiskora — Platform Overview

> **Living document.** Update this file whenever a feature ships, a bug with structural implications gets fixed, or the data model changes. Keep the "Last updated" line and the Changelog section current — this is the primary reference for planning what to build next.

**Last updated:** 2026-10-30 (v1.6.0 live: Preview deployments use staging Supabase; privacy migration applied 03:43 UTC — see `docs/STATUS.md`)

## What Whiskora is

Whiskora is a Thai-language pet-breeding and pet-marketplace platform built with Next.js (App Router) and Supabase. It serves three kinds of users:

- **Breeders / farms** — manage breeding pairs, litters, lineage, pet inventory, buyer reservations, and ownership transfers through a farm dashboard.
- **Shops & services** — parallel, lighter-weight dashboards for pet shops (products) and service providers (bookable services like grooming/vet/boarding).
- **Buyers / pet owners** — browse the public marketplace, reserve pets, manage their own pets' profiles, health, weight, and vaccine records, and receive/initiate ownership transfers.

Everything hangs off one core entity, `pets`, which carries lineage (`sire_id`/`dam_id`), status (a sale-pipeline enum), and gated access to health/pedigree data via a reusable visibility-tier system.

## Tech stack

- Next.js App Router, client-heavy pages (`"use client"` + direct Supabase JS client calls, not server actions)
- Supabase: Postgres + Auth + Storage + RPC functions + one Edge Function (`send-push-notifications`)
- Auth: Google OAuth, a custom-built LINE OAuth flow (not Supabase's native LINE provider), and legacy email/password
- Schema lives directly in the Supabase project (query via Supabase MCP tools). `supabase/migrations/` holds **proposed, not-yet-applied** SQL for review only — check each file's STATUS header before assuming it is live.
- `web/lib/types.ts` is partial/stale — many tables (reservations, transfers, weights, visibility, address) only exist as inline interfaces in the pages that use them, not in one central schema file

## Feature map

### Auth & identity
- Google OAuth, custom LINE OAuth (`/api/auth/line`, `/api/auth/line/callback` — bridges into a Supabase session via server-verified magic-link OTP to dodge Vercel `DEPLOYMENT_NOT_FOUND` redirect issues), legacy email/password.
- LINE identity can also be **linked** to an existing account from `/profile/connections`.
- Two independent role layers:
  - Platform admin: `profiles.role === 'admin'` gates `/admin/*`.
  - Workspace roles: `owner` / `manager` / `staff` / `viewer` per `workspaces` row (`personal`/`farm`/`shop`/`service` type), stored in `workspace_members`.
- "Buyer" is not a DB role — any authenticated non-owner on a public pet page is treated as a prospective buyer.

### Pets & lineage
- Owner-facing profile at `/pets/[id]` (adaptive: richer tooling — gallery/docs upload, pedigree modal, status pipeline, co-owner management, transfer initiation — only when `isOwner`).
- Separate lightweight **buyer-facing** profile at `/p/[id]` with reserve + contact-seller UI. This split is intentional, not a duplicate.
- Pedigree, health, and access-tier reads go through RPCs (`get_pet_pedigree`, `get_pet_health`, `get_my_pet_access`), not raw selects — so tier gating lives server-side.
- `/p/[id]` asks `get_my_pet_access` first and only fetches vaccines / timeline / weight / health for groups the viewer may see. Pedigree has explicit loading / empty / locked / error+retry states (it used to show "Loading..." forever when the RPC returned nothing).
- Trust labels come from `web/lib/trust.ts` only: "ลงทะเบียน Pet ID แล้ว" (has a profile), "ฟาร์มยืนยันตัวตนแล้ว" (`farms.is_verified`, admin-approved KYC). There is **no pet-document review flow** — never show a "documents verified" badge.
- Health values: `null` renders "ยังไม่ได้ระบุ", never "ไม่มี". `is_neutered` is tri-state (true / false / null) in the edit form.
- Co-ownership via `pet_co_owners`; document uploads via `pet_documents`.

### Breeding, litters, births
- `farm-dashboard/[id]/litters/create` — record a sire×dam pairing, generates a litter record.
- `.../litters/[litter-id]/birth` and `.../add-baby` — record births / add a newborn to an existing litter. **Both now copy the litter's `sire_id`/`dam_id` onto each new pet** (fixed 2026-07-24 — previously the litter was linked but individual pets weren't).
- `.../litters/[litter-id]/edit` — edit a pairing's sire/dam after the fact; **now cascades the change to every already-born pet in that litter** (fixed 2026-07-24, same root cause as above).
- `.../litters/[litter-id]/weights` — batch weigh-in for all babies in a litter.
- `.../babies` — farm-wide baby dashboard with per-baby weight trend + inline photo upload.

### Weights & health
- `pet_weights` is the **sole source of truth** for weight (canonical unit: grams). `pets.weight` was fully retired 2026-07-22 — nothing should ever write to it again.
- UI auto-switches to kg display once a pet's last known weight is ≥1000g, with a manual per-row unit toggle (added after a bug where blind auto-guessing corrupted zero-history pets' data — never remove the manual override).
- Vaccines: per-pet (`/pets/[id]/vaccines`) and cross-pet (`/pets/vaccines/all`, bulk-add) views.

### Visibility / privacy framework
- Reusable, resource-type-agnostic system: `field_groups` (master list of privacy-controllable data groups — overview, pedigree, health, vaccination, weight, dna, medical_notes, documents, certificates, timeline) × `farm_visibility_settings` (per-farm tier override per group).
- 5-tier model: `public` < `registered` < `engaged` (has an active reservation) < `owner` < `private`.
- Farm-wide settings page at `farm-dashboard/[id]/privacy` with 3 presets (open / professional-breeder [recommended default] / locked-down).
- A parallel per-pet override table, `pet_visibility_settings`, **exists in the schema but has zero rows and no write path anywhere in the app** — unbuilt, not broken.

### Reservations & ownership transfers
- Public "ready" listing = `PUBLIC_LISTING_STATUSES` (`พร้อมย้ายบ้าน`, `เปิดจอง`) + `is_public !== false`, shared by farm-hub counts and the farm page list (`lib/trust.ts`).
- `pet_reservations`: buyer reserves a listed pet from `/p/[id]` (`pending` → farm confirms/cancels from `farm-dashboard/[id]/reservations`). DB enforces one confirmed reservation per pet.
- Confirming/cancelling a reservation **now syncs the pet's own `status`** to `ติดจอง` (reserved) / back to `เปิดจอง` (fixed 2026-07-24 — previously only the reservation row changed, the pet's status field was left stale).
- `pet_ownership_transfers`: owner-initiated from `/pets/[id]`, accepted/declined by the recipient at `/profile/transfers` (inbox via RPC `get_my_pending_transfers`). Acceptance is handled by a **DB trigger** (`sync_pet_owner_on_transfer_accept`) that reassigns `pets.user_id` and clears `pets.farm_id` — not client-side code.
- Reservation → transfer: a confirmed reservation now has "ส่งคำขอโอนเจ้าของ" (farm owner only), which inserts a pending `pet_ownership_transfers` row with `reservation_id` and `to_user_id = buyer`. Marking the reservation `converted` on accept is done by a proposed trigger in `supabase/migrations/20261029200000_reservation_transfer_pipeline.sql` — **not applied yet**, so until then the reservation stays `confirmed` after transfer.
- Confirm/cancel calls RPC `farm_set_reservation_status` (atomic, row-locked, idempotent, owner/manager only) from the same migration; if the RPC is missing (PGRST202) the page falls back to the old two-step update with rollback on failure.

### Farm / shop / service dashboards
- Farm dashboard: overview, edit, verify (→ `farm_verifications`, admin-approved), members (workspace roles), privacy, data-check (incomplete-data checklist with inline fixes), pets (roster/create/bulk-create), litters, babies, weights, activities, appointments, reservations.
- Shop/service dashboards mirror this structure but lighter: overview, edit/settings, members, and (services only) manage-services for CRUD on bookable offerings.
- Onboarding: `partner/register-farm`, `partner/register-shop`, `partner/register-service`.

### Marketplace (public / anonymous-accessible)
- Browse: `farm-hub` (farm-led "Pet Market"), `marketplace`, `service-hub`, `search`.
- Public profile pages: `/p/[id]` (pet), `/farm/[id]`, `/shops/[id]`, `/services/[id]`.
- Contact seller: modal offering phone / LINE deep link / Facebook, every click logged to `contact_leads`. **No in-app messaging/chat exists** — contact always hands off to an external channel.

### Admin
- `/admin/dashboard` — platform stats via RPC (`admin_get_stats`, built to bypass RLS after direct-select approaches broke).
- Dedicated list pages per entity: users, farms, pets, shops, services.
- `/admin/verifications` — approve/reject farm verification requests; approval flips `farms.is_verified`/`verification_status`.

### Notifications (actual state, 2026-10-29)
- Web Push: opt-in/out toggle in `/profile/settings` saves/deletes `push_subscriptions`; Edge Function `send-push-notifications` sends vaccine reminders (today/tomorrow, Bangkok dates) and deep-links to the pet's vaccine page. Needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Vercel) + VAPID secrets, optional `CRON_SECRET` (Supabase), and a pg_cron schedule — deployment/schedule not verified.
- LINE / email (`lib/notify.ts`, `/api/notify/send`) have code but **no caller**; settings page says so.

### Profile (personal area)
- Edit profile, settings (LINE bot notification toggle, etc.), connections (link/unlink LINE), own-pets list, appointment calendar, income/expense tracker, transfer-requests inbox.

## Data model (grouped)

| Area | Key tables |
|---|---|
| Pets & lineage | `pets` (incl. `sire_id`/`dam_id`, `litter_id`, `status` enum), `pet_co_owners`, `pet_documents` |
| Farms / workspaces | `farms`, `farm_verifications`, `workspaces`, `workspace_members` |
| Breeding | `litters` |
| Reservations & transfers | `pet_reservations`, `pet_ownership_transfers`, `contact_leads` |
| Weights & health | `pet_weights` (canonical), `Vaccine` |
| Activities | `Activity` (shared pet-level / farm-level timeline) |
| Visibility | `field_groups`, `farm_visibility_settings`, (unused) `pet_visibility_settings` |
| Shops / services | `Shop`, `Product`, `Service`, `ServiceBooking` |
| Scheduling | `appointments` |
| Auth / profile | `profiles`, Supabase `auth.users` (LINE identity in `user_metadata`) |

Access-control heavy lifting lives in Postgres RPCs, not raw selects: `get_pet_pedigree`, `get_pet_health`, `get_my_pet_access`, `get_my_pending_transfers`, `admin_get_stats`, `admin_get_users`.

## Architecture conventions (read before touching related code)

- **Locale shim**: every route (at least under `farm-dashboard/[id]/...`) needs a matching re-export shim at `[locale]/farm-dashboard/[id]/...` or it 404s under the `/th/`, `/en/` prefixes.
- **`pets.weight` is retired.** `pet_weights` is the only place weight is ever read or written. Grep for any stray write to `pets.weight` before shipping weight-related changes.
- **App background color** is `#fffafc`. `#FDF6F8` is a stray near-duplicate that causes visible seams — as of 2026-07-24, still present in 13 files including two high-traffic public pages (`farm/[id]`, `p/[id]`). Worth a cleanup pass.
- **Circular badge clipping**: corner badges on circular avatars (camera-upload icons on round pet photos, etc.) need their own clip layer, not just offset tuning — recurring bug class.
- **Weight unit toggle must stay manual-overridable** — auto-guessing kg/g from a pet with no history previously corrupted real data.
- **Pet photo upload path** must stay exactly `${userId}/${petId}-...` in the `pet-photos` storage bucket — Supabase RLS depends on that exact shape.
- **"Fetched but not written" bug class**: watch for flows that fetch a related record into memory (e.g. a litter, a farm) but only copy *some* of its fields into an insert/update payload. This exact pattern caused the sire/dam linkage bug (2026-07-24) and is worth checking any time a new multi-step create/edit flow is added.
- **npm only** (`vercel.json` → `npm ci`, `.npmrc` legacy-peer-deps). No pnpm/yarn lockfiles. Every package the web app imports must be in `web/package.json` (html-to-image used to resolve from the repo-root `node_modules`).
- **Private columns**: read pets with `PET_COLUMNS` and other people's profiles with `PROFILE_PUBLIC_COLUMNS` (`lib/columns.ts`); your own profile via `getMyProfile()`, user lookups via `findUserByEmail()` / `searchUsersForInvite()` (`lib/profile.ts`). Never `select('*')` on `pets`/`profiles`, never `RETURNING *` (`.select()`) after writing them, never `upsert` profile rows with private columns. Pet health only through `get_pet_health`.
- `app/[locale]/login/page.tsx` is the **live** sign-in page (not a shim); `app/login/page.tsx` is unreachable. The i18n router adds the locale itself — strip `/th|/en` from redirect targets (`stripLocale`).
- Tests: `npm run test:e2e` (Playwright, desktop + mobile). Signed-in specs need staging test accounts (see `web/e2e/README.md`). Lint baseline 2026-10-30: 320 errors, mostly `no-explicit-any` (296); compare by file/rule/code, not by total.
- Always verify current schema against the live Supabase project (via MCP tools) rather than trusting `web/lib/types.ts` or `supabase/migrations/` alone.
- **Locale**: every page needs a `[locale]` shim (checked 2026-10-29: all present). Middleware remembers the last locale in cookie `NEXT_LOCALE`, so unprefixed `next/link` / `router.push('/x')` and the auth callbacks (`lib/locale.ts`) keep TH/EN instead of falling back to `/th`.
- **Farm workspace roles**: the layout verifies membership; pages must not re-filter `farms.user_id`. Owner-only routes are listed in `OWNER_ONLY_SUFFIXES` in `farm-dashboard/[id]/layout.tsx` (edit, verify, pet/litter create — inserts still use the caller's `user_id`). Service/shop edit pages allow owner/manager, matching their overview `canEdit`.
- `/pet-id-card-preview` is the public demo (fake data "LUNA"); link it with plain `next/link`, its QR points back to its own `#demo-profile`.
- Deploy env: `next.config.ts` runs `lib/deploy-env-guard.mjs` — Preview must use staging Supabase and no production service secrets (build fails otherwise, names only). Use `isPreviewDeploy` (`lib/deploy-env.ts`) to switch off anything that sends real messages on Preview.

## Known gaps / not-yet-built (candidates for future planning)

- Reservation → transfer works end to end without the reservation migration (app sends `reservation_id`; existing trigger sets `converted`), but after the buyer accepts the pet keeps status `ติดจอง` — no "sold/transferred" status update yet. Atomic confirm RPC (`20261029200000`) not applied anywhere.
- Per-pet visibility override (`pet_visibility_settings`) has no UI or write path — farm-wide privacy settings are the only lever today.
- No in-app messaging between buyers and farms/shops/services — everything hands off to phone/LINE/Facebook.
- No visible in-app checkout/payment flow for shop products or service bookings (booking creation exists via `ServiceBooking`/`appointments`, but a public-facing booking-request UI was not confirmed in the last audit — verify before assuming it's missing).
- Stray `#FDF6F8` background color still present in 13 files (see above).
- **Privacy (DB) — read leak CLOSED on production 2026-10-30 03:43 UTC** (`private_columns`, migration `20261030034348`; 24 h log watch in progress, see `docs/STATUS.md`). History: (read-only inventory 2026-10-30 via Supabase MCP; production `vhudldcizmbpujedojei`; staging `whiskora-staging` = `wpxcukrwmegwzfccbbga`, schema-only copy + synthetic QA data, see `supabase/staging/`):
  - anon + authenticated have table-level ALL on `profiles`/`pets`; `profiles` RLS SELECT `using (true)` → email/phone/address readable by anyone; `pets` health columns readable on public/available pets.
  - **Role self-escalation — HOTFIXED on production 2026-10-30**: trigger `trg_profiles_protect_role` (BEFORE INSERT OR UPDATE) rejects any role set/change by `anon`/`authenticated` (42501); SECURITY DEFINER code, service_role and the dashboard can still change roles. Grants are unchanged (column privilege still exists, the trigger enforces). Role counts unchanged (1 admin, 104 user) — owner should confirm the admin account is theirs.
  - Fix: `supabase/migrations/20261029100000_private_columns.sql` (column-level SELECT/INSERT/UPDATE, RPCs). Applied on staging (2026-10-30), then production (2026-10-30 03:43 UTC): API checks 107/107 (`supabase/tests/staging_api_checks.py`), E2E 50/50 desktop+mobile, 0 skipped — and the same build passes E2E 50/50 on the pre-migration (production-equal) schema. Gate/verify SQL: `supabase/tests/privacy_precheck.sql` / `privacy_postcheck.sql`.
  - Deploy order matters: the app on `main` still has ~29 queries that fail after the migration (`select('*')` on pets/profiles, email columns, profile upserts) → deploy this branch's app first, then the migration (`docs/PRIVACY_ROLLOUT.md`).
  - Fine as is: vaccines/activities/weights/documents SELECT via `viewer_can_see()`; buckets `pet-documents`, `verification-docs` are private (so `getPublicUrl` links for verification docs do not open — admin viewing bug).
  - Also open (separate): `pet_reservations` UPDATE policy allows any farm-team member (incl. staff/viewer) and co-owners; default privileges grant ALL on new tables to anon; leaked-password protection off; 7 functions without `search_path`.
- `admin_get_users` has two overloads (no-arg and `p_search,p_limit,p_offset`); calling it without args returns PGRST203, so `/admin/users` and verification emails are empty on the current production app. Fixed on this branch by always passing args; dropping the no-arg overload is a separate DB change.
- `pet-documents` INSERT policy lets any signed-in user upload into any folder of the bucket (reads are folder-scoped, so no read leak); `verification-docs` has no UPDATE/DELETE policy.
- Verification documents are uploaded with `getPublicUrl` on bucket `verification-docs` — confirm the bucket is private.
- Knowledge hub (`pet-knowledge/articles.ts`) has summaries only — no full-article route yet; cards say so.
- Terms of Service page is a placeholder ("อยู่ระหว่างจัดทำ") until real legal text exists.
- No product detail route — marketplace cards link to the shop page.
- Homepage and most pages are Thai-only even under `/en` (footer, terms, contact are bilingual).

## Changelog

Newest first. Keep entries short — one line per shipped item, grouped by date.

**2026-10-30**
- v1.6.0 (PR #10): build guard blocks Preview builds pointing to production Supabase or carrying LINE/Resend/service-role/VAPID values; LINE login + notify off on Preview; LINE callback no longer trusts `whiskora.vercel.app`; tracked `web/.env.production` removed (Production uses Vercel vars). Preview = staging, verified on a no-cache Preview and on Production.
- v1.5.1 (PR #9): profile save no longer 409s for users without a username (blank → null, duplicates get a clear message); `/admin/verifications` loads (applicant from `admin_get_users`, no FK embed). Staging E2E 50/50; production QA passed.
- Production browser QA with synthetic accounts: privacy/permission cases pass; found 2 pre-existing bugs (profile save 409 when username empty; admin verifications 400 — no FK for `profiles!user_id`). Fix on branch `fix/profile-username-admin-verifications`, staging-tested, not deployed. Preview→staging plan drafted (`docs/PREVIEW_STAGING_PLAN.md`).
- PRODUCTION: privacy migration `20261029100000_private_columns.sql` applied alone (recorded as `20261030034348 private_columns`); precheck before/after ok, postcheck 17/17, anon HTTP private columns 401. Synthetic QA account created for postcheck (id in `docs/STATUS.md`).
- Released v1.5.0 (`74391b7`) to production; DB unchanged. Auth Site URL was a third-party host and Redirect URLs had `*.vercel.app/**` — both fixed by the owner (closed 19:49:59 UTC); session-revocation decision pending (`docs/STATUS.md`).
- Privacy release prep: clean-checkout build of `45f6071` passes E2E 50/50 before and after the migration on staging; read-only precheck passes on production; pinned plan in `docs/PRIVACY_ROLLOUT.md`. Known: after a reservation → transfer is accepted the pet keeps status `ติดจอง`.
- Staging `whiskora-staging` created from a production schema dump (+ `platform_objects.sql`: storage, auth trigger, `field_groups` seed, function ACL the dump drops); definitions diffed against production (only pg_net version differs).
- Privacy migration applied and verified on staging (API 107/107, E2E 50/50, 0 skipped); production untouched.
- Fix: 8 pages still did `pets.select('*')` despite the earlier readiness commit (`PET_COLUMNS` is now one string literal so supabase-js can type it); profile photo used `upsert` (fails after migration and the error was ignored) → `update` + error check; admin pages call `admin_get_users` with args.
- E2E: privacy/profile/health/QR/roles/admin tests added to `signed-in.spec.ts`; `signIn` clicks the visible email toggle; reservation chain waits for its own row and uses a separate pet per viewport.
- PRODUCTION HOTFIX applied: `20261029050000_hotfix_profile_role_guard.sql` (role guard trigger only). Verified via catalog + rolled-back probe with a non-existent user id. Read leaks still open.
- Reservation migration no longer adds a converted-trigger (existing `sync_pet_owner_on_transfer_accept` already does it when `reservation_id` is set).
- Migrations split: privacy `20261029100000` (apply first, independent) and reservation `20261029200000`; both idempotent with rollback; local synthetic tests in `supabase/tests/` (64/64 + concurrency) — not real staging.
- Fixed: pet edit could overwrite health data with blanks when `get_pet_health` failed.
- Build: npm only, `package-lock.json` synced, pnpm files removed, Vercel `npm ci`; html-to-image declared in web; clean-checkout install + tsc + build verified.
- Privacy readiness: column allow-lists, `getMyProfile`/`findUserByEmail`/`searchUsersForInvite`, no partial-email member search, no member emails in lists; proposed migration with rollback (not applied).
- Fixed: email login redirect produced `/th/th/...`; admin verifications list always empty (queried non-existent columns); `useKgFor` renamed (14 false-positive rules-of-hooks errors).
- i18n: sign in/up, public pet profile, transfers, reservations; status in `docs/I18N_STATUS.md`.
- Notifications: email sender now from `RESEND_FROM` (whiskora.com is a parked third-party domain; whiskora.pet not verified in Resend); setup guide `docs/NOTIFICATIONS_SETUP.md`.
- Tests: Playwright smoke suite (18 public checks pass; signed-in suite skipped until staging accounts exist).

**2026-10-29**
- Fixed: hard-coded "Verified by Whiskora" / "ฟาร์มที่ยืนยันแล้ว" on `/p/[id]` now come from real data; trust copy centralised in `lib/trust.ts`; homepage no longer claims every farm is verified.
- Fixed: farm-hub card count vs farm page list (card counted `เปิดจอง`, page didn't) — one shared listing rule.
- Fixed: unknown health values shown as "ไม่มี"; pedigree stuck on Loading; footer terms/contact pointed to `/`; "ราคา PRO" removed; "จองคลินิก" → "ค้นหาบริการ"; community marked "เร็วๆ นี้"; honest empty states on service-hub/marketplace.
- Added: `/terms` (placeholder), `/contact`; `/pet-id-card-preview` reworked as the public Pet ID demo (card + QR profile view); homepage reordered and shortened.
- Fixed: missing `[locale]` shims (services, shops, service settings/manage-services, shop edit, preview); locale cookie in middleware + auth callbacks; broken marketplace product link.
- Fixed: farm members other than owner were bounced from the farm overview/pets list (extra `farms.user_id` filter); owner-only routes gated in layout; service/shop edit role checks.
- Fixed: self-transfer check compared email to user id; accept/decline only updates pending rows; reservation → transfer step added; proposed atomic reservation RPC + converted trigger (not applied).
- Fixed: Web Push had no subscribe path; Edge Function now uses Bangkok dates, per-pet labels, deep links, per-day tag, optional `CRON_SECRET`; SW click opens the target page.
- Housekeeping: untracked root `node_modules/`, `.next/`, `tmp/` (kept on disk) and ignored them.

**2026-07-24**
- Fixed: newborn pets now get `sire_id`/`dam_id` copied from their litter at birth-recording time (previously only the litter itself carried the link); backfilled 11 historical pet rows.
- Fixed: editing a litter's sire/dam now cascades to already-born pets in that litter.
- Fixed: confirming/cancelling a buyer reservation now syncs the pet's own `status` field instead of leaving it stale.
- Housekeeping: removed ~250MB of unrelated stock-cover tooling and a Python dependency cache that had been accidentally committed to the repo; added `.gitignore` entries to prevent recurrence; reconciled a 40-commit divergence between `main` and `claudecode` branches.
