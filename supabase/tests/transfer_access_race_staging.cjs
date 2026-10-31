// whiskora-staging only (refuses other URLs; ~/.whiskora/staging_db_url). Needs `pg` (NODE_PATH=<dir with pg>).
// Accept of an ownership transfer vs. the old owner adding access at the same moment, plus rollback of an accept.
// Pet T4 900014 (private, owner 01, co-owner 08) is reset before every scenario. Prints statuses/counts only.
// usage: node transfer_access_race_staging.cjs [stress]
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const U = { owner: 'a0000000-0000-4000-8000-000000000001', buyer: 'a0000000-0000-4000-8000-000000000005', stranger: 'a0000000-0000-4000-8000-000000000006', viewer: 'a0000000-0000-4000-8000-000000000004', coowner: 'a0000000-0000-4000-8000-000000000008' };
const P = 900014;
const conn = async () => { const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect(); return c; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0, deadlocks = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };

async function reset(admin) {
  await admin.query(`delete from pet_ownership_transfers where pet_id = ${P}; delete from pet_co_owners where pet_id = ${P};
    delete from access_grants where resource_id = ${P}; delete from pet_visibility_settings where pet_id = ${P};
    update pets set user_id = '${U.owner}', farm_id = null, status = 'ไม่ขาย', is_public = false where id = ${P};
    insert into pet_co_owners (pet_id, user_id, added_by) values (${P}, '${U.coowner}', '${U.owner}');
    insert into access_grants (granted_by, grantee_id, resource_type, resource_id, field_group_key, relationship_tag)
      values ('${U.owner}', '${U.stranger}', 'pet', ${P}, 'vaccination', 'custom');
    insert into pet_visibility_settings (pet_id, field_group_key, tier, include_previous_owner) values (${P}, 'weight', 'public', true);`);
  return (await admin.query(`insert into pet_ownership_transfers (pet_id, from_user_id, to_user_id, initiated_by, status)
    values (${P}, '${U.owner}', '${U.buyer}', '${U.owner}', 'pending') returning id`)).rows[0].id;
}
async function state(admin, t) {
  const q = async s => (await admin.query(s)).rows[0];
  return {
    owner: (await q(`select user_id from pets where id = ${P}`)).user_id === U.buyer ? 'buyer' : 'old',
    transfer: (await q(`select status from pet_ownership_transfers where id = ${t}`)).status,
    co_owners: Number((await q(`select count(*) c from pet_co_owners where pet_id = ${P}`)).c),
    active_grants: Number((await q(`select count(*) c from access_grants where resource_id = ${P} and revoked_at is null`)).c),
    weight_tier: (await q(`select tier || case when include_previous_owner then '+prev' else '' end t from pet_visibility_settings where pet_id = ${P} and field_group_key = 'weight'`))?.t,
    history: Number((await q(`select count(*) c from pet_transfer_access_revocations where transfer_id = ${t}`)).c),
  };
}
async function asUser(c, uid, sql, holdMs = 0, failAfter = false) {
  const t0 = Date.now();
  try {
    await c.query('begin');
    await c.query(`set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true)`);
    await c.query(sql);
    if (holdMs) await c.query(`select pg_sleep(${holdMs / 1000})`);
    if (failAfter) await c.query('select 1/0');
    await c.query('commit');
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    await c.query('rollback').catch(() => {});
    if (e.code === '40P01') deadlocks++;
    return { ok: false, code: e.code, ms: Date.now() - t0 };
  }
}
const ACCEPT = t => `select * from respond_pet_transfer(${t}, 'accept')`;
const ADD = {
  co_owner: `insert into pet_co_owners (pet_id, user_id, added_by) values (${P}, '${U.viewer}', '${U.owner}')`,
  grant: `insert into access_grants (granted_by, grantee_id, resource_type, resource_id, field_group_key, relationship_tag) values ('${U.owner}', '${U.viewer}', 'pet', ${P}, 'health', 'custom')`,
  setting: `insert into pet_visibility_settings (pet_id, field_group_key, tier, include_previous_owner) values (${P}, 'weight', 'public', true) on conflict (pet_id, field_group_key) do update set tier = 'public', include_previous_owner = true`,
};
const clean = s => s.owner === 'buyer' && s.transfer === 'accepted' && s.co_owners === 0 && s.active_grants === 0 && s.weight_tier === 'owner';

(async () => {
  const admin = await conn(), a = await conn(), b = await conn();
  const stress = process.argv.includes('stress');
  if (!stress) {
    // rollback: the accept runs, then the transaction fails / is rolled back → nothing changed, no history
    for (const [name, failAfter] of [['explicit error after accept', true]]) {
      const t = await reset(admin);
      const r = await asUser(a, U.buyer, ACCEPT(t), 0, failAfter);
      const s = await state(admin, t);
      ok(`rollback (${name}): owner, co-owner, grant, tier, transfer, history unchanged`, !r.ok && s.owner === 'old' && s.transfer === 'pending' && s.co_owners === 1 && s.active_grants === 1 && s.weight_tier === 'public+prev' && s.history === 0, { r: r.code, s });
    }
    {
      const t = await reset(admin);
      await a.query('begin'); await a.query(`set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${U.buyer}","role":"authenticated"}', true)`);
      await a.query(ACCEPT(t));
      const inside = (await a.query(`select (select count(*) from pet_co_owners where pet_id = ${P}) co`)).rows[0];
      await a.query('rollback');
      const s = await state(admin, t);
      ok('rollback (ROLLBACK after accept): inside the tx co-owners were 0; after rollback everything is back', Number(inside.co) === 0 && s.owner === 'old' && s.co_owners === 1 && s.active_grants === 1 && s.weight_tier === 'public+prev' && s.history === 0, { s });
    }
    // races: old owner adds access while the receiver accepts, both orders
    for (const kind of Object.keys(ADD)) {
      for (const order of ['add-first', 'accept-first']) {
        const t = await reset(admin);
        let ra, rb;
        if (order === 'add-first') {
          const pa = asUser(a, U.owner, ADD[kind], 1500); await sleep(300);
          const pb = asUser(b, U.buyer, ACCEPT(t)); [ra, rb] = await Promise.all([pa, pb]);
        } else {
          const pb = asUser(b, U.buyer, ACCEPT(t), 1500); await sleep(300);
          const pa = asUser(a, U.owner, ADD[kind]); [rb, ra] = await Promise.all([pb, pa]);
        }
        const s = await state(admin, t);
        ok(`race ${kind} / ${order}: accept wins, nothing left over`, rb.ok && clean(s), { add: ra.ok ? `ok ${ra.ms}ms` : `${ra.code} ${ra.ms}ms`, accept: rb.ok ? `ok ${rb.ms}ms` : `${rb.code}`, s });
      }
    }
    // double accept from two sessions
    {
      const t = await reset(admin);
      const [x, y] = await Promise.all([asUser(a, U.buyer, ACCEPT(t), 800), (async () => { await sleep(200); return asUser(b, U.buyer, ACCEPT(t)); })()]);
      const s = await state(admin, t);
      ok('double accept in two sessions: both succeed, one change, history once', x.ok && y.ok && clean(s) && s.history === 3, { s });
    }
  } else {
    // stress: near-simultaneous starts, random order
    let runs = 0, dirty = 0, acceptFailed = 0;
    for (let i = 0; i < 45; i++) {
      const kind = Object.keys(ADD)[i % 3];
      const t = await reset(admin);
      const first = Math.random() < 0.5;
      const pa = (async () => { if (!first) await sleep(Math.random() * 15); return asUser(a, U.owner, ADD[kind]); })();
      const pb = (async () => { if (first) await sleep(Math.random() * 15); return asUser(b, U.buyer, ACCEPT(t)); })();
      const [, rb] = await Promise.all([pa, pb]);
      const s = await state(admin, t); runs++;
      if (!rb.ok) acceptFailed++; else if (!clean(s)) { dirty++; console.log('dirty', kind, JSON.stringify(s)); }
    }
    ok(`stress ${runs} runs: accepts ok, 0 left-over access`, dirty === 0 && acceptFailed === 0, { runs, dirty, acceptFailed });
  }
  ok('no deadlocks (40P01)', deadlocks === 0, { deadlocks });
  await reset(admin); await admin.query(`delete from pet_ownership_transfers where pet_id = ${P}`);
  await Promise.all([admin.end(), a.end(), b.end()]);
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch(e => { console.log('ERROR', e.message); process.exitCode = 2; });
