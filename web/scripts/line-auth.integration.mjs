// F4 — end-to-end LINE login / linking / recovery against the built app (`next start`), LINE mocked, GoTrue mocked
// in memory and mirrored into a THROWAWAY LOCAL Postgres that runs the real F4 migration (scripts/line-auth-mock-preload.mjs).
// usage: F4_PG="-h 127.0.0.1 -p 54329 -U postgres" node scripts/line-auth.integration.mjs [port]
// Build first with NEXT_PUBLIC_SUPABASE_URL = any URL (it is intercepted), e.g. http://127.0.0.1:9.
import { spawn, execFileSync, execFile } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2] || 3471);
const PG = (process.env.F4_PG || '').split(' ').filter(Boolean);
if (!PG.length) { console.error('STOP: set F4_PG to a throwaway local Postgres'); process.exit(2); }
const DB = 'f4it';
const here = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(here, '..'); const repo = path.resolve(cwd, '..');
const controlPort = port + 1000;
const ADMIN = `http://127.0.0.1:${controlPort}`;
const app = `http://127.0.0.1:${port}`;
const results = [];
const hex = (n) => crypto.randomBytes(n).toString('hex');
const lid = () => 'U' + hex(16);
const ph = (id) => `line_${id}@line.whiskora.internal`.toLowerCase();
const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString();

// fresh database: stub + migration
const psql = (args) => execFileSync('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', ...PG, ...args], { encoding: 'utf8' });
psql(['-d', 'postgres', '-c', `drop database if exists ${DB}`, '-c', `create database ${DB}`]);
psql(['-d', DB, '-f', path.join(repo, 'supabase/tests/local/f4_auth_stub.sql')]);
psql(['-d', DB, '-f', path.join(repo, 'supabase/migrations/20261110090000_line_identity_map.sql')]);

async function sb(method, p, body, headers = {}) {
  const r = await fetch(ADMIN + p, { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let d; try { d = t ? JSON.parse(t) : null; } catch { d = t; } return { status: r.status, data: d };
}
const rpc = async (fn, args) => (await sb('POST', `/rest/v1/rpc/${fn}`, args)).data;
const sqlq = async (q) => (await sb('POST', '/__test/sql', { sql: q })).data?.out;
const mkUser = async (o) => { const r = await sb('POST', '/auth/v1/admin/users', { email_confirm: true, ...o }); if (r.status !== 200) throw new Error('seed ' + r.status); return r.data; };
const sessionFor = async (email) => {
  const gl = await sb('POST', '/auth/v1/admin/generate_link', { type: 'magiclink', email });
  return (await sb('POST', '/auth/v1/verify', { email, token: gl.data.email_otp, type: 'magiclink' })).data.access_token;
};
const pwLogin = async (email, password) => (await sb('POST', '/auth/v1/token?grant_type=password', { email, password }));
const whoami = async (token) => (await sb('GET', '/auth/v1/user', null, { authorization: `Bearer ${token}` }));
const holder = async (lineId) => { const r = (await rpc('line_login_resolve', { p_line_id: lineId }))?.[0]; return r?.kind === 'holder' ? r.user_id : null; };

class Jar { constructor() { this.c = new Map(); }
  take(res) { for (const sc of res.headers.getSetCookie()) { const [kv] = sc.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i); const v = kv.slice(i + 1); if (!v || /Expires=Thu, 01 Jan 1970/.test(sc) || /Max-Age=0/.test(sc)) this.c.delete(k); else this.c.set(k, v); } }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join('; '); }
  clone() { const j = new Jar(); j.c = new Map(this.c); return j; } }
async function hit(p, { jar, method = 'GET', token, body } = {}) {
  const headers = {}; if (jar?.c.size) headers.cookie = jar.header(); if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';
  const r = await fetch(app + p, { method, redirect: 'manual', headers, body: body ? JSON.stringify(body) : undefined });
  jar?.take(r); const loc = r.headers.get('location') || ''; let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, loc, data };
}
async function lineLogin(lineId, name = 'Syn', { create = false, code } = {}) {
  const jar = new Jar();
  const start = await hit(`/api/auth/line?next=%2Fprofile${create ? '&create=1' : ''}`, { jar });
  const state = new URL(start.loc).searchParams.get('state');
  const cb = await hit(`/api/auth/line/callback?code=${encodeURIComponent(code ?? `ok:${lineId}:${name}`)}&state=${state}`, { jar });
  const u = new URL(cb.loc); const hash = new URLSearchParams(u.hash.slice(1));
  return { token: hash.get('access_token'), error: u.searchParams.get('auth_error'), ref: u.searchParams.get('ref'), loc: cb.loc };
}
async function startLink(token, { jar = new Jar() } = {}) {
  const post = await hit('/api/auth/line', { jar, method: 'POST', token, body: {} });
  const g = await hit('/api/auth/line?mode=link&next=/profile/connections', { jar });
  return { post: post.status, state: new URL(g.loc).searchParams.get('state'), jar };
}
const finishLink = async (s, lineId, name = 'Syn') =>
  hit(`/api/auth/line/callback?code=${encodeURIComponent(`ok:${lineId}:${name}`)}&state=${s.state}`, { jar: s.jar });
const link = async (token, lineId) => { const s = await startLink(token); const cb = await finishLink(s, lineId); return { ...s, cb }; };
const confirm = (token, jar) => hit('/api/auth/line/confirm', { jar, method: 'POST', token });
const ok = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const script = (args, env = {}) => new Promise((resolve) => execFile(process.execPath, [path.join(repo, 'supabase/scripts/line_identity_recovery.mjs'), ...args, '--project', 'f4test'],
  { env: { ...process.env, SUPABASE_URL: ADMIN, F4_TEST_URL: ADMIN, SUPABASE_SERVICE_ROLE_KEY: 'synthetic', ...env } },
  (err, out, errOut) => resolve({ code: err ? err.code : 0, out: out + errOut })));

async function scenarios() {
  // normal LINE login
  const A = lid(); const l1 = await lineLogin(A, 'Normal');
  const a1 = (await whoami(l1.token)).data;
  ok('normal: first LINE sign-in creates the account and the mapping', !!l1.token && (await holder(A)) === a1?.id, l1.error);
  ok('normal: account email is the placeholder (never an email from LINE)', a1?.email === ph(A));
  const l1b = await lineLogin(A, 'Normal');
  ok('normal: second sign-in reaches the same account', (await whoami(l1b.token)).data?.id === a1?.id);

  // legacy LINE-only: no automatic sign-in, durable recovery request
  const V1 = lid(); await mkUser({ email: ph(V1), __created_at: daysAgo(90), user_metadata: { line_id: V1, provider: 'line' } });
  const l3 = await lineLogin(V1);
  ok('legacy: LINE sign-in alone does not sign in (LINE_ACCOUNT_REVIEW + reference)', !l3.token && l3.error === 'LINE_ACCOUNT_REVIEW' && /^[0-9a-f]{8}$/.test(l3.ref || ''), l3.loc);
  ok('legacy: request recorded in the database, mapping unchanged', (await rpc('line_recovery_list')).some((r) => r.ref === l3.ref) && !(await holder(V1)));
  ok('legacy: repeated sign-in keeps one request', (await lineLogin(V1)).ref === l3.ref);

  // Codex H1 — signed-in legacy link evicts credentials / sessions planted before F4
  const H = lid(); const atkPw = 'Attacker-' + hex(6);
  const h = await mkUser({ email: ph(H), password: atkPw, __created_at: daysAgo(60), user_metadata: { line_id: H } });
  const atkTok = (await pwLogin(h.email, atkPw)).data.access_token;
  const ownerTok = await sessionFor(h.email);
  const st4 = (await hit('/api/auth/line/status', { token: ownerTok })).data;
  ok('H1: status marks the account as legacy (banner)', st4?.legacy === true && st4?.linked === false, st4);
  const lk4 = await link(ownerTok, H);
  ok('H1: link callback stops at a pending confirmation', /confirm_line=1/.test(lk4.cb.loc) && !(await holder(H)));
  const c4 = await confirm(ownerTok, lk4.jar);
  ok('H1: confirm succeeds and asks to sign in again', c4.status === 200 && c4.data?.relogin === true, c4.data);
  ok('H1: attacker password no longer works', (await pwLogin(h.email, atkPw)).status === 400);
  ok('H1: attacker session revoked', (await whoami(atkTok)).status === 403);
  ok('H1: owner session revoked too (re-login required)', (await whoami(ownerTok)).status === 403);
  const l4 = await lineLogin(H);
  ok('H1: owner signs in with LINE into the same account', (await whoami(l4.token)).data?.id === h.id && (await holder(H)) === h.id);
  ok('H1: audit has begin / reset / claim / approved', (await sqlq(`select count(*) from public.line_identity_audit where user_id = '${h.id}' and action in ('legacy_link_begin','credentials_reset','claim','op_approved')`)) === '4');
  // re-review #3: an Auth request of the attacker's old session admitted before the rotation lands after the commit
  const late = await sqlq(`update auth.users set encrypted_password = extensions.crypt('late-attacker', extensions.gen_salt('bf', 4)) where id = '${h.id}'`);
  ok('#3: in-flight password change landing after the commit is refused (grace period)', late === undefined && (await pwLogin(h.email, 'late-attacker')).status === 400);
  const lateEmail = await sqlq(`update auth.users set email_change = 'evil@example.invalid' where id = '${h.id}'`);
  ok('#3: in-flight email change landing after the commit is refused', lateEmail === undefined && (await sqlq(`select coalesce(email_change, '') from auth.users where id = '${h.id}'`)) === '');
  ok('#3: owner LINE sign-in still works during the grace period', !!(await whoami((await lineLogin(H)).token)).data?.id);

  // re-review #3: the attacker's in-flight password change commits BEFORE the app's rotation
  const I = lid(); const iPw = 'Attacker-' + hex(6);
  const iu = await mkUser({ email: ph(I), password: iPw, __created_at: daysAgo(60) });
  const iAtk = (await pwLogin(iu.email, iPw)).data.access_token;
  const iOwner = await sessionFor(iu.email);
  const li = await link(iOwner, I);
  await sb('POST', '/__test/inflight-before-next-password-update', { password: 'attacker-chosen' });
  const ci = await confirm(iOwner, li.jar);
  ok('#3: app rotation refused after an in-flight change → reset failed, nothing mapped', ci.data?.error === 'LINE_CREDENTIAL_RESET_FAILED' && !(await holder(I)), ci.data);
  ok('#3: the op is closed (no approving op left to resume)', (await sqlq(`select string_agg(status, ',') from public.line_identity_ops where user_id = '${iu.id}'`)) === 'failed');
  ok('#3: LINE sign-in for that account still goes to review (no automatic sign-in)', (await lineLogin(I)).error === 'LINE_ACCOUNT_REVIEW');
  ok('#3: the attacker gains nothing new: account still unmapped legacy', !(await holder(I)) && iAtk.length > 0);

  // re-review #2: confirm and unlink sent together — whatever the order, unlink is never undone afterwards
  const U2 = lid(); const gu = await mkUser({ email: `f4.gu.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const tu = await sessionFor(gu.email); const lu = await link(tu, U2);
  const [cu, du] = await Promise.all([confirm(tu, lu.jar), hit('/api/auth/line', { method: 'DELETE', token: tu })]);
  const unlinkLast = (await sqlq(`select action from public.line_identity_audit where user_id = '${gu.id}' order by id desc limit 1`)) === 'release';
  ok('#2: concurrent confirm + unlink end consistently (mapped only if the unlink ran first and found nothing)',
    du.status === 200 && ((await holder(U2)) === null ? (cu.status === 200 ? unlinkLast : cu.data?.error === 'LINK_PENDING_MISSING') : !unlinkLast), [cu.data, du.status]);

  // Google + LINE (V3)
  const V3 = lid(); const g = await mkUser({ email: `f4.v3.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }], user_metadata: { line_id: V3 } });
  const l5 = await lineLogin(V3);
  ok('V3: only a user_metadata claim → relink prompt, no session', !l5.token && l5.error === 'LINE_RELINK_SUGGESTED', l5.error);
  const gtok = await sessionFor(g.email); const lk5 = await link(gtok, V3); const c5 = await confirm(gtok, lk5.jar);
  ok('V3: signed-in link + confirm maps the Google account (no relogin)', c5.status === 200 && !c5.data?.relogin && (await holder(V3)) === g.id, c5.data);
  ok('V3: LINE sign-in now reaches the Google account', (await whoami((await lineLogin(V3)).token)).data?.id === g.id);

  // forged claim / email hijack / pre-registration after deploy / legacy protection
  const forger = await mkUser({ email: `f4.forger.${hex(3)}@example.invalid`, user_metadata: { line_id: A } });
  ok('forged user_metadata claim cannot capture the holder\'s login', (await whoami((await lineLogin(A)).token)).data?.id === a1?.id && a1?.id !== forger.id);
  const victim = await mkUser({ email: `f4.victim.${hex(3)}@example.invalid` });
  const W = lid(); const l7 = await lineLogin(W);
  ok('email hijack: a new LINE user gets its own placeholder account', (await whoami(l7.token)).data?.email === ph(W) && (await holder(W)) !== victim.id);
  const P = lid(); await mkUser({ email: ph(P), password: 'Attacker-' + hex(6), __created_at: daysAgo(1) });
  const l8 = await lineLogin(P);
  ok('pre-registration: LINE owner is not signed into the attacker\'s placeholder', !l8.token && l8.error === 'LINE_ACCOUNT_REVIEW' && !(await holder(P)), l8.error);
  const gp = await mkUser({ email: `f4.gp.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const tgp = await sessionFor(gp.email); const lk9 = await link(tgp, P); const c9 = await confirm(tgp, lk9.jar);
  ok('a legacy account cannot be orphaned by another account\'s link', c9.data?.error === 'LINE_LEGACY_ACCOUNT_EXISTS' && !(await holder(P)), c9.data);

  // Codex H2 #1 — A's late callback after A unlinked and B confirmed
  const X = lid(); const ga = await mkUser({ email: `f4.ga.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const gb = await mkUser({ email: `f4.gb.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const ta = await sessionFor(ga.email); const tb = await sessionFor(gb.email);
  const la = await link(ta, X); await confirm(ta, la.jar);
  ok('H2#1 setup: A holds X', (await holder(X)) === ga.id);
  const lateA = await startLink(ta);                                       // A's callback starts…
  ok('H2#1: A unlinks X', (await hit('/api/auth/line', { method: 'DELETE', token: ta })).status === 200 && !(await holder(X)));
  const lb = await link(tb, X); const cb10 = await confirm(tb, lb.jar);
  ok('H2#1: B confirms X', cb10.status === 200 && (await holder(X)) === gb.id, cb10.data);
  await finishLink(lateA, X);                                              // …and only now finishes
  ok('H2#1: the late callback does not bring X back to A', (await holder(X)) === gb.id);
  const c10 = await confirm(ta, lateA.jar);
  ok('H2#1: confirming the late pending link is refused (X taken)', c10.data?.error === 'LINE_LINKED_TO_OTHER' && (await holder(X)) === gb.id, c10.data);

  // Codex H2 #2 — concurrent replay of one pending link
  const R = lid(); const gr = await mkUser({ email: `f4.gr.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const tr = await sessionFor(gr.email); const lr = await link(tr, R); const replay = lr.jar.clone();
  const [r1, r2] = await Promise.all([confirm(tr, lr.jar), confirm(tr, replay)]);
  const okCount = [r1, r2].filter((r) => r.status === 200).length;
  ok('H2#2: two concurrent confirms of one pending link → exactly one succeeds', okCount === 1 && [r1, r2].some((r) => r.data?.error === 'LINK_PENDING_MISSING'), [r1.data, r2.data]);
  await hit('/api/auth/line', { method: 'DELETE', token: tr });
  const r3 = await confirm(tr, replay);
  ok('H2#2: after unlink the replayed confirm cannot re-link', r3.data?.error === 'LINK_PENDING_MISSING' && !(await holder(R)), r3.data);

  // concurrent link of one LINE id into two accounts
  const C = lid(); const gc = await mkUser({ email: `f4.gc.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const gd = await mkUser({ email: `f4.gd.${hex(3)}@example.invalid`, __identities: [{ provider: 'google' }] });
  const tc = await sessionFor(gc.email); const td = await sessionFor(gd.email);
  const lc = await link(tc, C); const ld = await link(td, C);
  const [rc, rd] = await Promise.all([confirm(tc, lc.jar), confirm(td, ld.jar)]);
  ok('concurrent link of one LINE id: exactly one holder', [rc, rd].filter((r) => r.status === 200).length === 1 && [rc, rd].some((r) => r.data?.error === 'LINE_LINKED_TO_OTHER'), [rc.data, rd.data]);

  // expired / session change / logout / unlink / decline
  const E = lid(); const ge = await mkUser({ email: `f4.ge.${hex(3)}@example.invalid` }); const te = await sessionFor(ge.email);
  const le = await link(te, E); await sqlq(`update public.line_link_pending set expires_at = now() - interval '1 second' where user_id = '${ge.id}'`);
  const ce = await confirm(te, le.jar);
  ok('expired pending link refused and consumed', ce.data?.error === 'LINK_PENDING_EXPIRED' && (await sqlq(`select count(*) from public.line_link_pending where user_id = '${ge.id}'`)) === '0', ce.data);
  const F = lid(); const gf = await mkUser({ email: `f4.gf.${hex(3)}@example.invalid` }); const gh = await mkUser({ email: `f4.gh.${hex(3)}@example.invalid` });
  const tf = await sessionFor(gf.email); const th = await sessionFor(gh.email); const lf = await link(tf, F);
  const cf = await confirm(th, lf.jar.clone());
  ok('session change: another signed-in user cannot confirm (no pending on that account)', cf.data?.error === 'LINK_PENDING_MISSING' && !(await holder(F)), cf.data);
  await sb('POST', '/auth/v1/logout', null, { authorization: `Bearer ${tf}` });
  const cf2 = await confirm(tf, lf.jar);
  ok('logout: confirm with a signed-out session is refused', cf2.status === 401 && !(await holder(F)), cf2.status);
  ok('unlink: Google account unlinks (database release)', (await hit('/api/auth/line', { method: 'DELETE', token: await sessionFor(g.email) })).status === 200 && !(await holder(V3)));
  ok('unlink: LINE-only account cannot unlink its only sign-in', (await hit('/api/auth/line', { method: 'DELETE', token: await sessionFor(ph(A)) })).status === 409 && !!(await holder(A)));
  const tg2 = await sessionFor(g.email); const ldec = await link(tg2, lid());
  const dec = await hit('/api/auth/line/confirm', { jar: ldec.jar, method: 'DELETE', token: tg2 });
  ok('decline: pending link removed (result checked)', dec.status === 200 && (await hit('/api/auth/line/status', { token: tg2 })).data?.pending === null);
  ok('start link without a valid session is refused', (await hit('/api/auth/line', { jar: new Jar(), method: 'POST', token: 'not-a-session', body: {} })).status === 401);

  // concurrent first sign-in of one new LINE id
  const N = lid(); const [n1, n2] = await Promise.all([lineLogin(N), lineLogin(N)]);
  const ids = await Promise.all([n1, n2].map(async (n) => (await whoami(n.token)).data?.id));
  ok('concurrent first sign-in: one account, both signed in', ids[0] && ids[0] === ids[1] && (await holder(N)) === ids[0], [n1.error, n2.error]);
  ok('concurrent first sign-in: no unclaimed placeholder left behind', (await sqlq(`select count(*) from auth.users where email = '${ph(N)}'`)) === '1');

  // errors
  ok('error: LINE token failure', (await lineLogin(lid(), 'x', { code: 'token-fail' })).error === 'LINE_TOKEN_FAILED');
  ok('error: invalid LINE profile', (await lineLogin(lid(), 'x', { code: 'profile-bad' })).error === 'LINE_PROFILE_INVALID');
  const j = new Jar(); await hit('/api/auth/line?next=%2Fprofile', { jar: j });
  ok('error: state mismatch (OAuth CSRF)', /auth_error=state_mismatch/.test((await hit(`/api/auth/line/callback?code=ok:${lid()}:x&state=forged`, { jar: j })).loc));
  ok('error: cancelled at LINE', /auth_error=access_denied/.test((await hit('/api/auth/line/callback?error=access_denied&state=x', { jar: new Jar() })).loc));
  ok('error: link without the session-verified POST', /link_error=LINE_LINK_UNAUTHORIZED/.test((await hit('/api/auth/line?mode=link', { jar: new Jar() })).loc));

  // admin recovery (M1 / M2 / L1)
  const RV = lid(); const rvPw = 'Planted-' + hex(6);
  const rv = await mkUser({ email: ph(RV), password: rvPw, __created_at: daysAgo(120), user_metadata: { line_id: RV } });
  const planted = (await pwLogin(rv.email, rvPw)).data.access_token;
  const ref = (await lineLogin(RV)).ref;
  const list = await script(['list']);
  ok('recovery: list shows the request (short ids only)', list.code === 0 && list.out.includes(ref) && !list.out.includes(rv.id), list.out.slice(0, 200));
  const base = ['approve', '--request', ref, '--user', rv.id, '--actor', 'owner', '--reason', 'verified with the user by phone'];
  const oneCheck = await script([...base, '--version', '1', '--check', 'private pets count matches']);
  ok('recovery: one owner check is refused', oneCheck.code === 4, oneCheck.out.slice(-200));
  const wrongUser = await script(['approve', '--request', ref, '--user', crypto.randomUUID(), '--version', '1', '--actor', 'owner', '--reason', 'verified with the user', '--check', 'aaaaa', '--check', 'bbbbb']);
  ok('recovery: wrong user id is refused', wrongUser.code === 3, wrongUser.out.slice(-200));
  const checks = ['--check', 'private pets count matches', '--check', 'last finance entry matches'];
  const dry = await script([...base, '--version', '1', ...checks]);
  ok('recovery: dry run changes nothing', dry.code === 0 && /DRY RUN/.test(dry.out) && (await rpc('line_recovery_list')).find((r) => r.ref === ref)?.status === 'open');
  const wrongV = await script([...base, '--version', '9', ...checks, '--apply']);
  ok('recovery: wrong version is refused', wrongV.code === 5 && /version/.test(wrongV.out), wrongV.out.slice(-200));
  await sb('POST', '/__test/fail-next-password-update', {});
  const part = await script([...base, '--version', '1', ...checks, '--apply']);
  const afterPart = (await rpc('line_recovery_list')).find((r) => r.ref === ref);
  ok('recovery (M2): rotation failure → back to open, nothing mapped', part.code === 6 && afterPart?.status === 'open' && !(await holder(RV)), part.out.slice(-200));
  await sqlq(`update public.line_identity_ops set last_requested_at = now() - interval '15 days' where ref = '${ref}'`);
  const stale = await script([...base, '--version', String(afterPart?.version), ...checks, '--apply']);
  ok('recovery: stale request (15 days) is refused', stale.code === 5 && /expired/.test(stale.out), stale.out.slice(-200));
  await sqlq(`update public.line_identity_ops set last_requested_at = now() where ref = '${ref}'`);
  const good = await script([...base, '--version', String(afterPart?.version), ...checks, '--apply']);
  ok('recovery: approve resets credentials then maps', good.code === 0 && (await holder(RV)) === rv.id, good.out.slice(-200));
  ok('recovery: planted password and session are gone (H1)', (await pwLogin(rv.email, rvPw)).status === 400 && (await whoami(planted)).status === 403);
  ok('recovery: owner signs in with LINE', (await whoami((await lineLogin(RV)).token)).data?.id === rv.id);
  ok('recovery: audit trail — both attempts (aborted + approved) with reviewer, reason and checks',
    (await sqlq(`select count(*) from public.line_identity_audit where ref = '${ref}' and action = 'recovery_begin' and actor = 'owner' and detail ? 'owner_checks'`)) === '2'
    && (await sqlq(`select string_agg(action, ',' order by id) from public.line_identity_audit where ref = '${ref}' and action in ('op_aborted', 'op_approved')`)) === 'op_aborted,op_approved');
  // resume after a crash between reset and commit
  const RS = lid(); const rs = await mkUser({ email: ph(RS), __created_at: daysAgo(100) }); const refRS = (await lineLogin(RS)).ref;
  const tok = await rpc('line_recovery_begin', { p_ref: refRS, p_user_id: rs.id, p_version: 1, p_actor: 'owner', p_reason: 'verified with the user', p_owner_checks: ['check one ok', 'check two ok'] });
  const rsSecret = 'rotated-' + hex(24);
  await sb('PUT', `/auth/v1/admin/users/${rs.id}`, { password: rsSecret });
  ok('recovery: mark_reset refuses a secret that is not the rotation', (await rpc('line_op_mark_reset', { p_ref: refRS, p_token: tok, p_actor: 'owner', p_secret: 'x'.repeat(48) })) === 'rotation_not_verified');
  await rpc('line_op_mark_reset', { p_ref: refRS, p_token: tok, p_actor: 'owner', p_secret: rsSecret });
  const res = await script(['resume', '--request', refRS, '--apply']);
  ok('recovery (M2): resume finishes an approval that crashed after the reset', res.code === 0 && (await holder(RS)) === rs.id, res.out.slice(-200));
  // crash before the reset was verified: resume backs out to open (the rotation secret is gone), approve again works
  const RT = lid(); const rt = await mkUser({ email: ph(RT), __created_at: daysAgo(100) }); const refRT = (await lineLogin(RT)).ref;
  await rpc('line_recovery_begin', { p_ref: refRT, p_user_id: rt.id, p_version: 1, p_actor: 'owner', p_reason: 'verified with the user', p_owner_checks: ['check one ok', 'check two ok'] });
  await sb('PUT', `/auth/v1/admin/users/${rt.id}`, { password: 'lost-' + hex(24) });
  const rtRes = await script(['resume', '--request', refRT, '--apply']);
  const rtRow = (await rpc('line_recovery_list')).find((r) => r.ref === refRT);
  ok('recovery (M2): resume without a verified reset → back to open, nothing mapped', rtRes.code === 0 && rtRow?.status === 'open' && !(await holder(RT)), rtRes.out.slice(-200));
  const rtAgain = await script(['approve', '--request', refRT, '--user', rt.id, '--version', String(rtRow?.version), '--actor', 'owner', '--reason', 'verified with the user again', '--check', 'check one ok', '--check', 'check two ok', '--apply']);
  ok('recovery: approve again after the back-out maps the account', rtAgain.code === 0 && (await holder(RT)) === rt.id, rtAgain.out.slice(-200));
  // decline
  const DL = lid(); await mkUser({ email: ph(DL), __created_at: daysAgo(100) }); const refDL = (await lineLogin(DL)).ref;
  const decl = await script(['decline', '--request', refDL, '--version', '1', '--actor', 'owner', '--reason', 'could not verify ownership', '--apply']);
  ok('recovery: decline recorded, nothing mapped', decl.code === 0 && !(await holder(DL)), decl.out.slice(-200));
}

const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_OPTIONS: `--import ${new URL('./line-auth-mock-preload.mjs', import.meta.url)}`, MOCK_CONTROL_PORT: String(controlPort),
    F4_PG: PG.join(' '), F4_PG_DB: DB, LINE_CHANNEL_ID: 'synthetic-channel', LINE_CHANNEL_SECRET: 'synthetic-secret', SUPABASE_SERVICE_ROLE_KEY: 'synthetic' } });
let logs = ''; child.stdout.on('data', (d) => (logs += d)); child.stderr.on('data', (d) => (logs += d));
try {
  for (let i = 0; i < 80; i++) { try { await fetch(app + '/th/login'); await fetch(ADMIN + '/'); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  await scenarios();
} catch (e) { results.push({ name: 'harness error', pass: false, detail: e.stack?.split('\n').slice(0, 3).join(' | ') }); }
finally { child.kill('SIGTERM'); }
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.pass ? '  — ' + r.detail : ''}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\nintegration: ${results.length - failed}/${results.length} passed`);
if (failed && process.env.SHOW_LOGS) console.log(logs.slice(-4000));
process.exit(failed ? 1 : 0);
