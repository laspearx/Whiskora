-- Read-only gate for 20261031120000_transfer_access_reset.sql (before applying, and after as a postcheck).
-- ok / STOP / WARN / info. STOP → do not apply. Never edit or delete real rows to make it pass. Counts only.
with
fn as (select proname, md5(prosrc) m from pg_proc where pronamespace = 'public'::regnamespace),
applied as (select to_regclass('public.pet_transfer_access_revocations') is not null a),
wpol as (select array_agg(policyname::text order by policyname) p from pg_policies where schemaname = 'public' and tablename = 'pet_weights'),
trg as (select array_agg(tgname::text order by tgname) t from pg_trigger
        where not tgisinternal and tgrelid in ('public.pet_co_owners'::regclass, 'public.access_grants'::regclass,
                                               'public.pet_visibility_settings'::regclass, 'public.pet_weights'::regclass,
                                               'public.pet_ownership_transfers'::regclass))
select 1 as n, 'state' as check, case when (select a from applied) then 'after' else 'before' end as result
union all
select 2, 'v1.7.1 privacy state present (pet_visible_to, access_grants_revoke_only)',
  case when exists (select 1 from fn where proname = 'pet_visible_to') and exists (select 1 from fn where proname = 'access_grants_revoke_only')
       then 'ok' else 'STOP: apply 20261030140000 (v1.7.1) first' end
union all
select 3, 'function bodies are the known ones for this state (md5)',
  case when (select a from applied) then
    case when (select m from fn where proname = 'respond_pet_transfer') = 'b3157dd14ac4b4c1ec6c91fe3326e831'
          and (select m from fn where proname = 'viewer_can_see') = 'afd80a08c47c15071c128efa8af45a16'
          and (select m from fn where proname = 'sync_pet_owner_on_transfer_accept') <> 'd6a6908b4ca29667b3ce0d8be64f0b47'
          and (select m from fn where proname = 'resolve_pet_tags') <> '4ca1504b061d5862d71df26887a4c016'
         then 'ok' else 'STOP: unexpected body' end
  else
    case when (select m from fn where proname = 'sync_pet_owner_on_transfer_accept') = 'd6a6908b4ca29667b3ce0d8be64f0b47'
          and (select m from fn where proname = 'resolve_pet_tags') = '4ca1504b061d5862d71df26887a4c016'
          and (select m from fn where proname = 'respond_pet_transfer') = 'b3157dd14ac4b4c1ec6c91fe3326e831'
          and (select m from fn where proname = 'viewer_can_see') = 'afd80a08c47c15071c128efa8af45a16'
         then 'ok' else 'STOP: unexpected body' end
  end
union all
select 4, 'before: no new object exists yet (no half-applied state)',
  case when (select a from applied) then 'ok (after)'
       when exists (select 1 from fn where proname in ('can_record_pet_weight', 'pet_weights_keep_recorder', 'pet_access_write_recheck'))
       then 'STOP: partially applied' else 'ok' end
union all
select 5, 'pet_weights policies for this state',
  case when (select a from applied) then
    case when (select p from wpol) = array['pet weights delete by owner or team', 'pet weights insert by owner or team',
                                          'pet weights read by owner or team', 'pet weights update by owner or team',
                                          'weight field-group visibility'] then 'ok' else 'STOP' end
  else
    case when (select p from wpol) = array['Users manage own pet weights', 'weight field-group visibility'] then 'ok'
         else 'STOP: pet_weights policies differ from the reviewed state' end
  end
union all
select 6, 'triggers on the touched tables for this state',
  case when (select a from applied) then
    case when (select t from trg) = array['access_grants_insert_recheck', 'access_grants_revoke_only', 'pet_co_owners_recheck',
                                         'pet_visibility_settings_recheck', 'pet_weights_keep_recorder',
                                         'trg_sync_pet_owner_on_transfer_accept'] then 'ok' else 'STOP' end
  else
    case when (select t from trg) = array['access_grants_revoke_only', 'trg_sync_pet_owner_on_transfer_accept'] then 'ok'
         else 'STOP: triggers differ from the reviewed state' end
  end
union all
select 7, 'history table: RLS on, API cannot write (after)',
  case when not (select a from applied) then 'ok (before)'
       when (select relrowsecurity from pg_class where oid = to_regclass('public.pet_transfer_access_revocations'))
        and not exists (select 1 from information_schema.role_table_grants where table_schema = 'public'
                          and table_name = 'pet_transfer_access_revocations' and grantee in ('anon', 'authenticated')
                          and privilege_type <> 'SELECT')
        and not exists (select 1 from information_schema.role_table_grants where table_schema = 'public'
                          and table_name = 'pet_transfer_access_revocations' and grantee = 'anon')
       then 'ok' else 'STOP' end
-- who is affected (WARN = behaves differently after apply; never change these rows to pass)
union all
select 10, 'pending transfers (accepting one after apply removes co-owners / grants and resets tiers)',
  case when c = 0 then 'ok' else 'WARN: ' || c end from (select count(*) c from public.pet_ownership_transfers where status = 'pending') x
union all
select 11, 'pets with co-owners / active grants / per-pet settings (info: removed or reset only on a future accept)',
  (select count(distinct pet_id) from public.pet_co_owners)::text || ' / ' ||
  (select count(distinct resource_id) from public.access_grants where resource_type = 'pet' and revoked_at is null)::text || ' / ' ||
  (select count(distinct pet_id) from public.pet_visibility_settings)::text
union all
select 12, 'weight rows whose recorder is not the pet''s owner / co-owner / farm owner / manager / staff / admin (recorder loses read + edit)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pet_weights w join public.pets p on p.id = w.pet_id
        where w.user_id is not null and not (
              p.user_id = w.user_id
           or exists (select 1 from public.pet_co_owners co where co.pet_id = p.id and co.user_id = w.user_id)
           or (p.farm_id is not null and (
                 exists (select 1 from public.farms f where f.id = p.farm_id and f.user_id = w.user_id::text)
              or exists (select 1 from public.workspaces ws join public.workspace_members m on m.workspace_id = ws.id
                         where ws.type = 'farm' and ws.entity_id = p.farm_id and m.user_id = w.user_id
                           and m.role in ('owner', 'manager', 'staff'))))
           or exists (select 1 from public.profiles pr where pr.id = w.user_id and pr.role = 'admin'))) x
union all
select 13, 'farm viewers (info: can no longer insert weight rows; they could before, for any pet)',
  (select count(*) from public.workspace_members where role = 'viewer')::text
union all
select 14, 'accepted transfers (info: their senders become previous owners — no access unless include_previous_owner)',
  (select count(*) from public.pet_ownership_transfers where status = 'accepted')::text
union all
select 15, 'per-pet / farm settings with include_previous_owner = true (sellers would see these groups)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select (select count(*) from public.pet_visibility_settings where include_previous_owner)
             + (select count(*) from public.farm_visibility_settings where include_previous_owner) c) x
order by 1;
