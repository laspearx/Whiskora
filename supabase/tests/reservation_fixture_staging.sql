-- whiskora-staging only: reset synthetic pets for reservation_api_checks.cjs and the E2E reservation chain.
-- guard: the synthetic QA seed exists only on staging
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
delete from public.pet_ownership_transfers where pet_id in (900004, 900005, 900006);
delete from public.pet_reservations where pet_id in (900004, 900005, 900006);
update public.pets set user_id='a0000000-0000-4000-8000-000000000001', farm_id=9001, status='เปิดจอง', is_public=true,
  allergies='QA-ALLERGY-' || id where id in (900004, 900005);
-- P6: listed as พร้อมย้ายบ้าน but is_public = false (readable by everyone through the existing
-- "Public can view available pets" policy, must NOT be reservable)
insert into public.pets (id, name, species, user_id, farm_id, status, is_public)
values (900006, 'QA Private Available P6', 'cat', 'a0000000-0000-4000-8000-000000000001', 9001, 'พร้อมย้ายบ้าน', false)
on conflict (id) do update set user_id = excluded.user_id, farm_id = excluded.farm_id, status = excluded.status,
  is_public = excluded.is_public;
select id, right(user_id::text,2) u, farm_id, status, is_public from public.pets where id in (900004,900005,900006) order by id;
