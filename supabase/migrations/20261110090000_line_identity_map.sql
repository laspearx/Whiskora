-- STATUS: proposed — F4 (PR #40). NOT applied anywhere. Local throwaway Postgres tests only
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
-- All writes go through SECURITY DEFINER functions that take transaction-scoped advisory locks in a fixed order
-- (line id, then account). Tables: RLS on, no policies, no grants to API roles (service_role included) — the only way
-- in is the functions, executable by service_role only.

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
revoke all on public.line_identities, public.line_link_pending, public.line_identity_ops, public.line_identity_audit
  from public, anon, authenticated, service_role;

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

-- direct claims allowed from the app: login_create (fresh account) and link_confirm (non-legacy account)
create or replace function public.line_identity_claim(p_line_id text, p_user_id uuid, p_method text, p_actor text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_method not in ('login_create', 'link_confirm') then return 'invalid'; end if;
  return public.f4_claim(p_line_id, p_user_id, p_method, p_actor, null);
end $$;

create or replace function public.line_identity_release(p_user_id uuid, p_actor text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare l text;
begin
  select line_id into l from public.line_identities where user_id = p_user_id;
  perform public.f4_lock(l, p_user_id);
  delete from public.line_link_pending where user_id = p_user_id;
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

-- consumes the pending link exactly once (DELETE … RETURNING under the account lock), whatever the outcome
create or replace function public.line_link_take(p_user_id uuid, p_nonce_hash text)
returns table (result text, line_id text, display_name text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.line_link_pending%rowtype;
begin
  perform public.f4_lock(null, p_user_id);
  delete from public.line_link_pending p where p.user_id = p_user_id returning p.* into r;
  if r.user_id is null then return query select 'missing'::text, null::text, null::text; return; end if;
  if p_nonce_hash is null or r.nonce_hash <> p_nonce_hash then return query select 'mismatch'::text, null::text, null::text; return; end if;
  if r.expires_at <= now() then return query select 'expired'::text, null::text, null::text; return; end if;
  return query select 'ok'::text, r.line_id, r.display_name;
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

-- admin approval, step 1: binds full user id, request version, freshness (14 days), reviewer and at least two
-- owner checks; records the current password digest so step 3 can prove the credentials were reset.
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
  perform public.f4_audit('recovery_begin', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('reason', p_reason, 'owner_checks', p_owner_checks));
  return t;
end $$;

-- signed-in legacy link, step 1 (session + LINE OAuth + nonce already proven by the app): opens an op for itself
create or replace function public.line_legacy_link_begin(p_user_id uuid, p_line_id text, p_display text)
returns table (result text, ref text, token uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare r text; t uuid := gen_random_uuid();
begin
  if not public.f4_valid_line(p_line_id) then return query select 'invalid'::text, null::text, null::uuid; return; end if;
  perform public.f4_lock(p_line_id, p_user_id);
  if exists (select 1 from public.line_identities where line_id = p_line_id) then return query select 'line_taken'::text, null::text, null::uuid; return; end if;
  if public.f4_legacy_user(p_line_id) is distinct from p_user_id then return query select 'not_legacy_of_line'::text, null::text, null::uuid; return; end if;
  -- a crashed signed-in attempt that never reset credentials expires after 10 minutes
  update public.line_identity_ops set status = 'failed', decided_at = now(), version = version + 1,
         decision_reason = coalesce(decision_reason, '') || ' | expired before reset', lock_token = null
   where user_id = p_user_id and line_id = p_line_id and kind = 'self_legacy_link' and status = 'approving'
     and credentials_reset_at is null and first_requested_at < now() - interval '10 minutes';
  -- an open admin request for the same account/LINE is superseded by this stronger, signed-in proof
  update public.line_identity_ops set status = 'declined', decided_at = now(), decided_by = 'system', decision_reason = 'superseded by signed-in legacy link', version = version + 1
   where user_id = p_user_id and line_id = p_line_id and status = 'open';
  if exists (select 1 from public.line_identity_ops where user_id = p_user_id and line_id = p_line_id and status = 'approving') then
    return query select 'busy'::text, null::text, null::uuid; return;
  end if;
  r := public.f4_new_ref();
  insert into public.line_identity_ops (ref, kind, user_id, line_id, display_name, status, lock_token, pw_digest_at_begin, decided_by, decision_reason, evidence)
  values (r, 'self_legacy_link', p_user_id, p_line_id, left(coalesce(p_display, ''), 100), 'approving', t, public.f4_pw_digest(p_user_id),
          'self:signed-in', 'valid session + LINE OAuth + browser nonce', jsonb_build_object('server', null));
  perform public.f4_audit('legacy_link_begin', p_line_id, p_user_id, 'self:signed-in', r, '{}'::jsonb);
  return query select 'ok'::text, r, t;
end $$;

-- step 2 (after the password was rotated through the Auth admin API): verifies the reset server-side and records it
create or replace function public.line_op_mark_reset(p_ref text, p_token uuid, p_actor text)
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare o public.line_identity_ops%rowtype;
begin
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if not found or o.status <> 'approving' or o.lock_token is distinct from p_token then return 'invalid'; end if;
  if public.f4_pw_digest(o.user_id) = o.pw_digest_at_begin then return 'password_unchanged'; end if;
  if exists (select 1 from auth.sessions s where s.user_id = o.user_id) then return 'sessions_remain'; end if;
  update public.line_identity_ops set credentials_reset_at = coalesce(credentials_reset_at, now()) where ref = p_ref;
  perform public.f4_audit('credentials_reset', o.line_id, o.user_id, p_actor, p_ref, '{}'::jsonb);
  return 'ok';
end $$;

-- step 3: map the LINE id — only after a verified reset; any failure leaves a durable 'failed' state for an admin
create or replace function public.line_op_commit(p_ref text, p_token uuid, p_actor text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.line_identity_ops%rowtype; res text;
begin
  select * into o from public.line_identity_ops where ref = p_ref;
  if not found then return 'invalid'; end if;
  perform public.f4_lock(o.line_id, o.user_id);
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if o.status = 'approved' then return 'already'; end if;
  if o.status <> 'approving' or o.lock_token is distinct from p_token then return 'invalid'; end if;
  if o.credentials_reset_at is null then return 'reset_missing'; end if;
  res := public.f4_claim(o.line_id, o.user_id, case o.kind when 'admin_recovery' then 'recovery' else 'legacy_link' end, p_actor, p_ref);
  if res in ('ok', 'already') then
    update public.line_identity_ops set status = 'approved', decided_at = now(), lock_token = null, version = version + 1 where ref = p_ref;
    perform public.f4_audit('op_approved', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('kind', o.kind));
    return 'ok';
  end if;
  update public.line_identity_ops set status = 'failed', decided_at = now(), version = version + 1,
         decision_reason = coalesce(decision_reason, '') || ' | commit: ' || res where ref = p_ref;
  perform public.f4_audit('op_failed', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('claim', res));
  return res;
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
  select * into o from public.line_identity_ops where ref = p_ref for update;
  if not found or o.status <> 'approving' or o.lock_token is distinct from p_token then return 'invalid'; end if;
  if o.credentials_reset_at is not null then return 'reset_done_resume_instead'; end if;
  update public.line_identity_ops set status = case kind when 'admin_recovery' then 'open' else 'failed' end,
         lock_token = null, pw_digest_at_begin = null, version = version + 1 where ref = p_ref;
  perform public.f4_audit('op_aborted', o.line_id, o.user_id, p_actor, p_ref, jsonb_build_object('reason', p_reason));
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

-- ── privileges: functions only, service_role only ──────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'f4_placeholder(text)', 'f4_lock(text,uuid)', 'f4_audit(text,text,uuid,text,text,jsonb)', 'f4_valid_line(text)', 'f4_legacy_user(text)',
    'f4_claim(text,uuid,text,text,text)', 'f4_new_ref()', 'f4_pw_digest(uuid)', 'line_identity_audit_immutable()',
    'line_login_resolve(text)', 'line_identity_of(uuid)', 'line_identity_claim(text,uuid,text,text)', 'line_identity_release(uuid,text)',
    'line_link_pending_put(uuid,text,text,text,int)', 'line_link_take(uuid,text)', 'line_link_pending_clear(uuid)', 'line_link_status(uuid)',
    'line_recovery_record(text,text)', 'line_recovery_evidence(text)', 'line_recovery_begin(text,uuid,int,text,text,jsonb)',
    'line_legacy_link_begin(uuid,text,text)', 'line_op_mark_reset(text,uuid,text)', 'line_op_commit(text,uuid,text)',
    'line_legacy_link_resume(text)', 'line_op_abort(text,uuid,text,text)', 'line_recovery_decline(text,int,text,text)', 'line_recovery_list()']
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'line_login_resolve(text)', 'line_identity_of(uuid)', 'line_identity_claim(text,uuid,text,text)', 'line_identity_release(uuid,text)',
    'line_link_pending_put(uuid,text,text,text,int)', 'line_link_take(uuid,text)', 'line_link_pending_clear(uuid)', 'line_link_status(uuid)',
    'line_recovery_record(text,text)', 'line_recovery_evidence(text)', 'line_recovery_begin(text,uuid,int,text,text,jsonb)',
    'line_legacy_link_begin(uuid,text,text)', 'line_op_mark_reset(text,uuid,text)', 'line_op_commit(text,uuid,text)',
    'line_legacy_link_resume(text)', 'line_op_abort(text,uuid,text,text)', 'line_recovery_decline(text,int,text,text)', 'line_recovery_list()']
  loop
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

do $$ begin
  if has_function_privilege('anon', 'public.line_identity_claim(text,uuid,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.line_link_take(uuid,text)', 'EXECUTE')
     or has_table_privilege('authenticated', 'public.line_identities', 'SELECT')
     or has_table_privilege('service_role', 'public.line_identities', 'INSERT') then
    raise exception 'STOP: F4 LINE identity objects reachable outside the functions';
  end if;
end $$;
