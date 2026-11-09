-- M1 (20261102120000): pets / litters can be linked only to a farm the caller manages. Synthetic rows, rolled back.
insert into auth.users (id, email) values
  ('a1000000-0000-4000-8000-000000000001', 'owner@m1.test'), ('a1000000-0000-4000-8000-000000000002', 'manager@m1.test'),
  ('a1000000-0000-4000-8000-000000000003', 'staff@m1.test'), ('a1000000-0000-4000-8000-000000000004', 'viewer@m1.test'),
  ('a1000000-0000-4000-8000-000000000005', 'stranger@m1.test'), ('a1000000-0000-4000-8000-000000000006', 'admin@m1.test'),
  ('a1000000-0000-4000-8000-000000000007', 'owner2@m1.test');
insert into public.profiles (id, full_name, role) select id, email, case when email like 'admin%' then 'admin' else 'user' end from auth.users where email like '%@m1.test';
insert into public.farms (id, user_id, farm_name) values (992001, 'a1000000-0000-4000-8000-000000000001', 'M1 Farm'), (992002, 'a1000000-0000-4000-8000-000000000007', 'M1 Other Farm');
insert into public.workspaces (id, type, name, owner_id, entity_id) values ('a1000000-0000-4000-8000-0000000000f1', 'farm', 'M1 Farm', 'a1000000-0000-4000-8000-000000000001', 992001);
insert into public.workspace_members (workspace_id, user_id, role) values
  ('a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-000000000001', 'owner'),
  ('a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-000000000002', 'manager'),
  ('a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-000000000003', 'staff'),
  ('a1000000-0000-4000-8000-0000000000f1', 'a1000000-0000-4000-8000-000000000004', 'viewer');
-- a stranger's own pet (no farm) to try moving later
insert into public.pets (id, name, user_id) values (992101, 'M1 stranger pet', 'a1000000-0000-4000-8000-000000000005');
insert into public.pets (id, name, user_id, farm_id) values (992102, 'M1 farm pet', 'a1000000-0000-4000-8000-000000000001', 992001);

-- INSERT pets with farm_id
select pg_temp.try('M1', 'stranger cannot create a pet on someone else''s farm', 'authenticated', 'a1000000-0000-4000-8000-000000000005',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000005'', 992001)', '42501');
select pg_temp.try('M1', 'viewer cannot create a farm pet', 'authenticated', 'a1000000-0000-4000-8000-000000000004',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000004'', 992001)', '42501');
select pg_temp.try('M1', 'owner creates a farm pet', 'authenticated', 'a1000000-0000-4000-8000-000000000001',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000001'', 992001)');
select pg_temp.try('M1', 'manager creates a farm pet (dashboard create page)', 'authenticated', 'a1000000-0000-4000-8000-000000000002',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000002'', 992001)');
select pg_temp.try('M1', 'staff creates a farm pet', 'authenticated', 'a1000000-0000-4000-8000-000000000003',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000003'', 992001)');
select pg_temp.try('M1', 'admin may link', 'authenticated', 'a1000000-0000-4000-8000-000000000006',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000006'', 992001)');
select pg_temp.try('M1', 'owner of farm A cannot create on farm B', 'authenticated', 'a1000000-0000-4000-8000-000000000001',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''a1000000-0000-4000-8000-000000000001'', 992002)', '42501');
select pg_temp.try('M1', 'personal pet without farm still ok', 'authenticated', 'a1000000-0000-4000-8000-000000000005',
  'insert into public.pets (name, user_id) values (''x'', ''a1000000-0000-4000-8000-000000000005'')');
-- UPDATE pets.farm_id
select pg_temp.try('M1', 'stranger cannot move own pet onto someone else''s farm', 'authenticated', 'a1000000-0000-4000-8000-000000000005',
  'update public.pets set farm_id = 992001 where id = 992101', '42501');
select pg_temp.try('M1', 'owner updates other fields with farm_id unchanged', 'authenticated', 'a1000000-0000-4000-8000-000000000001',
  'update public.pets set name = ''renamed'', farm_id = 992001 where id = 992102 returning id');
select pg_temp.try('M1', 'owner unlinks the pet (farm_id → null)', 'authenticated', 'a1000000-0000-4000-8000-000000000001',
  'update public.pets set farm_id = null where id = 992102');
select pg_temp.try('M1', 'owner cannot move pet to another owner''s farm', 'authenticated', 'a1000000-0000-4000-8000-000000000001',
  'update public.pets set farm_id = 992002 where id = 992102', '42501');
-- litters (farm_id is text)
select pg_temp.try('M1', 'stranger cannot create a litter on someone else''s farm', 'authenticated', 'a1000000-0000-4000-8000-000000000005',
  'insert into public.litters (litter_code, mating_date, expected_birth_date, user_id, farm_id) values (''M1-L'', ''2026-01-01'', ''2026-03-01'', ''a1000000-0000-4000-8000-000000000005'', ''992001'')', '42501');
select pg_temp.try('M1', 'staff creates a litter on own farm', 'authenticated', 'a1000000-0000-4000-8000-000000000003',
  'insert into public.litters (litter_code, mating_date, expected_birth_date, user_id, farm_id) values (''M1-L'', ''2026-01-01'', ''2026-03-01'', ''a1000000-0000-4000-8000-000000000003'', ''992001'')');
select pg_temp.try('M1', 'garbage litter farm_id → 22023', 'authenticated', 'a1000000-0000-4000-8000-000000000003',
  'insert into public.litters (litter_code, mating_date, expected_birth_date, user_id, farm_id) values (''M1-L'', ''2026-01-01'', ''2026-03-01'', ''a1000000-0000-4000-8000-000000000003'', ''abc'')', '22023');
-- system path unaffected
select pg_temp.try('M1', 'database owner (system / definer path) can still link', 'postgres', null,
  'update public.pets set farm_id = 992002 where id = 992101');
-- helper takes no arbitrary viewer
select pg_temp.try('M1', 'anon cannot call caller_can_link_farm', 'anon', null, 'select public.caller_can_link_farm(992001)', '42501');
