-- Local only (H2 tests): the auth columns / table the evidence function reads, as in Supabase Auth (GoTrue).
alter table auth.users add column if not exists encrypted_password text;
alter table auth.users add column if not exists email_change text default '';
create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(), provider_id text, user_id uuid references auth.users(id) on delete cascade,
  identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
