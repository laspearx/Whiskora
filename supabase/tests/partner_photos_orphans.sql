-- Read-only report: register-page photos in partner-photos that no business uses (left by a failed or abandoned
-- create, or replaced in the form before saving). Deletes nothing.
-- A file counts as used if ANY farm / shop / service (any owner) or workspace points at it, so files of existing
-- businesses and of other users are never listed as removable. Removal, if wanted, is a separate step by the owner of
-- the project, per file, older than the grace period, through the Storage API (not SQL).
with photos as (
  select o.name, o.owner_id, o.created_at, split_part(o.name, '/', 1) folder
    from storage.objects o
   where o.bucket_id = 'partner-photos' and split_part(o.name, '/', 1) in ('farms', 'shops', 'services')
), used as (
  select url from (
    select image_url url from public.farms union all select cover_url from public.farms
    union all select image_url from public.shops union all select cover_url from public.shops
    union all select image_url from public.services union all select cover_url from public.services
    union all select avatar_url from public.workspaces) u where url like '%/partner-photos/%'
)
select p.folder,
       count(*) total,
       count(*) filter (where not exists (select 1 from used where used.url like '%/partner-photos/' || p.name)) unused,
       count(*) filter (where not exists (select 1 from used where used.url like '%/partner-photos/' || p.name)
                          and p.created_at < now() - interval '7 days') unused_older_than_7_days,
       count(*) filter (where p.owner_id is distinct from split_part(p.name, '/', 2)) owner_differs_from_folder
  from photos p group by p.folder order by p.folder;
