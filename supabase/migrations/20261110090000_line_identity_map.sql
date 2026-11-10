-- STATUS: proposed — F4 (PR #40, rev. 3). NOT applied anywhere. Local throwaway Postgres tests only
-- (supabase/tests/local/f4_line_identity_test.sql + web/scripts/line-identity-race.test.mjs). Staging and production
-- each need a separate owner approval.
--
-- Why (Codex review of 193d287, H2): the GoTrue admin API has no conditional update or transaction, so a LINE identity
-- kept in app_metadata cannot be linked / confirmed / unlinked atomically across app instances (stale snapshot written
-- back by a callback; two confirms consuming one pending link). This migration makes the database the only owner of
-- the mapping and of every state change around it:
--   line_identities         one row per LINE id; UNIQUE line_id and UNIQUE user_id (one holder, one LINE per account)
--   line_link_pending       one pending link per account; consumed by DELETE … RETURNING (exactly once)
--   line_identity_ops       legacy-account operations (admin recovery, signed-in legacy link): request → approving →
--                           credentials reset (verified here: password hash changed AND no session left) → approved
--   line_identity_audit     append-only log of every change and decision
--   line_credential_freeze  per-account credential freeze while a legacy op re-verifies the account (rev. 3)
-- All writes go through SECURITY DEFINER functions that take transaction-scoped advisory locks in a fixed order
-- (line id, then account). Tables: RLS on, no policies, no grants to API roles (service_role included) — the only way
-- in is the API functions, executable by service_role only. Internal helpers (f4_*) are executable by nobody but the
-- owner (Supabase's default privileges grant EXECUTE on new functions to service_role; revoked explicitly below).
--
-- Rev. 3 (re-review of 3da5844):
--   * confirm is ONE transaction (line_link_confirm): pending consumption + claim (or legacy op begin) under the same
--     locks as unlink → an unlink that returned 'ok' can never be followed by a re-link from an older confirm.
--   * in-flight Auth requests (GoTrue checks the session BEFORE its password / email update transaction, so a request
--     admitted before the rotation can still write after it): triggers on auth.users / auth.mfa_amr_claims /
--     auth.identities freeze the account's credentials from op begin until 10 minutes after the mapping is committed.
--     The first password change after begin is recorded as THE rotation (digest kept); any other credential change,
--     non-OTP sign-in or identity change is refused. If an attacker's in-flight write lands first, the app's own
--     rotation is refused and the op aborts (fail closed). Commit re-verifies digest = recorded rotation, no session,
--     no pending email change, no OAuth identity.

-- ── tables ─────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.line_identities (
  line_id   text primary key check (line_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  user_id   uuid not null unique references auth.users(id) on delete cascade,
  method    text not null check (method in ('login_create', 'link_confirm', 'legacy_link', 'recovery')),
  linked_at timestamptz not null default now()
);

create table public.line_link_pending (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  line_id      text not null check (line_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  display_name text not null default '' check (length(display_name) <= 100),
  nonce_hash   text not null check (nonce_hash ~ '^[0-9a-f]{64}$'),
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create table public.line_identity_ops (
  ref                  text primary key check (ref ~ '^[0-9a-f]{8}$'),
  kind                 text not null check (kind in ('admin_recovery', 'self_legacy_link')),
  user_id              uuid not null references auth.users(id) on delete cascade,
  line_id              text not null check (line_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  display_name         text not null default '' check (length(display_name) <= 100),
  status               text not null default 'open' check (status in ('open', 'approving', 'approved', 'declined', 'failed')),
  version              int  not null default 1,
  request_count        int  not null default 1,
  first_requested_at   timestamptz not null default now(),
  last_requested_at    timestamptz not null default now(),
  lock_token           uuid,
  pw_digest_at_begin   text,
  credentials_reset_at timestamptz,
  decided_at           timestamptz,
  decided_by           text,
  decision_reason      text,
  evidence             jsonb
);
create unique index line_identity_ops_one_active on public.line_identity_ops (user_id, line_id) where status in ('open', 'approving');

-- credential freeze of an account under a legacy op: 'rotation' (waiting for the one rotation) → 'rotated' →
-- 'grace' (until = commit / failure + 10 minutes: outlives any Auth request admitted before the rotation)
create table public.line_credential_freeze (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  ref             text not null,
  phase           text not null check (phase in ('rotation', 'rotated', 'grace')),
  rotation_digest text,
  rotated_at      timestamptz,
  until           timestamptz,
  created_at      timestamptz not null default now(),
  check (phase <> 'grace' or until is not null)
);

create table public.line_identity_audit (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  action  text not null,
  line_id text,
  user_id uuid,
  actor   text not null,
  ref     text,
  detail  jsonb not null default '{}'::jsonb
);

create or replace function public.line_identity_audit_immutable() returns trigger language plpgsql as $$
begin raise exception 'line_identity_audit is append-only'; end $$;
create trigger line_identity_audit_no_change before update or delete on public.line_identity_audit
  for each row execute function public.line_identity_audit_immutable();

alter table public.line_identities     enable row level security;
alter table public.line_link_pending   enable row level security;
alter table public.line_identity_ops   enable row level security;
alter table public.line_identity_audit enable row level security;
alter table public.line_credential_freeze enable row level security;
revoke all on public.line_identities, public.line_link_pending, public.line_identity_ops, public.line_identity_audit,
  public.line_credential_freeze from public, anon, authenticated, service_role;
revoke all on sequence public.line_identity_audit_id_seq from public, anon, authenticated, service_role;

-- ── helpers (internal) ─────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.f4_placeholder(p_line_id text) returns text
language sql immutable set search_path = public, pg_temp as $$
  select lower('line_' || p_line_id || '@line.whiskora.internal')
$$;

create or replace function public.f4_lock(p_line_id text, p_user_id uuid) returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  -- fixed order: LINE id first, then account → no deadlock between writers
  if p_line_id is not null then perform pg_advisory_xact_lock(hashtextextended('f4:line:' || p_line_id, 0)); end if;
  if p_user_id is not null then perform pg_advisory_xact_lock(hashtextextended('f4:user:' || p_user_id::text, 0)); end if;
end $$;

create or replace function public.f4_audit(p_action text, p_line_id text, p_user_id uuid, p_actor text, p_ref text, p_detail jsonb)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.line_identity_audit (action, line_id, user_id, actor, ref, detail)
  values (p_action, p_line_id, p_user_id, coalesce(nullif(p_actor, ''), 'unknown'), p_ref, coalesce(p_detail, '{}'::jsonb))
$$;

create or replace function public.f4_valid_line(p_line_id text) returns boolean
language sql immutable as $$ select p_line_id is not null and p_line_id ~ '^[A-Za-z0-9_-]{1,128}$' $$;

-- the legacy LINE-only account of a LINE id: its email is that id's placeholder and it holds no mapping
create or replace function public.f4_legacy_user(p_line_id text) returns uuid
language sql stable security definer set search_path = public, auth, pg_temp as $$
  select u.id from auth.users u
   where lower(u.email) = public.f4_placeholder(p_line_id) and u.deleted_at is null
     and not exists (select 1 from public.line_identities li where li.user_id = u.id)
   limit 1
$$;

-- ── lookup ─────────────────────────────────────────────────────────────────────────────────────────────────────────
-- kind: holder | legacy | claims (only user-writable user_metadata claims) | none | invalid
create or replace function public.line_login_resolve(p_line_id text)
returns table (kind text, user_id uuid)
language plpgsql stable security definer set search_path = public, auth, pg_temp as $$
declare v uuid;
begin
  if not public.f4_valid_line(p_line_id) then return query select 'invalid'::text, null::uuid; return; end if;
  select li.user_id into v from public.line_identities li where li.line_id = p_line_id;
  if found then return query select 'holder'::text, v; return; end if;
  v := public.f4_legacy_user(p_line_id);
  -- a placeholder account made in the last 2 minutes without a mapping yet = a concurrent first sign-in in progress
  if v is not null and exists (select 1 from auth.users u where u.id = v and u.created_at > now() - interval '2 minutes') then
    return query select 'creating'::text, v; return;
  end if;
  if v is not null then return query select 'legacy'::text, v; return; end if;
  if exists (select 1 from auth.users u where u.raw_user_meta_data ->> 'line_id' = p_line_id and u.deleted_at is null) then
    return query select 'claims'::text, null::uuid; return;
  end if;
  return query select 'none'::text, null::uuid;
end $$;

create or replace function public.line_identity_of(p_user_id uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select line_id from public.line_identities where user_id = p_user_id
$$;

-- ── claim / release (every writer of the mapping) ──────────────────────────────────────────────────────────────────
-- result: ok | already | line_taken | user_has_other | legacy_exists | legacy_needs_reset | no_user | invalid
create or replace function public.f4_claim(p_line_id text, p_user_id uuid, p_method text, p_actor text, p_ref text)
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare cur uuid; other text; leg uuid; email text;
begin
  if not public.f4_valid_line(p_line_id) or p_method not in ('login_create', 'link_confirm', 'legacy_link', 'recovery') then return 'invalid'; end if;
  perform public.f4_lock(p_line_id, p_user_id);
  select u.email into email from auth.users u where u.id = p_user_id and u.deleted_at is null;
  if not found then return 'no_user'; end if;
  select li.user_id into cur from public.line_identities li where li.line_id = p_line_id;
  if found then return case when cur = p_user_id then 'already' else 'line_taken' end; end if;
  select li.line_id into other from public.line_identities li where li.user_id = p_user_id;
  if found then return 'user_has_other'; end if;
  leg := public.f4_legacy_user(p_line_id);
  if leg is not null and leg <> p_user_id then return 'legacy_exists'; end if;           -- never orphan a legacy account
  -- login_create: only the placeholder account of exactly this LINE id, created moments ago by the callback
  if p_method = 'login_create' and (lower(coalesce(email, '')) <> public.f4_placeholder(p_line_id)
       or not exists (select 1 from auth.users u where u.id = p_user_id and u.created_at > now() - interval '2 minutes')) then
    return 'invalid';
  end if;
  -- a LINE-only (placeholder) account is never mapped by a plain link: it goes through an op that resets credentials
  if p_method = 'link_confirm' and lower(coalesce(email, '')) like '%@line.whiskora.internal' then
    return 'legacy_needs_reset';
  end if;
  insert into public.line_identities (line_id, user_id, method) values (p_line_id, p_user_id, p_method);
  perform public.f4_audit('claim', p_line_id, p_user_id, p_actor, p_ref, jsonb_build_object('method', p_method));
  return 'ok';
exception when unique_violation then return 'line_taken';
end $$;

-- direct claim allowed from the app: login_create (fresh placeholder account) only. Links go through line_link_confirm.
create or replace function public.line_identity_claim(p_line_id text, p_user_id uuid, p_method text, p_actor text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_method is distinct from 'login_create' then return 'invalid'; end if;
  return public.f4_claim(p_line_id, p_user_id, p_method, p_actor, null);
end $$;

create or replace function public.line_identity_release(p_user_id uuid, p_actor text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare l text;
begin
  select line_id into l from public.line_identities where user_id = p_user_id;
  perform public.f4_lock(l, p_user_id);
  delete from public.line_link_pending where user_id = p_user_id;
  -- an unlink also ends any legacy op of the account still in progress (it can never commit afterwards)
  perform public.f4_end_op(o.ref, 'failed', 'ended by unlink') from public.line_identity_ops o
   where o.user_id = p_user_id and o.status = 'approving';
  delete from public.line_identities where user_id = p_user_id returning line_id into l;
  if l is null then return 'none'; end if;
  perform public.f4_audit('release', l, p_user_id, p_actor, null, '{}'::jsonb);
  return 'ok';
end $$;

-- ── pending link ───────────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.line_link_pending_put(p_user_id uuid, p_line_id text, p_display text, p_nonce_hash text, p_ttl_seconds int)
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  if not public.f4_valid_line(p_line_id) or p_nonce_hash !~ '^[0-9a-f]{64}$' or p_ttl_seconds not between 60 and 600 then return 'invalid'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user_id and u.deleted_at is null) then return 'no_user'; end if;
  perform public.f4_lock(null, p_user_id);
  insert into public.line_link_pending (user_id, line_id, display_name, nonce_hash, expires_at)
  values (p_user_id, p_line_id, left(coalesce(p_display, ''), 100), p_nonce_hash, now() + make_interval(secs => p_ttl_seconds))
  on conflict (user_id) do update set line_id = excluded.line_id, display_name = excluded.display_name,
    nonce_hash = excluded.nonce_hash, expires_at = excluded.expires_at, created_at = now();
  return 'ok';
end $$;

create or replace function public.line_link_pending_clear(p_user_id uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.f4_lock(null, p_user_id);
  delete from public.line_link_pending where user_id = p_user_id;
  return 'ok';
end $$;

create or replace function public.line_link_status(p_user_id uuid)
returns table (line_id text, pending_display_name text, pending_expires_at timestamptz, legacy boolean)
language sql stable security definer set search_path = public, auth, pg_temp as $$
  select (select li.line_id from public.line_identities li where li.user_id = p_user_id),
         (select p.display_name from public.line_link_pending p where p.user_id = p_user_id and p.expires_at > now()),
         (select p.expires_at from public.line_link_pending p where p.user_id = p_user_id and p.expires_at > now()),
         exists (select 1 from auth.users u where u.id = p_user_id and lower(u.email) like '%@line.whiskora.internal'
                   and not exists (select 1 from public.line_identities li where li.user_id = u.id))
$$;

-- ── legacy-account operations (H1 / M1 / M2) ───────────────────────────────────────────────────────────────────────
create or replace function public.f4_new_ref() returns text language sql volatile as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;

create or replace function public.f4_pw_digest(p_user_id uuid) returns text
language sql stable security definer set search_path = auth, pg_temp as $$
  select encode(sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')), 'hex') from auth.users u where u.id = p_user_id
$$;

-- a LINE sign-in for a legacy account records (or refreshes) an admin-recovery request on that account
create or replace function public.line_recovery_record(p_line_id text, p_display text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare leg uuid; r text;
begin
  if not public.f4_valid_line(p_line_id) then return null; end if;
  perform public.f4_lock(p_line_id, null);
  leg := public.f4_legacy_user(p_line_id);
  if leg is null or exists (select 1 from public.line_identities where line_id = p_line_id) then return null; end if;
  perform public.f4_lock(null, leg);
  update public.line_identity_ops set request_count = request_count + 1, last_requested_at = now(),
         display_name = left(coalesce(p_display, ''), 100)
   where user_id = leg and line_id = p_line_id and kind = 'admin_recovery' and status = 'open'
   returning ref into r;
  if r is null then
    loop
      begin
        r := public.f4_new_ref();
        insert into public.line_identity_ops (ref, kind, user_id, line_id, display_name)
        values (r, 'admin_recovery', leg, p_line_id, left(coalesce(p_display, ''), 100));
        exit;
      exception when unique_violation then
        if exists (select 1 from public.line_identity_ops where user_id = leg and line_id = p_line_id and status in ('open', 'approving')) then
          return null; -- an approval is in progress for this account
        end if;
      end;
    end loop;
    perform public.f4_audit('recovery_request', p_line_id, leg, 'system:line-callback', r, '{}'::jsonb);
  end if;
  return r;
end $$;

-- server-side signals for a reviewer (read-only)
create or replace function public.line_recovery_evidence(p_ref text) returns jsonb
language plpgsql stable security definer set search_path = public, auth, pg_temp as $$
declare o public.line_identity_ops%rowtype; u auth.users%rowtype;
begin
  select * into o from public.line_identity_ops where ref = p_ref;
  if not found then return null; end if;
  select * into u from auth.users where id = o.user_id;
  return jsonb_build_object(
    'placeholder_matches', lower(u.email) = public.f4_placeholder(o.line_id),
    'line_held_by_other', exists (select 1 from public.line_identities li where li.line_id = o.line_id and li.user_id <> o.user_id),
    'account_mapped', exists (select 1 from public.line_identities li where li.user_id = o.user_id),
    'oauth_identity', exists (select 1 from auth.identities i where i.user_id = u.id and i.provider <> 'email'),
    'pending_email_change', coalesce(u.email_change, '') <> '',
    'identity_original', (select count(*) from auth.identities i where i.user_id = u.id and i.provider = 'email'
                            and i.identity_data ->> 'email' = u.email and abs(extract(epoch from i.created_at - u.created_at)) <= 60
                            and (i.identity_data - array['sub', 'email', 'email_verified', 'phone_verified']) = '{}'::jsonb) = 1,
    'creation_otp_session_10s', exists (select 1 from auth.sessions s join auth.mfa_amr_claims c on c.session_id = s.id
                            where s.user_id = u.id and c.authentication_method = 'otp' and s.created_at - u.created_at between interval '0' and interval '10 seconds'),
    'non_otp_session', exists (select 1 from auth.sessions s join auth.mfa_amr_claims c on c.session_id = s.id
                            where s.user_id = u.id and c.authentication_method <> 'otp'),
    'session_count', (select count(*) from auth.sessions s where s.user_id = u.id),
    'request_age_hours', round(extract(epoch from now() - o.last_requested_at) / 3600.0, 1),
    'request_count', o.request_count);
end $$;

-- ── credential freeze (rev. 3: in-flight Auth requests) ────────────────────────────────────────────────────────────
create or replace function public.f4_digest(p_hash text) returns text
language sql immutable set search_path = pg_temp as $$
  select encode(sha256(convert_to(coalesce(p_hash, ''), 'UTF8')), 'hex')
$$;

-- op begin: freeze the account; only the next password change (the rotation) is let through and recorded
create or replace function public.f4_freeze_start(p_user_id uuid, p_ref text) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into public.line_credential_freeze (user_id, ref, phase) values (p_user_id, p_ref, 'rotation')
  on conflict (user_id) do update set ref = excluded.ref, phase = 'rotation', rotation_digest = null, rotated_at = null,
    until = null, created_at = now()
$$;

-- op end (commit, failure, abort): keep the freeze 10 more minutes — longer than any Auth request admitted earlier
create or replace function public.f4_freeze_grace(p_user_id uuid, p_ref text) returns void
language sql security definer set search_path = public, pg_temp as $$
  update public.line_credential_freeze set phase = 'grace', until = now() + interval '10 minutes'
   where user_id = p_user_id and ref = p_ref
$$;

create or replace function public.f4_frozen(p_user_id uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select f.phase from public.line_credential_freeze f
   where f.user_id = p_user_id and (f.phase <> 'grace' or f.until > now())
$$;

-- auth.users: credential columns of a frozen account. Runs inside the Auth server's own transaction.
create or replace function public.f4_guard_user_credentials() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare f public.line_credential_freeze%rowtype;
begin
  select * into f from public.line_credential_freeze where user_id = old.id for update;   -- serialises concurrent writers
  if not found or (f.phase = 'grace' and f.until <= now()) then return new; end if;
  if f.phase = 'rotation'
     and new.encrypted_password is distinct from old.encrypted_password
     and new.email is not distinct from old.email and new.email_change is not distinct from old.email_change
     and new.phone is not distinct from old.phone and new.phone_change is not distinct from old.phone_change then
    update public.line_credential_freeze set phase = 'rotated', rotation_digest = public.f4_digest(new.encrypted_password), rotated_at = now()
     where user_id = old.id;
    return new;
  end if;
  raise exception 'F4: account credentials are frozen during LINE re-verification' using errcode = 'P0001';
end $$;

-- auth.mfa_amr_claims (written in the same transaction as every new session): no sign-in while the op runs; during
-- the grace period only the OTP sign-in the app itself issues after a LINE sign-in
create or replace function public.f4_guard_sign_in() returns trigger
language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare uid uuid; ph text;
begin
  select s.user_id into uid from auth.sessions s where s.id = new.session_id;
  if uid is null then return new; end if;
  ph := public.f4_frozen(uid);
  if ph is null or (ph = 'grace' and new.authentication_method in ('otp', 'magiclink')) then return new; end if;
  raise exception 'F4: sign-in refused during LINE re-verification' using errcode = 'P0001';
end $$;

-- auth.identities: no identity added to / moved onto a frozen account (e.g. an OAuth link started before the rotation)
create or replace function public.f4_guard_identity() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.f4_frozen(new.user_id) is null then return new; end if;
  raise exception 'F4: identity change refused during LINE re-verification' using errcode = 'P0001';
end $$;

create trigger f4_credential_freeze before update on auth.users for each row
  when (old.encrypted_password is distinct from new.encrypted_password or old.email is distinct from new.email
        or old.email_change is distinct from new.email_change or old.phone is distinct from new.phone
        or old.phone_change is distinct from new.phone_change)
  execute function public.f4_guard_user_credentials();
create trigger f4_sign_in_freeze before insert on auth.mfa_amr_claims for each row execute function public.f4_guard_sign_in();
create trigger f4_identity_freeze before insert or update of user_id on auth.identities for each row
  execute function public.f4_guard_identity();

-- ends an op that has not committed (status failed / open / declined) and moves its freeze to the grace period
create or replace function public.f4_end_op(p_ref text, p_status text, p_reason text, p_action text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.line_identity_ops%rowtype;
begin
  update public.line_identity_ops set status = p_status, lock_token = null, version = version + 1,
         decided_at = case when p_status = 'open' then decided_at else now() end,
         decision_reason = coalesce(decision_reason, '') || ' | ' || p_reason,
         pw_digest_at_begin = case when p_status = 'open' then null else pw_digest_at_begin end
   where ref = p_ref returning * into o;
  if not found then return; end if;
  perform public.f4_freeze_grace(o.user_id, o.ref);
  perform public.f4_audit(coalesce(p_action, 'op_' || p_status), o.line_id, o.user_id, 'system', o.ref, jsonb_build_object('reason', p_reason));
end $$;

-- admin approval, step 1: binds full user id, request version, freshness (14 days), reviewer and at least two
-- owner checks; freezes the account's credentials (only the coming rotation is let through).
create or replace function public.line_recovery_begin(p_ref text, p_user_id uuid, p_version int, p_actor text, p_reason text, p_owner_checks jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.line_identity_ops%rowtype; t uuid := gen_random_uuid(); n int;
begin
  select * into o from public.line_identity_ops where ref = p_ref;
  if not found then raise exception 'F4: no such request'; end if;
  perform public.f4_lock(o.line_id, o.user_id);
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if o.kind <> 'admin_recovery' then raise exception 'F4: not an admin recovery request'; end if;
  if o.status <> 'open' then raise exception 'F4: request is %', o.status; end if;
  if o.version <> p_version then raise exception 'F4: request changed (version % ≠ %)', o.version, p_version; end if;
  if o.user_id <> p_user_id then raise exception 'F4: user id does not match the request'; end if;
  if o.last_requested_at < now() - interval '14 days' then raise exception 'F4: request expired (older than 14 days)'; end if;
  if coalesce(length(trim(p_actor)), 0) < 2 or coalesce(length(trim(p_reason)), 0) < 10 then raise exception 'F4: reviewer and reason required'; end if;
  if jsonb_typeof(p_owner_checks) <> 'array' then raise exception 'F4: owner checks must be a list'; end if;
  select count(*) into n from jsonb_array_elements_text(p_owner_checks) e where length(trim(e)) >= 5;
  if n < 2 then raise exception 'F4: at least two owner checks required'; end if;
  if public.f4_legacy_user(o.line_id) is distinct from o.user_id then raise exception 'F4: account is not the legacy account of this LINE id'; end if;
  if exists (select 1 from public.line_identities where line_id = o.line_id) then raise exception 'F4: LINE id already held'; end if;
  update public.line_identity_ops set status = 'approving', lock_token = t, version = version + 1, decided_by = p_actor,
         decision_reason = p_reason, pw_digest_at_begin = public.f4_pw_digest(o.user_id),
         evidence = jsonb_build_object('owner_checks', p_owner_checks, 'server', public.line_recovery_evidence(p_ref))
   where ref = p_ref;
  perform public.f4_freeze_start(o.user_id, p_ref);
  perform public.f4_audit('recovery_begin', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('reason', p_reason, 'owner_checks', p_owner_checks));
  return t;
end $$;

-- signed-in legacy link, step 1 (internal: called by line_link_confirm under its locks, after the pending link of a
-- valid session + LINE OAuth + browser nonce was consumed): opens an op and freezes the account
create or replace function public.f4_legacy_link_begin(p_user_id uuid, p_line_id text, p_display text)
returns table (result text, ref text, token uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare r text; t uuid := gen_random_uuid();
begin
  if not public.f4_valid_line(p_line_id) then return query select 'invalid'::text, null::text, null::uuid; return; end if;
  perform public.f4_lock(p_line_id, p_user_id);
  if exists (select 1 from public.line_identities li where li.line_id = p_line_id) then return query select 'line_taken'::text, null::text, null::uuid; return; end if;
  if public.f4_legacy_user(p_line_id) is distinct from p_user_id then return query select 'not_legacy_of_line'::text, null::text, null::uuid; return; end if;
  -- a crashed signed-in attempt that never reset credentials expires after 10 minutes
  perform public.f4_end_op(o.ref, 'failed', 'expired before reset') from public.line_identity_ops o
   where o.user_id = p_user_id and o.line_id = p_line_id and o.kind = 'self_legacy_link' and o.status = 'approving'
     and o.credentials_reset_at is null and o.first_requested_at < now() - interval '10 minutes';
  -- an open admin request for the same account/LINE is superseded by this stronger, signed-in proof
  update public.line_identity_ops set status = 'declined', decided_at = now(), decided_by = 'system', decision_reason = 'superseded by signed-in legacy link', version = version + 1
   where user_id = p_user_id and line_id = p_line_id and status = 'open';
  if exists (select 1 from public.line_identity_ops o where o.user_id = p_user_id and o.status = 'approving') then
    return query select 'busy'::text, null::text, null::uuid; return;
  end if;
  r := public.f4_new_ref();
  insert into public.line_identity_ops (ref, kind, user_id, line_id, display_name, status, lock_token, pw_digest_at_begin, decided_by, decision_reason, evidence)
  values (r, 'self_legacy_link', p_user_id, p_line_id, left(coalesce(p_display, ''), 100), 'approving', t, public.f4_pw_digest(p_user_id),
          'self:signed-in', 'valid session + LINE OAuth + browser nonce', jsonb_build_object('server', null));
  perform public.f4_freeze_start(p_user_id, r);
  perform public.f4_audit('legacy_link_begin', p_line_id, p_user_id, 'self:signed-in', r, '{}'::jsonb);
  return query select 'ok'::text, r, t;
end $$;

-- confirm a pending link — ONE transaction under the LINE-id and account locks (the same locks as unlink):
-- consume the pending row (exactly once, whatever the outcome), then map it (ordinary account) or open the
-- credential-reset op (LINE-only legacy account). result: ok | already | legacy | missing | mismatch | expired |
-- line_taken | user_has_other | legacy_exists | busy | not_legacy_of_line | no_user | invalid
create or replace function public.line_link_confirm(p_user_id uuid, p_nonce_hash text, p_actor text)
returns table (result text, line_id text, display_name text, ref text, token uuid)
language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare l text; r public.line_link_pending%rowtype; em text; res text; b record;
begin
  select p.line_id into l from public.line_link_pending p where p.user_id = p_user_id;
  if not found then return query select 'missing'::text, null::text, null::text, null::text, null::uuid; return; end if;
  perform public.f4_lock(l, p_user_id);                    -- fixed order: LINE id, then account
  delete from public.line_link_pending p where p.user_id = p_user_id and p.line_id = l returning p.* into r;
  -- gone (unlink / decline / another confirm won) or replaced by a newer callback (that one stays for its own confirm)
  if r.user_id is null then return query select 'missing'::text, null::text, null::text, null::text, null::uuid; return; end if;
  if p_nonce_hash is null or r.nonce_hash <> p_nonce_hash then return query select 'mismatch'::text, null::text, null::text, null::text, null::uuid; return; end if;
  if r.expires_at <= now() then return query select 'expired'::text, null::text, null::text, null::text, null::uuid; return; end if;
  select u.email into em from auth.users u where u.id = p_user_id and u.deleted_at is null;
  if not found then return query select 'no_user'::text, null::text, null::text, null::text, null::uuid; return; end if;
  if exists (select 1 from public.line_identities li where li.user_id = p_user_id) then
    return query select case when public.line_identity_of(p_user_id) = l then 'already' else 'user_has_other' end, l, r.display_name, null::text, null::uuid; return;
  end if;
  if exists (select 1 from public.line_identities li where li.line_id = l) then
    return query select 'line_taken'::text, l, r.display_name, null::text, null::uuid; return;
  end if;
  if lower(coalesce(em, '')) like '%@line.whiskora.internal' then
    select * into b from public.f4_legacy_link_begin(p_user_id, l, r.display_name);
    return query select case when b.result = 'ok' then 'legacy' else b.result end, l, r.display_name, b.ref, b.token; return;
  end if;
  res := public.f4_claim(l, p_user_id, 'link_confirm', p_actor, null);
  return query select res, l, r.display_name, null::text, null::uuid;
end $$;

-- step 2 (after the password was rotated through the Auth admin API with the random secret p_secret): the freeze
-- let exactly one password change through after begin and recorded it. Verify that this one change is the app's own
-- rotation (the current bcrypt hash verifies p_secret — an Auth request admitted before the rotation that wrote first
-- would have made the app's rotation fail instead), that it is still current, and that no session survived.
-- p_secret is a throwaway 256-bit value, never shown or stored; it is only compared here.
create or replace function public.line_op_mark_reset(p_ref text, p_token uuid, p_actor text, p_secret text)
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare o public.line_identity_ops%rowtype; f public.line_credential_freeze%rowtype; h text;
begin
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if not found or o.status <> 'approving' or o.lock_token is distinct from p_token then return 'invalid'; end if;
  select * into f from public.line_credential_freeze where user_id = o.user_id and ref = o.ref;
  select u.encrypted_password into h from auth.users u where u.id = o.user_id;
  if not found or f.phase = 'rotation' or public.f4_digest(h) = o.pw_digest_at_begin then return 'password_unchanged'; end if;
  if f.phase <> 'rotated' or public.f4_digest(h) is distinct from f.rotation_digest then return 'credentials_changed'; end if;
  if coalesce(length(p_secret), 0) < 32 or h !~ '^\$2[aby]\$' or extensions.crypt(p_secret, h) is distinct from h then
    return 'rotation_not_verified';
  end if;
  if exists (select 1 from auth.sessions s where s.user_id = o.user_id) then return 'sessions_remain'; end if;
  update public.line_identity_ops set credentials_reset_at = coalesce(credentials_reset_at, now()) where ref = p_ref;
  perform public.f4_audit('credentials_reset', o.line_id, o.user_id, p_actor, p_ref, '{}'::jsonb);
  return 'ok';
end $$;

-- step 3: map the LINE id — only after a verified reset, re-verified here under the locks (frozen account: nothing
-- may have changed since); any failure leaves a durable 'failed' state for an admin
create or replace function public.line_op_commit(p_ref text, p_token uuid, p_actor text)
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare o public.line_identity_ops%rowtype; f public.line_credential_freeze%rowtype; res text; why text;
begin
  select * into o from public.line_identity_ops where ref = p_ref;
  if not found then return 'invalid'; end if;
  perform public.f4_lock(o.line_id, o.user_id);
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if o.status = 'approved' then return 'already'; end if;
  if o.status <> 'approving' or o.lock_token is distinct from p_token then return 'invalid'; end if;
  if o.credentials_reset_at is null then return 'reset_missing'; end if;
  select * into f from public.line_credential_freeze where user_id = o.user_id and ref = o.ref for update;
  why := case
    when not found or f.phase <> 'rotated' then 'freeze_lost'
    when public.f4_pw_digest(o.user_id) is distinct from f.rotation_digest then 'credentials_changed'
    when exists (select 1 from auth.sessions s where s.user_id = o.user_id) then 'sessions_remain'
    when exists (select 1 from auth.users u where u.id = o.user_id and (coalesce(u.email_change, '') <> ''
                   or lower(u.email) <> public.f4_placeholder(o.line_id))) then 'email_changed'
    when exists (select 1 from auth.identities i where i.user_id = o.user_id and i.provider <> 'email') then 'identity_added'
  end;
  if why is null then
    res := public.f4_claim(o.line_id, o.user_id, case o.kind when 'admin_recovery' then 'recovery' else 'legacy_link' end, p_actor, p_ref);
    if res in ('ok', 'already') then
      update public.line_identity_ops set status = 'approved', decided_at = now(), lock_token = null, version = version + 1 where ref = p_ref;
      perform public.f4_freeze_grace(o.user_id, o.ref);
      perform public.f4_audit('op_approved', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('kind', o.kind));
      return 'ok';
    end if;
    why := res;
  end if;
  perform public.f4_end_op(p_ref, 'failed', 'commit: ' || why);
  return why;
end $$;

-- a signed-in legacy link that reset the credentials but did not reach commit (crash, timeout) is finished by the
-- next LINE sign-in of the same LINE id: that sign-in proves the LINE id again, the op already proved the session
-- and the reset was verified server-side. Admin recoveries are never finished here (they need the reviewer).
create or replace function public.line_legacy_link_resume(p_line_id text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.line_identity_ops%rowtype;
begin
  if not public.f4_valid_line(p_line_id) then return 'none'; end if;
  select * into o from public.line_identity_ops
   where line_id = p_line_id and kind = 'self_legacy_link' and status = 'approving' and credentials_reset_at is not null
   order by first_requested_at desc limit 1;
  if not found then return 'none'; end if;
  return public.line_op_commit(o.ref, o.lock_token, 'system:line-callback-resume');
end $$;

-- back out of step 1 — only before credentials were reset (after a reset, finish with commit / resume)
create or replace function public.line_op_abort(p_ref text, p_token uuid, p_actor text, p_reason text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.line_identity_ops%rowtype;
begin
  select * into o from public.line_identity_ops where ref = p_ref;
  if not found then return 'invalid'; end if;
  perform public.f4_lock(o.line_id, o.user_id);
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if o.status <> 'approving' or o.lock_token is distinct from p_token then return 'invalid'; end if;
  if o.credentials_reset_at is not null then return 'reset_done_resume_instead'; end if;
  perform public.f4_end_op(p_ref, case o.kind when 'admin_recovery' then 'open' else 'failed' end, coalesce(p_actor, '') || ': ' || coalesce(p_reason, ''), 'op_aborted');
  return 'ok';
end $$;

create or replace function public.line_recovery_decline(p_ref text, p_version int, p_actor text, p_reason text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.line_identity_ops%rowtype;
begin
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if not found or o.kind <> 'admin_recovery' or o.status <> 'open' or o.version <> p_version then return 'invalid'; end if;
  if coalesce(length(trim(p_actor)), 0) < 2 or coalesce(length(trim(p_reason)), 0) < 10 then return 'reviewer_and_reason_required'; end if;
  update public.line_identity_ops set status = 'declined', decided_at = now(), decided_by = p_actor, decision_reason = p_reason, version = version + 1 where ref = p_ref;
  perform public.f4_audit('recovery_declined', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('reason', p_reason));
  return 'ok';
end $$;

-- reviewer listing: no LINE ids or emails, short user id prefix only
create or replace function public.line_recovery_list()
returns table (ref text, kind text, user_prefix text, status text, version int, request_count int,
               first_requested_at timestamptz, last_requested_at timestamptz, credentials_reset_at timestamptz, lock_token uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select o.ref, o.kind, left(o.user_id::text, 8), o.status, o.version, o.request_count, o.first_requested_at, o.last_requested_at,
         o.credentials_reset_at, o.lock_token
    from public.line_identity_ops o where o.status in ('open', 'approving', 'failed') order by o.last_requested_at desc
$$;

-- ── privileges: API functions → service_role only; internal helpers → nobody (owner only) ─────────────────────────
-- Supabase's default privileges grant EXECUTE on every new function to service_role (and authenticated) and ALL on
-- new sequences to anon / authenticated / service_role, so everything is revoked explicitly, then the API granted.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and (p.proname like 'f4\_%' or p.proname like 'line\_%') and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
  foreach f in array array[
    'public.line_login_resolve(text)', 'public.line_identity_of(uuid)', 'public.line_identity_claim(text,uuid,text,text)',
    'public.line_identity_release(uuid,text)', 'public.line_link_pending_put(uuid,text,text,text,int)',
    'public.line_link_confirm(uuid,text,text)', 'public.line_link_pending_clear(uuid)', 'public.line_link_status(uuid)',
    'public.line_recovery_record(text,text)', 'public.line_recovery_evidence(text)', 'public.line_recovery_begin(text,uuid,int,text,text,jsonb)',
    'public.line_op_mark_reset(text,uuid,text,text)', 'public.line_op_commit(text,uuid,text)', 'public.line_legacy_link_resume(text)',
    'public.line_op_abort(text,uuid,text,text)', 'public.line_recovery_decline(text,int,text,text)', 'public.line_recovery_list()']::regprocedure[]
  loop
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- guard: the migration fails (and rolls back) unless exactly the API is reachable, and only by service_role
do $$
declare bad text;
begin
  select string_agg(p.oid::regprocedure::text, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace and (p.proname like 'f4\_%' or p.proname like 'line\_%') and p.prokind = 'f'
     and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE')
          or (has_function_privilege('service_role', p.oid, 'EXECUTE') <> (p.proname in (
               'line_login_resolve', 'line_identity_of', 'line_identity_claim', 'line_identity_release', 'line_link_pending_put',
               'line_link_confirm', 'line_link_pending_clear', 'line_link_status', 'line_recovery_record', 'line_recovery_evidence',
               'line_recovery_begin', 'line_op_mark_reset', 'line_op_commit', 'line_legacy_link_resume', 'line_op_abort',
               'line_recovery_decline', 'line_recovery_list'))));
  if bad is not null then raise exception 'STOP: F4 function privileges wrong: %', bad; end if;
  select string_agg(t, ', ') into bad from unnest(array['line_identities', 'line_link_pending', 'line_identity_ops',
      'line_identity_audit', 'line_credential_freeze']) t
   where has_table_privilege('anon', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_table_privilege('authenticated', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_table_privilege('service_role', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');
  if bad is not null then raise exception 'STOP: F4 tables reachable by API roles: %', bad; end if;
  if has_sequence_privilege('anon', 'public.line_identity_audit_id_seq', 'USAGE,SELECT,UPDATE')
     or has_sequence_privilege('authenticated', 'public.line_identity_audit_id_seq', 'USAGE,SELECT,UPDATE')
     or has_sequence_privilege('service_role', 'public.line_identity_audit_id_seq', 'USAGE,SELECT,UPDATE') then
    raise exception 'STOP: F4 audit sequence reachable by API roles';
  end if;
  if (select count(*) from pg_trigger where not tgisinternal and tgname in ('f4_credential_freeze', 'f4_sign_in_freeze', 'f4_identity_freeze')) <> 3 then
    raise exception 'STOP: F4 credential-freeze triggers missing';
  end if;
end $$;
