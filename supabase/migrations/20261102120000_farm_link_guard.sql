-- STATUS: proposed — security branch, not applied anywhere. Staging first, production only on the owner's go-ahead
-- (docs/SECURITY_PHASE1.md §M1). No app change needed.
--
-- M1: pets.farm_id and litters.farm_id could be set to ANY farm by any signed-in user (column INSERT / UPDATE grants;
-- policies only check user_id) → a stranger's pet or litter shows up on someone else's farm page / dashboard.
-- After: through the API (anon / authenticated) a row may be linked to farm F (INSERT with farm_id = F, or UPDATE that
-- changes farm_id to F) only by F's entity owner, an owner / manager / staff member of F's workspace, or a platform
-- admin. Unlinking (farm_id → null) and updates that keep farm_id are unchanged. System paths (SECURITY DEFINER RPCs
-- such as the transfer accept, service_role, the database owner) are not affected. Existing rows are not touched.
create or replace function public.caller_can_link_farm(p_farm_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and p_farm_id is not null and (
    exists (select 1 from farms f where f.id = p_farm_id and f.user_id = auth.uid()::text)
    or exists (select 1 from workspaces w where w.type = 'farm' and w.entity_id = p_farm_id
                and public.workspace_role_of(w.id, auth.uid()) in ('owner', 'manager', 'staff'))
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
$$;
-- no arbitrary viewer argument: always the caller (auth.uid())
revoke all on function public.caller_can_link_farm(bigint) from public, anon;
grant execute on function public.caller_can_link_farm(bigint) to authenticated;

-- SECURITY INVOKER on purpose: current_user is the API role only for direct API writes; inside SECURITY DEFINER code
-- it is the function owner and the guard stays out of the way.
create or replace function public.farm_link_guard()
returns trigger language plpgsql set search_path = public as $$
declare v_new bigint; v_old bigint;
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  v_new := nullif(trim(new.farm_id::text), '')::bigint;
  if tg_op = 'UPDATE' then v_old := nullif(trim(old.farm_id::text), '')::bigint; end if;
  if v_new is null or (tg_op = 'UPDATE' and v_new is not distinct from v_old) then return new; end if;
  if not public.caller_can_link_farm(v_new) then
    raise exception 'not allowed to link this row to farm %', v_new using errcode = '42501';
  end if;
  return new;
exception when invalid_text_representation then
  raise exception 'farm_id must be a farm id' using errcode = '22023';
end $$;
revoke all on function public.farm_link_guard() from public, anon, authenticated;

drop trigger if exists pets_farm_link_guard on public.pets;
create trigger pets_farm_link_guard before insert or update of farm_id on public.pets
  for each row execute function public.farm_link_guard();
drop trigger if exists litters_farm_link_guard on public.litters;
create trigger litters_farm_link_guard before insert or update of farm_id on public.litters
  for each row execute function public.farm_link_guard();
