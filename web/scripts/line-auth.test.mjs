// F4 — LINE identity decisions, pending links, pagination and static guards. Synthetic data only; no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const req = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8');
function load(file, overrides = {}) {
  const code = ts.transpileModule(src(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  // same realm (plain objects compare with deepEqual); module wrapper like CommonJS
  vm.runInThisContext(`(function (module, exports, require) {${code}\n})`, { filename: file })(m, m.exports, (id) => (id in overrides ? overrides[id] : req(id)));
  return m.exports;
}
const L = load('lib/lineAuth.ts');
const X = 'U' + 'a'.repeat(31) + 'F';         // mixed case like real ids
const Y = 'U' + 'b'.repeat(32);
const ph = (id) => `line_${id}@line.whiskora.internal`.toLowerCase();
const u = (id, o = {}) => ({ id, email: `${id}@example.invalid`, app_metadata: {}, user_metadata: {}, identities: [{ provider: 'email' }], ...o });

test('placeholder email is lower case (GoTrue stores emails lower-cased)', () => {
  assert.equal(L.placeholderEmail(X), ph(X));
  assert.notEqual(L.placeholderEmail(X), `line_${X}@line.whiskora.internal`);
});

test('normal login: exactly one app_metadata holder signs in', () => {
  const users = [u('a', { app_metadata: { line_id: X } }), u('b')];
  assert.deepEqual(L.decideLogin(X, L.lookupLine(users, X)), { action: 'login', userId: 'a' });
});

test('new LINE user: create with the placeholder only (never an email from LINE)', () => {
  assert.deepEqual(L.decideLogin(X, L.lookupLine([u('b')], X)), { action: 'create', email: ph(X) });
});

test('duplicate holders: conflict, never the first account', () => {
  const users = [u('a', { app_metadata: { line_id: X } }), u('b', { app_metadata: { line_id: X } })];
  assert.deepEqual(L.decideLogin(X, L.lookupLine(users, X)), { action: 'error', code: 'LINE_ACCOUNT_CONFLICT' });
  assert.deepEqual(L.decideLink(X, 'a', L.lookupLine(users, X)), { action: 'error', code: 'LINE_ACCOUNT_CONFLICT' });
});

test('forged user_metadata.line_id cannot capture a login of the real holder', () => {
  const users = [u('attacker', { user_metadata: { line_id: X } }), u('victim', { app_metadata: { line_id: X } })];
  assert.deepEqual(L.decideLogin(X, L.lookupLine(users, X)), { action: 'login', userId: 'victim' });
});

test('forged user_metadata.line_id alone: no sign-in into it, only a relink prompt (explicit create still possible)', () => {
  const users = [u('attacker', { user_metadata: { line_id: X } })];
  assert.deepEqual(L.decideLogin(X, L.lookupLine(users, X)), { action: 'relink_suggested' });
  assert.deepEqual(L.decideLogin(X, L.lookupLine(users, X), true), { action: 'create', email: ph(X) });
});

test('legacy LINE-only account (placeholder, no app_metadata): review, never automatic sign-in', () => {
  const legacy = u('legacy', { email: ph(X), user_metadata: { line_id: X, provider: 'line' } });
  assert.deepEqual(L.decideLogin(X, L.lookupLine([legacy], X)), { action: 'review', userId: 'legacy' });
  // even with an explicit "create" the legacy account is not replaced by a new one
  assert.deepEqual(L.decideLogin(X, L.lookupLine([legacy], X), true), { action: 'review', userId: 'legacy' });
});

test('placeholder pre-registration (attacker made line_<id>@… first): review, never sign the LINE owner into it', () => {
  const pre = u('pre', { email: ph(X) }); // no claims at all
  assert.deepEqual(L.decideLogin(X, L.lookupLine([pre], X)), { action: 'review', userId: 'pre' });
});

test('legacy placeholder plus forged claims elsewhere: forged claims are ignored', () => {
  const users = [u('legacy', { email: ph(X), user_metadata: { line_id: X } }), u('forger', { user_metadata: { line_id: X } })];
  const found = L.lookupLine(users, X);
  assert.equal(found.legacyPlaceholder, 'legacy');
  assert.deepEqual(found.legacyClaims, ['forger']);
  assert.equal(L.decideLogin(X, found).action, 'review');
});

test('email-based hijack: an account with a matching real email is never chosen', () => {
  const users = [u('victim', { email: 'victim@example.invalid', identities: [{ provider: 'google' }] })];
  assert.deepEqual(L.decideLogin(X, L.lookupLine(users, X)), { action: 'create', email: ph(X) });
});

test('invalid LINE profile id', () => {
  for (const bad of [undefined, '', 'x'.repeat(129), 'U1;drop', 42]) assert.equal(L.decideLogin(bad, L.lookupLine([], 'U1')).action, 'error');
});

test('link: Google account + LINE (V3) links; holder self = already; other holder = refused', () => {
  const v3 = u('v3', { identities: [{ provider: 'google' }], user_metadata: { line_id: X } });
  assert.deepEqual(L.decideLink(X, 'v3', L.lookupLine([v3], X)), { action: 'link' });
  assert.deepEqual(L.decideLink(X, 'a', L.lookupLine([u('a', { app_metadata: { line_id: X } })], X)), { action: 'already_linked' });
  assert.deepEqual(L.decideLink(X, 'b', L.lookupLine([u('a', { app_metadata: { line_id: X } }), u('b')], X)), { action: 'error', code: 'LINE_LINKED_TO_OTHER' });
});

test('link: signed-in legacy owner migrates their own placeholder account (session + LINE proof)', () => {
  const legacy = u('legacy', { email: ph(X), user_metadata: { line_id: X } });
  assert.deepEqual(L.decideLink(X, 'legacy', L.lookupLine([legacy], X)), { action: 'link' });
});

test('link: another account cannot take a LINE id that has a legacy account (no orphaned data)', () => {
  const legacy = u('legacy', { email: ph(X) });
  assert.deepEqual(L.decideLink(X, 'other', L.lookupLine([legacy, u('other')], X)), { action: 'error', code: 'LINE_LEGACY_ACCOUNT_EXISTS' });
});

test('concurrent linking: post-write check fails safe when two accounts hold the id', () => {
  const both = [u('a', { app_metadata: { line_id: X } }), u('b', { app_metadata: { line_id: X } })];
  assert.equal(L.postWriteCheck(X, both, 'a'), 'conflict');
  assert.equal(L.postWriteCheck(X, both, 'b'), 'conflict');
  assert.equal(L.postWriteCheck(X, [u('a', { app_metadata: { line_id: X } })], 'a'), 'ok');
});

test('pending link: ok, missing, nonce mismatch (other browser), expired, malformed', () => {
  const now = 1_700_000_000_000; const h = 'f'.repeat(64);
  const p = L.makePending(X, 'Name', h, now);
  assert.equal(p.exp, now + L.PENDING_TTL_MS);
  assert.equal(L.checkPending(p, h, now + 1000).ok, true);
  assert.equal(L.checkPending(null, h, now).code, 'LINK_PENDING_MISSING');
  assert.equal(L.checkPending(p, null, now).code, 'LINK_PENDING_MISMATCH');
  assert.equal(L.checkPending(p, 'e'.repeat(64), now).code, 'LINK_PENDING_MISMATCH');
  assert.equal(L.checkPending(p, h, now + L.PENDING_TTL_MS).code, 'LINK_PENDING_EXPIRED');
  assert.equal(L.checkPending({ ...p, line_id: 'bad id' }, h, now).code, 'LINK_PENDING_MISSING');
});

test('unlink guard: LINE-only accounts cannot unlink; accounts with Google can', () => {
  assert.equal(L.isLineOnly(u('a', { email: ph(X) })), true);
  assert.equal(L.isLineOnly(u('b', { email: ph(X), identities: [{ provider: 'email' }, { provider: 'google' }] })), false);
  assert.equal(L.isLineOnly(u('c')), false);
  assert.deepEqual(L.withoutLineId({ provider: 'email', line_id: X }), { provider: 'email', line_id: null, line_link_pending: null });
});

test('user-facing errors are fixed codes only', () => {
  assert.equal(L.toUserErrorCode('LINE_ACCOUNT_REVIEW'), 'LINE_ACCOUNT_REVIEW');
  assert.equal(L.toUserErrorCode('<script>alert(1)</script>'), 'auth_failed');
  assert.equal(L.toUserErrorCode('session_create_failed: {"msg":"secret"}'), 'auth_failed');
});

test('pagination: every page is read (2,500 users) and an endless list fails closed', async () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: `u${i}`, email: `${i}@x.invalid`, app_metadata: i === 2400 ? { line_id: X } : {}, user_metadata: {}, identities: [] }));
  const pages = (all) => ({ auth: { admin: { listUsers: async ({ page, perPage }) => ({ data: { users: all.slice((page - 1) * perPage, page * perPage) }, error: null }) } } });
  const S = load('lib/lineServer.ts', { '@supabase/supabase-js': { createClient: () => ({}) } });
  const all = await S.listAllUsers(pages(mk(2500)));
  assert.equal(all.length, 2500);
  assert.deepEqual(L.decideLogin(X, L.lookupLine(all, X)), { action: 'login', userId: 'u2400' });
  const endless = { auth: { admin: { listUsers: async () => ({ data: { users: mk(1000) }, error: null }) } } };
  await assert.rejects(S.listAllUsers(endless), /too_many/);
  const broken = { auth: { admin: { listUsers: async () => ({ data: null, error: { message: 'x' } }) } } };
  await assert.rejects(S.listAllUsers(broken), /list_users_failed/);
});

test('static guards: no email scope / id_token / user_metadata lookup / page-1-only listing', () => {
  const route = src('app/api/auth/line/route.ts');
  const cb = src('app/api/auth/line/callback/route.ts');
  const confirm = src('app/api/auth/line/confirm/route.ts');
  assert.match(route, /scope: 'profile openid',/);
  assert.doesNotMatch(route, /openid email/);
  for (const s of [cb, confirm]) {
    assert.doesNotMatch(s, /\.id_token|id_token\.split/);
    assert.doesNotMatch(s, /user_metadata\?\.line_id/);
    assert.doesNotMatch(s, /listUsers\(/); // only through listAllUsers
    assert.doesNotMatch(s, /u\.email === /);
  }
  assert.match(cb, /listAllUsers/);
  assert.match(confirm, /userFromBearer/);
  assert.match(src('lib/notify.ts'), /app_metadata\?\.line_id/);
  assert.doesNotMatch(src('lib/notify.ts'), /user_metadata\?\.line_id/);
  assert.match(src('app/profile/settings/page.tsx'), /app_metadata\?\.line_id/);
  assert.doesNotMatch(src('app/profile/connections/page.tsx'), /updateUser\(\{\s*data: \{ line_id/);
});
