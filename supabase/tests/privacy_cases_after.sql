-- Only meaningful after 20261029100000_private_columns.sql
\set O '''aaaaaaaa-0000-0000-0000-000000000001'''
\set X '''dddddddd-0000-0000-0000-000000000004'''
select pg_temp.check('after','own profile via get_my_profile',   'authenticated', :O, 'select email, phone from get_my_profile()', 'rows=1');
select pg_temp.check('after','get_my_profile returns only self', 'authenticated', :X, 'select * from get_my_profile() where id <> auth.uid()', 'rows=0');
select pg_temp.check('after','anon get_my_profile',              'anon', null, 'select * from get_my_profile()', 'denied');
select pg_temp.check('after','exact email lookup',               'authenticated', :X, $$select * from find_user_by_email('buyer@example.test')$$, 'rows=1');
select pg_temp.check('after','lookup is case/space tolerant',    'authenticated', :X, $$select * from find_user_by_email('  BUYER@example.test ')$$, 'rows=1');
select pg_temp.check('after','lookup does not return email col', 'authenticated', :X, $$select email from find_user_by_email('buyer@example.test')$$, 'error:42703 column "email" does not exist');
select pg_temp.check('after','email prefix lookup',              'authenticated', :X, $$select * from find_user_by_email('buyer@')$$, 'rows=0');
select pg_temp.check('after','email wildcard lookup',            'authenticated', :X, $$select * from find_user_by_email('%@example.test')$$, 'rows=0');
select pg_temp.check('after','anon email lookup',                'anon', null, $$select * from find_user_by_email('buyer@example.test')$$, 'denied');
select pg_temp.check('after','invite search by email prefix',    'authenticated', :X, $$select * from search_users_for_invite('owner@exa')$$, 'rows=0');
select pg_temp.check('after','invite search by domain',          'authenticated', :X, $$select * from search_users_for_invite('example.test')$$, 'rows=0');
select pg_temp.check('after','invite search by exact email',     'authenticated', :X, $$select * from search_users_for_invite('owner@example.test')$$, 'rows=1');
select pg_temp.check('after','invite search 1 char',             'authenticated', :X, $$select * from search_users_for_invite('t')$$, 'rows=0');
select pg_temp.check('after','invite search capped at 5',        'authenticated', :X, $$select * from search_users_for_invite('Test')$$, 'rows=5');
select pg_temp.check('after','owner updates own phone',          'authenticated', :O, $$update profiles set phone='000-000-0009' where id = auth.uid()$$, 'rows=1');
select pg_temp.check('after','upsert private cols fails',        'authenticated', :O, $$insert into profiles (id, phone) values (auth.uid(), 'x') on conflict (id) do update set phone = excluded.phone$$, 'denied');
select pg_temp.check('after','stranger cannot update others',    'authenticated', :X, $$update profiles set phone='x' where id <> auth.uid()$$, 'rows=0');
select pg_temp.check('after','pet insert returning id',          'authenticated', :O, $$insert into pets (name, user_id, allergies) values ('t2', auth.uid(), 'none') returning id$$, 'rows=1');
select pg_temp.check('after','pet insert returning * fails',     'authenticated', :O, $$insert into pets (name, user_id) values ('t4', auth.uid()) returning *$$, 'denied');
select pg_temp.check('after','pet insert (no returning)',        'authenticated', :O, $$insert into pets (name, user_id, allergies) values ('t3', auth.uid(), 'none')$$, 'rows=1');
select pg_temp.check('after','pet update health cols',           'authenticated', :O, $$update pets set allergies='dust' where id = 1$$, 'rows=1');
