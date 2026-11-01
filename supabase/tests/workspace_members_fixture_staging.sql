-- whiskora-staging only: farm 9001 workspace = owner 01 (owner row), manager 02, staff 03, viewer 04; no other members;
-- shop 990101 (owner 01, from workspace_guard_fixture_staging.sql) gets a workspace WITHOUT an owner member row;
-- all invitations of these two workspaces removed. Run after transfer_access_reset + workspace_guard fixtures.
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
do $$
declare ws uuid := (select id from public.workspaces where type = 'farm' and entity_id = 9001);
begin
  if to_regclass('public.workspace_invitations') is not null then
    execute 'delete from public.workspace_invitations where workspace_id in (select id from public.workspaces where (type = ''farm'' and entity_id = 9001) or (type = ''shop'' and entity_id = 990101))';
  end if;
  delete from public.workspace_members where workspace_id = ws and user_id not in
    ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004');
  insert into public.workspace_members (workspace_id, user_id, role) values
    (ws, 'a0000000-0000-4000-8000-000000000001', 'owner'), (ws, 'a0000000-0000-4000-8000-000000000002', 'manager'),
    (ws, 'a0000000-0000-4000-8000-000000000003', 'staff'), (ws, 'a0000000-0000-4000-8000-000000000004', 'viewer')
  on conflict (workspace_id, user_id) do update set role = excluded.role;
end $$;
insert into public.workspaces (type, name, owner_id, entity_id)
select 'shop', 'QA-WSM shop ws', 'a0000000-0000-4000-8000-000000000001', 990101
 where not exists (select 1 from public.workspaces where type = 'shop' and entity_id = 990101);
delete from public.workspace_members where workspace_id = (select id from public.workspaces where type = 'shop' and entity_id = 990101);
select (select string_agg(right(m.user_id::text, 2) || ':' || m.role, ',' order by m.user_id) from public.workspace_members m join public.workspaces w on w.id = m.workspace_id where w.type = 'farm' and w.entity_id = 9001) farm,
       (select count(*) from public.workspace_members m join public.workspaces w on w.id = m.workspace_id where w.type = 'shop' and w.entity_id = 990101) shop_rows;
