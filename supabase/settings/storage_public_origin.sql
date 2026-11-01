-- Set this environment's Storage origin for create_business photos (platform_settings.storage_public_origin).
-- Run in ONE transaction after `set local whiskora.storage_origin = 'https://<this project ref>.supabase.co'`
-- (supabase/settings/set_storage_origin.cjs derives the ref from the database connection, so nothing is copied
-- between staging and production). Refuses if any stored business / workspace photo URL points at another Supabase
-- project — the guard against putting the staging value on production or the reverse.
do $$
declare
  v text := current_setting('whiskora.storage_origin', true);
  other bigint;
begin
  if v is null or v !~ '^https://[a-z0-9]{20}\.supabase\.co$' then
    raise exception 'whiskora.storage_origin must be https://<project ref>.supabase.co (got %)', coalesce(v, 'nothing');
  end if;
  select count(*) into other from (
    select image_url u from public.farms union all select cover_url from public.farms
    union all select image_url from public.shops union all select cover_url from public.shops
    union all select image_url from public.services union all select cover_url from public.services
    union all select avatar_url from public.workspaces) x
   where u ~ '^https://[a-z0-9]{20}\.supabase\.co/storage/' and left(u, length(v) + 1) <> v || '/';
  if other > 0 then
    raise exception '% stored photo URL(s) use another Supabase project than %; nothing was changed', other, v;
  end if;
  insert into public.platform_settings (key, value) values ('storage_public_origin', v)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;
