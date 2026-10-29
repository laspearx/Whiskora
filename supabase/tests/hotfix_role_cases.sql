-- Hotfix-only checks (run: stub_schema.sql → privacy_checks.sql → [hotfix] → this file)
\set O '''aaaaaaaa-0000-0000-0000-000000000001'''
\set X '''dddddddd-0000-0000-0000-000000000004'''
\set N '''ffffffff-0000-0000-0000-000000000006'''
select pg_temp.check(:ph,'user sets own role=admin (UPDATE)',  'authenticated', :X, $$update profiles set role='admin' where id = auth.uid()$$, :'exp_block');
select pg_temp.check(:ph,'user sets role via upsert',           'authenticated', :X, $$insert into profiles (id, role) values (auth.uid(), 'admin') on conflict (id) do update set role = excluded.role$$, :'exp_block');
select pg_temp.check(:ph,'new user inserts own row as admin',   'authenticated', :N, $$insert into profiles (id, role) values (auth.uid(), 'admin')$$, :'exp_block');
select pg_temp.check(:ph,'user sets role to null',              'authenticated', :X, $$update profiles set role=null where id = auth.uid()$$, :'exp_block');
select pg_temp.check(:ph,'anon sets any role',                  'anon', null, $$update profiles set role='admin'$$, 'rows=0');
-- must keep working
select pg_temp.check(:ph,'user edits profile fields',           'authenticated', :O, $$update profiles set full_name='Edited', phone='000-000-0010', updated_at=now() where id = auth.uid()$$, 'rows=1');
select pg_temp.check(:ph,'user upsert avatar (no role)',        'authenticated', :O, $$insert into profiles (id, avatar_url, updated_at) values (auth.uid(), 'u', now()) on conflict (id) do update set avatar_url = excluded.avatar_url, updated_at = excluded.updated_at$$, 'rows=1');
select pg_temp.check(:ph,'user update that keeps same role',    'authenticated', :O, $$update profiles set role = role, notif_line = false where id = auth.uid()$$, 'rows=1');
select pg_temp.check(:ph,'user inserts own row w/o role',       'authenticated', 'ffffffff-0000-0000-0000-000000000007', $$insert into profiles (id, full_name) values (auth.uid(), 'New')$$, 'rows=1');
select pg_temp.check(:ph,'new row got default role user',       'authenticated', 'ffffffff-0000-0000-0000-000000000007', $$select 1 from profiles where id = auth.uid() and role = 'user'$$, 'rows=1');
