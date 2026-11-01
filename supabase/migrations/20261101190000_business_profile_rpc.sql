-- Edit a business profile by role (docs/PARTNER_CREATE_BUSINESS.md §6, approved 2026-11-01). Step 1 — additive.
-- update_business_profile(p_type, p_id, p_fields) updates only the keys sent (partial update), after checking the
-- caller's role on the server:
--   owner   (entity owner, farms|shops|services.user_id): name, owner name, phone, bio, address + pin, logo / cover,
--           species (farm) / supported_species (shop, service) / category (service)
--   manager (workspace member): bio, phone, logo / cover, species / supported_species / category
--   staff / viewer / anyone else: nothing (42501)
-- Never accepted: user_id, owner / role, id, created_at, updated_at, is_verified, verified_at, verification_status,
-- verification_note, is_published, facebook_link, line_id, any unknown key (22023). A key allowed for the owner but
-- not for the caller's role → 42501. Publish (services.is_published) and the verify request (farms.verification_status
-- → pending) keep their existing paths; this RPC cannot change them.
-- Photos: unchanged value → kept as is (existing URLs are never re-validated or rewritten). A new value must be on this
-- environment's Storage origin (platform_settings, see 20261101160000) and be an existing object either in
-- <type>-assets/<entity id>/… (dashboard uploads; optional cache-busting `?t=<digits>` kept) or in
-- partner-photos/<type>s/<caller uid>/… uploaded by the caller (register-page uploads); null clears the photo.
-- Returns the saved profile (the app reloads from it). Renames / logo changes are mirrored to the workspace.

create or replace function public.business_profile_image(p_type text, p_id bigint, p_uid uuid, p_key text, p_new text, p_current text)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  v_origin text := (select value from public.platform_settings where key = 'storage_public_origin');
  v_prefix text; rest text; q text; bucket text; obj text;
begin
  if p_new is null then return null; end if;
  if p_new is not distinct from p_current then return p_current; end if;
  if length(p_new) > 600 then
    raise exception 'field % is too long', p_key using errcode = '22023';
  end if;
  if v_origin is null then
    raise exception 'photos cannot be saved yet (storage origin not configured)' using errcode = '22023';
  end if;
  v_prefix := v_origin || '/storage/v1/object/public/';
  if left(p_new, length(v_prefix)) <> v_prefix then
    raise exception 'field % must be a photo uploaded for this business', p_key using errcode = '22023';
  end if;
  rest := substr(p_new, length(v_prefix) + 1);
  if position('?' in rest) > 0 then
    q := substr(rest, position('?' in rest) + 1);
    rest := left(rest, position('?' in rest) - 1);
    if q !~ '^t=[0-9]{1,16}$' then
      raise exception 'field % must be a photo uploaded for this business', p_key using errcode = '22023';
    end if;
  end if;
  bucket := split_part(rest, '/', 1);
  obj := substr(rest, length(bucket) + 2);
  if not (
       (bucket = p_type || '-assets' and obj ~ ('^' || p_id::text || '/[A-Za-z0-9._-]{1,120}$')
        and exists (select 1 from storage.objects o where o.bucket_id = bucket and o.name = obj))
    or (bucket = 'partner-photos' and obj ~ ('^' || p_type || 's/' || p_uid::text || '/[A-Za-z0-9._-]{1,120}$')
        and exists (select 1 from storage.objects o where o.bucket_id = bucket and o.name = obj and o.owner_id = p_uid::text))) then
    raise exception 'field % must be a photo uploaded for this business', p_key using errcode = '22023';
  end if;
  return v_prefix || bucket || '/' || obj || coalesce('?' || q, '');
end $$;
revoke all on function public.business_profile_image(text, bigint, uuid, text, text, text) from public, anon, authenticated;

create or replace function public.update_business_profile(p_type text, p_id bigint, p_fields jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_name_key text;
  v_owner text;
  v_cur jsonb;
  v_ws uuid;
  v_role text;
  v_extra text[];
  v_owner_keys text[];
  v_manager_keys text[];
  v_bad text;
  f jsonb := '{}'::jsonb;
  v_species text;
  k text;
begin
  if v_uid is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if p_type is null or p_type not in ('farm', 'shop', 'service') then
    raise exception 'type must be farm, shop or service' using errcode = '22023';
  end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    raise exception 'fields must be an object' using errcode = '22023';
  end if;

  -- lock the entity, read its owner and current values
  if p_type = 'farm' then
    select user_id, to_jsonb(e) into v_owner, v_cur from public.farms e where e.id = p_id for update;
  elsif p_type = 'shop' then
    select user_id, to_jsonb(e) into v_owner, v_cur from public.shops e where e.id = p_id for update;
  else
    select user_id, to_jsonb(e) into v_owner, v_cur from public.services e where e.id = p_id for update;
  end if;
  if v_cur is null then raise exception 'business not found' using errcode = 'PT404'; end if;

  if v_owner = v_uid::text then
    v_role := 'owner';
  else
    select w.id into v_ws from public.workspaces w where w.type = p_type and w.entity_id = p_id;
    v_role := case when v_ws is null then null else public.workspace_role_of(v_ws, v_uid) end;
  end if;
  if v_role is null or v_role not in ('owner', 'manager') then
    raise exception 'only the owner or a manager can edit this business' using errcode = '42501';
  end if;

  v_name_key := p_type || '_name';
  v_extra := case p_type when 'farm' then array['species'] when 'shop' then array['supported_species']
                         else array['supported_species', 'category'] end;
  v_manager_keys := array['bio', 'phone', 'image_url', 'cover_url'] || v_extra;
  v_owner_keys := v_manager_keys || array[v_name_key, 'owner_name', 'address', 'house_no', 'room_no', 'moo', 'soi',
                                          'road', 'sub_district', 'district', 'province', 'postal_code', 'lat', 'lng'];
  select x into v_bad from jsonb_object_keys(p_fields) x where x <> all (v_owner_keys) order by x limit 1;
  if v_bad is not null then
    raise exception 'field % is not allowed', v_bad using errcode = '22023';
  end if;
  if v_role = 'manager' then
    select x into v_bad from jsonb_object_keys(p_fields) x where x <> all (v_manager_keys) order by x limit 1;
    if v_bad is not null then
      raise exception 'a manager cannot change %', v_bad using errcode = '42501';
    end if;
  end if;

  -- normalize the keys that were sent (same limits as create_business)
  for k in select jsonb_object_keys(p_fields) loop
    if k in ('lat', 'lng') then
      f := f || jsonb_build_object(k, public.business_field_coord(p_fields, k, case k when 'lat' then 90 else 180 end));
    elsif k in ('image_url', 'cover_url') then
      if jsonb_typeof(p_fields -> k) not in ('string', 'null') then
        raise exception 'field % must be text', k using errcode = '22023';
      end if;
      f := f || jsonb_build_object(k, public.business_profile_image(p_type, p_id, v_uid, k, p_fields ->> k, v_cur ->> k));
    elsif k = 'supported_species' then
      if jsonb_typeof(p_fields -> k) <> 'array' or jsonb_array_length(p_fields -> k) > 20
         or exists (select 1 from jsonb_array_elements(p_fields -> k) e where jsonb_typeof(e) <> 'string' or (e #>> '{}') !~ '^[a-z_]{1,30}$') then
        raise exception 'field supported_species must be a list of species ids' using errcode = '22023';
      end if;
      select string_agg(s, ',' order by o) into v_species
        from (select e s, min(o) o from jsonb_array_elements_text(p_fields -> k) with ordinality x(e, o) group by e) d;
      if v_species is null then raise exception 'field supported_species is required' using errcode = '22023'; end if;
      f := f || jsonb_build_object(k, v_species);
    else
      f := f || jsonb_build_object(k, public.business_field_text(p_fields, k,
             case k when v_name_key then 120 when 'owner_name' then 120 when 'phone' then 30 when 'bio' then 2000
                    when 'address' then 500 when 'postal_code' then 10 when 'species' then 60 when 'category' then 40
                    when 'house_no' then 100 when 'room_no' then 100 when 'moo' then 100 else 200 end));
    end if;
  end loop;
  -- fields the forms require must stay filled
  select x into v_bad from unnest(array[v_name_key, 'owner_name', 'phone', 'province', 'species', 'category']) x
   where f ? x and jsonb_typeof(f -> x) = 'null' limit 1;
  if v_bad is not null then raise exception 'field % is required', v_bad using errcode = '22023'; end if;
  if f ? 'category' and (f ->> 'category') !~ '^[a-z_]{1,40}$' then
    raise exception 'field category must be a category id' using errcode = '22023';
  end if;

  if p_type = 'farm' then
    update public.farms e set
      farm_name = case when f ? 'farm_name' then f ->> 'farm_name' else farm_name end,
      owner_name = case when f ? 'owner_name' then f ->> 'owner_name' else owner_name end,
      phone = case when f ? 'phone' then f ->> 'phone' else phone end,
      bio = case when f ? 'bio' then f ->> 'bio' else bio end,
      species = case when f ? 'species' then f ->> 'species' else species end,
      address = case when f ? 'address' then f ->> 'address' else address end,
      house_no = case when f ? 'house_no' then f ->> 'house_no' else house_no end,
      room_no = case when f ? 'room_no' then f ->> 'room_no' else room_no end,
      moo = case when f ? 'moo' then f ->> 'moo' else moo end,
      soi = case when f ? 'soi' then f ->> 'soi' else soi end,
      road = case when f ? 'road' then f ->> 'road' else road end,
      sub_district = case when f ? 'sub_district' then f ->> 'sub_district' else sub_district end,
      district = case when f ? 'district' then f ->> 'district' else district end,
      province = case when f ? 'province' then f ->> 'province' else province end,
      postal_code = case when f ? 'postal_code' then f ->> 'postal_code' else postal_code end,
      lat = case when f ? 'lat' then (f ->> 'lat')::double precision else lat end,
      lng = case when f ? 'lng' then (f ->> 'lng')::double precision else lng end,
      image_url = case when f ? 'image_url' then f ->> 'image_url' else image_url end,
      cover_url = case when f ? 'cover_url' then f ->> 'cover_url' else cover_url end,
      updated_at = now()
    where e.id = p_id;
  elsif p_type = 'shop' then
    update public.shops e set
      shop_name = case when f ? 'shop_name' then f ->> 'shop_name' else shop_name end,
      owner_name = case when f ? 'owner_name' then f ->> 'owner_name' else owner_name end,
      phone = case when f ? 'phone' then f ->> 'phone' else phone end,
      bio = case when f ? 'bio' then f ->> 'bio' else bio end,
      supported_species = case when f ? 'supported_species' then f ->> 'supported_species' else supported_species end,
      address = case when f ? 'address' then f ->> 'address' else address end,
      house_no = case when f ? 'house_no' then f ->> 'house_no' else house_no end,
      room_no = case when f ? 'room_no' then f ->> 'room_no' else room_no end,
      moo = case when f ? 'moo' then f ->> 'moo' else moo end,
      soi = case when f ? 'soi' then f ->> 'soi' else soi end,
      road = case when f ? 'road' then f ->> 'road' else road end,
      sub_district = case when f ? 'sub_district' then f ->> 'sub_district' else sub_district end,
      district = case when f ? 'district' then f ->> 'district' else district end,
      province = case when f ? 'province' then f ->> 'province' else province end,
      postal_code = case when f ? 'postal_code' then f ->> 'postal_code' else postal_code end,
      lat = case when f ? 'lat' then (f ->> 'lat')::double precision else lat end,
      lng = case when f ? 'lng' then (f ->> 'lng')::double precision else lng end,
      image_url = case when f ? 'image_url' then f ->> 'image_url' else image_url end,
      cover_url = case when f ? 'cover_url' then f ->> 'cover_url' else cover_url end
    where e.id = p_id;
  else
    update public.services e set
      service_name = case when f ? 'service_name' then f ->> 'service_name' else service_name end,
      owner_name = case when f ? 'owner_name' then f ->> 'owner_name' else owner_name end,
      phone = case when f ? 'phone' then f ->> 'phone' else phone end,
      bio = case when f ? 'bio' then f ->> 'bio' else bio end,
      supported_species = case when f ? 'supported_species' then f ->> 'supported_species' else supported_species end,
      category = case when f ? 'category' then f ->> 'category' else category end,
      address = case when f ? 'address' then f ->> 'address' else address end,
      house_no = case when f ? 'house_no' then f ->> 'house_no' else house_no end,
      room_no = case when f ? 'room_no' then f ->> 'room_no' else room_no end,
      moo = case when f ? 'moo' then f ->> 'moo' else moo end,
      soi = case when f ? 'soi' then f ->> 'soi' else soi end,
      road = case when f ? 'road' then f ->> 'road' else road end,
      sub_district = case when f ? 'sub_district' then f ->> 'sub_district' else sub_district end,
      district = case when f ? 'district' then f ->> 'district' else district end,
      province = case when f ? 'province' then f ->> 'province' else province end,
      postal_code = case when f ? 'postal_code' then f ->> 'postal_code' else postal_code end,
      lat = case when f ? 'lat' then (f ->> 'lat')::double precision else lat end,
      lng = case when f ? 'lng' then (f ->> 'lng')::double precision else lng end,
      image_url = case when f ? 'image_url' then f ->> 'image_url' else image_url end,
      cover_url = case when f ? 'cover_url' then f ->> 'cover_url' else cover_url end
    where e.id = p_id;
  end if;

  -- keep the business workspace's name / avatar in step (as create_business sets them)
  if f ? v_name_key or f ? 'image_url' then
    update public.workspaces w set
      name = case when f ? v_name_key then f ->> v_name_key else name end,
      avatar_url = case when f ? 'image_url' then f ->> 'image_url' else avatar_url end,
      updated_at = now()
    where w.type = p_type and w.entity_id = p_id;
  end if;

  if p_type = 'farm' then
    select to_jsonb(e) into v_cur from public.farms e where e.id = p_id;
  elsif p_type = 'shop' then
    select to_jsonb(e) into v_cur from public.shops e where e.id = p_id;
  else
    select to_jsonb(e) into v_cur from public.services e where e.id = p_id;
  end if;
  return jsonb_build_object('role', v_role) || (select jsonb_object_agg(x, v_cur -> x) from unnest(v_owner_keys || array['id']) x);
end $$;

revoke all on function public.update_business_profile(text, bigint, jsonb) from public, anon;
grant execute on function public.update_business_profile(text, bigint, jsonb) to authenticated;
