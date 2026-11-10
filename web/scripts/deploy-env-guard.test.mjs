// Build guard (lib/deploy-env-guard.mjs) incl. F4 Phase D LINE UAT allowance + LINE origin helper (lib/lineOrigin.ts).
// Synthetic values only — no real key, channel or secret appears here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { checkDeployEnv, lineUatProblems, previewLineUat, STAGING_SERVICE_KEY_SHA256, STAGING_LINE_CHANNEL_ID_SHA256 } from '../lib/deploy-env-guard.mjs';
import { F4_LINE_UAT_BRANCH, F4_LINE_UAT_SITE_URL } from '../lib/line-uat.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}.sig`;

const STAGING_URL = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const PROD_URL = 'https://vhudldcizmbpujedojei.supabase.co';
const FAKE_KEY = 'sb_secret_SYNTHETIC_TEST_ONLY_0123456789';
const FAKE_LINE = '1650000000';
const lists = { serviceKeySha256: [sha(FAKE_KEY)], lineChannelIdSha256: [sha(FAKE_LINE)] };
const uatEnv = (over = {}) => ({
  VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: F4_LINE_UAT_BRANCH, F4_PREVIEW_LINE_UAT: '1',
  NEXT_PUBLIC_SUPABASE_URL: STAGING_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_SYNTHETIC',
  NEXT_PUBLIC_SITE_URL: F4_LINE_UAT_SITE_URL, SUPABASE_SERVICE_ROLE_KEY: FAKE_KEY,
  LINE_CHANNEL_ID: FAKE_LINE, LINE_CHANNEL_SECRET: 'synthetic-channel-secret', ...over,
});
const blocked = (env) => checkDeployEnv(env, lists).length > 0;

test('committed allow-lists are empty: the allowance cannot be granted until reviewed hashes are added', () => {
  assert.deepEqual(STAGING_SERVICE_KEY_SHA256, []);
  assert.deepEqual(STAGING_LINE_CHANNEL_ID_SHA256, []);
  assert.equal(previewLineUat(uatEnv()), false);
  assert.ok(checkDeployEnv(uatEnv()).some((p) => /LINE UAT not allowed/.test(p)), 'build blocked with the real (empty) lists');
});

test('allowed: UAT branch + flag + staging URL + UAT site URL + pinned hashes', () => {
  assert.deepEqual(lineUatProblems(uatEnv(), lists), []);
  assert.deepEqual(checkDeployEnv(uatEnv(), lists), []);
  assert.equal(previewLineUat(uatEnv(), lists), true);
  // legacy JWT form of a STAGING service key, pinned
  const legacy = jwt({ role: 'service_role', ref: 'wpxcukrwmegwzfccbbga' });
  assert.equal(previewLineUat(uatEnv({ SUPABASE_SERVICE_ROLE_KEY: legacy }), { ...lists, serviceKeySha256: [sha(legacy)] }), true);
});

test('refused: wrong branch (another Preview keeps the old rules)', () => {
  const env = uatEnv({ VERCEL_GIT_COMMIT_REF: 'feature/something-else' });
  assert.ok(blocked(env)); assert.equal(previewLineUat(env, lists), false);
});
test('refused: flag missing or not exactly 1', () => {
  for (const v of [undefined, '', '0', 'true', 'yes']) assert.ok(blocked(uatEnv({ F4_PREVIEW_LINE_UAT: v })), String(v));
});
test('refused: production Supabase URL', () => {
  const env = uatEnv({ NEXT_PUBLIC_SUPABASE_URL: PROD_URL });
  assert.ok(checkDeployEnv(env, lists).some((p) => /PRODUCTION Supabase/.test(p)));
  assert.equal(previewLineUat(env, lists), false);
});
test('refused: production publishable key (known production fingerprint)', () => {
  // the guard compares against production key hashes; simulate by checking a value whose hash is in that list is not
  // reproducible here, so assert the JWT-ref path: an anon JWT of the production project
  const env = uatEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt({ role: 'anon', ref: 'vhudldcizmbpujedojei' }) });
  assert.ok(blocked(env)); assert.equal(previewLineUat(env, lists), false);
});
test('refused: a service key that is not the pinned staging key (e.g. production secret key)', () => {
  assert.ok(blocked(uatEnv({ SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_PRODUCTION_LOOKALIKE' })));
  const prodJwt = jwt({ role: 'service_role', ref: 'vhudldcizmbpujedojei' });
  assert.ok(lineUatProblems(uatEnv({ SUPABASE_SERVICE_ROLE_KEY: prodJwt }), { ...lists, serviceKeySha256: [sha(prodJwt)] })
    .some((p) => /not a staging service key/.test(p)), 'even if someone pinned it, a production-ref JWT is refused');
});
test('refused: service key shipped as the public key', () => {
  assert.ok(checkDeployEnv(uatEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: FAKE_KEY }), lists).some((p) => /secret\/service-role/.test(p)));
});
test('refused: LINE channel not the pinned staging channel / secret missing', () => {
  assert.ok(blocked(uatEnv({ LINE_CHANNEL_ID: '1600000000' })));
  assert.ok(blocked(uatEnv({ LINE_CHANNEL_SECRET: '' })));
});
test('refused: site URL is production, another preview, or missing', () => {
  for (const u of ['https://www.whiskora.pet', 'https://whiskora-git-other-laspearxs-projects.vercel.app', undefined]) {
    assert.ok(blocked(uatEnv({ NEXT_PUBLIC_SITE_URL: u })), String(u));
  }
});
test('refused on every Preview, UAT included: LINE access token, Resend, VAPID private key', () => {
  for (const n of ['LINE_CHANNEL_ACCESS_TOKEN', 'RESEND_API_KEY', 'RESEND_FROM', 'VAPID_PRIVATE_KEY']) {
    assert.ok(blocked(uatEnv({ [n]: 'x' })), n);
  }
});
test('other Previews unchanged: no secrets → ok and LINE stays off; the flag alone does nothing', () => {
  const plain = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature/x', NEXT_PUBLIC_SUPABASE_URL: STAGING_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_SYNTHETIC' };
  assert.deepEqual(checkDeployEnv(plain, lists), []);
  assert.equal(previewLineUat(plain, lists), false);
  assert.deepEqual(checkDeployEnv({ ...plain, F4_PREVIEW_LINE_UAT: '1' }, lists), []);
  assert.equal(previewLineUat({ ...plain, F4_PREVIEW_LINE_UAT: '1' }, lists), false);
  // the UAT branch itself without secrets: builds, LINE off
  assert.deepEqual(checkDeployEnv({ ...plain, VERCEL_GIT_COMMIT_REF: F4_LINE_UAT_BRANCH }, lists), []);
  assert.equal(previewLineUat({ ...plain, VERCEL_GIT_COMMIT_REF: F4_LINE_UAT_BRANCH }, lists), false);
});
test('production unchanged: production build with its own secrets passes and never gets the UAT flag', () => {
  const prod = { VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: F4_LINE_UAT_BRANCH, F4_PREVIEW_LINE_UAT: '1',
    NEXT_PUBLIC_SUPABASE_URL: PROD_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_PROD_SYNTHETIC',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_PROD_SYNTHETIC', LINE_CHANNEL_ID: '1', LINE_CHANNEL_SECRET: 's', NEXT_PUBLIC_SITE_URL: 'https://www.whiskora.pet' };
  assert.deepEqual(checkDeployEnv(prod, lists), []);
  assert.equal(previewLineUat(prod, lists), false);
});

// ── LINE origins (callback trusted origin / redirect_uri) ──
const req = createRequire(import.meta.url);
function loadTs(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  vm.runInThisContext(`(function (module, exports, require) {${code}\n})`, { filename: file })(m, m.exports, (s) => req(s.startsWith('.') ? path.join(root, 'lib', s) : s));
  return m.exports;
}
const O = loadTs('lib/lineOrigin.ts');
test('callback origin — production mode: only whiskora.pet origins, fallback www', () => {
  assert.equal(O.lineCallbackSiteUrl('https://www.whiskora.pet', false), 'https://www.whiskora.pet');
  assert.equal(O.lineCallbackSiteUrl('https://whiskora.pet/', false), 'https://whiskora.pet');
  assert.equal(O.lineCallbackSiteUrl(F4_LINE_UAT_SITE_URL, false), 'https://www.whiskora.pet', 'production never trusts the Preview');
  assert.equal(O.lineCallbackSiteUrl('https://evil.example', false), 'https://www.whiskora.pet');
  assert.equal(O.lineAuthorizeSiteUrl(undefined, false), 'https://www.whiskora.pet');
  assert.equal(O.lineAuthorizeSiteUrl('https://www.whiskora.pet/', false), 'https://www.whiskora.pet');
});
test('callback origin — UAT mode: only the UAT Preview, never production, never an attacker origin', () => {
  for (const o of ['https://www.whiskora.pet', 'https://whiskora.pet', 'https://evil.example', '', undefined,
    'https://whiskora-git-other-laspearxs-projects.vercel.app']) {
    assert.equal(O.lineCallbackSiteUrl(o, true), F4_LINE_UAT_SITE_URL, String(o));
  }
  assert.deepEqual(O.lineTrustedOrigins(true), [F4_LINE_UAT_SITE_URL]);
  assert.equal(O.lineAuthorizeSiteUrl('https://www.whiskora.pet', true), F4_LINE_UAT_SITE_URL, 'env cannot point UAT at production');
});

test('static: LINE routes use the UAT-aware switch; notifications keep the all-Preview switch', () => {
  const r = (f) => fs.readFileSync(path.join(root, f), 'utf8');
  for (const f of ['app/api/auth/line/route.ts', 'app/api/auth/line/callback/route.ts', 'app/api/auth/line/confirm/route.ts', 'app/api/auth/line/status/route.ts']) {
    assert.doesNotMatch(r(f), /isPreviewDeploy/, f);
    assert.match(r(f), /lineRoutesDisabled/, f);
  }
  assert.doesNotMatch(r('app/api/auth/line/callback/route.ts'), /'https:\/\/www\.whiskora\.pet'/, 'no hard-coded production fallback in the callback');
  assert.doesNotMatch(r('app/api/auth/line/route.ts'), /\|\| 'https:\/\/www\.whiskora\.pet'/, 'no hard-coded production fallback when starting OAuth');
  assert.match(r('lib/notify.ts'), /if \(isPreviewDeploy\)/);
  assert.match(r('app/api/notify/send/route.ts'), /if \(isPreviewDeploy\)/);
  // client-reachable module never imports the guard (node:crypto, secret checks) — only the constant module
  assert.doesNotMatch(r('lib/deploy-env.ts'), /deploy-env-guard/);
  assert.match(r('next.config.ts'), /WHISKORA_LINE_UAT: previewLineUat\(\) \? '1' : '0'/);
});
