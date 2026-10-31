-- whiskora-staging ONLY. Tables behind the staging mock push service (supabase/tests/staging_only/qa-push-mock).
-- The mock answers only tags listed in qa_push_mock_modes; it records each received message (size + headers seen,
-- never the payload). Service role only. Teardown: drop table public.qa_push_mock_hits, public.qa_push_mock_modes;
do $$ begin
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'refusing: staging QA seed not found';
  end if;
end $$;
create table if not exists public.qa_push_mock_modes (
  tag text primary key check (tag ~ '^QAVR-[A-Z0-9]{1,8}$'),
  mode text not null check (mode in ('ok', 'fail500', 'fail429', 'gone410', 'hang'))
);
create table if not exists public.qa_push_mock_hits (
  id bigint generated always as identity primary key,
  tag text not null,
  at timestamptz not null default now(),
  bytes int not null,
  aes128gcm boolean not null,
  vapid boolean not null
);
alter table public.qa_push_mock_modes enable row level security;
alter table public.qa_push_mock_hits enable row level security;
revoke all on public.qa_push_mock_modes, public.qa_push_mock_hits from public, anon, authenticated;
grant select, insert, update, delete on public.qa_push_mock_modes, public.qa_push_mock_hits to service_role;
