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

-- private columns: refused for everyone through the API
select pg_temp.try('H1', 'anon cannot read house_no', 'anon', null, 'select house_no from public.farms where id = 991001', '42501');
select pg_temp.try('H1', 'anon cannot read address', 'anon', null, 'select address from public.farms where id = 991001', '42501');
select pg_temp.try('H1', 'anon cannot read lat / lng', 'anon', null, 'select lat, lng from public.farms where id = 991001', '42501');
select pg_temp.try('H1', 'anon cannot read verification_note', 'anon', null, 'select verification_note from public.farms', '42501');
select pg_temp.try('H1', 'anon select * refused (app must list columns)', 'anon', null, 'select * from public.farms', '42501');
select pg_temp.try('H1', 'stranger cannot read postal_code', 'authenticated', 'f1000000-0000-4000-8000-000000000003', 'select postal_code from public.farms where id = 991001', '42501');
select pg_temp.try('H1', 'owner cannot read house_no directly either (RPC only)', 'authenticated', 'f1000000-0000-4000-8000-000000000001', 'select house_no from public.farms where id = 991001', '42501');
-- public columns unchanged
select pg_temp.try('H1', 'anon reads public columns (name, phone, line_id, area)', 'anon', null,
  'select 1 / (case when (select count(*) from (select id, farm_name, phone, line_id, facebook_link, sub_district, district, province, is_verified from public.farms where id = 991001) x) = 1 then 1 else 0 end)');
-- RPC
select pg_temp.try('H1', 'anon cannot call get_farm_private', 'anon', null, 'select * from public.get_farm_private(991001)', '42501');
select pg_temp.try('H1', 'stranger get_farm_private refused', 'authenticated', 'f1000000-0000-4000-8000-000000000003', 'select * from public.get_farm_private(991001)', '42501');
select pg_temp.try('H1', 'owner get_farm_private returns the private fields', 'authenticated', 'f1000000-0000-4000-8000-000000000001',
  'select 1 / (case when (select house_no = ''9/9'' and postal_code = ''10000'' and lat = 13.7563 and verification_note = ''note from admin'' from public.get_farm_private(991001)) then 1 else 0 end)');
select pg_temp.try('H1', 'workspace staff get_farm_private ok', 'authenticated', 'f1000000-0000-4000-8000-000000000002', 'select * from public.get_farm_private(991001)');
select pg_temp.try('H1', 'admin get_farm_private ok', 'authenticated', 'f1000000-0000-4000-8000-000000000004', 'select * from public.get_farm_private(991001)');
select pg_temp.try('H1', 'unknown farm → P0002', 'authenticated', 'f1000000-0000-4000-8000-000000000001', 'select * from public.get_farm_private(1)', 'P0002');
-- writes that the app still does
select pg_temp.try('H1', 'owner verify-page update + RETURNING id still works', 'authenticated', 'f1000000-0000-4000-8000-000000000001',
  'update public.farms set verification_status = ''pending'' where id = 991001 returning id');
select pg_temp.try('H1', 'update RETURNING a private column is refused', 'authenticated', 'f1000000-0000-4000-8000-000000000001',
  'update public.farms set verification_status = ''pending'' where id = 991001 returning house_no', '42501');
select pg_temp.try('H1', 'owner update_business_profile still saves the address (definer)', 'authenticated', 'f1000000-0000-4000-8000-000000000001',
  'select 1 / (case when (public.update_business_profile(''farm'', 991001, ''{"house_no":"10/1"}''::jsonb) ->> ''house_no'') = ''10/1'' then 1 else 0 end)');
