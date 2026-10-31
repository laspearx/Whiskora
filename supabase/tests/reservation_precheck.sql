-- Read-only gate for 20261030120000_reservation_transfer_pipeline.sql (before applying, and after as a postcheck).
-- result: ok / STOP / WARN / info. Any STOP → do not apply; report it. Never edit or delete real rows to turn a
-- STOP or WARN into ok — decide with the owner. state: before = not applied, after = applied. No data is changed.
-- Re-run immediately before applying: production data may have changed since the last run.
with
fn as (select proname, md5(prosrc) m from pg_proc where pronamespace = 'public'::regnamespace),
pol as (select tablename, policyname from pg_policies where schemaname = 'public'
        and tablename in ('pet_reservations', 'pet_ownership_transfers')),
applied as (select exists (select 1 from fn where proname = 'respond_pet_transfer') a),
listed as (select id from public.pets where status in ('พร้อมย้ายบ้าน', 'เปิดจอง') and is_public is not false)
select 1 as n, 'state' as check, case when (select a from applied) then 'after' else 'before' end as result
union all
select 2, 'trigger: exactly one on pet_ownership_transfers (no duplicate converted logic)',
  case when (select count(*) from information_schema.triggers where event_object_schema = 'public'
             and event_object_table = 'pet_ownership_transfers') = 1 then 'ok' else 'STOP' end
union all
select 3, 'function bodies are the known ones for this state (md5)',
  case when (select a from applied) then
    -- sync_pet_owner_on_transfer_accept: d6a69… = 20261030121715; e722eb… = extended by 20261031120000 (transfer access reset)
    case when (select m from fn where proname = 'sync_pet_owner_on_transfer_accept') in ('d6a6908b4ca29667b3ce0d8be64f0b47', 'e722ebf4658cb37bb04e94daec0a46c2')
          and (select m from fn where proname = 'get_my_pending_transfers') = '14301508c0907d63fd1b67f4ae62e89b'
          and (select m from fn where proname = 'farm_set_reservation_status') = '5b435035c0851feb88a409ba19c9c116'
          and (select m from fn where proname = 'respond_pet_transfer') = 'b3157dd14ac4b4c1ec6c91fe3326e831'
          and (select m from fn where proname = 'pet_is_reservable') = 'c78218198e9d8691eab405d85367eec7'
         then 'ok' else 'STOP: unexpected body' end
  else
    case when (select m from fn where proname = 'sync_pet_owner_on_transfer_accept') = '1eb5fccb6e46894da1d379ed704d87e8'
          and (select m from fn where proname = 'get_my_pending_transfers') = '772a2b9348f167aeae0b7f0aa2689f3b'
         then 'ok' else 'STOP: unexpected body' end
  end
union all
select 4, 'before: none of the new function names exist yet (no half-applied state)',
  case when (select a from applied) then 'ok (after)'
       when exists (select 1 from fn where proname in ('farm_set_reservation_status', 'can_decide_pet_reservation',
            'can_transfer_pet', 'pet_is_reservable', 'pet_transfer_insert_ok')) then 'STOP: partially applied' else 'ok' end
union all
select 5, 'column types (bigint ids, uuid users, text farms.user_id, farms.farm_name present)',
  case when (select count(*) from information_schema.columns where table_schema = 'public' and (
      (table_name = 'pets' and column_name = 'id' and data_type = 'bigint')
   or (table_name = 'pets' and column_name = 'user_id' and data_type = 'uuid')
   or (table_name = 'pets' and column_name = 'farm_id' and data_type = 'bigint')
   or (table_name = 'farms' and column_name = 'user_id' and data_type = 'text')
   or (table_name = 'farms' and column_name = 'farm_name')
   or (table_name = 'pet_reservations' and column_name = 'id' and data_type = 'bigint')
   or (table_name = 'pet_ownership_transfers' and column_name = 'reservation_id' and data_type = 'bigint')
   or (table_name = 'workspaces' and column_name = 'entity_id' and data_type = 'bigint'))) = 8 then 'ok' else 'STOP' end
union all
select 6, 'policies on the two tables match the expected set for this state (freeze policies → WARN)',
  case
    when exists (select 1 from pol where policyname like 'freeze:%') then 'WARN: freeze is active'
    when (select a from applied) then
      case when (select string_agg(policyname, '|' order by policyname) from pol) =
        'admin can view all reservations|admin can view all transfers|reservations create by buyer|reservations read by buyer or farm team|transfers create by pet owner or farm owner|transfers read by involved parties'
        then 'ok' else 'STOP' end
    else
      case when (select string_agg(policyname, '|' order by policyname) from pol) =
        'admin can view all reservations|admin can view all transfers|reservations create by buyer|reservations read by buyer or farm team|reservations update by buyer or farm team|transfers create by pet manager|transfers read by involved parties|transfers update by buyer or initiator'
        then 'ok' else 'STOP' end
  end
-- data that would make index creation fail → STOP (apply would abort; decide with the owner, never "clean up")
union all
select 7, 'no duplicate pending transfers per pet (new unique index would fail)',
  case when not exists (select 1 from public.pet_ownership_transfers where status = 'pending'
                        group by pet_id having count(*) > 1) then 'ok' else 'STOP' end
union all
select 8, 'no duplicate open reservations per buyer+pet (new unique index would fail)',
  case when not exists (select 1 from public.pet_reservations where status in ('pending', 'confirmed')
                        group by pet_id, buyer_id having count(*) > 1) then 'ok' else 'STOP' end
-- existing rows the new rules treat differently → WARN with counts (owner decides; rows are left as they are)
union all
select 9, 'pending reservations on pets that are not listed now (cannot be confirmed after apply; can be cancelled)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pet_reservations r where r.status = 'pending'
        and r.pet_id not in (select id from listed)) x
union all
select 10, 'confirmed reservations whose pet is not ติดจอง (state drift)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pet_reservations r join public.pets p on p.id = r.pet_id
        where r.status = 'confirmed' and p.status is distinct from 'ติดจอง') x
union all
select 11, 'pending transfers that the new accept check would refuse (sender no longer owner / reservation not confirmed for receiver)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pet_ownership_transfers t join public.pets p on p.id = t.pet_id
        where t.status = 'pending' and (p.user_id is distinct from t.from_user_id
          or (t.reservation_id is not null and not exists (select 1 from public.pet_reservations r
               where r.id = t.reservation_id and r.status = 'confirmed' and r.buyer_id = t.to_user_id)))) x
union all
select 12, 'pending transfers initiated by someone who could not create them under the new policy (team member / co-owner)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pet_ownership_transfers t join public.pets p on p.id = t.pet_id
        where t.status = 'pending' and t.initiated_by is distinct from p.user_id
          and not exists (select 1 from public.farms f where f.id = p.farm_id and f.user_id = t.initiated_by::text)
          and not exists (select 1 from public.workspaces w join public.workspace_members m on m.workspace_id = w.id
                          where w.type = 'farm' and w.entity_id = p.farm_id and m.user_id = t.initiated_by and m.role = 'owner')) x
union all
select 13, 'self-transfer rows (new CHECK is NOT VALID: existing rows kept, new ones refused)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pet_ownership_transfers where from_user_id = to_user_id) x
union all
select 14, 'listed pets with is_public = false (publicly readable via "Public can view available pets" if พร้อมย้ายบ้าน; not reservable after apply)',
  case when c = 0 then 'ok' else 'WARN: ' || c end
  from (select count(*) c from public.pets where status in ('พร้อมย้ายบ้าน', 'เปิดจอง') and is_public is false) x
union all
select 15, 'counts (info): reservations / open / transfers / pending / pets ติดจอง',
  (select count(*) from public.pet_reservations)::text || ' / ' ||
  (select count(*) from public.pet_reservations where status in ('pending', 'confirmed'))::text || ' / ' ||
  (select count(*) from public.pet_ownership_transfers)::text || ' / ' ||
  (select count(*) from public.pet_ownership_transfers where status = 'pending')::text || ' / ' ||
  (select count(*) from public.pets where status = 'ติดจอง')::text
union all
select 16, 'privacy grants (info: anon/authenticated column grants on pets.allergies — must not change)',
  coalesce((select string_agg(grantee || ':' || privilege_type, ',' order by grantee, privilege_type)
            from information_schema.column_privileges where table_schema = 'public' and table_name = 'pets'
              and column_name = 'allergies' and grantee in ('anon', 'authenticated')), 'none')
order by 1;
