// Workspace ownership guard (20261101120000) — through the real REST API on whiskora-staging with synthetic QA
// accounts, plus permission functions evaluated in SQL for the same users. Every attack is followed by a
// measurement of what the stranger can do and a clean-up (staging admin connection), so the script also runs on the
// "before" schema to show the hole. Prints PASS/FAIL with statuses / booleans only.
// usage: fixtures transfer_access_reset_fixture_staging.sql + workspace_guard_fixture_staging.sql, then
//        NODE_PATH=<dir with pg> STAGING_ANON_KEY=<staging anon key> node supabase/tests/workspace_guard_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const ID = { owner: 'a0000000-0000-4000-8000-000000000001', manager: 'a0000000-0000-4000-8000-000000000002', staff: 'a0000000-0000-4000-8000-000000000003', viewer: 'a0000000-0000-4000-8000-000000000004', stranger: 'a0000000-0000-4000-8000-000000000006' };
const FARM = 9001, PET = 900011, SHOP = 990101, SERVICE = 990101, SERVICE_RACE = 990102;
let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const toks = {};
async function tok(who) {
  if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${who}@example.com`, password: PW }) })).json();
  return (toks[who] = d.access_token);
}
async function rest(who, method, path, body, prefer = 'return=representation') {
  const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: prefer, Authorization: `Bearer ${await tok(who)}` };
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, body: b };
}

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const guardOn = (await q(`select to_regprocedure('public.workspaces_guard()') is not null a`))[0].a;
  console.log(`schema: ${guardOn ? 'AFTER (guard installed)' : 'BEFORE (no guard)'}\n`);
  const fns = async (uid) => (await q(`select is_farm_team($1, $2) team, can_manage_farm_privacy($1, $2) privacy, can_record_pet_weight($3, $2) weight,
      can_transfer_pet($3, $2) transfer, can_decide_pet_reservation($3, $2) reservation`, [FARM, uid, PET]))[0];
  // what can the stranger do right now (API + functions); undo any successful write immediately
  async function strangerCaps() {
    const health = await rest('stranger', 'POST', 'rpc/get_pet_health', { p_pet_id: PET });
    const priv = await rest('stranger', 'POST', 'pet_visibility_settings', { pet_id: PET, field_group_key: 'certificates', tier: 'public', include_previous_owner: false });
    const weight = await rest('stranger', 'POST', 'pet_weights', { pet_id: PET, weight: 9.99, user_id: ID.stranger });
    await q(`delete from pet_visibility_settings where pet_id = $1 and field_group_key = 'certificates'`, [PET]);
    await q(`delete from pet_weights where pet_id = $1 and user_id = $2`, [PET, ID.stranger]);
    return { read_health: health.status === 200 && health.rows > 0, write_privacy: priv.status === 201, add_weight: weight.status === 201, ...(await fns(ID.stranger)) };
  }
  const none = (c) => Object.values(c).every((v) => v === false);
  // restore the stranger's own personal workspace first (an attack may have repointed it), then drop forged ones
  async function cleanup() {
    await q(`update workspaces set type = 'personal', entity_id = null, owner_id = $2 where id = $1`, [strangerPersonal, ID.stranger]);
    await q(`delete from workspaces where id <> $2 and (name like 'QA-WSG %' or (owner_id = $1 and type <> 'personal'))`, [ID.stranger, strangerPersonal]);
  }
  const strangerPersonal = (await q(`select id from workspaces where owner_id = $1 and type = 'personal'`, [ID.stranger]))[0].id;
  const farmWs = (await q(`select id from workspaces where type = 'farm' and entity_id = $1`, [FARM]))[0].id;

  // ---- baseline ----
  ok('baseline: stranger has no access to farm 9001 / pet T1', none(await strangerCaps()));
  const roles = { owner: await fns(ID.owner), manager: await fns(ID.manager), staff: await fns(ID.staff), viewer: await fns(ID.viewer) };

  // ---- A. stranger attacks (each: attempt → measure → clean up) ----
  const attacks = [
    ['A1 PATCH own personal workspace → type farm + entity 9001', () => rest('stranger', 'PATCH', `workspaces?id=eq.${strangerPersonal}`, { type: 'farm', entity_id: FARM })],
    ['A2 PATCH own personal workspace → entity_id only', () => rest('stranger', 'PATCH', `workspaces?id=eq.${strangerPersonal}`, { entity_id: FARM })],
    ['A3 PATCH own personal workspace → type only', () => rest('stranger', 'PATCH', `workspaces?id=eq.${strangerPersonal}`, { type: 'farm' })],
    ['A4 POST new farm workspace for farm 9001 (not theirs)', () => rest('stranger', 'POST', 'workspaces', { type: 'farm', name: 'QA-WSG a4', owner_id: ID.stranger, entity_id: FARM })],
    ['A5 POST shop workspace for owner 01\'s shop', () => rest('stranger', 'POST', 'workspaces', { type: 'shop', name: 'QA-WSG a5', owner_id: ID.stranger, entity_id: SHOP })],
    ['A6 POST service workspace for owner 01\'s service', () => rest('stranger', 'POST', 'workspaces', { type: 'service', name: 'QA-WSG a6', owner_id: ID.stranger, entity_id: SERVICE })],
    ['A7 POST another personal workspace', () => rest('stranger', 'POST', 'workspaces', { type: 'personal', name: 'QA-WSG a7', owner_id: ID.stranger })],
    ['A8 POST farm workspace with owner_id = farm owner (forged)', () => rest('stranger', 'POST', 'workspaces', { type: 'farm', name: 'QA-WSG a8', owner_id: ID.owner, entity_id: FARM })],
    ['A9 POST self as owner member of farm 9001 workspace', () => rest('stranger', 'POST', 'workspace_members', { workspace_id: farmWs, user_id: ID.stranger, role: 'owner' })],
  ];
  for (const [name, attack] of attacks) {
    const r = await attack();
    const caps = await strangerCaps();
    const rejected = r.status >= 400 || r.rows === 0;
    ok(`${name}: rejected, and stranger still has no access`, rejected && none(caps), { status: r.status, code: r.code, rows: r.rows, caps: Object.entries(caps).filter(([, v]) => v).map(([k]) => k) });
    await cleanup();
  }
  // A4 + member: even if a forged workspace existed, nothing follows (combined attempt)
  {
    const w = await rest('stranger', 'POST', 'workspaces', { type: 'farm', name: 'QA-WSG a10', owner_id: ID.stranger, entity_id: FARM });
    let m = null; if (w.status === 201) m = await rest('stranger', 'POST', 'workspace_members', { workspace_id: w.body[0].id, user_id: ID.stranger, role: 'owner' });
    const caps = await strangerCaps();
    ok('A10 forged farm workspace + self-membership: rejected, no access', w.status >= 400 && none(caps), { ws: w.status, member: m?.status ?? '-', caps: Object.entries(caps).filter(([, v]) => v).map(([k]) => k) });
    await cleanup();
  }
  // members: nobody upgrades themselves
  {
    const s = await rest('stranger', 'PATCH', `workspace_members?user_id=eq.${ID.stranger}`, { role: 'owner' });
    const mg = await rest('manager', 'PATCH', `workspace_members?workspace_id=eq.${farmWs}&user_id=eq.${ID.manager}`, { role: 'owner' });
    const st = await rest('staff', 'PATCH', `workspace_members?workspace_id=eq.${farmWs}&user_id=eq.${ID.staff}`, { role: 'manager' });
    const rolesNow = (await q(`select string_agg(m.role, ',' order by m.role) r from workspace_members m where m.workspace_id = $1`, [farmWs]))[0].r;
    ok('A11 members cannot change their own role (stranger / manager → owner, staff → manager): 0 rows, roles unchanged',
      [s, mg, st].every((x) => x.status >= 400 || x.rows === 0) && rolesNow === 'manager,owner,staff,viewer', { s: [s.status, mg.status, st.status], rows: [s.rows, mg.rows, st.rows], rolesNow });
  }

  // ---- L. legitimate paths ----
  {
    const a = await rest('owner', 'POST', 'workspaces', { type: 'shop', name: 'QA-WSG shop ws', owner_id: ID.owner, entity_id: SHOP });
    const b = await rest('owner', 'POST', 'workspaces', { type: 'shop', name: 'QA-WSG shop ws 2', owner_id: ID.owner, entity_id: SHOP });
    ok('L1 owner creates a workspace for their own shop (201); a second one for the same shop is refused (unique)', a.status === 201 && (guardOn ? b.status === 409 : true), { first: a.status, second: b.status, code: b.code });
  }
  {
    // 10 rounds of 3 concurrent creates for the same service → always exactly one workspace
    const rounds = [];
    for (let i = 0; i < 10; i++) {
      await q(`delete from workspaces where type = 'service' and entity_id = $1`, [SERVICE_RACE]);
      const rs = await Promise.all([1, 2, 3].map((k) => rest('owner', 'POST', 'workspaces', { type: 'service', name: `QA-WSG race ${i}-${k}`, owner_id: ID.owner, entity_id: SERVICE_RACE })));
      const n = (await q(`select count(*)::int c from workspaces where type = 'service' and entity_id = $1`, [SERVICE_RACE]))[0].c;
      rounds.push({ ok: rs.filter((r) => r.status === 201).length, conflict: rs.filter((r) => r.status === 409).length, n });
    }
    ok('L2 concurrent creates (10 rounds × 3) for the same service → exactly one workspace each round, others 409',
      guardOn ? rounds.every((r) => r.n === 1 && r.ok === 1 && r.conflict === 2) : true, { rounds: rounds.map((r) => `${r.ok}/${r.conflict}/${r.n}`).join(' ') });
  }
  {
    const before = (await q(`select name from workspaces where id = (select id from workspaces where owner_id = $1 and type = 'personal')`, [ID.owner]))[0].name;
    const r = await rest('owner', 'PATCH', `workspaces?owner_id=eq.${ID.owner}&type=eq.personal`, { name: 'QA-WSG renamed', avatar_url: null });
    await q(`update workspaces set name = $2 where owner_id = $1 and type = 'personal'`, [ID.owner, before]);
    ok('L3 owner renames own workspace (name / avatar_url still editable)', r.status === 200 && r.rows === 1, { status: r.status, rows: r.rows });
  }
  {
    const now = { owner: await fns(ID.owner), manager: await fns(ID.manager), staff: await fns(ID.staff), viewer: await fns(ID.viewer) };
    ok('L4 existing farm roles keep exactly their rights (owner / manager / staff / viewer)', JSON.stringify(now) === JSON.stringify(roles), now);
  }
  {
    const uid = '00000000-0000-4000-8000-00000000aa01';
    await q(`delete from auth.users where id = $1`, [uid]);
    await q(`insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
             values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'whiskora-qa+wsg-signup@example.com', '{"full_name":"QA WSG"}', now(), now())`, [uid]);
    const w = (await q(`select w.type, m.role from workspaces w join workspace_members m on m.workspace_id = w.id and m.user_id = w.owner_id where w.owner_id = $1`, [uid]));
    await q(`delete from auth.users where id = $1`, [uid]);
    ok('L5 sign-up (handle_new_user) still creates the personal workspace + owner membership', w.length === 1 && w[0].type === 'personal' && w[0].role === 'owner', w);
  }
  {
    const prev = (await q(`select full_name from profiles where id = $1`, [ID.owner]))[0].full_name;
    const r = await rest('owner', 'PATCH', `profiles?id=eq.${ID.owner}`, { full_name: 'QA WSG Name Sync' }, 'return=minimal');   // like the app (private columns)
    const synced = (await q(`select name from workspaces where owner_id = $1 and type = 'personal'`, [ID.owner]))[0].name;
    await rest('owner', 'PATCH', `profiles?id=eq.${ID.owner}`, { full_name: prev }, 'return=minimal');
    ok('L6 profile name change still renames the personal workspace (sync trigger)', r.status === 204 && synced === 'QA WSG Name Sync', { status: r.status, synced: synced === 'QA WSG Name Sync' });
  }
  {
    const s = await rest('owner', 'POST', 'shops', { user_id: ID.owner, shop_name: 'QA-WSG register flow', phone: '000' });
    const sid = s.body?.[0]?.id;
    const w = await rest('owner', 'POST', 'workspaces', { type: 'shop', name: 'QA-WSG register ws', owner_id: ID.owner, entity_id: sid });
    const m = w.status === 201 ? await rest('owner', 'POST', 'workspace_members', { workspace_id: w.body[0].id, user_id: ID.owner, role: 'owner' }) : null;
    ok('L7 register-shop flow (new shop → its workspace) still works', s.status === 201 && w.status === 201, { shop: s.status, ws: w.status, member_insert: m?.status, member_code: m?.code });
    if (sid) { await q(`delete from workspaces where type = 'shop' and entity_id = $1`, [sid]); await q(`delete from shops where id = $1`, [sid]); }
  }
  {
    const r = await rest('owner', 'POST', 'workspaces', { type: 'farm', name: 'QA-WSG dup farm', owner_id: ID.owner, entity_id: FARM });
    ok('L8 farm owner cannot add a second workspace for the same farm', guardOn ? r.status === 409 : true, { status: r.status, code: r.code });
  }
  await cleanup();
  await q(`delete from workspaces where name like 'QA-WSG %'`);
  ok('final: stranger has no access; no QA-WSG workspaces left; stranger has exactly 1 personal workspace',
    none(await strangerCaps()) && (await q(`select count(*)::int c from workspaces where name like 'QA-WSG %'`))[0].c === 0
      && (await q(`select count(*)::int c from workspaces where owner_id = $1`, [ID.stranger]))[0].c === 1);
  await db.end();
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch((e) => { console.log('ERROR', e.message); process.exitCode = 2; });
