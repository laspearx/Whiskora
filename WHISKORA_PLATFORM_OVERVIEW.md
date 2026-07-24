# Whiskora — Platform Overview

> **Living document.** Update this file whenever a feature ships, a bug with structural implications gets fixed, or the data model changes. Keep the "Last updated" line and the Changelog section current — this is the primary reference for planning what to build next.

**Last updated:** 2026-07-24

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
- `pet_reservations`: buyer reserves a listed pet from `/p/[id]` (`pending` → farm confirms/cancels from `farm-dashboard/[id]/reservations`). DB enforces one confirmed reservation per pet.
- Confirming/cancelling a reservation **now syncs the pet's own `status`** to `ติดจอง` (reserved) / back to `เปิดจอง` (fixed 2026-07-24 — previously only the reservation row changed, the pet's status field was left stale).
- `pet_ownership_transfers`: owner-initiated from `/pets/[id]`, accepted/declined by the recipient at `/profile/transfers` (inbox via RPC `get_my_pending_transfers`). Acceptance is handled by a **DB trigger** (`sync_pet_owner_on_transfer_accept`) that reassigns `pets.user_id` and clears `pets.farm_id` — not client-side code.
- **Known gap**: `pet_reservations.status = 'converted'` and `pet_ownership_transfers.reservation_id` exist in the schema (clearly designed for a reserve → sell → transfer-ownership pipeline) but nothing in the app writes them — the two features are functionally disconnected today.

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
- No local SQL migrations exist — always verify current schema against the live Supabase project (via MCP tools) rather than trusting `web/lib/types.ts` alone.

## Known gaps / not-yet-built (candidates for future planning)

- Reservation → sale → ownership-transfer pipeline is not wired end-to-end (`reservation_id` on transfers, `'converted'` reservation status both unused).
- Per-pet visibility override (`pet_visibility_settings`) has no UI or write path — farm-wide privacy settings are the only lever today.
- No in-app messaging between buyers and farms/shops/services — everything hands off to phone/LINE/Facebook.
- No visible in-app checkout/payment flow for shop products or service bookings (booking creation exists via `ServiceBooking`/`appointments`, but a public-facing booking-request UI was not confirmed in the last audit — verify before assuming it's missing).
- Stray `#FDF6F8` background color still present in 13 files (see above).

## Changelog

Newest first. Keep entries short — one line per shipped item, grouped by date.

**2026-07-24**
- Fixed: newborn pets now get `sire_id`/`dam_id` copied from their litter at birth-recording time (previously only the litter itself carried the link); backfilled 11 historical pet rows.
- Fixed: editing a litter's sire/dam now cascades to already-born pets in that litter.
- Fixed: confirming/cancelling a buyer reservation now syncs the pet's own `status` field instead of leaving it stale.
- Housekeeping: removed ~250MB of unrelated stock-cover tooling and a Python dependency cache that had been accidentally committed to the repo; added `.gitignore` entries to prevent recurrence; reconciled a 40-commit divergence between `main` and `claudecode` branches.
