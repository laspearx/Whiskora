#!/usr/bin/env bash
# Local security tests: throwaway Postgres 17 + a SCHEMA-ONLY dump of staging (no data) + migrations + test files.
# Nothing here touches staging or production. The dump is made separately (read-only) and is NOT committed:
#   pg_dump "$STAGING_URL" --schema-only --schema=public --schema=storage --no-owner -f <dump>
# usage: supabase/tests/local/run.sh <schema dump> <migration.sql>... -- <test.sql>...
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; C=whiskora-sectest-$$
DUMP="$1"; shift; MIGS=(); TESTS=(); seen=0
for a in "$@"; do if [ "$a" = "--" ]; then seen=1; elif [ $seen = 0 ]; then MIGS+=("$a"); else TESTS+=("$a"); fi; done
docker run -d --name $C -e POSTGRES_PASSWORD=test postgres:17 >/dev/null; trap 'docker rm -f $C >/dev/null 2>&1' EXIT
until docker exec $C pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; sleep 1
docker exec -i $C psql -U postgres -q -v ON_ERROR_STOP=1 < "$D/bootstrap.sql" >/dev/null
docker exec -i $C psql -U postgres -q < "$DUMP" 2>&1 | grep ERROR | grep -v 'schema "public" already exists' && { echo "restore failed"; exit 2; } || true
for m in "${MIGS[@]}"; do docker exec -i $C psql -U postgres -q -v ON_ERROR_STOP=1 < "$m" >/dev/null && echo "applied $(basename "$m")"; done
{ echo "begin;"; cat "$D/harness.sql"; for t in "${TESTS[@]}"; do cat "$t"; done
  echo "select suite, name, expected, got, case when pass then 'PASS' else 'FAIL' end from results order by suite, name;"
  echo "select count(*) filter (where pass) passed, count(*) filter (where not pass) failed from results;"; echo "rollback;"; } \
  | docker exec -i $C psql -U postgres -v ON_ERROR_STOP=1 -P pager=off -q
