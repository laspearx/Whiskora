#!/usr/bin/env bash
# Classify the change between two commits (paths relative to the repo root). Prints one word:
#   app      — anything that can change the built web app (web/** except tests/docs — web/public and web/app always count,
#              even *.md — root package files, any unknown path)
#   release  — database / Edge Function source only (supabase/migrations, supabase/functions, supabase/config.toml)
#   none     — docs and tests only (*.md, docs/, supabase/tests|staging|snapshots|emergency, web/e2e, playwright config, .github)
# Used by .github/workflows/version-bump.yml (bump only when not "none") and web/scripts/vercel-ignore.sh.
# Fail-safe: if the range cannot be read, prints "app" (= build / bump as before).
# usage: build-scope.sh <base-sha> <head-sha>   (or: build-scope.sh --paths < list-of-paths)
set -u

classify() {
  local scope=none p
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    case "$p" in
      web/public/*|web/app/*) echo app; return 0 ;;                                         # served / compiled, even *.md
      *.md|docs/*|.github/*|.gitignore|CLAUDE.md) ;;                                       # docs / CI meta
      supabase/tests/*|supabase/staging/*|supabase/snapshots/*|supabase/emergency/*) ;;    # test + ops scripts
      web/e2e/*|web/playwright.config.ts|web/test-results/*) ;;                            # browser tests
      supabase/migrations/*|supabase/functions/*|supabase/config.toml)
        [ "$scope" = none ] && scope=release ;;
      *) echo app; return 0 ;;                                                               # web app, deps, config, unknown
    esac
  done
  echo "$scope"
}

if [ "${1:-}" = "--paths" ]; then classify; exit 0; fi

base="${1:-}"; head="${2:-HEAD}"
if [ -z "$base" ] || ! files=$(git diff --name-only "$base" "$head" 2>/dev/null); then
  echo app; exit 0
fi
printf '%s\n' "$files" | classify
