# No direct API DELETE on farms / shops / services / workspaces — staging only

Status 2026-11-02: branch `fix/business-delete-privileges`, migration `20261102100000` applied on **staging only**
(recorded as `20261102040845 business_delete_privileges`). Not merged, not on production. Approach chosen by the owner
2026-11-02: withdraw direct DELETE of anon and authenticated on all four tables, personal workspaces included.
Out of scope (not done here): new FKs, orphan clean-up, soft delete, closing a business, any RLS / FK change.

## 1. What changes
| | Before (production v1.14.0) | After |
|---|---|---|
| anon DELETE | table grant on all 4; RLS → 0 rows (uid null) | no grant → 401 / 42501 |
| authenticated DELETE | table grant; RLS "Users can manage own farms/shops/services" (`FOR ALL`, `auth.uid()::text = user_id`) and `workspaces_delete` (`owner_id = auth.uid()`) → the owner could delete their own farm / shop / service and any workspace they own, **personal workspace included** | no grant → 403 / 42501 for owner, manager, stranger |
| Everything else | — | unchanged: SELECT / INSERT / UPDATE (incl. the column grants `farms.verification_status`, `services.is_published`), TRUNCATE / REFERENCES / TRIGGER / MAINTAIN, service_role (incl. DELETE), RLS policies (the `FOR ALL` / `workspaces_delete` policies stay; without the grant they no longer allow DELETE), triggers, FKs, storage policies, data |

The migration checks the 4 tables exist with RLS on, revokes, then aborts if anon / authenticated / PUBLIC still hold an
**effective** DELETE (`has_table_privilege`: table grants, PUBLIC and role membership). It never grants anything.

## 2. Dependencies checked (read-only, production + staging, 2026-11-02)
| Path | Uses API DELETE on these tables? |
|---|---|
| App (`web/app`, `lib`, `components`, `app/api`) | no — no `.delete()` on farms / shops / services / workspaces (the only nearby delete is `service_items`, untouched) |
| RPCs / functions in `public` | none contains `DELETE FROM` these tables |
| Triggers | no DELETE trigger on the 4 tables |
| Cron / Edge Functions | nothing on these tables |
| Account deletion | manual, on request by e-mail (`/privacy`); removing `auth.users` cascades to `workspaces` (`workspaces_owner_id_fkey` ON DELETE CASCADE) — RI actions run as the table owner, not affected |
| Members: remove / leave | `remove_workspace_member` (definer) deletes `workspace_members`, not affected |
| Role membership / PUBLIC / views | anon, authenticated are members of no role; PUBLIC has no DELETE; no view on these tables |
| Existing test suites | none deletes these tables through the API |

Known, unchanged by this PR: `workspaces.entity_id` and several `farm_id` columns (`litters`, `farm_transactions`,
`appointments`, `analytics_events`) have no FK; `pets.farm_id` is NO ACTION; `service_items` / `service_bookings`,
`farm_verifications`, `farm_visibility_settings`, `workspace_members` / `workspace_invitations` cascade. With DELETE closed
these only matter to system paths (service_role / database owner).

## 3. Precheck / postcheck — `supabase/tests/business_delete_precheck.sql` (read-only)
- `state` before | after; `delete_rights` effective per role × table; `delete_verdict` OK only when anon, authenticated
  and PUBLIC have no DELETE on any of the 4 tables (before: STOP, expected).
- `other_rights_md5`: every effective table and column privilege of anon / authenticated / PUBLIC / service_role on the 4
  tables, **except exactly table DELETE of anon and authenticated** — the one right this migration removes, reported on its
  own in `delete_rights`. PUBLIC DELETE and service_role DELETE stay inside the fingerprint, so any change to them shows
  up as a different md5. The list must not be narrowed to make a run match.
- `policies_md5`, `triggers_md5`, `fks_md5`: policy definitions (name, command, roles, USING, WITH CHECK), triggers,
  FKs from / to the 4 tables; must be equal before and after. Readable lists are returned alongside.

## 4. Tests (staging; synthetic QA accounts; window 04:08:09–04:27:14 UTC 2026-11-02, Codex off staging, no Codex browser test running during E2E)
| Step | Result |
|---|---|
| Precheck before | `before`, verdict STOP (anon + authenticated DELETE on all 4; PUBLIC none); RLS on ×4; `other_rights_md5 a8292ec7402b64eb1479de1022330a68`, `policies_md5 39932b2bdcab8085aeda73e9a920e997`, `triggers_md5 6ffea8857c49aaf60c30e65b5659be63`, `fks_md5 0c3b65c0b9daf964b7251b26fe6b0700`; farms / shops / services 1 / 2 / 2, workspaces personal 8 farm 1 shop 2, members 15, invitations 0 |
| Apply 04:08:45 | `20261102040845 business_delete_privileges`; stored statement sha256 = file sha256 `dea30431…8081` |
| Postcheck after | `after`, `delete_verdict OK`; all 4 md5 = before; counts = before |
| `business_delete_checks.cjs` | **23 / 23**: signup → personal workspace + owner row; removal of this run's synthetic auth user (`…bd01`) → its workspace removed by cascade; owner creates farm / shop / service (`create_business`) and edits each profile; invite manager → accept; invite staff → cancel; list members; manager edits bio; direct DELETE of the 3 entities, 3 business workspaces, owner + manager personal workspaces: anon 401 / 42501, owner / manager / stranger 403 / 42501, row md5 unchanged; owner bulk DELETE (all shops, all own workspaces) 42501, nothing removed; manager leaves the team. Cleanup: farm 124, shop 145, service 113 + their workspaces and claim rows (1 / 1 / 1 each) |
| Exit handling (offline, after the run, 2026-11-02) | the staging run above used the first version of the suite (`a156da53…287c`). The suite now always runs cleanup, never calls `process.exit` in `finally`, and exits non-zero on an unexpected exception, any cleanup failure, any FAIL or a pass count ≠ 23. `business_delete_checks_unit.test.cjs` 12 / 12 (simulated exceptions, no pg / network). The changed suite has not been re-run against staging (no window) — run it in the rollout window or the next staging window |
| Regression | workspace guard 21 / 21, storage 23 / 23, members 51 / 51, create_business 75 / 75, verification guard 30 / 30, business profile 164 / 164 |
| E2E full suite on Preview `whiskora-dfw9j3173` (PR #32 head `1dec2ce`; `web/` = main `38860b2` = v1.14.0; served 1.14.0; bundles: staging ref only) | **90 passed, 2 skipped** (the usual "listed but not public" pair), 0 failed, `--workers=1`, 11.7 min — incl. register-business, business-profile, members / invitations / leave, verification, pet health |
| Final postcheck 04:25 | `after` / OK; 4 md5 = before; after clean-up counts = before (farms 1, shops 2, services 2, workspaces personal 8 / farm 1 / shop 2, members 15, invitations 0) |

**Synthetic data after the window:** this suite's rows: none (farm 124, shop 145, service 113, their workspaces + claims, signup user `…bd01` removed). Fixtures restored (transfer access, workspace guard, members, verification, business profile, pet privacy); P4 / P5 (transferred by the E2E chain) re-created from the seed values; QA-VG E2E farms 141–144 and QA-CB E2E shops 158 / 159 (+ workspaces, claims) removed by exact id after an owner + name check; unused E2E cover `shop-assets/990201/cover_1793593237847.jpg` removed via the Storage API as owner 01. Left as before: `farm-assets` 9 files (no API delete policy), `QA e2e pet …` 49 (older "owner can add a pet" test, +2 this run).

Account deletion was tested only with the synthetic user this run created, as the database owner (system path), like
the other suites; no shared QA account was removed. No GoTrue admin deletion (no service key used).

## 5. Rollout (production — not done; on the owner's go-ahead)
1. Pin the PR head; sha256 of the migration below; no `web/` change. Build scope = `release` (a migration is included):
   the merge gets a bot patch bump (`fix:` → v1.14.1, version files only) and Production builds that bump commit; the
   app code is the same as v1.14.0. Preview builds of this branch are skipped.
2. Read-only `business_delete_precheck.sql` → `before`; `other_rights_md5`, `policies_md5`, `triggers_md5`, `fks_md5`
   must equal the staging values above (they did on 2026-11-02 with the earlier formula; re-read before applying). Any
   difference → stop and report.
3. Apply `20261102100000` (one transaction, `lock_timeout` 5 s, `schema_migrations` row in the same transaction).
4. Postcheck → `after`, `delete_verdict OK`, the 4 md5 unchanged, counts unchanged.
5. Probes that cannot remove anything: anon DELETE on a non-existent id → 401 / 42501; QA stranger (no business, no
   membership) DELETE on a non-existent id of each table → 403 / 42501. No DELETE probe on real rows.
6. Pages: `/th`, farm-hub, login, register-shop, a dashboard → 200; logs for the window.
7. Merge the PR (pinned) → scope `release` → bot bump v1.14.1 → Production build of the bump commit; check the site
   serves 1.14.1 and bundles carry the production ref only. (The migration does not depend on the app, so apply → merge
   or merge → apply both work; apply first keeps the version number matching a DB that is already closed.)

**Recovery — fix forward.** If a real path turns out to need a delete, add a dedicated RPC for that path in a new PR; do
not re-grant DELETE to anon / authenticated. The app does not use these deletes, so there is no app rollback to consider.

Checksums (sha256):
- `20261102100000_business_delete_privileges.sql` `dea30431533c9bbe67e61ba74e9b27c100969f22c64ac8adc94fbc0c8ea18081`
- `supabase/tests/business_delete_precheck.sql` `01a93e398ed2ce0af5a7e35115ca91389fd35cfda5f271449e98d4002bf90186`
- `supabase/tests/business_delete_checks.cjs` `6fa9df0e0a4360e2aeda1784b0f87fa621a28f300a0997bc447cce20597d4cd0`
- `supabase/tests/business_delete_checks_unit.test.cjs` `5a5c71e1c33b7baec0f8792167a7cd4d1b31639391efe7b43badafc1ab07a01d`

**Preview ↔ staging:** staging has DELETE closed; no Preview uses these deletes.
