# Proposal — foreign key `vaccines.pet_id → pets(id)` (not applied, needs a decision)

Status 2026-10-31: **proposal only.** The vaccine reminder fix does not need it (the Edge Function reads vaccines and
pets in two batched queries). No migration file exists for it in `supabase/migrations/` on purpose.

## Facts checked (read-only, staging + production)
| Item | Value |
|---|---|
| Types | `vaccines.pet_id bigint` (nullable), `pets.id bigint` — compatible |
| Existing FKs on `vaccines` | none (only the primary key) |
| Rows with `pet_id` null | 0 (both) |
| Orphans (pet no longer exists) | production **3 rows, 1 distinct pet id, 1 with a future `next_due`**; staging 0. Kept as they are — not deleted, `pet_id` not changed, no guessing which pet they belonged to |
| How orphans appear | the app deletes a pet with `pets.delete()` (`web/app/pets/[id]/edit/page.tsx`); nothing deletes its vaccines, and there is no FK to cascade |
| Vaccine writes in the app | INSERT only: `pets/[id]/vaccines/create`, `pets/vaccines/bulk-add` (+ `[locale]` re-exports), always with the pet id of an existing pet. No UPDATE / DELETE of vaccine rows in the app |
| Other tables → pets | `pet_weights`, `pet_documents`, `pet_activities`, `pet_co_owners`, … = `ON DELETE CASCADE`; `appointments`, `service_bookings`, `contact_leads` = `SET NULL` |
| New table from the reminder fix | `vaccine_reminder_deliveries.vaccine_id → vaccines(id) ON DELETE CASCADE` (deleting a vaccine removes its send-log rows) |

## What `NOT VALID` does and does not do
- Skips checking **existing** rows (the 3 orphans stay and stay readable/editable as long as `pet_id` is not changed).
- **Is enforced for every new INSERT and for UPDATEs that change `pet_id`** — an insert with a non-existent pet id fails (23503).
- **The `ON DELETE` action applies from the moment it is added.** With the default `NO ACTION`, deleting a pet that has
  vaccine rows **fails** — that would break "ลบสัตว์" in the app. So the action is the real decision:

| Option | Deleting a pet | Vaccine history | Notes |
|---|---|---|---|
| A. `ON DELETE CASCADE` | works | deleted with the pet (and their send-log rows) | same as weights / documents; irreversible on delete |
| B. `ON DELETE SET NULL` | works | kept, `pet_id` becomes null (like today's orphans, but explicit) | reminders skip them (no pet); needs nothing else |
| C. `NO ACTION` (default) | **fails** while vaccines exist | kept | needs an app change first (delete vaccines, or block delete with a message) |

`VALIDATE CONSTRAINT` later would fail while the 3 orphans exist — it needs a separate owner decision about them
(keep → never validate / set null; or archive first). Nothing here decides that.

## Draft (for review only — choose the action first)
```sql
-- 2026xxxx_vaccines_pet_fk.sql (draft)
alter table public.vaccines
  add constraint vaccines_pet_id_fkey foreign key (pet_id) references public.pets(id)
  on delete <CASCADE | SET NULL> not valid;
create index if not exists vaccines_pet_id_idx on public.vaccines (pet_id);   -- FK side + reminder reads
-- no VALIDATE here
```
Before applying: precheck counts (orphans unchanged), a staging test of pet delete from the app with vaccines, of
vaccine create / bulk-add, and that PostgREST embeds now resolve (side effect: `pets!inner` embeds would start working).
