-- Phase 1 between deploys: expand migrations 110000 / 120000 / 140000 / 150000 applied, contracts 160000 / 170000 NOT.
-- Both the old app (main) and the new app must work here — this is the window in which the app is switched / can be
-- rolled back. Synthetic rows, rolled back. (Needs auth_stub_h2.sql for the H2 functions.)
insert into auth.users (id, email) values ('99000000-0000-4000-8000-000000000001', 'owner@stage.test'), ('99000000-0000-4000-8000-000000000002', 'stranger@stage.test');
insert into public.profiles (id, full_name, role) select id, email, 'user' from auth.users where email like '%@stage.test';
insert into public.farms (id, user_id, farm_name, house_no) values (999001, '99000000-0000-4000-8000-000000000001', 'Stage Farm', '1/1');
insert into public.pets (id, name, user_id, is_public, note) values (999101, 'Stage pet', '99000000-0000-4000-8000-000000000001', true, 'n');
-- old app
select pg_temp.try('STAGE', 'old app: anon select * from farms', 'anon', null, 'select * from public.farms where id = 999001');
select pg_temp.try('STAGE', 'old app: owner select * from farms (edit page)', 'authenticated', '99000000-0000-4000-8000-000000000001', 'select * from public.farms where id = 999001');
select pg_temp.try('STAGE', 'old app: anon reads pets.note (old PET_COLUMNS / public pet page)', 'anon', null, 'select note from public.pets where id = 999101');
select pg_temp.try('STAGE', 'old app: farm owner adds a farm pet', 'authenticated', '99000000-0000-4000-8000-000000000001',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''99000000-0000-4000-8000-000000000001'', 999001)');
-- new app
select pg_temp.try('STAGE', 'new app: owner reads private fields via get_farm_private', 'authenticated', '99000000-0000-4000-8000-000000000001',
  'select 1 / (case when (select house_no from public.get_farm_private(999001)) = ''1/1'' then 1 else 0 end)');
select pg_temp.try('STAGE', 'new app: anon public farm columns', 'anon', null, 'select id, farm_name, phone, line_id, sub_district, district, province from public.farms where id = 999001');
select pg_temp.try('STAGE', 'new app: LINE lookup + evidence callable by service_role', 'service_role', null,
  'select (select count(*) from public.find_auth_user_by_line_id(''Ux'')) + (select count(*) from public.legacy_line_evidence(''Ux''))');
-- protections already active in this window
select pg_temp.try('STAGE', 'M1 active: stranger cannot link a pet to the farm', 'authenticated', '99000000-0000-4000-8000-000000000002',
  'insert into public.pets (name, user_id, farm_id) values (''x'', ''99000000-0000-4000-8000-000000000002'', 999001)', '42501');
select pg_temp.try('STAGE', 'M7 active: stranger cannot upload into the pet folder', 'authenticated', '99000000-0000-4000-8000-000000000002',
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''999101/x.pdf'')', '42501');
