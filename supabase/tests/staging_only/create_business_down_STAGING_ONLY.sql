-- STAGING ONLY: remove step 1 (20261101160000) objects for a rollback test. Does NOT re-open direct INSERT: undoing
-- step 2 is a separate, explicit decision (supabase/emergency/business_insert_old_app_compat_DECISION_REQUIRED.sql),
-- because staging is shared by every Preview. Never on production.
drop function if exists public.create_business(text, jsonb, uuid);
drop function if exists public.business_field_image(jsonb, text, text, uuid);
drop function if exists public.business_field_coord(jsonb, text, numeric);
drop function if exists public.business_field_text(jsonb, text, int);
drop table if exists public.business_create_requests;
drop table if exists public.platform_settings;
