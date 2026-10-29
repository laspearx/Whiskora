#!/usr/bin/env bash
# Tests ONLY the role hotfix on postgres:17 (production major version) with the production-like stub.
set -euo pipefail
cd "$(dirname "$0")"
C=whiskora-pghotfix
docker rm -f $C >/dev/null 2>&1 || true
docker run -d --name $C -e POSTGRES_PASSWORD=test postgres:17 >/dev/null
until docker exec $C pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; sleep 1
psql() { docker exec -i $C psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
cat stub_schema.sql | psql >/dev/null
{
  cat privacy_checks.sql
  echo "\\set ph '''before'''"; echo "\\set exp_block ok"; cat hotfix_role_cases.sql
  echo "update profiles set role='user'; delete from profiles where id::text like 'ffffffff%';"
  cat ../migrations/20261029050000_hotfix_profile_role_guard.sql
  echo "\\set ph '''after'''"; echo "\\set exp_block denied"; cat hotfix_role_cases.sql
  # definer path + admin path still able to set role
  echo "create function public.t_definer_insert() returns void language sql security definer as \$\$ insert into profiles (id, full_name) values ('ffffffff-0000-0000-0000-000000000008','Signup') \$\$;"
  echo "grant execute on function public.t_definer_insert() to authenticated;"
  echo "select pg_temp.check('after','signup via SECURITY DEFINER (like handle_new_user)','authenticated','dddddddd-0000-0000-0000-000000000004','select t_definer_insert()','rows=1');"
  echo "set role postgres; update profiles set role='admin' where id='ffffffff-0000-0000-0000-000000000008'; reset role;"
  echo "insert into results select 'after','postgres/dashboard can still change role','rows=1','rows='||count(*), count(*)=1 from profiles where id='ffffffff-0000-0000-0000-000000000008' and role='admin';"
  echo "select phase, name, expected, got, case when pass then 'PASS' else 'FAIL' end from results order by phase desc, name;"
  echo "select phase, count(*) filter (where pass) passed, count(*) filter (where not pass) failed from results group by 1 order by 1 desc;"
} | psql -P pager=off
docker rm -f $C >/dev/null
