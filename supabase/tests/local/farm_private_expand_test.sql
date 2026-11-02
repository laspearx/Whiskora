-- H1 after the EXPAND step only (20261102110000): the old app's reads still work, the new app's RPC works.
-- (fixture copied from farm_private_location_test.sql)
-- H1 after BOTH steps (20261102110000 expand + 20261102110100 contract): exact farm location + verification note not readable through the API; owner / team / admin read
-- them via get_farm_private(). Synthetic rows only (local container, rolled back).
insert into auth.users (id, email) values
  ('f1000000-0000-4000-8000-000000000001', 'owner@h1.test'), ('f1000000-0000-4000-8000-000000000002', 'staff@h1.test'),
  ('f1000000-0000-4000-8000-000000000003', 'stranger@h1.test'), ('f1000000-0000-4000-8000-000000000004', 'admin@h1.test');
insert into public.profiles (id, full_name, role) values
  ('f1000000-0000-4000-8000-000000000001', 'H1 Owner', 'user'), ('f1000000-0000-4000-8000-000000000002', 'H1 Staff', 'user'),
  ('f1000000-0000-4000-8000-000000000003', 'H1 Stranger', 'user'), ('f1000000-0000-4000-8000-000000000004', 'H1 Admin', 'admin');
insert into public.farms (id, user_id, farm_name, phone, address, house_no, moo, road, sub_district, district, province, postal_code, lat, lng, verification_note)
values (991001, 'f1000000-0000-4000-8000-000000000001', 'H1 Farm', '0800000000', '9/9 หมู่ 9 ถนนทดสอบ', '9/9', '9', 'ถนนทดสอบ', 'ตำบลทดสอบ', 'อำเภอทดสอบ', 'กรุงเทพมหานคร', '10000', 13.7563, 100.5018, 'note from admin');
insert into public.workspaces (id, type, name, owner_id, entity_id) values ('f1000000-0000-4000-8000-0000000000f1', 'farm', 'H1 Farm', 'f1000000-0000-4000-8000-000000000001', 991001);
insert into public.workspace_members (workspace_id, user_id, role) values
  ('f1000000-0000-4000-8000-0000000000f1', 'f1000000-0000-4000-8000-000000000001', 'owner'),
  ('f1000000-0000-4000-8000-0000000000f1', 'f1000000-0000-4000-8000-000000000002', 'staff');

insert into public.farm_verifications (id, farm_id, user_id, status) values (991001, 991001, 'f1000000-0000-4000-8000-000000000001', 'pending'); -- the #29 guard needs a pending request


select pg_temp.try('H1x', 'old app: anon select * still works (nothing revoked yet)', 'anon', null, 'select * from public.farms where id = 991001');
select pg_temp.try('H1x', 'old app: owner select * on the edit page still works', 'authenticated', 'f1000000-0000-4000-8000-000000000001', 'select * from public.farms where id = 991001');
select pg_temp.try('H1x', 'new app: public columns select works', 'anon', null,
  'select id, created_at, user_id, farm_name, species, phone, bio, image_url, facebook_link, line_id, is_verified, verified_at, cover_url, updated_at, verification_status, owner_name, sub_district, district, province from public.farms where id = 991001');
select pg_temp.try('H1x', 'new app: owner reads private fields via RPC', 'authenticated', 'f1000000-0000-4000-8000-000000000001',
  'select 1 / (case when (select house_no from public.get_farm_private(991001)) = ''9/9'' then 1 else 0 end)');
select pg_temp.try('H1x', 'RPC refuses a stranger already in the expand step', 'authenticated', 'f1000000-0000-4000-8000-000000000003', 'select * from public.get_farm_private(991001)', '42501');
select pg_temp.try('H1x', 'RPC not callable by anon', 'anon', null, 'select * from public.get_farm_private(991001)', '42501');
