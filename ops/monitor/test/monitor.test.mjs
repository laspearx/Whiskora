// Mock tests: no network, no Discord. node --test ops/monitor/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, validate, ConfigError } from '../src/config.mjs';
import { runOnce } from '../src/run.mjs';
import { emptyState } from '../src/engine.mjs';
import { deliver, redact } from '../src/discord.mjs';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOK_A = 'https://discord.com/api/webhooks/111/fake-alerts-token';
const HOOK_R = 'https://discord.com/api/webhooks/222/fake-releases-token';
const ENV = { DISCORD_WEBHOOK_WHISKORA_ALERTS: HOOK_A, DISCORD_WEBHOOK_WHISKORA_RELEASES: HOOK_R };
const MIN = 60_000;

// ── harness: routes URL → handler; records Discord posts; fake clock
function harness({ site = {}, discord } = {}) {
  let t = Date.UTC(2026, 10, 2, 5, 0, 0);
  const posts = [], calls = [];
  const pages = {
    'https://www.whiskora.pet/th': () => new Response('<title>Whiskora</title><span>V<!-- -->1.14.0</span>', { status: 200 }),
    'https://www.whiskora.pet/th/login': () => new Response('ok', { status: 200 }),
    'https://www.whiskora.pet/th/farm-hub': () => new Response('ok', { status: 200 }),
    'https://raw.githubusercontent.com/laspearx/Whiskora/main/web/lib/version.ts': () => new Response('export const APP_VERSION = "1.14.0";', { status: 200 }),
    'https://www.google.com/generate_204': () => new Response(null, { status: 204 }),
    'https://www.cloudflare.com/cdn-cgi/trace': () => new Response('ok', { status: 200 }),
  };
  const h = {
    site: { ...pages, ...site },
    discord: discord || (() => new Response('{}', { status: 200 })),
    now: () => t, advance: (ms) => { t += ms; },
    sleep: async (ms) => { h.slept.push(ms); t += ms; }, slept: [], posts, calls,
  };
  h.fetch = async (url, opts = {}) => {
    calls.push(url);
    if (url.startsWith('https://discord.com/api/webhooks/')) {
      const body = JSON.parse(opts.body); posts.push({ hook: url.replace('?wait=true', ''), body });
      return h.discord(url, body, posts.length);
    }
    const f = h.site[url]; if (!f) throw new TypeError('unexpected url ' + url);
    return f(opts);
  };
  return h;
}
const config = load(DIR);
const run = async (h, state, extra = {}) => runOnce({ config, state, fetchImpl: h.fetch, now: h.now, sleep: h.sleep, env: ENV, mode: 'send', ...extra });
const down = (status = 503) => () => new Response('err', { status });

// ── config
test('repo config: whiskora enabled, other projects disabled with unknown URLs', () => {
  const ids = config.projects.map((p) => `${p.id}:${p.enabled}`);
  assert.deepEqual(ids, ['glowlog:false', 'likanara:false', 'natchworks:false', 'whiskora:true']);
  assert.ok(config.projects.filter((p) => !p.enabled).every((p) => p.checks.every((c) => c.url === null)));
});
test('config: enabling a project with an unknown URL is refused', () => {
  const p = { id: 'likanara', name: 'likanara', enabled: true, checks: [{ id: 'home', type: 'http', url: null }] };
  assert.throws(() => validate(config.shared, [p]), ConfigError);
});
test('config: routes must be env var NAMES (a pasted webhook URL is refused)', () => {
  assert.throws(() => validate({ ...config.shared, routes: { ...config.shared.routes, monitor: HOOK_A } }, []), ConfigError);
});
test('config: no secret in any config file', async () => {
  const fs = await import('node:fs');
  for (const f of ['monitor.json', ...fs.readdirSync(path.join(DIR, 'projects')).map((x) => `projects/${x}`)])
    assert.ok(!/discord(app)?\.com\/api\/webhooks/i.test(fs.readFileSync(path.join(DIR, f), 'utf8')), f);
});

// ── no noise when healthy
test('healthy runs post nothing', async () => {
  const h = harness(); let s = emptyState();
  for (let i = 0; i < 6; i++) { s = (await run(h, s)).state; h.advance(5 * MIN); }
  assert.equal(h.posts.length, 0);
});

// ── down → reminder → recovered, deduplicated
test('one failure is not enough; 2 in a row → one alert; then silence; reminder after repeatMinutes; recovery', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state; h.advance(5 * MIN);
  h.site['https://www.whiskora.pet/th/login'] = down(503);
  s = (await run(h, s)).state; assert.equal(h.posts.length, 0, 'first failure');
  h.advance(5 * MIN); s = (await run(h, s)).state;
  assert.equal(h.posts.length, 1); assert.equal(h.posts[0].hook, HOOK_A);
  assert.match(h.posts[0].body.content, /Whiskora[\s\S]*login\*\* ผิดปกติ — HTTP 503/);
  for (let i = 0; i < 10; i++) { h.advance(5 * MIN); s = (await run(h, s)).state; }
  assert.equal(h.posts.length, 1, 'no repeat inside repeatMinutes');
  h.advance(360 * MIN); s = (await run(h, s)).state;
  assert.equal(h.posts.length, 2); assert.match(h.posts[1].body.content, /ยังผิดปกติ/);
  h.site['https://www.whiskora.pet/th/login'] = () => new Response('ok', { status: 200 });
  h.advance(5 * MIN); s = (await run(h, s)).state;
  assert.equal(h.posts.length, 3); assert.match(h.posts[2].body.content, /login\*\* กลับมาปกติ \(ผิดปกติ \d+ ชม\./);
  h.advance(5 * MIN); await run(h, s); assert.equal(h.posts.length, 3, 'no message while healthy again');
});
test('several checks failing in the same run → one message', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state;
  h.site['https://www.whiskora.pet/th/login'] = down(500); h.site['https://www.whiskora.pet/th/farm-hub'] = down(502);
  s = (await run(h, s)).state; s = (await run(h, s)).state;
  assert.equal(h.posts.length, 1);
  assert.match(h.posts[0].body.content, /login[\s\S]*farm-hub|farm-hub[\s\S]*login/);
});
test('target timeout is a site failure with reason "timeout"', async () => {
  const h = harness({ site: { 'https://www.whiskora.pet/th/farm-hub': (opts) => new Promise((_, rej) => opts.signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))) } });
  const cfg = structuredClone(config); cfg.shared.defaults.timeoutMs = 30;
  let s = (await runOnce({ config: cfg, state: emptyState(), fetchImpl: h.fetch, now: h.now, sleep: h.sleep, env: ENV, mode: 'send' })).state;
  s = (await runOnce({ config: cfg, state: s, fetchImpl: h.fetch, now: h.now, sleep: h.sleep, env: ENV, mode: 'send' })).state;
  assert.equal(h.posts.length, 1); assert.match(h.posts[0].body.content, /farm-hub\*\* ผิดปกติ — timeout/);
});

// ── monitor problems are not site problems
test('monitor network down (all canaries fail): no site alert, site state untouched, one monitor alert, then recovery', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state;
  const before = structuredClone(s.checks);
  const offline = () => { throw new TypeError('fetch failed'); };
  for (const u of ['https://www.google.com/generate_204', 'https://www.cloudflare.com/cdn-cgi/trace', 'https://www.whiskora.pet/th', 'https://www.whiskora.pet/th/login', 'https://www.whiskora.pet/th/farm-hub']) h.site[u] = offline;
  s = (await run(h, s)).state; s = (await run(h, s)).state; s = (await run(h, s)).state;
  assert.deepEqual(s.checks, before, 'site states unchanged');
  assert.equal(h.posts.length, 1); assert.match(h.posts[0].body.content, /ตัวตรวจมีปัญหา\*\* \(ไม่ใช่เว็บล่ม/);
  assert.doesNotMatch(h.posts[0].body.content, /\*\*home\*\*|\*\*login\*\*/);
  const fresh = harness(); h.site = fresh.site;
  s = (await run(h, s)).state;
  assert.equal(h.posts.length, 2); assert.match(h.posts[1].body.content, /ตัวตรวจกลับมาปกติ/);
});
test('a bug inside a check is a monitor issue, not a site failure', async () => {
  const h = harness(); const cfg = structuredClone(config);
  const w = cfg.projects.find((p) => p.id === 'whiskora');
  Object.defineProperty(w.checks[1], 'url', { get() { throw new Error('boom'); } });
  let s = (await runOnce({ config: cfg, state: emptyState(), fetchImpl: h.fetch, now: h.now, sleep: h.sleep, env: ENV, mode: 'send' })).state;
  s = (await runOnce({ config: cfg, state: s, fetchImpl: h.fetch, now: h.now, sleep: h.sleep, env: ENV, mode: 'send' })).state;
  assert.equal(h.posts.length, 1); assert.match(h.posts[0].body.content, /ตัวตรวจมีปัญหา[\s\S]*whiskora\/login: monitor error/);
});

// ── releases
test('releases: first sight is a baseline; a new version → releases route only', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state;
  assert.equal(h.posts.length, 0);
  h.site['https://www.whiskora.pet/th'] = () => new Response('<title>Whiskora</title>V<!-- -->1.14.1', { status: 200 });
  h.site['https://raw.githubusercontent.com/laspearx/Whiskora/main/web/lib/version.ts'] = () => new Response('APP_VERSION = "1.14.1"', { status: 200 });
  s = (await run(h, s)).state;
  assert.equal(h.posts.length, 1); assert.equal(h.posts[0].hook, HOOK_R);
  assert.match(h.posts[0].body.content, /ตรวจพบเวอร์ชันที่เสิร์ฟเปลี่ยน: 1\.14\.0 → \*\*1\.14\.1\*\* · ตรงกับ main/);
  assert.doesNotMatch(h.posts[0].body.content, /https?:|deploy|build|สำเร็จ/i, 'no link, no deploy / build claim');
  await run(h, s); assert.equal(h.posts.length, 1, 'same version again → nothing');
});
test('release lag: main ahead of the site for > releaseLagMinutes → one alert, cleared once live', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state;
  h.site['https://raw.githubusercontent.com/laspearx/Whiskora/main/web/lib/version.ts'] = () => new Response('APP_VERSION = "1.14.1"', { status: 200 });
  for (let i = 0; i < 2; i++) { s = (await run(h, s)).state; h.advance(30 * MIN); }
  assert.equal(h.posts.length, 0, 'inside 60 min');
  s = (await run(h, s)).state;
  assert.equal(h.posts.length, 1); assert.equal(h.posts[0].hook, HOOK_A); assert.match(h.posts[0].body.content, /เวอร์ชันที่เสิร์ฟ \(1\.14\.0\) ไม่ตรงกับ main \(1\.14\.1\)/);
  h.site['https://www.whiskora.pet/th'] = () => new Response('<title>Whiskora</title>V<!-- -->1.14.1', { status: 200 });
  s = (await run(h, s)).state;
  const last = h.posts.slice(1).map((p) => p.body.content).join('\n');
  assert.match(last, /ตรวจพบเวอร์ชันที่เสิร์ฟเปลี่ยน: 1\.14\.0 → \*\*1\.14\.1\*\* · ตรงกับ main/); assert.match(last, /ตรงกับ main แล้ว/);
});
test('version missing on a page that loads → monitor issue (pattern drift), no site alert', async () => {
  const h = harness(); h.site['https://www.whiskora.pet/th'] = () => new Response('<title>Whiskora</title> no version', { status: 200 });
  let s = (await run(h, emptyState())).state; s = (await run(h, s)).state;
  assert.equal(h.posts.length, 1); assert.match(h.posts[0].body.content, /ตัวตรวจมีปัญหา[\s\S]*version not found on page/);
});

// ── delivery: rate limit, timeout, invalid webhook, outbox
const DCFG = { timeoutMs: 50, maxAttempts: 3, budgetMs: 60_000, outboxMax: 50, outboxMaxAgeMinutes: 1440 };
const msg = (route = 'DISCORD_WEBHOOK_WHISKORA_ALERTS', content = 'x') => ({ route, content });
const rl = (retry, extra = {}) => new Response(JSON.stringify({ message: 'You are being rate limited.', retry_after: retry, global: false }), { status: 429, headers: { 'retry-after': String(Math.ceil(retry)), ...extra } });

test('429 → waits retry_after (seconds, float) then delivers', async () => {
  const h = harness({ discord: (u, b, n) => (n === 1 ? rl(2.5) : new Response('{}', { status: 200 })) });
  const r = await deliver([msg()], { env: ENV, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG });
  assert.equal(r.sent, 1); assert.deepEqual(h.slept, [2500]); assert.equal(r.issues.length, 0);
});
test('429 longer than the budget → kept in the outbox, reported, delivered on the next run', async () => {
  const h = harness({ discord: (u, b, n) => (n === 1 ? rl(600) : new Response('{}', { status: 200 })) });
  const r1 = await run(h, { ...emptyState(), outbox: [{ ...msg(), content: 'queued', createdAt: h.now() }] });
  assert.equal(r1.state.outbox.length, 1); assert.equal(r1.exitCode, 1);
  const r2 = await run(h, r1.state);
  assert.equal(r2.state.outbox.length, 0); assert.equal(h.posts.at(-1).body.content, 'queued');
});
test('bucket exhausted (X-RateLimit-Remaining 0) → next post on that route waits Reset-After', async () => {
  const h = harness({ discord: () => new Response('{}', { status: 200, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset-after': '1.2' } }) });
  const r = await deliver([msg(), msg()], { env: ENV, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG });
  assert.equal(r.sent, 2); assert.deepEqual(h.slept, [1200]);
});
test('Discord timeout / 5xx → retried, then delivered', async () => {
  const h = harness({ discord: (u, b, n) => (n === 1 ? new Promise(() => {}) : n === 2 ? new Response('', { status: 502 }) : new Response('{}', { status: 200 })) });
  h.fetch = ((orig) => async (url, opts) => { if (url.includes('discord') && h.posts.length === 0) { h.posts.push({}); return new Promise((_, rej) => opts.signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))); } return orig(url, opts); })(h.fetch);
  const r = await deliver([msg()], { env: ENV, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG });
  assert.equal(r.sent, 1); assert.equal(r.issues.length, 0);
});
test('webhook 404 → no retry, route not used again this run, issue says replace the secret, URL never shown', async () => {
  const logs = []; const h = harness({ discord: () => new Response('{"message":"Unknown Webhook"}', { status: 404 }) });
  const r = await deliver([msg(), msg()], { env: ENV, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG, log: (s) => logs.push(s) });
  assert.equal(h.posts.length, 1); assert.equal(r.outbox.length, 2);
  assert.match(r.issues[0], /DISCORD_WEBHOOK_WHISKORA_ALERTS rejected \(404\) — replace the secret/);
  assert.ok(![...r.issues, ...logs, JSON.stringify(r.outbox)].some((s) => s.includes('fake-alerts-token')));
});
test('webhook not configured → kept, reported by env var name only', async () => {
  const h = harness();
  const r = await deliver([msg('DISCORD_WEBHOOK_WHISKORA_RELEASES')], { env: {}, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG });
  assert.equal(h.posts.length, 0); assert.deepEqual(r.issues, ['webhook not configured: DISCORD_WEBHOOK_WHISKORA_RELEASES']); assert.equal(r.outbox.length, 1);
});
test('a non-webhook value in the secret is refused without calling it', async () => {
  const h = harness();
  const r = await deliver([msg()], { env: { DISCORD_WEBHOOK_WHISKORA_ALERTS: 'https://example.com/x' }, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG });
  assert.equal(h.calls.length, 0); assert.match(r.issues[0], /not a Discord webhook URL/);
});
test('payload: no mentions allowed, content ≤ 2000 chars', async () => {
  const h = harness();
  await deliver([msg(undefined, '@everyone ' + 'ก'.repeat(10))], { env: ENV, fetchImpl: h.fetch, sleep: h.sleep, now: h.now, cfg: DCFG });
  assert.deepEqual(h.posts[0].body.allowed_mentions, { parse: [] });
  const { clip } = await import('../src/compose.mjs'); assert.ok(clip('x'.repeat(5000)).length <= 2000);
});
test('dry run never calls Discord', async () => {
  const h = harness(); h.site['https://www.whiskora.pet/th/login'] = down(500);
  let s = (await run(h, emptyState(), { mode: 'preview' })).state; await run(h, s, { mode: 'preview' });
  assert.ok(!h.calls.some((u) => u.includes('discord')));
});
test('redact() hides webhook URLs in any text', () => {
  assert.equal(redact(`posting to ${HOOK_A}?wait=true failed`), 'posting to [webhook] failed');
});

// ── preview / trial never touch the real state
import { serialize, parseState } from '../src/state.mjs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import fsx from 'node:fs';

test('preview with a pending outbox message: state identical, outbox kept, nothing sent', async () => {
  const h = harness();
  const pending = { ...emptyState(), outbox: [{ route: 'DISCORD_WEBHOOK_WHISKORA_ALERTS', content: 'pending alert', createdAt: h.now(), attempts: 1 }] };
  const logs = [];
  const r = await run(h, pending, { mode: 'preview', log: (x) => logs.push(x) });
  assert.equal(r.stateChanged, false); assert.deepEqual(r.state, pending); assert.equal(r.summary.sent, 0);
  assert.ok(logs.some((l) => l.includes('would post') && l.includes('pending alert')));
  assert.ok(!h.calls.some((u) => u.includes('discord')));
});
test('preview runs while a site is failing, then send: the alert is still posted (not lost by the previews)', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state; // healthy baseline (send mode, nothing posted)
  h.site['https://www.whiskora.pet/th/login'] = down(503);
  for (let i = 0; i < 4; i++) { const p = await run(h, s, { mode: 'preview' }); assert.deepEqual(p.state, s); h.advance(30 * MIN); }
  assert.equal(h.posts.length, 0);
  s = (await run(h, s)).state; h.advance(30 * MIN); s = (await run(h, s)).state; // two real failures
  assert.equal(h.posts.length, 1); assert.match(h.posts[0].body.content, /login\*\* ผิดปกติ/);
});
test('trial advances its own state and posts nothing', async () => {
  const h = harness(); h.site['https://www.whiskora.pet/th/login'] = down(500);
  let t1 = await run(h, emptyState(), { mode: 'trial' }); let t2 = await run(h, t1.state, { mode: 'trial' });
  assert.equal(t2.state.checks['whiskora/login'].status, 'down'); assert.equal(t2.messages.length, 1);
  assert.ok(!h.calls.some((u) => u.includes('discord')));
});
test('cli refuses a trial state that is the real state file (before any network)', () => {
  const d = fsx.mkdtempSync(path.join(os.tmpdir(), 'mon-')); const f = path.join(d, 's.json');
  const r = spawnSync(process.execPath, [path.join(DIR, 'src/cli.mjs'), '--state', f, '--trial-state', f], { encoding: 'utf8', timeout: 20000 });
  fsx.rmSync(d, { recursive: true, force: true });
  assert.equal(r.status, 1); assert.match(r.stderr, /must not be the real state file/);
});

// ── state across runs
const roundtrip = (st) => parseState(serialize(st)).state;
test('save → load across runs keeps an open incident, then recovery is reported with its duration', async () => {
  const h = harness(); let s = roundtrip((await run(h, emptyState())).state);
  h.site['https://www.whiskora.pet/th/login'] = down(503);
  s = roundtrip((await run(h, s)).state); h.advance(30 * MIN); s = roundtrip((await run(h, s)).state);
  assert.equal(s.checks['whiskora/login'].status, 'down'); assert.equal(h.posts.length, 1);
  h.site['https://www.whiskora.pet/th/login'] = () => new Response('ok', { status: 200 }); h.advance(90 * MIN);
  s = roundtrip((await run(h, s)).state);
  assert.equal(h.posts.length, 2); assert.match(h.posts[1].body.content, /กลับมาปกติ \(ผิดปกติ 120 นาที; ล่าสุด: HTTP 503\)|กลับมาปกติ \(ผิดปกติ 2 ชม\.; ล่าสุด: HTTP 503\)/);
});
test('save → load keeps undelivered messages; they go out on the next run', async () => {
  const h = harness({ discord: (u, b, n) => (n === 1 ? rl(600) : new Response('{}', { status: 200 })) });
  const r1 = await run(h, { ...emptyState(), outbox: [{ route: 'DISCORD_WEBHOOK_WHISKORA_ALERTS', content: 'held', createdAt: h.now() }] });
  const s = roundtrip(r1.state); assert.equal(s.outbox.length, 1);
  await run(h, s); assert.equal(h.posts.at(-1).body.content, 'held');
});
test('healthy runs serialize to identical text (no needless saves)', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state; const a = serialize(s);
  for (let i = 0; i < 3; i++) { h.advance(30 * MIN); s = (await run(h, s)).state; }
  assert.equal(serialize(s), a);
});
test('missing state (not first run) → immediate notice of what is lost; first run → silent', async () => {
  const p = parseState(null); assert.equal(p.problem, 'missing');
  const h = harness(); await run(h, p.state, { stateProblem: p.problem });
  assert.equal(h.posts.length, 1); assert.equal(h.posts[0].hook, HOOK_A);
  assert.match(h.posts[0].body.content, /state หาย \(missing\)[\s\S]*ถูกลืม[\s\S]*outbox[\s\S]*จุดเริ่มใหม่/);
  assert.equal(parseState(null, { firstRun: true }).problem, null);
});
test('corrupt / foreign state → fresh state + notice; site incidents re-detected by threshold', async () => {
  for (const [txt, want] of [['{not json', 'corrupt'], ['{"v":1,"checks":[],"releases":{},"outbox":[]}', 'corrupt'], ['{"v":9,"checks":{},"releases":{},"outbox":[]}', 'unsupported version']])
    assert.equal(parseState(txt).problem, want);
  const h = harness(); h.site['https://www.whiskora.pet/th/login'] = down(503);
  const p = parseState('{not json');
  let s = (await run(h, p.state, { stateProblem: p.problem })).state;
  assert.equal(h.posts.length, 1); assert.match(h.posts[0].body.content, /อ่านไม่ได้ \(corrupt\)/);
  s = (await run(h, s)).state; // second failure since the reset → alert again
  assert.equal(h.posts.length, 2); assert.match(h.posts[1].body.content, /login\*\* ผิดปกติ/);
});
test('release notice when main cannot be read: says so, no claim of a match', async () => {
  const h = harness(); let s = (await run(h, emptyState())).state;
  h.site['https://www.whiskora.pet/th'] = () => new Response('<title>Whiskora</title>V<!-- -->1.14.1', { status: 200 });
  h.site['https://raw.githubusercontent.com/laspearx/Whiskora/main/web/lib/version.ts'] = () => new Response('', { status: 503 });
  await run(h, s);
  assert.match(h.posts.find((p) => p.hook === HOOK_R).body.content, /1\.14\.0 → \*\*1\.14\.1\*\* · เทียบ main ไม่ได้ \(HTTP 503\)/);
});
