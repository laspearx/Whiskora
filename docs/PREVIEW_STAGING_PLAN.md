# Vercel Preview → staging Supabase

Branch `chore/preview-staging-env` (not merged). Production is untouched: no Production-scope variable, domain, deploy or
promotion is changed by anything here.

## Status (2026-10-30)
| Part | State |
| --- | --- |
| Code: build guard + LINE/notify off on Preview + LINE origin allow-list | **done** on the branch; local tests passed (below) |
| Vercel Preview variables | **set by the owner** 2026-10-30 (staging URL + publishable key; production secrets removed from Preview). `NEXT_PUBLIC_VAPID_PUBLIC_KEY` could not be split (Vercel refuses for public-prefixed vars) → handled in code |
| Staging Auth Redirect URLs | **set by the owner** (not readable from here) |
| Real Preview check (bundle, network, login/profile on staging) | **passed** 15:30 ICT on `b0f9d9a` (see `docs/STATUS.md`) |
| Remove `NEXT_PUBLIC_*` from `web/.env.production` | **done on the branch** (file deleted — it held only those two) after the owner confirmed Production has both vars. Guard now also fails a Production build if they are missing or not the production project |

## What the code does
- `web/lib/deploy-env-guard.mjs` (run from `next.config.ts` after loading `.env*`), when `VERCEL_ENV=preview`:
  fails the build if `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` are missing, the URL is not staging `wpxcukrwmegwzfccbbga`,
  the key is a production key (compared by sha256) or a JWT of another project, `NEXT_PUBLIC_SITE_URL` is
  `whiskora.pet` / `www.whiskora.pet` / `whiskora.vercel.app`, or any of `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ID`,
  `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `VAPID_PRIVATE_KEY` is set. Every environment: fails if the public key is a secret/service-role key.
  Errors list variable names only, never values. Production/local builds: only the secret-key check.
- `WHISKORA_DEPLOY_ENV` is inlined at build; on Preview: `/api/auth/line` (GET and callback) → redirect to the
  **preview's own** `/th/login?auth_error=LINE_DISABLED_ON_PREVIEW`; `POST /api/auth/line` and `/api/notify/send` → 503;
  `lib/notify.ts` sends nothing. Push subscribe shows "not configured": `lib/push-client.ts` blanks the VAPID public key on
  Preview (Vercel does not allow removing Preview from that public-prefixed variable, so it is allowed through the guard).
- LINE callback trusts only `https://www.whiskora.pet` / `https://whiskora.pet` from the `line_origin` cookie
  (`whiskora.vercel.app` is someone else's site and was trusted before). Anything else → `www.whiskora.pet` as before.
- Auth callback uses `NEXT_PUBLIC_SITE_URL || request origin`; with SITE_URL unset on Preview it stays on the preview host.
  Hard-coded `whiskora.pet` in `sitemap`/`robots`/`metadataBase`/canonical links is SEO only (no redirect, no data).

## Owner: values to set (Vercel → project **whiskora** → Settings → Environment Variables)
Do not paste values in chat. Production rows stay exactly as they are.

1. **Inventory first** (names only): note every variable whose Environments show **All Environments** or
   **Production + Preview**. Such a shared variable must be split: edit it → untick **Preview** (Production keeps the
   value) — then add a new Preview-only entry if the table says so. Also confirm that **Production** has
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (tell me yes/no; this gates removing them from
   `web/.env.production` later).
2. **Preview** scope (Environment = Preview, "All Preview branches"):

| Variable | Preview |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wpxcukrwmegwzfccbbga.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging publishable key — Supabase dashboard → project *staging* (`wpxcukrwmegwzfccbbga`) → Project Settings → API Keys → Publishable key (`sb_publishable_aDM_…`). Public key, not a secret |
| `NEXT_PUBLIC_SITE_URL` | **not set** |
| `SUPABASE_SERVICE_ROLE_KEY` | **not set** |
| `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` | **not set** |
| `RESEND_API_KEY`, `RESEND_FROM` | **not set** |
| `VAPID_PRIVATE_KEY` | **not set** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | may stay (Vercel won't split it); ignored on Preview by code |
| `INTERNAL_API_SECRET` | not set (the route is 503 on Preview anyway) |

3. **Deployment Protection** is on for Preview (anonymous request → 302 to Vercel SSO). Keep it. For the automated check:
   Settings → Deployment Protection → **Protection Bypass for Automation** → Add (or copy the existing) secret, and save it
   on this machine yourself: `! install -m 600 /dev/null ~/.whiskora/vercel_bypass && nano ~/.whiskora/vercel_bypass`.
   Alternative: no bypass; you open the preview in your browser and I verify via staging/production logs only.
4. **Staging Supabase** (dashboard → project *staging* → Authentication → URL Configuration). Production project: no change.
   - Site URL: `http://localhost:3123` (staging has no fixed web host; email/password login does not use it)
   - Redirect URLs (only these two):
     `https://whiskora-*-laspearxs-projects.vercel.app/**` (covers both the branch URL `whiskora-git-<branch>-…` and the
     per-deployment URL `whiskora-<hash>-…`; both end in our team suffix) and `http://localhost:3123/**`
     — never `https://*.vercel.app/**`. Google/LINE stay off on staging this round.
5. **Rebuild**: Deployments → the newest Preview of `chore/preview-staging-env` → ⋯ → **Redeploy** → untick
   **Use existing Build Cache**. Do **not** use "Promote to Production" / "Assign domain" on it.

## Verify (after 1–5)
`node <scratchpad>/preview_qa.cjs <preview URL>` (reads the bypass from `~/.whiskora/vercel_bypass`; prints counts only):
served HTML + all `/_next/static/*.js` → staging ref > 0, production ref 0, production keys 0; LINE GET/callback → same
preview host with `LINE_DISABLED_ON_PREVIEW`; notify → 503; browser login `whiskora-qa+viewer@example.com` → profile
edit → save → refresh → restore, PATCH goes to staging and staging holds the value; every Supabase request in the
browser goes to staging. Then: production edge logs for the test window have no request with the preview host as
origin/referer; production `www.whiskora.pet` still serves `3f37410` (v1.5.1) and the production ref.

## Rollback / if a Preview misbehaves (Preview only — never back to production)
- **Never** re-tick Preview on production variables or copy production URL/keys/secrets into Preview. Going back to the
  old "Preview = production" setup is not a rollback option.
- Preview problem → stop it, don't widen it: leave the build failing (the guard fails any Preview without staging values),
  or remove the Preview-only `NEXT_PUBLIC_SUPABASE_*` entries so new Previews fail; delete/cancel the bad Preview
  deployment in Vercel (Deployments → ⋯ → Delete); keep Deployment Protection on.
- Staging Auth: remove the two Redirect URLs (staging only) if Previews are stopped.
- Bypass secret: Deployment Protection → Protection Bypass for Automation → revoke (and delete `~/.whiskora/vercel_bypass`).
- Code (after merge): revert the PR on main. The tracked `web/.env.production` is not needed to restore Production
  (Production reads its Vercel Production vars); do not re-add it, since it would again feed production values to Previews.

## After merge (separate approval)
- Production build runs the guard in `production` mode: fails if `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` are missing or
  not the production project, or if the public key is a secret key. A failed Production build does not replace the live
  deployment (Vercel keeps the current one), so the risk is a blocked deploy, not an outage.
- Optional LINE/Google on Preview needs a test LINE channel and a staging Google OAuth client.
