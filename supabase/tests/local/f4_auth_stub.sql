-- Local only (F4 tests): the Supabase roles and the auth columns the F4 migration reads, as in GoTrue v2.197.0.
-- Never run against a Supabase project.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;   -- as on Supabase (crypt / gen_salt)
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique,
  encrypted_password varchar(255) default '',
  email_change varchar(255) default '',
  phone text unique default null,
  phone_change text default '',
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  deleted_at timestamptz
);
create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  identity_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create table if not exists auth.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  refreshed_at timestamptz
);
create table if not exists auth.mfa_amr_claims (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references auth.sessions(id) on delete cascade,
  authentication_method text not null,
  created_at timestamptz default now()
);
grant usage on schema public to anon, authenticated, service_role;

-- Supabase default privileges (as observed on staging, 2026-11-10): every new table / sequence / function in public
-- is granted to the API roles unless the migration revokes it. Tests must see the same starting point.
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant execute on functions to anon, authenticated, service_role;
