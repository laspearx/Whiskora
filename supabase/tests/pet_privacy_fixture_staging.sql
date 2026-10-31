-- whiskora-staging only: synthetic pets for pet_privacy_checks.cjs (guarded by the staging QA seed).
-- P2 900002 private personal pet (owner 01), co-owner = QA newuser (08), health tier set to public by the owner
-- P6 900006 private + พร้อมย้ายบ้าน on farm 9001, sire = P2, health tier registered, pedigree tier public
-- P7 900007 public personal pet (owner 01), sire = P2 (private), dam = P8, pedigree tier public, grandsire text set
-- P8 900008 public personal pet (owner 01), pedigree tier default (owner-only), sire = P9, pedigree number set
-- P9 900009 public personal pet (owner 01)
-- P10 900010 private personal pet of the stranger (06) — the attacker's own pet "A" in the grant UPDATE checks
-- access grants by owner 01 on private P2: stranger → vaccination (active), buyer → weight (expired),
--   viewer → vaccination (revoked); by staff 03 on farm pet P6: buyer → vaccination (active) — a creator who no
--   longer has the role to grant (staff cannot create grants)
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
delete from public.pet_ownership_transfers where pet_id in (900002, 900006, 900007, 900010);
delete from public.pet_reservations where pet_id in (900002, 900006, 900007);
delete from public.pet_visibility_settings where pet_id in (900002, 900006, 900007);
delete from public.pet_co_owners where pet_id in (900002, 900006, 900007);
delete from public.access_grants where resource_id in (900002, 900006, 900007, 900008, 900009, 900010);  -- any resource_type (UPDATE checks)
delete from public.pet_ownership_transfers where pet_id in (900008, 900009);
delete from public.pet_visibility_settings where pet_id in (900008, 900009, 900010);
delete from public.farm_visibility_settings where farm_id = 9001;  -- farm 9001 uses default tiers in the E2E suite
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = false,
  allergies = 'QA-ALLERGY-P2', pedigree_number = 'QA-PED-P2', sire_id = null, dam_id = null where id = 900002;
insert into public.pets (id, name, species, user_id, farm_id, status, is_public)
values (900006, 'QA Private Available P6', 'cat', 'a0000000-0000-4000-8000-000000000001', 9001, 'พร้อมย้ายบ้าน', false),
       (900007, 'QA Public Child P7', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', true),
       (900008, 'QA Public Parent P8', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', true),
       (900009, 'QA Public Grandparent P9', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', true),
       (900010, 'QA Attacker Private P10', 'cat', 'a0000000-0000-4000-8000-000000000006', null, 'ไม่ขาย', false)
on conflict (id) do nothing;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = true,
  sire_id = 900009, dam_id = null, pedigree_number = 'QA-PED-P8' where id = 900008;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = true,
  sire_id = null, dam_id = null where id = 900009;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000006', farm_id = null, status = 'ไม่ขาย', is_public = false,
  sire_id = null, dam_id = null where id = 900010;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = 9001, status = 'พร้อมย้ายบ้าน', is_public = false,
  allergies = 'QA-ALLERGY-P6', sire_id = 900002, pedigree_number = 'QA-PED-P6' where id = 900006;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = true,
  allergies = 'QA-ALLERGY-P7', sire_id = 900002, dam_id = 900008, pedigree_number = 'QA-PED-P7', paternal_grandsire = 'QA-GS-P7' where id = 900007;
insert into public.pet_co_owners (pet_id, user_id, added_by)
values (900002, 'a0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001');
insert into public.pet_visibility_settings (pet_id, field_group_key, tier, include_previous_owner) values
 (900002, 'health', 'public', false),
 (900006, 'health', 'registered', false), (900006, 'pedigree', 'public', false),
 (900007, 'pedigree', 'public', false);
-- one synthetic vaccine row on P2 (id 9900002) to prove a vaccination grant opens exactly that table
insert into public.vaccines (id, pet_id, vaccine_name, date_given) values (9900002, 900002, 'QA-VAC-P2', current_date)
on conflict (id) do update set pet_id = excluded.pet_id, vaccine_name = excluded.vaccine_name;
-- one weight row on P7 recorded by owner 01 (id 9900007) — shows what stays with the old owner after a transfer
insert into public.pet_weights (id, pet_id, weight, user_id) values (9900007, 900007, 4.2, 'a0000000-0000-4000-8000-000000000001')
on conflict (id) do update set pet_id = excluded.pet_id, user_id = excluded.user_id;
insert into public.access_grants (granted_by, grantee_id, resource_type, resource_id, field_group_key, relationship_tag, expires_at, revoked_at) values
 ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', 'pet', 900002, 'vaccination', 'custom', null, null),
 ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', 'pet', 900002, 'weight', 'custom', now() - interval '1 day', null),
 ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'pet', 900002, 'vaccination', 'custom', null, now() - interval '1 hour'),
 ('a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', 'pet', 900006, 'vaccination', 'custom', null, null);
select id, right(user_id::text,2) u, farm_id, status, is_public, sire_id from public.pets where id in (900002,900006,900007,900008,900009,900010) order by id;
