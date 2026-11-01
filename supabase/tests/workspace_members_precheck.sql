-- Read-only gate for 20261101150000_workspace_members_rpc.sql. ok / STOP / info; counts only.
-- STOP → do not apply; never change real workspaces / members / invitations to make it pass.
select 1 as n, 'state' as check, case when to_regprocedure('public.invite_workspace_member(uuid,uuid,text)') is null then 'before' else 'after' end as result
union all
select 2, 'workspace ownership guard (v1.10.1) installed', case when to_regprocedure('public.workspaces_guard()') is not null then 'ok' else 'STOP: install 20261031135523 first' end
union all
select 3, 'unique (workspace_id, user_id) on workspace_members',
  case when exists (select 1 from pg_constraint where conrelid = 'public.workspace_members'::regclass and contype = 'u'
        and pg_get_constraintdef(oid) = 'UNIQUE (workspace_id, user_id)') then 'ok' else 'STOP' end
union all
select 4, 'business members with role owner who are not the entity owner',
  case when c = 0 then 'ok' else 'STOP: ' || c end from (select count(*) c from workspace_members m join workspaces w on w.id = m.workspace_id
    where w.type <> 'personal' and m.role = 'owner' and m.user_id::text is distinct from
      (case w.type when 'farm' then (select f.user_id from farms f where f.id = w.entity_id) when 'shop' then (select s.user_id from shops s where s.id = w.entity_id)
                   when 'service' then (select v.user_id from services v where v.id = w.entity_id) end)) x
union all
select 5, 'info: business workspaces / with an owner row / non-owner members',
  (select count(*) from workspaces where type <> 'personal')::text || ' / ' ||
  (select count(*) from workspaces w where w.type <> 'personal' and exists (select 1 from workspace_members m where m.workspace_id = w.id and m.role = 'owner'))::text || ' / ' ||
  (select count(*) from workspace_members m join workspaces w on w.id = m.workspace_id where w.type <> 'personal' and m.role <> 'owner')::text
union all
select 6, 'workspace_members API privileges (after: SELECT only) / policies',
  coalesce((select string_agg(distinct privilege_type, ',' order by privilege_type) from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'workspace_members' and grantee in ('anon', 'authenticated')), '-') || ' / ' ||
  (select string_agg(policyname || ':' || cmd, ',' order by policyname) from pg_policies where tablename = 'workspace_members')
union all
select 7, 'workspace_invitations (after): RLS on, no API grants',
  case when to_regclass('public.workspace_invitations') is null then '- (before)'
       when (select relrowsecurity from pg_class where oid = to_regclass('public.workspace_invitations'))
        and not exists (select 1 from information_schema.role_table_grants where table_schema = 'public' and table_name = 'workspace_invitations' and grantee in ('anon', 'authenticated', 'PUBLIC'))
       then 'ok' else 'STOP' end
union all
select 8, 'members RPC EXECUTE (after): authenticated only',
  case when to_regprocedure('public.invite_workspace_member(uuid,uuid,text)') is null then '-' else
    (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('list_workspace_members', 'list_workspace_invitations',
      'invite_workspace_member', 'cancel_workspace_invitation', 'get_my_workspace_invitations', 'respond_workspace_invitation', 'set_workspace_member_role',
      'remove_workspace_member', 'ensure_workspace_owner_membership') and has_function_privilege('authenticated', p.oid, 'execute')
      and not has_function_privilege('anon', p.oid, 'execute'))::text || ' / 9' end
order by 1;
