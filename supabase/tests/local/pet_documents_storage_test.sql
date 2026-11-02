-- M7 (20261102140000): pet-documents objects only under "<pet id>/" by the pet owner; reads by owner / allowed viewers.
-- Synthetic rows, rolled back. (DELETE is not exercised here: storage.protect_delete blocks SQL deletes — Storage API only.)
insert into auth.users (id, email) values
  ('d7000000-0000-4000-8000-000000000001', 'owner@m7.test'), ('d7000000-0000-4000-8000-000000000002', 'coowner@m7.test'),
  ('d7000000-0000-4000-8000-000000000003', 'stranger@m7.test');
insert into public.profiles (id, full_name, role) select id, email, 'user' from auth.users where email like '%@m7.test';
insert into public.pets (id, name, user_id, is_public) values (997001, 'M7 pet', 'd7000000-0000-4000-8000-000000000001', true);
insert into public.pet_co_owners (pet_id, user_id, added_by) values (997001, 'd7000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000001');
insert into storage.buckets (id, name, public) values ('pet-documents', 'pet-documents', false) on conflict (id) do nothing;
insert into storage.objects (bucket_id, name, owner) values ('pet-documents', '997001/existing.pdf', 'd7000000-0000-4000-8000-000000000001');

select pg_temp.try('M7', 'owner uploads under the pet folder (app path)', 'authenticated', 'd7000000-0000-4000-8000-000000000001',
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''997001/new.pdf'')');
select pg_temp.try('M7', 'stranger cannot upload into someone else''s pet folder', 'authenticated', 'd7000000-0000-4000-8000-000000000003',
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''997001/planted.pdf'')', '42501');
select pg_temp.try('M7', 'stranger cannot upload at the bucket root / any other path', 'authenticated', 'd7000000-0000-4000-8000-000000000003',
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''planted.pdf'')', '42501');
select pg_temp.try('M7', 'nobody writes new files under a uid folder any more', 'authenticated', 'd7000000-0000-4000-8000-000000000003',
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''d7000000-0000-4000-8000-000000000003/x.pdf'')', '42501');
select pg_temp.try('M7', 'co-owner cannot upload (same as pet_documents table policy)', 'authenticated', 'd7000000-0000-4000-8000-000000000002',
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''997001/co.pdf'')', '42501');
select pg_temp.try('M7', 'anon cannot upload', 'anon', null,
  'insert into storage.objects (bucket_id, name) values (''pet-documents'', ''997001/anon.pdf'')', '42501');
select pg_temp.try('M7', 'owner can read the pet folder (signed URL works)', 'authenticated', 'd7000000-0000-4000-8000-000000000001',
  'select 1 / (case when (select count(*) from storage.objects where bucket_id = ''pet-documents'' and name = ''997001/existing.pdf'') = 1 then 1 else 0 end)');
select pg_temp.try('M7', 'stranger sees no document object', 'authenticated', 'd7000000-0000-4000-8000-000000000003',
  'select 1 / (case when (select count(*) from storage.objects where bucket_id = ''pet-documents'') = 0 then 1 else 0 end)');
select pg_temp.try('M7', 'owner can rename / update own pet folder object', 'authenticated', 'd7000000-0000-4000-8000-000000000001',
  'update storage.objects set name = ''997001/renamed.pdf'' where bucket_id = ''pet-documents'' and name = ''997001/existing.pdf''');
select pg_temp.try('M7', 'owner cannot move an object into another pet''s folder', 'authenticated', 'd7000000-0000-4000-8000-000000000001',
  'update storage.objects set name = ''123/moved.pdf'' where bucket_id = ''pet-documents'' and name like ''997001/%''', '42501');
select pg_temp.try('M7', 'helper not callable by anon', 'anon', null, 'select public.pet_document_folder_access(''997001'', false)', '42501');
