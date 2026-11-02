-- STATUS: proposed — security branch, not applied anywhere. H1 step 1 of 2 (EXPAND): additive only.
-- Order (docs/SECURITY_PHASE1.md §H1): this → deploy the H1 app → verify dashboard / edit / verify / public farm →
-- 20261102170000_farm_private_columns (CONTRACT) → verify again.
-- Adds get_farm_private(farm): the private location fields + admin note for the entity owner, any workspace member of
-- that farm, or a platform admin. Changes no grant, policy or data: the old app keeps working, the new app works.
-- Private columns for the people who manage the farm: entity owner, any workspace member of that farm, platform admin.
create or replace function public.get_farm_private(p_farm_id bigint)
returns table (address text, house_no text, room_no text, moo text, soi text, road text, postal_code text,
               lat double precision, lng double precision, verification_note text)
language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from farms f where f.id = p_farm_id) then raise exception 'farm not found' using errcode = 'P0002'; end if;
  if not (
    exists (select 1 from farms f where f.id = p_farm_id and f.user_id = v_uid::text)
    or exists (select 1 from workspaces w join workspace_members m on m.workspace_id = w.id
                where w.type = 'farm' and w.entity_id = p_farm_id and m.user_id = v_uid)
    or exists (select 1 from profiles p where p.id = v_uid and p.role = 'admin')
  ) then raise exception 'not allowed' using errcode = '42501'; end if;
  return query select f.address, f.house_no, f.room_no, f.moo, f.soi, f.road, f.postal_code,
                      f.lat::double precision, f.lng::double precision, f.verification_note
                 from farms f where f.id = p_farm_id;
end $$;
revoke all on function public.get_farm_private(bigint) from public, anon;
grant execute on function public.get_farm_private(bigint) to authenticated;

