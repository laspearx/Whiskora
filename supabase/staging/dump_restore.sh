#!/usr/bin/env bash
# Copy the production SCHEMA (no data) into whiskora-staging.
#   dump    : production → $OUT/schema.sql   (same pg_dump flags + filters as `supabase db dump`, schema only)
#   restore : $OUT/schema.sql + platform_objects.sql → staging
#
# Credentials are read from files you create yourself (never passed as CLI args, never printed):
#   ~/.whiskora/prod_db_url      Session-pooler URI of production  (Dashboard → Connect → Session pooler)
#   ~/.whiskora/staging_db_url   Session-pooler URI of whiskora-staging
# Both files must be chmod 600 and live outside the repo.
set -euo pipefail
cd "$(dirname "$0")"
MODE=${1:?usage: dump_restore.sh dump|restore}
OUT=${OUT:-/tmp/whiskora-staging}
CLI=${SUPABASE_CLI:-supabase}
mkdir -p "$OUT"; chmod 700 "$OUT"

envfile_from() {   # $1 = url file → prints path of a 600 env-file with PG* vars
  local f="$1"; [ -f "$f" ] || { echo "missing $f" >&2; exit 1; }
  [ "$(stat -c %a "$f")" = "600" ] || { echo "$f must be chmod 600" >&2; exit 1; }
  local e; e=$(mktemp); chmod 600 "$e"
  python3 - "$f" "$e" <<'PY'
import sys, urllib.parse
u = urllib.parse.urlsplit(open(sys.argv[1]).read().strip())
assert u.scheme.startswith('postgres'), 'not a postgres URI'
q = dict(urllib.parse.parse_qsl(u.query))
with open(sys.argv[2], 'w') as o:
    o.write(f"PGHOST={u.hostname}\nPGPORT={u.port or 5432}\nPGUSER={urllib.parse.unquote(u.username)}\n")
    o.write(f"PGPASSWORD={urllib.parse.unquote(u.password or '')}\nPGDATABASE={u.path.lstrip('/') or 'postgres'}\n")
    o.write(f"PGSSLMODE={q.get('sslmode', 'require')}\n")
PY
  echo "$e"
}

case "$MODE" in
  dump)
    E=$(envfile_from ~/.whiskora/prod_db_url); trap 'rm -f "$E"' EXIT
    # Take the exact pipeline the CLI uses (dry run with a dummy URL), drop its PG* exports.
    "$CLI" db dump --dry-run --db-url "postgresql://u:x@127.0.0.1:5432/postgres" 2>/dev/null \
      | sed -n '/^#!/,$p' | sed '/^export PG/d' > "$OUT/dump.sh"
    grep -q -- '--schema-only' "$OUT/dump.sh" || { echo "unexpected dump script" >&2; exit 1; }
    grep -q -- '--data-only' "$OUT/dump.sh" && { echo "refusing: data dump" >&2; exit 1; }
    docker run --rm --env-file "$E" -v "$OUT:/w" postgres:17 bash /w/dump.sh > "$OUT/schema.sql"
    echo "schema dump: $(wc -l < "$OUT/schema.sql") lines → $OUT/schema.sql"
    echo "data statements (must be 0): $(grep -cE '^(COPY |INSERT INTO )' "$OUT/schema.sql" || true)"
    ;;
  restore)
    E=$(envfile_from ~/.whiskora/staging_db_url); trap 'rm -f "$E"' EXIT
    grep -q 'wpxcukrwmegwzfccbbga' <(python3 -c "import urllib.parse,sys;print(urllib.parse.urlsplit(open('$HOME/.whiskora/staging_db_url').read()).username)") \
      || { echo "refusing: staging_db_url is not whiskora-staging (wpxcukrwmegwzfccbbga)" >&2; exit 1; }
    cp platform_objects.sql "$OUT/"
    docker run --rm --env-file "$E" -v "$OUT:/w" postgres:17 \
      psql -v ON_ERROR_STOP=1 -q -1 -f /w/schema.sql -f /w/platform_objects.sql
    echo "restore finished"
    ;;
  *) echo "usage: dump_restore.sh dump|restore" >&2; exit 2 ;;
esac
