// Reservation → transfer rules through the real REST API on whiskora-staging (synthetic QA accounts only).
// usage: STAGING_ANON_KEY=<staging publishable key> node reservation_api_checks.cjs   (password: ~/.whiskora/staging_qa_password)
// Reset first: P4/P5 listed on farm 9001, owner = QA owner, no reservations/transfers (see supabase/staging/README).
// Prints PASS/FAIL with statuses/codes only.
const fs = require('fs'); const os = require('os');
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY;
if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const ID = { owner: 'a0000000-0000-4000-8000-000000000001', manager: 'a0000000-0000-4000-8000-000000000002', staff: 'a0000000-0000-4000-8000-000000000003', viewer: 'a0000000-0000-4000-8000-000000000004', buyer: 'a0000000-0000-4000-8000-000000000005', stranger: 'a0000000-0000-4000-8000-000000000006', admin: 'a0000000-0000-4000-8000-000000000007', newuser: 'a0000000-0000-4000-8000-000000000008' };
const toks = {};
async function tok(who) {
  if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${who}@example.com`, password: PW }) })).json();
  if (!d.access_token) throw new Error('login failed ' + who);
  return (toks[who] = d.access_token);
}
async function rest(who, method, path, body, prefer = 'return=representation') {
  const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: prefer };
  if (who !== 'anon') h.Authorization = `Bearer ${await tok(who)}`;
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, msg: b && !Array.isArray(b) ? String(b.message || '').slice(0, 80) : null, body: b };
}
const rpc = (who, fn, args) => rest(who, 'POST', `rpc/${fn}`, args);
const P1 = 900001, P2 = 900002, P4 = 900004, P5 = 900005, P6 = 900006;
let pass = 0, fail = 0;
const ok = (name, cond, info) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} ${name} :: ${JSON.stringify(info)}`); };
const s = r => ({ status: r.status, rows: r.rows, code: r.code, msg: r.msg });
const denied = r => r.status >= 400 || r.rows === 0;
const pet = async id => (await rest('admin', 'GET', `pets?id=eq.${id}&select=user_id,farm_id,status`)).body?.[0];
const res = async id => (await rest('admin', 'GET', `pet_reservations?id=eq.${id}&select=status,buyer_id`)).body?.[0];
const tr = async id => (await rest('admin', 'GET', `pet_ownership_transfers?id=eq.${id}&select=status,pet_id,to_user_id`)).body?.[0];
const health = async (who, id) => { const r = await rpc(who, 'get_pet_health', { p_pet_id: id }); return r.status === 200 && r.rows > 0 && !!r.body[0].allergies; };

(async () => {
  // ── reservation create ──
  let r = await rest('buyer', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.buyer, status: 'confirmed' });
  ok('R1 buyer cannot insert an already-confirmed reservation', denied(r), s(r));
  r = await rest('buyer', 'POST', 'pet_reservations', { pet_id: P2, buyer_id: ID.buyer, status: 'pending' });
  ok('R2 buyer cannot reserve a private, unlisted pet', denied(r), s(r));
  // P6: status พร้อมย้ายบ้าน but is_public = false — readable by anyone (existing pets policy), not reservable
  r = await rest('anon', 'GET', `pets?id=eq.${P6}&select=id,status`);
  ok('R2b (documents existing design) a พร้อมย้ายบ้าน pet with is_public=false is readable by anonymous visitors', r.status === 200 && r.rows === 1, s(r));
  r = await rest('buyer', 'POST', 'pet_reservations', { pet_id: P6, buyer_id: ID.buyer, status: 'pending' });
  ok('R2c buyer cannot reserve a พร้อมย้ายบ้าน pet that is set to not public', denied(r), s(r));
  r = await rest('owner', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.owner, status: 'pending' });
  ok('R3 owner cannot reserve own pet', denied(r), s(r));
  r = await rest('buyer', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.stranger, status: 'pending' });
  ok('R4 cannot reserve in someone else\'s name', denied(r), s(r));
  r = await rest('anon', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.buyer, status: 'pending' });
  ok('R5 anonymous cannot reserve', denied(r), s(r));
  const [b1, b2] = await Promise.all([
    rest('buyer', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.buyer, status: 'pending' }),
    rest('buyer', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.buyer, status: 'pending' })]);
  const rB = (b1.body?.[0] || b2.body?.[0])?.id;
  ok('R6 buyer double-click "จอง" (2 parallel inserts) → exactly one row', [b1.status, b2.status].sort().join() === '201,409', { a: b1.status, b: b2.status });
  r = await rest('stranger', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.stranger, status: 'pending' }); const rS = r.body?.[0]?.id;
  ok('R7 a second buyer (stranger) can also reserve (pending)', r.status === 201, s(r));

  // ── reservation update: direct API closed for everyone ──
  for (const who of ['buyer', 'viewer', 'staff', 'manager', 'owner']) {
    r = await rest(who, 'PATCH', `pet_reservations?id=eq.${rB}`, { status: 'confirmed' });
    ok(`R8 direct PATCH by ${who} changes nothing`, denied(r) && (await res(rB)).status === 'pending', s(r));
  }
  // ── confirm via RPC: role checks ──
  for (const who of ['buyer', 'viewer', 'staff', 'stranger']) {
    r = await rpc(who, 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'confirmed' });
    ok(`R9 ${who} cannot confirm (RPC)`, r.status >= 400 && r.code === '42501', s(r));
  }
  r = await rpc('anon', 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'confirmed' });
  ok('R9 anonymous cannot call the RPC', r.status >= 400, s(r));
  // concurrent: manager confirms buyer's, owner confirms stranger's at the same time → only one confirmed
  const [c1, c2] = await Promise.all([
    rpc('manager', 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'confirmed' }),
    rpc('owner', 'farm_set_reservation_status', { p_reservation_id: rS, p_status: 'confirmed' })]);
  const nConf = [await res(rB), await res(rS)].filter(x => x.status === 'confirmed').length;
  ok('R10 two different reservations confirmed concurrently → only one confirmed', nConf === 1 && [c1.status, c2.status].includes(200) && [c1.status, c2.status].some(x => x >= 400), { a: c1.status, b: c2.status, confirmed: nConf, pet: (await pet(P4)).status });
  // make the buyer's the confirmed one
  if ((await res(rS)).status === 'confirmed') { await rpc('owner', 'farm_set_reservation_status', { p_reservation_id: rS, p_status: 'cancelled' }); await rpc('manager', 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'confirmed' }); }
  else { await rpc('owner', 'farm_set_reservation_status', { p_reservation_id: rS, p_status: 'cancelled' }); }
  r = await rest('stranger', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.stranger, status: 'pending' });
  ok('R11 a reserved pet (ติดจอง) cannot take new reservations', denied(r), s(r));
  const [d1, d2] = await Promise.all([
    rpc('manager', 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'confirmed' }),
    rpc('manager', 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'confirmed' })]);
  ok('R12 manager confirms again twice (double click) → no-op, pet ติดจอง', d1.status === 200 && d2.status === 200 && (await res(rB)).status === 'confirmed' && (await pet(P4)).status === 'ติดจอง', { a: d1.status, b: d2.status });

  // ── health before transfer ──
  const hBefore = { owner: await health('owner', P4), manager: await health('manager', P4), buyer: await health('buyer', P4), stranger: await health('stranger', P4) };

  // ── transfer create: role checks ──
  for (const who of ['staff', 'viewer', 'manager', 'buyer', 'stranger']) {
    r = await rest(who, 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID[who], initiated_by: ID[who], status: 'pending' });
    ok(`T1 ${who} cannot create a transfer of the farm pet (to self)`, denied(r), s(r));
  }
  r = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID.stranger, initiated_by: ID.owner, status: 'pending', reservation_id: rB });
  ok('T2 transfer linked to a reservation must go to that reservation\'s buyer', denied(r), s(r));
  r = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID.buyer, initiated_by: ID.owner, status: 'accepted', reservation_id: rB });
  ok('T3 cannot insert a transfer already accepted', denied(r), s(r));
  r = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID.owner, initiated_by: ID.owner, status: 'pending' });
  ok('T4 cannot transfer to self', denied(r), s(r));
  const [i1, i2] = await Promise.all([1, 2].map(() => rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID.buyer, initiated_by: ID.owner, status: 'pending', reservation_id: rB })));
  const tA = (i1.body?.[0] || i2.body?.[0])?.id;
  ok('T5 farm owner sends transfer twice in parallel → exactly one pending', [i1.status, i2.status].sort().join() === '201,409', { a: i1.status, b: i2.status });

  // ── transfer update: direct API closed, RPC role checks ──
  r = await rest('buyer', 'PATCH', `pet_ownership_transfers?id=eq.${tA}`, { pet_id: P2, status: 'accepted' });
  ok('T6 receiver cannot swap pet_id / accept by direct PATCH', denied(r) && (await pet(P2)).user_id === ID.owner && (await tr(tA)).status === 'pending', s(r));
  r = await rest('owner', 'PATCH', `pet_ownership_transfers?id=eq.${tA}`, { status: 'accepted' });
  ok('T7 initiator cannot mark accepted by direct PATCH', denied(r) && (await tr(tA)).status === 'pending', s(r));
  for (const who of ['owner', 'manager', 'staff', 'stranger']) {
    r = await rpc(who, 'respond_pet_transfer', { p_transfer_id: tA, p_action: 'accept' });
    ok(`T8 ${who} cannot accept a transfer addressed to the buyer`, r.status >= 400 && r.code === '42501', s(r));
  }
  for (const who of ['staff', 'viewer', 'manager', 'stranger']) {
    r = await rpc(who, 'respond_pet_transfer', { p_transfer_id: tA, p_action: 'cancel' });
    ok(`T9 ${who} cannot cancel the transfer`, r.status >= 400 && r.code === '42501', s(r));
  }
  // decline (twice) → reservation stays confirmed, owner unchanged
  const [x1, x2] = await Promise.all([1, 2].map(() => rpc('buyer', 'respond_pet_transfer', { p_transfer_id: tA, p_action: 'decline' })));
  let p = await pet(P4);
  ok('T10 buyer declines (double click) → declined once, owner/farm/status unchanged, reservation still confirmed',
    x1.status === 200 && x2.status === 200 && (await tr(tA)).status === 'declined' && p.user_id === ID.owner && p.farm_id === 9001 && p.status === 'ติดจอง' && (await res(rB)).status === 'confirmed', { a: x1.status, b: x2.status, pet: p.status });
  r = await rpc('buyer', 'respond_pet_transfer', { p_transfer_id: tA, p_action: 'accept' });
  ok('T11 a declined transfer cannot be accepted later', r.status >= 400, s(r));

  // cancelled reservation kills its pending transfer
  r = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID.buyer, initiated_by: ID.owner, status: 'pending', reservation_id: rB }); const tB = r.body?.[0]?.id;
  await rpc('manager', 'farm_set_reservation_status', { p_reservation_id: rB, p_status: 'cancelled' });
  r = await rpc('buyer', 'respond_pet_transfer', { p_transfer_id: tB, p_action: 'accept' });
  p = await pet(P4);
  ok('T12 manager cancels the confirmed reservation → its pending transfer is cancelled, accept fails, pet back to เปิดจอง',
    r.status >= 400 && (await tr(tB)).status === 'cancelled' && p.user_id === ID.owner && p.status === 'เปิดจอง', { accept: r.status, code: r.code, pet: p.status });

  // full happy path: new reservation (+ a competing pending one), confirm, send, accept (twice in parallel)
  r = await rest('buyer', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.buyer, status: 'pending' }); const rB2 = r.body?.[0]?.id;
  r = await rest('stranger', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.stranger, status: 'pending' }); const rS2 = r.body?.[0]?.id;
  await rpc('owner', 'farm_set_reservation_status', { p_reservation_id: rB2, p_status: 'confirmed' });
  r = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.owner, to_user_id: ID.buyer, initiated_by: ID.owner, status: 'pending', reservation_id: rB2 }); const tC = r.body?.[0]?.id;
  const [a1, a2] = await Promise.all([1, 2].map(() => rpc('buyer', 'respond_pet_transfer', { p_transfer_id: tC, p_action: 'accept' })));
  p = await pet(P4);
  const nTr = (await rest('admin', 'GET', `pet_ownership_transfers?pet_id=eq.${P4}&status=eq.accepted&select=id`)).rows;
  ok('T13 buyer accepts (double click) → owner = buyer, farm cleared, status NULL (not ติดจอง, not relisted), reservation converted, competing pending reservation cancelled, one accepted transfer',
    a1.status === 200 && a2.status === 200 && p.user_id === ID.buyer && p.farm_id === null && p.status === null && (await res(rB2)).status === 'converted' && (await res(rS2)).status === 'cancelled' && nTr === 1,
    { a: a1.status, b: a2.status, pet_status: p.status, farm: p.farm_id, res: (await res(rB2)).status, other: (await res(rS2)).status, accepted_rows: nTr });

  // ── after transfer ──
  const hAfter = { owner: await health('owner', P4), manager: await health('manager', P4), buyer: await health('buyer', P4), stranger: await health('stranger', P4) };
  ok('H1 health before: farm owner + manager see it, buyer + stranger do not', hBefore.owner && hBefore.manager && !hBefore.buyer && !hBefore.stranger, hBefore);
  ok('H2 health after: new owner sees it; old farm owner, manager, stranger do not', hAfter.buyer && !hAfter.owner && !hAfter.manager && !hAfter.stranger, hAfter);
  r = await rpc('manager', 'farm_set_reservation_status', { p_reservation_id: rB2, p_status: 'cancelled' });
  ok('A1 old farm manager cannot touch the converted reservation', r.status >= 400, s(r));
  r = await rest('owner', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.buyer, to_user_id: ID.owner, initiated_by: ID.owner, status: 'pending' });
  ok('A2 old owner cannot start a transfer of the pet any more', denied(r), s(r));
  r = await rest('owner', 'PATCH', `pets?id=eq.${P4}`, { status: 'เปิดจอง' });
  ok('A3 old owner cannot edit the pet', denied(r) && (await pet(P4)).status === null, s(r));
  r = await rest('stranger', 'POST', 'pet_reservations', { pet_id: P4, buyer_id: ID.stranger, status: 'pending' });
  ok('A4 nobody can reserve the transferred pet (not listed)', denied(r), s(r));
  r = await rest('buyer', 'POST', 'pet_ownership_transfers', { pet_id: P4, from_user_id: ID.buyer, to_user_id: ID.stranger, initiated_by: ID.buyer, status: 'pending' }); const tD = r.body?.[0]?.id;
  ok('A5 new owner can start a transfer of their pet', r.status === 201, s(r));
  r = await rpc('buyer', 'respond_pet_transfer', { p_transfer_id: tD, p_action: 'cancel' });
  ok('A6 new owner can cancel it (initiator)', r.status === 200 && (await tr(tD)).status === 'cancelled', s(r));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.log('ERROR', e.message); process.exitCode = 2; });
