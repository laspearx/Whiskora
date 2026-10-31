-- ██ STAGING ONLY — NOT A PRODUCTION RECOVERY STEP ██
-- Exact pre-migration state of 20261031120000_transfer_access_reset.sql, to test rollback on whiskora-staging.
-- It RE-OPENS what that migration closes (old co-owners / grants / tiers survive a transfer, weights by recorder).
-- On production: fix forward. Does not restore removed co-owners / grants (history table is dropped here — staging only).
begin;
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found — this is not whiskora-staging';
  end if;
end $$;

drop trigger if exists pet_co_owners_recheck on public.pet_co_owners;
drop trigger if exists access_grants_insert_recheck on public.access_grants;
drop trigger if exists pet_visibility_settings_recheck on public.pet_visibility_settings;
drop function if exists public.pet_access_write_recheck();

drop trigger if exists pet_weights_keep_recorder on public.pet_weights;
drop function if exists public.pet_weights_keep_recorder();
drop policy if exists "pet weights read by owner or team" on public.pet_weights;
drop policy if exists "pet weights insert by owner or team" on public.pet_weights;
drop policy if exists "pet weights update by owner or team" on public.pet_weights;
drop policy if exists "pet weights delete by owner or team" on public.pet_weights;
create policy "Users manage own pet weights" on public.pet_weights for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop function if exists public.can_record_pet_weight(bigint, uuid);

create or replace function public.resolve_pet_tags(p_pet_id bigint, p_viewer uuid)
returns text[] language sql stable security definer set search_path = public as $function$
  select array_remove(array[
    'public',
    case when p_viewer is not null then 'registered' end,
    case when exists (
      select 1 from pet_reservations r
      where r.pet_id = p_pet_id and r.buyer_id = p_viewer and r.status = 'confirmed'
    ) then 'reserved_buyer' end,
    case when exists (
      select 1 from access_grants g
      where g.resource_type = 'pet' and g.resource_id = p_pet_id
        and g.grantee_id = p_viewer and g.revoked_at is null
        and (g.expires_at is null or g.expires_at > now())
    ) then 'granted' end,
    case when exists (
      select 1 from pets p where p.id = p_pet_id and p.user_id = p_viewer
    ) then 'current_owner' end,
    case when exists (
      select 1 from pet_co_owners co where co.pet_id = p_pet_id and co.user_id = p_viewer
    ) then 'current_owner' end,
    case when exists (
      select 1 from pet_ownership_transfers t
      where t.pet_id = p_pet_id and t.status = 'accepted' and t.to_user_id = p_viewer
        and t.to_user_id <> (select user_id from pets where id = p_pet_id)
        and t.anonymized_at is null
    ) then 'previous_owner' end,
    case when exists (
      -- authoritative: farms.user_id (always populated) OR workspace membership
      -- (staff / co-owner, and owners on farms that got backfilled)
      select 1 from pets p
      join farms f on f.id = p.farm_id
      where p.id = p_pet_id and f.user_id::text = p_viewer::text
    ) then 'farm_team' end,
    case when exists (
      select 1 from pets p
      join workspaces w on w.type = 'farm' and w.entity_id = p.farm_id
      join workspace_members wm on wm.workspace_id = w.id and wm.user_id = p_viewer
      where p.id = p_pet_id
    ) then 'farm_team' end,
    case when exists (
      select 1 from profiles where id = p_viewer and role = 'admin'
    ) then 'platform_admin' end
  ], null);
$function$;

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

drop table if exists public.pet_transfer_access_revocations;
commit;
