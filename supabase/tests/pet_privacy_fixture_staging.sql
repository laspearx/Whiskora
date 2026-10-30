-- whiskora-staging only: synthetic pets for pet_privacy_checks.cjs (guarded by the staging QA seed).
-- P2 900002 private personal pet (owner 01), co-owner = QA newuser (08), health tier set to public by the owner
-- P6 900006 private + พร้อมย้ายบ้าน on farm 9001, sire = P2, health tier registered, pedigree tier public
-- P7 900007 public personal pet (owner 01), sire = P2 (private), pedigree tier public, grandsire text set
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
delete from public.pet_ownership_transfers where pet_id in (900002, 900006, 900007);
delete from public.pet_reservations where pet_id in (900002, 900006, 900007);
delete from public.pet_visibility_settings where pet_id in (900002, 900006, 900007);
delete from public.pet_co_owners where pet_id in (900002, 900006, 900007);
delete from public.farm_visibility_settings where farm_id = 9001;  -- farm 9001 uses default tiers in the E2E suite
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = false,
  allergies = 'QA-ALLERGY-P2', pedigree_number = 'QA-PED-P2', sire_id = null, dam_id = null where id = 900002;
insert into public.pets (id, name, species, user_id, farm_id, status, is_public)
values (900006, 'QA Private Available P6', 'cat', 'a0000000-0000-4000-8000-000000000001', 9001, 'พร้อมย้ายบ้าน', false),
       (900007, 'QA Public Child P7', 'cat', 'a0000000-0000-4000-8000-000000000001', null, 'ไม่ขาย', true)
on conflict (id) do nothing;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = 9001, status = 'พร้อมย้ายบ้าน', is_public = false,
  allergies = 'QA-ALLERGY-P6', sire_id = 900002, pedigree_number = 'QA-PED-P6' where id = 900006;
update public.pets set user_id = 'a0000000-0000-4000-8000-000000000001', farm_id = null, status = 'ไม่ขาย', is_public = true,
  allergies = 'QA-ALLERGY-P7', sire_id = 900002, pedigree_number = 'QA-PED-P7', paternal_grandsire = 'QA-GS-P7' where id = 900007;
insert into public.pet_co_owners (pet_id, user_id, added_by)
values (900002, 'a0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001');
insert into public.pet_visibility_settings (pet_id, field_group_key, tier, include_previous_owner) values
 (900002, 'health', 'public', false),
 (900006, 'health', 'registered', false), (900006, 'pedigree', 'public', false),
 (900007, 'pedigree', 'public', false);
select id, right(user_id::text,2) u, farm_id, status, is_public, sire_id from public.pets where id in (900002,900006,900007) order by id;
