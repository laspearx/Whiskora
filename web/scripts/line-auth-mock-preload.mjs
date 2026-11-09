// Test-only preload for `next start` (node --import). Synthetic data only.
// - LINE (api.line.me) is always mocked: the authorization code chooses the LINE profile ("ok:<lineId>:<name>").
// - LINE_AUTH_BACKEND=mock: Supabase Auth/REST for NEXT_PUBLIC_SUPABASE_URL is an in-memory GoTrue model, also served on
//   http://127.0.0.1:${MOCK_CONTROL_PORT} so the test runner can seed and inspect it with the same admin API.
// - LINE_AUTH_BACKEND=staging: Supabase requests go to the real staging project (the network proxy adds the staging
//   key); only a placeholder service-role Authorization header is dropped so the proxy-injected key is used.
import http from 'node:http';
import crypto from 'node:crypto';

const realFetch = globalThis.fetch;
const SB = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:9');
const backend = process.env.LINE_AUTH_BACKEND || 'mock';
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// ── LINE ─────────────────────────────────────────────────────────────────────────────────────────────────────────
function line(url, init) {
  if (url.pathname === '/oauth2/v2.1/token') {
    const code = new URLSearchParams(String(init.body)).get('code') || '';
    if (code === 'token-fail') return json({ error: 'invalid_grant' }, 400);
    return json({ access_token: 'at.' + Buffer.from(code).toString('base64url'), id_token: 'never.used.here' });
  }
  if (url.pathname === '/v2/profile') {
    const code = Buffer.from(String(new Headers(init.headers).get('authorization')).replace('Bearer at.', ''), 'base64url').toString();
    const [, lineId, name] = code.split(':');
    if (code === 'profile-bad') return json({ userId: 'bad id!', displayName: 'x' });
    return json({ userId: lineId, displayName: name || 'Synthetic', pictureUrl: null });
  }
  return json({ message: 'not mocked' }, 404);
}

// ── in-memory GoTrue (subset used by the app) ─────────────────────────────────────────────────────────────────────
const S = { users: new Map(), sessions: new Map(), otps: new Map() };
const merge = (base, upd) => { const o = { ...(base || {}) }; for (const [k, v] of Object.entries(upd || {})) { if (v === null) delete o[k]; else o[k] = v; } return o; };
const view = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: u.app_metadata, user_metadata: u.user_metadata,
  identities: u.identities, created_at: u.created_at, email_confirmed_at: u.created_at });
const issue = (u) => { const t = 'tok.' + crypto.randomBytes(12).toString('hex'); const r = 'ref.' + crypto.randomBytes(12).toString('hex'); S.sessions.set(t, { uid: u.id, refresh: r }); return { access_token: t, refresh_token: r, token_type: 'bearer', expires_in: 3600, user: view(u) }; };
const byEmail = (e) => [...S.users.values()].find((u) => u.email === String(e || '').toLowerCase());
const bearerUser = (h) => { const s = S.sessions.get(String(h.get('authorization') || '').replace('Bearer ', '')); return s ? S.users.get(s.uid) : null; };

export async function gotrue(method, path, headers, body) {
  const url = new URL(path, 'http://x');
  const p = url.pathname;
  if (p === '/rest/v1/profiles') return [201, null];
  if (p === '/auth/v1/admin/users' && method === 'GET') {
    const page = +url.searchParams.get('page') || 1; const per = +url.searchParams.get('per_page') || 50;
    return [200, { users: [...S.users.values()].slice((page - 1) * per, page * per).map(view), aud: 'authenticated' }];
  }
  if (p === '/auth/v1/admin/users' && method === 'POST') {
    const email = String(body.email || '').toLowerCase();
    if (byEmail(email)) return [422, { code: 422, error_code: 'email_exists', msg: 'A user with this email address has already been registered' }];
    const u = { id: crypto.randomUUID(), email, password: body.password || crypto.randomBytes(16).toString('hex'), created_at: new Date().toISOString(),
      app_metadata: merge({ provider: 'email', providers: ['email'] }, body.app_metadata), user_metadata: merge({}, body.user_metadata),
      identities: [{ provider: 'email' }, ...(body.__identities || [])] };
    S.users.set(u.id, u); return [200, view(u)];
  }
  const m = p.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]+)$/);
  if (m) {
    const u = S.users.get(m[1]); if (!u) return [404, { msg: 'User not found' }];
    if (method === 'GET') return [200, view(u)];
    if (method === 'DELETE') { S.users.delete(u.id); return [200, {}]; }
    if (body.app_metadata) u.app_metadata = merge(u.app_metadata, body.app_metadata);
    if (body.user_metadata) u.user_metadata = merge(u.user_metadata, body.user_metadata);
    if (body.password) { u.password = body.password; for (const [t, s] of S.sessions) if (s.uid === u.id) S.sessions.delete(t); } // GoTrue: Logout(all)
    return [200, view(u)];
  }
  if (p === '/auth/v1/admin/generate_link') {
    const u = byEmail(body.email); if (!u) return [404, { msg: 'User not found' }];
    const otp = crypto.randomBytes(3).toString('hex'); S.otps.set(otp, u.id);
    return [200, { ...view(u), action_link: 'x', email_otp: otp, hashed_token: 'h', redirect_to: '', verification_type: 'magiclink' }];
  }
  if (p === '/auth/v1/verify') { const uid = S.otps.get(body.token); S.otps.delete(body.token); const u = uid && S.users.get(uid); return u && u.email === String(body.email).toLowerCase() ? [200, issue(u)] : [403, { error_code: 'otp_expired' }]; }
  if (p === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') { const u = byEmail(body.email); return u && u.password === body.password ? [200, issue(u)] : [400, { error_code: 'invalid_credentials' }]; }
  if (p === '/auth/v1/user' && method === 'GET') { const u = bearerUser(headers); return u ? [200, view(u)] : [403, { error_code: 'session_not_found' }]; }
  if (p === '/auth/v1/logout') { const u = bearerUser(headers); if (!u) return [403, {}]; for (const [t, s] of S.sessions) if (s.uid === u.id) S.sessions.delete(t); return [204, null]; }
  return [404, { msg: 'mock: not implemented ' + method + ' ' + p }];
}

globalThis.fetch = async (input, init = {}) => {
  const req = input instanceof Request ? input : null;
  const url = new URL(req ? req.url : String(input));
  const method = (init.method || req?.method || 'GET').toUpperCase();
  if (url.hostname === 'api.line.me') return line(url, init);
  if (url.host === SB.host) {
    if (backend === 'staging') {
      const headers = new Headers(init.headers || req?.headers);
      if (headers.get('authorization') === 'Bearer proxy-injected') headers.delete('authorization');
      // The proxy credential (secret key in `apikey`) makes the gateway ignore a user JWT, so GET /auth/v1/user cannot
      // be exercised for real from this sandbox. Emulate it: verify the JWT against the staging JWKS (ES256), then read
      // the user through the admin API. Session revocation is NOT observable here (covered by the mock backend).
      if (url.pathname === '/auth/v1/user' && method === 'GET' && /^Bearer ey/.test(headers.get('authorization') || '')) {
        return emulateGetUser(url, headers.get('authorization').slice(7));
      }
      return realFetch(url, { ...init, method, headers });
    }
    const headers = new Headers(init.headers || req?.headers);
    const raw = init.body ?? (req ? await req.text() : undefined);
    let body = {}; try { body = raw ? JSON.parse(String(raw)) : {}; } catch { body = {}; }
    const [status, data] = await gotrue(method, url.pathname + url.search, headers, body);
    return data === null ? new Response(null, { status }) : json(data, status);
  }
  if (['127.0.0.1', 'localhost'].includes(url.hostname)) return realFetch(input, init);
  throw new Error('test preload: external host refused ' + url.host);
};

let jwks;
async function emulateGetUser(url, jwt) {
  try {
    const [h, p, s] = jwt.split('.');
    const header = JSON.parse(Buffer.from(h, 'base64url')); const claims = JSON.parse(Buffer.from(p, 'base64url'));
    jwks ??= (await (await realFetch(new URL('/auth/v1/.well-known/jwks.json', url))).json()).keys;
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (!jwk || header.alg !== 'ES256') return json({ error_code: 'bad_jwt' }, 403);
    const key = await crypto.webcrypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const okSig = await crypto.webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, Buffer.from(s, 'base64url'), Buffer.from(`${h}.${p}`));
    if (!okSig || claims.exp * 1000 < Date.now() || claims.aud !== 'authenticated') return json({ error_code: 'bad_jwt' }, 403);
    const r = await realFetch(new URL(`/auth/v1/admin/users/${claims.sub}`, url), { headers: { apikey: 'proxy-injected' } });
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json', 'x-test-emulated': 'jwks' } });
  } catch { return json({ error_code: 'bad_jwt' }, 403); }
}

if (backend === 'mock' && process.env.MOCK_CONTROL_PORT) {
  http.createServer(async (rq, rs) => {
    let raw = ''; for await (const c of rq) raw += c;
    let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch {}
    const [status, data] = await gotrue(rq.method, rq.url, new Headers(rq.headers), body);
    rs.writeHead(status, { 'content-type': 'application/json' }); rs.end(data === null ? '' : JSON.stringify(data));
  }).on('error', () => {}).listen(+process.env.MOCK_CONTROL_PORT, '127.0.0.1');
}
