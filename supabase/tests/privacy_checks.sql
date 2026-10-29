-- Privilege checks run as anon / specific synthetic users. Works on the local stub
-- (stub_schema.sql) and is written so the same calls can be repeated on real staging
-- with staging test-user UUIDs substituted.
-- Each check: (name, role, user uuid or null, sql, expected) where expected is
--   'ok' (runs), 'denied' (permission error), 'rows=N' (exact row count).
\set ON_ERROR_STOP on
create temp table if not exists results (phase text, name text, expected text, got text, pass boolean);

create or replace function pg_temp.check(p_phase text, p_name text, p_role text, p_uid uuid, p_sql text, p_expect text)
returns void language plpgsql as $$
declare n int; got text;
begin
  begin
    perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
    execute format('set local role %I', p_role);
    if p_sql ~* '^\s*(select|with)' then
      execute format('select count(*) from (%s) q', p_sql) into n;
    else
      execute p_sql; get diagnostics n = row_count;   -- insert / update / upsert
    end if;
    got := 'rows=' || n;
    reset role;
  exception when insufficient_privilege then
    reset role; got := 'denied';
  when others then
    reset role; got := 'error:' || sqlstate || ' ' || left(sqlerrm, 60);
  end;
  insert into results values (p_phase, p_name, p_expect, got,
    case when p_expect = 'ok' then got like 'rows=%'
         -- error text is truncated to 60 chars: compare as prefix in either direction
         when p_expect like 'error:%' then got like p_expect || '%' or p_expect like got || '%'
         else got = p_expect end);
end $$;
