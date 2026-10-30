-- whiskora-staging only: reset synthetic pets P4/P5 for reservation_api_checks.cjs and the E2E reservation chain
delete from public.pet_ownership_transfers where pet_id in (900004, 900005);
delete from public.pet_reservations where pet_id in (900004, 900005);
update public.pets set user_id='a0000000-0000-4000-8000-000000000001', farm_id=9001, status='เปิดจอง', is_public=true,
  allergies='QA-ALLERGY-' || id where id in (900004, 900005);
select id, right(user_id::text,2) u, farm_id, status, is_public from public.pets where id in (900004,900005) order by id;
