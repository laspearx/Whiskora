-- Read-only gate before / after 20261102140000 (M7). Run inside `begin read only; … rollback;`. Counts only.
-- state: before (unrestricted INSERT policy present) | after. objects_*: pet-documents objects by first folder:
-- pet id (the app's path), a uid (older path, still readable by its owner), other (root / unknown — review by count).
-- orphan_pet_folder: objects under a pet id that no longer exists.
select
  case when exists (select 1 from pg_policy where polrelid = 'storage.objects'::regclass and polname = 'authenticated upload pet-documents') then 'before'
       when exists (select 1 from pg_policy where polrelid = 'storage.objects'::regclass and polname = 'pet-documents insert by pet owner') then 'after'
       else 'unknown' end state,
  (select count(*) from storage.objects where bucket_id = 'pet-documents') objects_total,
  (select count(*) from storage.objects where bucket_id = 'pet-documents' and (storage.foldername(name))[1] ~ '^\d+$') objects_pet_folder,
  (select count(*) from storage.objects where bucket_id = 'pet-documents' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$') objects_uid_folder,
  (select count(*) from storage.objects where bucket_id = 'pet-documents' and coalesce((storage.foldername(name))[1], '') !~ '^(\d+|[0-9a-f-]{36})$') objects_other,
  (select count(*) from storage.objects o where bucket_id = 'pet-documents' and (storage.foldername(name))[1] ~ '^\d+$'
     and not exists (select 1 from public.pets p where p.id = ((storage.foldername(o.name))[1])::bigint)) orphan_pet_folder,
  (select count(*) from public.pet_documents) pet_documents_rows,
  (select string_agg(polname, ', ' order by polname) from pg_policy where polrelid = 'storage.objects'::regclass
     and (coalesce(pg_get_expr(polqual, polrelid), '') || coalesce(pg_get_expr(polwithcheck, polrelid), '')) ~ 'pet-documents') policies;
