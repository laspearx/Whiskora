-- STATUS: proposed — security branch, not applied anywhere. Staging first, production only on the owner's go-ahead
-- (docs/SECURITY_PHASE1.md §H1). Deploy the app of this branch BEFORE this migration (the old app selects farms.*).
--
-- H1: the exact location of a farm (usually the breeder's home) and the admin's verification note were readable by
-- anyone through the API (policies "Public can read / view farms" USING true + table-level SELECT for anon /
-- authenticated). After this migration anon / authenticated can SELECT only the public columns; the owner, workspace
-- members of that farm and admins read the private ones through get_farm_private(). RLS policies, INSERT / UPDATE /
-- DELETE rights (INSERT / DELETE none, UPDATE only verification_status) and the data are unchanged.
-- Private: address (composed full address incl. house no.), house_no, room_no, moo, soi, road, postal_code, lat, lng,
--          verification_note.
-- Public : everything else — incl. phone, line_id, facebook_link (contact the owner chose to show) and the area
--          (sub_district, district, province) used by farm-hub / the public farm page.
-- shops / services are NOT changed here (storefront addresses are meant to be public; owner decision pending).
do $$
declare missing text;
begin
  select string_agg(c, ',') into missing from unnest(array['id','created_at','user_id','farm_name','species','phone','bio','image_url',
    'facebook_link','line_id','is_verified','verified_at','cover_url','updated_at','verification_status','owner_name','sub_district',
    'district','province','address','house_no','room_no','moo','soi','road','postal_code','lat','lng','verification_note']) c
   where not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'farms' and column_name = c);
  if missing is not null then raise exception 'STOP: farms columns missing: %', missing; end if;
  -- any column not classified here would silently become private — refuse instead
  select string_agg(column_name, ',') into missing from information_schema.columns
   where table_schema = 'public' and table_name = 'farms' and column_name not in ('id','created_at','user_id','farm_name','species',
    'phone','bio','image_url','facebook_link','line_id','is_verified','verified_at','cover_url','updated_at','verification_status',
    'owner_name','sub_district','district','province','address','house_no','room_no','moo','soi','road','postal_code','lat','lng',
    'verification_note');
  if missing is not null then raise exception 'STOP: unclassified farms columns: % — classify them first', missing; end if;
end $$;

revoke select on public.farms from anon, authenticated;
grant select (id, created_at, user_id, farm_name, species, phone, bio, image_url, facebook_link, line_id, is_verified, verified_at,
              cover_url, updated_at, verification_status, owner_name, sub_district, district, province)
  on public.farms to anon, authenticated;

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

do $$
declare c text;
begin
  foreach c in array array['address','house_no','room_no','moo','soi','road','postal_code','lat','lng','verification_note'] loop
    if has_column_privilege('anon', 'public.farms', c, 'SELECT') or has_column_privilege('authenticated', 'public.farms', c, 'SELECT')
       or has_column_privilege('public', 'public.farms', c, 'SELECT') then
      raise exception 'STOP: farms.% still readable through the API — report, do not re-grant', c;
    end if;
  end loop;
  if not has_column_privilege('anon', 'public.farms', 'farm_name', 'SELECT') then raise exception 'STOP: public columns not granted'; end if;
end $$;
