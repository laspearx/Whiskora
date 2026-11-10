// Test-only preload for `next start` (node --import). Synthetic data only.
// - LINE (api.line.me) is mocked: the authorization code chooses the LINE profile ("ok:<lineId>:<name>").
// - Supabase Auth for NEXT_PUBLIC_SUPABASE_URL is an in-memory GoTrue model whose users / sessions are MIRRORED into a
//   throwaway local Postgres (F4_PG + F4_PG_DB) that has supabase/tests/local/f4_auth_stub.sql + the F4 migration.
// - PostgREST RPC calls (/rest/v1/rpc/<fn>) run the REAL SQL functions on that Postgres as service_role.
// - The same handler is served on http://127.0.0.1:${MOCK_CONTROL_PORT} so the test runner and the recovery script can
//   seed / inspect it with the same admin API.
// - Like GoTrue: password hashes are bcrypt (pgcrypto), a password update + session revocation is one transaction, a
//   new session + its AMR claim is one transaction — so the F4 credential-freeze triggers see what they see in Supabase.
//   A write refused by the database is refused here too (nothing changes in memory).
// - /__test/fail-next-password-update makes the next admin password update fail (partial-failure tests);
//   /__test/inflight-before-next-password-update {password} first lands a write of an Auth request admitted earlier
//   (an attacker's old session changing the password), then the admin update runs (re-review #3).
import http from 'node:http';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';

const realFetch = globalThis.fetch;
const SB = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:9');
const PG = (process.env.F4_PG || '').split(' ').filter(Boolean);
const DB = process.env.F4_PG_DB || 'f4it';
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const failNext = { password: false, inflight: null };

// ── local Postgres ───────────────────────────────────────────────────────────────────────────────────────────────
const lit = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  const tag = 'q' + crypto.randomBytes(4).toString('hex');
  return `$${tag}$${s}$${tag}$` + (typeof v === 'object' ? '::jsonb' : '');
};
export function sql(text) {
  return new Promise((resolve, reject) => {
    execFile('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', ...PG, '-d', DB, '-c', text], { maxBuffer: 1 << 24 }, (err, out, errOut) =>
      err ? reject(new Error(((errOut || err.message).split('\n').find((l) => l.startsWith('ERROR:')) || (errOut || err.message)).replace(/^ERROR:\s*/, '').trim())) : resolve(out.trim()));
  });
}
const SRF = new Set(['line_login_resolve', 'line_link_confirm', 'line_link_status', 'line_recovery_list']);
async function callRpc(fn, args) {
  if (!/^[a-z_0-9]+$/.test(fn)) return [404, { message: 'bad function' }];
  const a = Object.entries(args || {}).map(([k, v]) => `${k} => ${lit(v)}`).join(', ');
  const q = SRF.has(fn) ? `select coalesce(json_agg(t), '[]'::json) from public.${fn}(${a}) t` : `select to_json(public.${fn}(${a}))`;
  try { const out = await sql(`set role service_role; ${q}`); return [200, JSON.parse(out || 'null')]; } // json_agg spans lines
  catch (e) { return [400, { message: e.message, code: 'P0001' }]; }
}
const bcrypt = (p) => `extensions.crypt(${lit(String(p))}, extensions.gen_salt('bf', 4))`;
const setPassword = (uid, p) => sql(`update auth.users set encrypted_password = ${bcrypt(p)} where id = ${lit(uid)}; delete from auth.sessions where user_id = ${lit(uid)};`);
const mirrorUser = (u) => sql(`insert into auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at)
  values (${lit(u.id)}, ${lit(u.email)}, ${bcrypt(u.password)}, ${lit(u.app_metadata)}, ${lit(u.user_metadata)}, ${lit(u.created_at)})
  on conflict (id) do update set email = excluded.email,
    raw_app_meta_data = excluded.raw_app_meta_data, raw_user_meta_data = excluded.raw_user_meta_data;
  insert into auth.identities (user_id, provider, identity_data, created_at)
  select ${lit(u.id)}, 'email', jsonb_build_object('sub', ${lit(u.id)}, 'email', ${lit(u.email)}, 'email_verified', true, 'phone_verified', false), ${lit(u.created_at)}
  where not exists (select 1 from auth.identities where user_id = ${lit(u.id)} and provider = 'email');`);

// ── LINE ─────────────────────────────────────────────────────────────────────────────────────────────────────────
function line(url, init) {
  if (url.pathname === '/oauth2/v2.1/token') {
    const code = new URLSearchParams(String(init.body)).get('code') || '';
    if (code === 'token-fail') return json({ error: 'invalid_grant' }, 400);
    return json({ access_token: 'at.' + Buffer.from(code).toString('base64url'), id_token: 'never.used.here' });
  }
  if (url.pathname === '/v2/profile') {
    const code = Buffer.from(String(new Headers(init.headers).get('authorization')).replace('Bearer at.', ''), 'base64url').toString();
    if (code === 'profile-bad') return json({ userId: 'bad id!', displayName: 'x' });
    const [, lineId, name] = code.split(':');
    return json({ userId: lineId, displayName: name || 'Synthetic', pictureUrl: null });
  }
  return json({ message: 'not mocked' }, 404);
}

// ── in-memory GoTrue (subset used by the app), mirrored into Postgres ─────────────────────────────────────────────
const S = { users: new Map(), sessions: new Map(), otps: new Map() };
const merge = (base, upd) => { const o = { ...(base || {}) }; for (const [k, v] of Object.entries(upd || {})) { if (v === null) delete o[k]; else o[k] = v; } return o; };
const view = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: u.app_metadata, user_metadata: u.user_metadata,
  identities: u.identities, created_at: u.created_at, email_confirmed_at: u.created_at });
async function issue(u, method) {
  const t = 'tok.' + crypto.randomBytes(12).toString('hex'); const r = 'ref.' + crypto.randomBytes(12).toString('hex'); const sid = crypto.randomUUID();
  try {
    await sql(`insert into auth.sessions (id, user_id) values (${lit(sid)}, ${lit(u.id)}); insert into auth.mfa_amr_claims (session_id, authentication_method) values (${lit(sid)}, ${lit(method)});`);
  } catch { return null; }   // refused by the database (e.g. F4 credential freeze): no session
  S.sessions.set(t, { uid: u.id, refresh: r, sid });
  return { access_token: t, refresh_token: r, token_type: 'bearer', expires_in: 3600, user: view(u) };
}
async function revokeAll(uid) { for (const [t, s] of S.sessions) if (s.uid === uid) S.sessions.delete(t); await sql(`delete from auth.sessions where user_id = ${lit(uid)}`); }
const byEmail = (e) => [...S.users.values()].find((u) => u.email === String(e || '').toLowerCase());
const bearerUser = (h) => { const s = S.sessions.get(String(h.get('authorization') || '').replace('Bearer ', '')); return s ? S.users.get(s.uid) : null; };

export async function handle(method, path, headers, body) {
  const url = new URL(path, 'http://x');
  const p = url.pathname;
  if (p.startsWith('/rest/v1/rpc/')) return callRpc(p.slice('/rest/v1/rpc/'.length), body);
  if (p === '/rest/v1/profiles') return [201, null];
  if (p === '/__test/fail-next-password-update') { failNext.password = true; return [200, {}]; }
  if (p === '/__test/inflight-before-next-password-update') { failNext.inflight = String(body.password || 'attacker'); return [200, {}]; }
  if (p === '/__test/sql') { try { return [200, { out: await sql(body.sql) }]; } catch (e) { return [400, { message: e.message }]; } }
  if (p === '/auth/v1/admin/users' && method === 'GET') {
    const page = +url.searchParams.get('page') || 1; const per = +url.searchParams.get('per_page') || 50;
    return [200, { users: [...S.users.values()].slice((page - 1) * per, page * per).map(view), aud: 'authenticated' }];
  }
  if (p === '/auth/v1/admin/users' && method === 'POST') {
    const email = String(body.email || '').toLowerCase();
    if (byEmail(email)) return [422, { code: 422, error_code: 'email_exists', msg: 'A user with this email address has already been registered' }];
    const u = { id: crypto.randomUUID(), email, password: body.password || crypto.randomBytes(16).toString('hex'),
      created_at: body.__created_at || new Date().toISOString(),
      app_metadata: merge({ provider: 'email', providers: ['email'] }, body.app_metadata), user_metadata: merge({}, body.user_metadata),
      identities: [{ provider: 'email' }, ...(body.__identities || [])] };
    S.users.set(u.id, u); await mirrorUser(u);
    for (const idp of body.__identities || []) await sql(`insert into auth.identities (user_id, provider) values (${lit(u.id)}, ${lit(idp.provider)})`);
    return [200, view(u)];
  }
  const m = p.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]+)$/);
  if (m) {
    const u = S.users.get(m[1]); if (!u) return [404, { msg: 'User not found' }];
    if (method === 'GET') return [200, view(u)];
    if (method === 'DELETE') { S.users.delete(u.id); await sql(`delete from auth.users where id = ${lit(u.id)}`); return [200, {}]; }
    if (body.password && failNext.password) { failNext.password = false; return [500, { msg: 'synthetic upstream failure' }]; }
    if (body.password && failNext.inflight) {
      // an Auth request admitted before this rotation (old session's UserUpdate) commits first: new hash, keeps its session
      const p2 = failNext.inflight; failNext.inflight = null;
      try { await sql(`update auth.users set encrypted_password = ${bcrypt(p2)} where id = ${lit(u.id)}`); u.password = p2; } catch {}
    }
    if (body.password) {
      // GoTrue: UpdatePassword(nil) → new hash + Logout(all), one transaction
      try { await setPassword(u.id, body.password); } catch { return [500, { msg: 'Database error updating user' }]; }
      u.password = body.password; for (const [t, s2] of S.sessions) if (s2.uid === u.id) S.sessions.delete(t);
    }
    if (body.app_metadata) u.app_metadata = merge(u.app_metadata, body.app_metadata);
    if (body.user_metadata) u.user_metadata = merge(u.user_metadata, body.user_metadata);
    await mirrorUser(u);
    return [200, view(u)];
  }
  if (p === '/auth/v1/admin/generate_link') {
    const u = byEmail(body.email); if (!u) return [404, { msg: 'User not found' }];
    const otp = crypto.randomBytes(3).toString('hex'); S.otps.set(otp, u.id);
    return [200, { ...view(u), action_link: 'x', email_otp: otp, hashed_token: 'h', redirect_to: '', verification_type: 'magiclink' }];
  }
  if (p === '/auth/v1/verify') {
    const uid = S.otps.get(body.token); S.otps.delete(body.token); const u = uid && S.users.get(uid);
    if (!u || u.email !== String(body.email).toLowerCase()) return [403, { error_code: 'otp_expired' }];
    const tk = await issue(u, 'otp'); return tk ? [200, tk] : [500, { msg: 'Database error granting user' }];
  }
  if (p === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
    const u = byEmail(body.email); if (!u || u.password !== body.password) return [400, { error_code: 'invalid_credentials' }];
    const tk = await issue(u, 'password'); return tk ? [200, tk] : [500, { msg: 'Database error granting user' }];
  }
  if (p === '/auth/v1/user' && method === 'GET') { const u = bearerUser(headers); return u ? [200, view(u)] : [403, { error_code: 'session_not_found' }]; }
  if (p === '/auth/v1/logout') { const u = bearerUser(headers); if (!u) return [403, {}]; await revokeAll(u.id); return [204, null]; }
  return [404, { msg: 'mock: not implemented ' + method + ' ' + p }];
}

globalThis.fetch = async (input, init = {}) => {
  const req = input instanceof Request ? input : null;
  const url = new URL(req ? req.url : String(input));
  const method = (init.method || req?.method || 'GET').toUpperCase();
  if (url.hostname === 'api.line.me') return line(url, init);
  if (url.host === SB.host) {
    const headers = new Headers(init.headers || req?.headers);
    const raw = init.body ?? (req ? await req.text() : undefined);
    let body = {}; try { body = raw ? JSON.parse(String(raw)) : {}; } catch { body = {}; }
    const [status, data] = await handle(method, url.pathname + url.search, headers, body);
    return data === null ? new Response(null, { status }) : json(data, status);
  }
  if (['127.0.0.1', 'localhost'].includes(url.hostname)) return realFetch(input, init);
  throw new Error('test preload: external host refused ' + url.host);
};

if (process.env.MOCK_CONTROL_PORT) {
  http.createServer(async (rq, rs) => {
    let raw = ''; for await (const c of rq) raw += c;
    let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch {}
    const [status, data] = await handle(rq.method, rq.url, new Headers(rq.headers), body);
    rs.writeHead(status, { 'content-type': 'application/json' }); rs.end(data === null ? '' : JSON.stringify(data));
  }).on('error', () => {}).listen(+process.env.MOCK_CONTROL_PORT, '127.0.0.1');
}
