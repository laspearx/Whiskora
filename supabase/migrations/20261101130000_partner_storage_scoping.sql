-- Scope business image buckets to the business. Before: any signed-in user could upload / overwrite (and for shop /
-- service also delete) any object in farm-assets, shop-assets and service-assets; partner-photos only allowed
-- `<uid>/…` while the register pages upload `farms|shops|services/<uid>/…` (those uploads were refused).
--
-- Paths (checked on production, read-only): farm-assets `<farm id>/avatar_…|cover_…` (10 objects);
-- shop-assets / service-assets `<entity id>/…` written by the dashboards (0 objects); partner-photos
-- `farms/<uploader uid>/…` (6 objects). Existing objects are not moved or changed; public read stays as it is.
--
-- After:
--   farm-assets    INSERT / UPDATE: first folder = a farm the caller owns or manages (owner / manager member)
--   shop-assets    INSERT / UPDATE / DELETE: first folder = a shop the caller owns or manages
--   service-assets INSERT / UPDATE / DELETE: first folder = a service the caller owns or manages
--   partner-photos INSERT / UPDATE / DELETE: `<uid>/…` (as before) or `farms|shops|services/<uid>/…` (register pages)
-- "Manages" uses workspace membership (owner / manager), safe since 20261101120000 (workspace ownership guard).

create or replace function public.can_edit_business_assets(p_type text, p_folder text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and p_folder ~ '^[0-9]{1,18}$' and (
    case p_type
      when 'farm'    then exists (select 1 from public.farms    where id = p_folder::bigint and user_id = auth.uid()::text)
      when 'shop'    then exists (select 1 from public.shops    where id = p_folder::bigint and user_id = auth.uid()::text)
      when 'service' then exists (select 1 from public.services where id = p_folder::bigint and user_id = auth.uid()::text)
      else false end
    or exists (select 1 from public.workspaces w join public.workspace_members m on m.workspace_id = w.id
                where w.type = p_type and w.entity_id = p_folder::bigint and m.user_id = auth.uid()
                  and m.role in ('owner', 'manager')));
$$;
revoke all on function public.can_edit_business_assets(text, text) from public, anon;
grant execute on function public.can_edit_business_assets(text, text) to authenticated;

-- farm-assets (no DELETE policy before; none added)
drop policy if exists "auth upload farm assets" on storage.objects;
drop policy if exists "auth update farm assets" on storage.objects;
create policy "farm-assets upload by farm owner or manager" on storage.objects for insert to authenticated
  with check (bucket_id = 'farm-assets' and public.can_edit_business_assets('farm', (storage.foldername(name))[1]));
create policy "farm-assets update by farm owner or manager" on storage.objects for update to authenticated
  using (bucket_id = 'farm-assets' and public.can_edit_business_assets('farm', (storage.foldername(name))[1]))
  with check (bucket_id = 'farm-assets' and public.can_edit_business_assets('farm', (storage.foldername(name))[1]));

-- shop-assets
drop policy if exists "shop-assets auth upload" on storage.objects;
drop policy if exists "shop-assets auth update" on storage.objects;
drop policy if exists "shop-assets auth delete" on storage.objects;
create policy "shop-assets upload by shop owner or manager" on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-assets' and public.can_edit_business_assets('shop', (storage.foldername(name))[1]));
create policy "shop-assets update by shop owner or manager" on storage.objects for update to authenticated
  using (bucket_id = 'shop-assets' and public.can_edit_business_assets('shop', (storage.foldername(name))[1]))
  with check (bucket_id = 'shop-assets' and public.can_edit_business_assets('shop', (storage.foldername(name))[1]));
create policy "shop-assets delete by shop owner or manager" on storage.objects for delete to authenticated
  using (bucket_id = 'shop-assets' and public.can_edit_business_assets('shop', (storage.foldername(name))[1]));

-- service-assets
drop policy if exists "service-assets auth upload" on storage.objects;
drop policy if exists "service-assets auth update" on storage.objects;
drop policy if exists "service-assets auth delete" on storage.objects;
create policy "service-assets upload by service owner or manager" on storage.objects for insert to authenticated
  with check (bucket_id = 'service-assets' and public.can_edit_business_assets('service', (storage.foldername(name))[1]));
create policy "service-assets update by service owner or manager" on storage.objects for update to authenticated
  using (bucket_id = 'service-assets' and public.can_edit_business_assets('service', (storage.foldername(name))[1]))
  with check (bucket_id = 'service-assets' and public.can_edit_business_assets('service', (storage.foldername(name))[1]));
create policy "service-assets delete by service owner or manager" on storage.objects for delete to authenticated
  using (bucket_id = 'service-assets' and public.can_edit_business_assets('service', (storage.foldername(name))[1]));

-- partner-photos: own folder at the root (as before) or under the register pages' type folder
drop policy if exists "Auth upload partner-photos" on storage.objects;
drop policy if exists "Owner update partner-photos" on storage.objects;
drop policy if exists "Owner delete partner-photos" on storage.objects;
create policy "partner-photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-photos' and auth.uid() is not null and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] in ('farms', 'shops', 'services') and (storage.foldername(name))[2] = auth.uid()::text)));
create policy "partner-photos update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'partner-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] in ('farms', 'shops', 'services') and (storage.foldername(name))[2] = auth.uid()::text)))
  with check (bucket_id = 'partner-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] in ('farms', 'shops', 'services') and (storage.foldername(name))[2] = auth.uid()::text)));
create policy "partner-photos delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'partner-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] in ('farms', 'shops', 'services') and (storage.foldername(name))[2] = auth.uid()::text)));
