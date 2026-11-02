-- local only: minimal Supabase-like roles + auth stub so the staging schema dump restores
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create role authenticator noinherit login password 'x'; grant anon, authenticated, service_role to authenticator;
create role supabase_admin; create role supabase_storage_admin; create role supabase_auth_admin; create role dashboard_user; create role postgres_test;
create schema auth; create schema extensions;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}',
  email_confirmed_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now(), instance_id uuid, aud text, role text);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.email() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.email', true), '') $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;
