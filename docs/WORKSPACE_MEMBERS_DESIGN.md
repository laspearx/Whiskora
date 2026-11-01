# Workspace members via RPC — design (staging first; not on production)

Status 2026-10-31: **approved by the owner (rules below) — PR A (DB) + PR B (web) built and tested on staging / Preview; not merged, not on production.** Partner audit PR "1 — Members via RPCs"
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

## 2. Approved rules (2026-10-31)
Roles per business workspace (farm / shop / service). **Owner authority comes from the entity owner**
(`farms|shops|services.user_id`), never from an `owner` membership row alone; the owner is the only owner, cannot leave,
and cannot be set through the API. Personal workspaces have no member management. No business transfer in this work.

### 2a. Managing members
| Action | owner | manager | staff | viewer |
|---|---|---|---|---|
| See the member list (name, avatar, role only — no email / phone) | ✅ | ✅ | ✅ | ✅ |
| Invite as **manager** | ✅ | ❌ | ❌ | ❌ |
| Invite as **staff / viewer** | ✅ | ✅ | ❌ | ❌ |
| See / cancel pending invitations | all | the ones for staff / viewer | ❌ | ❌ |
| Change a role manager ↔ staff ↔ viewer | ✅ (not own) | staff ↔ viewer only (no manager, not own) | ❌ | ❌ |
| Remove a manager | ✅ | ❌ | ❌ | ❌ |
| Remove staff / viewer | ✅ | ✅ | ❌ | ❌ |
| Leave (remove own membership) | ❌ | ✅ | ✅ | ✅ |
| Set / transfer owner | ❌ | ❌ | ❌ | ❌ |

### 2c. Invitations (no direct add)
- v1 invites existing accounts found with `search_users_for_invite`; in-app only (no email / LINE / push).
- The invitee sees business name + type, inviter name and role, and can **accept or decline**.
- Expiry: 14 days; inviter / owner / allowed manager can cancel; **one pending invitation per (workspace, invitee)**.
- **On accept, re-check:** the inviter's *current* role must still allow that role (owner, or manager for staff / viewer);
  otherwise the invitation is cancelled and no membership is created.
- Invitee already a member → refused; no silent role change (role changes only via `set_workspace_member_role`).
- Accept twice → same result, one membership; accept vs cancel at the same time → one of them wins, consistent state.
- Not invitable: the caller, the entity owner, existing members.

### 2b. What each role means for business data (unchanged by this work)
| Business data | owner | manager | staff | viewer |
|---|---|---|---|---|
| Farm: team-only pet data (`is_farm_team`) | ✅ | ✅ | ✅ | ✅ |
| Farm: privacy settings (`can_manage_farm_privacy`) | ✅ | ✅ | ❌ | ❌ |
| Farm: record weights (`can_record_pet_weight`) | ✅ | ✅ | ✅ | ❌ |
| Farm: decide reservations (`can_decide_pet_reservation`) | ✅ | ✅ | ❌ | ❌ |
| Farm: transfer pets (`can_transfer_pet`) | ✅ | ❌ | ❌ | ❌ |
| Business images (`can_edit_business_assets`) | ✅ | ✅ | ❌ | ❌ |
| Shop / service profile edit (`shops|services` RLS) | ✅ | ❌ today (partner PR 2) | ❌ | ❌ |

## 3. Implementation (PR A = database, PR B = web; B depends on A)
**PR A — migration `workspace_members_rpc`** (explicit ACL / RLS for every new object):
- `workspace_invitations` (id, workspace_id, invitee_id, invited_by, role ∈ manager/staff/viewer, status ∈
  pending/accepted/declined/cancelled/expired, created_at, expires_at = +14 days, responded_at); unique pending per
  (workspace, invitee); RLS on, no policies, **no API grants** (only through RPCs).
- Helpers (SECURITY DEFINER, no API EXECUTE): `workspace_role_of(ws, uid)` = `owner` if uid owns the entity, else the
  member row role (manager / staff / viewer; an `owner` row of a non-owner is ignored); `workspace_role_can_assign(caller, role)`.
- RPCs (SECURITY DEFINER, EXECUTE for `authenticated` only), each locking the workspace row first (then invitation /
  member rows) so concurrent calls serialise: `list_workspace_members`, `list_workspace_invitations`,
  `invite_workspace_member`, `cancel_workspace_invitation`, `get_my_workspace_invitations`,
  `respond_workspace_invitation(accept|decline)`, `set_workspace_member_role`, `remove_workspace_member` (incl. leave),
  `ensure_workspace_owner_membership` (caller must own the entity; idempotent; for register pages / existing businesses).
- `workspace_members`: drop `members_insert` / `members_delete`; revoke INSERT / UPDATE / DELETE from API roles;
  SELECT = own rows or rows of a workspace the caller belongs to / owns (non-recursive helper). `handle_new_user`
  (personal owner row) unchanged.

**PR B — web:** one shared members panel for farm / shop / service (list, invite via search, pending invitations +
cancel, role change, remove, leave), `/profile/invitations` inbox (accept / decline), register pages call
`ensure_workspace_owner_membership`; every action shows the saved result or the real error (no success on 0 rows /
refusal); role texts match real rights (manager: no pet transfer, no manager management).

**Rollout / compatibility:** the old app's member writes already fail (42P17) or change nothing (no UPDATE policy);
after PR A they are refused (403) — no working path is lost, and no data is written. Reads used by the old app (own
membership rows in layouts / context) keep working. Order: migration (PR A) → app (PR B); no fallback that skips
checks. Compatibility tests: old-app API calls before / after PR A; new app on Preview against staging after PR A.

## 4. Tests (staging, synthetic QA accounts, real REST)
- Every cell of table 2a and every rule in 2c for owner / manager / staff / viewer / stranger, through the RPCs;
  direct INSERT / UPDATE / DELETE on `workspace_members` and any access to `workspace_invitations` refused for API roles;
  an entity owner **without** an owner member row keeps full owner rights.
- No self-promotion (manager → owner / manager adding a manager / staff → manager), no `owner` assignment, no member of
  another business's workspace, no personal-workspace members.
- Concurrency: accept twice / accept vs cancel / two invites for the same person / owner demotes a manager while that
  manager invites → consistent end state, no duplicate membership, no deadlock.
- Table 2b unchanged: farm permission functions for each role identical before / after (snapshot as in PR #19).
- Regression: privacy 128, transfer access 84, reservations 53, workspace guard 21, storage 23, grants 17; E2E for
  the members pages on Preview (staging).

## 5. Decisions (approved 2026-10-31)
1. Managers handle staff / viewer only. 2. Invitations with acceptance, 14-day expiry. 3. Members may leave; the owner
cannot. 4. Every member sees the list of their own businesses (name, avatar, role).
