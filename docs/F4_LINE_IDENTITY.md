# F4 — LINE identity containment (branch `security/f4-line-identity`, PR #40, rev. 3, NOT live)

Base: `main` `c29c393` (v1.14.2). Revision 2 answers the independent review of `193d287` (Codex: NO-GO, High 2 /
Medium 2 / Low 2). **Needs migration `20261110090000_line_identity_map`** — written and tested on a throwaway local
Postgres only; not applied to staging or production (separate approval each). No backfill, no evidence stamping,
no Auth / env change.

## Design
- **Database = only source of truth.** `line_identities` (UNIQUE LINE id, UNIQUE account), `line_link_pending`,
  `line_identity_ops` (legacy operations), `line_identity_audit` (append-only). RLS on, no grants to API roles —
  service_role included; every change goes through SECURITY DEFINER functions (service_role EXECUTE only) that take
  transaction advisory locks in a fixed order (LINE id → account).
- App: login `line_login_resolve` → holder / legacy / creating / claims / none. New LINE user: placeholder account
  (lower case) + `line_identity_claim(login_create)` (refused unless the placeholder of exactly that id, < 2 min old;
  unclaimed account deleted on failure). Link: POST (Bearer) → LINE → callback writes ONLY `line_link_pending_put`
  → `POST /api/auth/line/confirm` → `line_link_take` (DELETE … RETURNING under the account lock: consumed once) →
  claim. Unlink: `line_identity_release` (same locks). Status for the UI: `GET /api/auth/line/status`. Notify:
  `line_identity_of`. No metadata is read for identity; `user_metadata.line_id` is only written as a rollback copy.
- No `email` scope, id_token unused; fixed error codes (TH/EN in `lib/lineAuthMessages.ts`).

## Staging apply record (2026-11-10, approval B)
Staging `wpxcukrwmegwzfccbbga` only — production untouched. Commit `b8b5720` (file sha256 `54b52769…7842`).
- Preflight 11/11 ok; pre-apply fingerprint recorded (`05_fingerprint_readonly.sql`).
- Recovery proof on staging itself: migration + 14 verification checks + `40_rollback.sql` + fingerprint compare in ONE
  transaction, then rolled back on purpose → after-rollback fingerprints identical to pre-apply; nothing persisted.
- Applied 03:40 UTC via Supabase migrations (recorded as `20261110034009 line_identity_map` — the tool's own version,
  not the file's `20261110090000`). Verification 14/14; smoke as service_role: API ok, every internal helper / table /
  audit sequence denied. Auth rows unchanged (users / identities fingerprints identical).
- Advisor: +5 INFO (RLS without policy, intended), +3 WARN search_path on invoker helpers (`f4_valid_line`,
  `f4_new_ref`, `line_identity_audit_immutable`; not executable by API roles); no new anon / authenticated warning.
- Not yet proven: Auth flows through the triggers on staging (no Auth traffic since apply; needs synthetic UAT = C).

## Re-review of 3da5844 → revision 3
| # | Finding (preliminary, verified against the code) | Verdict | Fix | Proof |
|---|---|---|---|---|
| 1 | internal `f4_*` helpers callable directly by service_role (Supabase default privileges) — e.g. `f4_claim(…, 'recovery')` skips the reset, `f4_audit` forges audit rows; audit sequence writable by API roles | **confirmed** (reproduced with staging's default ACLs) | revoke every F4 function from public / anon / authenticated / service_role, grant only the 17 API functions; sequence revoked; migration guard fails on any deviation; test stub now reproduces Supabase default privileges | SQL: `permission denied` for f4_claim / f4_audit / f4_end_op / f4_freeze_grace / setval |
| 2 | unlink then re-link: confirm was two RPCs (take, then claim) — an unlink between them returned ok and the older confirm then mapped the LINE id again | **confirmed** (any pending link while linked) | `line_link_confirm` = consume pending + claim (or legacy op begin) in ONE transaction under the LINE-id → account locks; unlink deletes pending links and ends ops under the same locks | race 8/8 incl. confirm-vs-unlink both orders; integration concurrent confirm + unlink |
| 3 | in-flight Auth requests: GoTrue checks the session BEFORE its update transaction (`UserUpdate`: session in middleware, bcrypt, then tx) — a password / email change admitted before the rotation can commit after it, and the digest check accepted any change | **confirmed** (GoTrue v2.197.0 source) | per-account credential freeze from op begin until 10 min after commit / failure (triggers on `auth.users` credential columns, `auth.mfa_amr_claims` non-OTP sign-ins, `auth.identities`); exactly one password change is let through and recorded; `line_op_mark_reset` verifies it is the app's own rotation (bcrypt of a random secret); commit re-verifies digest / sessions / email_change / identities | SQL + race: attacker first → app rotation refused → abort; app first → attacker refused; after commit: password / email / password sign-in / OAuth link refused, owner OTP sign-in works |

Residual of #3: the grace period assumes no Auth request runs longer than 10 minutes; access tokens issued before the
reset stay valid until `exp` (data access, not credentials).

## Codex findings (193d287) → revision 2
| ID | Finding | Fix | Proof |
|---|---|---|---|
| H1 | signed-in legacy migration kept planted password / sessions | LINE-only accounts never plain-link (`legacy_needs_reset`); they go through an op: `line_legacy_link_begin` (records password digest) → Auth admin password rotation (revokes every session) → `line_op_mark_reset` (SQL verifies digest changed AND no session left) → `line_op_commit`. Same for admin recovery. | SQL 62/62; integration: planted password + session invalid after migration |
| H2 | link lifecycle not atomic (stale callback write-back; concurrent replay) | callback writes only the pending row; take/claim/release under shared DB locks + UNIQUE constraints | race tests 5/5 (two real sessions, blocked-then-commit); integration H2#1 / H2#2 |
| M1 | recovery without evidence / freshness / approver | `line_recovery_begin`: request ref + version + full user id + ≤ 14 days + reviewer + reason + ≥ 2 owner checks; server evidence snapshot stored; audit | SQL + integration (wrong version / user / stale / one check refused) |
| M2 | partial failure between rotation and mapping | durable op states: rotation failure → `line_op_abort` (back to open); reset recorded → `resume`; mapping refused → `failed`; signed-in op finished by the next LINE sign-in (`line_legacy_link_resume`) | integration (synthetic rotation failure, resume) |
| L1 | write results ignored | every RPC through `rpc()` (throws on error); decline / unlink / pending checked; reference shown only if recorded | unit static guards + integration |
| L2 | recovery pagination not fail-closed | script no longer lists users at all (RPCs only); app no longer scans users | unit static guard |

## Production data (aggregate, read-only)
Audit A (2026-11-09): 108 users; 25 LINE-related: 24 LINE-only placeholder, 1 Google + claim; 0 duplicates.
Audit A2 (2026-11-10): all **24** placeholder accounts have a creation-time `otp` session (≤ 10 s), no non-otp session,
original identity, no OAuth, no pending email change → "Tier A" signals; 1 of 24 had session activity in 30 days.
Tier A is NOT used for any automatic change (needs its own review; no stamping).

## Impact on legacy LINE-only users
LINE sign-in into a legacy account stops (`LINE_ACCOUNT_REVIEW` + reference) until migrated by (1) the signed-in
link (banner on Profile → Connections; user is signed out everywhere and signs in with LINE again) or (2) admin
recovery (`docs/LINE_ACCOUNT_RECOVERY.md`). LINE notifications for unmigrated accounts stop (no trusted LINE id).
No account is replaced by a new one.

## Tests (revision 3, run 2026-11-10)
SQL **100/100** (stub reproduces Supabase default privileges) · race **8/8** · unit **9/9** · dashboard regression 8/8 ·
integration **67/67** · Playwright F4 40/40, security 42/42 · `tsc` OK, no lint errors in changed files.
Staging kit (preflight / verify / rollback) exercised on local Postgres: apply → verify all ok → rollback refuses with
data → rollback with ack → re-apply.

## Tests (revision 2, run 2026-11-10)
SQL `supabase/tests/local/f4_line_identity_test.sql` 62/62 · race `web/scripts/line-identity-race.test.mjs` 5/5 ·
unit `web/scripts/line-auth.test.mjs` 8/8 · dashboard regression 8/8 · integration `web/scripts/line-auth.integration.mjs`
56/56 (built app + mock GoTrue mirrored into local Postgres with the real migration) · Playwright F4 40/40,
security 42/42 · `tsc` OK, no new lint errors. Not run: staging (migration not applied there), real LINE / Google OAuth.

## Release order (each step needs approval)
staging: apply migration → staging UAT (synthetic: new LINE user, V3 link, legacy signed-in link with planted
password, admin recovery incl. failure + resume, unlink, concurrency) → production: apply migration (app v1.14.2
unaffected: it never calls the new functions) → deploy F4 → owner LINE smoke → recovery queue watch.
Rollback: app → v1.14.2 (reopens C1–C4; mapping tables stay, unused). Migration rollback = drop the four tables and
functions (staging-only script to be written with the approval request).

## Residual / not in F4
Access tokens issued before a reset stay valid until `exp` (production JWT expiry to confirm). Public signup can still
create placeholder accounts (they can only cause review, never a sign-in; Auth hook blocking the domain = H2).
Confirm email + SMTP, email-signup → Google auto-link (H2 path 1). PR #37 overlaps 7 app files and its evidence SQL is
case-sensitive — must be reconciled with this design before reuse.
