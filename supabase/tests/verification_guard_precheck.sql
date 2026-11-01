-- Read-only gate before / after 20261101180000 (verification guard). Counts only; changes nothing.
-- The *_without_* columns describe existing data that the hotfix does NOT change (no back-fill): review them by hand.
select
  case when (select count(*) from pg_trigger where tgname in ('farms_verification_guard', 'farm_verifications_guard') and not tgisinternal) = 2
       then 'after' else 'before' end state,
  (select count(*) from public.farms) farms,
  (select count(*) from public.farms where is_verified) farms_verified,
  (select count(*) from public.farms f where f.is_verified and not exists (select 1 from public.farm_verifications v where v.farm_id = f.id and v.status = 'approved')) verified_without_approved_request,
  (select count(*) from public.farms f where f.is_verified and not exists (select 1 from public.admin_audit_logs a join public.farm_verifications v on a.entity_type = 'farm_verification' and a.entity_id = v.id::text and a.action = 'verification_approve' where v.farm_id = f.id)) verified_without_admin_audit,
  (select count(*) from public.farms where verification_status = 'pending') farms_pending,
  (select count(*) from public.farms f where f.verification_status = 'pending' and not exists (select 1 from public.farm_verifications v where v.farm_id = f.id and v.status = 'pending')) pending_without_request,
  (select count(*) from public.farm_verifications) requests,
  (select count(*) from public.farm_verifications v where v.status <> 'pending' and v.reviewed_by is null) reviewed_without_reviewer,
  (select count(*) from public.farm_verifications v join public.farms f on f.id = v.farm_id where v.user_id is distinct from f.user_id) request_user_not_farm_owner,
  (select count(*) from public.farm_verifications v where v.reviewed_by is not null and not exists (select 1 from public.profiles p where p.id::text = v.reviewed_by and p.role = 'admin')) reviewed_by_non_admin,
  coalesce((select has_function_privilege('authenticated', f, 'EXECUTE') from to_regprocedure('public.admin_review_farm_verification(bigint,text,text)') f where f is not null), false) review_rpc_authenticated,
  coalesce((select prosecdef from pg_proc where oid = to_regprocedure('public.admin_review_farm_verification(bigint,text,text)')), false) review_rpc_definer;
