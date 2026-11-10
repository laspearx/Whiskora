// F4 — deterministic race tests for the LINE identity migration (20261110090000_line_identity_map.sql, rev. 3).
// Two real psql sessions are driven step by step: session 1 opens a transaction and holds its locks, session 2's call
// is shown to be BLOCKED, then session 1 commits and session 2's result is checked. No timing luck involved.
// Needs a throwaway local Postgres: F4_PG="-h 127.0.0.1 -p 54329 -U postgres" (skipped otherwise). Synthetic data only.
import { test, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PG = process.env.F4_PG ? process.env.F4_PG.split(' ') : null;
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DB = 'f4race';
const psql = (args, input) => execFileSync('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', ...PG, ...args], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

const open = new Set();
class Session {
  constructor() {
    open.add(this);
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
  close() { open.delete(this); this.p.stdin.end('\\q\n'); }
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
afterEach(() => { for (const s of [...open]) { s.p.kill(); open.delete(s); } }); // a failed test never leaves a session open

const fresh = () => {
  q('delete from auth.users;');   // cascades to the mapping, pending links, ops and freezes
  A = q(`insert into auth.users (email) values ('a@example.invalid') returning id`);
  B = q(`insert into auth.users (email) values ('b@example.invalid') returning id`);
};
const holders = () => q(`select coalesce(string_agg(user_id::text, ','), '') from public.line_identities where line_id = '${X}'`);
const put = (u, nonce) => q(asService(`select public.line_link_pending_put('${u}', '${X}', 'n', repeat('${nonce}', 64), 300)`));
const confirmSql = (u, nonce) => `select result from public.line_link_confirm('${u}', repeat('${nonce}', 64), 't');`;
const link = (u, nonce) => { put(u, nonce); return q(asService(confirmSql(u, nonce))); };

test('Codex H2 #2 — concurrent replay of one pending link: consumed once', { skip }, async () => {
  fresh();
  put(A, 'a');
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(confirmSql(A, 'a')), 'ok');
  const s2c = s2.run(asService(confirmSql(A, 'a')));
  assert.equal(await pending(s2c), 'blocked', 'second confirm must wait for the first');
  await s1.run('commit;');
  assert.equal(await s2c, 'missing', 'the replayed confirm finds nothing to consume');
  assert.equal(holders(), A, 'linked exactly once');
  s1.close(); s2.close();
});

test('re-review #2 — confirm in flight, unlink arrives: unlink waits, then wins (no re-link after a successful unlink)', { skip }, async () => {
  fresh();
  put(A, 'd');
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(confirmSql(A, 'd')), 'ok', 'confirm consumed AND mapped in one transaction');
  const unlink = s2.run(asService(`select public.line_identity_release('${A}', 'unlink');`));
  assert.equal(await pending(unlink), 'blocked', 'unlink waits for the confirm in flight');
  await s1.run('commit;');
  assert.equal(await unlink, 'ok');
  assert.equal(holders(), '', 'the later unlink is final');
  s1.close(); s2.close();
});

test('re-review #2 — unlink in flight, older confirm arrives: confirm waits, then finds nothing (unlink is final)', { skip }, async () => {
  fresh();
  link(A, 'e');                     // A holds X
  put(A, 'f');                      // a second (older-tab) pending link for the same LINE id
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(`select public.line_identity_release('${A}', 'unlink');`), 'ok');
  const conf = s2.run(asService(confirmSql(A, 'f')));
  assert.equal(await pending(conf), 'blocked', 'the older confirm waits for the unlink');
  await s1.run('commit;');
  assert.equal(await conf, 'missing', 'unlink deleted the pending link: nothing to re-link');
  assert.equal(holders(), '', 'no identity came back after the successful unlink');
  s1.close(); s2.close();
});

test('Codex H2 #1 — late callback of A after A unlinked and B confirmed: no stale identity comes back', { skip }, async () => {
  fresh();
  link(A, 'a');
  put(B, 'b');
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(`select public.line_identity_release('${A}', 'unlink');`), 'ok');
  const bConf = s2.run(asService(confirmSql(B, 'b')));
  assert.equal(await pending(bConf), 'blocked', "B's confirm waits for A's unlink");
  await s1.run('commit;');
  assert.equal(await bConf, 'ok');
  assert.equal(put(A, 'c'), 'ok', "A's late callback can only write a pending row");
  assert.equal(holders(), B, 'X is held by B only');
  assert.equal(q(asService(confirmSql(A, 'c'))), 'line_taken');
  s1.close(); s2.close();
});

test('two accounts confirm the same LINE id at once: exactly one holder', { skip }, async () => {
  fresh();
  put(A, '1'); put(B, '2');
  const s1 = new Session(), s2 = new Session();
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(confirmSql(A, '1')), 'ok');
  const s2c = s2.run(asService(confirmSql(B, '2')));
  assert.equal(await pending(s2c), 'blocked');
  await s1.run('commit;');
  assert.equal(await s2c, 'line_taken');
  assert.equal(holders(), A);
  s1.close(); s2.close();
});

// ── re-review #3: Auth requests admitted before the rotation, writing concurrently with it ─────────────────────────
// Session "gotrue-attacker" = the transaction of a GoTrue UserUpdate whose session check passed before the rotation;
// session "gotrue-admin" = the app's rotation (GoTrue admin update). Both are real concurrent transactions.
const SECRET = 'rotation-secret-0123456789abcdef0123456789abcdef';
const legacyOp = (nonce) => {
  fresh();
  const L = q(`insert into auth.users (email, encrypted_password, created_at)
     values (public.f4_placeholder('${X}'), extensions.crypt('planted', extensions.gen_salt('bf', 4)), now() - interval '90 days') returning id`);
  q(`insert into auth.identities (user_id, provider) values ('${L}', 'email')`);
  put(L, nonce);
  const [res, ref, tok] = q(asService(`select result || '|' || ref || '|' || token from public.line_link_confirm('${L}', repeat('${nonce}', 64), 'self')`)).split('|');
  assert.equal(res, 'legacy');
  return { L, ref, tok };
};
const rotateSql = (L, pw) => `update auth.users set encrypted_password = extensions.crypt('${pw}', extensions.gen_salt('bf', 4)) where id = '${L}'; delete from auth.sessions where user_id = '${L}';`;

test('re-review #3 — attacker write in flight, app rotation concurrent: attacker first → app rotation refused → abort, no mapping', { skip }, async () => {
  const { L, ref, tok } = legacyOp('3');
  const s1 = new Session(), s2 = new Session();
  await s1.run('begin;');
  await s1.run(`update auth.users set encrypted_password = extensions.crypt('attacker', extensions.gen_salt('bf', 4)) where id = '${L}';`);
  const appRotation = s2.run(rotateSql(L, SECRET));
  assert.equal(await pending(appRotation), 'blocked', 'the app rotation waits for the in-flight write');
  await s1.run('commit;');
  assert.match(await appRotation, /frozen/, 'the app rotation is refused: only one credential change per op');
  assert.equal(q(asService(`select public.line_op_mark_reset('${ref}', '${tok}', 'self', '${SECRET}')`)), 'rotation_not_verified');
  assert.equal(q(asService(`select public.line_op_abort('${ref}', '${tok}', 'self', 'rotation refused')`)), 'ok');
  assert.equal(holders(), '', 'nothing mapped');
  s1.close(); s2.close();
});

test('re-review #3 — app rotation first, attacker write lands after it (before verification): refused', { skip }, async () => {
  const { L, ref, tok } = legacyOp('4');
  const s1 = new Session(), s2 = new Session();
  await s1.run('begin;');
  await s1.run(rotateSql(L, SECRET));
  const attacker = s2.run(`update auth.users set encrypted_password = extensions.crypt('attacker', extensions.gen_salt('bf', 4)) where id = '${L}';`);
  assert.equal(await pending(attacker), 'blocked', 'the in-flight write waits for the rotation');
  await s1.run('commit;');
  assert.match(await attacker, /frozen/, 'the in-flight password change is refused');
  assert.equal(q(asService(`select public.line_op_mark_reset('${ref}', '${tok}', 'self', '${SECRET}')`)), 'ok');
  assert.equal(q(asService(`select public.line_op_commit('${ref}', '${tok}', 'self')`)), 'ok');
  assert.equal(holders(), L);
  s1.close(); s2.close();
});

test('re-review #3 — after verification / commit: in-flight password, email change, password sign-in and OAuth link all refused', { skip }, async () => {
  const { L, ref, tok } = legacyOp('5');
  q(rotateSql(L, SECRET));
  assert.equal(q(asService(`select public.line_op_mark_reset('${ref}', '${tok}', 'self', '${SECRET}')`)), 'ok');
  const s1 = new Session(), s2 = new Session();
  // commit in flight (holds the freeze row) while an in-flight GoTrue transaction tries to change the email
  await s1.run(asService('begin;'));
  assert.equal(await s1.run(`select public.line_op_commit('${ref}', '${tok}', 'self');`), 'ok');
  const email = s2.run(`update auth.users set email_change = 'evil@example.invalid' where id = '${L}';`);
  assert.equal(await pending(email), 'blocked', 'the in-flight email change waits for the commit');
  await s1.run('commit;');
  assert.match(await email, /frozen/, 'and is refused after it (grace period)');
  for (const sql of [
    `update auth.users set encrypted_password = 'x' where id = '${L}'`,
    `update auth.users set email_change = 'evil@example.invalid' where id = '${L}'`,
    `with s as (insert into auth.sessions (user_id) values ('${L}') returning id) insert into auth.mfa_amr_claims (session_id, authentication_method) select id, 'password' from s`,
    `insert into auth.identities (user_id, provider) values ('${L}', 'google')`,
  ]) assert.throws(() => q(sql), /frozen|refused/, sql);
  assert.equal(q(`select coalesce(email_change, '') from auth.users where id = '${L}'`), '', 'no pending email change was written');
  assert.equal(holders(), L);
  s1.close(); s2.close();
});
