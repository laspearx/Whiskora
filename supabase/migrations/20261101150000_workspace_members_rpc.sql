-- Workspace members through RPCs + invitations (docs/WORKSPACE_MEMBERS_DESIGN.md, approved 2026-10-31).
-- * Owner authority = the entity owner (farms|shops|services.user_id), never an `owner` membership row alone.
-- * Members are added only by accepting an invitation; inviter rights are re-checked at accept time.
-- * Managers handle staff / viewer only; nobody changes their own role; the owner cannot leave; no owner via the API.
-- * workspace_members: no direct INSERT / UPDATE / DELETE for API roles; non-recursive SELECT (own rows + rows of
--   workspaces the caller belongs to / owns). Business-data powers of each role are not changed here.
-- Every object below gets explicit ACL / RLS (grants rule, v1.10.3).

-- ── invitations ──────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'staff', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  responded_at timestamptz
);
create unique index if not exists workspace_invitations_one_pending on public.workspace_invitations (workspace_id, invitee_id) where status = 'pending';
create index if not exists workspace_invitations_invitee_pending on public.workspace_invitations (invitee_id) where status = 'pending';
alter table public.workspace_invitations enable row level security;
revoke all on public.workspace_invitations from public, anon, authenticated;
grant select, insert, update, delete on public.workspace_invitations to service_role;

-- ── helpers (no API EXECUTE except the one RLS needs) ─────────────────────────────────────────────────────────
create or replace function public.workspace_entity_owner(p_ws uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select case w.type
    when 'farm'    then (select nullif(f.user_id, '')::uuid from public.farms f where f.id = w.entity_id and f.user_id ~ '^[0-9a-f-]{36}$')
    when 'shop'    then (select nullif(s.user_id, '')::uuid from public.shops s where s.id = w.entity_id and s.user_id ~ '^[0-9a-f-]{36}$')
    when 'service' then (select nullif(v.user_id, '')::uuid from public.services v where v.id = w.entity_id and v.user_id ~ '^[0-9a-f-]{36}$')
    end
  from public.workspaces w where w.id = p_ws;
$$;

-- 'owner' (entity owner) | 'manager' | 'staff' | 'viewer' | null; personal workspaces → null (no member management)
create or replace function public.workspace_role_of(p_ws uuid, p_uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when p_uid is null then null
    when public.workspace_entity_owner(p_ws) = p_uid then 'owner'
    else (select m.role from public.workspace_members m join public.workspaces w on w.id = m.workspace_id
           where m.workspace_id = p_ws and m.user_id = p_uid and w.type <> 'personal' and m.role in ('manager', 'staff', 'viewer'))
  end;
$$;

create or replace function public.workspace_role_can_assign(p_caller text, p_role text)
returns boolean language sql immutable set search_path = public as $$
  select (p_caller = 'owner' and p_role in ('manager', 'staff', 'viewer')) or (p_caller = 'manager' and p_role in ('staff', 'viewer'));
$$;

-- RLS helper: caller belongs to / owns the workspace (members of any role, workspace owner, entity owner)
create or replace function public.is_workspace_participant(p_ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    exists (select 1 from public.workspaces w where w.id = p_ws and w.owner_id = auth.uid())
    or exists (select 1 from public.workspace_members m where m.workspace_id = p_ws and m.user_id = auth.uid())
    or public.workspace_entity_owner(p_ws) = auth.uid());
$$;

revoke all on function public.workspace_entity_owner(uuid) from public, anon, authenticated;
revoke all on function public.workspace_role_of(uuid, uuid) from public, anon, authenticated;
revoke all on function public.workspace_role_can_assign(text, text) from public, anon, authenticated;
revoke all on function public.is_workspace_participant(uuid) from public, anon;
grant execute on function public.is_workspace_participant(uuid) to authenticated;

-- ── RPCs (SECURITY DEFINER; lock order: workspace → invitation → member) ──────────────────────────────────────
create or replace function public.list_workspace_members(p_workspace uuid)
returns table (member_id uuid, user_id uuid, full_name text, avatar_url text, role text, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare v_owner uuid := public.workspace_entity_owner(p_workspace);
begin
  if public.workspace_role_of(p_workspace, auth.uid()) is null then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  return query
    select (select m.id from public.workspace_members m where m.workspace_id = p_workspace and m.user_id = v_owner),
           v_owner, p.full_name, p.avatar_url, 'owner'::text, v_owner = auth.uid()
      from public.profiles p where p.id = v_owner
    union all
    select m.id, m.user_id, p.full_name, p.avatar_url, m.role, m.user_id = auth.uid()
      from public.workspace_members m left join public.profiles p on p.id = m.user_id
     where m.workspace_id = p_workspace and m.role in ('manager', 'staff', 'viewer') and m.user_id is distinct from v_owner;
end $$;

create or replace function public.list_workspace_invitations(p_workspace uuid)
returns table (invitation_id uuid, invitee_id uuid, full_name text, avatar_url text, role text, invited_by_name text,
               created_at timestamptz, expires_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v_role text := public.workspace_role_of(p_workspace, auth.uid());
begin
  if v_role not in ('owner', 'manager') or v_role is null then
    raise exception 'only the owner or a manager can see invitations' using errcode = '42501';
  end if;
  return query
    select i.id, i.invitee_id, p.full_name, p.avatar_url, i.role, ib.full_name, i.created_at, i.expires_at
      from public.workspace_invitations i
      left join public.profiles p on p.id = i.invitee_id left join public.profiles ib on ib.id = i.invited_by
     where i.workspace_id = p_workspace and i.status = 'pending' and i.expires_at > now()
       and public.workspace_role_can_assign(v_role, i.role)
     order by i.created_at;
end $$;

create or replace function public.invite_workspace_member(p_workspace uuid, p_invitee uuid, p_role text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_role text; v_id uuid;
begin
  perform 1 from public.workspaces where id = p_workspace for update;
  if not found then raise exception 'workspace not found' using errcode = 'PT404'; end if;
  v_role := public.workspace_role_of(p_workspace, auth.uid());
  if not coalesce(public.workspace_role_can_assign(v_role, p_role), false) then
    raise exception 'you cannot invite with this role' using errcode = '42501';
  end if;
  if p_invitee is null or not exists (select 1 from auth.users where id = p_invitee) then
    raise exception 'user not found' using errcode = 'PT404';
  end if;
  if p_invitee = auth.uid() or public.workspace_role_of(p_workspace, p_invitee) is not null
     or exists (select 1 from public.workspace_members where workspace_id = p_workspace and user_id = p_invitee) then
    raise exception 'already a member of this business' using errcode = 'P0001';
  end if;
  update public.workspace_invitations set status = 'expired', responded_at = now()
   where workspace_id = p_workspace and invitee_id = p_invitee and status = 'pending' and expires_at <= now();
  begin
    insert into public.workspace_invitations (workspace_id, invitee_id, invited_by, role)
    values (p_workspace, p_invitee, auth.uid(), p_role) returning id into v_id;
  exception when unique_violation then
    raise exception 'an invitation is already pending for this user' using errcode = 'P0001';
  end;
  return v_id;
end $$;

create or replace function public.cancel_workspace_invitation(p_invitation uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_inv public.workspace_invitations%rowtype; v_role text;
begin
  select workspace_id into v_ws from public.workspace_invitations where id = p_invitation;
  if v_ws is null then raise exception 'invitation not found' using errcode = 'PT404'; end if;
  perform 1 from public.workspaces where id = v_ws for update;
  select * into v_inv from public.workspace_invitations where id = p_invitation for update;
  v_role := public.workspace_role_of(v_ws, auth.uid());
  if not coalesce(public.workspace_role_can_assign(v_role, v_inv.role), false) then
    raise exception 'you cannot cancel this invitation' using errcode = '42501';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'invitation is no longer pending' using errcode = 'P0001';
  end if;
  update public.workspace_invitations set status = 'cancelled', responded_at = now() where id = p_invitation;
  return 'cancelled';
end $$;

create or replace function public.get_my_workspace_invitations()
returns table (invitation_id uuid, workspace_id uuid, workspace_type text, business_name text, role text,
               invited_by_name text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, w.id, w.type, w.name, i.role, ib.full_name, i.created_at, i.expires_at
    from public.workspace_invitations i join public.workspaces w on w.id = i.workspace_id
    left join public.profiles ib on ib.id = i.invited_by
   where i.invitee_id = auth.uid() and i.status = 'pending' and i.expires_at > now()
   order by i.created_at desc;
$$;

-- returns the outcome: accepted | declined | expired | invalid_inviter | already_member
-- (status changes are kept even when no membership is created, so the outcome is a value, not an exception)
create or replace function public.respond_workspace_invitation(p_invitation uuid, p_action text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_inv public.workspace_invitations%rowtype; v_inviter_role text;
begin
  if p_action not in ('accept', 'decline') then raise exception 'invalid action' using errcode = '22023'; end if;
  select workspace_id into v_ws from public.workspace_invitations where id = p_invitation and invitee_id = auth.uid();
  if v_ws is null then raise exception 'invitation not found' using errcode = 'PT404'; end if;
  perform 1 from public.workspaces where id = v_ws for update;
  select * into v_inv from public.workspace_invitations where id = p_invitation for update;
  if v_inv.status = 'accepted' and p_action = 'accept' then return 'accepted'; end if;     -- repeated accept
  if v_inv.status = 'declined' and p_action = 'decline' then return 'declined'; end if;
  if v_inv.status <> 'pending' then raise exception 'invitation is no longer pending' using errcode = 'P0001'; end if;
  if v_inv.expires_at <= now() then
    update public.workspace_invitations set status = 'expired', responded_at = now() where id = p_invitation;
    return 'expired';
  end if;
  if p_action = 'decline' then
    update public.workspace_invitations set status = 'declined', responded_at = now() where id = p_invitation;
    return 'declined';
  end if;
  v_inviter_role := public.workspace_role_of(v_ws, v_inv.invited_by);
  if not coalesce(public.workspace_role_can_assign(v_inviter_role, v_inv.role), false) then
    update public.workspace_invitations set status = 'cancelled', responded_at = now() where id = p_invitation;
    return 'invalid_inviter';
  end if;
  if public.workspace_role_of(v_ws, auth.uid()) is not null
     or exists (select 1 from public.workspace_members where workspace_id = v_ws and user_id = auth.uid()) then
    update public.workspace_invitations set status = 'cancelled', responded_at = now() where id = p_invitation;
    return 'already_member';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (v_ws, auth.uid(), v_inv.role);
  update public.workspace_invitations set status = 'accepted', responded_at = now() where id = p_invitation;
  return 'accepted';
end $$;

create or replace function public.set_workspace_member_role(p_member uuid, p_role text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_m public.workspace_members%rowtype; v_role text;
begin
  select workspace_id into v_ws from public.workspace_members where id = p_member;
  if v_ws is null then raise exception 'member not found' using errcode = 'PT404'; end if;
  perform 1 from public.workspaces where id = v_ws for update;
  select * into v_m from public.workspace_members where id = p_member for update;
  if v_m.id is null then raise exception 'member not found' using errcode = 'PT404'; end if;
  v_role := public.workspace_role_of(v_ws, auth.uid());
  if v_m.user_id = auth.uid() then raise exception 'you cannot change your own role' using errcode = '42501'; end if;
  if v_m.role not in ('manager', 'staff', 'viewer') or public.workspace_entity_owner(v_ws) = v_m.user_id
     or not coalesce(public.workspace_role_can_assign(v_role, v_m.role), false)
     or not coalesce(public.workspace_role_can_assign(v_role, p_role), false) then
    raise exception 'you cannot change this role' using errcode = '42501';
  end if;
  update public.workspace_members set role = p_role where id = p_member;
  return p_role;
end $$;

create or replace function public.remove_workspace_member(p_member uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_ws uuid; v_m public.workspace_members%rowtype; v_role text;
begin
  select workspace_id into v_ws from public.workspace_members where id = p_member;
  if v_ws is null then raise exception 'member not found' using errcode = 'PT404'; end if;
  perform 1 from public.workspaces where id = v_ws for update;
  select * into v_m from public.workspace_members where id = p_member for update;
  if v_m.id is null then raise exception 'member not found' using errcode = 'PT404'; end if;
  v_role := public.workspace_role_of(v_ws, auth.uid());
  if v_m.user_id = auth.uid() then
    if v_role in ('manager', 'staff', 'viewer') then                -- leave
      delete from public.workspace_members where id = p_member;
      return 'left';
    end if;
    raise exception 'the owner cannot leave the business' using errcode = '42501';
  end if;
  if v_m.role not in ('manager', 'staff', 'viewer') or public.workspace_entity_owner(v_ws) = v_m.user_id
     or not coalesce(public.workspace_role_can_assign(v_role, v_m.role), false) then
    raise exception 'you cannot remove this member' using errcode = '42501';
  end if;
  delete from public.workspace_members where id = p_member;
  return 'removed';
end $$;

-- register pages / existing businesses without an owner row: idempotent, only for the real entity owner
create or replace function public.ensure_workspace_owner_membership(p_workspace uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  perform 1 from public.workspaces where id = p_workspace and type <> 'personal' for update;
  if not found or public.workspace_entity_owner(p_workspace) is distinct from auth.uid() then
    raise exception 'only the owner of this business can do this' using errcode = '42501';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (p_workspace, auth.uid(), 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner' where public.workspace_members.role <> 'owner';
  return 'owner';
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.list_workspace_members(uuid)', 'public.list_workspace_invitations(uuid)',
    'public.invite_workspace_member(uuid, uuid, text)', 'public.cancel_workspace_invitation(uuid)',
    'public.get_my_workspace_invitations()', 'public.respond_workspace_invitation(uuid, text)',
    'public.set_workspace_member_role(uuid, text)', 'public.remove_workspace_member(uuid)',
    'public.ensure_workspace_owner_membership(uuid)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ── workspace_members: writes only through the RPCs above; non-recursive read ────────────────────────────────
drop policy if exists members_insert on public.workspace_members;
drop policy if exists members_delete on public.workspace_members;
drop policy if exists members_select on public.workspace_members;
revoke insert, update, delete on public.workspace_members from anon, authenticated;
create policy members_select on public.workspace_members for select to authenticated
  using (user_id = auth.uid() or public.is_workspace_participant(workspace_id));
