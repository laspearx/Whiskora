# F4 — browser UAT with real user sessions (staging only, next step)

Why: from the cloud session, every call to staging goes through an egress proxy that replaces the `apikey` with the
project secret key; the gateway then ignores the user's JWT (`403 bad_jwt`). Endpoints that need the user's own
session — `GET/PUT /auth/v1/user`, `POST /auth/v1/logout`, the app's `/api/auth/line/*` routes (they validate the
Bearer with the anon key) — were therefore **NOT VERIFIED** in Phase C. They must be tested from a normal browser.

## Where
- Supabase project: **staging `wpxcukrwmegwzfccbbga` only.** Never production.
- App: either `npm run dev` on the tester's own machine with `.env.local` pointing to staging (URL + publishable key;
  service-role key of **staging** only for the LINE routes), or the PR #40 Vercel Preview once Phase D (Preview env +
  staging LINE channel + lifting `isPreviewDeploy` for that Preview) is approved.
- Accounts: new synthetic accounts only (`f4uat+<tag>@…`). Never the 8 QA seed accounts, never real people.
  Public email signup needs a deliverable synthetic inbox (Confirm email is ON on staging and `@example.com` is
  rejected by the mailer, which rolls the signup back); otherwise create the account with the Auth admin API.

## Checklist (record Pass / Fail / Not verified for each)
1. Sign in (email + password) → `GET /auth/v1/user` returns the user; refresh after expiry works.
2. Change password in the app (`PUT /auth/v1/user`) → other sessions signed out, new password works.
3. Logout → refresh token refused, protected pages redirect to login.
4. Profile → Connections: status loads (`GET /api/auth/line/status`), no LINE linked, no legacy banner.
5. With a staging LINE channel (Phase D): link → LINE → confirm screen → confirm → linked; unlink; the old confirm
   tab afterwards shows "link expired / missing"; two tabs confirming at once → one success.
6. Legacy LINE-only account (placeholder made with a planted password + a second browser signed in with it):
   connect LINE → confirm → every browser signed out → planted password fails → LINE sign-in works →
   for 10 minutes password sign-in / password change refused, LINE sign-in works.
7. Regression: Google sign-in (if enabled on staging), dashboard pages, sign out.
8. Cleanup: delete the synthetic accounts (Auth admin), confirm `line_identities`, `line_link_pending`,
   `line_identity_ops` (open / approving) and active `line_credential_freeze` rows of those accounts are gone and the
   8 QA seed accounts are intact (`05_fingerprint_readonly.sql`).
