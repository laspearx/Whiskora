-- Rollback of 20261030120000_reservation_transfer_pipeline.sql — restores the exact previous state
-- (policies, trigger function body). WARNING: this re-opens the direct-API holes listed in the migration
-- header (team members taking farm pets, initiator self-accept, receiver pet_id swap). Use only if the
-- new path is broken; the app keeps working (it falls back to direct writes when the RPCs are gone).
-- Does not touch pets column grants (privacy migration) — check with the privacy postcheck afterwards.
begin;

drop function if exists public.respond_pet_transfer(bigint, text);
drop function if exists public.farm_set_reservation_status(bigint, text);

drop policy if exists "transfers create by pet owner or farm owner" on public.pet_ownership_transfers;
create policy "transfers create by pet manager" on public.pet_ownership_transfers
  for insert with check ((initiated_by = auth.uid()) and can_manage_pet_visibility(pet_id));
create policy "transfers update by buyer or initiator" on public.pet_ownership_transfers
  for update using ((to_user_id = auth.uid()) or (initiated_by = auth.uid()));
alter table public.pet_ownership_transfers drop constraint if exists pet_ownership_transfers_not_self;
drop index if exists public.pet_ownership_transfers_one_pending_per_pet;

drop policy if exists "reservations create by buyer" on public.pet_reservations;
create policy "reservations create by buyer" on public.pet_reservations
  for insert with check (buyer_id = auth.uid());
create policy "reservations update by buyer or farm team" on public.pet_reservations
  for update using ((buyer_id = auth.uid()) or can_manage_pet_visibility(pet_id));
drop index if exists public.pet_reservations_one_open_per_buyer;

drop function if exists public.pet_transfer_insert_ok(bigint, uuid, uuid, bigint);
drop function if exists public.pet_is_reservable(bigint, uuid);
drop function if exists public.can_transfer_pet(bigint, uuid);
drop function if exists public.can_decide_pet_reservation(bigint, uuid);

create or replace function public.sync_pet_owner_on_transfer_accept()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    update pets set user_id = new.to_user_id, farm_id = null where id = new.pet_id;
    new.accepted_at := now();
    if new.reservation_id is not null then
      update pet_reservations set status = 'converted' where id = new.reservation_id;
    end if;
  end if;
  return new;
end;
$function$;

commit;
