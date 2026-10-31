-- Read-only gate for 20261101130000_partner_storage_scoping.sql. Counts only; never move / delete objects to pass.
with o as (select bucket_id b, name, (storage.foldername(name))[1] f1, (storage.foldername(name))[2] f2 from storage.objects
            where bucket_id in ('farm-assets', 'shop-assets', 'service-assets', 'partner-photos'))
select 1 as n, 'state' as check, case when to_regprocedure('public.can_edit_business_assets(text,text)') is null then 'before' else 'after' end as result
union all
select 2, 'objects per bucket', coalesce((select string_agg(b || '=' || c, ' ' order by b) from (select b, count(*) c from o group by b) x), 'none')
union all
select 3, 'farm-assets objects whose first folder is not an existing farm id (would only be editable by nobody — still readable)',
  case when c = 0 then 'ok' else 'WARN: ' || c end from (select count(*) c from o where b = 'farm-assets' and (f1 !~ '^[0-9]+$' or not exists (select 1 from farms where id = f1::bigint))) x
union all
select 4, 'shop / service asset objects outside an existing entity folder',
  case when c = 0 then 'ok' else 'WARN: ' || c end from (select count(*) c from o where (b = 'shop-assets' and (f1 !~ '^[0-9]+$' or not exists (select 1 from shops where id = f1::bigint)))
                                                                   or (b = 'service-assets' and (f1 !~ '^[0-9]+$' or not exists (select 1 from services where id = f1::bigint)))) x
union all
select 5, 'partner-photos objects outside <uid>/… or farms|shops|services/<uid>/…',
  case when c = 0 then 'ok' else 'WARN: ' || c end from (select count(*) c from o where b = 'partner-photos'
    and not (f1 ~ '^[0-9a-f-]{36}$' or (f1 in ('farms', 'shops', 'services') and f2 ~ '^[0-9a-f-]{36}$'))) x
union all
select 6, 'policies this migration replaces exist (before) / new ones exist (after)',
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in
    ('auth upload farm assets', 'auth update farm assets', 'shop-assets auth upload', 'shop-assets auth update', 'shop-assets auth delete',
     'service-assets auth upload', 'service-assets auth update', 'service-assets auth delete',
     'Auth upload partner-photos', 'Owner update partner-photos', 'Owner delete partner-photos'))::text || ' old / ' ||
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and (policyname like '%by farm owner or manager' or policyname like '%by shop owner or manager'
     or policyname like '%by service owner or manager' or policyname like 'partner-photos % own folder'))::text || ' new'
union all
select 7, 'public read policies kept (farm / shop / service assets, partner-photos)',
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd = 'SELECT'
     and policyname in ('public read farm assets', 'shop-assets public read', 'service-assets public read', 'Public read partner-photos'))::text || ' / 4'
order by 1;
