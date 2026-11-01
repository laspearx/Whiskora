#!/usr/bin/env bash
# Checks for build-scope.sh / vercel-ignore.sh (run from anywhere inside the repo; needs the history of main).
# usage: bash web/scripts/test-build-scope.sh
set -u
cd "$(git rev-parse --show-toplevel)"
S=web/scripts/build-scope.sh; I=web/scripts/vercel-ignore.sh
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "PASS $1 → $3"; else fail=$((fail+1)); echo "FAIL $1 → got $3, want $2"; fi; }
paths() { printf '%s\n' "$@" | bash $S --paths; }

# ── path rules ──
check "docs only"                     none    "$(paths docs/STATUS.md WHISKORA_PLATFORM_OVERVIEW.md README.md)"
check "tests only"                    none    "$(paths supabase/tests/x.sql web/e2e/signed-in.spec.ts web/playwright.config.ts web/e2e/README.md)"
check "workflow only"                 none    "$(paths .github/workflows/version-bump.yml)"
check "migration"                     release "$(paths supabase/migrations/1_x.sql docs/a.md)"
check "edge function"                 release "$(paths supabase/functions/send-push-notifications/index.ts)"
check "app page"                      app     "$(paths docs/a.md web/app/page.tsx)"
check "markdown served from public"   app     "$(paths web/public/home/README.md)"
check "public image"                  app     "$(paths web/public/icons/icon-shop.png)"
check "dependency (lockfile)"         app     "$(paths web/package-lock.json)"
check "dependency (package.json)"     app     "$(paths web/package.json)"
check "next config"                   app     "$(paths web/next.config.ts)"
check "vercel config"                 app     "$(paths web/vercel.json)"
check "middleware"                    app     "$(paths web/middleware.ts)"
check "env guard"                     app     "$(paths web/lib/deploy-env-guard.mjs)"
check "messages"                      app     "$(paths web/messages/th.json)"
check "ignore script itself"          app     "$(paths web/scripts/vercel-ignore.sh)"
check "root package.json"             app     "$(paths package.json)"
check "unknown new top-level path"    app     "$(paths tools/x.js)"
check "release + app → app"           app     "$(paths supabase/migrations/1.sql web/lib/x.ts)"
check "empty list"                    none    "$(printf '' | bash $S --paths)"

# ── real history (fail-safe if missing) ──
r() { bash $S "$1" "$2"; }
check "docs commit 2b63a6c (PR #21 rollout record)"     none    "$(r 2b63a6c^ 2b63a6c)"
check "PR #22 (DB + docs) 0dd85af..e9a88e2"             release "$(r 0dd85af e9a88e2)"
check "PR #23 (web) e9a88e2..a6888c4"                   app     "$(r e9a88e2 a6888c4)"
check "a6888c4 (docs + e2e only)"                       none    "$(r d945345 a6888c4)"
check "bot bump 6ea86c2"                                app     "$(r 91e8474 6ea86c2)"
check "unreadable range → fail-safe"                    app     "$(r 0000000000000000000000000000000000000000 HEAD)"
check "missing base → fail-safe"                        app     "$(r '' HEAD)"

# ── vercel-ignore decisions (exit 0 = skip, 1 = build) ──
ig() { env -i PATH="$PATH" HOME="$HOME" "$@" bash $I >/dev/null 2>&1; [ $? -eq 0 ] && echo skip || echo build; }
check "prod: merge commit of PR #23"            skip  "$(ig VERCEL_ENV=production VERCEL_GIT_COMMIT_SHA=686590d VERCEL_GIT_COMMIT_MESSAGE='Merge pull request #23 from laspearx/feat/workspace-members-rpc')"
check "prod: bot bump after it"                 build "$(ig VERCEL_ENV=production VERCEL_GIT_COMMIT_SHA=efcc57d VERCEL_GIT_COMMIT_MESSAGE='chore: bump version to v1.12.0 (minor)')"
check "prod: docs merge (PR #24 style)"         skip  "$(ig VERCEL_ENV=production VERCEL_GIT_COMMIT_SHA=HEAD VERCEL_GIT_COMMIT_MESSAGE='Merge pull request #24 from laspearx/docs/members-rollout-v1.12.0')"
check "prod: forced"                            build "$(ig VERCEL_ENV=production VERCEL_GIT_COMMIT_SHA=HEAD VERCEL_GIT_COMMIT_MESSAGE='fix: hotfix [force build]')"
check "preview: web change since last deploy"   build "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=d945345 VERCEL_GIT_PREVIOUS_SHA=e9a88e2 VERCEL_GIT_COMMIT_MESSAGE=x)"
check "preview: docs+e2e since last deploy"     skip  "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=a6888c4 VERCEL_GIT_PREVIOUS_SHA=d945345 VERCEL_GIT_COMMIT_MESSAGE=x)"
check "preview: DB-only branch"                 skip  "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=e9a88e2 VERCEL_GIT_PREVIOUS_SHA=0dd85af VERCEL_GIT_COMMIT_MESSAGE=x)"
check "preview: code + later docs in one push"  build "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=a6888c4 VERCEL_GIT_PREVIOUS_SHA=e9a88e2 VERCEL_GIT_COMMIT_MESSAGE=x)"
# first push of a branch (no / unknown previous deployment) → compared with its merge base on main. Uses this branch
# (changes web/scripts → app) and, when present, the docs-only rollout-record branch; set TEST_DOCS_REF to override.
check "preview: bad previous sha, app branch"   build "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD) VERCEL_GIT_PREVIOUS_SHA=deadbeefdeadbeefdeadbeefdeadbeefdeadbeef VERCEL_GIT_COMMIT_MESSAGE=x)"
DOCS_REF="${TEST_DOCS_REF:-origin/docs/members-rollout-v1.12.0}"
if git rev-parse -q --verify "$DOCS_REF" >/dev/null; then
  check "preview: first push, docs-only branch" skip "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=$(git rev-parse $DOCS_REF) VERCEL_GIT_COMMIT_MESSAGE=x)"
fi
check "preview: forced"                         build "$(ig VERCEL_ENV=preview VERCEL_GIT_COMMIT_SHA=a6888c4 VERCEL_GIT_PREVIOUS_SHA=d945345 VERCEL_GIT_COMMIT_MESSAGE='docs [force build]')"
check "unknown env"                             build "$(ig VERCEL_ENV=development VERCEL_GIT_COMMIT_SHA=HEAD VERCEL_GIT_COMMIT_MESSAGE=x)"
check "no env at all"                           build "$(ig VERCEL_GIT_COMMIT_SHA=HEAD)"

echo; echo "$pass passed, $fail failed"; [ $fail -eq 0 ]
