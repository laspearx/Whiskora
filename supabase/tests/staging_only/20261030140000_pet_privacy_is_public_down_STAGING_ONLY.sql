-- ██ STAGING ONLY — NOT A PRODUCTION RECOVERY STEP ██
-- Exact pre-migration state of 20261030140000_pet_privacy_is_public.sql, to test rollback on whiskora-staging.
-- It RE-OPENS the privacy leaks listed in that migration. On production: fix forward.
begin;
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found — this is not whiskora-staging';
  end if;
end $$;

drop policy if exists "pet-photos read own folder" on storage.objects;
create policy "Public read pet photos" on storage.objects for select using (bucket_id = 'pet-photos'::text);
create policy "Public read pet-photos" on storage.objects for select using (bucket_id = 'pet-photos'::text);

drop policy if exists "farm_visibility write by owner or manager" on public.farm_visibility_settings;
drop policy if exists "farm_visibility update by owner or manager" on public.farm_visibility_settings;
drop policy if exists "farm_visibility delete by owner or manager" on public.farm_visibility_settings;
create policy "farm_visibility write by farm team" on public.farm_visibility_settings for insert with check (is_farm_team(farm_id));
create policy "farm_visibility update by farm team" on public.farm_visibility_settings for update using (is_farm_team(farm_id)) with check (is_farm_team(farm_id));
create policy "farm_visibility delete by farm team" on public.farm_visibility_settings for delete using (is_farm_team(farm_id));

drop policy if exists "pet_visibility write by owner" on public.pet_visibility_settings;
drop policy if exists "pet_visibility update by owner" on public.pet_visibility_settings;
drop policy if exists "pet_visibility delete by owner" on public.pet_visibility_settings;
create policy "pet_visibility write by manager" on public.pet_visibility_settings for insert with check (can_manage_pet_visibility(pet_id));
create policy "pet_visibility update by manager" on public.pet_visibility_settings for update using (can_manage_pet_visibility(pet_id)) with check (can_manage_pet_visibility(pet_id));
create policy "pet_visibility delete by manager" on public.pet_visibility_settings for delete using (can_manage_pet_visibility(pet_id));

drop trigger if exists access_grants_revoke_only on public.access_grants;
drop function if exists public.access_grants_revoke_only();
grant update on public.access_grants to anon, authenticated;
drop policy if exists "access_grants create by pet owner" on public.access_grants;
drop policy if exists "access_grants revoke by granter or owner" on public.access_grants;
create policy "access_grants create by pet manager" on public.access_grants for insert
  with check ((granted_by = auth.uid()) and (resource_type = 'pet'::text) and can_manage_pet_visibility(resource_id));
create policy "access_grants revoke by granter or manager" on public.access_grants for update
  using ((granted_by = auth.uid()) or ((resource_type = 'pet'::text) and can_manage_pet_visibility(resource_id)));

drop function if exists public.get_pet_pedigree_fields(bigint);
grant select (sire_id, dam_id, pedigree_number, pedigree_image_url,
              paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam) on public.pets to anon, authenticated;

drop policy if exists "pets read by co-owner or farm team" on public.pets;
drop policy if exists "Public can view available pets" on public.pets;
create policy "Public can view available pets" on public.pets for select using (status = 'พร้อมย้ายบ้าน'::text);

CREATE OR REPLACE FUNCTION public.viewer_can_see(p_pet_id bigint, p_field_group text, p_viewer uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select tags_satisfy_tier(
    resolve_pet_tags(p_pet_id, p_viewer),
    coalesce(
      (select tier from pet_visibility_settings
        where pet_id = p_pet_id and field_group_key = p_field_group),
      (select fvs.tier from pets p
        join farm_visibility_settings fvs
          on fvs.farm_id = p.farm_id and fvs.field_group_key = p_field_group
        where p.id = p_pet_id),
      (select default_tier from field_groups where key = p_field_group)
    ),
    coalesce(
      (select include_previous_owner from pet_visibility_settings
        where pet_id = p_pet_id and field_group_key = p_field_group),
      (select fvs.include_previous_owner from pets p
        join farm_visibility_settings fvs
          on fvs.farm_id = p.farm_id and fvs.field_group_key = p_field_group
        where p.id = p_pet_id),
      false
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_pet_pedigree(p_pet_id bigint, p_max_gen integer DEFAULT 5)
 RETURNS TABLE(node_id bigint, child_id bigint, name text, image_url text, breed text, gender text, relation text, generation integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  )
  select lineage.id, lineage.child_id, lineage.name, lineage.image_url, lineage.breed, lineage.gender, lineage.relation, lineage.generation from lineage;
end;
$function$;

drop function if exists public.can_manage_pet_privacy(bigint, uuid);
drop function if exists public.can_manage_farm_privacy(bigint, uuid);
drop function if exists public.pet_visible_to(bigint, uuid);
drop function if exists public.is_pet_co_owner(bigint, uuid);
commit;
