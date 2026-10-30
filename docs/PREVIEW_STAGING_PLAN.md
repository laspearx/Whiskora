# Plan — Vercel Preview → staging Supabase (DRAFT for owner review, nothing changed yet)

Status 2026-10-30: **not started.** No Vercel setting, env var, domain or deploy has been changed.

## Why
Every Preview build (any pushed branch / PR) currently runs against **production** Supabase: the Preview env either has
production values or falls back to the tracked `web/.env.production` (production URL + publishable key). Server routes
(LINE login, notify) also read server-only secrets, so a Preview with production `SUPABASE_SERVICE_ROLE_KEY` /
LINE / Resend secrets can write to production users and send real messages from unreviewed code.

## What the app reads (from `web/`)
| Variable | Used in | Preview value (target) |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, auth callback, LINE routes, `lib/notify.ts` (build-time inlined in client JS) | `https://wpxcukrwmegwzfccbbga.supabase.co` (staging) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same (inlined) | staging publishable key (`sb_publishable_…` of staging; the legacy anon JWT also works) |
| `NEXT_PUBLIC_SITE_URL` | `auth/callback` (fallback = request origin), `api/auth/line` (fallback = `https://www.whiskora.pet`) | **unset** on Preview, so callbacks stay on the preview host — or a fixed staging alias if one is created |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/auth/line`, `api/auth/line/callback`, `lib/notify.ts` | staging service-role key **or unset** |
| `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` | LINE login | **unset** (LINE login on Preview shows `LINE_CONFIG_MISSING`) unless a separate test LINE channel exists |
| `LINE_CHANNEL_ACCESS_TOKEN` | `lib/notify.ts` (LINE push) | **unset** |
| `RESEND_API_KEY` / `RESEND_FROM` | `lib/notify.ts` (email) | **unset** |
| `INTERNAL_API_SECRET` | `api/notify/send` | **unset** (route then rejects) or a staging-only random value |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | push subscribe | **unset** (settings page shows "not configured") |

Production env (Production scope in Vercel) is **not touched** by this plan.

## Steps (each needs the owner's go-ahead; stop on any failure)
0. **Inventory (read-only, owner in the Vercel dashboard)** — Project → Settings → Environment Variables: list the *names* and
   scopes (Production / Preview / Development) of every variable. Do not paste values. Note which are shared "All
   Environments" (those must be split, otherwise editing Preview changes Production).
1. **Code change (PR, staging-tested first)** — remove `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` from tracked `web/.env.production`
   so a missing Preview var fails the build instead of silently using production; add a build guard in `next.config.ts`
   that fails when `VERCEL_ENV=preview` and the Supabase URL contains the production ref `vhudldcizmbpujedojei`.
   Production keeps working because its Production-scoped vars are set in Vercel (confirm in step 0 first — if Production
   relies on the file, set the vars in Vercel *before* merging).
   Also (same PR or next): LINE callback treats `whiskora.vercel.app` (third-party host) as trusted and otherwise trusts the
   `line_origin` cookie (set by our own `/api/auth/line`) → allow-list `www.whiskora.pet` + this project's preview hosts only.
2. **Vercel Preview vars** — for each row above: set the Preview-scoped value (staging) or remove it from Preview. Split any
   "All Environments" variable into separate Production and Preview entries; Production values stay exactly as they are.
   Optional: enable Deployment Protection (Vercel Authentication) for Preview.
3. **Staging Supabase Auth** (`wpxcukrwmegwzfccbbga` only) — URL Configuration: Site URL = a staging/preview URL;
   Redirect URLs = `https://whiskora-git-*-laspearxs-projects.vercel.app/**` (team-scoped suffix only, never
   `*.vercel.app/**`) + `http://localhost:3123/**`. Production Auth settings unchanged.
4. **Rebuild** — env changes apply only to new builds: Vercel → Deployments → latest Preview of a docs/test branch →
   Redeploy **without build cache** (or push a commit to a throwaway branch). No production deploy; do not promote.
5. **Verify (no production ref, no production secrets)**:
   - Bundle: download the preview's HTML + every `/_next/static/**.js` it references; `grep` must find the staging ref and
     **0** occurrences of `vhudldcizmbpujedojei` and of every production publishable / anon key (fetch the current list
     with Supabase MCP `get_publishable_keys` at check time; compare by value in a script, print counts only).
   - Runtime: sign in on the preview with a staging synthetic account (`supabase/staging/seed_synthetic.sql`); the browser's
     Supabase requests all go to the staging host; production edge logs for that time window show **no** requests with the
     preview origin/referer; staging edge logs show them.
   - Server routes: `GET <preview>/api/auth/line` → `LINE_CONFIG_MISSING` (LINE secrets absent);
     `POST <preview>/api/notify/send` without the secret → 401/403; no LINE/email/push sent.
   - Vercel dashboard (owner): Preview scope lists only the staging/unset variables from the table; Production unchanged.
   - Production smoke after the change: `E2E_BASE_URL=https://www.whiskora.pet npx playwright test e2e/public.spec.ts` (18/18).
6. **Record** results (counts/booleans only) in `docs/STATUS.md`; update `WHISKORA_PLATFORM_OVERVIEW.md` known gaps.

## Rollback
Re-add the previous Preview values in Vercel (Preview scope only) and redeploy the preview. Production is unaffected
by every step except step 1's merge — that merge is gated on step 0 confirming Production-scoped vars exist.

## Open questions for the owner
- Does Production rely on `web/.env.production` or on Vercel Production-scoped vars? (step 0)
- Keep LINE/Google login on Preview (needs a separate LINE test channel + staging Google OAuth client), or email-only?
- Enable Vercel Deployment Protection for Preview?
- Until this is done, **avoid pushing branches** (each push builds a Preview against production).
