-- Synthetic QA accounts + data for whiskora-staging ONLY. No real people, no real addresses.
-- Emails use the reserved example.com domain (never delivered). The password is passed in as
-- psql variable :pw from a local chmod-600 file — it is never stored in the repo.
--   O owner  M manager  S staff  V viewer  (farm workspace members)
--   B buyer (confirmed reservation on P1)  X unrelated user (owns P3)  A platform admin
--   N new user: profile left as the signup trigger made it (tests the signup path after a migration)
-- Pets: P1 900001 farm pet, public, status 'เปิดจอง', health filled
--       P2 900002 owner's private pet (is_public=false), health filled
--       P3 900003 X's private pet, health filled
--       P4 900004 / P5 900005 farm pets, public, 'เปิดจอง', NO reservation (E2E_LISTED_PET_ID / _MOBILE)
\set ON_ERROR_STOP on
begin;
do $$ begin
  if current_database() <> 'postgres' or current_user not like 'postgres%' then raise exception 'unexpected target'; end if;
end $$;

create temp table qa_users (k text, id uuid, email text, name text) on commit drop;
insert into qa_users values
  ('O','a0000000-0000-4000-8000-000000000001','whiskora-qa+owner@example.com',   'QA Owner'),
  ('M','a0000000-0000-4000-8000-000000000002','whiskora-qa+manager@example.com', 'QA Manager'),
  ('S','a0000000-0000-4000-8000-000000000003','whiskora-qa+staff@example.com',   'QA Staff'),
  ('V','a0000000-0000-4000-8000-000000000004','whiskora-qa+viewer@example.com',  'QA Viewer'),
  ('B','a0000000-0000-4000-8000-000000000005','whiskora-qa+buyer@example.com',   'QA Buyer'),
  ('X','a0000000-0000-4000-8000-000000000006','whiskora-qa+stranger@example.com','QA Stranger'),
  ('A','a0000000-0000-4000-8000-000000000007','whiskora-qa+admin@example.com',   'QA Admin'),
  ('N','a0000000-0000-4000-8000-000000000008','whiskora-qa+newuser@example.com', 'QA New User');

-- auth users exactly as GoTrue stores an email/password signup (token columns must be '' not NULL)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt(:'pw', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', name), now(), now(),
  '', '', '', '', '', ''
from qa_users on conflict (id) do nothing;
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now()
from qa_users on conflict do nothing;

-- private profile fields (synthetic) — handle_new_user already created the rows
update public.profiles p set phone = '0800000' || right(u.id::text, 3), address = 'QA address ' || u.k,
  house_no = '9/' || u.k, province = 'QA Province', postal_code = '00000', location = 'QA location ' || u.k,
  username = 'qa_' || lower(u.k)
from qa_users u where p.id = u.id and u.k <> 'N';
update public.profiles set role = 'admin' where id = 'a0000000-0000-4000-8000-000000000007';

-- farm + farm workspace with team
insert into public.farms (id, user_id, farm_name, species, phone, owner_name, address, is_verified)
values (9001, 'a0000000-0000-4000-8000-000000000001', 'QA Farm', 'แมว', '0800000999', 'QA Owner', 'QA farm address', false)
on conflict (id) do nothing;
insert into public.workspaces (id, type, name, owner_id, entity_id)
values ('b0000000-0000-4000-8000-000000009001', 'farm', 'QA Farm', 'a0000000-0000-4000-8000-000000000001', 9001)
on conflict (id) do nothing;
insert into public.workspace_members (workspace_id, user_id, role)
select 'b0000000-0000-4000-8000-000000009001', id, r from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid,'owner'), ('a0000000-0000-4000-8000-000000000002','manager'),
  ('a0000000-0000-4000-8000-000000000003','staff'),       ('a0000000-0000-4000-8000-000000000004','viewer')) v(id, r)
where not exists (select 1 from public.workspace_members m where m.workspace_id = 'b0000000-0000-4000-8000-000000009001' and m.user_id = v.id);

-- pets
insert into public.pets (id, name, species, breed, gender, status, is_public, user_id, farm_id,
  blood_type, allergies, chronic_diseases, health_notes, traits, birth_date) values
  (900001, 'QA Kitten P1', 'แมว', 'QA breed', 'ผู้', 'เปิดจอง', true,  'a0000000-0000-4000-8000-000000000001', 9001,
   'A', 'QA-ALLERGY-P1', 'QA-CHRONIC-P1', 'QA-NOTES-P1', 'QA-TRAITS-P1', '2026-06-01'),
  (900002, 'QA Private P2', 'แมว', 'QA breed', 'เมีย', 'ไม่ขาย', false, 'a0000000-0000-4000-8000-000000000001', null,
   'B', 'QA-ALLERGY-P2', 'QA-CHRONIC-P2', 'QA-NOTES-P2', 'QA-TRAITS-P2', '2025-01-01'),
  (900003, 'QA Stranger P3', 'สุนัข', 'QA breed', 'ผู้', 'ไม่ขาย', false, 'a0000000-0000-4000-8000-000000000006', null,
   'AB', 'QA-ALLERGY-P3', 'QA-CHRONIC-P3', 'QA-NOTES-P3', 'QA-TRAITS-P3', '2024-01-01'),
  (900004, 'QA Listed P4', 'แมว', 'QA breed', 'เมีย', 'เปิดจอง', true,  'a0000000-0000-4000-8000-000000000001', 9001,
   'O', 'QA-ALLERGY-P4', null, null, null, '2026-06-01'),
  (900005, 'QA Listed P5', 'แมว', 'QA breed', 'ผู้', 'เปิดจอง', true,  'a0000000-0000-4000-8000-000000000001', 9001,
   'O', 'QA-ALLERGY-P5', null, null, null, '2026-06-01')
on conflict (id) do nothing;
insert into public.vaccines (id, pet_id, vaccine_name, date_given, next_due) values
  (900001, 900001, 'QA vaccine', '2026-08-01', '2027-08-01') on conflict (id) do nothing;
insert into public.pet_weights (id, pet_id, weight, user_id) values
  (900001, 900001, 1.2, 'a0000000-0000-4000-8000-000000000001') on conflict (id) do nothing;
insert into public.pet_activities (id, pet_id, activity_type, title, description) values
  (900001, 900001, 'medical', 'QA vet visit', 'QA-MEDICAL-P1') on conflict (id) do nothing;
insert into public.pet_documents (name, file_url, doc_type, pet_id)
select 'QA doc', 'qa/placeholder.pdf', 'certificate', 900001
where not exists (select 1 from public.pet_documents where pet_id = 900001);
insert into public.pet_reservations (pet_id, buyer_id, status, confirmed_at)
select 900001, 'a0000000-0000-4000-8000-000000000005', 'confirmed', now()
where not exists (select 1 from public.pet_reservations where pet_id = 900001 and buyer_id = 'a0000000-0000-4000-8000-000000000005');

select k, p.id is not null as has_profile, (select count(*) from public.workspaces w where w.owner_id = u.id and w.type='personal') personal_ws
from qa_users u left join public.profiles p on p.id = u.id order by k;
commit;
