# F4 — LINE identity containment (branch `security/f4-line-identity`, NOT live)

Base: `main` `c29c393` (v1.14.2). App code + tests + one admin script. No migration, no backfill, no new secret,
no Auth / env change. Production data was only read (aggregate audit round A, 2026-11-09).

## Findings fixed (v1.14.2 code)
| ID | Before | After |
|---|---|---|
| C1 | login picked the first user whose **user_metadata.line_id** (user-writable) or email matched | only `app_metadata.line_id` (service role); >1 holder = `LINE_ACCOUNT_CONFLICT`; user_metadata never read (`lib/lineAuth.ts`) |
| C1b | `notify.ts`, settings, connections read `user_metadata.line_id` | `app_metadata.line_id` |
| C2 | `listUsers(page 1, 1000)` | `listAllUsers()` reads every page, fails closed past 50 pages |
| C3 | `email` scope; LINE email matched any account and created confirmed users with it | no `email` scope, id_token unused, new users get `line_<id>@line.whiskora.internal` (lower case) |
| C4 | link: session checked at POST only, uid carried by cookie, callback linked at once | callback stores `app_metadata.line_link_pending {line_id, display_name, nonce_hash, exp 5 min}` on the session-verified uid; `POST /api/auth/line/confirm` re-checks the session (Auth `GET /user`), the nonce cookie (same browser) and expiry, consumes the pending link, re-reads holders after writing (race → undo + conflict) |
| — | unlink wrote user_metadata from the browser | `DELETE /api/auth/line` (server), refused for LINE-only accounts |
| L1 | raw upstream error text in `auth_error` | fixed codes; TH/EN texts in `lib/lineAuthMessages.ts` |

## Staging validation (project `wpxcukrwmegwzfccbbga`, synthetic users, all deleted)
GoTrue v2.197.0 on staging and production. Staging has Confirm email ON, production autoconfirm ON.
1. `admin.createUser` without a password stores a random bcrypt hash (GoTrue `admin.go`: `password.Generate(64…)`) — "no password" is no evidence.
2. Public signup with a placeholder email: staging rejects it only because it tries to send a confirmation mail (DNS check in the mail path). With autoconfirm (production) GoTrue skips the mail → **anyone can pre-register `line_<id>@…` with a password**. Email change to a placeholder needs a mail → refused (except anonymous + autoconfirm; anonymous sign-ins are off).
3. Emails are lower-cased (`validateEmail`), LINE ids are `U`+hex → placeholder ≠ id by case; compare lower case.
4. `generateLink(magiclink)` sets `recovery_sent_at`; identities unchanged; verify → session amr `otp`.
5. Admin-created vs password account: same `raw_app_meta_data`, same identity keys `{sub,email,email_verified,phone_verified}`, both bcrypt; audit log table empty in production. **No reliable server-side marker of "made by the LINE callback".**
6. Admin password update revokes every session + refresh token (`UpdatePassword(tx, nil)` → `Logout`); access tokens already issued stay valid until `exp` (1 h). Do not rotate after creating the new session.
7–10. Covered by `scripts/line-auth.integration.mjs` (below).

**Security gate result: automatic adoption of legacy accounts is NOT safe** (a LINE OAuth success proves the LINE id, not the old account). Legacy accounts are migrated only by
- **signed-in link** — owner signed in to the old account (valid session) + LINE OAuth + confirm; or
- **admin recovery** — a LINE sign-in for a legacy account answers `LINE_ACCOUNT_REVIEW` (+ 8-hex reference) and stores `app_metadata.line_recovery_request`; admin verifies with the user, then `supabase/scripts/line_identity_recovery.mjs --ref <ref> --approve <user> --apply` (sets `line_id`, rotates the password = revokes all sessions). No new account replaces the old one.

## Production audit round A (aggregate, read-only, 2026-11-09)
108 users; 25 with a LINE claim: **24 legacy LINE-only placeholder accounts (V1)**, 1 Google account with a claim (V3), 0 duplicates, 0 app_metadata. All 24 have current sessions (amr `otp` only); 1 signed in within 30 days.

## Tests (run 2026-11-09)
- Unit `node --test scripts/line-auth.test.mjs` 20/20; existing `dashboard-layout-regression` 8/8; `tsc` OK; no new lint errors.
- Integration `scripts/line-auth.integration.mjs`: mock GoTrue 32/32; **real staging GoTrue 31/31** (LINE mocked). On staging `GET /auth/v1/user` is emulated by ES256/JWKS verification (the sandbox proxy key in `apikey` makes the gateway ignore user JWTs) → session revocation + pagination are mock-only.
- Playwright `playwright.f4.config.ts` 32/32 (TH/EN, desktop+mobile); security suite 42/42.

## Release blockers / decisions
1. **Legacy LINE-only users (24)**: with F4 a NEW LINE sign-in into these accounts stops (`LINE_ACCOUNT_REVIEW`) until migrated. Users whose existing session is still valid keep using the app and see a banner on Profile → Connections to confirm LINE (signed-in link, no admin needed); users who are signed out need admin recovery (data kept, no new account). Owner decision: accept this, plus who answers recovery requests and through which contact channel.
2. Admin recovery runbook owner + contact channel shown to users.
3. Real LINE OAuth not testable on Preview (LINE off there) → production smoke with the owner's account.

## Rollout (after approval)
Draft PR → review → Preview build (`preview: ok`) → merge (merge commit) → bump → production build → smoke: new LINE user, owner's LINE login (likely `LINE_ACCOUNT_REVIEW` if legacy → migrate via signed-in link), Google login, link/confirm/unlink on a test account, notify off. Monitor `[LINE Auth]` logs (review refs, conflicts).
Rollback: Instant Rollback to `dpl_B4tAELvQhkFzm48bP3kXVqZpzNbU` (v1.14.2) — safe: F4 writes `app_metadata` only additively and keeps the `user_metadata.line_id` copy that v1.14.2 reads (v1.14.2 reopens C1–C4).

## Not in F4 (H2)
DB-enforced one-holder-per-LINE-id table; Confirm email + SMTP; email signup → Google auto-link (path 1); block public signups on the placeholder domain (Auth hook); fix PR #37 evidence rule (case-sensitive compare + "no password" → would mark all 24 accounts unverified).
