# F4 LINE identity — staging migration kit (rev. 3)

Migration: `supabase/migrations/20261110090000_line_identity_map.sql`. **Staging: applied 2026-11-10 (see `docs/F4_LINE_IDENTITY.md`, staging apply record). Production: not applied.** Each step below needs its own owner approval. Target first: staging `wpxcukrwmegwzfccbbga`.

| Step | File | Writes? |
|---|---|---|
| 1. Preflight | `00_preflight_readonly.sql` — every row `ok = true`, else stop; `05_fingerprint_readonly.sql` before / after | no |
| 2. Backup | owner: Dashboard → Database → Backups (confirm a recent backup / PITR) + `pg_dump --schema-only --schema=public` kept locally | no |
| 3. Apply | the migration file in ONE transaction with `set local lock_timeout = '5s'` (FKs and triggers take short locks on `auth.users`, `auth.identities`, `auth.mfa_amr_claims`) | **yes** |
| 4. Verify | `20_verify_after_apply.sql` (all `ok = true`) + smoke block in its comments + security advisor | no |
| 5. UAT | synthetic users only (list below) | **yes** (staging) |
| Rollback impact | `30_rollback_impact_readonly.sql` + audit export | no |
| Rollback | `40_rollback.sql` (app first; drops the Auth-table triggers first; refuses with data unless acknowledged) | **yes** |

Restore = the rollback script, not a database restore (a restore would also roll back unrelated staging data).

## What the migration adds to the Auth schema (review before approving step 3)
Three triggers that only act on accounts under a legacy-LINE re-verification (rows in `line_credential_freeze`);
for every other account they return immediately:
- `f4_credential_freeze` — `BEFORE UPDATE ON auth.users` (only when password / email / email_change / phone change)
- `f4_sign_in_freeze` — `BEFORE INSERT ON auth.mfa_amr_claims` (one lookup per new session)
- `f4_identity_freeze` — `BEFORE INSERT OR UPDATE OF user_id ON auth.identities`
A bug in them would make Auth return errors for sign-in / password changes, so the UAT includes regression sign-ins.

## Staging UAT (synthetic only)
1. New LINE user → placeholder account + mapping. 2. Google/email account: link → confirm → unlink → old confirm
replay (`LINK_PENDING_MISSING`). 3. Confirm and unlink sent together. 4. Legacy placeholder with planted password +
session: signed-in link → everyone signed out → planted password fails → LINE sign-in works. 5. Same with an
in-flight password change from the planted session before / after the rotation (refused; no mapping or grace).
6. Admin recovery: decline, rotation failure, resume (with / without verified reset), approve. 7. Regression:
email / Google sign-in, password change and sign-up for ordinary accounts, dashboard. 8. Cleanup of synthetic users.

Requires (separate approvals): Preview env (staging service-role key, LINE channel id / secret, site URL), a staging
LINE Login channel with the Preview callback, and lifting `isPreviewDeploy` for the LINE routes on that Preview only.
