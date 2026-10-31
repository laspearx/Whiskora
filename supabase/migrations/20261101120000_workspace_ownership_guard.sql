-- Workspace ownership guard (hotfix). Closes: any signed-in user could repoint their own workspace
-- (`update workspaces set type='farm', entity_id=<any farm>`) or create a farm / shop / service workspace for an
-- entity they do not own, and then pass every farm permission function that trusts
-- workspaces(type, entity_id) + workspace_members (is_farm_team, can_manage_farm_privacy, can_record_pet_weight,
-- can_transfer_pet, can_decide_pet_reservation, resolve_pet_tags).
--
-- After this migration, for API roles (anon / authenticated):
--   * type / entity_id / owner_id of an existing workspace cannot change (column privileges + trigger);
--     name / avatar_url / updated_at stay editable by the workspace owner (policy unchanged);
--   * a farm / shop / service workspace can only be created by the caller who owns that entity, proven from
--     farms / shops / services.user_id — never from another workspace;
--   * personal workspaces are created only by the system (handle_new_user);
--   * at most one workspace per (type, entity_id).
-- System paths are not affected: handle_new_user / sync_personal_workspace_name and any SECURITY DEFINER code run as
-- their owner (current_user is not anon / authenticated).
-- Not changed here: workspace_members policies (member management is a separate PR), existing rows.

-- refuse (whole transaction rolls back) instead of touching real workspaces if the unique key cannot be created
do $$
declare dup bigint;
begin
  select count(*) into dup from (select 1 from public.workspaces where entity_id is not null group by type, entity_id having count(*) > 1) x;
  if dup > 0 then
    raise exception 'workspaces: % duplicate (type, entity_id) group(s); nothing was changed', dup using errcode = 'P0001';
  end if;
end $$;

-- ownership of the entity, for the caller only (no uid parameter → cannot be used to probe other users)
create or replace function public.caller_owns_workspace_entity(p_type text, p_entity_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and case p_type
    when 'farm'    then exists (select 1 from public.farms    where id = p_entity_id and user_id = auth.uid()::text)
    when 'shop'    then exists (select 1 from public.shops    where id = p_entity_id and user_id = auth.uid()::text)
    when 'service' then exists (select 1 from public.services where id = p_entity_id and user_id = auth.uid()::text)
    else false end;
$$;
revoke all on function public.caller_owns_workspace_entity(text, bigint) from public, anon;
grant execute on function public.caller_owns_workspace_entity(text, bigint) to authenticated;

-- SECURITY INVOKER on purpose: current_user tells API callers (anon / authenticated) from system paths
create or replace function public.workspaces_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.type is distinct from old.type or new.entity_id is distinct from old.entity_id
       or new.owner_id is distinct from old.owner_id then
      raise exception 'workspace type, entity and owner cannot be changed' using errcode = '42501';
    end if;
    return new;
  end if;
  -- INSERT
  if new.type = 'personal' then
    raise exception 'personal workspaces are created by the system' using errcode = '42501';
  end if;
  if new.owner_id is distinct from auth.uid() or new.entity_id is null
     or not public.caller_owns_workspace_entity(new.type, new.entity_id) then
    raise exception 'a workspace needs ownership of its farm, shop or service' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.workspaces_guard() from public, anon;
grant execute on function public.workspaces_guard() to authenticated;

drop trigger if exists workspaces_guard on public.workspaces;
create trigger workspaces_guard before insert or update on public.workspaces
  for each row execute function public.workspaces_guard();

create unique index if not exists workspaces_type_entity_key on public.workspaces (type, entity_id) where entity_id is not null;

-- column privileges: the API may rename / change the avatar of its own workspace (policy), nothing else
revoke update on public.workspaces from anon, authenticated;
grant update (name, avatar_url, updated_at) on public.workspaces to authenticated;
