// F4 — end-to-end LINE login / linking against the built app (`next start`) with LINE mocked.
//   LINE_AUTH_BACKEND=mock     → in-memory GoTrue (scripts/line-auth-mock-preload.mjs)
//   LINE_AUTH_BACKEND=staging  → the real STAGING Supabase project (synthetic users, deleted at the end).
// usage: node scripts/line-auth.integration.mjs <port>   (build first with NEXT_PUBLIC_SUPABASE_URL = the backend URL)
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2] || 3471);
const backend = process.env.LINE_AUTH_BACKEND || 'mock';
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const STAGING_REF = 'wpxcukrwmegwzfccbbga';
if (backend === 'staging' && SB !== `https://${STAGING_REF}.supabase.co`) { console.error('STOP: staging backend must be the staging project'); process.exit(2); }
const controlPort = port + 1000;
const ADMIN = backend === 'mock' ? `http://127.0.0.1:${controlPort}` : SB;
const app = `http://127.0.0.1:${port}`;
const cwd = fileURLToPath(new URL('../', import.meta.url));
const results = []; const created = new Set();
const hex = (n) => crypto.randomBytes(n).toString('hex');
const lid = () => 'U' + hex(16);
const ph = (id) => `line_${id}@line.whiskora.internal`.toLowerCase();

// ── backend admin client (seeding / inspection) ─────────────────────────────────────────────────────────────────────
async function sb(method, path, body, headers = {}) {
  const h = { 'content-type': 'application/json', ...headers };
  if (backend === 'staging' && !h.apikey) h.apikey = 'proxy-injected'; // the network proxy injects the staging key
  const r = await fetch(ADMIN + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let d; try { d = t ? JSON.parse(t) : null; } catch { d = t; } return { status: r.status, data: d };
}
const mkUser = async (o) => {
  const r = await sb('POST', '/auth/v1/admin/users', { email_confirm: true, ...o, user_metadata: { f4_synthetic: true, ...(o.user_metadata || {}) } });
  if (r.status !== 200) throw new Error('seed failed ' + r.status + ' ' + JSON.stringify(r.data)); created.add(r.data.id); return r.data;
};
const getUser = async (id) => (await sb('GET', `/auth/v1/admin/users/${id}`)).data;
const setApp = (id, app_metadata) => sb('PUT', `/auth/v1/admin/users/${id}`, { app_metadata });
const sessionFor = async (email) => {
  const gl = await sb('POST', '/auth/v1/admin/generate_link', { type: 'magiclink', email });
  const v = await sb('POST', '/auth/v1/verify', { email, token: gl.data.email_otp, type: 'magiclink' });
  return v.data.access_token;
};
const allUsers = async () => { const out = []; for (let p = 1; p < 60; p++) { const b = (await sb('GET', `/auth/v1/admin/users?page=${p}&per_page=1000`)).data.users; out.push(...b); if (b.length < 1000) break; } return out; };
const holdersOf = async (id) => (await allUsers()).filter((u) => u.app_metadata?.line_id === id).map((u) => u.id);

// ── app client with a tiny cookie jar ──────────────────────────────────────────────────────────────────────────────
class Jar { constructor() { this.c = new Map(); }
  take(res) { for (const sc of res.headers.getSetCookie()) { const [kv] = sc.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i); const v = kv.slice(i + 1); if (!v || /Expires=Thu, 01 Jan 1970/.test(sc) || /Max-Age=0/.test(sc)) this.c.delete(k); else this.c.set(k, v); } }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join('; '); } }
async function hit(path, { jar, method = 'GET', token, body } = {}) {
  const headers = {}; if (jar?.c.size) headers.cookie = jar.header(); if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';
  const r = await fetch(app + path, { method, redirect: 'manual', headers, body: body ? JSON.stringify(body) : undefined });
  jar?.take(r); const loc = r.headers.get('location') || ''; let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, loc, data };
}
async function lineLogin(lineId, name = 'Syn', { create = false, code } = {}) {
  const jar = new Jar();
  const start = await hit(`/api/auth/line?next=%2Fprofile${create ? '&create=1' : ''}`, { jar });
  const state = new URL(start.loc).searchParams.get('state');
  const cb = await hit(`/api/auth/line/callback?code=${encodeURIComponent(code ?? `ok:${lineId}:${name}`)}&state=${state}`, { jar });
  const u = new URL(cb.loc); const hash = new URLSearchParams(u.hash.slice(1));
  return { token: hash.get('access_token'), error: u.searchParams.get('auth_error'), ref: u.searchParams.get('ref'), loc: cb.loc, jar };
}
async function startLink(token, lineId, name = 'Syn') {
  const jar = new Jar();
  const post = await hit('/api/auth/line', { jar, method: 'POST', token, body: {} });
  if (post.status !== 200) return { post: post.status, jar };
  const g = await hit('/api/auth/line?mode=link&next=/profile/connections', { jar });
  const state = new URL(g.loc).searchParams.get('state');
  const cb = await hit(`/api/auth/line/callback?code=${encodeURIComponent(`ok:${lineId}:${name}`)}&state=${state}`, { jar });
  return { post: post.status, loc: cb.loc, jar };
}
const confirm = (token, jar) => hit('/api/auth/line/confirm', { jar, method: 'POST', token });
const ok = (name, cond, detail = '') => { results.push({ name, pass: !!cond, detail }); };

async function scenarios() {
  // 1 Normal LINE login: first sign-in creates a placeholder account with app_metadata; the next one signs into it
  const A = lid(); const l1 = await lineLogin(A, 'Normal');
  const acct = (await allUsers()).find((u) => u.email === ph(A)); if (acct) created.add(acct.id);
  ok('normal: first LINE sign-in creates account + session', !!l1.token && acct?.app_metadata?.line_id === A, l1.error || '');
  const l1b = await lineLogin(A, 'Normal');
  ok('normal: second sign-in reaches the same account', !!l1b.token && (await holdersOf(A)).length === 1);
  ok('normal: never stores an email from LINE (placeholder only)', acct?.email === ph(A));

  // 2 Legacy LINE-only (V1): placeholder account without app_metadata → review + recovery request, no session
  const V1 = lid(); const v1 = await mkUser({ email: ph(V1), user_metadata: { line_id: V1, provider: 'line', full_name: 'Legacy' } });
  const l2 = await lineLogin(V1);
  const v1after = await getUser(v1.id);
  ok('legacy V1: no automatic sign-in (LINE_ACCOUNT_REVIEW)', !l2.token && l2.error === 'LINE_ACCOUNT_REVIEW' && /^[0-9a-f]{8}$/.test(l2.ref || ''), l2.error);
  ok('legacy V1: recovery request recorded server-side, mapping unchanged', v1after.app_metadata?.line_recovery_request?.line_id === V1 && !v1after.app_metadata?.line_id);
  ok('legacy V1: no duplicate account created', (await allUsers()).filter((u) => u.email === ph(V1)).length === 1);
  // legacy owner still signed in elsewhere migrates through the session-proven link
  const v1tok = await sessionFor(ph(V1));
  const lk = await startLink(v1tok, V1, 'Legacy');
  const c2 = await confirm(v1tok, lk.jar);
  ok('legacy V1: signed-in owner + LINE OAuth + confirm migrates the same account', c2.status === 200 && (await getUser(v1.id)).app_metadata?.line_id === V1, JSON.stringify(c2.data));
  const l2b = await lineLogin(V1);
  ok('legacy V1: after migration LINE sign-in works', !!l2b.token);

  // 3 Google + LINE (V3): untrusted claim → relink prompt; link while signed in → then LINE sign-in works
  const V3 = lid(); const g = await mkUser({ email: `f4.v3.${hex(4)}@example.invalid`, password: 'Pw-' + hex(8), user_metadata: { line_id: V3 } });
  const l3 = await lineLogin(V3);
  ok('V3: LINE sign-in with only a user_metadata claim → relink prompt, no session', !l3.token && l3.error === 'LINE_RELINK_SUGGESTED', l3.error);
  const gtok = await sessionFor(g.email); const lk3 = await startLink(gtok, V3, 'Google user');
  ok('V3: link flow stops at a pending confirmation (nothing linked yet)', /confirm_line=1/.test(lk3.loc) && !(await getUser(g.id)).app_metadata?.line_id && !!(await getUser(g.id)).app_metadata?.line_link_pending);
  const c3 = await confirm(gtok, lk3.jar);
  ok('V3: confirm links the signed-in account', c3.status === 200 && (await getUser(g.id)).app_metadata?.line_id === V3, JSON.stringify(c3.data));
  const l3b = await lineLogin(V3); ok('V3: LINE sign-in now reaches the Google account', !!l3b.token);

  // 4 Forged user_metadata.line_id cannot capture the real holder's login
  const forger = await mkUser({ email: `f4.forger.${hex(4)}@example.invalid`, user_metadata: { line_id: A } });
  const l4 = await lineLogin(A);
  const whoId = !l4.token ? null : l4.token.split('.').length === 3
    ? JSON.parse(Buffer.from(l4.token.split('.')[1], 'base64url')).sub            // staging: real JWT
    : (await sb('GET', '/auth/v1/user', null, { authorization: `Bearer ${l4.token}` })).data?.id; // mock token
  ok('forged claim: login still reaches the real holder', !!whoId && whoId === (await holdersOf(A))[0] && whoId !== forger.id, String(whoId));

  // 5 Email-based hijack: a victim with a real email is never chosen (LINE email is not even requested)
  const victim = await mkUser({ email: `f4.victim.${hex(4)}@example.invalid`, password: 'Pw-' + hex(8) });
  const W = lid(); const l5 = await lineLogin(W);
  const wAcct = (await allUsers()).find((u) => u.email === ph(W)); if (wAcct) created.add(wAcct.id);
  ok('email hijack: new LINE user gets its own placeholder account; victim untouched', !!l5.token && wAcct && !(await getUser(victim.id)).app_metadata?.line_id);

  // 6 Placeholder pre-registration: attacker created line_<id>@… with a password first
  const P = lid(); const pre = await mkUser({ email: ph(P), password: 'Attacker-' + hex(8) });
  const l6 = await lineLogin(P);
  ok('pre-registration: LINE owner is NOT signed into the attacker account', !l6.token && l6.error === 'LINE_ACCOUNT_REVIEW' && !(await getUser(pre.id)).app_metadata?.line_id, l6.error);
  const lk6 = await startLink(await sessionFor(ph(A)), P, 'other');
  const c6 = await confirm(await sessionFor(ph(A)), lk6.jar).catch(() => ({}));
  ok('pre-registration: another account cannot take that LINE id either (legacy account exists)', c6.data?.error === 'LINE_LEGACY_ACCOUNT_EXISTS', JSON.stringify(c6.data));

  // 7 Duplicate holders → conflict on login and on link
  const D = lid(); const d1 = await mkUser({ email: `f4.d1.${hex(4)}@example.invalid` }); const d2 = await mkUser({ email: `f4.d2.${hex(4)}@example.invalid` });
  await setApp(d1.id, { line_id: D }); await setApp(d2.id, { line_id: D });
  const l7 = await lineLogin(D); ok('duplicate: login refused with LINE_ACCOUNT_CONFLICT (no first-pick)', !l7.token && l7.error === 'LINE_ACCOUNT_CONFLICT', l7.error);

  // 8 Concurrent linking of one LINE id into two accounts → never two holders
  const C = lid(); const ca = await mkUser({ email: `f4.ca.${hex(4)}@example.invalid` }); const cb = await mkUser({ email: `f4.cb.${hex(4)}@example.invalid` });
  const ta = await sessionFor(ca.email); const tb = await sessionFor(cb.email);
  const la = await startLink(ta, C); const lb = await startLink(tb, C);
  const [ra, rb] = await Promise.all([confirm(ta, la.jar), confirm(tb, lb.jar)]);
  const hc = await holdersOf(C);
  ok('concurrent link: at most one holder afterwards', hc.length <= 1, `statuses ${ra.status}/${rb.status} holders ${hc.length}`);
  ok('concurrent link: a losing request reports a conflict', [ra, rb].filter((r) => r.status === 200).length === hc.length);

  // 9 Expired pending
  const E = lid(); const ea = await mkUser({ email: `f4.ea.${hex(4)}@example.invalid` }); const te = await sessionFor(ea.email);
  const le = await startLink(te, E); const cur = await getUser(ea.id);
  await setApp(ea.id, { line_link_pending: { ...cur.app_metadata.line_link_pending, exp: Date.now() - 1000 } });
  const ce = await confirm(te, le.jar);
  ok('expired pending: refused and cleared', ce.data?.error === 'LINK_PENDING_EXPIRED' && !(await getUser(ea.id)).app_metadata?.line_link_pending && !(await getUser(ea.id)).app_metadata?.line_id, JSON.stringify(ce.data));

  // 10 Replay of a used confirmation
  const R = lid(); const rr = await mkUser({ email: `f4.rr.${hex(4)}@example.invalid` }); const tr = await sessionFor(rr.email);
  const lr = await startLink(tr, R); const saved = lr.jar.header();
  const c10 = await confirm(tr, lr.jar);
  const replayJar = new Jar(); for (const kv of saved.split('; ')) { const i = kv.indexOf('='); replayJar.c.set(kv.slice(0, i), kv.slice(i + 1)); }
  const c10b = await confirm(tr, replayJar);
  ok('replay: second confirm with the same nonce finds nothing', c10.status === 200 && c10b.data?.error === 'LINK_PENDING_MISSING', JSON.stringify(c10b.data));

  // 11 Session change between start and confirm
  const F = lid(); const fa = await mkUser({ email: `f4.fa.${hex(4)}@example.invalid` }); const fb = await mkUser({ email: `f4.fb.${hex(4)}@example.invalid` });
  const tfa = await sessionFor(fa.email); const tfb = await sessionFor(fb.email);
  const lf = await startLink(tfa, F);
  const c11 = await confirm(tfb, lf.jar);
  ok('session change: another signed-in user cannot confirm (no pending on their account)', c11.data?.error === 'LINK_PENDING_MISSING' && !(await getUser(fb.id)).app_metadata?.line_id, JSON.stringify(c11.data));
  if (backend === 'mock') { // session revocation is not observable through the staging proxy credential (see preload)
    const lf2 = await startLink(tfa, F);
    await sb('POST', '/auth/v1/logout?scope=global', null, { authorization: `Bearer ${tfa}` });
    const c11b = await confirm(tfa, lf2.jar);
    ok('logout: confirm with the signed-out session is refused', c11b.status === 401 && !(await getUser(fa.id)).app_metadata?.line_id, `${c11b.status} ${JSON.stringify(c11b.data)}`);
  }
  const l11 = await hit('/api/auth/line', { jar: new Jar(), method: 'POST', token: 'not-a-session', body: {} });
  ok('start link without a valid session is refused', l11.status === 401);

  // 12 Unlink
  const u12 = await hit('/api/auth/line', { jar: new Jar(), method: 'DELETE', token: await sessionFor(g.email) });
  ok('unlink: Google account can unlink LINE (server-side)', u12.status === 200 && !(await getUser(g.id)).app_metadata?.line_id);
  const u12b = await hit('/api/auth/line', { jar: new Jar(), method: 'DELETE', token: await sessionFor(ph(A)) });
  ok('unlink: LINE-only account cannot unlink its only sign-in', u12b.status === 409 && (await holdersOf(A)).length === 1);

  // 14 Errors
  const e1 = await lineLogin(lid(), 'x', { code: 'token-fail' }); ok('error: LINE token failure → fixed code', e1.error === 'LINE_TOKEN_FAILED', e1.error);
  const e2 = await lineLogin(lid(), 'x', { code: 'profile-bad' }); ok('error: invalid LINE profile → fixed code', e2.error === 'LINE_PROFILE_INVALID', e2.error);
  const j = new Jar(); await hit('/api/auth/line?next=%2Fprofile', { jar: j });
  const e3 = await hit(`/api/auth/line/callback?code=ok:${lid()}:x&state=forged`, { jar: j });
  ok('error: state mismatch (OAuth CSRF) refused', /auth_error=state_mismatch/.test(e3.loc));
  const e4 = await hit('/api/auth/line/callback?error=access_denied&state=x', { jar: new Jar() });
  ok('error: user cancelled at LINE → fixed code', /auth_error=access_denied/.test(e4.loc));
  const e5 = await hit('/api/auth/line?mode=link', { jar: new Jar() });
  ok('error: link without the session-verified POST is refused', /link_error=LINE_LINK_UNAUTHORIZED/.test(e5.loc));

  // 13 Pagination (mock only: thousands of users)
  if (backend === 'mock') {
    for (let i = 0; i < 2300; i++) await sb('POST', '/auth/v1/admin/users', { email: `bulk${i}@example.invalid`, email_confirm: true });
    const G = lid(); const late = await mkUser({ email: `f4.late.${hex(4)}@example.invalid` }); await setApp(late.id, { line_id: G });
    const l13 = await lineLogin(G);
    ok('pagination: a holder beyond the first 1000 users is found', !!l13.token && (await holdersOf(G))[0] === late.id);
  }
}

async function cleanup() {
  if (backend !== 'staging') return;
  // delete every synthetic account this run created (seeded + made by the app for our random LINE ids)
  const mine = (await allUsers()).filter((u) => created.has(u.id) || u.user_metadata?.f4_synthetic === true);
  for (const u of mine) await sb('DELETE', `/auth/v1/admin/users/${u.id}`);
  results.push({ name: `cleanup: deleted ${mine.length} synthetic staging users`, pass: true });
}

const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_OPTIONS: `--import ${new URL('./line-auth-mock-preload.mjs', import.meta.url)}`, MOCK_CONTROL_PORT: String(controlPort),
    LINE_CHANNEL_ID: 'synthetic-channel', LINE_CHANNEL_SECRET: 'synthetic-secret', SUPABASE_SERVICE_ROLE_KEY: 'proxy-injected' } });
let logs = ''; child.stdout.on('data', (d) => (logs += d)); child.stderr.on('data', (d) => (logs += d));
try {
  for (let i = 0; i < 80; i++) { try { await fetch(app + '/th/login'); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  await scenarios();
} catch (e) { results.push({ name: 'harness error', pass: false, detail: e.stack?.split('\n').slice(0, 3).join(' | ') }); }
finally { try { await cleanup(); } catch (e) { results.push({ name: 'cleanup error', pass: false, detail: e.message }); } child.kill('SIGTERM'); }
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.pass ? '  — ' + r.detail : ''}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${backend}: ${results.length - failed}/${results.length} passed`);
if (failed && process.env.SHOW_LOGS) console.log(logs.slice(-3000));
process.exit(failed ? 1 : 0);
