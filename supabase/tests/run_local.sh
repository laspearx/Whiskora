#!/usr/bin/env bash
# Runs the synthetic privilege tests in a throwaway Postgres container (no real data).
# Usage: supabase/tests/run_local.sh   (needs Docker)
set -euo pipefail
cd "$(dirname "$0")"
C=whiskora-pgtest
docker rm -f $C >/dev/null 2>&1 || true
docker run -d --name $C -e POSTGRES_PASSWORD=test postgres:15 >/dev/null
until docker exec $C pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; sleep 1
psql() { docker exec -i $C psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
cat stub_schema.sql | psql >/dev/null
{
  cat privacy_checks.sql
  echo "\\set phase before"; echo "\\set exp_private ok"; echo "\\set exp_private_or_zero ok"; cat privacy_cases.sql
  echo "update profiles set role = 'user';  -- undo the before-phase self-escalation"
  cat ../migrations/20261029100000_private_columns.sql
  echo "\\set phase after"; echo "\\set exp_private denied"; echo "\\set exp_private_or_zero denied"; cat privacy_cases.sql
  cat privacy_cases_after.sql
  [ -f reservation_cases.sql ] && { cat ../migrations/20261030120000_reservation_transfer_pipeline.sql; cat reservation_cases.sql; }
  echo "select phase, name, expected, got, case when pass then 'PASS' else 'FAIL' end as result from results order by phase desc, name;"
  echo "select phase, count(*) filter (where pass) as passed, count(*) filter (where not pass) as failed from results group by phase order by phase desc;"
} | psql -P pager=off
docker rm -f $C >/dev/null
