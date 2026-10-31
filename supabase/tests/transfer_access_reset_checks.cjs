// Access after an ownership transfer, through the real REST API on whiskora-staging (synthetic accounts,
// transfer_access_reset_fixture_staging.sql first). usage: STAGING_ANON_KEY=<staging publishable key> node transfer_access_reset_checks.cjs
// Rule (20261031120000): on accept, the old co-owners / grants / farm team lose access, per-group tiers go owner-only
// (private stays private, overview + is_public kept), the seller counts as previous owner without access, weight rows
// follow the current owner. Prints PASS/FAIL with statuses/booleans/counts only.
const fs = require('fs'); const os = require('os');
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const ID = { owner: 'a0000000-0000-4000-8000-000000000001', manager: 'a0000000-0000-4000-8000-000000000002', staff: 'a0000000-0000-4000-8000-000000000003', viewer: 'a0000000-0000-4000-8000-000000000004', buyer: 'a0000000-0000-4000-8000-000000000005', stranger: 'a0000000-0000-4000-8000-000000000006', admin: 'a0000000-0000-4000-8000-000000000007', coowner: 'a0000000-0000-4000-8000-000000000008' };
const EMAIL = { coowner: 'newuser' };
const T1 = 900011, T2 = 900012, T3 = 900013;
const toks = {};
async function tok(who) {
  if (who === 'anon') return null; if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${EMAIL[who] || who}@example.com`, password: PW }) })).json();
  return (toks[who] = d.access_token);
}
async function rest(who, method, path, body, prefer = 'return=representation') {
  const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: prefer }; const t = await tok(who); if (t) h.Authorization = `Bearer ${t}`;
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, msg: b && !Array.isArray(b) ? b.message : null, body: b };
}
const rpc = (who, fn, args) => rest(who, 'POST', `rpc/${fn}`, args);
const arr = x => Array.isArray(x) ? x : [];
let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const canRow = async (who, id) => { const r = await rest(who, 'GET', `pets?id=eq.${id}&select=id`); return r.status === 200 && r.rows === 1; };
const canHealth = async (who, id) => { const r = await rpc(who, 'get_pet_health', { p_pet_id: id }); return r.status === 200 && r.rows > 0; };
const access = async (who, id) => (await rpc(who, 'get_my_pet_access', { p_pet_id: id })).body || {};
const noneTrue = a => !Object.values(a).some(v => v === true);
// a public pet's overview group is public by design (kept on transfer, like is_public)
const onlyOverview = a => Object.keys(a).filter(k => a[k] === true).every(k => k === 'overview');
const weights = async (who, id) => arr((await rest(who, 'GET', `pet_weights?pet_id=eq.${id}&select=id,user_id`)).body);
const patchWeight = (who, id, body) => rest(who, 'PATCH', `pet_weights?id=eq.${id}`, body);
const changed = x => x.status === 200 && x.rows === 1;
const send = async (from, to, pet) => (await rest(from, 'POST', 'pet_ownership_transfers', { pet_id: pet, from_user_id: ID[from], to_user_id: ID[to], initiated_by: ID[from], status: 'pending' })).body?.[0]?.id;
const respond = (who, id, action) => rpc(who, 'respond_pet_transfer', { p_transfer_id: id, p_action: action });
const revs = async id => arr((await rest('admin', 'GET', `pet_transfer_access_revocations?transfer_id=eq.${id}&select=kind,subject_user_id,access_grant_id,field_group_key,detail`)).body);
const settings = async (who, id) => Object.fromEntries(arr((await rest(who, 'GET', `pet_visibility_settings?pet_id=eq.${id}&select=field_group_key,tier,include_previous_owner`)).body).map(s => [s.field_group_key, `${s.tier}${s.include_previous_owner ? '+prev' : ''}`]));
const grantsOf = async id => arr((await rest('admin', 'GET', `access_grants?resource_id=eq.${id}&select=id,grantee_id,field_group_key,revoked_at,expires_at&order=id`)).body);

(async () => {
  // ── 0. before any transfer (fixture state) ──
  ok('T1 before: co-owner sees private row + health', (await canRow('coowner', T1)) && (await canHealth('coowner', T1)));
  ok('T1 before: grantee (stranger) sees vaccination', (await access('stranger', T1)).vaccination === true);
  ok('T1 before: farm staff sees row + health', (await canRow('staff', T1)) && (await canHealth('staff', T1)));
  let r = await rest('staff', 'POST', 'pet_weights', { pet_id: T1, weight: 3.3, user_id: ID.staff });
  ok('T1 before: farm staff can record a weight', r.status === 201, { status: r.status });
  const staffNew = r.body?.[0]?.id;
  r = await rest('viewer', 'POST', 'pet_weights', { pet_id: T1, weight: 3.3, user_id: ID.viewer });
  ok('farm viewer cannot record a weight (read-only role)', r.status === 403, { status: r.status });
  r = await rest('stranger', 'POST', 'pet_weights', { pet_id: T1, weight: 9.9, user_id: ID.stranger });
  ok('unrelated user cannot record a weight on someone else\'s pet (was allowed before)', r.status === 403, { status: r.status });
  r = await rest('owner', 'POST', 'pet_weights', { pet_id: T1, weight: 3.3, user_id: ID.staff });
  ok('nobody can record a weight in someone else\'s name', r.status === 403, { status: r.status });
  r = await patchWeight('owner', 9900012, { user_id: ID.owner });
  ok('recorder of a weight row cannot be changed (owner on staff\'s row)', !changed(r), { status: r.status, code: r.code });
  r = await patchWeight('owner', 9900012, { notes: 'qa-owner-note' });
  ok('owner can edit a weight row recorded by its staff', changed(r), { status: r.status });
  const w0 = await weights('owner', T1);
  ok('owner reads all weight rows of its pet (any recorder)', w0.length === 3, { n: w0.length });
  const settings0 = await settings('owner', T1);
  const grants0 = await grantsOf(T1);

  // ── 1. failure / rollback paths keep everything ──
  const tBad = await send('owner', 'buyer', T1);
  r = await respond('stranger', tBad, 'accept');
  ok('accept by someone who is not the receiver → forbidden', r.status === 403 || r.code === '42501', { status: r.status, code: r.code });
  r = await respond('buyer', tBad, 'decline');
  ok('receiver declines', r.status === 200, { status: r.status });
  r = await respond('buyer', tBad, 'accept');
  ok('accept after decline → invalid transition', r.status >= 400, { status: r.status, code: r.code });
  ok('… after failed / declined accepts: co-owner, grant, tiers, farm team, weights unchanged',
     (await canHealth('coowner', T1)) && (await access('stranger', T1)).vaccination === true && (await canRow('staff', T1))
     && JSON.stringify(await settings('owner', T1)) === JSON.stringify(settings0)
     && JSON.stringify(await grantsOf(T1)) === JSON.stringify(grants0) && (await weights('owner', T1)).length === 3);
  ok('… and no revocation history for the declined transfer', (await revs(tBad)).length === 0);

  // ── 2. accept T1 (farm pet) owner 01 → buyer 05 ──
  const t1 = await send('owner', 'buyer', T1);
  r = await respond('buyer', t1, 'accept');
  ok('T1 transfer owner → buyer accepted', r.status === 200 && r.body?.[0]?.transfer_status === 'accepted', { status: r.status });
  const h1 = await revs(t1);
  const kinds = k => h1.filter(x => x.kind === k);
  ok('history: 1 co-owner removed (08)', kinds('co_owner').length === 1 && kinds('co_owner')[0].subject_user_id === ID.coowner, { n: kinds('co_owner').length });
  ok('history: 2 grants revoked (active + expired-unrevoked), the earlier revoked one not touched', kinds('access_grant').length === 2 && !kinds('access_grant').some(x => x.subject_user_id === ID.viewer), { n: kinds('access_grant').length });
  ok('history: 3 non-overview per-pet settings recorded with their old values', kinds('visibility_setting').length === 3 && kinds('visibility_setting').some(x => x.field_group_key === 'health' && x.detail.include_previous_owner === true), { n: kinds('visibility_setting').length });
  const g1 = await grantsOf(T1);
  ok('grants are kept as rows (revoked, not deleted)', g1.length === 3 && g1.every(g => g.revoked_at), { n: g1.length });
  const s1 = await settings('buyer', T1);
  const pgroups = Object.keys(s1).filter(k => k !== 'overview');
  ok('tiers: every group except overview is owner-only without previous owners; documents / dna / medical_notes stay private',
     pgroups.length >= 8 && pgroups.every(k => ['documents', 'dna', 'medical_notes'].includes(k) ? s1[k] === 'private' : s1[k] === 'owner'), { s1 });
  ok('tiers: overview kept as the old owner set it (registered)', s1.overview === 'registered', { overview: s1.overview });
  r = await rest('buyer', 'GET', `pets?id=eq.${T1}&select=is_public,farm_id,user_id`);
  ok('is_public kept (false), farm cleared, new owner set', r.body?.[0]?.is_public === false && r.body?.[0]?.farm_id === null && r.body?.[0]?.user_id === ID.buyer, {});
  r = await rest('buyer', 'GET', `pet_ownership_transfers?id=eq.${t1}&select=status,from_user_id,to_user_id,accepted_at`);
  ok('transfer row kept (accepted, from / to, accepted_at)', r.body?.[0]?.status === 'accepted' && r.body?.[0]?.from_user_id === ID.owner && !!r.body?.[0]?.accepted_at, {});
  // nobody from before keeps anything
  for (const who of ['owner', 'coowner', 'manager', 'staff', 'viewer', 'stranger']) {
    const a = await access(who, T1);
    ok(`after accept: ${who} has no row, no group, no health`, !(await canRow(who, T1)) && noneTrue(a) && !(await canHealth(who, T1)), { groups_true: Object.keys(a).filter(k => a[k] === true) });
  }
  for (const who of ['owner', 'staff', 'manager', 'coowner']) {
    ok(`after accept: ${who} reads no weight rows of T1`, (await weights(who, T1)).length === 0);
  }
  r = await patchWeight('owner', 9900011, { notes: 'qa-old-owner' });
  ok('old owner cannot edit the weight row it recorded', !changed(r), { status: r.status });
  r = await patchWeight('staff', 9900012, { notes: 'qa-old-staff' });
  ok('old farm staff cannot edit the weight row it recorded', !changed(r), { status: r.status });
  r = await rest('owner', 'DELETE', 'pet_weights?id=eq.9900011');
  ok('old owner cannot delete it', !(r.status === 200 && r.rows === 1), { status: r.status });
  r = await rest('staff', 'POST', 'pet_weights', { pet_id: T1, weight: 3.4, user_id: ID.staff });
  ok('old farm staff cannot record a new weight', r.status === 403, { status: r.status });
  r = await rest('stranger', 'GET', `vaccines?pet_id=eq.${T1}&select=id`);
  ok('old grantee reads no vaccine rows', r.status === 200 && r.rows === 0, { rows: r.rows });
  // new owner works
  ok('new owner: row + health', (await canRow('buyer', T1)) && (await canHealth('buyer', T1)));
  const wb = await weights('buyer', T1);
  ok('new owner reads every weight row (recorded by others)', wb.length === 3 && wb.some(x => x.user_id === ID.owner) && wb.some(x => x.user_id === ID.staff), { n: wb.length });
  r = await patchWeight('buyer', 9900011, { notes: 'qa-new-owner' });
  ok('new owner can edit a weight row recorded by the old owner', changed(r), { status: r.status });
  r = await patchWeight('buyer', 9900011, { user_id: ID.buyer });
  ok('… but not take over its recorder (user_id stays as history)', !changed(r), { status: r.status, code: r.code });
  r = await rest('buyer', 'DELETE', `pet_weights?id=eq.${staffNew}`);
  ok('new owner can delete a weight row', r.status === 200 && r.rows === 1, { status: r.status });
  r = await rest('buyer', 'POST', 'pet_weights', { pet_id: T1, weight: 3.5, user_id: ID.buyer });
  ok('new owner can record a weight', r.status === 201, { status: r.status });
  r = await rest('admin', 'GET', `pet_weights?id=eq.9900011&select=user_id`);
  ok('weight row 9900011 still says recorded by the old owner', r.body?.[0]?.user_id === ID.owner, {});
  r = await rest('buyer', 'GET', `vaccines?pet_id=eq.${T1}&select=id`);
  ok('new owner reads the vaccine rows', r.rows === 1, { rows: r.rows });
  // previous owner = the seller, counted but without access
  ok('seller (owner 01) is a previous owner but gets nothing (include_previous_owner false everywhere)', noneTrue(await access('owner', T1)));

  // ── 3. repeated accept / double click ──
  r = await respond('buyer', t1, 'accept');
  ok('repeated accept → no-op 200', r.status === 200 && r.body?.[0]?.transfer_status === 'accepted', { status: r.status });
  ok('… no new history rows', (await revs(t1)).length === h1.length, { n: (await revs(t1)).length });
  {
    const t3 = await send('owner', 'buyer', T3);
    await rest('owner', 'POST', 'pet_co_owners', { pet_id: T3, user_id: ID.coowner, added_by: ID.owner });
    await rest('owner', 'POST', 'access_grants', { granted_by: ID.owner, grantee_id: ID.stranger, resource_type: 'pet', resource_id: T3, field_group_key: 'weight', relationship_tag: 'custom' });
    const [x, y] = await Promise.all([respond('buyer', t3, 'accept'), respond('buyer', t3, 'accept')]);
    const h3 = await revs(t3);
    ok('double click accept (parallel): both 200, one accept, history once (1 co-owner + 1 grant + 0 settings)',
       x.status === 200 && y.status === 200 && h3.filter(z => z.kind === 'co_owner').length === 1 && h3.filter(z => z.kind === 'access_grant').length === 1, { a: x.status, b: y.status, n: h3.length });
  }

  // ── 4. old owner cannot add access after the transfer ──
  r = await rest('owner', 'POST', 'pet_co_owners', { pet_id: T1, user_id: ID.coowner, added_by: ID.owner });
  ok('old owner cannot add a co-owner afterwards', r.status === 403 || r.status === 401, { status: r.status, code: r.code });
  r = await rest('owner', 'POST', 'access_grants', { granted_by: ID.owner, grantee_id: ID.stranger, resource_type: 'pet', resource_id: T1, field_group_key: 'health', relationship_tag: 'custom' });
  ok('old owner cannot create a grant afterwards', r.status === 403, { status: r.status });
  r = await rest('owner', 'POST', 'pet_visibility_settings?on_conflict=pet_id,field_group_key', { pet_id: T1, field_group_key: 'health', tier: 'public', include_previous_owner: true }, 'return=minimal,resolution=merge-duplicates');
  ok('old owner cannot change the tiers afterwards', r.status === 403 || r.status === 401, { status: r.status });
  ok('… tiers still owner-only', (await settings('buyer', T1)).health === 'owner');

  // ── 5. the same people can get access again, only from the new owner ──
  r = await rest('buyer', 'POST', 'pet_co_owners', { pet_id: T1, user_id: ID.coowner, added_by: ID.buyer });
  ok('new owner re-adds 08 as co-owner', r.status === 201, { status: r.status });
  ok('… 08 sees row + health again', (await canRow('coowner', T1)) && (await canHealth('coowner', T1)));
  r = await rest('buyer', 'POST', 'pet_visibility_settings?on_conflict=pet_id,field_group_key', { pet_id: T1, field_group_key: 'vaccination', tier: 'engaged', include_previous_owner: false }, 'return=minimal,resolution=merge-duplicates');
  const g2 = await rest('buyer', 'POST', 'access_grants', { granted_by: ID.buyer, grantee_id: ID.stranger, resource_type: 'pet', resource_id: T1, field_group_key: 'vaccination', relationship_tag: 'custom' });
  ok('new owner grants vaccination to the old grantee (tier engaged + grant)', [200, 201, 204].includes(r.status) && g2.status === 201, { tier: r.status, grant: g2.status });
  const as = await access('stranger', T1);
  ok('… old grantee sees vaccination only', as.vaccination === true && as.health === false && as.weight === false, {});
  r = await rest('buyer', 'POST', 'pet_visibility_settings?on_conflict=pet_id,field_group_key', { pet_id: T1, field_group_key: 'health', tier: 'owner', include_previous_owner: true }, 'return=minimal,resolution=merge-duplicates');
  const ao = await access('owner', T1);
  ok('new owner opens health to previous owners → seller sees health, nothing else, no card', [200, 201, 204].includes(r.status) && ao.health === true && ao.weight === false && !(await canRow('owner', T1)), { status: r.status });
  ok('… old farm staff still nothing (not a previous owner)', noneTrue(await access('staff', T1)));

  // ── 6. multi-hop chain on T2: 01 → 05 → 06 → 01 ──
  const c1 = await send('owner', 'buyer', T2); r = await respond('buyer', c1, 'accept');
  ok('chain 1: 01 → 05 accepted', r.status === 200);
  await rest('buyer', 'POST', 'pet_co_owners', { pet_id: T2, user_id: ID.coowner, added_by: ID.buyer });
  await rest('buyer', 'POST', 'pet_visibility_settings?on_conflict=pet_id,field_group_key', { pet_id: T2, field_group_key: 'weight', tier: 'engaged', include_previous_owner: false }, 'return=minimal,resolution=merge-duplicates');
  await rest('buyer', 'POST', 'pet_visibility_settings?on_conflict=pet_id,field_group_key', { pet_id: T2, field_group_key: 'health', tier: 'owner', include_previous_owner: true }, 'return=minimal,resolution=merge-duplicates');
  await rest('buyer', 'POST', 'access_grants', { granted_by: ID.buyer, grantee_id: ID.viewer, resource_type: 'pet', resource_id: T2, field_group_key: 'weight', relationship_tag: 'custom' });
  ok('chain 1: 05 gives 08 co-owner + 04 weight grant; both work', (await canHealth('coowner', T2)) && (await access('viewer', T2)).weight === true);
  ok('chain 1: 01 (seller = previous owner) sees health because 05 allowed previous owners', (await access('owner', T2)).health === true);
  const c2 = await send('buyer', 'stranger', T2); r = await respond('stranger', c2, 'accept');
  ok('chain 2: 05 → 06 accepted', r.status === 200);
  const hc2 = await revs(c2);
  ok('chain 2 history: 05\'s co-owner + grant + setting, tied to transfer 2', hc2.filter(x => x.kind === 'co_owner').length === 1 && hc2.filter(x => x.kind === 'access_grant').length === 1 && hc2.some(x => x.kind === 'visibility_setting' && x.field_group_key === 'health' && x.detail.include_previous_owner === true), { n: hc2.length });
  for (const who of ['owner', 'buyer', 'coowner', 'viewer']) { const a = await access(who, T2); ok(`chain 2: ${who} has nothing on T2 beyond the public overview (owner-only, no previous owners)`, onlyOverview(a) && !(await canHealth(who, T2)), { groups_true: Object.keys(a).filter(k => a[k] === true) }); }
  ok('chain 2: new owner 06 sees health', await canHealth('stranger', T2));
  ok('chain 2: T2 stays public (card readable by anon)', await canRow('anon', T2));
  const c3 = await send('stranger', 'owner', T2); r = await respond('owner', c3, 'accept');
  ok('chain 3: 06 → 01 (back to the first owner) accepted', r.status === 200);
  ok('chain 3: 01 is current owner again: health + weights readable', (await canHealth('owner', T2)) && (await access('owner', T2)).health === true);
  for (const who of ['buyer', 'stranger', 'coowner', 'viewer']) { const a = await access(who, T2); ok(`chain 3: ${who} has nothing on T2 beyond the public overview`, onlyOverview(a) && !(await canHealth(who, T2)), { groups_true: Object.keys(a).filter(k => a[k] === true) }); }
  r = await rest('admin', 'GET', `pet_ownership_transfers?pet_id=eq.${T2}&status=eq.accepted&select=id`);
  ok('chain: all 3 accepted transfers kept', r.rows === 3, { rows: r.rows });

  // ── 7. history table access ──
  r = await rest('owner', 'GET', `pet_transfer_access_revocations?transfer_id=eq.${t1}&select=id`);
  ok('sender reads the history of its transfer', r.status === 200 && r.rows === h1.length, { rows: r.rows });
  r = await rest('stranger', 'GET', `pet_transfer_access_revocations?transfer_id=eq.${t1}&select=id`);
  ok('others read none of it', r.status === 200 && r.rows === 0, { rows: r.rows });
  r = await rest('anon', 'GET', 'pet_transfer_access_revocations?select=id');
  ok('anon cannot read it', r.status === 401 || (r.status === 200 && r.rows === 0), { status: r.status });
  r = await rest('owner', 'POST', 'pet_transfer_access_revocations', { transfer_id: t1, pet_id: T1, kind: 'co_owner' });
  ok('API cannot write history', r.status === 403 || r.status === 401, { status: r.status });
  r = await rest('owner', 'DELETE', `pet_transfer_access_revocations?transfer_id=eq.${t1}`);
  ok('API cannot delete history', r.status === 403 || r.status === 401 || (r.status === 200 && r.rows === 0), { status: r.status });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.log('ERROR', e.message, e.stack); process.exitCode = 2; });
