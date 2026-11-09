-- F4 (20261110090000_line_identity_map): local throwaway Postgres only — synthetic users, run after f4_auth_stub.sql
-- and the migration. Prints PASS/FAIL per check and a summary line.
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
  insert into auth.users (email, encrypted_password, raw_user_meta_data, created_at) values (lower(p_email), '$2a$random', p_meta, now() - p_age) returning auth.users.id into id;
  insert into auth.identities (user_id, provider, identity_data, created_at)
  values (id, 'email', jsonb_build_object('sub', id, 'email', lower(p_email), 'email_verified', true, 'phone_verified', false), now() - p_age);
  return id;
end $$;
create function pg_temp.sess(p_user uuid, p_method text, p_after interval default '2 seconds') returns void language plpgsql as $$
declare s uuid;
begin
  insert into auth.sessions (user_id, created_at) select p_user, created_at + p_after from auth.users where id = p_user returning id into s;
  insert into auth.mfa_amr_claims (session_id, authentication_method) values (s, p_method);
end $$;
grant execute on function pg_temp.t(text, boolean, text), pg_temp.err(text) to service_role;

-- synthetic LINE ids (U + 32 hex, mixed case like real ids)
\set X 'U00000000000000000000000000000x01'
\set Y 'U00000000000000000000000000000y02'
\set Z 'U00000000000000000000000000000z03'
\set L 'U0000000000000000000000000000l004'
\set S 'U0000000000000000000000000000s005'
\set Q 'U0000000000000000000000000000q006'

select pg_temp.mk('a@example.invalid') as a \gset
select pg_temp.mk('b@example.invalid') as b \gset
-- Google + claim (V3 shape)
select pg_temp.mk('g@example.invalid', '30 days', jsonb_build_object('line_id', :'Y')) as g \gset
-- legacy LINE-only
select pg_temp.mk(public.f4_placeholder(:'L'), '90 days', jsonb_build_object('line_id', :'L')) as legacy \gset
select pg_temp.mk(public.f4_placeholder(:'S'), '60 days', jsonb_build_object('line_id', :'S')) as selfleg \gset
-- just created by the callback
select pg_temp.mk(public.f4_placeholder(:'X'), '0') as fresh \gset
insert into auth.identities (user_id, provider) values (:'g', 'google');
select pg_temp.sess(:'legacy', 'otp'); select pg_temp.sess(:'selfleg', 'otp');

-- ── privileges ──
select pg_temp.t('priv: anon cannot execute claim', not has_function_privilege('anon', 'public.line_identity_claim(text,uuid,text,text)', 'EXECUTE'));
select pg_temp.t('priv: authenticated cannot execute take', not has_function_privilege('authenticated', 'public.line_link_take(uuid,text)', 'EXECUTE'));
select pg_temp.t('priv: authenticated cannot read mapping', not has_table_privilege('authenticated', 'public.line_identities', 'SELECT'));
select pg_temp.t('priv: service_role cannot write tables directly', not has_table_privilege('service_role', 'public.line_identities', 'INSERT')
  and not has_table_privilege('service_role', 'public.line_link_pending', 'DELETE') and not has_table_privilege('service_role', 'public.line_identity_audit', 'UPDATE'));
select pg_temp.t('priv: service_role cannot call internal f4_claim', not has_function_privilege('service_role', 'public.f4_claim(text,uuid,text,text,text)', 'EXECUTE'));
select pg_temp.t('priv: service_role can execute the API', has_function_privilege('service_role', 'public.line_link_take(uuid,text)', 'EXECUTE'));

set role service_role;
-- ── resolve + login_create ──
select pg_temp.t('resolve: fresh placeholder = creating', (select kind from public.line_login_resolve(:'X')) = 'creating');
select pg_temp.t('claim: login_create on the fresh placeholder', public.line_identity_claim(:'X', :'fresh', 'login_create', 'test') = 'ok');
select pg_temp.t('resolve: holder after create', (select kind || ':' || (user_id = :'fresh') from public.line_login_resolve(:'X')) = 'holder:true');
select pg_temp.t('claim: login_create never on a legacy (old) placeholder', public.line_identity_claim(:'L', :'legacy', 'login_create', 'test') = 'invalid');
select pg_temp.t('claim: login_create never on a non-placeholder account', public.line_identity_claim(:'Q', :'a', 'login_create', 'test') = 'invalid');
select pg_temp.t('resolve: legacy LINE-only account', (select kind from public.line_login_resolve(:'L')) = 'legacy');
select pg_temp.t('resolve: only a user_metadata claim = claims (never an account)', (select kind || coalesce(user_id::text, '') from public.line_login_resolve(:'Y')) = 'claims');
select pg_temp.t('resolve: invalid id', (select kind from public.line_login_resolve('bad id!')) = 'invalid');

-- ── uniqueness ──
select pg_temp.t('unique: second holder refused', public.line_identity_claim(:'X', :'a', 'link_confirm', 'test') = 'line_taken');
select pg_temp.t('unique: one LINE per account', public.line_identity_claim(:'Z', :'fresh', 'link_confirm', 'test') = 'user_has_other');
select pg_temp.t('link: LINE-only account cannot plain-link (needs reset op)', public.line_identity_claim(:'Q', :'legacy', 'link_confirm', 'test') = 'legacy_needs_reset');
select pg_temp.t('link: other account cannot take a LINE id that has a legacy account', public.line_identity_claim(:'L', :'g', 'link_confirm', 'test') = 'legacy_exists');
select pg_temp.t('link: Google account (V3) links its LINE', public.line_identity_claim(:'Y', :'g', 'link_confirm', 'test') = 'ok');

-- ── pending link ──
select pg_temp.t('pending: put', public.line_link_pending_put(:'a', :'Z', 'Name', repeat('a', 64), 300) = 'ok');
select pg_temp.t('pending: wrong nonce = mismatch (and consumed)', (select result from public.line_link_take(:'a', repeat('b', 64))) = 'mismatch');
select pg_temp.t('pending: consumed after mismatch', (select result from public.line_link_take(:'a', repeat('a', 64))) = 'missing');
select pg_temp.t('pending: put again', public.line_link_pending_put(:'a', :'Z', 'Name', repeat('a', 64), 300) = 'ok');
select pg_temp.t('pending: take ok', (select result || ':' || line_id from public.line_link_take(:'a', repeat('a', 64))) = 'ok:' || :'Z');
select pg_temp.t('pending: replay after take = missing', (select result from public.line_link_take(:'a', repeat('a', 64))) = 'missing');
select pg_temp.t('pending: ttl bounds', public.line_link_pending_put(:'a', :'Z', 'x', repeat('a', 64), 5) = 'invalid');
reset role;
select public.line_link_pending_put(:'b', :'Z', 'x', repeat('c', 64), 60);
update public.line_link_pending set expires_at = now() - interval '1 second' where user_id = :'b';
set role service_role;
select pg_temp.t('pending: expired', (select result from public.line_link_take(:'b', repeat('c', 64))) = 'expired');

-- ── Codex H2 case 1: stale callback after unlink + other account's confirm ──
select pg_temp.t('h2-1: A holds Z', public.line_identity_claim(:'Z', :'a', 'link_confirm', 'test') = 'ok');
select pg_temp.t('h2-1: A unlinks', public.line_identity_release(:'a', 'test') = 'ok');
select pg_temp.t('h2-1: B confirms Z', public.line_identity_claim(:'Z', :'b', 'link_confirm', 'test') = 'ok');
select pg_temp.t('h2-1: A''s late callback writes only a pending row', public.line_link_pending_put(:'a', :'Z', 'late', repeat('d', 64), 300) = 'ok');
select pg_temp.t('h2-1: mapping unchanged — Z held by B only', (select user_id from public.line_login_resolve(:'Z')) = :'b' and public.line_identity_of(:'a') is null);
select pg_temp.t('h2-1: A cannot later confirm Z', (select result from public.line_link_take(:'a', repeat('d', 64))) = 'ok'
  and public.line_identity_claim(:'Z', :'a', 'link_confirm', 'test') = 'line_taken');
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
select pg_temp.t('recovery: mark_reset refuses unchanged password', public.line_op_mark_reset(:'ref', :'tok', 'owner') = 'password_unchanged');
reset role;
update auth.users set encrypted_password = '$2a$rotated' where id = :'legacy';
set role service_role;
select pg_temp.t('recovery: mark_reset refuses while sessions remain', public.line_op_mark_reset(:'ref', :'tok', 'owner') = 'sessions_remain');
reset role;
delete from auth.sessions where user_id = :'legacy';
set role service_role;
select pg_temp.t('recovery: abort after reset is refused (resume instead)', public.line_op_mark_reset(:'ref', :'tok', 'owner') = 'ok'
  and public.line_op_abort(:'ref', :'tok', 'owner', 'x') = 'reset_done_resume_instead');
select pg_temp.t('recovery: wrong token refused', public.line_op_commit(:'ref', gen_random_uuid(), 'owner') = 'invalid');
select pg_temp.t('recovery: commit maps the legacy account', public.line_op_commit(:'ref', :'tok', 'owner') = 'ok'
  and (select user_id from public.line_login_resolve(:'L')) = :'legacy');
select pg_temp.t('recovery: commit is idempotent', public.line_op_commit(:'ref', :'tok', 'owner') = 'already');
reset role;
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
set role service_role;

-- ── signed-in legacy link (H1): reset required, crash after reset is resumed by the next LINE sign-in ──
select ref as sref, token as stok from public.line_legacy_link_begin(:'selfleg', :'S', 'Self') \gset
select pg_temp.t('self link: begin', :'sref' ~ '^[0-9a-f]{8}$');
select pg_temp.t('self link: other account cannot use it', (select result from public.line_legacy_link_begin(:'a', :'S', 'x')) = 'not_legacy_of_line');
reset role;
update auth.users set encrypted_password = '$2a$rotated2' where id = :'selfleg';
delete from auth.sessions where user_id = :'selfleg';
set role service_role;
select pg_temp.t('self link: reset verified', public.line_op_mark_reset(:'sref', :'stok', 'self') = 'ok');
select pg_temp.t('self link: crash before commit → resumed by next LINE sign-in', public.line_legacy_link_resume(:'S') = 'ok'
  and (select user_id from public.line_login_resolve(:'S')) = :'selfleg');
select pg_temp.t('self link: resume is a no-op afterwards', public.line_legacy_link_resume(:'S') = 'none');
reset role;

select (case when ok then 'PASS  ' else 'FAIL  ' end) || name || case when not ok and detail <> '' then '  — ' || detail else '' end from r order by n;
select format('f4 sql: %s/%s passed', count(*) filter (where ok), count(*)) from r;
