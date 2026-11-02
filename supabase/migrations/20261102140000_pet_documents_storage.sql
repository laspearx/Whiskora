-- STATUS: proposed — security branch, not applied anywhere. Staging first, production only on the owner's go-ahead
-- (docs/SECURITY_PHASE1.md §M7). No app change needed.
--
-- M7: bucket pet-documents (private) accepted an upload from ANY signed-in user at ANY path ("authenticated upload
-- pet-documents": bucket check only). The app stores documents at "<pet id>/<file>" (app/pets/[id]/page.tsx), while
-- the read / update / delete policies only allow "<caller uid>/…" — so the pet owner could not even read back what the
-- app uploaded (signed URL needs SELECT).
-- After, for "<pet id>/…" objects in pet-documents:
--   INSERT / UPDATE / DELETE: the pet's owner (pets.user_id) — the same people who may write pet_documents rows
--                             ("owner manages pet documents"); co-owners / farm team cannot write documents today (table
--                             policy), so storage does not open that either.
--   SELECT (signed URLs):     the owner, or whoever pet_documents' read policy lets see documents
--                             (viewer_can_see(pet, 'documents')).
-- The old "<uid>/…" read / update / delete policies stay for objects stored that way earlier; the unrestricted INSERT
-- policy is removed, and nothing new can be written under a uid folder. Other buckets unchanged.
create or replace function public.pet_document_folder_access(p_folder text, p_write boolean)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_pet bigint;
begin
  if auth.uid() is null or p_folder is null or p_folder !~ '^\d{1,18}$' then return false; end if;
  v_pet := p_folder::bigint;
  if exists (select 1 from pets p where p.id = v_pet and p.user_id = auth.uid()) then return true; end if;
  if p_write then return false; end if;
  return public.viewer_can_see(v_pet, 'documents', auth.uid());
end $$;
-- always the caller (auth.uid()): no viewer argument
revoke all on function public.pet_document_folder_access(text, boolean) from public, anon;
grant execute on function public.pet_document_folder_access(text, boolean) to authenticated;

drop policy if exists "authenticated upload pet-documents" on storage.objects;
drop policy if exists "pet-documents insert by pet owner" on storage.objects;
drop policy if exists "pet-documents read by pet folder" on storage.objects;
drop policy if exists "pet-documents update by pet owner" on storage.objects;
drop policy if exists "pet-documents delete by pet owner" on storage.objects;

create policy "pet-documents insert by pet owner" on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-documents' and public.pet_document_folder_access((storage.foldername(name))[1], true));
create policy "pet-documents read by pet folder" on storage.objects for select to authenticated
  using (bucket_id = 'pet-documents' and public.pet_document_folder_access((storage.foldername(name))[1], false));
create policy "pet-documents update by pet owner" on storage.objects for update to authenticated
  using (bucket_id = 'pet-documents' and public.pet_document_folder_access((storage.foldername(name))[1], true))
  with check (bucket_id = 'pet-documents' and public.pet_document_folder_access((storage.foldername(name))[1], true));
create policy "pet-documents delete by pet owner" on storage.objects for delete to authenticated
  using (bucket_id = 'pet-documents' and public.pet_document_folder_access((storage.foldername(name))[1], true));

do $$ begin
  if exists (select 1 from pg_policy where polrelid = 'storage.objects'::regclass and polcmd = 'a'
              and coalesce(pg_get_expr(polwithcheck, polrelid), '') ~ 'pet-documents'
              and polname <> 'pet-documents insert by pet owner') then
    raise exception 'STOP: another INSERT policy still covers pet-documents — report, do not widen';
  end if;
end $$;
