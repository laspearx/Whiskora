-- Staging only: 4 synthetic farms of QA owner 01, each with one pending verification request, for
-- web/e2e/verification.spec.ts (admin approves / rejects through admin_review_farm_verification).
-- Re-runnable: removes earlier "QA-VG E2E" farms, their requests and the audit rows the RPC wrote for them.
-- Inserted as the database owner (system path), so the verification guard does not apply here.
delete from public.admin_audit_logs where entity_type = 'farm_verification'
  and entity_id in (select v.id::text from public.farm_verifications v join public.farms f on f.id = v.farm_id where f.farm_name like 'QA-VG E2E %');
delete from public.farm_verifications where farm_id in (select id from public.farms where farm_name like 'QA-VG E2E %');
delete from public.farms where farm_name like 'QA-VG E2E %';
with f as (
  insert into public.farms (user_id, farm_name, bio, verification_status)
  select 'a0000000-0000-4000-8000-000000000001', 'QA-VG E2E ' || a || ' ' || p, 'synthetic', 'pending'
    from unnest(array['approve', 'reject']) a, unnest(array['desktop', 'mobile']) p
  returning id
)
insert into public.farm_verifications (farm_id, user_id, phone, status, farm_photo_urls)
select id, 'a0000000-0000-4000-8000-000000000001', '0800000000', 'pending', '[]'::jsonb from f;
