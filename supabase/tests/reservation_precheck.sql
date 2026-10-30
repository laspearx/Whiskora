-- Read-only gate before applying 20261030120000_reservation_transfer_pipeline.sql (and its state after).
-- Every row must say ok. state: before = not applied yet, after = applied. No data is changed.
with
fn as (select proname, md5(prosrc) m from pg_proc where pronamespace = 'public'::regnamespace),
pol as (select tablename, policyname from pg_policies where schemaname = 'public'
        and tablename in ('pet_reservations', 'pet_ownership_transfers')),
applied as (select exists (select 1 from fn where proname = 'respond_pet_transfer') a)
select 'state' as check, case when (select a from applied) then 'after' else 'before' end as result
union all
select 'trigger: exactly one on pet_ownership_transfers (no duplicate converted logic)',
  case when (select count(*) from information_schema.triggers where event_object_schema = 'public'
             and event_object_table = 'pet_ownership_transfers') = 1 then 'ok' else 'STOP' end
union all
select 'sync_pet_owner_on_transfer_accept body is the known one (before: 1eb5fccb…, after: d6a6908b…)',
  case (select m from fn where proname = 'sync_pet_owner_on_transfer_accept')
    when '1eb5fccb6e46894da1d379ed704d87e8' then case when (select a from applied) then 'STOP' else 'ok' end
    when 'd6a6908b4ca29667b3ce0d8be64f0b47' then case when (select a from applied) then 'ok' else 'STOP' end
    else 'STOP: unknown body' end
union all
select 'column types (bigint ids, uuid users, text farms.user_id)',
  case when (select count(*) from information_schema.columns where table_schema = 'public' and (
      (table_name = 'pets' and column_name = 'id' and data_type = 'bigint')
   or (table_name = 'pets' and column_name = 'user_id' and data_type = 'uuid')
   or (table_name = 'pets' and column_name = 'farm_id' and data_type = 'bigint')
   or (table_name = 'farms' and column_name = 'user_id' and data_type = 'text')
   or (table_name = 'pet_reservations' and column_name = 'id' and data_type = 'bigint')
   or (table_name = 'pet_ownership_transfers' and column_name = 'reservation_id' and data_type = 'bigint')
   or (table_name = 'workspaces' and column_name = 'entity_id' and data_type = 'bigint'))) = 7 then 'ok' else 'STOP' end
union all
select 'policies on the two tables match the expected set for this state',
  case when (select a from applied) then
    case when (select string_agg(policyname, '|' order by policyname) from pol) =
      'admin can view all reservations|admin can view all transfers|reservations create by buyer|reservations read by buyer or farm team|transfers create by pet owner or farm owner|transfers read by involved parties'
      then 'ok' else 'STOP' end
  else
    case when (select string_agg(policyname, '|' order by policyname) from pol) =
      'admin can view all reservations|admin can view all transfers|reservations create by buyer|reservations read by buyer or farm team|reservations update by buyer or farm team|transfers create by pet manager|transfers read by involved parties|transfers update by buyer or initiator'
      then 'ok' else 'STOP' end
  end
union all
select 'no duplicate pending transfers per pet (new unique index)',
  case when not exists (select 1 from public.pet_ownership_transfers where status = 'pending'
                        group by pet_id having count(*) > 1) then 'ok' else 'STOP' end
union all
select 'no duplicate open reservations per buyer+pet (new unique index)',
  case when not exists (select 1 from public.pet_reservations where status in ('pending', 'confirmed')
                        group by pet_id, buyer_id having count(*) > 1) then 'ok' else 'STOP' end
union all
select 'counts (info): reservations / open / transfers / pending / pets ติดจอง',
  (select count(*) from public.pet_reservations)::text || ' / ' ||
  (select count(*) from public.pet_reservations where status in ('pending', 'confirmed'))::text || ' / ' ||
  (select count(*) from public.pet_ownership_transfers)::text || ' / ' ||
  (select count(*) from public.pet_ownership_transfers where status = 'pending')::text || ' / ' ||
  (select count(*) from public.pets where status = 'ติดจอง')::text
union all
select 'privacy grants unchanged (info: anon/authenticated column grants on pets.allergies)',
  coalesce((select string_agg(grantee || ':' || privilege_type, ',' order by grantee, privilege_type)
            from information_schema.column_privileges where table_schema = 'public' and table_name = 'pets'
              and column_name = 'allergies' and grantee in ('anon', 'authenticated')), 'none');
