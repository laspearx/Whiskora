#!/usr/bin/env bash
# Vercel "Ignored Build Step" (web/vercel.json → ignoreCommand). Exit 0 = skip this build, exit 1 = build.
# Runs in the project root directory (web/). Changes nothing else: env vars, staging / production separation and
# the build-time env guard (lib/deploy-env-guard.mjs) are untouched.
#
# Preview    : build when the branch changes the app (build-scope = app) since the branch's last successful deployment
#              (VERCEL_GIT_PREVIOUS_SHA), or since its merge base with main on the first push. Docs / tests / DB-only → skip.
# Production : build only the bot's "chore: bump version" commit — it carries the merged code and the final version
#              number. The merge commit before it is skipped (the bump follows). Docs-only pushes get no bump (see the
#              workflow) and no build.
# Always build: "[force build]" in the commit message, unknown VERCEL_ENV, or a range that cannot be read.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"
env="${VERCEL_ENV:-}"
head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
say() { echo "vercel-ignore: $*"; }

case "$msg" in *"[force build]"*) say "forced → build"; exit 1 ;; esac

base_for_branch() {
  local prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
  if [ -n "$prev" ]; then
    git cat-file -e "$prev^{commit}" 2>/dev/null || git fetch -q --depth=200 origin "$prev" 2>/dev/null || true
    if git cat-file -e "$prev^{commit}" 2>/dev/null; then echo "$prev"; return; fi
  fi
  # Vercel clones shallow: deepen this branch and fetch main so a merge base exists; none found → empty → build
  git fetch -q --deepen=200 2>/dev/null || true
  git fetch -q --depth=200 origin main 2>/dev/null || true
  git merge-base "$head" FETCH_HEAD 2>/dev/null || true
}

case "$env" in
  production)
    case "$msg" in
      "chore: bump version"*) say "production bump commit → build"; exit 1 ;;
    esac
    say "production non-bump commit → skip (bump commit follows when the app or DB changed; docs-only gets none)"
    exit 0 ;;
  preview)
    base="$(base_for_branch)"
    scope="$(bash "$here/build-scope.sh" "$base" "$head")"
    say "preview base=${base:-none} scope=$scope"
    if [ "$scope" = app ]; then exit 1; fi
    exit 0 ;;
  *)
    say "VERCEL_ENV=${env:-unset} → build"; exit 1 ;;
esac
