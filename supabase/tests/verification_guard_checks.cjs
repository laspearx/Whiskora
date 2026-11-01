// Verification guard (20261101180000) — real REST on whiskora-staging with synthetic QA accounts.
// Synthetic farm "QA-VG farm" (owner 01) is created for the run and removed at the end, with its requests and the
// audit-log rows the admin RPC writes for them. Prints PASS/FAIL with statuses / codes only.
// usage: NODE_PATH=<dir with pg> STAGING_ANON_KEY=<key> node supabase/tests/verification_guard_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const U = { owner: '01', stranger: '06', admin: '07' };
const uid = (who) => `a0000000-0000-4000-8000-0000000000${U[who]}`;
let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const toks = {};
async function tok(who) {
  if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${who}@example.com`, password: PW }) })).json();
  return (toks[who] = d.access_token);
}
async function rest(who, method, path, body, prefer = 'return=representation') {
  const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: prefer }; if (who !== 'anon') h.Authorization = `Bearer ${await tok(who)}`;
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, body: b };
}
const rpc = (who, fn, args = {}) => rest(who, 'POST', `rpc/${fn}`, args);
const refused = (r) => r.status >= 400 || r.rows === 0;

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const installed = (await q(`select count(*)::int n from pg_trigger where tgname in ('farms_verification_guard', 'farm_verifications_guard')`))[0].n === 2;
  // since 20261101200000 ordinary profile fields are edited only through update_business_profile
  const profileRpc = !(await q(`select has_table_privilege('authenticated', 'public.farms', 'UPDATE') p`))[0].p;
  const editBio = async (id, bio) => {
    if (!profileRpc) return rest('owner', 'PATCH', `farms?id=eq.${id}`, { bio });
    const direct = await rest('owner', 'PATCH', `farms?id=eq.${id}`, { bio });
    const r = await rpc('owner', 'update_business_profile', { p_type: 'farm', p_id: id, p_fields: { bio } });
    return { status: direct.status === 403 && r.status === 200 ? 200 : 500, rows: r.status === 200 ? 1 : 0, direct: direct.status };
  };
  console.log(`schema: ${installed ? 'AFTER (verification guard)' : 'BEFORE'}${profileRpc ? ', profile edits via update_business_profile' : ''}\n`);
  const cleanup = async () => {
    const ids = (await q(`select v.id from farm_verifications v join farms f on f.id = v.farm_id where f.farm_name = 'QA-VG farm'`)).map((r) => String(r.id));
    if (ids.length) await q(`delete from admin_audit_logs where entity_type = 'farm_verification' and entity_id = any($1::text[])`, [ids]);
    await q(`delete from farm_verifications where farm_id in (select id from farms where farm_name = 'QA-VG farm')`);
    await q(`delete from farms where farm_name = 'QA-VG farm'`);
  };
  try {
    await cleanup();
    ok('S0 QA admin account is an admin on staging', (await q(`select role from profiles where id = $1`, [uid('admin')]))[0]?.role === 'admin');
    const farm = (await q(`insert into farms (user_id, farm_name, bio) values ($1, 'QA-VG farm', 'synthetic') returning id`, [uid('owner')]))[0].id;
    // second synthetic farm of the same owner: target for the 'move a request' attempt (never a real / fixture farm)
    const farm2 = (await q(`insert into farms (user_id, farm_name, bio) values ($1, 'QA-VG farm', 'synthetic 2') returning id`, [uid('owner')]))[0].id;
    const state = async () => (await q(`select is_verified v, verified_at is not null at, verification_status s, verification_note n from farms where id = $1`, [farm]))[0];
    const fv = async () => (await q(`select status, admin_note, reviewed_by from farm_verifications where farm_id = $1 order by id desc limit 1`, [farm]))[0];
    const moved = async () => (await q(`select count(*)::int n from farm_verifications where farm_id = $1`, [farm2]))[0].n;
    const clean = { v: false, at: false, s: null, n: null };

    // ── owner cannot set the result on farms ──
    for (const [n, body] of [['is_verified = true', { is_verified: true }], ['verified_at', { verified_at: new Date().toISOString() }],
      ['verification_status = verified', { verification_status: 'verified' }], ['verification_note', { verification_note: 'ok' }],
      ['verification_status = pending without a request', { verification_status: 'pending' }]]) {
      const r = await rest('owner', 'PATCH', `farms?id=eq.${farm}`, body);
      ok(`F1 owner PATCH ${n} → refused, farm unchanged`, refused(r) && JSON.stringify(await state()) === JSON.stringify(clean), { status: r.status, code: r.code });
    }
    { const r = await editBio(farm, 'QA-VG edited');
      ok('F2 owner can still edit ordinary farm fields (direct before 20261101200000, via update_business_profile after)', r.status === 200 && r.rows === 1, { status: r.status, rows: r.rows, direct: r.direct }); }
    // INSERT path: direct INSERT may be closed by 20261101170000; open it only inside a rolled-back transaction
    { const t = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await t.connect(); const res = {};
      try {
        await t.query('begin'); await t.query('grant insert on public.farms to authenticated');
        await t.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid('owner'), role: 'authenticated' })]);
        await t.query('set local role authenticated');
        for (const [n, cols] of [['is_verified', `is_verified) values ($1, 'QA-VG ins', true)`], ['verified_at', `verified_at) values ($1, 'QA-VG ins', now())`],
          ['verification_status', `verification_status) values ($1, 'QA-VG ins', 'verified')`], ['plain', `bio) values ($1, 'QA-VG ins', 'x')`]]) {
          await t.query('savepoint s');
          try { await t.query(`insert into farms (user_id, farm_name, ${cols}`, [uid('owner')]); res[n] = 'ok'; await t.query('release savepoint s'); }
          catch (e) { res[n] = e.code; await t.query('rollback to savepoint s'); }
        }
      } finally { await t.query('rollback').catch(() => {}); await t.end(); }
      ok('F3 INSERT of a farm with verification fields refused; a plain farm still inserts (rolled back)', installed
        ? res.is_verified === '42501' && res.verified_at === '42501' && res.verification_status === '42501' && res.plain === 'ok' : true, res); }

    // ── requests ──
    { const r = await rest('stranger', 'POST', 'farm_verifications', { farm_id: farm, user_id: uid('stranger'), phone: '0', status: 'pending' });
      ok('R1 stranger cannot submit a request for a farm they do not own', refused(r), { status: r.status, code: r.code }); }
    { const r = await rest('owner', 'POST', 'farm_verifications', { farm_id: farm, user_id: uid('owner'), phone: '0', status: 'approved' });
      ok('R2 owner cannot submit a request that is already approved', refused(r) && (await fv()) === undefined, { status: r.status, code: r.code }); }
    { const r = await rest('owner', 'POST', 'farm_verifications', { farm_id: farm, user_id: uid('owner'), phone: '0', status: 'pending', admin_note: 'self' });
      ok('R3 owner cannot fill in review fields', refused(r) && (await fv()) === undefined, { status: r.status, code: r.code }); }
    // the verify page: request first, then farms → pending
    { const r = await rest('owner', 'POST', 'farm_verifications', { farm_id: farm, user_id: uid('owner'), phone: '0', status: 'pending', farm_photo_urls: [] });
      const p = await rest('owner', 'PATCH', `farms?id=eq.${farm}`, { verification_status: 'pending' });
      ok('R4 verify page path works: pending request, then farm → pending', r.status === 201 && p.status === 200 && p.rows === 1 && (await state()).s === 'pending', { req: r.status, farm: [p.status, p.rows] }); }
    for (const [n, body] of [['status approved', { status: 'approved' }], ['admin_note', { admin_note: 'self' }], ['reviewed_by', { reviewed_by: uid('owner') }],
      ['reviewed_at', { reviewed_at: new Date().toISOString() }], ['phone_verified', { phone_verified: true }], ['farm_id', { farm_id: farm2 }]]) {
      const r = await rest('owner', 'PATCH', `farm_verifications?farm_id=eq.${farm}`, body);
      ok(`R5 owner PATCH request ${n} → refused`, refused(r) && (await fv())?.status === 'pending' && (await moved()) === 0, { status: r.status, code: r.code });
    }
    { const r = await rest('admin', 'PATCH', `farm_verifications?farm_id=eq.${farm}`, { status: 'approved' });
      ok('R6 admin direct PATCH of a request is refused too (decisions go through the RPC)', refused(r) && (await fv()).status === 'pending', { status: r.status, code: r.code }); }
    { const r = await rest('owner', 'PATCH', `farms?id=eq.${farm}`, { verification_status: 'verified', is_verified: true });
      ok('F4 owner cannot jump from pending to verified', refused(r) && (await state()).v === false, { status: r.status, code: r.code }); }

    // ── admin RPC ──
    const reqId = (await q(`select id from farm_verifications where farm_id = $1 order by id desc limit 1`, [farm]))[0].id;
    for (const who of ['anon', 'owner', 'stranger']) {
      const r = await rpc(who, 'admin_review_farm_verification', { p_verification_id: reqId, p_action: 'approve' });
      ok(`A1 ${who} cannot use the admin review RPC`, r.status >= 400 && (await state()).v === false, { status: r.status, code: r.code });
    }
    { const r = await rpc('admin', 'admin_review_farm_verification', { p_verification_id: reqId, p_action: 'reject', p_note: 'QA-VG reject' });
      const s = await state(); const v = await fv();
      const log = (await q(`select count(*)::int n from admin_audit_logs where entity_type = 'farm_verification' and entity_id = $1 and action = 'verification_reject'`, [String(reqId)]))[0].n;
      ok('A2 admin rejects through the RPC: request rejected + note, farm rejected, audit row', r.status === 200 && v.status === 'rejected' && v.admin_note === 'QA-VG reject' && s.s === 'rejected' && s.v === false && log === 1, { status: r.status, farm: s.s, req: v.status, log }); }
    { const r = await rest('owner', 'POST', 'farm_verifications', { farm_id: farm, user_id: uid('owner'), phone: '0', status: 'pending' });
      const p = await rest('owner', 'PATCH', `farms?id=eq.${farm}`, { verification_status: 'pending' });
      ok('R7 after a rejection the owner can submit again (rejected → pending)', r.status === 201 && p.status === 200 && p.rows === 1, { req: r.status, farm: p.status }); }
    { const id2 = (await q(`select id from farm_verifications where farm_id = $1 order by id desc limit 1`, [farm]))[0].id;
      const r = await rpc('admin', 'admin_review_farm_verification', { p_verification_id: id2, p_action: 'approve' });
      const s = await state(); const v = await fv();
      ok('A3 admin approves through the RPC: farm verified + verified_at, request approved by the admin', r.status === 200 && s.v === true && s.at === true && s.s === 'verified' && v.status === 'approved' && v.reviewed_by === uid('admin'), { status: r.status, farm: s }); }
    for (const [n, body] of [['is_verified = false', { is_verified: false }], ['verification_status = pending', { verification_status: 'pending' }], ['verified_at = null', { verified_at: null }]]) {
      const r = await rest('owner', 'PATCH', `farms?id=eq.${farm}`, body);
      ok(`F5 after approval owner PATCH ${n} → refused, still verified`, refused(r) && (await state()).v === true, { status: r.status, code: r.code });
    }
    { const r = await editBio(farm, 'QA-VG after approval');
      ok('F6 owner still edits ordinary fields after approval', r.status === 200 && r.rows === 1 && (await state()).v === true, { status: r.status }); }
  } catch (e) { fail++; console.log('FAIL exception', e.message); }
  finally {
    await cleanup().catch((e) => console.log('cleanup error', e.message));
    console.log(`cleanup: QA-VG rows left ${(await q(`select count(*)::int n from farms where farm_name like 'QA-VG%'`))[0].n}`);
    await db.end();
  }
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})();
