-- Local-only test helpers (throwaway container, synthetic rows). try(): run one statement as a role + uid and record
-- the SQLSTATE ('ok' when it succeeds). Assertions: wrap a check so it fails with 22012 (division by zero) when false:
--   select 1 / (case when <condition> then 1 else 0 end)
create temp table if not exists results (suite text, name text, expected text, got text, pass boolean);
create or replace function pg_temp.try(p_suite text, p_name text, p_role text, p_uid uuid, p_sql text, p_expect text default 'ok')
returns void language plpgsql as $$
declare got text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  perform set_config('request.jwt.claim.role', p_role, true);
  execute format('set local role %I', p_role);
  begin execute p_sql; got := 'ok'; exception when others then got := sqlstate; end;
  execute 'reset role';
  insert into results values (p_suite, p_name, p_expect, got, got = p_expect);
end $$;
