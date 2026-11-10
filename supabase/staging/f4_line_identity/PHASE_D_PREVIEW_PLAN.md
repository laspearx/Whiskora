# F4 Phase D — LINE on ONE staging Preview (plan, needs approval before code changes)

Status 2026-11-10: **plan only.** No guard / route change, no Vercel variable, no LINE channel has been created.

## Why a plan first
Every Preview shares two protections:
- `web/lib/deploy-env-guard.mjs` fails a Preview build if `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ID`,
  `LINE_CHANNEL_SECRET` (and other live secrets) are set;
- `isPreviewDeploy` (`web/lib/deploy-env.ts`) switches all LINE routes off on every Preview.
In addition, `app/api/auth/line/callback/route.ts` trusts only `https://www.whiskora.pet` as origin and falls back to it
for both the redirect target and the OAuth `redirect_uri` — enabling LINE on a Preview without a code change would send
staging sign-ins back to the production domain.

## Proposed code change (scoped to one branch, fail-closed)
1. Guard: allow `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` on a Preview **only when all hold**:
   `VERCEL_ENV=preview`; `VERCEL_GIT_COMMIT_REF === 'security/f4-line-identity'` (constant in code);
   `F4_PREVIEW_LINE_UAT=1`; Supabase URL = staging; `NEXT_PUBLIC_SITE_URL` exactly
   `https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app`; sha256 of the service-role key and
   of the LINE channel id are in committed staging allow-lists (hashes supplied by the owner — never the values).
   Still forbidden everywhere on Preview: `LINE_CHANNEL_ACCESS_TOKEN`, `RESEND_*`, `VAPID_PRIVATE_KEY`.
   Any other branch with the same variables keeps failing the build.
2. `next.config.ts` inlines `WHISKORA_LINE_UAT=1` only when the guard granted the allowance; `deploy-env.ts` exports
   `lineRoutesEnabled = !isPreviewDeploy || lineUat`. LINE routes use it; notifications stay off on every Preview.
3. LINE routes: on the UAT Preview the trusted origin / fallback is that Preview's `NEXT_PUBLIC_SITE_URL`, never
   production. Production behaviour unchanged (still `www.whiskora.pet`).
4. Tests: guard unit tests (allowed only on that branch with matching hashes; another branch, a production key, a
   missing hash, a production host → build blocked) + static guards on the routes.

## Owner configuration (do not paste values in chat)
1. **LINE Developers**: new Provider `Whiskora Staging` (separate from production → different LINE user ids), new
   LINE Login channel `Whiskora Staging UAT`, app type Web, Callback URL
   `https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app/api/auth/line/callback`,
   keep it **Developing** (only admins / testers can sign in), add tester LINE accounts, no email permission.
2. **Supabase staging** → Project Settings → API Keys → create a dedicated **secret key** `vercel-preview-uat`
   (revocable after UAT). Production project: no change.
3. **Vercel** → whiskora → Settings → Environment Variables → Add, Environment **Preview**, Git branch
   **`security/f4-line-identity` only**, Sensitive:
   `SUPABASE_SERVICE_ROLE_KEY` (that staging secret key), `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` (staging channel),
   `NEXT_PUBLIC_SITE_URL` (the URL above), `F4_PREVIEW_LINE_UAT=1`. Production rows and "All Preview branches" rows:
   unchanged.
4. Send only the **sha256 hashes** of the staging secret key and of the staging channel id, computed locally without
   shell history: `read -rs V; printf %s "$V" | sha256sum; unset V`.
5. Staging Auth → URL Configuration: keep `https://whiskora-*-laspearxs-projects.vercel.app/**` in Redirect URLs.
6. Email signup with a receivable inbox: staging Confirm email is ON and the default mailer only delivers to project
   team members → use a team member's inbox, or configure custom SMTP on staging (owner's choice).
7. Google OAuth on staging is disabled → NOT VERIFIED unless a separate staging Google OAuth client is configured.
8. The browser steps are run by a team member in their own browser (Preview is behind Vercel SSO). The cloud session
   cannot drive them: its egress proxy rewrites Supabase requests (user JWTs rejected, see Phase C).

## After the UAT
Remove the branch-scoped Vercel variables, revoke the `vercel-preview-uat` secret key, set the LINE channel inactive
or delete it, revert the guard allowance (or leave it inert once the variables are gone), then propose the snapshot
cleanup.
