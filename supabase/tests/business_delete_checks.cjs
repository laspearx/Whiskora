// No direct API DELETE on farms / shops / services / workspaces (20261102100000) — real REST on whiskora-staging with
// synthetic QA accounts. Run AFTER the migration (with DELETE still open it only reports the state and exits: a REST
// DELETE probe would really delete).
// Synthetic data: owner 01 creates "QA-BD farm|shop|service" through create_business; manager 02 joins the shop through an
// invitation; staff 03 gets an invitation that is cancelled; stranger 06 has nothing. Signup = auth.users row
// 00000000-0000-4000-8000-00000000bd01 (inserted as the database owner, like the other suites), removed at the end.
// Cleanup: only the QA-BD businesses this run created (id from the RPC + owner 01 + name prefix checked; anything else
// → STOP, nothing deleted), their workspaces (cascade members / invitations) and their create_business claim rows.
// usage: NODE_PATH=<dir with pg> STAGING_ANON_KEY=<key> node supabase/tests/business_delete_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const U = { owner: '01', manager: '02', staff: '03', stranger: '06' };
const uid = (who) => `a0000000-0000-4000-8000-0000000000${U[who]}`;
const SIGNUP = '00000000-0000-4000-8000-00000000bd01';
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
const TBL = { farm: 'farms', shop: 'shops', service: 'services' };
const base = (type, name) => ({ [`${type}_name`]: name, owner_name: 'QA Synthetic', phone: '0800000000', province: 'กรุงเทพมหานคร', lat: 13.75, lng: 100.5,
  bio: 'synthetic', ...(type === 'farm' ? { species: 'cat' } : { supported_species: ['dog'] }), ...(type === 'service' ? { category: 'grooming' } : {}) });

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const open = (await q(`select r || ':' || t x from (values ('anon'), ('authenticated'), ('public')) a(r), (values ('farms'), ('shops'), ('services'), ('workspaces')) b(t)
                         where has_table_privilege(r, 'public.' || t, 'DELETE')`)).map((r) => r.x);
  if (open.length) { console.log(`schema: DELETE still open (${open.join(',')}) — migration 20261102100000 not applied; no REST DELETE probes run`); await db.end(); process.exit(3); }
  console.log('schema: direct DELETE closed (20261102100000)\n');

  const created = []; // [type, id, workspace]
  const rowMd5 = async (tbl, col, id) => (await q(`select md5(t::text) m from public.${tbl} t where ${col} = $1`, [id]))[0]?.m ?? null;
  try {
    // ── signup still creates the personal workspace (handle_new_user), account removal still cascades
    { await q(`delete from auth.users where id = $1`, [SIGNUP]);
      await q(`insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'whiskora-qa+bd-signup@example.com', '{"full_name":"QA BD"}', now(), now())`, [SIGNUP]);
      const w = await q(`select w.type, m.role from workspaces w join workspace_members m on m.workspace_id = w.id where w.owner_id = $1`, [SIGNUP]);
      ok('A signup → personal workspace + owner row', w.length === 1 && w[0].type === 'personal' && w[0].role === 'owner', { w });
      await q(`delete from auth.users where id = $1`, [SIGNUP]);
      const left = await q(`select count(*)::int n from workspaces where owner_id = $1`, [SIGNUP]);
      ok('A account removal (auth.users, system path) → workspace removed by FK cascade', left[0].n === 0, { left: left[0].n }); }

    // ── create a business of each type through the RPC
    for (const type of ['farm', 'shop', 'service']) {
      const r = await rpc('owner', 'create_business', { p_type: type, p_fields: base(type, `QA-BD ${type}`), p_request_key: crypto.randomUUID() });
      const row = Array.isArray(r.body) ? r.body[0] : null;
      if (row?.entity_id) created.push([type, Number(row.entity_id), row.workspace_id]);
      ok(`B owner creates a ${type} (create_business)`, r.status === 200 && !!row?.entity_id && !!row?.workspace_id, { s: r.status, code: r.code });
    }
    const byType = Object.fromEntries(created.map(([t, id, ws]) => [t, { id, ws }]));

    // ── profile edits still work (owner on every type)
    for (const [type, id] of created) {
      const r = await rpc('owner', 'update_business_profile', { p_type: type, p_id: id, p_fields: { bio: `edited ${type}` } });
      ok(`C owner edits ${type} profile`, r.status === 200 && r.body?.bio === `edited ${type}`, { s: r.status, code: r.code });
    }

    // ── members / invitations on the shop: invite manager → accept; invite staff → cancel; manager edits; manager leaves
    const shop = byType.shop;
    if (shop) {
      const inv = await rpc('owner', 'invite_workspace_member', { p_workspace: shop.ws, p_invitee: uid('manager'), p_role: 'manager' });
      ok('D owner invites manager', inv.status === 200 && typeof inv.body === 'string', { s: inv.status, code: inv.code });
      const mine = (await rpc('manager', 'get_my_workspace_invitations')).body || [];
      const invId = mine.find((x) => x.workspace_id === shop.ws)?.invitation_id;
      const acc = await rpc('manager', 'respond_workspace_invitation', { p_invitation: invId, p_action: 'accept' });
      ok('D manager accepts', acc.body === 'accepted', { s: acc.status, b: acc.body });
      const inv2 = await rpc('owner', 'invite_workspace_member', { p_workspace: shop.ws, p_invitee: uid('staff'), p_role: 'staff' });
      const can = await rpc('owner', 'cancel_workspace_invitation', { p_invitation: inv2.body });
      ok('D owner invites staff, then cancels', inv2.status === 200 && can.status === 200, { s: [inv2.status, can.status], b: can.body });
      const list = await rpc('owner', 'list_workspace_members', { p_workspace: shop.ws });
      ok('D owner lists members (owner + manager)', list.status === 200 && Array.isArray(list.body) && list.body.length === 2, { s: list.status, n: list.body?.length });
      const me = await rpc('manager', 'update_business_profile', { p_type: 'shop', p_id: shop.id, p_fields: { bio: 'manager edit' } });
      ok('D manager edits shop bio', me.status === 200 && me.body?.bio === 'manager edit', { s: me.status, code: me.code });
    }

    // ── direct DELETE refused for everyone; rows unchanged
    const own = (await q(`select id from workspaces where type = 'personal' and owner_id = $1`, [uid('owner')]))[0]?.id;
    const mgr = (await q(`select id from workspaces where type = 'personal' and owner_id = $1`, [uid('manager')]))[0]?.id;
    const targets = [
      ...created.map(([t, id]) => [TBL[t], 'id', id, `${t} entity`]),
      ...created.map(([t, , ws]) => ['workspaces', 'id', ws, `${t} workspace`]),
      ['workspaces', 'id', own, 'owner personal workspace'], ['workspaces', 'id', mgr, 'manager personal workspace'],
    ];
    for (const [tbl, col, id, label] of targets) {
      const before = await rowMd5(tbl, col, id);
      const r = {};
      for (const who of ['anon', 'owner', 'manager', 'stranger']) r[who] = await rest(who, 'DELETE', `${tbl}?${col}=eq.${id}`);
      const after = await rowMd5(tbl, col, id);
      const refusedAll = r.anon.status === 401 && r.anon.code === '42501' && ['owner', 'manager', 'stranger'].every((w) => r[w].status === 403 && r[w].code === '42501');
      ok(`E direct DELETE ${label} refused (anon 401, owner / manager / stranger 403 42501), row unchanged`, refusedAll && before !== null && before === after,
        { s: Object.fromEntries(Object.entries(r).map(([w, x]) => [w, `${x.status}/${x.code}`])), unchanged: before === after });
    }
    { const bulk = await rest('owner', 'DELETE', `shops?id=gte.0`); const bulkWs = await rest('owner', 'DELETE', `workspaces?owner_id=eq.${uid('owner')}`);
      const n = await q(`select (select count(*) from shops where user_id = $1)::int s, (select count(*) from workspaces where owner_id = $2)::int w`, [uid('owner'), uid('owner')]);
      ok('E owner bulk DELETE (all shops / all own workspaces) refused 42501, nothing removed', bulk.code === '42501' && bulkWs.code === '42501' && n[0].s >= 1 && n[0].w >= 4, { s: [bulk.status, bulkWs.status], n: n[0] }); }

    // ── leave the team still works (delete of workspace_members through the RPC)
    if (shop) {
      const mid = (await q(`select id from workspace_members where workspace_id = $1 and user_id = $2`, [shop.ws, uid('manager')]))[0]?.id;
      const r = await rpc('manager', 'remove_workspace_member', { p_member: mid });
      const still = await q(`select count(*)::int n from workspace_members where workspace_id = $1 and user_id = $2`, [shop.ws, uid('manager')]);
      ok('F manager leaves the team', r.body === 'left' && still[0].n === 0, { s: r.status, b: r.body });
    }
  } finally {
    // ── cleanup: only what this run created, after an owner + name check
    for (const [type, id, ws] of created) {
      const e = (await q(`select user_id, ${type}_name n from ${TBL[type]} where id = $1`, [id]))[0];
      const w = (await q(`select owner_id, entity_id, type from workspaces where id = $1`, [ws]))[0];
      if (!e || e.user_id !== uid('owner') || !String(e.n).startsWith('QA-BD') || (w && (w.owner_id !== uid('owner') || Number(w.entity_id) !== id || w.type !== type))) {
        console.log(`STOP cleanup ${type} ${id}: not this run's synthetic row — nothing deleted`); fail++; continue;
      }
      const d1 = await db.query(`delete from workspaces where id = $1`, [ws]);
      const d2 = await db.query(`delete from ${TBL[type]} where id = $1`, [id]);
      const d3 = await db.query(`delete from business_create_requests where user_id = $1 and entity_id = $2 and workspace_id = $3`, [uid('owner'), id, ws]);
      console.log(`cleanup ${type} ${id}: workspace ${d1.rowCount}, entity ${d2.rowCount}, claim ${d3.rowCount}`);
    }
    await q(`delete from auth.users where id = $1`, [SIGNUP]);
    console.log(`\n${pass} passed, ${fail} failed`);
    await db.end(); process.exit(fail ? 1 : 0);
  }
})().catch((e) => { console.error(e); process.exit(1); });
