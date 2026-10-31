-- Read-only gate for 20261101120000_workspace_ownership_guard.sql. ok / STOP / WARN / info; counts only.
-- STOP → do not apply; never delete or change real workspaces / members to make it pass — report instead.
with
g as (select to_regprocedure('public.workspaces_guard()') is not null a),
ent as (
  select w.id, w.type, w.owner_id, w.entity_id,
         case w.type when 'farm' then (select f.user_id from farms f where f.id = w.entity_id)
                     when 'shop' then (select s.user_id from shops s where s.id = w.entity_id)
                     when 'service' then (select v.user_id from services v where v.id = w.entity_id) end entity_owner,
         case w.type when 'farm' then exists (select 1 from farms f where f.id = w.entity_id)
                     when 'shop' then exists (select 1 from shops s where s.id = w.entity_id)
                     when 'service' then exists (select 1 from services v where v.id = w.entity_id) end entity_exists
    from workspaces w)
select 1 as n, 'state' as check, case when (select a from g) then 'after' else 'before' end as result
union all
select 2, 'duplicate (type, entity_id) groups (unique index needs 0)',
  case when c = 0 then 'ok' else 'STOP: ' || c end from (select count(*) c from (select 1 from workspaces where entity_id is not null group by type, entity_id having count(*) > 1) x) y
union all
select 3, 'farm / shop / service workspaces whose owner is not the entity owner',
  case when c = 0 then 'ok' else 'STOP: ' || c end from (select count(*) c from ent where type <> 'personal' and entity_owner is distinct from owner_id::text) x
union all
select 4, 'farm / shop / service workspaces without entity_id or pointing to a missing entity',
  case when c = 0 then 'ok' else 'STOP: ' || c end from (select count(*) c from ent where type <> 'personal' and (entity_id is null or not entity_exists)) x
union all
select 5, 'personal workspaces with an entity_id / users with more than one personal workspace',
  (select count(*) from workspaces where type = 'personal' and entity_id is not null)::text || ' / ' ||
  (select count(*) from (select owner_id from workspaces where type = 'personal' group by owner_id having count(*) > 1) x)::text
union all
select 6, 'info: workspaces by type', (select string_agg(type || '=' || n, ' ' order by type) from (select type, count(*) n from workspaces group by type) x)
union all
select 7, 'info: members by workspace type / role (non-owner members = real team members, kept as they are)',
  (select string_agg(t || '/' || r || '=' || n, ' ' order by t, r) from (select w.type t, m.role r, count(*) n from workspace_members m join workspaces w on w.id = m.workspace_id group by 1, 2) x)
union all
select 8, 'members with role owner who are not the workspace owner (farm / shop / service)',
  case when c = 0 then 'ok' else 'WARN: ' || c end from (select count(*) c from workspace_members m join workspaces w on w.id = m.workspace_id where w.type <> 'personal' and m.role = 'owner' and m.user_id <> w.owner_id) x
union all
select 9, 'users without a personal workspace (handle_new_user)',
  (select count(*) from auth.users u where not exists (select 1 from workspaces w where w.owner_id = u.id and w.type = 'personal'))::text
union all
select 10, 'guard objects (after)',
  case when not (select a from g) then '-' else
    (select count(*) from pg_trigger where tgname = 'workspaces_guard' and not tgisinternal)::text || ' trigger / ' ||
    (select count(*) from pg_indexes where indexname = 'workspaces_type_entity_key')::text || ' unique index / update cols ' ||
    coalesce((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
               where table_schema = 'public' and table_name = 'workspaces' and grantee = 'authenticated' and privilege_type = 'UPDATE'), 'none') end
order by 1;
