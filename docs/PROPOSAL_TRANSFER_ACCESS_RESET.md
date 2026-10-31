# Proposal — reset access on ownership transfer (separate migration, NOT applied anywhere)

Status 2026-10-30: proposal for the owner's review. Not in PR #14, not on staging, not on production.

## Goal
Access that the previous owner gave out must not pass to the new owner's pet automatically. The new owner starts
from safe settings and grants access again themselves. Transfer history (`pet_ownership_transfers`) is kept.

## What stays today after "accept" (staging, synthetic data, `pet_privacy_checks.cjs --transfer`)
| Table / path | Today after accept | Evidence |
| --- | --- | --- |
| `pet_co_owners` | rows stay → the old owner's co-owners keep owner-level access (health, private card, insert vaccines/activities) | INFO: co-owner still sees P2 row + health |
| `access_grants` (granted by the old owner) | stay active → grantees keep their groups | by policy/code; grants now per group (PR #14) |
| `pet_visibility_settings` | stay → e.g. the old owner's "pedigree = public" keeps applying | P7 kept pedigree public until made private |
| `pet_weights` | rows keep `user_id` = recorder; policy "Users manage own pet weights" is `user_id = auth.uid()` → the old owner still reads and **edits** them, the new owner cannot edit | INFO: old owner reads 1 / can edit; new owner cannot |
| `pet-documents` files | stored under the old owner's folder → the old owner can still read the files; the new owner cannot create signed URLs | by storage policy (belongs to the private-files PR) |
| `previous_owner` tag | only for users who once *received* the pet; the original seller is not a previous owner | INFO: seller counts as previous owner = false |
| `farm_visibility_settings` | stop applying (farm_id cleared) | — |

Production (read-only counts, 2026-10-30): 0 accepted transfers, 0 co-owners, 0 active grants, 0 per-pet settings,
49 weight rows (all recorded by the current owner). Nothing to migrate today; the change only affects future transfers.

## Proposed migration (draft — for review)
In the existing trigger function `sync_pet_owner_on_transfer_accept()` (same trigger; runs in the accept transaction,
after the pet / reservation locks taken by `respond_pet_transfer`), when a transfer becomes `accepted`:
```sql
delete from pet_co_owners where pet_id = new.pet_id;                       -- co-owners of the old owner
update access_grants set revoked_at = now()
 where resource_type = 'pet' and resource_id = new.pet_id and revoked_at is null;   -- keep rows as history
delete from pet_visibility_settings where pet_id = new.pet_id;             -- back to the defaults of a new pet
```
and, separately, make weight rows follow the pet owner instead of the recorder:
```sql
-- replace "Users manage own pet weights" (user_id = auth.uid()) with owner-of-the-pet write access;
-- user_id stays as "recorded by" (history), reads stay tier-checked by viewer_can_see('weight')
create policy "pet owner manages weights" on pet_weights for all to authenticated
  using (exists (select 1 from pets p where p.id = pet_id and p.user_id = auth.uid()))
  with check (exists (select 1 from pets p where p.id = pet_id and p.user_id = auth.uid()));
```

## Decisions needed
1. Safe per-pet setting after transfer: **delete per-pet rows → defaults of a new pet** (overview public, timeline
   registered, vaccination/weight engaged, health/pedigree owner, documents/DNA/medical notes private) — or write an
   explicit "owner" row for every group except overview?
2. Keep a record of removed co-owners (e.g. an audit table), or is the transfer row enough history?
3. Should the original seller count as previous owner (only when the new owner enables "include previous owner")?
4. Documents of the old owner: copy into the new owner's folder on accept, or handle in the private-files PR?

## Test plan (staging, before any production approval)
Extend `pet_privacy_checks.cjs --transfer`: after accept, the old co-owner sees nothing private, the old grantee's
groups are closed (rows kept with `revoked_at`), per-pet settings are back to defaults, the old owner cannot read or
edit weight rows of a private pet and the new owner can; the transfer row is unchanged; reservation E2E chain passes.
