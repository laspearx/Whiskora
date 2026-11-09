-- F4 (20261110090000_line_identity_map, rev. 3): local throwaway Postgres only — synthetic users, run after
-- f4_auth_stub.sql (which reproduces Supabase's default privileges) and the migration. Prints PASS/FAIL per check and
-- a summary line. Statements run as postgres stand for the Auth server (GoTrue) writing its own tables.
\set QUIET on
create temp table r (n serial, name text, ok boolean, detail text);
grant all on r to service_role; grant usage on sequence r_n_seq to service_role;
create function pg_temp.t(p_name text, p_ok boolean, p_detail text default '') returns void language sql as
  $$ insert into r (name, ok, detail) values (p_name, coalesce(p_ok, false), p_detail) $$;
create function pg_temp.err(p_sql text) returns text language plpgsql as
  $$ begin execute p_sql; return 'no error'; exception when others then return sqlerrm; end $$;
create function pg_temp.mk(p_email text, p_age interval default '0'::interval, p_meta jsonb default '{}'::jsonb) returns uuid language plpgsql as $$
declare id uuid;
begin
  insert into auth.users (email, encrypted_password, raw_user_meta_data, created_at)
  values (lower(p_email), extensions.crypt('planted-' || p_email, extensions.gen_salt('bf', 4)), p_meta, now() - p_age) returning auth.users.id into id;
  insert into auth.identities (user_id, provider, identity_data, created_at)
  values (id, 'email', jsonb_build_object('sub', id, 'email', lower(p_email), 'email_verified', true, 'phone_verified', false), now() - p_age);
  return id;
end $$;
-- GoTrue: a new session and its AMR claim are written in one transaction
create function pg_temp.sess(p_user uuid, p_method text, p_after interval default '2 seconds') returns uuid language plpgsql as $$
declare s uuid;
begin
  insert into auth.sessions (user_id, created_at) select p_user, created_at + p_after from auth.users where id = p_user returning id into s;
  insert into auth.mfa_amr_claims (session_id, authentication_method) values (s, p_method);
  return s;
end $$;
-- GoTrue admin password update: new bcrypt hash + every session revoked, one transaction
create function pg_temp.rotate(p_user uuid, p_secret text) returns void language plpgsql as $$
begin
  update auth.users set encrypted_password = extensions.crypt(p_secret, extensions.gen_salt('bf', 4)) where id = p_user;
  delete from auth.sessions where user_id = p_user;
end $$;
-- the app's link: callback writes the pending row, confirm consumes it (the real API path)
create function pg_temp.link(p_user uuid, p_line text, p_nonce text default repeat('e', 64)) returns text language plpgsql as $$
begin
  perform public.line_link_pending_put(p_user, p_line, 'Name', p_nonce, 300);
  return (select result from public.line_link_confirm(p_user, p_nonce, 'test'));
end $$;
grant execute on function pg_temp.t(text, boolean, text), pg_temp.err(text), pg_temp.link(uuid, text, text) to service_role;

-- synthetic LINE ids (U + 32 chars, mixed case like real ids)
\set X 'U00000000000000000000000000000x01'
\set Y 'U00000000000000000000000000000y02'
\set Z 'U00000000000000000000000000000z03'
\set L 'U0000000000000000000000000000l004'
\set S 'U0000000000000000000000000000s005'
\set Q 'U0000000000000000000000000000q006'
\set W 'U0000000000000000000000000000w007'
\set V 'U0000000000000000000000000000v008'
\set SECRET 'rotation-secret-0123456789abcdef0123456789abcdef'

select pg_temp.mk('a@example.invalid') as a \gset
select pg_temp.mk('b@example.invalid') as b \gset
-- Google + claim (V3 shape)
select pg_temp.mk('g@example.invalid', '30 days', jsonb_build_object('line_id', :'Y')) as g \gset
-- legacy LINE-only
select pg_temp.mk(public.f4_placeholder(:'L'), '90 days', jsonb_build_object('line_id', :'L')) as legacy \gset
select pg_temp.mk(public.f4_placeholder(:'S'), '60 days', jsonb_build_object('line_id', :'S')) as selfleg \gset
select pg_temp.mk(public.f4_placeholder(:'W'), '50 days') as inflight \gset
select pg_temp.mk(public.f4_placeholder(:'V'), '40 days') as unl \gset
-- just created by the callback
select pg_temp.mk(public.f4_placeholder(:'X'), '0') as fresh \gset
insert into auth.identities (user_id, provider) values (:'g', 'google');
select pg_temp.sess(:'legacy', 'otp'); select pg_temp.sess(:'selfleg', 'otp'); select pg_temp.sess(:'inflight', 'otp');

-- ── privileges (with Supabase's default grants in place) ──
select pg_temp.t('priv: anon cannot execute claim', not has_function_privilege('anon', 'public.line_identity_claim(text,uuid,text,text)', 'EXECUTE'));
select pg_temp.t('priv: authenticated cannot execute confirm', not has_function_privilege('authenticated', 'public.line_link_confirm(uuid,text,text)', 'EXECUTE'));
select pg_temp.t('priv: authenticated cannot read mapping', not has_table_privilege('authenticated', 'public.line_identities', 'SELECT'));
select pg_temp.t('priv: service_role cannot touch tables directly', not has_table_privilege('service_role', 'public.line_identities', 'INSERT')
  and not has_table_privilege('service_role', 'public.line_link_pending', 'DELETE') and not has_table_privilege('service_role', 'public.line_identity_audit', 'UPDATE')
  and not has_table_privilege('service_role', 'public.line_credential_freeze', 'UPDATE'));
select pg_temp.t('priv: no internal f4_* helper executable by any API role', not exists (
  select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and (p.proname like 'f4\_%' or p.proname = 'line_identity_audit_immutable')
     and (has_function_privilege('service_role', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE')
          or has_function_privilege('anon', p.oid, 'EXECUTE'))));
select pg_temp.t('priv: audit sequence not usable by API roles', not has_sequence_privilege('service_role', 'public.line_identity_audit_id_seq', 'USAGE,UPDATE')
  and not has_sequence_privilege('authenticated', 'public.line_identity_audit_id_seq', 'USAGE,UPDATE'));
select pg_temp.t('priv: old two-step API is gone', to_regprocedure('public.line_link_take(uuid,text)') is null
  and to_regprocedure('public.line_legacy_link_begin(uuid,text,text)') is null);
select pg_temp.t('priv: service_role can execute the API', has_function_privilege('service_role', 'public.line_link_confirm(uuid,text,text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.line_op_mark_reset(text,uuid,text,text)', 'EXECUTE'));

set role service_role;
select pg_temp.t('priv: service_role → f4_claim denied', pg_temp.err(format('select public.f4_claim(%L, %L, %L, %L, null)', :'Q', :'a', 'recovery', 'x')) like '%permission denied%');
select pg_temp.t('priv: service_role → f4_audit denied (no forged audit rows)', pg_temp.err('select public.f4_audit(''forged'', null, null, ''x'', null, ''{}'')') like '%permission denied%');
select pg_temp.t('priv: service_role → f4_freeze_grace denied', pg_temp.err(format('select public.f4_freeze_grace(%L, %L)', :'a', 'x')) like '%permission denied%');
select pg_temp.t('priv: service_role → f4_end_op denied', pg_temp.err('select public.f4_end_op(''00000000'', ''approved'', ''x'')') like '%permission denied%');
select pg_temp.t('priv: service_role → audit sequence denied', pg_temp.err('select setval(''public.line_identity_audit_id_seq'', 1)') like '%permission denied%');

-- ── resolve + login_create ──
select pg_temp.t('resolve: fresh placeholder = creating', (select kind from public.line_login_resolve(:'X')) = 'creating');
select pg_temp.t('claim: login_create on the fresh placeholder', public.line_identity_claim(:'X', :'fresh', 'login_create', 'test') = 'ok');
select pg_temp.t('resolve: holder after create', (select kind || ':' || (user_id = :'fresh') from public.line_login_resolve(:'X')) = 'holder:true');
select pg_temp.t('claim: login_create never on a legacy (old) placeholder', public.line_identity_claim(:'L', :'legacy', 'login_create', 'test') = 'invalid');
select pg_temp.t('claim: login_create never on a non-placeholder account', public.line_identity_claim(:'Q', :'a', 'login_create', 'test') = 'invalid');
select pg_temp.t('claim: only login_create through line_identity_claim', public.line_identity_claim(:'Q', :'a', 'link_confirm', 'test') = 'invalid'
  and public.line_identity_claim(:'Q', :'a', 'recovery', 'test') = 'invalid');
select pg_temp.t('resolve: legacy LINE-only account', (select kind from public.line_login_resolve(:'L')) = 'legacy');
select pg_temp.t('resolve: only a user_metadata claim = claims (never an account)', (select kind || coalesce(user_id::text, '') from public.line_login_resolve(:'Y')) = 'claims');
select pg_temp.t('resolve: invalid id', (select kind from public.line_login_resolve('bad id!')) = 'invalid');

-- ── uniqueness (through the confirm API) ──
select pg_temp.t('unique: second holder refused', pg_temp.link(:'a', :'X') = 'line_taken');
select pg_temp.t('unique: one LINE per account', pg_temp.link(:'fresh', :'Z') = 'user_has_other');
select pg_temp.t('link: other account cannot take a LINE id that has a legacy account', pg_temp.link(:'g', :'L') = 'legacy_exists');
select pg_temp.t('link: Google account (V3) links its LINE', pg_temp.link(:'g', :'Y') = 'ok');

-- ── pending link ──
select pg_temp.t('pending: put', public.line_link_pending_put(:'a', :'Z', 'Name', repeat('a', 64), 300) = 'ok');
select pg_temp.t('pending: wrong nonce = mismatch (and consumed)', (select result from public.line_link_confirm(:'a', repeat('b', 64), 't')) = 'mismatch');
select pg_temp.t('pending: consumed after mismatch', (select result from public.line_link_confirm(:'a', repeat('a', 64), 't')) = 'missing');
select pg_temp.t('pending: confirm ok', public.line_link_pending_put(:'a', :'Z', 'Name', repeat('a', 64), 300) = 'ok'
  and (select result || ':' || line_id from public.line_link_confirm(:'a', repeat('a', 64), 't')) = 'ok:' || :'Z');
select pg_temp.t('pending: … mapped by that same call', public.line_identity_of(:'a') = :'Z');
select pg_temp.t('pending: replay after confirm = missing', (select result from public.line_link_confirm(:'a', repeat('a', 64), 't')) = 'missing');
select pg_temp.t('pending: ttl bounds', public.line_link_pending_put(:'a', :'Z', 'x', repeat('a', 64), 5) = 'invalid');
select pg_temp.t('unlink: ok', public.line_identity_release(:'a', 'test') = 'ok');
select pg_temp.t('unlink: also deletes a pending link (an older confirm finds nothing)', public.line_link_pending_put(:'a', :'Z', 'n', repeat('f', 64), 300) = 'ok'
  and public.line_identity_release(:'a', 'test') = 'none' and (select result from public.line_link_confirm(:'a', repeat('f', 64), 't')) = 'missing'
  and public.line_identity_of(:'a') is null);
reset role;
select public.line_link_pending_put(:'b', :'Z', 'x', repeat('c', 64), 60);
update public.line_link_pending set expires_at = now() - interval '1 second' where user_id = :'b';
set role service_role;
select pg_temp.t('pending: expired', (select result from public.line_link_confirm(:'b', repeat('c', 64), 't')) = 'expired');

-- ── Codex H2 case 1: stale callback after unlink + other account's confirm ──
select pg_temp.t('h2-1: A holds Z', pg_temp.link(:'a', :'Z') = 'ok');
select pg_temp.t('h2-1: A unlinks', public.line_identity_release(:'a', 'test') = 'ok');
select pg_temp.t('h2-1: B confirms Z', pg_temp.link(:'b', :'Z') = 'ok');
select pg_temp.t('h2-1: A''s late callback writes only a pending row', public.line_link_pending_put(:'a', :'Z', 'late', repeat('d', 64), 300) = 'ok');
select pg_temp.t('h2-1: mapping unchanged — Z held by B only', (select user_id from public.line_login_resolve(:'Z')) = :'b' and public.line_identity_of(:'a') is null);
select pg_temp.t('h2-1: A cannot later confirm Z', (select result from public.line_link_confirm(:'a', repeat('d', 64), 't')) = 'line_taken');
select pg_temp.t('release: none when nothing linked', public.line_identity_release(:'a', 'test') = 'none');

-- ── admin recovery (M1 / M2 / H1) ──
select public.line_recovery_record(:'L', 'Legacy User') as ref \gset
select pg_temp.t('recovery: request recorded for the legacy account', :'ref' ~ '^[0-9a-f]{8}$');
select pg_temp.t('recovery: repeat sign-in keeps the same request', public.line_recovery_record(:'L', 'Legacy User') = :'ref');
select pg_temp.t('recovery: no request for a LINE id without legacy account', public.line_recovery_record(:'Q', 'x') is null);
select pg_temp.t('recovery: evidence (server signals)', (public.line_recovery_evidence(:'ref') ->> 'creation_otp_session_10s')::boolean
  and (public.line_recovery_evidence(:'ref') ->> 'placeholder_matches')::boolean);
select pg_temp.t('recovery: wrong version refused', pg_temp.err(format('select public.line_recovery_begin(%L, %L, 2, %L, %L, %L)', :'ref', :'legacy', 'owner', 'reason long enough', '["a check one","a check two"]')) like '%version%');
reset role;
update public.line_identity_ops set last_requested_at = now() - interval '15 days' where ref = :'ref';
set role service_role;
select pg_temp.t('recovery: stale request (15 days) refused', pg_temp.err(format('select public.line_recovery_begin(%L, %L, 1, %L, %L, %L)', :'ref', :'legacy', 'owner', 'reason long enough', '["a check one","a check two"]')) like '%expired%');
reset role;
update public.line_identity_ops set last_requested_at = now() where ref = :'ref';
set role service_role;
select pg_temp.t('recovery: one owner check refused', pg_temp.err(format('select public.line_recovery_begin(%L, %L, 1, %L, %L, %L)', :'ref', :'legacy', 'owner', 'reason long enough', '["only one check"]')) like '%two owner checks%');
select pg_temp.t('recovery: wrong user refused (exact)', pg_temp.err(format('select public.line_recovery_begin(%L, %L, 1, %L, %L, %L)', :'ref', :'a', 'owner', 'reason long enough', '["a check one","a check two"]')) like '%user id%');
select public.line_recovery_begin(:'ref', :'legacy', 1, 'owner', 'verified with the user by phone', '["pets count matches","finance entry matches"]') as tok \gset
select pg_temp.t('recovery: begin → approving with token', :'tok' ~ '^[0-9a-f-]{36}$');
select pg_temp.t('recovery: commit before reset refused (H1)', public.line_op_commit(:'ref', :'tok', 'owner') = 'reset_missing');
select pg_temp.t('recovery: mark_reset refuses unchanged password', public.line_op_mark_reset(:'ref', :'tok', 'owner', :'SECRET') = 'password_unchanged');
reset role;
select pg_temp.t('freeze: begin froze the account (phase rotation)', public.f4_frozen(:'legacy') = 'rotation');
select pg_temp.t('freeze: no sign-in while the op runs (planted password grant)', pg_temp.err(format('select pg_temp.sess(%L, %L)', :'legacy', 'password')) like '%sign-in refused%');
select pg_temp.t('freeze: no identity added while the op runs', pg_temp.err(format('insert into auth.identities (user_id, provider) values (%L, %L)', :'legacy', 'google')) like '%identity change refused%');
select pg_temp.t('freeze: no email change while waiting for the rotation', pg_temp.err(format('update auth.users set email_change = %L where id = %L', 'evil@example.invalid', :'legacy')) like '%frozen%');
-- the app's rotation (GoTrue admin update) is the first password change: let through and recorded
update auth.users set encrypted_password = extensions.crypt(:'SECRET', extensions.gen_salt('bf', 4)) where id = :'legacy';
select pg_temp.t('freeze: rotation recorded (phase rotated)', public.f4_frozen(:'legacy') = 'rotated');
select pg_temp.t('freeze: a second password change (in-flight request landing after the rotation) is refused',
  pg_temp.err(format('update auth.users set encrypted_password = %L where id = %L', '$2a$04$attackerattackerattackerattackerattackeratt', :'legacy')) like '%frozen%');
set role service_role;
select pg_temp.t('recovery: mark_reset refuses while sessions remain', public.line_op_mark_reset(:'ref', :'tok', 'owner', :'SECRET') = 'sessions_remain');
reset role;
delete from auth.sessions where user_id = :'legacy';
set role service_role;
select pg_temp.t('recovery: mark_reset refuses a wrong / missing secret', public.line_op_mark_reset(:'ref', :'tok', 'owner', 'x') = 'rotation_not_verified'
  and public.line_op_mark_reset(:'ref', :'tok', 'owner', repeat('z', 48)) = 'rotation_not_verified');
select pg_temp.t('recovery: abort after reset is refused (resume instead)', public.line_op_mark_reset(:'ref', :'tok', 'owner', :'SECRET') = 'ok'
  and public.line_op_abort(:'ref', :'tok', 'owner', 'x') = 'reset_done_resume_instead');
select pg_temp.t('recovery: wrong token refused', public.line_op_commit(:'ref', gen_random_uuid(), 'owner') = 'invalid');
select pg_temp.t('recovery: commit maps the legacy account', public.line_op_commit(:'ref', :'tok', 'owner') = 'ok'
  and (select user_id from public.line_login_resolve(:'L')) = :'legacy');
select pg_temp.t('recovery: commit is idempotent', public.line_op_commit(:'ref', :'tok', 'owner') = 'already');
reset role;
select pg_temp.t('grace: freeze kept 10 minutes after the commit', public.f4_frozen(:'legacy') = 'grace'
  and (select until > now() + interval '9 minutes' from public.line_credential_freeze where user_id = :'legacy'));
select pg_temp.t('grace: in-flight password change after commit refused', pg_temp.err(format('update auth.users set encrypted_password = %L where id = %L', 'x', :'legacy')) like '%frozen%');
select pg_temp.t('grace: in-flight password sign-in after commit refused', pg_temp.err(format('select pg_temp.sess(%L, %L)', :'legacy', 'password')) like '%sign-in refused%');
select pg_temp.t('grace: in-flight OAuth identity link after commit refused', pg_temp.err(format('insert into auth.identities (user_id, provider) values (%L, %L)', :'legacy', 'google')) like '%identity change refused%');
select pg_temp.t('grace: the owner''s LINE sign-in (OTP issued by the app) works', pg_temp.err(format('select pg_temp.sess(%L, %L)', :'legacy', 'otp')) = 'no error');
select pg_temp.t('grace: other accounts unaffected', pg_temp.err(format('update auth.users set encrypted_password = %L where id = %L', 'y', :'b')) = 'no error'
  and pg_temp.err(format('select pg_temp.sess(%L, %L)', :'b', 'password')) = 'no error');
update public.line_credential_freeze set until = now() - interval '1 second' where user_id = :'legacy';
select pg_temp.t('grace: after the grace period the owner can change credentials again', pg_temp.err(format('update auth.users set encrypted_password = %L where id = %L', 'z', :'legacy')) = 'no error');
select pg_temp.t('audit: begin/reset/claim/approved recorded', (select count(*) from public.line_identity_audit where ref = :'ref' and action in ('recovery_begin', 'credentials_reset', 'claim', 'op_approved')) = 4);
select pg_temp.t('audit: append-only', pg_temp.err('update public.line_identity_audit set actor = ''x''') like '%append-only%');

-- decline path
select pg_temp.mk(public.f4_placeholder(:'Q'), '45 days') as legacy2 \gset
set role service_role;
select public.line_recovery_record(:'Q', 'Two') as ref2 \gset
select pg_temp.t('decline: reason required', public.line_recovery_decline(:'ref2', 1, 'owner', 'short') = 'reviewer_and_reason_required');
select pg_temp.t('decline: ok', public.line_recovery_decline(:'ref2', 1, 'owner', 'could not verify ownership') = 'ok');
select pg_temp.t('decline: cannot begin a declined request', pg_temp.err(format('select public.line_recovery_begin(%L, %L, 2, %L, %L, %L)', :'ref2', :'legacy2', 'owner', 'reason long enough', '["a check one","a check two"]')) like '%declined%');
-- abort before reset
select public.line_recovery_record(:'Q', 'Two') as ref3 \gset
select public.line_recovery_begin(:'ref3', :'legacy2', 1, 'owner', 'verified with the user by phone', '["check number one","check number two"]') as tok3 \gset
select pg_temp.t('abort: before reset', public.line_op_abort(:'ref3', :'tok3', 'owner', 'user stopped answering') = 'ok');
reset role;
select pg_temp.t('abort: back to open with a new version', (select status || version from public.line_identity_ops where ref = :'ref3') = 'open3');
select pg_temp.t('abort: freeze moved to grace (in-flight writes still refused)', public.f4_frozen(:'legacy2') = 'grace');
set role service_role;

-- ── signed-in legacy link (H1): reset required, crash after reset is resumed by the next LINE sign-in ──
select pg_temp.t('self link: LINE-only account never plain-links', public.line_link_pending_put(:'selfleg', :'S', 'Self', repeat('5', 64), 300) = 'ok');
select result as sres, ref as sref, token as stok from public.line_link_confirm(:'selfleg', repeat('5', 64), 'self') \gset
select pg_temp.t('self link: confirm opens a credential-reset op (no mapping yet)', :'sres' = 'legacy' and :'sref' ~ '^[0-9a-f]{8}$'
  and public.line_identity_of(:'selfleg') is null);
select pg_temp.t('self link: other account cannot use that LINE id', pg_temp.link(:'a', :'S') = 'legacy_exists');
reset role;
select pg_temp.rotate(:'selfleg', :'SECRET');
set role service_role;
select pg_temp.t('self link: reset verified', public.line_op_mark_reset(:'sref', :'stok', 'self', :'SECRET') = 'ok');
select pg_temp.t('self link: crash before commit → resumed by next LINE sign-in', public.line_legacy_link_resume(:'S') = 'ok'
  and (select user_id from public.line_login_resolve(:'S')) = :'selfleg');
select pg_temp.t('self link: resume is a no-op afterwards', public.line_legacy_link_resume(:'S') = 'none');

-- ── Codex re-review #3: an Auth request admitted BEFORE the rotation writes FIRST (attacker's new password) ──
select pg_temp.t('in-flight: pending put', public.line_link_pending_put(:'inflight', :'W', 'W', repeat('7', 64), 300) = 'ok');
select ref as wref, token as wtok from public.line_link_confirm(:'inflight', repeat('7', 64), 'self') \gset
reset role;
-- GoTrue UserUpdate of the attacker's planted session: session checked earlier, its transaction lands now
-- (UpdatePassword(tx, &session) = new hash + log out all OTHER sessions; the attacker's own session stays)
update auth.users set encrypted_password = extensions.crypt('attacker-new-password', extensions.gen_salt('bf', 4)) where id = :'inflight';
select pg_temp.t('in-flight: the app''s rotation is then refused (exactly one change per op)',
  pg_temp.err(format('select pg_temp.rotate(%L, %L)', :'inflight', :'SECRET')) like '%frozen%');
set role service_role;
select pg_temp.t('in-flight: mark_reset cannot accept the attacker''s change as the reset', public.line_op_mark_reset(:'wref', :'wtok', 'self', :'SECRET') in ('rotation_not_verified', 'sessions_remain'));
reset role;
delete from auth.sessions where user_id = :'inflight';   -- even with no session left, the change is not the app's
set role service_role;
select pg_temp.t('in-flight: … also without sessions (bcrypt does not verify the app secret)', public.line_op_mark_reset(:'wref', :'wtok', 'self', :'SECRET') = 'rotation_not_verified');
select pg_temp.t('in-flight: the app aborts — no mapping, op failed', public.line_op_abort(:'wref', :'wtok', 'self', 'rotation refused') = 'ok'
  and public.line_identity_of(:'inflight') is null and (select kind from public.line_login_resolve(:'W')) = 'legacy');

-- ── commit re-verifies under the locks (defence in depth if a write bypassed the triggers) ──
reset role;
alter table auth.users disable trigger f4_credential_freeze;
set role service_role;
select pg_temp.t('commit-check: new op', public.line_link_pending_put(:'inflight', :'W', 'W', repeat('8', 64), 300) = 'ok');
select ref as cref, token as ctok from public.line_link_confirm(:'inflight', repeat('8', 64), 'self') \gset
reset role;
alter table auth.users enable trigger f4_credential_freeze;
select pg_temp.rotate(:'inflight', :'SECRET');
set role service_role;
select pg_temp.t('commit-check: reset verified', public.line_op_mark_reset(:'cref', :'ctok', 'self', :'SECRET') = 'ok');
reset role;
alter table auth.users disable trigger f4_credential_freeze;
update auth.users set email_change = 'evil@example.invalid' where id = :'inflight';
alter table auth.users enable trigger f4_credential_freeze;
set role service_role;
select pg_temp.t('commit-check: pending email change → refused, op failed', public.line_op_commit(:'cref', :'ctok', 'self') = 'email_changed'
  and public.line_identity_of(:'inflight') is null);
reset role;
select pg_temp.t('commit-check: failure recorded durably', (select status from public.line_identity_ops where ref = :'cref') = 'failed');

-- ── unlink during a legacy op: the op can never commit afterwards ──
set role service_role;
select pg_temp.t('unlink-op: pending put', public.line_link_pending_put(:'unl', :'V', 'V', repeat('9', 64), 300) = 'ok');
select ref as uref, token as utok from public.line_link_confirm(:'unl', repeat('9', 64), 'self') \gset
reset role;
select pg_temp.rotate(:'unl', :'SECRET');
set role service_role;
select pg_temp.t('unlink-op: reset verified', public.line_op_mark_reset(:'uref', :'utok', 'self', :'SECRET') = 'ok');
select pg_temp.t('unlink-op: release ends the op', public.line_identity_release(:'unl', 'test') = 'none');
select pg_temp.t('unlink-op: commit / resume refused afterwards', public.line_op_commit(:'uref', :'utok', 'self') = 'invalid'
  and public.line_legacy_link_resume(:'V') = 'none' and public.line_identity_of(:'unl') is null);
reset role;

select (case when ok then 'PASS  ' else 'FAIL  ' end) || name || case when not ok and detail <> '' then '  — ' || detail else '' end from r order by n;
select format('f4 sql: %s/%s passed', count(*) filter (where ok), count(*)) from r;
