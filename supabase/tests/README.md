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
