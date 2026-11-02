-- H2 (20261102150000): find_auth_user_by_line_id + legacy_line_evidence. Synthetic users only; rolled back.
-- Needs auth_stub_h2.sql before the migration (local only).
insert into auth.users (id, email, encrypted_password, email_change, created_at, raw_app_meta_data, raw_user_meta_data) values
  -- V: server-made LINE signup (placeholder, no password, original email identity)
  ('b2000000-0000-4000-8000-0000000000a1', 'line_Uvictim@line.whiskora.internal', '', '', '2026-10-01 00:00:00+00', '{}', '{"line_id":"Uvictim"}'),
  -- F1: attacker real-email account forging the victim's LINE id in user_metadata
  ('b2000000-0000-4000-8000-0000000000b1', 'attacker@h2.test', 'hash', '', '2026-10-02 00:00:00+00', '{}', '{"line_id":"Uvictim"}'),
  -- F2: forged id nobody else holds
  ('b2000000-0000-4000-8000-0000000000b2', 'other@h2.test', 'hash', '', '2026-10-02 00:00:00+00', '{}', '{"line_id":"Ufree"}'),
  -- P: someone signed up WITH a placeholder-looking email and a password
  ('b2000000-0000-4000-8000-0000000000c1', 'line_Upw@line.whiskora.internal', 'hash', '', '2026-10-03 00:00:00+00', '{}', '{"line_id":"Upw"}'),
  -- E: placeholder reached by an email change (email identity not created with the account)
  ('b2000000-0000-4000-8000-0000000000c2', 'line_Uchanged@line.whiskora.internal', '', '', '2026-09-01 00:00:00+00', '{}', '{"line_id":"Uchanged"}'),
  -- M: placeholder but user_metadata says another id
  ('b2000000-0000-4000-8000-0000000000c3', 'line_Umeta@line.whiskora.internal', '', '', '2026-10-04 00:00:00+00', '{}', '{"line_id":"Uother"}'),
  -- A: already migrated (app_metadata) and consistent
  ('b2000000-0000-4000-8000-0000000000d1', 'line_Uok@line.whiskora.internal', '', '', '2026-10-05 00:00:00+00', '{"line_id":"Uok"}', '{"line_id":"Uok"}'),
  -- C1 / C2: two trusted holders of the same id (app_metadata on a real-email account + a server-made placeholder)
  ('b2000000-0000-4000-8000-0000000000e1', 'linked@h2.test', 'hash', '', '2026-10-06 00:00:00+00', '{"line_id":"Udup"}', '{}'),
  ('b2000000-0000-4000-8000-0000000000e2', 'line_Udup@line.whiskora.internal', '', '', '2026-10-06 00:00:00+00', '{}', '{"line_id":"Udup"}'),
  -- X: app_metadata differs from its own placeholder
  ('b2000000-0000-4000-8000-0000000000f1', 'line_Ux1@line.whiskora.internal', '', '', '2026-10-07 00:00:00+00', '{"line_id":"Ux2"}', '{}');
insert into auth.identities (user_id, provider, identity_data, created_at)
select id, 'email', jsonb_build_object('email', email), created_at + interval '1 second' from auth.users where email like '%h2.test' or email like 'line\_%';
update auth.identities set created_at = '2026-10-20 00:00:00+00' where user_id = 'b2000000-0000-4000-8000-0000000000c2'; -- email changed later

create or replace function pg_temp.cls(p uuid) returns text language sql as $$ select class || ':' || reason from public.legacy_line_evidence() where user_id = p $$;
create or replace function pg_temp.is(p uuid, want text) returns text language sql as $$
  select 'select 1 / (case when pg_temp.cls(''' || p || ''') like ''' || want || '%'' then 1 else 0 end)' $$;

select pg_temp.try('H2', 'V server-made LINE signup → verified', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000a1', 'verified'));
select pg_temp.try('H2', 'F1 forged user_metadata claim on a real-email account → unverified', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000b1', 'unverified:claim only in user_metadata'));
select pg_temp.try('H2', 'F1 forged claim does NOT turn the victim into a conflict (no lock-out)', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000a1', 'verified:server-made'));
select pg_temp.try('H2', 'F2 forged claim on an id nobody holds → unverified', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000b2', 'unverified'));
select pg_temp.try('H2', 'P placeholder email with a password → unverified', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000c1', 'unverified:placeholder email with a password'));
select pg_temp.try('H2', 'E placeholder reached by an email change → unverified', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000c2', 'unverified:email identity not original'));
select pg_temp.try('H2', 'M placeholder vs user_metadata mismatch → unverified', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000c3', 'unverified'));
select pg_temp.try('H2', 'A app_metadata set and consistent → already', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000d1', 'already'));
select pg_temp.try('H2', 'C1 two trusted holders → conflict (app_metadata side)', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000e1', 'conflict'));
select pg_temp.try('H2', 'C2 two trusted holders → conflict (placeholder side)', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000e2', 'conflict'));
select pg_temp.try('H2', 'X app_metadata differs from its placeholder → conflict', 'postgres', null, pg_temp.is('b2000000-0000-4000-8000-0000000000f1', 'conflict'));
select pg_temp.try('H2', 'filter by id returns only rows for that id (victim + forger)', 'postgres', null,
  'select 1 / (case when (select count(*) from public.legacy_line_evidence(''Uvictim'')) = 2 then 1 else 0 end)');
-- lookup
select pg_temp.try('H2', 'lookup: app_metadata only (forged user_metadata ignored)', 'service_role', null,
  'select 1 / (case when (select count(*) from public.find_auth_user_by_line_id(''Ufree'')) = 0 and (select count(*) from public.find_auth_user_by_line_id(''Uok'')) = 1 then 1 else 0 end)');
select pg_temp.try('H2', 'lookup: null / oversized input returns nothing', 'service_role', null,
  'select 1 / (case when (select count(*) from public.find_auth_user_by_line_id(null)) + (select count(*) from public.find_auth_user_by_line_id(repeat(''U'', 200))) = 0 then 1 else 0 end)');
-- privileges
select pg_temp.try('H2', 'anon cannot call the lookup', 'anon', null, 'select public.find_auth_user_by_line_id(''Uok'')', '42501');
select pg_temp.try('H2', 'signed-in user cannot call the lookup', 'authenticated', 'b2000000-0000-4000-8000-0000000000a1', 'select public.find_auth_user_by_line_id(''Uok'')', '42501');
select pg_temp.try('H2', 'signed-in user cannot read the evidence report', 'authenticated', 'b2000000-0000-4000-8000-0000000000a1', 'select * from public.legacy_line_evidence()', '42501');
select pg_temp.try('H2', 'service_role can read the evidence report', 'service_role', null, 'select * from public.legacy_line_evidence()');
