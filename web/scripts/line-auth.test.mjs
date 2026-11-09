// F4 — LINE identity decisions + static guards. Synthetic data only; no network, no database.
// (Database behaviour: supabase/tests/local/f4_line_identity_test.sql; races: scripts/line-identity-race.test.mjs;
//  end to end: scripts/line-auth.integration.mjs.)
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
function load(file) {
  const code = ts.transpileModule(src(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  vm.runInThisContext(`(function (module, exports, require) {${code}\n})`, { filename: file })(m, m.exports, req);
  return m.exports;
}
const L = load('lib/lineAuth.ts');
const X = 'U' + 'a'.repeat(31) + 'F';

test('placeholder email is lower case (GoTrue stores emails lower-cased)', () => {
  assert.equal(L.placeholderEmail(X), `line_${X.toLowerCase()}@line.whiskora.internal`);
  assert.equal(L.isPlaceholderEmail(L.placeholderEmail(X)), true);
  assert.equal(L.isPlaceholderEmail('someone@example.com'), false);
});

test('login decisions follow the database resolve result only', () => {
  assert.deepEqual(L.decideLogin('holder', 'u1'), { action: 'login', userId: 'u1' });
  assert.deepEqual(L.decideLogin('none', null), { action: 'create' });
  assert.deepEqual(L.decideLogin('legacy', 'u2'), { action: 'review' });          // never an automatic sign-in
  assert.deepEqual(L.decideLogin('legacy', 'u2', true), { action: 'review' });    // explicit "create" cannot replace a legacy account
  assert.deepEqual(L.decideLogin('creating', 'u3'), { action: 'retry' });
  assert.deepEqual(L.decideLogin('claims', null), { action: 'relink_suggested' });
  assert.deepEqual(L.decideLogin('claims', null, true), { action: 'create' });
  assert.deepEqual(L.decideLogin('holder', null), { action: 'error', code: 'LINE_PROFILE_INVALID' });
  assert.deepEqual(L.decideLogin('weird', null), { action: 'error', code: 'LINE_PROFILE_INVALID' });
});

test('LINE ids: bounded charset only', () => {
  for (const bad of [undefined, '', 'x'.repeat(129), "U1';drop", 42, 'a b']) assert.equal(L.isValidLineUserId(bad), false);
  assert.equal(L.isValidLineUserId(X), true);
});

test('unlink guard: LINE-only accounts cannot unlink; accounts with Google can', () => {
  assert.equal(L.isLineOnly({ email: L.placeholderEmail(X), identities: [{ provider: 'email' }] }), true);
  assert.equal(L.isLineOnly({ email: L.placeholderEmail(X), identities: [{ provider: 'email' }, { provider: 'google' }] }), false);
  assert.equal(L.isLineOnly({ email: 'a@example.invalid', identities: [] }), false);
});

test('SQL results map to fixed user codes', () => {
  assert.equal(L.takeErrorCode('expired'), 'LINK_PENDING_EXPIRED');
  assert.equal(L.takeErrorCode('mismatch'), 'LINK_PENDING_MISMATCH');
  assert.equal(L.takeErrorCode('missing'), 'LINK_PENDING_MISSING');
  assert.equal(L.claimErrorCode('line_taken'), 'LINE_LINKED_TO_OTHER');
  assert.equal(L.claimErrorCode('legacy_exists'), 'LINE_LEGACY_ACCOUNT_EXISTS');
  assert.equal(L.claimErrorCode('something else'), 'auth_failed');
  assert.equal(L.toUserErrorCode('<script>alert(1)</script>'), 'auth_failed');
  assert.equal(L.toUserErrorCode('session_create_failed: {"msg":"secret"}'), 'auth_failed');
});

test('every user code has TH and EN text', () => {
  const tsrc = src('lib/lineAuthMessages.ts');
  for (const c of L.USER_ERROR_CODES) assert.equal((tsrc.match(new RegExp(`\\b${c}:`, 'g')) || []).length, 2, c);
});

test('static guards: identity only through the database functions (Codex H2 / C1–C4)', () => {
  const route = src('app/api/auth/line/route.ts');
  const cb = src('app/api/auth/line/callback/route.ts');
  const confirm = src('app/api/auth/line/confirm/route.ts');
  const status = src('app/api/auth/line/status/route.ts');
  const all = [route, cb, confirm, status, src('lib/lineServer.ts')].join('\n');
  // C3: no email scope / id_token
  assert.match(route, /scope: 'profile openid',/);
  assert.doesNotMatch(route, /openid email/);
  assert.doesNotMatch(all, /\.id_token|id_token\.split/);
  // C1 / H2: no metadata-based identity, no read-modify-write of app_metadata, no user scans
  assert.doesNotMatch(all, /user_metadata\?\.line_id|app_metadata\?\.line_id|line_link_pending:/);
  assert.doesNotMatch(all, /app_metadata:\s*\{\s*\.\.\./);
  assert.doesNotMatch(all, /listUsers\(/);
  // the callback never touches the mapping in link mode: only a pending row
  const linkBlock = cb.slice(cb.indexOf("if (mode === 'link')"), cb.indexOf('3b. LOGIN MODE'));
  assert.match(linkBlock, /line_link_pending_put/);
  assert.doesNotMatch(linkBlock, /line_identity_claim|updateUserById/);
  // confirm consumes the pending row atomically, legacy accounts reset credentials before the mapping (H1)
  assert.match(confirm, /line_link_take/);
  const legacy = confirm.slice(confirm.indexOf('line_legacy_link_begin'));
  assert.ok(legacy.indexOf('rotatePassword') < legacy.indexOf('line_op_mark_reset') && legacy.indexOf('line_op_mark_reset') < legacy.indexOf('line_op_commit'));
  // unlink through the database
  assert.match(route, /line_identity_release/);
  // L1: every rpc goes through the checked helper
  assert.match(src('lib/lineServer.ts'), /if \(error\) throw new LineRpcError/);
  assert.doesNotMatch([cb, confirm, route, status].join('\n'), /admin\.rpc\(/);
  // notify / settings / connections never read a LINE id from metadata
  assert.match(src('lib/notify.ts'), /line_identity_of/);
  assert.doesNotMatch(src('lib/notify.ts'), /user_metadata\?\.line_id|app_metadata\?\.line_id/);
  assert.doesNotMatch(src('app/profile/settings/page.tsx'), /app_metadata\?\.line_id|user_metadata\?\.line_id/);
  assert.doesNotMatch(src('app/profile/connections/page.tsx'), /updateUser\(\{\s*data: \{ line_id|appMeta\.line_id|userMeta\.line_id &&/);
});

test('static guards: recovery script (Codex M1 / M2 / L2)', () => {
  const s = fs.readFileSync(path.join(root, '../supabase/scripts/line_identity_recovery.mjs'), 'utf8');
  assert.match(s, /line_recovery_begin/);            // version + full user id + freshness + reviewer + ≥2 checks (enforced in SQL)
  assert.match(s, /many\('--check'\)/);
  assert.match(s, /line_op_mark_reset/);            // reset verified in SQL before commit
  assert.match(s, /line_op_abort/);                 // rotation failure → back to open
  assert.match(s, /resume/);
  assert.match(s, /--production/);
  assert.doesNotMatch(s, /admin\/users\?page=/);   // no user listing / pagination at all
  const fin = s.slice(s.indexOf('async function finish'), s.indexOf("if (cmd === 'approve')"));
  const order = ['await rotate', "'line_op_mark_reset'", "'line_op_commit'"].map((k) => fin.indexOf(k));
  assert.ok(order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), 'rotate → mark_reset → commit');
  const appr = s.slice(s.indexOf("if (cmd === 'approve')"), s.indexOf("if (cmd === 'resume')"));
  assert.ok(appr.indexOf("'line_recovery_begin'") > 0 && appr.indexOf("'line_recovery_begin'") < appr.indexOf('await finish('), 'begin before finish');
});
