-- M4 (20261102160000): pets.note not readable through the API; writes and PET_COLUMNS reads unchanged. Rolled back.
insert into auth.users (id, email) values ('e4000000-0000-4000-8000-000000000001', 'owner@m4.test'), ('e4000000-0000-4000-8000-000000000002', 'other@m4.test');
insert into public.profiles (id, full_name, role) select id, email, 'user' from auth.users where email like '%@m4.test';
insert into public.pets (id, name, user_id, is_public, note) values (994001, 'M4 pet', 'e4000000-0000-4000-8000-000000000001', true, 'health history');

select pg_temp.try('M4', 'anon cannot read note of a public pet', 'anon', null, 'select note from public.pets where id = 994001', '42501');
select pg_temp.try('M4', 'other user cannot read note', 'authenticated', 'e4000000-0000-4000-8000-000000000002', 'select note from public.pets where id = 994001', '42501');
select pg_temp.try('M4', 'owner cannot read note through the API either', 'authenticated', 'e4000000-0000-4000-8000-000000000001', 'select note from public.pets where id = 994001', '42501');
select pg_temp.try('M4', 'anon reads PET_COLUMNS of a public pet (public page / id card)', 'anon', null,
  'select 1 / (case when (select count(*) from (select id, created_at, name, breed, species, gender, color, pattern, coat, ear, leg, eye_color, birth_date, status, price, image_url, cover_url, gallery_urls, user_id, farm_id, litter_id, is_public, is_neutered, microchip_number, pet_code, vaccine_status, weight from public.pets where id = 994001) x) = 1 then 1 else 0 end)');
select pg_temp.try('M4', 'owner reads PET_COLUMNS (edit page)', 'authenticated', 'e4000000-0000-4000-8000-000000000001',
  'select id, created_at, name, breed, species, gender, color, pattern, coat, ear, leg, eye_color, birth_date, status, price, image_url, cover_url, gallery_urls, user_id, farm_id, litter_id, is_public, is_neutered, microchip_number, pet_code, vaccine_status, weight from public.pets where id = 994001');
select pg_temp.try('M4', 'owner still creates a pet with a note (farm add-pet form)', 'authenticated', 'e4000000-0000-4000-8000-000000000001',
  'insert into public.pets (name, user_id, note) values (''x'', ''e4000000-0000-4000-8000-000000000001'', ''n'') returning id');
select pg_temp.try('M4', 'insert RETURNING note refused', 'authenticated', 'e4000000-0000-4000-8000-000000000001',
  'insert into public.pets (name, user_id, note) values (''x'', ''e4000000-0000-4000-8000-000000000001'', ''n'') returning note', '42501');
select pg_temp.try('M4', 'owner updates note', 'authenticated', 'e4000000-0000-4000-8000-000000000001', 'update public.pets set note = ''n2'' where id = 994001');
