-- whiskora-staging only: synthetic shop / service of QA owner 01 for workspace_guard_checks.cjs, and clean-up of any
-- workspace the checks may have left. Farm 9001 (owner 01; manager 02, staff 03, viewer 04) and pet T1 900011 come
-- from transfer_access_reset_fixture_staging.sql.
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
-- workspaces created by the checks (never the seeded ones)
delete from public.workspaces where name like 'QA-WSG %';
-- stranger's personal workspace back to personal (a "before" run may have repointed it)
update public.workspaces set type = 'personal', entity_id = null
 where owner_id = 'a0000000-0000-4000-8000-000000000006' and (type <> 'personal' or entity_id is not null)
   and name not like 'QA-WSG %';
delete from public.shops where id between 990101 and 990109;
delete from public.services where id between 990101 and 990109;
insert into public.shops (id, user_id, shop_name, phone) values (990101, 'a0000000-0000-4000-8000-000000000001', 'QA-WSG shop', '000');
insert into public.services (id, user_id, service_name, phone, is_published) values
  (990101, 'a0000000-0000-4000-8000-000000000001', 'QA-WSG service', '000', false),
  (990102, 'a0000000-0000-4000-8000-000000000001', 'QA-WSG service race', '000', false);
select (select count(*) from public.workspaces where owner_id = 'a0000000-0000-4000-8000-000000000006') stranger_ws,
       (select string_agg(m.role, ',' order by m.role) from public.workspace_members m join public.workspaces w on w.id = m.workspace_id
         where w.type = 'farm' and w.entity_id = 9001) farm_9001_roles;
