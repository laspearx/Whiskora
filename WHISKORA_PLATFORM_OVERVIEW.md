# Whiskora — Platform Overview

> **Living document.** Update this file whenever a feature ships, a bug with structural implications gets fixed, or the data model changes. Keep the "Last updated" line and the Changelog section current — this is the primary reference for planning what to build next.

**Last updated:** 2026-07-24 (later same day)

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
- No local SQL migrations — schema lives directly in the Supabase project (query via Supabase MCP tools, not a `migrations/` folder)
- `web/lib/types.ts` is partial/stale — many tables (reservations, transfers, weights, visibility, address) only exist as inline interfaces in the pages that use them, not in one central schema file

## Feature map

### Auth & identity
- Google OAuth, custom LINE OAuth (`/api/auth/line`, `/api/auth/line/callback` — bridges into a Supabase session via server-verified magic-link OTP to dodge Vercel `DEPLOYMENT_NOT_FOUND` redirect issues), legacy email/password.
- LINE identity can also be **linked** to an existing account from `/profile/connections`.
- **In-app-browser (WebView) login gate** (`web/lib/inAppBrowser.ts`, `web/app/components/BrowserChecker.tsx`): only Google's OAuth is actually broken inside chat-app WebViews (Google actively rejects known in-app-browser user agents). Verified 2026-07-24 by comparing `accounts.google.com` vs `access.line.me` OAuth-authorize responses under spoofed LINE/Facebook/normal user agents — LINE's endpoint showed **no** UA-based gating (byte-identical responses across all three), consistent with LINE Login being designed to run inside LINE's own in-app browser (LIFF). So `"line"` was removed from the blocked-UA list, and the warning was changed from a global full-page block (shown on every route) to a **contextual** one shown only when the user taps "เข้าสู่ระบบด้วย Google" (`handleSocialLogin`) while `isInAppBrowser()` is true — LINE login and email/password login are unaffected in any WebView context.
- Two independent role layers:
  - Platform admin: `profiles.role === 'admin'` gates `/admin/*`.
  - Workspace roles: `owner` / `manager` / `staff` / `viewer` per `workspaces` row (`personal`/`farm`/`shop`/`service` type), stored in `workspace_members`.
- "Buyer" is not a DB role — any authenticated non-owner on a public pet page is treated as a prospective buyer.

### Pets & lineage
- Owner-facing profile at `/pets/[id]` (adaptive: richer tooling — gallery/docs upload, pedigree modal, status pipeline, co-owner management, transfer initiation — only when `isOwner`).
- Separate lightweight **buyer-facing** profile at `/p/[id]` with reserve + contact-seller UI. This split is intentional, not a duplicate.
- Pedigree, health, and access-tier reads go through RPCs (`get_pet_pedigree`, `get_pet_health`, `get_my_pet_access`), not raw selects — so tier gating lives server-side.
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
- `pet_reservations`: buyer reserves a listed pet from `/p/[id]` (`pending` → farm confirms/cancels from `farm-dashboard/[id]/reservations`). DB enforces one confirmed reservation per pet via partial unique index `one_confirmed_reservation_per_pet` (`WHERE status='confirmed'`).
- Confirming/cancelling a reservation **now syncs the pet's own `status`** to `ติดจอง` (reserved) / back to `เปิดจอง` (fixed 2026-07-24 — previously only the reservation row changed, the pet's status field was left stale).
- `pet_ownership_transfers`: owner-initiated from `/pets/[id]` (manual, by buyer email lookup), **or from a confirmed reservation** via "ยืนยันการขาย" on `farm-dashboard/[id]/reservations` (wired 2026-07-24) — this path sets `reservation_id` on the transfer automatically instead of requiring a manual email lookup. Accepted/declined by the recipient at `/profile/transfers` (inbox via RPC `get_my_pending_transfers`).
- Acceptance is handled by a **DB trigger** (`sync_pet_owner_on_transfer_accept`) that reassigns `pets.user_id`, clears `pets.farm_id`, and — as of 2026-07-24 — also flips the linked `pet_reservations.status` to `'converted'` when `reservation_id` is set, freeing the pet up for a future reservation cycle. Manual (non-reservation) transfers are unaffected (`reservation_id` stays null).
- The reserve → confirm → sell → transfer-ownership pipeline is now fully wired end-to-end (previously `'converted'`/`reservation_id` existed in the schema but nothing wrote them).

### Farm / shop / service dashboards
- Farm dashboard: overview, edit, verify (→ `farm_verifications`, admin-approved), members (workspace roles), privacy, data-check (incomplete-data checklist with inline fixes), pets (roster/create/bulk-create), litters, babies, weights, activities, appointments, reservations.
- Shop/service dashboards mirror this structure but lighter: overview, edit/settings, members, and (services only) manage-services for CRUD on bookable offerings.
- Onboarding: `partner/register-farm`, `partner/register-shop`, `partner/register-service`.

### Marketplace (public / anonymous-accessible)
- Browse: `farm-hub` (farm-led "Pet Market"), `marketplace`, `service-hub`, `search`.
- Public profile pages: `/p/[id]` (pet), `/farm/[id]`, `/shops/[id]`, `/services/[id]`.
- Contact seller: modal offering phone / LINE deep link / Facebook, every click logged to `contact_leads`. **No in-app messaging/chat exists** — contact always hands off to an external channel.
- Service booking: logged-in users can submit a booking request from `/services/[id]` (writes to `service_bookings`, added 2026-07-24 — the table didn't exist before, so the service dashboard's booking list was silently empty). Requires login (redirects to `/login?redirect=...` otherwise), mirroring how pet reservations require an authenticated buyer. Managed from `service-dashboard/[id]/bookings` (status: pending/confirmed/cancelled/completed).

### Admin
- `/admin/dashboard` — platform stats via RPC (`admin_get_stats`, built to bypass RLS after direct-select approaches broke).
- Dedicated list pages per entity: users, farms, pets, shops, services.
- `/admin/verifications` — approve/reject farm verification requests; approval flips `farms.is_verified`/`verification_status`.

### Profile (personal area)
- Edit profile, settings (LINE bot notification toggle, etc.), connections (link/unlink LINE), own-pets list, appointment calendar, income/expense tracker, transfer-requests inbox.
- `/profile` itself is **not** login-gated (fixed 2026-07-24) — anonymous visitors see the same layout with empty/placeholder data (no hard redirect). Every interactive element is intercepted by a single `onClickCapture` guard on the page's root (`handleGuardClick` in `app/profile/page.tsx`) that shows a login-required prompt instead of navigating/uploading when there's no session. All `/profile/*` sub-pages (pets, transfers, calendar, finance, edit, settings, connections) still hard-redirect to `/login` on direct access — that's fine since they're reached by clicking through an already-gated `/profile`, not organically browsed to.

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
| Shops / services | `Shop`, `Product`, `Service`, `service_items`, `service_bookings` |
| Scheduling | `appointments` |
| Auth / profile | `profiles`, Supabase `auth.users` (LINE identity in `user_metadata`) |

Access-control heavy lifting lives in Postgres RPCs, not raw selects: `get_pet_pedigree`, `get_pet_health`, `get_my_pet_access`, `get_my_pending_transfers`, `admin_get_stats`, `admin_get_users`.

## Architecture conventions (read before touching related code)

- **Locale shim**: every route needs a matching re-export shim at `[locale]/...` or it 404s under the `/th/`, `/en/` prefixes — `middleware.ts` unconditionally redirects any un-prefixed URL to `/th/...`, so this isn't optional for any page. Found and fixed 2026-07-24: `/shops/[id]` and `/services/[id]` (two high-traffic public marketplace pages) had **no** locale shim at all, meaning every single visit 404'd. Always check `app/[locale]/<route>` exists when adding or auditing a top-level route — don't assume it's just a `farm-dashboard` gotcha.
- **`pets.weight` is retired.** `pet_weights` is the only place weight is ever read or written. Grep for any stray write to `pets.weight` before shipping weight-related changes.
- **App background color** is `#fffafc`. The stray `#FDF6F8` near-duplicate was fully cleaned up 2026-07-24 (14 files, including `farm/[id]`, `p/[id]`) — if it reappears, treat it as a regression, not a pre-existing gap.
- **Shared DB-backed types belong in `web/lib/types.ts`**, not page-local interfaces. As of 2026-07-24, `PetReservation`, `PetOwnershipTransfer`, `PendingTransferRow`, and `ServiceBooking` are centralized there — reuse them instead of redeclaring a local shape when touching reservations/transfers/bookings.
- **`BrowserChecker` is a controlled component** (`open`/`onDismiss` props), not a self-mounted global gate — it's only rendered from the login pages, triggered right before a Google OAuth attempt inside a detected in-app browser. Don't re-add it to a root layout; that would re-introduce the blanket full-page block this was deliberately changed away from on 2026-07-24.
- **Circular badge clipping**: corner badges on circular avatars (camera-upload icons on round pet photos, etc.) need their own clip layer, not just offset tuning — recurring bug class.
- **Weight unit toggle must stay manual-overridable** — auto-guessing kg/g from a pet with no history previously corrupted real data.
- **Pet photo upload path** must stay exactly `${userId}/${petId}-...` in the `pet-photos` storage bucket — Supabase RLS depends on that exact shape.
- **"Fetched but not written" bug class**: watch for flows that fetch a related record into memory (e.g. a litter, a farm) but only copy *some* of its fields into an insert/update payload. This exact pattern caused the sire/dam linkage bug (2026-07-24) and is worth checking any time a new multi-step create/edit flow is added.
- No local SQL migrations exist — always verify current schema against the live Supabase project (via MCP tools) rather than trusting `web/lib/types.ts` alone.

## Known gaps / not-yet-built (candidates for future planning)

- Per-pet visibility override (`pet_visibility_settings`) has no UI or write path — farm-wide privacy settings are the only lever today.
- No in-app messaging between buyers and farms/shops/services — everything hands off to phone/LINE/Facebook.
- No visible in-app checkout/payment flow for shop products (service bookings now exist end-to-end as of 2026-07-24, but there's still no payment collection — booking just requests a slot).
- `service_items`/`service_bookings` RLS follows the exact-owner pattern (`services.user_id = auth.uid()::text`), not a workspace-team function — so, same as the pre-existing `service_items` gap, a `manager`/`staff` workspace role can see the service dashboard UI but may get RLS-denied on writes since only the literal owner account passes the policy. Not introduced by this pass, but worth fixing if service teams with non-owner roles report failed saves.
- `service-dashboard/[id]/finance` is linked from the overview tools list but the route doesn't exist yet (pre-existing gap, separate from the bookings page fixed 2026-07-24).

## Changelog

Newest first. Keep entries short — one line per shipped item, grouped by date.

**2026-07-24 (later same day)**
- Fixed (critical): `/shops/[id]` and `/services/[id]` had no `[locale]` re-export shim, so every visit 404'd under the `/th/`/`/en/` prefixes middleware forces on all URLs — these two public marketplace pages were completely unreachable. Added the missing shims.
- Fixed: `/profile` no longer hard-redirects anonymous visitors to `/login`. It now renders with empty/placeholder data and a single page-wide click guard that shows a login-required prompt (with a way to dismiss and keep looking) only when an anonymous visitor actually taps something — consistent with how `/p/[id]` already handles view-vs-action gating. Sub-pages under `/profile/*` are unchanged (still hard-redirect; only reached by clicking through the now-open `/profile`).
- Fixed: in-app-browser login warning was blocking the entire site on every route for LINE's own in-app browser, even though only Google OAuth is actually broken there (verified empirically — see Auth & identity section). Removed the global block; the warning now only appears contextually when tapping Google login inside a detected in-app browser (LINE excluded from the detection list entirely). LINE login and email/password login now work normally when a link is opened from inside LINE, Facebook Messenger/comments, Instagram, etc.
- Shipped: reservation → confirm sale → ownership transfer pipeline wired end-to-end. Farm dashboard "ยืนยันการขาย" on a confirmed reservation now creates a transfer with `reservation_id` set; the `sync_pet_owner_on_transfer_accept` DB trigger now also flips that reservation to `'converted'` on acceptance. No RLS changes needed — verified `pet_ownership_transfers` insert policy only requires `initiated_by = auth.uid()`, not `from_user_id`.
- Shipped: public service booking, end-to-end. Created the `service_bookings` table (didn't exist before — the dashboard was querying a table that was never created) with RLS mirroring `pet_reservations`. Added a login-gated booking form on `/services/[id]` and a new `/service-dashboard/[id]/bookings` management page (+ locale shim) replacing a link that previously 404'd.
- Fixed: stray `#FDF6F8` background color replaced with the canonical `#fffafc` across all 14 affected files.
- Refactor: centralized `PetReservation`, `PetOwnershipTransfer`, `PendingTransferRow`, and a corrected `ServiceBooking` interface in `web/lib/types.ts`; removed the page-local duplicate interfaces they replaced.
- Fixed: newborn pets now get `sire_id`/`dam_id` copied from their litter at birth-recording time (previously only the litter itself carried the link); backfilled 11 historical pet rows.
- Fixed: editing a litter's sire/dam now cascades to already-born pets in that litter.
- Fixed: confirming/cancelling a buyer reservation now syncs the pet's own `status` field instead of leaving it stale.
- Housekeeping: removed ~250MB of unrelated stock-cover tooling and a Python dependency cache that had been accidentally committed to the repo; added `.gitignore` entries to prevent recurrence; reconciled a 40-commit divergence between `main` and `claudecode` branches.
