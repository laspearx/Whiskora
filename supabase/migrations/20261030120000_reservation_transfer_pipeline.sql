-- ─────────────────────────────────────────────────────────────────────────────
-- Whiskora: reservation → ownership transfer, role checks in the database
-- Replaces the unapplied draft 20261029200000_reservation_transfer_pipeline.sql.
-- Checked against production + staging schema 2026-10-30 (identical: same policies, same trigger,
-- same function bodies by md5). Production had 0 reservations and 0 transfers at that time.
--
-- Fixes (all reproduced on staging through the REST API before this migration):
--   * pet_reservations UPDATE was open to the buyer and to every farm team member / co-owner:
--     viewer/staff could cancel or confirm, buyer could confirm their own reservation.
--   * pet_reservations INSERT accepted any status (buyer inserted 'confirmed') on any pet, even private.
--   * pet_ownership_transfers INSERT was open to anyone passing can_manage_pet_visibility (all farm
--     team, co-owners): staff created a transfer of a farm pet to themselves …
--   * … and UPDATE was open to the receiver AND the initiator on every column: staff accepted their
--     own transfer (became owner); the initiator marked a transfer accepted without the receiver;
--     the receiver changed pet_id to another (private) pet and accepted it.
--   * After acceptance the pet kept 'ติดจอง' (reserved) under the new owner.
--
-- Roles (as the app already shows them; staff/viewer are read-only):
--   create reservation   any signed-in user except the pet owner, only on a listed pet
--                        (status พร้อมย้ายบ้าน / เปิดจอง, visible publicly), status pending only
--   confirm / cancel     pet owner, farm owner, farm manager            → farm_set_reservation_status()
--   send transfer        pet owner, farm owner                          → INSERT (checked by policy)
--   accept / decline     the receiver only                              → respond_pet_transfer()
--   cancel transfer      the initiator, pet owner or farm owner         → respond_pet_transfer()
--   staff / viewer       read reservations of their farm, nothing else
--
-- Deploy order: app first (it calls the RPCs and falls back to the old direct writes on PGRST202),
-- then this migration. Old app + this migration would break transfer accept/cancel (no UPDATE policy).
-- Rollback: supabase/rollback/20261030120000_reservation_transfer_pipeline_down.sql
-- Does not touch pets column grants (privacy migration) or default privileges.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── helpers (SECURITY DEFINER: read pets/farms/workspaces regardless of the caller's column grants) ──

-- pet owner, or owner/manager of the pet's farm
create or replace function public.can_decide_pet_reservation(p_pet_id bigint, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and exists (
    select 1 from pets p
    where p.id = p_pet_id
      and (
        p.user_id = p_uid
        or (p.farm_id is not null and (
              exists (select 1 from farms f where f.id = p.farm_id and f.user_id = p_uid::text)  -- farms.user_id is text
           or exists (select 1 from workspaces w join workspace_members m on m.workspace_id = w.id
                      where w.type = 'farm' and w.entity_id = p.farm_id and m.user_id = p_uid
                        and m.role in ('owner', 'manager'))))
      )
  );
$$;

-- pet owner, or owner of the pet's farm (managers can decide reservations but not give pets away)
create or replace function public.can_transfer_pet(p_pet_id bigint, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and exists (
    select 1 from pets p
    where p.id = p_pet_id
      and (
        p.user_id = p_uid
        or (p.farm_id is not null and (
              exists (select 1 from farms f where f.id = p.farm_id and f.user_id = p_uid::text)  -- farms.user_id is text
           or exists (select 1 from workspaces w join workspace_members m on m.workspace_id = w.id
                      where w.type = 'farm' and w.entity_id = p.farm_id and m.user_id = p_uid
                        and m.role = 'owner')))
      )
  );
$$;

-- listed for reservation, publicly visible, and not the caller's own pet
create or replace function public.pet_is_reservable(p_pet_id bigint, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and exists (
    select 1 from pets p
    where p.id = p_pet_id
      and p.status in ('พร้อมย้ายบ้าน', 'เปิดจอง')
      and (p.is_public is true or p.status = 'พร้อมย้ายบ้าน')
      and p.user_id is distinct from p_uid
  );
$$;

-- transfer row is consistent: sender is the current owner, not to self, reservation (if any) is the
-- confirmed reservation of that pet by that receiver
create or replace function public.pet_transfer_insert_ok(
  p_pet_id bigint, p_from uuid, p_to uuid, p_reservation_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select p_to is not null and p_from is distinct from p_to
    and exists (select 1 from pets p where p.id = p_pet_id and p.user_id = p_from)
    and (p_reservation_id is null or exists (
          select 1 from pet_reservations r
          where r.id = p_reservation_id and r.pet_id = p_pet_id
            and r.buyer_id = p_to and r.status = 'confirmed'));
$$;

revoke all on function public.can_decide_pet_reservation(bigint, uuid) from public, anon;
revoke all on function public.can_transfer_pet(bigint, uuid) from public, anon;
revoke all on function public.pet_is_reservable(bigint, uuid) from public, anon;
revoke all on function public.pet_transfer_insert_ok(bigint, uuid, uuid, bigint) from public, anon;
grant execute on function public.can_decide_pet_reservation(bigint, uuid) to authenticated;
grant execute on function public.can_transfer_pet(bigint, uuid) to authenticated;
grant execute on function public.pet_is_reservable(bigint, uuid) to authenticated;
grant execute on function public.pet_transfer_insert_ok(bigint, uuid, uuid, bigint) to authenticated;

-- ── pet_reservations ──

drop policy if exists "reservations update by buyer or farm team" on public.pet_reservations;  -- writes only via RPC
drop policy if exists "reservations create by buyer" on public.pet_reservations;
create policy "reservations create by buyer" on public.pet_reservations
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'pending'
    and confirmed_at is null
    and public.pet_is_reservable(pet_id, auth.uid())
  );

-- one open reservation per buyer per pet (double click on "จอง")
create unique index if not exists pet_reservations_one_open_per_buyer
  on public.pet_reservations (pet_id, buyer_id) where status in ('pending', 'confirmed');

-- confirm / cancel + pets.status in one transaction; row locks serialise double clicks and concurrent calls
create or replace function public.farm_set_reservation_status(p_reservation_id bigint, p_status text)
returns table (reservation_id bigint, reservation_status text, pet_status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_res public.pet_reservations%rowtype;
  v_pet public.pets%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_status not in ('confirmed', 'cancelled') then raise exception 'invalid_status' using errcode = '22023'; end if;

  select * into v_res from public.pet_reservations where id = p_reservation_id for update;
  if not found then raise exception 'reservation_not_found' using errcode = 'P0002'; end if;
  select * into v_pet from public.pets where id = v_res.pet_id for update;

  if not public.can_decide_pet_reservation(v_pet.id, v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_res.status = p_status then  -- repeat of the same action: no-op
    return query select v_res.id, v_res.status, v_pet.status;
    return;
  end if;
  if p_status = 'confirmed' and v_res.status <> 'pending' then
    raise exception 'invalid_transition:%->confirmed', v_res.status using errcode = '22023';
  end if;
  if p_status = 'cancelled' and v_res.status not in ('pending', 'confirmed') then
    raise exception 'invalid_transition:%->cancelled', v_res.status using errcode = '22023';
  end if;

  update public.pet_reservations
     set status = p_status, confirmed_at = case when p_status = 'confirmed' then now() else null end
   where id = v_res.id;  -- one_confirmed_reservation_per_pet still aborts a second confirm

  if p_status = 'confirmed' then
    update public.pets set status = 'ติดจอง' where id = v_pet.id;
  elsif v_res.status = 'confirmed' then
    -- a cancelled reservation cannot be accepted any more
    update public.pet_ownership_transfers t set status = 'cancelled'
     where t.reservation_id = v_res.id and t.status = 'pending';
    if not exists (select 1 from public.pet_reservations
                   where pet_id = v_pet.id and status = 'confirmed' and id <> v_res.id) then
      update public.pets set status = 'เปิดจอง' where id = v_pet.id and status = 'ติดจอง';
    end if;
  end if;

  return query select r.id, r.status, p.status
    from public.pet_reservations r join public.pets p on p.id = r.pet_id where r.id = v_res.id;
end;
$$;
revoke all on function public.farm_set_reservation_status(bigint, text) from public, anon;
grant execute on function public.farm_set_reservation_status(bigint, text) to authenticated;

-- ── pet_ownership_transfers ──

drop policy if exists "transfers create by pet manager" on public.pet_ownership_transfers;
drop policy if exists "transfers create by pet owner or farm owner" on public.pet_ownership_transfers;  -- re-runnable
create policy "transfers create by pet owner or farm owner" on public.pet_ownership_transfers
  for insert to authenticated
  with check (
    initiated_by = auth.uid()
    and status = 'pending'
    and accepted_at is null
    and public.can_transfer_pet(pet_id, auth.uid())
    and public.pet_transfer_insert_ok(pet_id, from_user_id, to_user_id, reservation_id)
  );
drop policy if exists "transfers update by buyer or initiator" on public.pet_ownership_transfers;  -- writes only via RPC

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pet_ownership_transfers_not_self') then
    alter table public.pet_ownership_transfers
      add constraint pet_ownership_transfers_not_self check (from_user_id <> to_user_id) not valid;
  end if;
end $$;
create unique index if not exists pet_ownership_transfers_one_pending_per_pet
  on public.pet_ownership_transfers (pet_id) where status = 'pending';

-- accept / decline (receiver) or cancel (initiator, pet owner, farm owner); repeats are no-ops
create or replace function public.respond_pet_transfer(p_transfer_id bigint, p_action text)
returns table (transfer_id bigint, transfer_status text, pet_id bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_t public.pet_ownership_transfers%rowtype;
  v_pet public.pets%rowtype;
  v_uid uuid := auth.uid();
  v_new text := case p_action when 'accept' then 'accepted' when 'decline' then 'declined'
                              when 'cancel' then 'cancelled' end;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_new is null then raise exception 'invalid_action' using errcode = '22023'; end if;

  select * into v_t from public.pet_ownership_transfers where id = p_transfer_id for update;
  if not found then raise exception 'transfer_not_found' using errcode = 'P0002'; end if;
  select * into v_pet from public.pets where id = v_t.pet_id for update;

  if p_action in ('accept', 'decline') then
    if v_t.to_user_id <> v_uid then raise exception 'forbidden' using errcode = '42501'; end if;
  elsif not (v_t.initiated_by = v_uid or public.can_transfer_pet(v_t.pet_id, v_uid)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_t.status = v_new then
    return query select v_t.id, v_t.status, v_t.pet_id;
    return;
  end if;
  if v_t.status <> 'pending' then
    raise exception 'invalid_transition:%->%', v_t.status, v_new using errcode = '22023';
  end if;

  if v_new = 'accepted' then
    -- the pet must still belong to the sender, and a linked reservation must still be confirmed
    if v_pet.user_id is distinct from v_t.from_user_id then
      raise exception 'stale_transfer' using errcode = '22023';
    end if;
    if v_t.reservation_id is not null and not exists (
         select 1 from public.pet_reservations r
         where r.id = v_t.reservation_id and r.status = 'confirmed' and r.buyer_id = v_t.to_user_id) then
      raise exception 'reservation_not_confirmed' using errcode = '22023';
    end if;
  end if;

  -- ownership change, reservation → converted and pet status are done by trg_sync_pet_owner_on_transfer_accept
  update public.pet_ownership_transfers set status = v_new where id = v_t.id;
  return query select v_t.id, v_new, v_t.pet_id;
end;
$$;
revoke all on function public.respond_pet_transfer(bigint, text) from public, anon;
grant execute on function public.respond_pet_transfer(bigint, text) to authenticated;

-- Existing trigger function (same trigger, same name — no second trigger). Added: the pet leaves the
-- sale statuses (no 'ติดจอง' under the new owner, never relisted automatically → NULL = not specified),
-- and other open reservations of the pet are cancelled.
create or replace function public.sync_pet_owner_on_transfer_accept()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    update pets
       set user_id = new.to_user_id,
           farm_id = null,
           status = case when status in ('ติดจอง', 'เปิดจอง', 'พร้อมย้ายบ้าน') then null else status end
     where id = new.pet_id;
    new.accepted_at := now();
    if new.reservation_id is not null then
      update pet_reservations set status = 'converted' where id = new.reservation_id;
    end if;
    update pet_reservations set status = 'cancelled', confirmed_at = null
     where pet_id = new.pet_id and status in ('pending', 'confirmed')
       and id is distinct from new.reservation_id;
  end if;
  return new;
end;
$$;
