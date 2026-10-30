-- Undo reservation_transfer_freeze.sql (after the forward fix is applied and checked). Idempotent.
begin;
drop policy if exists "freeze: no new reservations" on public.pet_reservations;
drop policy if exists "freeze: no new transfers" on public.pet_ownership_transfers;
grant execute on function public.farm_set_reservation_status(bigint, text) to authenticated;
grant execute on function public.respond_pet_transfer(bigint, text) to authenticated;
commit;
