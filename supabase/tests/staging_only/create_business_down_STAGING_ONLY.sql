-- STAGING ONLY: back to the state before 20261101160000 / 20261101170000 (rollback test). Re-opens direct inserts.
-- On production the recovery is fix-forward; step 2 alone can be undone with the GRANT below if the old app must return.
grant insert on public.farms, public.shops, public.services, public.workspaces to anon, authenticated;
drop function if exists public.create_business(text, jsonb, uuid);
drop function if exists public.business_field_image(jsonb, text, text, uuid);
drop function if exists public.business_field_coord(jsonb, text, numeric);
drop function if exists public.business_field_text(jsonb, text, int);
drop table if exists public.business_create_requests;
