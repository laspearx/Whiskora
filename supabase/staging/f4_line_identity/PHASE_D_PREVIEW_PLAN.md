# F4 Phase D — LINE on ONE staging Preview (plan, needs approval before code changes)

Status 2026-11-10: **code implemented on PR #40 (inert).** The allow-lists in `web/lib/deploy-env-guard.mjs` are empty, so
the allowance cannot be granted yet; no Vercel variable, secret key or LINE channel has been created.

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

## Owner configuration — step by step (staging only; never paste a secret in chat)
### 1. LINE Developers (https://developers.line.biz/console/)
1. **Create a new provider** → name `Whiskora Staging`. Do NOT reuse the production provider: LINE user ids are per
   provider, so a separate provider guarantees staging ids never match production accounts.
2. In that provider → **Create a new channel** → **LINE Login**. Region: Thailand. Channel name `Whiskora Staging UAT`,
   description "staging test only", App types: **Web app**. Agree to terms → Create.
3. Tab **LINE Login** → Callback URL → Edit → enter exactly
   `https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app/api/auth/line/callback` → Update.
   Leave "Use LINE Login in your mobile app" off.
4. Tab **Basic settings**: OpenID Connect **Email address permission: do not apply** (F4 never requests email).
   Keep the channel status **Developing** (only admins / testers can sign in). Note the **Channel ID** (shown on the
   page) and the **Channel secret** (click to reveal) — you will paste them only into Vercel.
5. Tab **Roles** → invite the LINE accounts that will test (your own LINE account is fine: on this provider it gets a
   new, staging-only user id).

### 2. Supabase staging — dedicated secret key (project `wpxcukrwmegwzfccbbga`, NOT production)
1. Dashboard → project **whiskora-staging** → Project Settings → **API Keys** → tab "Publishable and secret API keys".
2. **Secret keys → + New secret key** → name `vercel-preview-uat` → Create. Copy it once (it is shown only now).
   Production project: no change at all.

### 3. Fingerprints (sha256) — computed on your own machine, nothing secret leaves it
In a terminal (macOS / Linux; on Windows use WSL or Git Bash):
```
read -rs V; printf %s "$V" | shasum -a 256; unset V
```
Paste the value at the (invisible) prompt, press Enter; repeat once for the secret key and once for the Channel ID.
`read -s` keeps it off screen and out of shell history. Send me only the two 64-hex results (a sha256 of a 256-bit key
cannot be reversed; it is not a secret). I add them to `STAGING_SERVICE_KEY_SHA256` / `STAGING_LINE_CHANNEL_ID_SHA256`
in a reviewed commit — that commit is what activates the allowance; without it the Preview build fails if the
secrets are set.

### 4. Vercel — branch-scoped Preview variables (project `whiskora`)
Settings → Environment Variables → **Add New**, for each row: Environments = **Preview** only, then
"Select a custom Preview branch" = **`security/f4-line-identity`**, tick **Sensitive** for the secrets:

| Key | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | the staging `vercel-preview-uat` secret key (Sensitive) |
| `LINE_CHANNEL_ID` | staging channel id |
| `LINE_CHANNEL_SECRET` | staging channel secret (Sensitive) |
| `NEXT_PUBLIC_SITE_URL` | `https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app` |
| `F4_PREVIEW_LINE_UAT` | `1` |

Do not edit any Production row or any "All Preview branches" row. Keep Deployment Protection (Vercel Authentication)
on. Then tell me; I push the hash commit, the Preview rebuilds, and the build log must show `[deploy-env-guard]
preview: ok` (otherwise it names what is wrong, never the value).

### 5. Other owner items
- Staging Auth → URL Configuration: Redirect URLs keep `https://whiskora-*-laspearxs-projects.vercel.app/**`.
- Email signup with a receivable inbox: the default mailer only delivers to members of your Supabase organization —
  use such an inbox, or configure custom SMTP on staging.
- Google OAuth on staging is off → NOT VERIFIED unless a separate staging Google OAuth client is configured.

## After the UAT
Remove the branch-scoped Vercel variables, revoke the `vercel-preview-uat` secret key, set the LINE channel inactive
or delete it, revert the guard allowance (or leave it inert once the variables are gone), then propose the snapshot
cleanup.
