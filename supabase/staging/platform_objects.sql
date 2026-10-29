-- Objects that `supabase db dump` does NOT copy (auth + storage schemas are excluded by the CLI).
-- Generated from production catalog 2026-10-30 (metadata only, no user data). Apply to STAGING after
-- the public-schema dump. Idempotent.

-- ── storage buckets ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('avatars', 'avatars', true, null, null) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('farm-assets', 'farm-assets', true, 10485760, '{image/jpeg,image/png,image/webp,image/heic}'::text[]) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('partner-photos', 'partner-photos', true, 10485760, '{image/jpeg,image/png,image/webp,image/gif}'::text[]) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('pet-documents', 'pet-documents', false, null, null) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('pet-photos', 'pet-photos', true, null, null) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('service-assets', 'service-assets', true, 5242880, '{image/jpeg,image/png,image/webp}'::text[]) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('shop-assets', 'shop-assets', true, 5242880, '{image/jpeg,image/png,image/webp}'::text[]) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('verification-docs', 'verification-docs', false, 10485760, '{image/jpeg,image/png,image/webp,image/heic}'::text[]) on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ── storage.objects policies (33) ──
drop policy if exists "Auth upload avatars" on storage.objects; create policy "Auth upload avatars" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Auth upload partner-photos" on storage.objects; create policy "Auth upload partner-photos" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'partner-photos'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Auth upload pet-photos" on storage.objects; create policy "Auth upload pet-photos" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'pet-photos'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Authenticated upload pet photos" on storage.objects; create policy "Authenticated upload pet photos" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'pet-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner delete avatars" on storage.objects; create policy "Owner delete avatars" on storage.objects as PERMISSIVE for DELETE to public using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner delete partner-photos" on storage.objects; create policy "Owner delete partner-photos" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'partner-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner delete pet photos" on storage.objects; create policy "Owner delete pet photos" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'pet-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner delete pet-photos" on storage.objects; create policy "Owner delete pet-photos" on storage.objects as PERMISSIVE for DELETE to public using (((bucket_id = 'pet-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner update avatars" on storage.objects; create policy "Owner update avatars" on storage.objects as PERMISSIVE for UPDATE to public using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner update partner-photos" on storage.objects; create policy "Owner update partner-photos" on storage.objects as PERMISSIVE for UPDATE to authenticated using (((bucket_id = 'partner-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner update pet photos" on storage.objects; create policy "Owner update pet photos" on storage.objects as PERMISSIVE for UPDATE to authenticated using (((bucket_id = 'pet-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Owner update pet-photos" on storage.objects; create policy "Owner update pet-photos" on storage.objects as PERMISSIVE for UPDATE to public using (((bucket_id = 'pet-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "Public read avatars" on storage.objects; create policy "Public read avatars" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'avatars'::text));
drop policy if exists "Public read partner-photos" on storage.objects; create policy "Public read partner-photos" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'partner-photos'::text));
drop policy if exists "Public read pet photos" on storage.objects; create policy "Public read pet photos" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'pet-photos'::text));
drop policy if exists "Public read pet-photos" on storage.objects; create policy "Public read pet-photos" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'pet-photos'::text));
drop policy if exists "admin view all verification docs" on storage.objects; create policy "admin view all verification docs" on storage.objects as PERMISSIVE for SELECT to public using (((bucket_id = 'verification-docs'::text) AND (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));
drop policy if exists "auth update farm assets" on storage.objects; create policy "auth update farm assets" on storage.objects as PERMISSIVE for UPDATE to public using (((bucket_id = 'farm-assets'::text) AND (auth.uid() IS NOT NULL)));
drop policy if exists "auth upload farm assets" on storage.objects; create policy "auth upload farm assets" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'farm-assets'::text) AND (auth.uid() IS NOT NULL)));
drop policy if exists "authenticated upload pet-documents" on storage.objects; create policy "authenticated upload pet-documents" on storage.objects as PERMISSIVE for INSERT to authenticated with check ((bucket_id = 'pet-documents'::text));
drop policy if exists "owner delete pet-documents" on storage.objects; create policy "owner delete pet-documents" on storage.objects as PERMISSIVE for DELETE to public using (((bucket_id = 'pet-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "owner read pet-documents" on storage.objects; create policy "owner read pet-documents" on storage.objects as PERMISSIVE for SELECT to public using (((bucket_id = 'pet-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "owner update pet-documents" on storage.objects; create policy "owner update pet-documents" on storage.objects as PERMISSIVE for UPDATE to public using (((bucket_id = 'pet-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
drop policy if exists "owner upload verification docs" on storage.objects; create policy "owner upload verification docs" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'verification-docs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
drop policy if exists "owner view own verification docs" on storage.objects; create policy "owner view own verification docs" on storage.objects as PERMISSIVE for SELECT to public using (((bucket_id = 'verification-docs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
drop policy if exists "public read farm assets" on storage.objects; create policy "public read farm assets" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'farm-assets'::text));
drop policy if exists "service-assets auth delete" on storage.objects; create policy "service-assets auth delete" on storage.objects as PERMISSIVE for DELETE to authenticated using ((bucket_id = 'service-assets'::text));
drop policy if exists "service-assets auth update" on storage.objects; create policy "service-assets auth update" on storage.objects as PERMISSIVE for UPDATE to authenticated using ((bucket_id = 'service-assets'::text));
drop policy if exists "service-assets auth upload" on storage.objects; create policy "service-assets auth upload" on storage.objects as PERMISSIVE for INSERT to authenticated with check ((bucket_id = 'service-assets'::text));
drop policy if exists "service-assets public read" on storage.objects; create policy "service-assets public read" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'service-assets'::text));
drop policy if exists "shop-assets auth delete" on storage.objects; create policy "shop-assets auth delete" on storage.objects as PERMISSIVE for DELETE to authenticated using ((bucket_id = 'shop-assets'::text));
drop policy if exists "shop-assets auth update" on storage.objects; create policy "shop-assets auth update" on storage.objects as PERMISSIVE for UPDATE to authenticated using ((bucket_id = 'shop-assets'::text));
drop policy if exists "shop-assets auth upload" on storage.objects; create policy "shop-assets auth upload" on storage.objects as PERMISSIVE for INSERT to authenticated with check ((bucket_id = 'shop-assets'::text));
drop policy if exists "shop-assets public read" on storage.objects; create policy "shop-assets public read" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'shop-assets'::text));

-- ── auth trigger (creates profile + personal workspace on signup) ──
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- NOT copied (configure by hand on staging if a test needs it):
--   * Auth providers (Google, LINE custom), Site URL / redirect URLs, email templates, SMTP
--   * pg_cron job (1 on production) — intentionally not copied so staging never calls production
--   * Edge Function secrets

-- pg_dump only emits "REVOKE ... FROM PUBLIC" relative to the target's default ACL, so a revoke from
-- anon/authenticated on production does not survive the restore (Supabase default privileges re-grant it).
revoke all on function public.protect_profile_role() from public, anon, authenticated;

-- reference data (no user data): visibility field groups used by viewer_can_see(). Copied from production.
insert into public.field_groups (key, label_th, label_en, resource_type, default_tier, sort_order) values
  ('overview','ภาพรวม','Overview','pet','public',0),
  ('pedigree','สายเลือด','Pedigree','pet','owner',1),
  ('health','สุขภาพ','Health','pet','owner',2),
  ('vaccination','วัคซีน','Vaccination','pet','engaged',3),
  ('weight','น้ำหนัก','Weight History','pet','engaged',4),
  ('dna','ผล DNA','DNA Results','pet','private',5),
  ('medical_notes','บันทึกทางการแพทย์','Medical Notes','pet','private',6),
  ('documents','เอกสาร','Documents','pet','private',7),
  ('certificates','ใบรับรอง','Certificates','pet','owner',8),
  ('timeline','ไทม์ไลน์','Timeline','pet','registered',9)
on conflict (key) do nothing;
