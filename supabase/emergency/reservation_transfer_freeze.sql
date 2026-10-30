-- PRODUCTION RECOVERY for 20261030120000_reservation_transfer_pipeline.sql — freeze, then fix forward.
-- Stops every NEW reservation / transfer write by app users while keeping:
--   * all reads (SELECT policies untouched: farm pages, buyer status, transfer inbox still show data)
--   * privacy (no grant on pets/profiles columns is touched; no policy is dropped or widened)
--   * the security fixes of the migration (no old UPDATE policy comes back)
-- How: two RESTRICTIVE insert policies that always fail + revoke EXECUTE on the two write RPCs.
-- Service role / SQL editor are unaffected (for the forward fix). Undo: reservation_transfer_unfreeze.sql.
-- Idempotent. Run as one transaction.
begin;
drop policy if exists "freeze: no new reservations" on public.pet_reservations;
create policy "freeze: no new reservations" on public.pet_reservations
  as restrictive for insert to public with check (false);
drop policy if exists "freeze: no new transfers" on public.pet_ownership_transfers;
create policy "freeze: no new transfers" on public.pet_ownership_transfers
  as restrictive for insert to public with check (false);
revoke execute on function public.farm_set_reservation_status(bigint, text) from authenticated;
revoke execute on function public.respond_pet_transfer(bigint, text) from authenticated;
commit;
