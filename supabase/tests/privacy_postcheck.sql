-- Post-apply check for 20261029100000_private_columns.sql, as anon / an unrelated user / the owner.
-- Runs inside a transaction that is rolled back; prints pass/fail and row COUNTS only, never values.
--   psql -X -v ON_ERROR_STOP=1 -v owner=<uuid of an internal account> -v stranger=<uuid of another account> \
--        -v pet=<id of a pet owned by :owner> -f supabase/tests/privacy_postcheck.sql
-- Expected after the migration: every row ok = t. Before it, the "denied" rows show f (the leak).
\set QUIET on
begin;
create temp table r (name text, ok boolean, detail text) on commit drop;
grant all on r to anon, authenticated;

create function pg_temp.try(q text) returns text language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || q || ') s' into n;
  return 'rows=' || n;
exception when insufficient_privilege then return 'denied';
          when undefined_function then return 'missing';
end $$;

create function pg_temp.try_write(q text) returns text language plpgsql as $$
declare n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return 'rows=' || n;
exception when insufficient_privilege then return 'denied';
end $$;

-- anon
set local role anon;
\o /dev/null
select set_config('request.jwt.claims', '{"role":"anon"}', true);
\o
insert into r select 'anon profiles.email denied', d = 'denied', d from pg_temp.try('select email from public.profiles') d;
insert into r select 'anon profiles.phone,address denied', d = 'denied', d from pg_temp.try('select phone, address from public.profiles') d;
insert into r select 'anon profiles public card readable', d like 'rows=%', d from pg_temp.try('select id, full_name, username, avatar_url from public.profiles') d;
insert into r select 'anon pets.allergies denied', d = 'denied', d from pg_temp.try('select allergies, blood_type from public.pets') d;
insert into r select 'anon pets public columns readable', d like 'rows=%', d from pg_temp.try('select id, name, status from public.pets') d;
insert into r select 'anon rpc get_my_profile denied', d = 'denied', d from pg_temp.try('select * from public.get_my_profile()') d;
insert into r select 'anon rpc find_user_by_email denied', d = 'denied', d from pg_temp.try($q$select * from public.find_user_by_email('x@example.com')$q$) d;
reset role;

-- unrelated signed-in user
set local role authenticated;
\o /dev/null
select set_config('request.jwt.claims', json_build_object('sub', :'stranger', 'role', 'authenticated')::text, true);
\o
insert into r select 'stranger profiles.email denied', d = 'denied', d from pg_temp.try('select email from public.profiles') d;
insert into r select 'stranger pets.allergies denied', d = 'denied', d from pg_temp.try('select allergies from public.pets') d;
insert into r select 'stranger get_my_profile = own row only', d = 'rows=1', d from pg_temp.try('select * from public.get_my_profile()') d;
insert into r select 'stranger cannot change role', d = 'denied', d
  from pg_temp.try_write(format($q$update public.profiles set role = 'admin' where id = %L$q$, :'stranger')) d;
reset role;

-- owner
set local role authenticated;
\o /dev/null
select set_config('request.jwt.claims', json_build_object('sub', :'owner', 'role', 'authenticated')::text, true);
\o
insert into r select 'owner get_my_profile = own row', d = 'rows=1', d from pg_temp.try('select * from public.get_my_profile()') d;
insert into r select 'owner get_my_profile returns own id', d = 'rows=1', d
  from pg_temp.try(format('select 1 from public.get_my_profile() where id = %L', :'owner')) d;
insert into r select 'owner can update own profile (name, no RETURNING *)', d = 'rows=1', d
  from pg_temp.try_write(format('update public.profiles set full_name = full_name where id = %L', :'owner')) d;
insert into r select 'owner get_pet_health on own pet', d like 'rows=%' and d <> 'rows=0', d
  from pg_temp.try(format('select * from public.get_pet_health(%s)', :'pet')) d;
insert into r select 'owner pets.allergies direct select still denied', d = 'denied', d from pg_temp.try('select allergies from public.pets') d;
reset role;

\set QUIET off
select name, ok, detail from r;
rollback;
