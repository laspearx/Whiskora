-- whiskora-staging only: synthetic pets for transfer_access_reset_checks.cjs / transfer_access_race_staging.cjs.
-- T1 900011 private farm pet (farm 9001: owner 01, manager 02, staff 03, viewer 04), user 01, co-owner 08,
--    grants by 01: stranger 06 → vaccination (active), buyer 05 → health (expired, not revoked), viewer 04 → weight
--    (revoked earlier); per-pet tiers: weight public, health owner + previous owners, documents private, overview
--    registered; weight rows by 01 (9900011) and by staff 03 (9900012); vaccine row 9900011
-- T2 900012 public personal pet of 01 (multi-hop chain 01 → 05 → 06 → 01)
-- T3 900013 public personal pet of 01 (failure cases, double accept)
-- T4 900014 private personal pet of 01, co-owner 08 (race checks; reset by the race script itself)
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
delete from public.pet_ownership_transfers where pet_id between 900011 and 900014;  -- cascades the revocation history
delete from public.pet_reservations where pet_id between 900011 and 900014;
delete from public.pet_co_owners where pet_id between 900011 and 900014;
delete from public.access_grants where resource_id between 900011 and 900014;
delete from public.pet_visibility_settings where pet_id between 900011 and 900014;
delete from public.pet_weights where pet_id between 900011 and 900014;
delete from public.vaccines where pet_id between 900011 and 900014;
insert into public.pets (id, name, species, user_id, farm_id, status, is_public) values
 (900011, 'QA Transfer Farm Pet T1', 'cat', 'a0000000-0000-4000-8000-000000000001', 9001, 'ไม่ขาย', false),
 (900012, 'QA Transfer Chain T2', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', true),
 (900013, 'QA Transfer Failures T3', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', true),
 (900014, 'QA Transfer Race T4', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', false)
on conflict (id) do nothing;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = 9001, status = 'ไม่ขาย', is_public = false,
  allergies = 'QA-ALLERGY-T1' where id = 900011;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = true,
  allergies = 'QA-ALLERGY-T2' where id in (900012, 900013);
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = false
 where id = 900014;
insert into public.pet_co_owners (pet_id, user_id, added_by) values
 (900011, 'a0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001'),
 (900014, 'a0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001');
insert into public.access_grants (granted_by, grantee_id, resource_type, resource_id, field_group_key, relationship_tag, expires_at, revoked_at) values
 ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', 'pet', 900011, 'vaccination', 'custom', null, null),
 ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'pet', 900011, 'health', 'custom', now() - interval '1 day', null),
 ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'pet', 900011, 'weight', 'custom', null, now() - interval '1 day');
insert into public.pet_visibility_settings (pet_id, field_group_key, tier, include_previous_owner) values
 (900011, 'weight', 'public', false), (900011, 'health', 'owner', true),
 (900011, 'documents', 'private', false), (900011, 'overview', 'registered', false);
insert into public.pet_weights (id, pet_id, weight, user_id) values
 (9900011, 900011, 3.1, 'a0000000-0000-4000-8000-000000000001'),
 (9900012, 900011, 3.2, 'a0000000-0000-4000-8000-000000000003')
on conflict (id) do update set pet_id = excluded.pet_id, user_id = excluded.user_id, notes = null;
insert into public.vaccines (id, pet_id, vaccine_name, date_given) values (9900011, 900011, 'QA-VAC-T1', current_date)
on conflict (id) do update set pet_id = excluded.pet_id, vaccine_name = excluded.vaccine_name;
select id, right(user_id::text, 2) u, farm_id, is_public from public.pets where id between 900011 and 900014 order by id;
