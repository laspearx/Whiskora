-- Staging only: synthetic shop 990201 "QA-BP E2E shop" (owner 01) with a full profile, its workspace and members
-- owner 01 / manager 02 / staff 03, for web/e2e/business-profile.spec.ts. Re-runnable (resets the profile).
-- Inserted as the database owner (system path). Photos uploaded by the spec stay in shop-assets/990201/ (tiny).
delete from public.workspaces where type = 'shop' and entity_id = 990201;
delete from public.shops where id = 990201;
insert into public.shops (id, user_id, shop_name, owner_name, phone, bio, province, lat, lng, supported_species, image_url, cover_url)
values (990201, 'a0000000-0000-4000-8000-000000000001', 'QA-BP E2E shop', 'QA Synthetic', '0800000000', 'fixture bio',
        'กรุงเทพมหานคร', 13.75, 100.5, 'dog,cat', null, null);
with w as (
  insert into public.workspaces (type, name, owner_id, entity_id)
  values ('shop', 'QA-BP E2E shop', 'a0000000-0000-4000-8000-000000000001', 990201) returning id
)
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, u, r from w, (values ('a0000000-0000-4000-8000-000000000001'::uuid, 'owner'), ('a0000000-0000-4000-8000-000000000002'::uuid, 'manager'),
                                  ('a0000000-0000-4000-8000-000000000003'::uuid, 'staff')) m(u, r);
