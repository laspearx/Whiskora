-- ─────────────────────────────────────────────────────────────────────────────
-- Whiskora: access given by a previous owner does not pass to the new owner's pet
-- Rule (owner-approved 2026-10-31): when a transfer is accepted, the pet starts from safe settings; the new owner
-- grants access again. Transfer history (pet_ownership_transfers) is never deleted.
-- Checked on staging (pet_privacy_checks.cjs --transfer, synthetic data) — before this migration, after "accept":
--   * pet_co_owners of the old owner stayed → old co-owners kept owner-level access (health, private card, writes).
--   * access_grants given by the old owner stayed active.
--   * pet_visibility_settings stayed (e.g. "pedigree = public" set by the old owner kept applying).
--   * pet_weights: policy "Users manage own pet weights" (user_id = auth.uid(), no pet check) let the recorder read and
--     edit rows of a pet it no longer owns, the new owner could not edit them, and any signed-in user could insert
--     weight rows for any pet.
--   * the original seller (sent the pet, never received it) was not a previous owner.
-- What happens on accept (same trigger trg_sync_pet_owner_on_transfer_accept, same transaction as
-- respond_pet_transfer, after its locks pets → pet_reservations → pet_ownership_transfers; this adds
-- pet_co_owners / access_grants / pet_visibility_settings after them — no path locks those first and then pets):
--   1. co-owners removed, active grants on the pet revoked (revoke-only trigger of v1.7.1: active → revoked, now()),
--      each recorded in pet_transfer_access_revocations with the transfer id (unique per transfer + subject:
--      a repeated accept is a no-op in respond_pet_transfer and the trigger only runs on the change to accepted).
--   2. every pet field group except overview → tier 'owner', include_previous_owner = false; a group whose current
--      tier is 'private' stays 'private' (stricter). Old rows are recorded. overview and pets.is_public are kept
--      (public card behaviour unchanged, as shown in the transfer inbox). farm_id is cleared (existing) → farm
--      settings and the old farm team stop applying.
--      'owner' tier = current owner (pets.user_id) + co-owners the new owner adds + farm team of the pet's current
--      farm + platform admins; previous owners only where the new owner turns include_previous_owner on. A grant does
--      not open an 'owner' group (tags_satisfy_tier: grants count for 'engaged').
--   3. previous_owner also covers the sender of an accepted transfer (seller), still only through
--      include_previous_owner (false after accept) → counted, but no automatic read access.
--   4. pet_weights: write = current owner / co-owner / farm owner, manager, staff of the pet's farm / admin
--      (viewer stays read-only); user_id stays as "recorded by" (insert = self, cannot be changed later).
--      Read: the weight field-group rule (viewer_can_see) + the writers above.
-- Not changed here: pet-documents files stay in the old owner's storage folder (old owner can still read them, new
-- owner cannot sign them) — private-files PR; appointments stay with the user who made them; grant DELETE.
-- Recovery: fix forward. Do not re-add "Users manage own pet weights", do not restore removed co-owners / grants by
-- script; the staging-only revert is not a production step.
-- ─────────────────────────────────────────────────────────────────────────────

-- history of access removed by an accepted transfer (rows are never written by the API)
create table if not exists public.pet_transfer_access_revocations (
  id bigint generated always as identity primary key,
  transfer_id bigint not null references public.pet_ownership_transfers(id) on delete cascade,
  pet_id bigint not null,
  kind text not null check (kind in ('co_owner', 'access_grant', 'visibility_setting')),
  subject_user_id uuid,
  access_grant_id uuid references public.access_grants(id) on delete set null,
  field_group_key text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists pet_transfer_access_revocations_once
  on public.pet_transfer_access_revocations
  (transfer_id, kind, coalesce(subject_user_id::text, ''), coalesce(access_grant_id::text, ''), coalesce(field_group_key, ''));
alter table public.pet_transfer_access_revocations enable row level security;
revoke all on public.pet_transfer_access_revocations from public, anon, authenticated;
grant select on public.pet_transfer_access_revocations to authenticated;
drop policy if exists "transfer revocations read by sender or admin" on public.pet_transfer_access_revocations;
create policy "transfer revocations read by sender or admin" on public.pet_transfer_access_revocations
  for select to authenticated
  using (exists (select 1 from pet_ownership_transfers t where t.id = transfer_id and t.from_user_id = auth.uid())
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- same trigger function, extended (no second trigger)
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

    -- 1. co-owners and active grants of the previous owner's time
    with gone as (
      delete from pet_co_owners where pet_id = new.pet_id
      returning user_id, added_by, added_at)
    insert into pet_transfer_access_revocations (transfer_id, pet_id, kind, subject_user_id, detail)
    select new.id, new.pet_id, 'co_owner', user_id, jsonb_build_object('added_by', added_by, 'added_at', added_at)
      from gone
    on conflict do nothing;
    with gone as (
      update access_grants set revoked_at = now()
       where resource_type = 'pet' and resource_id = new.pet_id and revoked_at is null
      returning id, grantee_id, grantee_email, granted_by, field_group_key, expires_at)
    insert into pet_transfer_access_revocations (transfer_id, pet_id, kind, subject_user_id, access_grant_id, field_group_key, detail)
    select new.id, new.pet_id, 'access_grant', grantee_id, id, field_group_key,
           jsonb_build_object('granted_by', granted_by, 'expires_at', expires_at, 'by_email', grantee_email is not null)
      from gone
    on conflict do nothing;

    -- 2. per-group tiers → owner-only (private stays private), no previous owners; overview untouched
    insert into pet_transfer_access_revocations (transfer_id, pet_id, kind, field_group_key, detail)
    select new.id, new.pet_id, 'visibility_setting', s.field_group_key,
           jsonb_build_object('tier', s.tier, 'include_previous_owner', s.include_previous_owner, 'updated_by', s.updated_by)
      from pet_visibility_settings s
     where s.pet_id = new.pet_id and s.field_group_key <> 'overview'
    on conflict do nothing;
    insert into pet_visibility_settings (pet_id, field_group_key, tier, include_previous_owner, updated_by, updated_at)
    select new.pet_id, fg.key,
           case when coalesce(s.tier, fg.default_tier) = 'private' then 'private'::visibility_tier else 'owner'::visibility_tier end,
           false, null, now()
      from field_groups fg
      left join pet_visibility_settings s on s.pet_id = new.pet_id and s.field_group_key = fg.key
     where fg.resource_type = 'pet' and fg.key <> 'overview'
    on conflict (pet_id, field_group_key) do update
      set tier = excluded.tier, include_previous_owner = false, updated_by = null, updated_at = now();
  end if;
  return new;
end;
$$;

-- 3. previous_owner: anyone who received the pet earlier OR sent it in an accepted transfer (not the current owner).
--    Only used with include_previous_owner (tags_satisfy_tier / viewer_can_see) — no access on its own.
create or replace function public.resolve_pet_tags(p_pet_id bigint, p_viewer uuid)
returns text[] language sql stable security definer set search_path = public as $$
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
      where t.pet_id = p_pet_id and t.status = 'accepted' and t.anonymized_at is null
        and (t.to_user_id = p_viewer or t.from_user_id = p_viewer)
        and p_viewer is distinct from (select user_id from pets where id = p_pet_id)
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
$$;

-- 4. weight rows follow the pet's current owner / team; user_id = who recorded it (history)
create or replace function public.can_record_pet_weight(p_pet_id bigint, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and exists (
    select 1 from pets p where p.id = p_pet_id
      and (p.user_id = p_uid
           or exists (select 1 from pet_co_owners co where co.pet_id = p.id and co.user_id = p_uid)
           or (p.farm_id is not null and (
                 exists (select 1 from farms f where f.id = p.farm_id and f.user_id = p_uid::text)
              or exists (select 1 from workspaces w join workspace_members m on m.workspace_id = w.id
                         where w.type = 'farm' and w.entity_id = p.farm_id and m.user_id = p_uid
                           and m.role in ('owner', 'manager', 'staff'))))
           or exists (select 1 from profiles where id = p_uid and role = 'admin')));
$$;
revoke all on function public.can_record_pet_weight(bigint, uuid) from public, anon;
grant execute on function public.can_record_pet_weight(bigint, uuid) to authenticated;

drop policy if exists "Users manage own pet weights" on public.pet_weights;
drop policy if exists "pet weights read by owner or team" on public.pet_weights;
drop policy if exists "pet weights insert by owner or team" on public.pet_weights;
drop policy if exists "pet weights update by owner or team" on public.pet_weights;
drop policy if exists "pet weights delete by owner or team" on public.pet_weights;
create policy "pet weights read by owner or team" on public.pet_weights
  for select to authenticated using (public.can_record_pet_weight(pet_id, auth.uid()));
create policy "pet weights insert by owner or team" on public.pet_weights
  for insert to authenticated with check (user_id = auth.uid() and public.can_record_pet_weight(pet_id, auth.uid()));
create policy "pet weights update by owner or team" on public.pet_weights
  for update to authenticated using (public.can_record_pet_weight(pet_id, auth.uid()))
  with check (public.can_record_pet_weight(pet_id, auth.uid()));
create policy "pet weights delete by owner or team" on public.pet_weights
  for delete to authenticated using (public.can_record_pet_weight(pet_id, auth.uid()));

create or replace function public.pet_weights_keep_recorder()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.user_id is distinct from old.user_id or new.pet_id is distinct from old.pet_id then
    raise exception 'pet_weights: recorder and pet cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.pet_weights_keep_recorder() from public, anon, authenticated;
drop trigger if exists pet_weights_keep_recorder on public.pet_weights;
create trigger pet_weights_keep_recorder before update on public.pet_weights
  for each row execute function public.pet_weights_keep_recorder();

-- 5. no access slips in while a transfer is being accepted. RLS checks use the statement snapshot, so an old owner's
--    co-owner / grant insert that commits after the accept would survive it. These triggers re-check with fresh data:
--    inserts into pet_co_owners / access_grants first lock the pets row FOR SHARE (waits for an accept in progress —
--    same order as accept: pets first); privacy-setting writes re-check without a lock (an accept in progress
--    overwrites them anyway, via ON CONFLICT, after waiting for the row). Only for API callers (auth.uid() set).
create or replace function public.pet_access_write_recheck()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pet bigint;
begin
  if v_uid is null then return new; end if;
  if tg_table_name = 'pet_co_owners' then
    v_pet := new.pet_id;
    perform 1 from pets where id = v_pet for share;
    if not exists (select 1 from pets where id = v_pet and user_id = v_uid) then
      raise exception 'pet ownership changed' using errcode = '42501';
    end if;
  elsif tg_table_name = 'access_grants' then
    if new.resource_type = 'pet' then
      v_pet := new.resource_id;
      perform 1 from pets where id = v_pet for share;
      if not public.can_manage_pet_privacy(v_pet, v_uid) then
        raise exception 'pet ownership changed' using errcode = '42501';
      end if;
    end if;
  elsif tg_table_name = 'pet_visibility_settings' then
    if not public.can_manage_pet_privacy(new.pet_id, v_uid) then
      raise exception 'pet ownership changed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.pet_access_write_recheck() from public, anon, authenticated;
drop trigger if exists pet_co_owners_recheck on public.pet_co_owners;
create trigger pet_co_owners_recheck before insert on public.pet_co_owners
  for each row execute function public.pet_access_write_recheck();
drop trigger if exists access_grants_insert_recheck on public.access_grants;
create trigger access_grants_insert_recheck before insert on public.access_grants
  for each row execute function public.pet_access_write_recheck();
drop trigger if exists pet_visibility_settings_recheck on public.pet_visibility_settings;
create trigger pet_visibility_settings_recheck before insert or update on public.pet_visibility_settings
  for each row execute function public.pet_access_write_recheck();
