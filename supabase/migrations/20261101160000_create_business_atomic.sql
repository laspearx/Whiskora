-- Create a farm / shop / service atomically (docs/PARTNER_SYSTEM_AUDIT.md §4–5, PR 2 "create partner atomically").
-- Before: the register pages ran three client-side writes (entity → workspace → owner row); a failure after the first
-- left a business without a workspace or owner row, and a double submit could create two businesses.
--
-- After (additive — nothing existing is changed or dropped):
--   * create_business(p_type, p_fields, p_request_key) inserts the entity, its workspace and the owner membership in
--     one transaction. Any error → nothing is written.
--   * Owner = auth.uid() only. user_id / owner_id / role / approval or publish state are never read from the client:
--     p_fields has an explicit allow-list per type and any other key is refused (22023).
--   * Images: only partner-photos objects that the caller uploaded under `<farms|shops|services>/<uid>/…`.
--   * Idempotency: (caller, p_request_key) is claimed in the same transaction. The same key + same data returns the
--     first result (replayed = true); the same key + other data is refused. Another user's key never matches.
--     Creating several businesses with different keys is allowed.
-- Kept as installed: workspaces_guard (API inserts / updates), workspace member RPCs, storage scoping, business
-- edit permissions (not changed here). Direct INSERT for the API is closed separately (20261101170000), after the
-- app that uses this RPC is live.

-- ── idempotency claims (no API access; read / written only by create_business) ───────────────────────────────
create table if not exists public.business_create_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  type text not null check (type in ('farm', 'shop', 'service')),
  fingerprint text not null,
  entity_id bigint,
  workspace_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, request_key)
);
alter table public.business_create_requests enable row level security;
revoke all on public.business_create_requests from public, anon, authenticated;
grant select, insert, update, delete on public.business_create_requests to service_role;

-- ── field validation (helpers: no API EXECUTE) ────────────────────────────────────────────────────────────────
-- trimmed text or null; refuses non-strings and values over p_max characters
create or replace function public.business_field_text(p_fields jsonb, p_key text, p_max int)
returns text language plpgsql immutable set search_path = public as $$
declare v jsonb := p_fields -> p_key; t text;
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  if jsonb_typeof(v) <> 'string' then
    raise exception 'field % must be text', p_key using errcode = '22023';
  end if;
  t := nullif(btrim(v #>> '{}'), '');
  if length(t) > p_max then
    raise exception 'field % is too long (max %)', p_key, p_max using errcode = '22023';
  end if;
  return t;
end $$;

create or replace function public.business_field_coord(p_fields jsonb, p_key text, p_limit numeric)
returns double precision language plpgsql immutable set search_path = public as $$
declare v jsonb := p_fields -> p_key;
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  if jsonb_typeof(v) <> 'number' or abs((v #>> '{}')::numeric) > p_limit then
    raise exception 'field % must be a number between -% and %', p_key, p_limit, p_limit using errcode = '22023';
  end if;
  return (v #>> '{}')::double precision;
end $$;

-- image URL → must be a partner-photos object the caller uploaded under <folder>/<uid>/ (never someone else's file)
create or replace function public.business_field_image(p_fields jsonb, p_key text, p_folder text, p_uid uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare t text := public.business_field_text(p_fields, p_key, 500); obj text;
begin
  if t is null then return null; end if;
  obj := substring(t from '^https://[A-Za-z0-9.-]+/storage/v1/object/public/partner-photos/(.+)$');
  if obj is null or obj !~ ('^' || p_folder || '/' || p_uid::text || '/[A-Za-z0-9._-]{1,120}$')
     or not exists (select 1 from storage.objects o where o.bucket_id = 'partner-photos' and o.name = obj
                     and o.owner_id = p_uid::text) then
    raise exception 'field % must be a photo you uploaded for this form', p_key using errcode = '22023';
  end if;
  return t;
end $$;

revoke all on function public.business_field_text(jsonb, text, int) from public, anon, authenticated;
revoke all on function public.business_field_coord(jsonb, text, numeric) from public, anon, authenticated;
revoke all on function public.business_field_image(jsonb, text, text, uuid) from public, anon, authenticated;

-- ── the RPC ───────────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.create_business(p_type text, p_fields jsonb, p_request_key uuid)
returns table (entity_id bigint, workspace_id uuid, replayed boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_name_key text;
  v_allowed text[];
  v_bad text;
  f jsonb := '{}'::jsonb;          -- normalized fields (what is stored; also the fingerprint input)
  v_species text;
  v_fp text;
  v_claimed boolean;
  v_prev public.business_create_requests%rowtype;
  v_entity bigint;
  v_ws uuid;
begin
  if v_uid is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  if p_type is null or p_type not in ('farm', 'shop', 'service') then
    raise exception 'type must be farm, shop or service' using errcode = '22023';
  end if;
  if p_request_key is null then
    raise exception 'request key is required' using errcode = '22023';
  end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    raise exception 'fields must be an object' using errcode = '22023';
  end if;

  v_name_key := p_type || '_name';
  v_allowed := array[v_name_key, 'owner_name', 'phone', 'bio', 'address', 'house_no', 'room_no', 'moo', 'soi', 'road',
                     'sub_district', 'district', 'province', 'postal_code', 'lat', 'lng', 'image_url', 'cover_url']
    || case p_type when 'farm' then array['species'] when 'shop' then array['supported_species']
                   else array['supported_species', 'category'] end;
  select k into v_bad from jsonb_object_keys(p_fields) k where k <> all (v_allowed) order by k limit 1;
  if v_bad is not null then
    raise exception 'field % is not allowed', v_bad using errcode = '22023';
  end if;

  f := jsonb_strip_nulls(jsonb_build_object(
    'name',         public.business_field_text(p_fields, v_name_key, 120),
    'owner_name',   public.business_field_text(p_fields, 'owner_name', 120),
    'phone',        public.business_field_text(p_fields, 'phone', 30),
    'bio',          public.business_field_text(p_fields, 'bio', 2000),
    'address',      public.business_field_text(p_fields, 'address', 500),
    'house_no',     public.business_field_text(p_fields, 'house_no', 100),
    'room_no',      public.business_field_text(p_fields, 'room_no', 100),
    'moo',          public.business_field_text(p_fields, 'moo', 100),
    'soi',          public.business_field_text(p_fields, 'soi', 200),
    'road',         public.business_field_text(p_fields, 'road', 200),
    'sub_district', public.business_field_text(p_fields, 'sub_district', 200),
    'district',     public.business_field_text(p_fields, 'district', 200),
    'province',     public.business_field_text(p_fields, 'province', 200),
    'postal_code',  public.business_field_text(p_fields, 'postal_code', 10),
    'lat',          public.business_field_coord(p_fields, 'lat', 90),
    'lng',          public.business_field_coord(p_fields, 'lng', 180),
    'image_url',    public.business_field_image(p_fields, 'image_url', p_type || 's', v_uid),
    'cover_url',    public.business_field_image(p_fields, 'cover_url', p_type || 's', v_uid)));

  if p_type = 'farm' then
    f := f || jsonb_strip_nulls(jsonb_build_object('species', public.business_field_text(p_fields, 'species', 60)));
  else
    -- species ids (lib/species.ts), stored comma-joined (the format the dashboards and public pages read)
    if p_fields ? 'supported_species' then
      if jsonb_typeof(p_fields -> 'supported_species') <> 'array'
         or jsonb_array_length(p_fields -> 'supported_species') > 20
         or exists (select 1 from jsonb_array_elements(p_fields -> 'supported_species') e
                     where jsonb_typeof(e) <> 'string' or (e #>> '{}') !~ '^[a-z_]{1,30}$') then
        raise exception 'field supported_species must be a list of species ids' using errcode = '22023';
      end if;
      select string_agg(s, ',' order by min_ord) into v_species
        from (select e s, min(o) min_ord from jsonb_array_elements_text(p_fields -> 'supported_species') with ordinality x(e, o) group by e) d;
      f := f || jsonb_strip_nulls(jsonb_build_object('supported_species', v_species));
    end if;
    if p_type = 'service' then
      f := f || jsonb_strip_nulls(jsonb_build_object('category', public.business_field_text(p_fields, 'category', 40)));
      if f ? 'category' and (f ->> 'category') !~ '^[a-z_]{1,40}$' then
        raise exception 'field category must be a category id' using errcode = '22023';
      end if;
    end if;
  end if;

  -- required (same as the register forms)
  select k into v_bad from unnest(array['name', 'owner_name', 'phone', 'province', 'lat', 'lng']
    || case p_type when 'farm' then array['species'] when 'shop' then array['supported_species']
                   else array['supported_species', 'category'] end) k
   where not f ? k limit 1;
  if v_bad is not null then
    raise exception 'field % is required', case v_bad when 'name' then v_name_key else v_bad end using errcode = '22023';
  end if;

  -- idempotency: claim (caller, key) in this transaction; a concurrent twin waits here and then sees the result
  v_fp := md5(p_type || ':' || f::text);
  insert into public.business_create_requests (user_id, request_key, type, fingerprint)
  values (v_uid, p_request_key, p_type, v_fp)
  on conflict (user_id, request_key) do nothing;
  get diagnostics v_claimed = row_count;
  if not v_claimed then
    select * into v_prev from public.business_create_requests r where r.user_id = v_uid and r.request_key = p_request_key;
    if v_prev.type is distinct from p_type or v_prev.fingerprint is distinct from v_fp then
      raise exception 'this request key was already used for other data' using errcode = 'P0001';
    end if;
    return query select v_prev.entity_id, v_prev.workspace_id, true;
    return;
  end if;

  if p_type = 'farm' then
    insert into public.farms (user_id, farm_name, owner_name, phone, bio, address, house_no, room_no, moo, soi, road,
                              sub_district, district, province, postal_code, lat, lng, image_url, cover_url, species)
    values (v_uid::text, f->>'name', f->>'owner_name', f->>'phone', f->>'bio', f->>'address', f->>'house_no',
            f->>'room_no', f->>'moo', f->>'soi', f->>'road', f->>'sub_district', f->>'district', f->>'province',
            f->>'postal_code', (f->>'lat')::double precision, (f->>'lng')::double precision, f->>'image_url',
            f->>'cover_url', f->>'species')
    returning id into v_entity;
  elsif p_type = 'shop' then
    insert into public.shops (user_id, shop_name, owner_name, phone, bio, address, house_no, room_no, moo, soi, road,
                              sub_district, district, province, postal_code, lat, lng, image_url, cover_url,
                              supported_species)
    values (v_uid::text, f->>'name', f->>'owner_name', f->>'phone', f->>'bio', f->>'address', f->>'house_no',
            f->>'room_no', f->>'moo', f->>'soi', f->>'road', f->>'sub_district', f->>'district', f->>'province',
            f->>'postal_code', (f->>'lat')::double precision, (f->>'lng')::double precision, f->>'image_url',
            f->>'cover_url', f->>'supported_species')
    returning id into v_entity;
  else
    insert into public.services (user_id, service_name, owner_name, phone, bio, address, house_no, room_no, moo, soi,
                                 road, sub_district, district, province, postal_code, lat, lng, image_url, cover_url,
                                 supported_species, category)
    values (v_uid::text, f->>'name', f->>'owner_name', f->>'phone', f->>'bio', f->>'address', f->>'house_no',
            f->>'room_no', f->>'moo', f->>'soi', f->>'road', f->>'sub_district', f->>'district', f->>'province',
            f->>'postal_code', (f->>'lat')::double precision, (f->>'lng')::double precision, f->>'image_url',
            f->>'cover_url', f->>'supported_species', f->>'category')
    returning id into v_entity;
  end if;
  -- verification / publish columns keep their table defaults (farms.is_verified false, services.is_published false)

  insert into public.workspaces (type, name, owner_id, entity_id, avatar_url)
  values (p_type, f->>'name', v_uid, v_entity, f->>'image_url')
  returning id into v_ws;

  insert into public.workspace_members (workspace_id, user_id, role) values (v_ws, v_uid, 'owner');

  update public.business_create_requests r set entity_id = v_entity, workspace_id = v_ws
   where r.user_id = v_uid and r.request_key = p_request_key;

  return query select v_entity, v_ws, false;
end $$;

revoke all on function public.create_business(text, jsonb, uuid) from public, anon;
grant execute on function public.create_business(text, jsonb, uuid) to authenticated;
