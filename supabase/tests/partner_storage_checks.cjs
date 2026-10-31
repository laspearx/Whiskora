// Business image buckets (20261101130000) through the real Storage API on whiskora-staging, synthetic files only
// (names `qa-sp-…` inside the synthetic farm 9001 / shop 990101 / service 990101 folders and QA user folders).
// Runs on the before and the after schema. Prints PASS/FAIL with statuses only.
// usage: fixtures transfer_access_reset_fixture_staging.sql + workspace_guard_fixture_staging.sql, then
//        NODE_PATH=<dir with pg> STAGING_ANON_KEY=<staging anon key> node supabase/tests/partner_storage_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const ID = { owner: 'a0000000-0000-4000-8000-000000000001', manager: 'a0000000-0000-4000-8000-000000000002', staff: 'a0000000-0000-4000-8000-000000000003', stranger: 'a0000000-0000-4000-8000-000000000006' };
const FARM = 9001, SHOP = 990101, SERVICE = 990101;
const T = Date.now();
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const toks = {};
async function tok(who) {
  if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${who}@example.com`, password: PW }) })).json();
  return (toks[who] = d.access_token);
}
async function upload(who, bucket, path, upsert = false, body = JPEG) {
  const r = await fetch(`${SB}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${await tok(who)}`, 'Content-Type': 'image/jpeg', 'x-upsert': String(upsert) }, body });
  return r.status;
}
async function remove(who, bucket, path) {
  const r = await fetch(`${SB}/storage/v1/object/${bucket}`, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${await tok(who)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [path] }) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, deleted: Array.isArray(b) ? b.length : 0 };
}
const ok2xx = (s) => s >= 200 && s < 300;

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const scoped = (await q(`select to_regprocedure('public.can_edit_business_assets(text,text)') is not null a`))[0].a;
  console.log(`schema: ${scoped ? 'AFTER (scoped)' : 'BEFORE'}\n`);
  const obj = async (bucket, path) => (await q(`select coalesce(metadata->>'size','?') size, updated_at from storage.objects where bucket_id = $1 and name = $2`, [bucket, path]))[0] ?? null;

  // ---- farm-assets ----
  const fOwner = `${FARM}/qa-sp-owner-${T}.jpg`;
  ok('F1 farm owner uploads to own farm folder', ok2xx(await upload('owner', 'farm-assets', fOwner)));
  ok('F2 farm manager uploads to the farm folder', ok2xx(await upload('manager', 'farm-assets', `${FARM}/qa-sp-manager-${T}.jpg`)));
  { const s = await upload('staff', 'farm-assets', `${FARM}/qa-sp-staff-${T}.jpg`); ok('F3 farm staff cannot upload farm images', !ok2xx(s), { status: s }); }
  { const s = await upload('stranger', 'farm-assets', `${FARM}/qa-sp-stranger-${T}.jpg`); ok('F4 stranger cannot upload into another farm\'s folder', !ok2xx(s), { status: s }); }
  { const before = await obj('farm-assets', fOwner);
    const s = await upload('stranger', 'farm-assets', fOwner, true, Buffer.concat([JPEG, Buffer.alloc(64)]));
    const after = await obj('farm-assets', fOwner);
    ok('F5 stranger cannot overwrite the owner\'s farm image (upsert)', !ok2xx(s) && JSON.stringify(before) === JSON.stringify(after), { status: s, unchanged: JSON.stringify(before) === JSON.stringify(after) }); }
  { const s = await upload('owner', 'farm-assets', `abc/qa-sp-${T}.jpg`); ok('F6 non-numeric first folder refused', !ok2xx(s), { status: s }); }
  { const r = await fetch(`${SB}/storage/v1/object/public/farm-assets/${fOwner}`); ok('F7 public read of farm images unchanged', r.status === 200, { status: r.status }); }

  // ---- shop-assets / service-assets ----
  for (const [bucket, id, label] of [['shop-assets', SHOP, 'shop'], ['service-assets', SERVICE, 'service']]) {
    const own = `${id}/qa-sp-owner-${T}.jpg`;
    ok(`${label} 1 owner uploads to own ${label} folder`, ok2xx(await upload('owner', bucket, own)));
    { const s = await upload('stranger', bucket, `${id}/qa-sp-stranger-${T}.jpg`); ok(`${label} 2 stranger cannot upload into another ${label}'s folder`, !ok2xx(s), { status: s }); }
    { const before = await obj(bucket, own); const s = await upload('stranger', bucket, own, true, Buffer.concat([JPEG, Buffer.alloc(64)])); const after = await obj(bucket, own);
      ok(`${label} 3 stranger cannot overwrite the owner's image`, !ok2xx(s) && JSON.stringify(before) === JSON.stringify(after), { status: s }); }
    { const r = await remove('stranger', bucket, own); const still = await obj(bucket, own);
      ok(`${label} 4 stranger cannot delete the owner's image`, still !== null && r.deleted === 0, { status: r.status, deleted: r.deleted }); }
    { const r = await remove('owner', bucket, own); ok(`${label} 5 owner deletes own image`, (await obj(bucket, own)) === null && r.deleted === 1, r); }
  }

  // ---- partner-photos (register pages: farms|shops|services/<uid>/…) ----
  const regPath = `shops/${ID.owner}/qa-sp-logo-${T}.jpg`;
  { const s = await upload('owner', 'partner-photos', regPath); ok('P1 register-page path shops/<own uid>/… can be uploaded', ok2xx(s), { status: s }); }
  { const s = await upload('stranger', 'partner-photos', `shops/${ID.owner}/qa-sp-x-${T}.jpg`); ok('P2 stranger cannot upload into another user\'s register folder', !ok2xx(s), { status: s }); }
  { const s = await upload('owner', 'partner-photos', `${ID.owner}/qa-sp-root-${T}.jpg`); ok('P3 root <own uid>/… still allowed', ok2xx(s), { status: s }); }
  { const r = await remove('stranger', 'partner-photos', regPath); ok('P4 stranger cannot delete another user\'s partner photo', (await obj('partner-photos', regPath)) !== null && r.deleted === 0, r); }
  { const s = await upload('owner', 'partner-photos', `pets/${ID.owner}/qa-sp-${T}.jpg`); ok('P5 other type folder (pets/…) refused', !ok2xx(s), { status: s }); }

  // ---- clean-up: synthetic objects only (owner deletes where a policy allows; the rest via SQL on staging) ----
  for (const [b, p] of [['partner-photos', regPath], ['partner-photos', `${ID.owner}/qa-sp-root-${T}.jpg`]]) await remove('owner', b, p);
  let sqlCleanup = 'ok';
  try {
    await q('begin'); await q(`select set_config('storage.allow_delete_query', 'true', true)`);
    await q(`delete from storage.objects where bucket_id in ('farm-assets', 'shop-assets', 'service-assets', 'partner-photos') and name like '%qa-sp-%'`);
    await q('commit');
  } catch (e) { await q('rollback').catch(() => {}); sqlCleanup = e.code; }
  const left = (await q(`select count(*)::int c from storage.objects where name like '%qa-sp-%'`))[0].c;
  ok('clean-up: no qa-sp- object rows left (staging)', left === 0, { left, sqlCleanup });
  await db.end();
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch((e) => { console.log('ERROR', e.message); process.exitCode = 2; });
