# Workspace members via RPC — design (staging first; not on production)

Status 2026-10-31: **design for review — no code yet.** Partner audit PR "1 — Members via RPCs"
(`docs/PARTNER_SYSTEM_AUDIT.md`). Builds on the workspace ownership guard (v1.10.1), storage scoping (v1.10.2) and the
grants clean-up (v1.10.3).

## 1. Today (read-only check, production = staging)
| Path | Behaviour |
|---|---|
| `workspace_members` INSERT (members pages, register pages) | **fails for everyone: 42P17 infinite recursion** (members_insert → workspaces → members_select → …). Register pages ignore the error, so new shop / service workspaces have no owner member row (dashboards fall back to `user_id`) |
| UPDATE (role change) | **no policy → 0 rows**, the UI still shows the new role |
| DELETE | workspace owner, or the member themselves |
| SELECT | own rows, or every row of workspaces the caller owns |
| UI intent (`*/members/page.tsx`) | owner + manager can manage (add / change role / remove) everyone except the owner and themselves; role texts: manager "จัดการได้ทุกอย่าง ยกเว้นลบฟาร์ม", staff "เพิ่ม/แก้ไขข้อมูลสัตว์และครอก", viewer "ดูข้อมูลได้อย่างเดียว" |
| Invite search | `search_users_for_invite(query)` (exact email, or username / name match), signed-in only |
| Production data | farm 14 workspaces / 8 owner rows, shop 2 / 1, service 1 / 1, personal 107 / 107; no non-owner members on production |

## 2. Proposed permission table (to approve before coding)
Roles per business workspace (farm / shop / service). "Owner" = the entity owner (`farms|shops|services.user_id`) —
the only `owner` row; never assigned through the API. Personal workspaces have no member management.

### 2a. Managing members
| Action | owner | manager | staff | viewer |
|---|---|---|---|---|
| See the member list of the workspace | ✅ | ✅ | ✅ | ✅ |
| Add a member as **manager** | ✅ | ❌ | ❌ | ❌ |
| Add a member as **staff / viewer** | ✅ | ✅ | ❌ | ❌ |
| Change a member's role between manager / staff / viewer | ✅ (not own) | staff ↔ viewer only (not managers, not own) | ❌ | ❌ |
| Remove a manager | ✅ | ❌ | ❌ | ❌ |
| Remove staff / viewer | ✅ | ✅ | ❌ | ❌ |
| Leave the workspace (remove own row) | ❌ (owner stays) | ✅ | ✅ | ✅ |
| Make someone `owner` / transfer the business | ❌ (out of scope; needs its own flow) | ❌ | ❌ | ❌ |

Rules: nobody changes their own role; one membership per user per workspace; the target user must exist (found via
`search_users_for_invite`); adding is direct (no invitation / acceptance step in v1 — proposed, see §5).

### 2b. What each role means for business data (unchanged by this PR — documented so the table is complete)
| Business data | owner | manager | staff | viewer |
|---|---|---|---|---|
| Farm: team-only pet data (`is_farm_team`) | ✅ | ✅ | ✅ | ✅ |
| Farm: privacy settings (`can_manage_farm_privacy`) | ✅ | ✅ | ❌ | ❌ |
| Farm: record weights (`can_record_pet_weight`) | ✅ | ✅ | ✅ | ❌ |
| Farm: decide reservations (`can_decide_pet_reservation`) | ✅ | ✅ | ❌ | ❌ |
| Farm: transfer pets (`can_transfer_pet`) | ✅ | ❌ | ❌ | ❌ |
| Business images (`can_edit_business_assets`) | ✅ | ✅ | ❌ | ❌ |
| Shop / service profile edit (`shops|services` RLS) | ✅ | ❌ today (partner PR 2) | ❌ | ❌ |

## 3. Implementation plan (after the table is approved)
- **RPCs** (SECURITY DEFINER, `set search_path = public`, EXECUTE for `authenticated` only, explicit ACL per the
  grants rule): `list_workspace_members(ws)`, `add_workspace_member(ws, user, role)`,
  `set_workspace_member_role(member, role)`, `remove_workspace_member(member)`. Each locks the workspace row
  (`for update`) before checking the caller's role → no race between two managers; errors 42501 / P0001 with fixed
  messages (no personal data).
- **Caller role** = `owner` if the caller owns the entity, else their member row (owner rows that exist stay valid;
  missing owner rows on backfilled / register-page workspaces are not required).
- **Table access:** revoke INSERT / UPDATE / DELETE on `workspace_members` from API roles (writes only through RPCs);
  replace the recursive SELECT policy with `user_id = auth.uid() or public.is_workspace_member(workspace_id)`
  (SECURITY DEFINER helper, no recursion). `members_insert` / `members_delete` dropped.
- **System paths kept:** `handle_new_user` (personal owner row), register pages → call one RPC
  `ensure_owner_membership(ws)` (or the create-partner RPC of partner PR 2) instead of a direct insert.
- **App:** farm / shop / service members pages call the RPCs and show real errors; register pages stop inserting
  members directly. Order: migration first (RPCs exist), then app; app falls back only for PGRST202 during the deploy
  window (same pattern as the reservation RPCs).
- **Not in this PR:** shop / service editing by managers, ownership transfer, invitations, notifications.

## 4. Tests (staging, synthetic QA accounts, real REST)
- Every cell of table 2a for owner / manager / staff / viewer / stranger, through the RPCs; direct INSERT / UPDATE /
  DELETE on `workspace_members` refused for API roles.
- No self-promotion (manager → owner / manager adding a manager / staff → manager), no `owner` assignment, no member of
  another business's workspace, no personal-workspace members.
- Concurrency: two managers removing / changing the same member, owner removing a manager while that manager adds
  someone → consistent end state, no deadlock.
- Table 2b unchanged: farm permission functions for each role identical before / after (snapshot as in PR #19).
- Regression: privacy 128, transfer access 84, reservations 53, workspace guard 21, storage 23, grants 17; E2E for
  the members pages on Preview (staging).

## 5. Decisions needed
1. Manager may add / remove **staff and viewer only** (proposed) — the current UI lets a manager add another manager.
2. Direct add (proposed for v1) vs. invitation with acceptance.
3. Leaving: members may leave on their own (proposed); the owner cannot.
4. Should staff get any member-list visibility limits (proposed: all members see the list, emails never shown).
