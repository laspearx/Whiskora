-- ─────────────────────────────────────────────────────────────────────────────
-- Whiskora: a pet set to not public (pets.is_public = false) stays private
-- Rule: when the owner sets a pet to not public, neither a sale status nor a field-group tier opens it to
-- anyone who is not its owner / co-owner / farm team / admin (or an explicit access grant).
-- Checked on staging (pet_privacy_checks.cjs, synthetic data) — before this migration:
--   * pets policy "Public can view available pets" (status = พร้อมย้ายบ้าน) returned private pets to anyone,
--     also in listing queries (farm-hub).
--   * viewer_can_see() ignored is_public: a private pet's health / pedigree / vaccination / weight / documents
--     followed the tier alone (e.g. tier public → anonymous get_pet_health returned the private pet's allergies).
--   * get_pet_pedigree() walked into ancestors regardless of their privacy: a public pet's tree showed a private
--     sire/dam (name, photo, breed).
--   * pedigree columns (sire_id, dam_id, pedigree_number, pedigree_image_url, grand-parent names) were readable
--     by anonymous REST calls on any readable pet, bypassing the pedigree tier (default: owner).
--   * co-owners could not read a private pet row at all (no SELECT policy), although they are owners for tiers.
-- Production (2026-10-30, read-only count): 137 pets, none private, so rows/RPC results change for nobody today
-- except anonymous direct reads of pedigree columns (25 readable pets have some pedigree value; the app's public
-- pages never read those columns — they use get_pet_pedigree()).
--   * storage bucket pet-photos could be listed by anyone (all user-id folders and file names).
-- Not changed here: signed-in users can still read pedigree columns of readable pets directly (needed by the farm
-- dashboard / owner pages that read PET_COLUMNS; closing it needs an owner/team RPC — separate decision);
-- pet-photos stays a public bucket (a known photo URL of a private pet still loads — separate decision);
-- co-owners / per-pet tiers set by a previous owner survive a transfer (separate decision); default privileges.
-- Recovery: fix forward. The staging-only exact revert re-opens the leaks and is not a production step.
-- ─────────────────────────────────────────────────────────────────────────────

-- helpers (SECURITY DEFINER: no RLS recursion between pets and pet_co_owners)
create or replace function public.is_pet_co_owner(p_pet_id bigint, p_viewer uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_viewer is not null
     and exists (select 1 from pet_co_owners co where co.pet_id = p_pet_id and co.user_id = p_viewer);
$$;

-- may this viewer see the pet at all? public pets: everyone; private pets: owner, co-owner, farm team, admin,
-- or an active access grant
create or replace function public.pet_visible_to(p_pet_id bigint, p_viewer uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from pets p where p.id = p_pet_id and p.is_public is not false)
      or (p_viewer is not null
          and resolve_pet_tags(p_pet_id, p_viewer) && array['current_owner', 'farm_team', 'platform_admin', 'granted']);
$$;

revoke all on function public.is_pet_co_owner(bigint, uuid) from public, anon;
grant execute on function public.is_pet_co_owner(bigint, uuid) to authenticated;
revoke all on function public.pet_visible_to(bigint, uuid) from public;
grant execute on function public.pet_visible_to(bigint, uuid) to anon, authenticated;

-- 1. sale status no longer overrides is_public = false
drop policy if exists "Public can view available pets" on public.pets;
create policy "Public can view available pets" on public.pets
  for select using (status = 'พร้อมย้ายบ้าน' and is_public is not false);

-- co-owners and the farm team keep seeing a private pet (they are owners / team for every tier)
drop policy if exists "pets read by co-owner or farm team" on public.pets;
create policy "pets read by co-owner or farm team" on public.pets
  for select to authenticated
  using (public.is_pet_co_owner(id, auth.uid()) or (farm_id is not null and public.is_farm_team(farm_id, auth.uid())));

-- 2. tiers cannot open a private pet to outsiders (same signature/default as before)
create or replace function public.viewer_can_see(p_pet_id bigint, p_field_group text, p_viewer uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  with s as (
    select resolve_pet_tags(p_pet_id, p_viewer) as tags,
      coalesce(
        (select tier from pet_visibility_settings
          where pet_id = p_pet_id and field_group_key = p_field_group),
        (select fvs.tier from pets p
          join farm_visibility_settings fvs
            on fvs.farm_id = p.farm_id and fvs.field_group_key = p_field_group
          where p.id = p_pet_id),
        (select default_tier from field_groups where key = p_field_group)
      ) as tier,
      coalesce(
        (select include_previous_owner from pet_visibility_settings
          where pet_id = p_pet_id and field_group_key = p_field_group),
        (select fvs.include_previous_owner from pets p
          join farm_visibility_settings fvs
            on fvs.farm_id = p.farm_id and fvs.field_group_key = p_field_group
          where p.id = p_pet_id),
        false
      ) as inc
  )
  select case
    when exists (select 1 from pets where id = p_pet_id and is_public is false)
     and not (s.tags && array['current_owner', 'farm_team', 'platform_admin', 'granted']
              or (s.inc and s.tags && array['previous_owner']))
    then false
    else tags_satisfy_tier(s.tags, s.tier, s.inc)
  end
  from s;
$$;

-- 3. pedigree tree stops at ancestors the viewer may not see (shown as missing by the app)
create or replace function public.get_pet_pedigree(p_pet_id bigint, p_max_gen integer default 5)
returns table (node_id bigint, child_id bigint, name text, image_url text, breed text, gender text, relation text, generation integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not viewer_can_see(p_pet_id, 'pedigree', auth.uid()) then
    return;
  end if;
  return query
  with recursive lineage as (
    select p.id, null::bigint as child_id, p.name, p.image_url, p.breed, p.gender,
           'self'::text as relation, 0 as generation,
           p.sire_id, p.dam_id
    from pets p where p.id = p_pet_id
    union all
    select par.id, l.id as child_id, par.name, par.image_url, par.breed, par.gender,
           case when l.sire_id = par.id then 'sire' else 'dam' end,
           l.generation + 1,
           par.sire_id, par.dam_id
    from lineage l
    join pets par on par.id in (l.sire_id, l.dam_id)
    where l.generation < p_max_gen
      and pet_visible_to(par.id, auth.uid())
  )
  select lineage.id, lineage.child_id, lineage.name, lineage.image_url, lineage.breed, lineage.gender, lineage.relation, lineage.generation from lineage;
end;
$$;

-- 4. anonymous REST reads of pedigree columns (the tier is enforced by get_pet_pedigree; public pages use it)
revoke select (sire_id, dam_id, pedigree_number, pedigree_image_url,
               paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam)
  on public.pets from anon;

-- 5. pet-photos: anyone could LIST the bucket (every user-id folder and file name, incl. photos of private pets).
--    Public URLs keep working (public bucket, no RLS on /object/public). The app only uploads (some with upsert)
--    to the user's own folder and builds public URLs, so a SELECT limited to the own folder is enough.
drop policy if exists "Public read pet photos" on storage.objects;
drop policy if exists "Public read pet-photos" on storage.objects;
drop policy if exists "pet-photos read own folder" on storage.objects;
create policy "pet-photos read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

-- 6. who may change privacy settings — same rule as the UI (farm privacy page: owner / manager; staff and viewer
--    are read-only). Before: any farm team member (incl. staff / viewer) and any co-owner could write
--    farm_visibility_settings / pet_visibility_settings through the API (reproduced on staging: viewer set
--    farm health tier to public). Reads are unchanged.
create or replace function public.can_manage_farm_privacy(p_farm_id bigint, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and (
       exists (select 1 from farms f where f.id = p_farm_id and f.user_id = p_uid::text)
    or exists (select 1 from workspaces w join workspace_members m on m.workspace_id = w.id
               where w.type = 'farm' and w.entity_id = p_farm_id and m.user_id = p_uid
                 and m.role in ('owner', 'manager'))
    or exists (select 1 from profiles where id = p_uid and role = 'admin'));
$$;
create or replace function public.can_manage_pet_privacy(p_pet_id bigint, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and exists (
    select 1 from pets p where p.id = p_pet_id
      and (p.user_id = p_uid
           or (p.farm_id is not null and public.can_manage_farm_privacy(p.farm_id, p_uid))
           or exists (select 1 from profiles where id = p_uid and role = 'admin')));
$$;
revoke all on function public.can_manage_farm_privacy(bigint, uuid) from public, anon;
revoke all on function public.can_manage_pet_privacy(bigint, uuid) from public, anon;
grant execute on function public.can_manage_farm_privacy(bigint, uuid) to authenticated;
grant execute on function public.can_manage_pet_privacy(bigint, uuid) to authenticated;

drop policy if exists "farm_visibility write by farm team" on public.farm_visibility_settings;
drop policy if exists "farm_visibility update by farm team" on public.farm_visibility_settings;
drop policy if exists "farm_visibility delete by farm team" on public.farm_visibility_settings;
drop policy if exists "farm_visibility write by owner or manager" on public.farm_visibility_settings;
drop policy if exists "farm_visibility update by owner or manager" on public.farm_visibility_settings;
drop policy if exists "farm_visibility delete by owner or manager" on public.farm_visibility_settings;
create policy "farm_visibility write by owner or manager" on public.farm_visibility_settings
  for insert to authenticated with check (public.can_manage_farm_privacy(farm_id, auth.uid()));
create policy "farm_visibility update by owner or manager" on public.farm_visibility_settings
  for update to authenticated using (public.can_manage_farm_privacy(farm_id, auth.uid()))
  with check (public.can_manage_farm_privacy(farm_id, auth.uid()));
create policy "farm_visibility delete by owner or manager" on public.farm_visibility_settings
  for delete to authenticated using (public.can_manage_farm_privacy(farm_id, auth.uid()));

drop policy if exists "pet_visibility write by manager" on public.pet_visibility_settings;
drop policy if exists "pet_visibility update by manager" on public.pet_visibility_settings;
drop policy if exists "pet_visibility delete by manager" on public.pet_visibility_settings;
drop policy if exists "pet_visibility write by owner" on public.pet_visibility_settings;
drop policy if exists "pet_visibility update by owner" on public.pet_visibility_settings;
drop policy if exists "pet_visibility delete by owner" on public.pet_visibility_settings;
create policy "pet_visibility write by owner" on public.pet_visibility_settings
  for insert to authenticated with check (public.can_manage_pet_privacy(pet_id, auth.uid()));
create policy "pet_visibility update by owner" on public.pet_visibility_settings
  for update to authenticated using (public.can_manage_pet_privacy(pet_id, auth.uid()))
  with check (public.can_manage_pet_privacy(pet_id, auth.uid()));
create policy "pet_visibility delete by owner" on public.pet_visibility_settings
  for delete to authenticated using (public.can_manage_pet_privacy(pet_id, auth.uid()));
