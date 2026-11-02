# Security hardening — Phase 1 (prepared, NOT applied) — revision 2

Status 2026-11-02: code + SQL on local branches only (not pushed: a push of app changes builds a Preview). Nothing
applied to staging or production, no Auth setting / credential changed, no backfill run, nothing merged or deployed.
Source: the read-only audit of 2026-11-02 (main `a86b35a`, production catalog + advisors). Tests ran only in a
throwaway local Postgres 17 loaded with a **schema-only** dump of staging (no data): `supabase/tests/local/run.sh`.
Revision 2 (review of rev. 1): H1 split into expand / contract; H2 backfill and adoption only on server-side evidence;
Confirm-email impact on existing accounts + recovery plan + SMTP list; farm contact options; M7 role matrix.

| Item | Branch (head) | Migrations (sha256) | App | Scope |
|---|---|---|---|---|
| H1 farm exact location | `security/h1-farm-private-location` (`63b4c92`) | `20261102110000_farm_private_rpc` (`ab3a8cad…1806`) **expand** · `20261102110100_farm_private_columns` (`89785cbb…b081`) **contract** | yes | app |
| H2 account linking (+M5, L1) | `security/h2-account-linking` (`7d9ab6b`) | `20261102150000_line_identity_lookup` (`a53561ff…9c45`) | yes | app |
| M1 farm link guard | `security/m1-farm-link-guard` (`e3a0d13`) | `20261102120000_farm_link_guard` (`fde5c112…b16f`) | no | release |
| M4 `pets.note` | `security/m4-pet-note-private` (`c420590`) | `20261102130000_pet_note_private` (`79bd2b7c…4314`) | 3 lines | app |
| M7 pet-documents storage | `security/m7-pet-documents-storage` (`7c896b7`) | `20261102140000_pet_documents_storage` (`5609244b…8d01`) | no | release |

**Tests (all local / mock):** every pair of branches and each with `codex/ux-audit` merges cleanly; all five merged:
tsc OK; unit / static **20 / 20**; local SQL suites with all migrations **71 / 71** (H1 17, M1 17, M4 8, M7 11, H2 18) +
H1 expand-step suite **6 / 6**; the same H1 / M1 / M4 / M7 suites on the **old schema: 34 of 53 fail** (they still
detect the holes; the H2 suite needs its functions). Shared harness files are byte-identical on every branch;
`supabase/tests/local/auth_stub_h2.sql` (local only) adds the `auth.identities` / password / email-change columns.

## H1 — farm exact location (High)
**Evidence:** farms policies "Public can read / view farms" `USING (true)` + anon / authenticated table SELECT; the
public farm page printed the composed full address (`edit/page.tsx:155` → `farm/[id]/page.tsx:147`).
**Other channels checked (production catalog, read-only):** no view on farms; farms in no Realtime publication;
`pg_graphql` not installed; definer RPCs touching the private columns: `update_business_profile` (returns the stored
row to owner / manager — team, intended), `create_business` (returns ids only), `admin_review_farm_verification`
(admin); embedded selects (`pets → farms(...)`) use column grants; storage holds no address (verification docs are in
the private `verification-docs` bucket). → after the contract step nothing else serves these columns to anon /
non-members.

**Safe order — expand / contract:**
1. **Expand** `20261102110000_farm_private_rpc`: creates `get_farm_private` only; no grant change (old app unaffected).
   Precheck → `expanded`.
2. **Deploy the H1 app** (public columns + RPC; it works on the expanded schema — local suite 6 / 6: old `select *`
   still works, new public-column select + RPC work, RPC refuses stranger / anon).
3. **Verify** on staging / production: farm dashboard, edit (address shown, save, reload), verify page (request →
   pending), public farm page (area only), partner list, pets create; `business_profile_checks.cjs` + E2E.
4. **Contract** `20261102110100_farm_private_columns` (STOPs if the RPC is missing): column grants. Precheck →
   `contracted`, verdict OK, `other_rights_md5` unchanged.
5. **Verify again** (same list + authorization: anon / stranger / owner direct select of private columns 42501).

**Rollback without reopening the hole:** before step 4: app rollback is free; the RPC can stay (harmless). After step
4: do **not** roll the app back past H1 (the old app selects `*`) and do **not** re-grant the table. A page that breaks
is fixed forward (route that read through the RPC). Last resort, owner decision, time-boxed: grant the single missing
column to `authenticated` only (never anon), then remove again. Undoing the contract step is an incident action.

**Data scope (item 4 of the review):**
- Farms — *private*: full address text, house no., room, moo, soi, road, postal code, exact lat / lng, admin
  verification note; verification data (ID cards, house registration, bank book, verification phone) is already in
  `farm_verifications` + private bucket (owner / admin only). *Public area*: sub-district, district, province.
  *Contact the owner entered for buyers*: `phone`, `line_id`, `facebook_link` — **unchanged** (used by the public farm
  page `farm/[id]/page.tsx:335` and the pet page contact `p/[id]/page.tsx:255`).
- Shops / services: same address columns are public; they are storefronts, so unchanged here. Option for later: a
  "home-based business" flag that hides the exact address like farms.
- Options for farm contact (not done, owner decision):
  | Option | Privacy | Effect on contacting a farm |
  |---|---|---|
  | A keep public (today) | contact scrapeable by anyone | none |
  | B per-field owner choice (public / signed-in / hidden) | owner decides | needs a column + RPC; hidden fields disappear from pet / farm pages |
  | C signed-in only (RPC `get_farm_contact`) | stops anonymous scraping, not signed-in scraping | buyers must sign in to see phone / LINE |
  | D contact relay (`contact_leads` exists) | number never shown; farm answers leads | buyer waits for the farm; needs a leads inbox + notification |
  Recommendation: B with default "public" for existing farms (no change for them) and "signed-in" for new ones; later D.

## H2 — account takeover through account linking (High)
**Paths (code + docs):**
1. **Email signup → Google:** Confirm email OFF (`mailer_autoconfirm: true`, `docs/STATUS.md:103`). Supabase links an
   OAuth identity to an existing user with the same *verified* email; with autoconfirm every email signup counts as
   verified → an attacker who signs up first with the victim's address + password is joined by the victim's later
   Google sign-in and keeps password access.
2. **LINE → existing account by LINE email:** the old callback matched `u.email === <LINE email>` and created users
   `email_confirm: true` with it; LINE does not document the email claim as verified.
3. **LINE identity key in `user_metadata`** (user-writable) + `listUsers(1000)`.
4. Trust chain of the LINE flow itself is sound (code → token endpoint server-to-server, state, `/v2/profile`).

**Code (branch):** identity only `app_metadata.line_id` (`find_auth_user_by_line_id`, service_role only); no email
matching, no email scope / id_token; new LINE users get the placeholder email only; >1 holder = conflict; link mode
writes `app_metadata`; unlink server-side (refused if LINE is the only way in); notify / settings / connections read
`app_metadata`; fixed error codes (L1); `user_metadata.line_id` kept as a write-only copy so an app rollback finds the
same accounts.

**Legacy LINE ids — evidence, not trust (review item 2):** `legacy_line_evidence()` (service_role only) classifies
every legacy claim from server-side data only:
| Class | Rule | Action |
|---|---|---|
| verified | placeholder email `line_<id>@line.whiskora.internal` (only our callback creates it), **no password**, exactly one email identity with the current email created with the account (≤ 60 s), no pending email change, `user_metadata.line_id` absent or equal, no other trusted holder | backfill may write `app_metadata.line_id`; the callback also adopts it at that user's next LINE login (the login proves the id) |
| conflict | two trusted holders (app_metadata / verified placeholder) or app_metadata ≠ placeholder | nothing written; login refused `LINE_ACCOUNT_CONFLICT`; admin resolves |
| unverified | a claim only in `user_metadata` (e.g. a real-email account that once linked LINE, or a forged value), a placeholder with a password, a changed email, ids that disagree | **never migrated**; neither gets nor blocks a LINE login; the owner re-links |
| already | app_metadata set and consistent | none |
A forged `user_metadata.line_id` therefore can neither capture a victim's LINE login nor lock the victim out (tested).
Not relied on: that LINE ids are hard to guess. **Re-link (safe path):** the owner signs in with their existing method
(Google / email) → Profile → การเชื่อมต่อ → เชื่อม LINE → `POST /api/auth/line` verifies the session → LINE OAuth →
`app_metadata` set for that verified account. Until then a LINE sign-in for that id creates a *new, separate* LINE
account (placeholder) — announce the re-link before the deploy; merging such an account later is an admin task.
Edge (availability, not takeover): someone who pre-created a placeholder email *with a password* blocks that LINE id's
first sign-in (`LINE_ACCOUNT_MIGRATION_PENDING`) → admin removes that account. Live verification needed: the email
identity / timestamps produced by `admin.createUser` vs. an email signup / email change on the real Auth server
(staging) — the evidence rule depends on them.

**Confirm email and existing accounts (review item 3):**
- `email_confirmed_at` of every account created while autoconfirm was on proves nothing. Turning Confirm email ON
  protects **new** signups only (Supabase does not link OAuth to unconfirmed users and drops their unconfirmed
  identities) — existing autoconfirmed password accounts stay "confirmed", so path 1 stays open for them.
- Groups (counts by `account_linking_audit.sql`, read-only, on approval): `password_email_unproven` (password, no
  Google / Facebook), `password_with_oauth` (password + Google / Facebook), `line_real_email` (LINE-created with a real
  email), and the LINE evidence classes (`line_evidence_report.sql`).
- **Recovery / migration plan (all admin actions, per group, after SMTP works, owner approval each):**
  1. `password_with_oauth` (OAuth proved the address; the password may be an attacker's): revoke sessions, remove the
     password (admin update), keep the OAuth identity; the owner sets a new password through "forgot password" if
     wanted. Data review for the period between the two identities.
  2. `password_email_unproven`: mark the email as unconfirmed (admin) so OAuth will not link into it; the next password
     sign-in asks to confirm the address (confirmation mail) — a genuine owner confirms in one click; an attacker who
     pre-registered someone else's address cannot. Needs the app's "email not confirmed → resend" screen first.
  3. `line_real_email`: switch the account email to its LINE placeholder (the real address becomes an unverified
     contact) so a Google sign-in for that address does not land in it; the owner keeps LINE login and may link Google
     manually while signed in.
  4. Accounts that may already have been joined by path 1 cannot be told apart from honest "password, then Google"
     users by data alone → treat group 1 as above (safe for honest users: they keep Google, reset the password).
  Rollback of each step: re-confirm / restore the previous email or password hash from the admin export taken before
  the step (kept offline, owner only).
- **Interim measure (Phase 1, owner approval of an Auth setting):** Confirm email ON + `emailRedirectTo` (branch) →
  closes path 1 for every *new* signup immediately; existing users sign in as before. Groups 1–3 follow with SMTP.
- **Before turning Confirm email on for real — required setup:** custom SMTP (e.g. Resend) with a verified sending
  domain (`whiskora.pet`: SPF, DKIM, DMARC records), sender address, SMTP credentials entered only in the Supabase
  dashboard; Auth → URL configuration: Site URL `https://www.whiskora.pet`, Redirect URLs = production + Preview hosts
  `/auth/callback` only; templates (Thai) for confirm signup, magic link, reset password, email change; "Secure email
  change" ON; rate limits reviewed; app: "check your email" + resend screen, "email not confirmed" message on login,
  forgot / reset password pages (M6).
- **Staging tests (to approve):** signup → mail arrives (inbox, not spam), link lands on `/auth/callback` → signed in;
  unconfirmed X → Google X → the unconfirmed identity is dropped / no shared account; confirmed password X → Google X
  (documents today's linking for group 1); resend; password reset; email change (both addresses); expired link; the
  LINE evidence shapes (admin-created placeholder vs. email signup vs. email change) on the real Auth server.

**Production order:** audit (read-only) → migration → evidence report + backfill **dry run** (review conflicts /
unverified) → backfill `--apply` (verified only) → deploy the app → Confirm email ON → SMTP → groups 1–3 → M6.
**Rollback:** redeploy the previous app (finds the same accounts through the kept `user_metadata` copy; brings email
matching back — so only briefly); the SQL functions are additive; Confirm email off only as an owner decision.
**Tests:** unit 11 / 11 (decisions, adoption only of verified rows for exactly this id, forged / conflict cases,
backfill writes verified only, sources contain no email / user_metadata lookup, no listUsers, no raw upstream bodies);
local 18 / 18 (classification of forged, password-placeholder, changed-email, mismatch, duplicate holders; privileges).

## M1 — linking pets / litters to any farm (Medium)
Trigger + `caller_can_link_farm` (caller only): only farm owner, workspace owner / manager / staff, admin may link via
the API; unlink / unchanged pass; definer paths unaffected; existing rows untouched (`farm_link_guard_precheck.sql`
counts foreign links). Impact: a **viewer** can no longer add farm pets. Local 17 / 17. Rollback: drop both triggers.

## M4 — `pets.note` (Medium)
Revoke SELECT (note); app no longer selects it (`lib/columns.ts`, `p/[id]/page.tsx`, `pets/[id]/page.tsx` — never
displayed). App first, then migration. Local 8 / 8; static check. Other health data: tiered / private; `vaccine_status`,
`weight`, `microchip_number` public (Low, decision). Rollback: grant the column back (reopens the leak).

## M7 — pet-documents (Medium) and the role matrix (review item 5)
**Prepared now:** storage access decided by the pet relationship (the path only names the pet):
write = pet owner (= today's `pet_documents` table policy), read = owner or `viewer_can_see(pet, 'documents')`. Local
11 / 11; it also fixes the owner not being able to read back documents stored at `<pet id>/…`.
**Proposal (not built; needs `pet_documents.uploaded_by` + table policies + storage policies together):**
| Relation to the pet (`resolve_pet_tags` / tables) | Read | Upload | Edit metadata | Delete |
|---|---|---|---|---|
| current owner (`pets.user_id`) | ✓ | ✓ | ✓ all | ✓ all |
| co-owner (`pet_co_owners`) | ✓ | ✓ | own uploads | own uploads |
| farm team of the pet's farm — owner / manager | ✓ | ✓ | own uploads | own uploads |
| farm team — staff | ✓ | ✓ | own uploads | — |
| farm team — viewer | ✓ (tier) | — | — | — |
| access grant for `documents` (active) | ✓ | — | — | — |
| previous owner / reserved buyer | per tier | — | — | — |
| anyone else / anon | per tier `documents` (default private) | — | — | — |
Each check through one definer function `pet_document_access(pet, action)` using `auth.uid()` (no viewer argument),
used by both the table and storage policies; transfer of ownership revokes co-owner / team rights as today.

## L7 / L8 — unchanged assessment
L7 `service_bookings`: Low now (no app write path, 0 rows) → Medium the day bookings launch (move writes to RPCs
first). L8 `pet-photos`: Low–Medium (URL must be known); private bucket + signed URLs in Phase 2.

## Staging integration plan (no database touched yet)
1. Push the 6 branches, open draft PRs; Codex independent security review on the pinned heads.
2. Create `security/phase1-integration` = main + the 5 branches (merge order H1, M1, M4, M7, H2 — no conflicts) +
   rerun local / static / unit suites on it; one Preview of it (staging).
3. Staging window (owner approval; Codex off staging): precheck each → apply in this order, each followed by its
   postcheck: `110000` (expand) → [Preview of the integration branch is live] → `120000` → `140000` → `150000` →
   `130000` → `110100` (contract) last; then regression (business profile, create business, verification, members,
   workspace guard, partner storage, reservation / transfer, pet privacy, public grants) + E2E full suite + Storage API
   checks for pet-documents (synthetic files) + the Confirm-email scenarios (separate Auth approval).
4. Production per item later, each with its own approval, pinned head and pre / postcheck.

## Approvals needed (nothing below is done)
1. Push + draft PRs (Previews will build). 2. Integration branch + Preview. 3. Staging window (migrations + suites).
4. Read-only production audit / evidence report; backfill **dry run** only. 5. Auth: Confirm email ON (staging first),
SMTP provider + DNS. 6. Recovery steps for groups 1–3 (per group). 7. Decisions: farm contact option, shops / services
address, map precision, M7 matrix, `microchip_number`.
