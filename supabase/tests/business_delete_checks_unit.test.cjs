// Offline test of business_delete_checks.cjs exit handling — no database, no network, no DELETE.
// usage: node --test supabase/tests/business_delete_checks_unit.test.cjs
const test = require('node:test'); const assert = require('node:assert'); const Module = require('module');
const path = require('path'); const os = require('os'); const fs = require('fs'); const { spawnSync } = require('child_process');
const FILE = path.join(__dirname, 'business_delete_checks.cjs');

// Loading the suite must not open pg, read credentials or call fetch.
const loaded = []; const origLoad = Module._load; const origRead = fs.readFileSync; const origFetch = global.fetch; const reads = [];
Module._load = function (req, ...rest) { loaded.push(req); return origLoad.call(this, req, ...rest); };
fs.readFileSync = function (p, ...rest) { reads.push(String(p)); return origRead.call(this, p, ...rest); };
global.fetch = () => { throw new Error('network used'); };
const { verdict, runSuite, EXPECTED } = require(FILE);
Module._load = origLoad; fs.readFileSync = origRead; global.fetch = origFetch;

test('loading the suite opens no pg client and reads no credential file', () => {
  assert.ok(!loaded.includes('pg'), 'pg required at load');
  assert.ok(!reads.some((p) => p.includes('.whiskora')), 'credential read at load');
});

const suite = (passTo, failTo, { bodyThrows, cleanupRecords, cleanupThrows } = {}) => {
  let pass = 0, fail = 0, cleaned = false;
  return {
    run: () => runSuite({
      expected: EXPECTED, counts: () => ({ pass, fail }),
      body: async () => { pass = passTo; fail = failTo; if (bodyThrows) throw new Error('simulated'); },
      cleanup: async (errors) => { cleaned = true; if (cleanupRecords) errors.push('STOP shop 1'); if (cleanupThrows) throw new Error('cleanup simulated'); },
    }),
    cleaned: () => cleaned,
  };
};

test('all expected checks pass, clean cleanup → 0', async () => {
  const s = suite(EXPECTED, 0); const v = await s.run();
  assert.equal(v.code, 0); assert.deepEqual(v.reasons, []); assert.ok(s.cleaned());
});
test('exception in the body after some checks → 1, cleanup still runs', async () => {
  const s = suite(5, 0, { bodyThrows: true }); const v = await s.run();
  assert.equal(v.code, 1); assert.ok(s.cleaned()); assert.ok(v.reasons.some((r) => r.includes('unexpected exception: simulated')));
});
test('exception after every check passed → still 1', async () => {
  const v = await suite(EXPECTED, 0, { bodyThrows: true }).run();
  assert.equal(v.code, 1); assert.ok(v.reasons[0].startsWith('unexpected exception'));
});
test('cleanup records a STOP → 1', async () => {
  const v = await suite(EXPECTED, 0, { cleanupRecords: true }).run();
  assert.equal(v.code, 1); assert.ok(v.reasons.includes('cleanup: STOP shop 1'));
});
test('cleanup throws → 1 (recorded, not lost)', async () => {
  const v = await suite(EXPECTED, 0, { cleanupThrows: true }).run();
  assert.equal(v.code, 1); assert.ok(v.reasons.includes('cleanup: cleanup simulated'));
});
test('body and cleanup both fail → both reported', async () => {
  const v = await suite(3, 0, { bodyThrows: true, cleanupThrows: true }).run();
  assert.equal(v.code, 1); assert.ok(v.reasons.some((r) => r.startsWith('unexpected')) && v.reasons.some((r) => r.startsWith('cleanup')));
});
test('fewer checks than expected with 0 FAIL → 1', async () => {
  const v = await suite(EXPECTED - 1, 0).run(); assert.equal(v.code, 1); assert.ok(v.reasons.includes(`${EXPECTED - 1} of ${EXPECTED} expected checks passed`));
});
test('more passes than expected → 1 (count drift is visible)', async () => {
  assert.equal(verdict({ pass: EXPECTED + 1, fail: 0, expected: EXPECTED, error: null, cleanupErrors: [] }).code, 1);
});
test('one FAIL → 1', async () => { assert.equal((await suite(EXPECTED - 1, 1).run()).code, 1); });
test('EXPECTED = 23 (A 2 + B 3 + C 3 + D 5 + E 9 + F 1; staging run 2026-11-02 passed 23)', () => { assert.equal(EXPECTED, 23); });

test('script without credentials exits non-zero before any pg / network use', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-unit-'));
  const r = spawnSync(process.execPath, [FILE], { env: { PATH: process.env.PATH, HOME: home }, encoding: 'utf8', timeout: 20000 });
  fs.rmSync(home, { recursive: true, force: true });
  assert.notEqual(r.status, 0); assert.ok(/ENOENT|staging_db_url/.test(r.stderr), r.stderr);
});
