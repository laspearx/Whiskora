-- ─────────────────────────────────────────────────────────────────────────────
-- Whiskora: reservation ↔ pet status (atomic) + reservation → ownership transfer
-- STATUS: PROPOSED — NOT APPLIED.
-- NOTE (production, 2026-10-30): RLS policy "reservations update by buyer or farm team" lets ANY farm
-- team member (incl. staff/viewer) and co-owners update pet_reservations directly. This RPC restricts
-- confirm/cancel to pet owner + farm owner/manager, but the direct-UPDATE path stays open until that
-- policy is tightened (separate change — needs a decision on what buyers may update, e.g. self-cancel).
-- INDEPENDENT of 20261029100000_private_columns.sql: both functions here are SECURITY DEFINER,
-- so column-level grants on pets do not affect them. Apply the privacy migration first
-- (higher priority); this one can follow later or be skipped without breaking the app. Written without DB access (schema could not be
-- introspected with the anon key). Before applying:
--   1. Verify column types below (ids assumed bigint, statuses assumed text).
--   2. Read the body of the existing trigger function sync_pet_owner_on_transfer_accept
--      and the RLS policies on pet_reservations / pet_ownership_transfers / pets.
--   3. Confirm no existing function/trigger already does any of this
--      (probe on 2026-10-29 found none by the likely names).
--   4. Apply on a staging/branch database first, run the test script at the bottom.
-- The web app calls farm_set_reservation_status() when it exists and falls back
-- to the old two-step update when it does not (PGRST202), so app deploy order is
-- flexible — but the atomic guarantee only exists after this migration is applied.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Confirm / cancel a reservation and sync pets.status in ONE transaction.
--    Row locks (FOR UPDATE) serialise double-clicks and concurrent requests.
create or replace function public.farm_set_reservation_status(
  p_reservation_id bigint,
  p_status text
) returns table (reservation_id bigint, reservation_status text, pet_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res  public.pet_reservations%rowtype;
  v_pet  public.pets%rowtype;
  v_uid  uuid := auth.uid();
  v_allowed boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_status not in ('confirmed', 'cancelled') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;

  select * into v_res from public.pet_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation_not_found' using errcode = 'P0002';
  end if;

  select * into v_pet from public.pets where id = v_res.pet_id for update;

  -- Only the pet owner, or owner/manager of the farm workspace, may decide.
  -- staff/viewer are intentionally NOT allowed.
  select (v_pet.user_id = v_uid) or exists (
    select 1
    from public.workspaces w
    join public.workspace_members m on m.workspace_id = w.id
    where w.type = 'farm'
      and w.entity_id = v_pet.farm_id   -- both bigint on production
      and m.user_id = v_uid
      and m.role in ('owner', 'manager')
  ) into v_allowed;
  if not v_allowed then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Idempotent: repeating the same action is a no-op, not an error.
  if v_res.status = p_status then
    return query select v_res.id, v_res.status::text, v_pet.status::text;
    return;
  end if;

  if p_status = 'confirmed' and v_res.status <> 'pending' then
    raise exception 'invalid_transition:%->confirmed', v_res.status using errcode = '22023';
  end if;
  if p_status = 'cancelled' and v_res.status not in ('pending', 'confirmed') then
    raise exception 'invalid_transition:%->cancelled', v_res.status using errcode = '22023';
  end if;

  update public.pet_reservations
     set status = p_status,
         confirmed_at = case when p_status = 'confirmed' then now() else null end
   where id = v_res.id;
  -- The existing one-confirmed-reservation-per-pet constraint still applies and
  -- aborts the whole transaction (pet status included) on conflict.

  if p_status = 'confirmed' then
    update public.pets set status = 'ติดจอง' where id = v_pet.id;
  elsif v_res.status = 'confirmed' then
    -- Only reopen the pet if no other confirmed reservation remains.
    if not exists (
      select 1 from public.pet_reservations
      where pet_id = v_pet.id and status = 'confirmed' and id <> v_res.id
    ) then
      update public.pets set status = 'เปิดจอง' where id = v_pet.id and status = 'ติดจอง';
    end if;
  end if;

  return query
    select r.id, r.status::text, p.status::text
    from public.pet_reservations r join public.pets p on p.id = r.pet_id
    where r.id = v_res.id;
end;
$$;

revoke all on function public.farm_set_reservation_status(bigint, text) from public, anon;
grant execute on function public.farm_set_reservation_status(bigint, text) to authenticated;

-- 2) Converting the reservation on accept: NOT added here. The existing BEFORE UPDATE trigger
--    trg_sync_pet_owner_on_transfer_accept → sync_pet_owner_on_transfer_accept() already sets
--    pet_reservations.status = 'converted' when new.reservation_id is not null (checked on production
--    2026-10-30). The app now sends reservation_id, so no new trigger is needed.

-- 3) A transfer to yourself is never valid (the UI check compared email to user id
--    and never fired). NOT VALID so existing rows are not re-checked on apply.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pet_ownership_transfers_not_self') then
    alter table public.pet_ownership_transfers
      add constraint pet_ownership_transfers_not_self check (from_user_id <> to_user_id) not valid;
  end if;
end $$;

-- 4) At most one pending transfer per pet (double-click / concurrent sends).
--    Check for existing duplicates first:
--      select pet_id, count(*) from pet_ownership_transfers where status='pending' group by 1 having count(*)>1;
create unique index if not exists pet_ownership_transfers_one_pending_per_pet
  on public.pet_ownership_transfers (pet_id) where status = 'pending';

-- ─── Manual test on staging (test accounts only) ─────────────────────────────
-- as farm owner:   select * from farm_set_reservation_status(<res_id>, 'confirmed');  -- pet → ติดจอง
--                  select * from farm_set_reservation_status(<res_id>, 'confirmed');  -- no-op, same result
-- as staff/viewer: select * from farm_set_reservation_status(<res_id>, 'cancelled');  -- 42501 forbidden
-- as owner:        insert transfer with reservation_id → buyer accepts → reservation = converted, pets.user_id = buyer
-- as buyer:        decline instead → reservation stays confirmed, owner unchanged

-- ─── Rollback ────────────────────────────────────────────────────────────────
-- begin;
--   drop function if exists public.farm_set_reservation_status(bigint, text);  -- app falls back automatically
--   alter table public.pet_ownership_transfers drop constraint if exists pet_ownership_transfers_not_self;
--   drop index if exists public.pet_ownership_transfers_one_pending_per_pet;
-- commit;
