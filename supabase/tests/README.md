# Database privilege tests

`run_local.sh` and `run_concurrency.sh` start a throwaway `postgres:15` container, load
`stub_schema.sql` (Supabase-like roles + synthetic users/pets, **not the real schema**),
then check privileges before and after the migrations. No real data is used.

| Suite | What it proves |
|---|---|
| `privacy_cases.sql` (before/after) | anon & unrelated users can read private profile/pet-health columns before, cannot after; public columns and owner RPC still work |
| `privacy_cases_after.sql` | `get_my_profile` self-only, `find_user_by_email` exact-only (no prefix/wildcard, no email in result, no anon), invite search no email-fragment matching, owner writes still work, `upsert`/`RETURNING *` on private columns are refused |
| `reservation_cases.sql` | role checks (owner/manager yes, staff/stranger/anon no), idempotent confirm, one confirmed per pet, valid transitions, self-transfer and duplicate pending blocked, decline keeps owner, accept converts reservation and moves owner + health access |
| `run_concurrency.sh` | two concurrent confirms of the same pet → one wins; concurrent double confirm → same result; concurrent double accept → one accept |

Passing here validates the SQL and the privilege model only. On real staging, re-run the
same calls (`privacy_checks.sql` helper works on any Postgres) with staging test-user UUIDs,
after the pre-checks in `migrations/20261029100000_private_columns.sql`.

## Real staging / production (no Docker stub)
| File | Use |
|---|---|
| `staging_api_checks.py` | PostgREST/RPC/Storage per role on whiskora-staging (refuses any other project) |
| `privacy_precheck.sql` | read-only gate before applying the privacy migration (columns, invoker functions, views, role guard, app RPCs, state) |
| `privacy_postcheck.sql` | after applying: anon / unrelated user / owner, simulated via `set local role` + JWT claims in a rolled-back transaction; counts only |

## Reservation → transfer (`20261030120000`)
| File | Use |
|---|---|
| `reservation_precheck.sql` | read-only gate before applying + postcheck after (STOP / WARN / ok; never edit real rows to pass) |
| `reservation_api_checks.cjs` | REST checks per role on whiskora-staging (`STAGING_ANON_KEY=… node …`), after `reservation_fixture_staging.sql` |
| `reservation_concurrency_staging.cjs` | controlled-timing + stress concurrency on whiskora-staging (needs `pg`) |
| `staging_only/…_down_STAGING_ONLY.sql` | exact pre-migration state for staging rollback tests — re-opens the holes, **never on production** |
| `../emergency/reservation_transfer_freeze.sql` / `…_unfreeze.sql` | production recovery: stop new reservation/transfer writes, keep reads + privacy, then fix forward |

## Workspace members via RPC + invitations (`20261101150000`; production `20261101011545` since 2026-11-01)
| File | Use |
|---|---|
| `workspace_members_precheck.sql` | read-only gate before / after (guard, unique, forged owners, member counts, privileges, RPCs) |
| `workspace_members_fixture_staging.sql` | farm 9001 = owner 01, manager 02, staff 03, viewer 04; shop 990101 workspace without member rows; clears invitations |
| `workspace_members_checks.cjs` | every permission cell, invitations, remove / leave, direct writes refused, concurrency, business powers unchanged (`--compat-only` for the old-app calls) |

## Create a business atomically (`20261101160000` + `20261101170000`; staging only — `docs/PARTNER_CREATE_BUSINESS.md`)
| File | Use |
|---|---|
| `create_business_precheck.sql` | read-only gate: state `before` / `step1` / `step2`, counts, businesses without workspace, forged owners, RPC / claims-table privileges, fault triggers absent |
| `create_business_checks.cjs` | owner = caller, field allow-list, photos, idempotency, concurrency, fault injection at every step (staging-only triggers, dropped after), installed rules on the new business, direct INSERT (step 2); removes every `QA-CB…` business |
| `partner_photos_orphans.sql` | read-only count of register photos no business uses (deletes nothing) |
| `staging_only/apply_migration_STAGING_ONLY.cjs` / `create_business_down_STAGING_ONLY.sql` | sha-checked single-transaction apply; rollback test back to `before` — **never on production** |
| `../../web/e2e/register-business.spec.ts` | Preview: lost response → retry gives one shop; server refusal saves nothing |
