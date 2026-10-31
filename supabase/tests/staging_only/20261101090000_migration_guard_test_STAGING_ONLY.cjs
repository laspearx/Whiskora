// usage: NODE_PATH=<dir with pg> node supabase/tests/staging_only/20261101090000_migration_guard_test_STAGING_ONLY.cjs  (whiskora-staging only)
// staging only: 20261101090000 must STOP (P0001, counts only) on un-back-fillable rows and on key collisions, leaving
// rows and schema exactly as before; and must succeed + back-fill on good data.
const { Client } = require('pg'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim(); if (!url.includes('wpxcukrwmegwzfccbbga')) process.exit(2);
const R = '/workspaces/Whiskora/supabase/';
const MIG = fs.readFileSync(R + 'migrations/20261101090000_vaccine_reminder_delivery_history.sql', 'utf8');
const DOWN = fs.readFileSync(R + 'tests/staging_only/20261101090000_vaccine_reminder_delivery_history_down_STAGING_ONLY.sql', 'utf8');
let pass = 0, fail = 0; const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const OWNER = 'a0000000-0000-4000-8000-000000000001';
(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect();
  const q = async (s, p = []) => (await c.query(s, p)).rows;
  const shape = async () => (await q(`select
      (select count(*)::int from vaccine_reminder_deliveries) n_rows,
      (select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_schema='public' and table_name='vaccine_reminder_deliveries') cols,
      (select pg_get_constraintdef(oid) from pg_constraint where conname='vaccine_reminder_deliveries_once') once_key,
      (select is_nullable from information_schema.columns where table_schema='public' and table_name='vaccine_reminder_deliveries' and column_name='subscription_id') sub_nullable`))[0];
  const tryMig = async () => { await q('savepoint m'); try { await c.query(MIG); await q('release savepoint m'); return { ok: true }; } catch (e) { await q('rollback to savepoint m'); return { ok: false, code: e.code, msg: e.message }; } };

  // old shape (persisted), plus the synthetic pet/vaccine used below
  await q('begin'); await c.query(DOWN); await q('commit');
  await q(`insert into pets (id, name, species, user_id, status, is_public) values (900026, 'QA-VR migration guard', 'cat', $1, 'ไม่ขาย', false) on conflict (id) do nothing`, [OWNER]);
  await q(`insert into vaccines (id, pet_id, vaccine_name, next_due) values (9900031, 900026, 'QA-VR guard', current_date) on conflict (id) do nothing`);
  const oldShape = await shape();
  ok('staging back on the old shape for the test', !oldShape.cols.includes('endpoint_hash') && oldShape.sub_nullable === 'NO', oldShape);

  // ---- A. a row that cannot be back-filled (synthetic: FK relaxed inside the test transaction) ----
  await q('begin');
  const goodSub = (await q(`insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://example.invalid/push/QA-GUARD-good', 'x', 'y') returning id`, [OWNER]))[0].id;
  await q(`insert into vaccine_reminder_deliveries (subscription_id, vaccine_id, next_due, reminder_date, status) values ($1, 9900031, current_date, current_date, 'sent')`, [goodSub]);
  await q(`alter table vaccine_reminder_deliveries drop constraint vaccine_reminder_deliveries_subscription_id_fkey`);
  await q(`insert into vaccine_reminder_deliveries (subscription_id, vaccine_id, next_due, reminder_date, status) values ($1, 9900031, current_date - 1, current_date - 1, 'sent')`, [crypto.randomUUID()]);
  const beforeA = await shape();
  const ra = await tryMig();
  const afterA = await shape();
  ok('A. un-back-fillable row → migration stops with P0001 and a count only', !ra.ok && ra.code === 'P0001' && /1 row\(s\) could not be back-filled/.test(ra.msg) && !/example\.invalid|[0-9a-f]{8}-[0-9a-f]{4}/.test(ra.msg), { code: ra.code, msg: ra.msg });
  ok('A. after the stop: same rows (2), no new columns, old unique key — nothing half-applied', JSON.stringify(afterA) === JSON.stringify(beforeA) && afterA.n_rows === 2 && !afterA.cols.includes('user_id'), afterA);
  await q('rollback');

  // ---- B. rows that would collide on the new key (synthetic: two subscriptions, same user, same endpoint) ----
  await q('begin');
  await q(`alter table push_subscriptions drop constraint push_subscriptions_endpoint_key`);
  const s1 = (await q(`insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://example.invalid/push/QA-GUARD-dup', 'x', 'y') returning id`, [OWNER]))[0].id;
  const s2 = (await q(`insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://example.invalid/push/QA-GUARD-dup', 'x', 'y') returning id`, [OWNER]))[0].id;
  for (const sid of [s1, s2]) await q(`insert into vaccine_reminder_deliveries (subscription_id, vaccine_id, next_due, reminder_date, status) values ($1, 9900031, current_date, current_date, 'sent')`, [sid]);
  const beforeB = await shape();
  const rb = await tryMig();
  const afterB = await shape();
  ok('B. key collision → migration stops with P0001 and a count only', !rb.ok && rb.code === 'P0001' && /1 key group\(s\) would collide/.test(rb.msg) && !/example\.invalid/.test(rb.msg), { code: rb.code, msg: rb.msg });
  ok('B. after the stop: same rows (2), no new columns — nothing half-applied', JSON.stringify(afterB) === JSON.stringify(beforeB) && afterB.n_rows === 2 && !afterB.cols.includes('endpoint_hash'), afterB);
  await q('rollback');
  const afterTests = await shape();
  ok('test transactions rolled back: staging rows / constraints as before A and B', JSON.stringify(afterTests) === JSON.stringify(oldShape) &&
     (await q(`select count(*)::int c from pg_constraint where conname in ('push_subscriptions_endpoint_key', 'vaccine_reminder_deliveries_subscription_id_fkey')`))[0].c === 2, afterTests);

  // ---- C. good data → applies and back-fills (persisted; staging ends on the new shape) ----
  const ep = 'https://example.invalid/push/QA-GUARD-ok';
  const sc = (await q(`insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, 'x', 'y') returning id`, [OWNER, ep]))[0].id;
  await q(`insert into vaccine_reminder_deliveries (subscription_id, vaccine_id, next_due, reminder_date, status, sent_at) values ($1, 9900031, current_date, current_date, 'sent', now())`, [sc]);
  await q('begin'); let rc; try { await c.query(MIG); await q('commit'); rc = { ok: true }; } catch (e) { await q('rollback'); rc = { ok: false, code: e.code, msg: e.message }; }
  const row = (await q(`select user_id::text u, endpoint_hash h, subscription_id::text s, status from vaccine_reminder_deliveries where vaccine_id = 9900031`))[0];
  ok('C. good data → migration applies; row back-filled (user, hash = function hash), subscription + status kept', rc.ok && row?.u === OWNER && row?.h === crypto.createHash('sha256').update(ep).digest('hex') && row?.s === sc && row?.status === 'sent', { rc, row: row && { ...row, u: row.u === OWNER, h: row.h?.length } });
  await q(`delete from push_subscriptions where id = $1`, [sc]);
  ok('C. after apply, deleting the subscription keeps the history row', (await q(`select subscription_id is null n from vaccine_reminder_deliveries where vaccine_id = 9900031`))[0]?.n === true);
  await q(`delete from vaccines where id = 9900031`); await q(`delete from pets where id = 900026`);
  const fin = await shape();
  ok('staging ends on the new shape, synthetic rows removed', fin.cols.includes('endpoint_hash') && fin.sub_nullable === 'YES' && fin.n_rows === 0 && fin.once_key === 'UNIQUE (user_id, endpoint_hash, vaccine_id, next_due)', fin);
  await c.end(); console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch(async (e) => { console.log('ERROR', e.message); process.exitCode = 2; });
