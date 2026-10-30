// whiskora-staging only (refuses other URLs; ~/.whiskora/staging_db_url). Needs the `pg` package: e.g. NODE_PATH=<dir with pg> node … [timed|stress]
// Each scenario: fixture → session A runs its RPC then holds the transaction open (pg_sleep) → session B starts while A
// holds its locks → both commit → final state checked. Run in both orders. Also a stress mode with near-simultaneous starts.
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const U = { owner: 'a0000000-0000-4000-8000-000000000001', manager: 'a0000000-0000-4000-8000-000000000002', buyer: 'a0000000-0000-4000-8000-000000000005', stranger: 'a0000000-0000-4000-8000-000000000006' };
const P = 900004;
const conn = async () => { const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect(); return c; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fixture(admin, withOther) {
  await admin.query(`delete from pet_ownership_transfers where pet_id=$1; delete from pet_reservations where pet_id=$1;`.replace(/\$1/g, P));
  await admin.query(`update pets set user_id='${U.owner}', farm_id=9001, status='ติดจอง', is_public=true where id=${P}`);
  const r = await admin.query(`insert into pet_reservations (pet_id, buyer_id, status, confirmed_at) values (${P}, '${U.buyer}', 'confirmed', now()) returning id`);
  const resA = r.rows[0].id;
  let resB = null;
  if (withOther) resB = (await admin.query(`insert into pet_reservations (pet_id, buyer_id, status) values (${P}, '${U.stranger}', 'pending') returning id`)).rows[0].id;
  const t = (await admin.query(`insert into pet_ownership_transfers (pet_id, from_user_id, to_user_id, initiated_by, status, reservation_id) values (${P}, '${U.owner}', '${U.buyer}', '${U.owner}', 'pending', ${resA}) returning id`)).rows[0].id;
  return { resA, resB, t };
}
async function asUser(c, uid, sql, holdMs) {
  const t0 = Date.now();
  try {
    await c.query('begin');
    await c.query(`set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true)`);
    await c.query(sql);
    if (holdMs) await c.query(`select pg_sleep(${holdMs / 1000})`);
    await c.query('commit');
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) { await c.query('rollback').catch(() => {}); return { ok: false, code: e.code, msg: e.message.slice(0, 60), ms: Date.now() - t0 }; }
}
async function state(admin, ids) {
  const p = (await admin.query(`select user_id, farm_id, status from pets where id=${P}`)).rows[0];
  const ra = (await admin.query(`select status from pet_reservations where id=${ids.resA}`)).rows[0].status;
  const rb = ids.resB ? (await admin.query(`select status from pet_reservations where id=${ids.resB}`)).rows[0].status : null;
  const t = (await admin.query(`select status from pet_ownership_transfers where id=${ids.t}`)).rows[0].status;
  return { owner: p.user_id === U.buyer ? 'buyer' : p.user_id === U.owner ? 'farm-owner' : p.user_id, farm: p.farm_id, pet_status: p.status, resA: ra, resB: rb, transfer: t };
}
// consistency rules
function consistent(s) {
  const moved = s.owner === 'buyer';
  if (moved) return s.transfer === 'accepted' && s.resA === 'converted' && s.farm === null && s.pet_status === null && (s.resB === null || s.resB === 'cancelled');
  return s.owner === 'farm-owner' && String(s.farm) === '9001' && s.transfer !== 'accepted' && s.resA !== 'converted'
    && ((s.resA === 'confirmed' && s.pet_status === 'ติดจอง') || (s.resA === 'cancelled' && s.transfer === 'cancelled' && s.pet_status === 'เปิดจอง') || (s.resA === 'confirmed' && s.transfer === 'cancelled'));
}
const ACCEPT = ids => [U.buyer, `select * from respond_pet_transfer(${ids.t}, 'accept')`];
const SCEN = {
  'accept vs cancel the confirmed reservation': { other: false, x: ACCEPT, y: ids => [U.manager, `select * from farm_set_reservation_status(${ids.resA}, 'cancelled')`] },
  'accept vs cancel the transfer':              { other: false, x: ACCEPT, y: ids => [U.owner, `select * from respond_pet_transfer(${ids.t}, 'cancel')`] },
  'accept vs confirm another reservation':      { other: true,  x: ACCEPT, y: ids => [U.owner, `select * from farm_set_reservation_status(${ids.resB}, 'confirmed')`] },
};
(async () => {
  const mode = process.argv[2] || 'timed';
  const admin = await conn(); const A = await conn(); const B = await conn();
  let bad = 0, deadlocks = 0, runs = 0;
  for (const [name, sc] of Object.entries(SCEN)) {
    const orders = mode === 'timed' ? [['x', 'y'], ['y', 'x']] : Array.from({ length: 15 }, (_, i) => i % 2 ? ['x', 'y'] : ['y', 'x']);
    for (const [first, second] of orders) {
      const ids = await fixture(admin, sc.other);
      const [u1, q1] = sc[first](ids), [u2, q2] = sc[second](ids);
      const hold = mode === 'timed' ? 1500 : 0;
      const pa = asUser(A, u1, q1, hold);
      await sleep(mode === 'timed' ? 300 : Math.floor(Math.random() * 3));
      const pb = asUser(B, u2, q2, 0);
      const [ra, rb] = await Promise.all([pa, pb]);
      const s = await state(admin, ids); runs++;
      const dl = [ra, rb].some(r => r.code === '40P01'); if (dl) deadlocks++;
      const ok = consistent(s) && !dl; if (!ok) bad++;
      if (mode === 'timed' || !ok) console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | first=${first === 'x' ? 'accept' : 'other'} | A:${ra.ok ? 'ok' : ra.code + ' ' + ra.msg} (${ra.ms}ms) | B:${rb.ok ? 'ok' : rb.code + ' ' + rb.msg} (${rb.ms}ms) | ${JSON.stringify(s)}`);
    }
  }
  console.log(`${mode}: runs=${runs} inconsistent_or_deadlock=${bad} deadlocks=${deadlocks}`);
  await admin.end(); await A.end(); await B.end();
})().catch(e => { console.error('ERROR', e.message); process.exit(2); });
