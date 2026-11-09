// F4 — deterministic race tests for the LINE identity migration (20261110090000_line_identity_map.sql).
// Two real psql sessions are driven step by step: session 1 opens a transaction and holds its locks, session 2's call
// is shown to be BLOCKED, then session 1 commits and session 2's result is checked. No timing luck involved.
// Needs a throwaway local Postgres: F4_PG="-h 127.0.0.1 -p 54329 -U postgres" (skipped otherwise). Synthetic data only.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PG = process.env.F4_PG ? process.env.F4_PG.split(' ') : null;
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DB = 'f4race';
const psql = (args, input) => execFileSync('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', ...PG, ...args], { input, encoding: 'utf8' });

class Session {
  constructor() {
    this.p = spawn('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=0', ...PG, '-d', DB], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.buf = ''; this.waiters = []; this.n = 0;
    this.p.stdout.on('data', (d) => { this.buf += d; this.flush(); });
    this.p.stderr.on('data', (d) => { this.buf += 'ERR:' + d; this.flush(); });
  }
  flush() {
    for (const w of [...this.waiters]) {
      const i = this.buf.indexOf(w.mark);
      if (i >= 0) { const out = this.buf.slice(0, i).trim(); this.buf = this.buf.slice(i + w.mark.length); this.waiters.splice(this.waiters.indexOf(w), 1); w.resolve(out); }
    }
  }
  run(sql) { // resolves with the output once psql has executed the statement(s)
    const mark = `__done_${++this.n}__`;
    const pr = new Promise((resolve) => this.waiters.push({ mark, resolve }));
    this.p.stdin.write(`${sql}\n\\echo ${mark}\n`);
    return pr;
  }
  close() { this.p.stdin.end('\\q\n'); }
}
const pending = (pr, ms = 400) => Promise.race([pr.then(() => 'resolved'), new Promise((r) => setTimeout(() => r('blocked'), ms))]);
const q = (sql) => psql(['-d', DB], sql).trim();
const asService = (sql) => `set role service_role; ${sql}`;

const skip = !PG && 'set F4_PG to run against a throwaway local Postgres';
let A, B; const X = 'U' + '0'.repeat(30) + 'x1';

before(() => {
  if (!PG) return;
  psql(['-d', 'postgres'], `drop database if exists ${DB}; create database ${DB};`);
  psql(['-d', DB, '-f', path.join(repo, 'supabase/tests/local/f4_auth_stub.sql')]);
  psql(['-d', DB, '-f', path.join(repo, 'supabase/migrations/20261110090000_line_identity_map.sql')]);
});
const fresh = () => {
  q('truncate public.line_identities, public.line_link_pending; delete from auth.users;');
  A = q(`insert into auth.users (email) values ('a@example.invalid') returning id`);
  B = q(`insert into auth.users (email) values ('b@example.invalid') returning id`);
};
const holders = () => q(`select coalesce(string_agg(user_id::text, ','), '') from public.line_identities where line_id = '${X}'`);

test('Codex H2 #2 — concurrent replay of one pending link: consumed once, unlink is final', { skip }, async () => {
  fresh();
  q(asService(`select public.line_link_pending_put('${A}', '${X}', 'n', repeat('a', 64), 300)`));
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(`select result from public.line_link_take('${A}', repeat('a', 64));`), 'ok');
  const s2take = s2.run(asService(`select result from public.line_link_take('${A}', repeat('a', 64));`));
  assert.equal(await pending(s2take), 'blocked', 'second confirm must wait for the first');
  assert.equal(await s1.run(`select public.line_identity_claim('${X}', '${A}', 'link_confirm', 's1'); commit;`), 'ok');
  assert.equal(await s2take, 'missing', 'the replayed confirm finds nothing to consume');
  assert.equal(holders(), A, 'linked exactly once');
  s1.close(); s2.close();
});

test('Codex H2 #2 (strict) — after unlink, a replayed take cannot re-link without a new OAuth pending', { skip }, async () => {
  fresh();
  q(asService(`select public.line_link_pending_put('${A}', '${X}', 'n', repeat('b', 64), 300)`));
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  await s1.run(`select result from public.line_link_take('${A}', repeat('b', 64));`);
  const s2take = s2.run(asService(`select result from public.line_link_take('${A}', repeat('b', 64));`));
  assert.equal(await pending(s2take), 'blocked');
  await s1.run(`select public.line_identity_claim('${X}', '${A}', 'link_confirm', 's1'); commit;`);
  assert.equal(await s2take, 'missing');
  q(asService(`select public.line_identity_release('${A}', 'unlink')`));
  assert.equal(holders(), '', 'nobody holds X after the unlink');
  s1.close(); s2.close();
});

test('Codex H2 #1 — late callback of A after A unlinked and B confirmed: no stale identity comes back', { skip }, async () => {
  fresh();
  q(asService(`select public.line_identity_claim('${X}', '${A}', 'link_confirm', 'setup')`));
  const s1 = new Session(), s2 = new Session();
  // s1 = A's unlink in flight (holds A's and X's locks); s2 = B's confirm of X must wait for it
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(`select public.line_identity_release('${A}', 'unlink');`), 'ok');
  const bClaim = s2.run(asService(`select public.line_identity_claim('${X}', '${B}', 'link_confirm', 'b');`));
  assert.equal(await pending(bClaim), 'blocked', "B's confirm waits for A's unlink");
  await s1.run('commit;');
  assert.equal(await bClaim, 'ok');
  // A's callback (started before the unlink) now finishes: it can only write a pending row, never the mapping
  assert.equal(q(asService(`select public.line_link_pending_put('${A}', '${X}', 'late', repeat('c', 64), 300)`)), 'ok');
  assert.equal(holders(), B, 'X is held by B only');
  assert.equal(q(asService(`select coalesce(public.line_identity_of('${A}'), 'none')`)), 'none');
  // and if A then confirms that late pending link, X is already taken
  q(asService(`select result from public.line_link_take('${A}', repeat('c', 64))`));
  assert.equal(q(asService(`select public.line_identity_claim('${X}', '${A}', 'link_confirm', 'a-late')`)), 'line_taken');
  s1.close(); s2.close();
});

test('two accounts claim the same LINE id at once: exactly one holder', { skip }, async () => {
  fresh();
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(`select public.line_identity_claim('${X}', '${A}', 'link_confirm', 's1');`), 'ok');
  const s2claim = s2.run(asService(`select public.line_identity_claim('${X}', '${B}', 'link_confirm', 's2');`));
  assert.equal(await pending(s2claim), 'blocked');
  await s1.run('commit;');
  assert.equal(await s2claim, 'line_taken');
  assert.equal(holders(), A);
  s1.close(); s2.close();
});

test('confirm in flight vs unlink: the unlink waits and wins (no resurrection)', { skip }, async () => {
  fresh();
  q(asService(`select public.line_link_pending_put('${A}', '${X}', 'n', repeat('d', 64), 300)`));
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  await s1.run(`select result from public.line_link_take('${A}', repeat('d', 64));`);
  const unlink = s2.run(asService(`select public.line_identity_release('${A}', 'unlink');`));
  assert.equal(await pending(unlink), 'blocked', 'unlink waits for the confirm in flight');
  await s1.run(`select public.line_identity_claim('${X}', '${A}', 'link_confirm', 's1'); commit;`);
  assert.equal(await unlink, 'ok');
  assert.equal(holders(), '', 'the later unlink is final');
  s1.close(); s2.close();
});
