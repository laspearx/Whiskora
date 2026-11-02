-- H2 (20261102150000): find_auth_user_by_line_id — service_role only, app_metadata only. Rolled back.
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('b2000000-0000-4000-8000-000000000001', 'a@h2.test', '{"line_id":"Uaaa"}', '{}'),
  ('b2000000-0000-4000-8000-000000000002', 'b@h2.test', '{}', '{"line_id":"Ubbb"}'),          -- legacy user_metadata only
  ('b2000000-0000-4000-8000-000000000003', 'c@h2.test', '{"line_id":"Uccc"}', '{}'),
  ('b2000000-0000-4000-8000-000000000004', 'd@h2.test', '{"line_id":"Uccc"}', '{}');          -- duplicate claim
select pg_temp.try('H2', 'anon cannot call the lookup', 'anon', null, 'select public.find_auth_user_by_line_id(''Uaaa'')', '42501');
select pg_temp.try('H2', 'signed-in user cannot call the lookup', 'authenticated', 'b2000000-0000-4000-8000-000000000001', 'select public.find_auth_user_by_line_id(''Uaaa'')', '42501');
select pg_temp.try('H2', 'service_role finds by app_metadata', 'service_role', null,
  'select 1 / (case when (select array_agg(x) from public.find_auth_user_by_line_id(''Uaaa'') x) = array[''b2000000-0000-4000-8000-000000000001''::uuid] then 1 else 0 end)');
select pg_temp.try('H2', 'user_metadata.line_id is ignored', 'service_role', null,
  'select 1 / (case when (select count(*) from public.find_auth_user_by_line_id(''Ubbb'')) = 0 then 1 else 0 end)');
select pg_temp.try('H2', 'duplicate claim returns both (caller treats as conflict)', 'service_role', null,
  'select 1 / (case when (select count(*) from public.find_auth_user_by_line_id(''Uccc'')) = 2 then 1 else 0 end)');
select pg_temp.try('H2', 'null / oversized input returns nothing', 'service_role', null,
  'select 1 / (case when (select count(*) from public.find_auth_user_by_line_id(null)) + (select count(*) from public.find_auth_user_by_line_id(repeat(''U'', 200))) = 0 then 1 else 0 end)');
