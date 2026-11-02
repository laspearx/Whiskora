-- Step 2 of profile edit by role (apply ONLY after the app that calls update_business_profile is live — the old edit
-- pages and dashboard photo changes update farms / shops / services directly and would get 42501 from here on).
-- After: the API can UPDATE only the two columns whose paths stay as they are until the review / publish work:
--   farms.verification_status  — verify page, owner → 'pending' (rules: farms_verification_guard, 20261101180000)
--   services.is_published      — existing publish button (owner only via RLS; unchanged, not extended to managers)
-- Every other profile change goes through update_business_profile (20261101190000). SELECT / INSERT / DELETE grants,
-- RLS policies, triggers and the storage policies are unchanged.
revoke update on public.farms, public.shops, public.services from anon, authenticated;
grant update (verification_status) on public.farms to authenticated;
grant update (is_published) on public.services to authenticated;
