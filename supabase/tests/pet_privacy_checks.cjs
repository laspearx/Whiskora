// Pet privacy through the real REST API on whiskora-staging (synthetic accounts, pet_privacy_fixture_staging.sql).
// usage: STAGING_ANON_KEY=<staging publishable key> node pet_privacy_checks.cjs   (password: ~/.whiskora/staging_qa_password)
// Expectations = the rule "is_public = false wins over sale status and over field-group tiers for anyone who is not
// owner / co-owner / farm team / admin". Prints PASS/FAIL with statuses/booleans only (no data values).
const fs = require('fs'); const os = require('os');
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const ID = { owner: 'a0000000-0000-4000-8000-000000000001', manager: 'a0000000-0000-4000-8000-000000000002', staff: 'a0000000-0000-4000-8000-000000000003', viewer: 'a0000000-0000-4000-8000-000000000004', buyer: 'a0000000-0000-4000-8000-000000000005', stranger: 'a0000000-0000-4000-8000-000000000006', coowner: 'a0000000-0000-4000-8000-000000000008' };
const EMAIL = { coowner: 'newuser' };
const P2 = 900002, P6 = 900006, P7 = 900007;
const toks = {};
async function tok(who) {
  if (who === 'anon') return null; if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${EMAIL[who] || who}@example.com`, password: PW }) })).json();
  return (toks[who] = d.access_token);
}
async function rest(who, method, path, body) {
  const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }; const t = await tok(who); if (t) h.Authorization = `Bearer ${t}`;
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, body: b };
}
const rpc = (who, fn, args) => rest(who, 'POST', `rpc/${fn}`, args);
let pass = 0, fail = 0;
const ok = (n, c, i) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const canRow = async (who, id) => { const r = await rest(who, 'GET', `pets?id=eq.${id}&select=id`); return r.status === 200 && r.rows === 1; };
const canHealth = async (who, id) => { const r = await rpc(who, 'get_pet_health', { p_pet_id: id }); return r.status === 200 && r.rows > 0; };
const pedigreeIds = async (who, id) => { const r = await rpc(who, 'get_pet_pedigree', { p_pet_id: id, p_max_gen: 3 }); return (r.body || []).map(x => Number(x.node_id ?? x.id)); };

(async () => {
  const outsiders = ['anon', 'stranger', 'buyer'];
  // 1. row visibility: private pets (incl. private + พร้อมย้ายบ้าน) are hidden from outsiders
  for (const who of outsiders) for (const id of [P2, P6]) ok(`row ${id} hidden from ${who}`, !(await canRow(who, id)), {});
  for (const who of ['owner']) for (const id of [P2, P6]) ok(`row ${id} visible to ${who}`, await canRow(who, id), {});
  ok('row P2 visible to its co-owner', await canRow('coowner', P2), {});
  for (const who of ['manager', 'staff', 'viewer']) ok(`row P6 (private farm pet) visible to farm ${who}`, await canRow(who, P6), {});
  ok('row P7 (public) visible to anon', await canRow('anon', P7), {});
  // listing query like /farm-hub must not return private pets
  let r = await rest('anon', 'GET', `pets?select=id&status=in.(${encodeURIComponent('พร้อมย้ายบ้าน')},${encodeURIComponent('เปิดจอง')})&id=gte.900000`);
  ok('farm-hub style listing (anon) excludes private P6', r.status === 200 && !(r.body || []).some(x => x.id === P6), { status: r.status });

  // 2. field-group tiers cannot open a private pet to outsiders
  for (const who of outsiders) ok(`health of private P2 (tier public) hidden from ${who}`, !(await canHealth(who, P2)), {});
  ok('health of private P6 (tier registered) hidden from signed-in stranger', !(await canHealth('stranger', P6)), {});
  ok('health of P2 visible to owner', await canHealth('owner', P2), {});
  ok('health of P2 visible to co-owner', await canHealth('coowner', P2), {});
  ok('health of P6 visible to farm staff', await canHealth('staff', P6), {});
  r = await rpc('anon', 'get_my_pet_access', { p_pet_id: P2 });
  ok('get_my_pet_access(anon, private P2): no group granted', r.status === 200 && r.body && !Object.values(r.body).some(v => v === true), { status: r.status });
  ok('pedigree RPC of private P6 empty for anon', (await pedigreeIds('anon', P6)).length === 0, {});

  // 3. pedigree of a public pet must not reveal a private ancestor
  const anonTree = await pedigreeIds('anon', P7);
  ok('pedigree RPC of public P7 (anon) shows P7 but not its private sire P2', anonTree.includes(P7) && !anonTree.includes(P2), { nodes: anonTree.length });
  ok('pedigree RPC of public P7 (stranger) hides private sire', !(await pedigreeIds('stranger', P7)).includes(P2), {});
  ok('pedigree RPC of P7 (owner of P2) shows the sire', (await pedigreeIds('owner', P7)).includes(P2), {});

  // 4. direct pedigree columns: tier must not be bypassed by anonymous REST reads
  r = await rest('anon', 'GET', `pets?id=eq.${P7}&select=sire_id,pedigree_number,paternal_grandsire`);
  ok('anon cannot read pedigree columns directly (use get_pet_pedigree)', r.status === 401 || r.status === 403, { status: r.status, code: r.code });
  r = await rest('anon', 'GET', `pets?id=eq.${P7}&select=id,name,status,image_url,microchip_number`);
  ok('anon still reads the public card columns of a public pet', r.status === 200 && r.rows === 1, { status: r.status });
  r = await rest('owner', 'GET', `pets?id=eq.${P7}&select=sire_id,pedigree_number`);
  ok('owner still reads own pedigree columns', r.status === 200 && r.rows === 1, { status: r.status });

  // 4b. storage pet-photos: no listing for anon / other users; owner upsert + list own folder; public URL works
  {
    const st = async (who, method, path, body, extra = {}) => {
      const h = { apikey: KEY, ...extra }; const t = await tok(who); h.Authorization = `Bearer ${t || KEY}`;
      const r = await fetch(`${SB}/storage/v1/${path}`, { method, headers: h, body });
      let b = null; try { b = await r.json(); } catch {}
      return { status: r.status, body: b };
    };
    const probe = `${ID.owner}/qa-privacy-probe.png`;
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    let s1 = await st('owner', 'POST', `object/pet-photos/${probe}`, png, { 'content-type': 'image/png', 'x-upsert': 'true' });
    ok('owner upload with upsert to own folder works', s1.status === 200, { status: s1.status });
    const list = (who, prefix) => st(who, 'POST', 'object/list/pet-photos', JSON.stringify({ prefix, limit: 100 }), { 'content-type': 'application/json' });
    let l = await list('anon', ''); ok('anon cannot list pet-photos folders', Array.isArray(l.body) && l.body.length === 0, { status: l.status, n: Array.isArray(l.body) ? l.body.length : null });
    l = await list('anon', `${ID.owner}/`); ok('anon cannot list a user folder', Array.isArray(l.body) && l.body.length === 0, { n: Array.isArray(l.body) ? l.body.length : null });
    l = await list('stranger', `${ID.owner}/`); ok('another signed-in user cannot list the folder', Array.isArray(l.body) && l.body.length === 0, { n: Array.isArray(l.body) ? l.body.length : null });
    l = await list('owner', `${ID.owner}/`); ok('owner can list own folder', Array.isArray(l.body) && l.body.some(x => x.name === 'qa-privacy-probe.png'), { n: Array.isArray(l.body) ? l.body.length : null });
    const pu = await fetch(`${SB}/storage/v1/object/public/pet-photos/${probe}`); ok('public URL of a photo still loads (public bucket)', pu.status === 200, { status: pu.status });
    s1 = await st('owner', 'DELETE', `object/pet-photos/${probe}`); ok('owner can delete own photo', s1.status === 200, { status: s1.status });
  }

  // 4c. who may change privacy settings (same rule as the UI): farm owner / manager; pet owner
  {
    const fvs = (who, tier) => rest(who, 'POST', 'farm_visibility_settings?on_conflict=farm_id,field_group_key', { farm_id: 9001, field_group_key: 'health', tier, include_previous_owner: false });
    for (const who of ['viewer', 'staff', 'stranger']) {
      const w = await fvs(who, 'public');
      ok(`${who} cannot write farm privacy settings`, w.status === 403 || w.status === 401, { status: w.status, code: w.code });
    }
    for (const who of ['owner', 'manager']) {
      const w = await rest(who, 'POST', 'farm_visibility_settings', { farm_id: 9001, field_group_key: 'certificates', tier: 'owner', include_previous_owner: false });
      const d = await rest(who, 'DELETE', 'farm_visibility_settings?farm_id=eq.9001&field_group_key=eq.certificates');
      ok(`farm ${who} can write + delete farm privacy settings`, w.status === 201 && d.status === 200 && d.rows === 1, { write: w.status, del: d.status });
    }
    const pv = (who, id) => rest(who, 'POST', 'pet_visibility_settings', { pet_id: id, field_group_key: 'weight', tier: 'public', include_previous_owner: false });
    for (const who of ['staff', 'viewer', 'coowner', 'stranger']) {
      const id = who === 'coowner' ? P2 : P6;
      const w = await pv(who, id);
      ok(`${who} cannot write per-pet privacy of ${id}`, w.status === 403 || w.status === 401, { status: w.status });
    }
    const w = await pv('owner', P6); const d = await rest('owner', 'DELETE', `pet_visibility_settings?pet_id=eq.${P6}&field_group_key=eq.weight`);
    ok('pet owner can write + delete per-pet privacy', w.status === 201 && d.status === 200, { write: w.status, del: d.status });
  }

  // 5. after an ownership transfer (mutates the fixture; re-run pet_privacy_fixture_staging.sql to reset)
  if (process.argv.includes('--transfer')) {
    // P2 (private, co-owner 08) and P7 (public, pedigree tier public) go from owner 01 to buyer 05
    for (const id of [P2, P7]) {
      const t = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: id, from_user_id: ID.owner, to_user_id: ID.buyer, initiated_by: ID.owner, status: 'pending' });
      const a = await rpc('buyer', 'respond_pet_transfer', { p_transfer_id: t.body?.[0]?.id, p_action: 'accept' });
      ok(`transfer ${id} owner → buyer accepted`, t.status === 201 && a.status === 200, { insert: t.status, accept: a.status });
    }
    ok('after transfer: new owner sees private P2 row + health', (await canRow('buyer', P2)) && (await canHealth('buyer', P2)), {});
    ok('after transfer: old owner no longer sees private P2 row', !(await canRow('owner', P2)), {});
    ok('after transfer: old owner no longer sees P2 health', !(await canHealth('owner', P2)), {});
    ok('after transfer: anon still cannot see private P2 health', !(await canHealth('anon', P2)), {});
    // co-owner added by the previous owner: reported, not asserted (owner decision)
    console.log(`INFO co-owner added by the previous owner still sees P2 row/health after transfer: ${await canRow('coowner', P2)}/${await canHealth('coowner', P2)}`);
    ok('after transfer: old owner no longer sees P7 health (tier owner)', !(await canHealth('owner', P7)), {});
    // new owner makes P7 private → everything closes for outsiders and the old owner
    // return=minimal: a representation would select the private health columns (revoked since the privacy migration)
    const u = await fetch(`${SB}/rest/v1/pets?id=eq.${P7}`, { method: 'PATCH', headers: { apikey: KEY, Authorization: `Bearer ${await tok('buyer')}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ is_public: false }) });
    const v = await rest('buyer', 'GET', `pets?id=eq.${P7}&select=is_public`);
    ok('new owner can set P7 to not public (owner update, read back)', u.status === 204 && v.body?.[0]?.is_public === false, { status: u.status });
    ok('after private: anon cannot read P7 row', !(await canRow('anon', P7)), {});
    ok('after private: old owner cannot read P7 row', !(await canRow('owner', P7)), {});
    ok('after private: anon pedigree RPC of P7 is empty (old per-pet tier "public" no longer opens it)', (await pedigreeIds('anon', P7)).length === 0, {});
    ok('after private: new owner still gets P7 pedigree', (await pedigreeIds('buyer', P7)).includes(P7), {});
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.log('ERROR', e.message); process.exitCode = 2; });
