// Workspace members via RPC + invitations (20261101150000) — real REST on whiskora-staging with synthetic QA accounts.
// Farm 9001: owner 01 (entity owner + owner row), manager 02, staff 03, viewer 04. Shop 990101: owner 01, NO owner row.
// Outsiders: buyer 05, stranger 06, newuser 08. Prints PASS/FAIL with statuses / codes only.
// usage: fixtures transfer_access_reset → workspace_guard → workspace_members, then
//        NODE_PATH=<dir with pg> STAGING_ANON_KEY=<key> node supabase/tests/workspace_members_checks.cjs [--compat-only]
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const U = { owner: '01', manager: '02', staff: '03', viewer: '04', buyer: '05', stranger: '06', newuser: '08' };
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
const refused = (r) => r.status >= 400;

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const installed = (await q(`select to_regprocedure('public.invite_workspace_member(uuid,uuid,text)') is not null a`))[0].a;
  console.log(`schema: ${installed ? 'AFTER (members RPC)' : 'BEFORE'}\n`);
  const farmWs = (await q(`select id from workspaces where type = 'farm' and entity_id = 9001`))[0].id;
  const shopWs = (await q(`select id from workspaces where type = 'shop' and entity_id = 990101`))[0].id;
  const personalWs = (await q(`select id from workspaces where type = 'personal' and owner_id = $1`, [uid('owner')]))[0].id;
  const members = async (ws) => (await q(`select right(user_id::text, 2) u, role from workspace_members where workspace_id = $1 order by user_id`, [ws])).map((r) => `${r.u}:${r.role}`).join(',');
  const memberId = async (ws, who) => (await q(`select id from workspace_members where workspace_id = $1 and user_id = $2`, [ws, uid(who)]))[0]?.id;
  const fns = async () => (await q(`select string_agg(r, ' ' order by r) s from (select right(u::text, 2) || ':' || is_farm_team(9001, u)::int || can_manage_farm_privacy(9001, u)::int
      || can_record_pet_weight(900011, u)::int || can_transfer_pet(900011, u)::int || can_decide_pet_reservation(900011, u)::int r
      from unnest(array[$1, $2, $3, $4, $5]::uuid[]) u) x`, [uid('owner'), uid('manager'), uid('staff'), uid('viewer'), uid('stranger')]))[0].s;
  const resetFarm = async () => {
    await q(`delete from workspace_invitations where workspace_id in ($1, $2)`, [farmWs, shopWs]).catch(() => {});
    await q(`delete from workspace_members where workspace_id = $1 and user_id not in ($2, $3, $4, $5)`, [farmWs, uid('owner'), uid('manager'), uid('staff'), uid('viewer')]);
    for (const [w, r] of [['owner', 'owner'], ['manager', 'manager'], ['staff', 'staff'], ['viewer', 'viewer']])
      await q(`insert into workspace_members (workspace_id, user_id, role) values ($1, $2, $3) on conflict (workspace_id, user_id) do update set role = excluded.role`, [farmWs, uid(w), r]);
    await q(`delete from workspace_members where workspace_id = $1`, [shopWs]);
  };
  await resetFarm();
  const fnBaseline = await fns();

  // ── old-app compatibility (direct table writes, as the current web app does) ──
  {
    const ins = await rest('owner', 'POST', 'workspace_members', { workspace_id: farmWs, user_id: uid('buyer'), role: 'staff' });
    const upd = await rest('owner', 'PATCH', `workspace_members?workspace_id=eq.${farmWs}&user_id=eq.${uid('staff')}`, { role: 'manager' });
    const del = await rest('owner', 'DELETE', `workspace_members?workspace_id=eq.${farmWs}&user_id=eq.${uid('viewer')}`);
    const own = await rest('staff', 'GET', `workspaces?select=id,workspace_members!inner(role)&type=eq.farm&entity_id=eq.9001&workspace_members.user_id=eq.${uid('staff')}`);
    const m = await members(farmWs);
    ok('C1 old app: direct member insert / role update / delete write nothing (before: 42P17 / 0 rows / delete allowed; after: refused)',
      m === '01:owner,02:manager,03:staff,04:viewer' && (installed ? [ins, upd, del].every(refused) : true), { ins: [ins.status, ins.code], upd: [upd.status, upd.rows], del: [del.status, del.rows], members: m });
    ok('C2 old app: dashboard layout still reads the caller\'s own role', own.status === 200 && own.body?.[0]?.workspace_members?.[0]?.role === 'staff', { status: own.status });
    await resetFarm();
  }
  if (!installed || process.argv.includes('--compat-only')) { await db.end(); console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0; return; }

  // ── list ──
  for (const who of ['owner', 'manager', 'staff', 'viewer']) {
    const r = await rpc(who, 'list_workspace_members', { p_workspace: farmWs });
    const keys = r.body?.[0] ? Object.keys(r.body[0]).sort().join(',') : '';
    ok(`L ${who} sees the member list (4, name / avatar / role only)`, r.status === 200 && r.rows === 4 && keys === 'avatar_url,full_name,is_me,member_id,role,user_id', { status: r.status, rows: r.rows, keys });
  }
  { const r = await rpc('stranger', 'list_workspace_members', { p_workspace: farmWs }); ok('L stranger cannot list', refused(r), { status: r.status, code: r.code }); }
  { const r = await rpc('owner', 'list_workspace_members', { p_workspace: shopWs });
    ok('L owner WITHOUT an owner row sees themselves as owner', r.status === 200 && r.rows === 1 && r.body[0].role === 'owner' && r.body[0].member_id === null, { rows: r.rows, role: r.body?.[0]?.role }); }

  // ── invite matrix ──
  const inv = (who, invitee, role, ws = farmWs) => rpc(who, 'invite_workspace_member', { p_workspace: ws, p_invitee: uid(invitee), p_role: role });
  const cases = [
    ['owner invites manager', 'owner', 'buyer', 'manager', true], ['owner invites staff', 'owner', 'stranger', 'staff', true],
    ['manager invites staff', 'manager', 'newuser', 'staff', true],
  ];
  for (const [n, who, invitee, role, expect] of cases) { const r = await inv(who, invitee, role); ok(`I ${n}`, expect ? r.status === 200 : refused(r), { status: r.status, code: r.code }); }
  await q(`delete from workspace_invitations where workspace_id = $1`, [farmWs]);
  const refusedCases = [
    ['manager invites a manager', 'manager', 'newuser', 'manager'], ['staff invites a viewer', 'staff', 'newuser', 'viewer'],
    ['viewer invites a viewer', 'viewer', 'newuser', 'viewer'], ['stranger invites', 'stranger', 'newuser', 'viewer'],
    ['owner role cannot be invited', 'owner', 'newuser', 'owner'], ['owner invites themselves', 'owner', 'owner', 'staff'],
    ['manager invites the entity owner', 'manager', 'owner', 'staff'], ['owner invites an existing member', 'owner', 'staff', 'viewer'],
  ];
  for (const [n, who, invitee, role] of refusedCases) { const r = await inv(who, invitee, role); ok(`I ${n}: refused`, refused(r), { status: r.status, code: r.code }); }
  { const r = await rpc('owner', 'invite_workspace_member', { p_workspace: personalWs, p_invitee: uid('newuser'), p_role: 'viewer' }); ok('I personal workspace: refused', refused(r), { status: r.status }); }
  { const a = await inv('owner', 'newuser', 'viewer'), b = await inv('owner', 'newuser', 'staff');
    ok('I duplicate pending invitation refused', a.status === 200 && refused(b), { first: a.status, second: b.status, code: b.code }); }
  { const r = await inv('owner', 'buyer', 'manager', shopWs); ok('I owner WITHOUT an owner row can invite (authority from the shop)', r.status === 200, { status: r.status }); }
  ok('I no membership was created by inviting', (await members(farmWs)) === '01:owner,02:manager,03:staff,04:viewer' && (await members(shopWs)) === '', { farm: await members(farmWs), shop: await members(shopWs) });

  // ── invitation lists ──
  await q(`delete from workspace_invitations where workspace_id in ($1, $2)`, [farmWs, shopWs]);
  await inv('owner', 'buyer', 'manager'); await inv('manager', 'newuser', 'staff');
  { const o = await rpc('owner', 'list_workspace_invitations', { p_workspace: farmWs }), m = await rpc('manager', 'list_workspace_invitations', { p_workspace: farmWs }), s = await rpc('staff', 'list_workspace_invitations', { p_workspace: farmWs });
    ok('V owner sees both pending, manager only the staff / viewer one, staff refused', o.rows === 2 && m.rows === 1 && m.body[0].role === 'staff' && refused(s), { owner: o.rows, manager: m.rows, staff: s.status }); }
  { const b = await rpc('buyer', 'get_my_workspace_invitations'), x = await rpc('stranger', 'get_my_workspace_invitations');
    const i = b.body?.[0] ?? {};
    ok('V invitee sees business name / type, inviter name, role; others see none', b.rows === 1 && i.business_name && i.workspace_type === 'farm' && i.invited_by_name !== undefined && i.role === 'manager' && x.rows === 0, { rows: b.rows, type: i.workspace_type, role: i.role, other: x.rows }); }

  // ── respond ──
  const myInv = async (who) => (await rpc(who, 'get_my_workspace_invitations')).body?.[0]?.invitation_id;
  const respond = (who, id, action) => rpc(who, 'respond_workspace_invitation', { p_invitation: id, p_action: action });
  { const id = await myInv('newuser'); const r = await respond('newuser', id, 'decline');
    ok('R decline → declined, no membership; re-invite possible', r.body === 'declined' && !(await members(farmWs)).includes('08:') && (await inv('manager', 'newuser', 'staff')).status === 200, { r: r.body }); }
  { const id = await myInv('buyer'); const x = await respond('stranger', id, 'accept');
    ok('R someone else cannot answer the invitation (404)', x.status === 404, { status: x.status, code: x.code });
    const a = await respond('buyer', id, 'accept'), b = await respond('buyer', id, 'accept');
    ok('R accept → member as manager; accept again → same result, one row', a.body === 'accepted' && b.body === 'accepted' && (await members(farmWs)).includes('05:manager')
      && (await q(`select count(*)::int c from workspace_members where workspace_id = $1 and user_id = $2`, [farmWs, uid('buyer')]))[0].c === 1, { a: a.body, b: b.body }); }
  { const id = await myInv('newuser'); await q(`update workspace_invitations set expires_at = now() - interval '1 minute' where id = $1`, [id]);
    const r = await respond('newuser', id, 'accept');
    ok('R expired invitation → expired, no membership', r.body === 'expired' && !(await members(farmWs)).includes('08:'), { r: r.body }); }
  { await inv('manager', 'newuser', 'staff'); const id = await myInv('newuser');
    await q(`update workspace_members set role = 'viewer' where workspace_id = $1 and user_id = $2`, [farmWs, uid('manager')]);   // inviter demoted
    const r = await respond('newuser', id, 'accept');
    await q(`update workspace_members set role = 'manager' where workspace_id = $1 and user_id = $2`, [farmWs, uid('manager')]);
    ok('R inviter lost the right (manager → viewer) → invalid_inviter, no membership', r.body === 'invalid_inviter' && !(await members(farmWs)).includes('08:'), { r: r.body }); }
  { await inv('manager', 'newuser', 'viewer'); const id = await myInv('newuser');
    const mid = await memberId(farmWs, 'manager'); await q(`delete from workspace_members where id = $1`, [mid]);                    // inviter removed
    const r = await respond('newuser', id, 'accept');
    await q(`insert into workspace_members (workspace_id, user_id, role) values ($1, $2, 'manager')`, [farmWs, uid('manager')]);
    ok('R inviter removed → invalid_inviter, no membership', r.body === 'invalid_inviter' && !(await members(farmWs)).includes('08:'), { r: r.body }); }
  { const [id] = (await q(`insert into workspace_invitations (workspace_id, invitee_id, invited_by, role) values ($1, $2, $3, 'manager') returning id`, [farmWs, uid('staff'), uid('owner')])).map((r) => r.id);
    const r = await respond('staff', id, 'accept');
    ok('R invitee already a member (staff) → already_member, role NOT changed', r.body === 'already_member' && (await members(farmWs)).includes('03:staff'), { r: r.body }); }

  // ── cancel ──
  { await inv('owner', 'newuser', 'manager'); const id = (await rpc('owner', 'list_workspace_invitations', { p_workspace: farmWs })).body.find((x) => x.role === 'manager' && x.invitee_id === uid('newuser'))?.invitation_id;
    const m = await rpc('manager', 'cancel_workspace_invitation', { p_invitation: id }), s = await rpc('staff', 'cancel_workspace_invitation', { p_invitation: id });
    const o = await rpc('owner', 'cancel_workspace_invitation', { p_invitation: id }); const a = await respond('newuser', id, 'accept');
    ok('X manager cannot cancel a manager invitation, staff cannot cancel; owner cancels; accept afterwards refused', refused(m) && refused(s) && o.body === 'cancelled' && refused(a) && !(await members(farmWs)).includes('08:'), { m: m.status, s: s.status, o: o.body, accept: a.status }); }

  // ── role changes ──
  const setRole = (who, target, role) => memberId(farmWs, target).then((id) => rpc(who, 'set_workspace_member_role', { p_member: id, p_role: role }));
  { const r = [await setRole('manager', 'staff', 'manager'), await setRole('manager', 'buyer', 'staff'), await setRole('manager', 'manager', 'staff'),
               await setRole('staff', 'viewer', 'staff'), await setRole('owner', 'owner', 'manager'), await setRole('stranger', 'viewer', 'staff')];
    ok('S refused: manager → staff becomes manager, manager changes a manager, manager changes own role, staff changes, owner row, stranger',
      r.every(refused) && (await members(farmWs)).includes('02:manager') && (await members(farmWs)).includes('03:staff'), { s: r.map((x) => x.status) }); }
  { const a = await setRole('manager', 'staff', 'viewer'), b = await setRole('manager', 'staff', 'staff'), c = await setRole('owner', 'buyer', 'staff'), d = await setRole('owner', 'buyer', 'manager');
    ok('S allowed: manager staff ↔ viewer; owner manager ↔ staff', [a, b, c, d].every((x) => x.status === 200) && (await members(farmWs)).includes('03:staff') && (await members(farmWs)).includes('05:manager'), { s: [a.status, b.status, c.status, d.status] }); }

  // ── removal / leaving ──
  const remove = (who, target, ws = farmWs) => memberId(ws, target).then((id) => rpc(who, 'remove_workspace_member', { p_member: id }));
  { const r = [await remove('manager', 'buyer'), await remove('staff', 'viewer'), await remove('stranger', 'viewer'), await remove('owner', 'owner'), await remove('manager', 'owner')];
    ok('D refused: manager removes a manager, staff removes viewer, stranger, owner leaves, manager removes owner row', r.every(refused) && (await members(farmWs)) === '01:owner,02:manager,03:staff,04:viewer,05:manager', { s: r.map((x) => x.status), m: await members(farmWs) }); }
  { const a = await remove('owner', 'buyer'); ok('D owner removes a manager', a.body === 'removed' && !(await members(farmWs)).includes('05:'), { r: a.body }); }
  { await inv('manager', 'newuser', 'viewer'); await respond('newuser', await myInv('newuser'), 'accept');
    const a = await remove('manager', 'newuser'); ok('D manager removes a viewer', a.body === 'removed' && !(await members(farmWs)).includes('08:'), { r: a.body }); }
  for (const who of ['viewer', 'staff', 'manager']) {
    const r = await remove(who, who); ok(`D ${who} leaves`, r.body === 'left' && !(await members(farmWs)).includes(`${U[who]}:`), { r: r.body });
  }
  await resetFarm();

  // ── direct access refused ──
  { const a = await rest('owner', 'GET', 'workspace_invitations?select=id'), b = await rest('owner', 'POST', 'workspace_invitations', { workspace_id: farmWs, invitee_id: uid('newuser'), invited_by: uid('owner'), role: 'staff' });
    ok('T workspace_invitations: no direct read / write for API users', refused(a) && refused(b), { read: a.status, write: b.status }); }
  { const r = await rest('stranger', 'GET', `workspace_members?workspace_id=eq.${farmWs}&select=user_id`); ok('T stranger reads no members of another business', r.status === 200 && r.rows === 0, { rows: r.rows }); }
  { const r = await rest('staff', 'GET', `workspace_members?workspace_id=eq.${farmWs}&select=user_id,role`); ok('T member reads the rows of their own business (no recursion error)', r.status === 200 && r.rows === 4, { status: r.status, rows: r.rows }); }

  // ── owner membership for businesses without an owner row ──
  { const s = await rpc('stranger', 'ensure_workspace_owner_membership', { p_workspace: shopWs }), m = await rpc('manager', 'ensure_workspace_owner_membership', { p_workspace: farmWs });
    const a = await rpc('owner', 'ensure_workspace_owner_membership', { p_workspace: shopWs }), b = await rpc('owner', 'ensure_workspace_owner_membership', { p_workspace: shopWs });
    const p = await rpc('owner', 'ensure_workspace_owner_membership', { p_workspace: personalWs });
    ok('O ensure owner row: stranger / manager refused; real owner creates it, repeat is a no-op; personal refused',
      refused(s) && refused(m) && a.body === 'owner' && b.body === 'owner' && (await members(shopWs)) === '01:owner' && refused(p), { s: s.status, m: m.status, a: a.body, b: b.body, shop: await members(shopWs), personal: p.status }); }

  // ── concurrency ──
  {
    let dups = 0, mixed = []; for (let i = 0; i < 10; i++) {
      await q(`delete from workspace_invitations where workspace_id = $1`, [farmWs]); await q(`delete from workspace_members where workspace_id = $1 and user_id = $2`, [farmWs, uid('newuser')]);
      await inv('owner', 'newuser', 'staff'); const id = await myInv('newuser');
      const [a, c] = await Promise.all([respond('newuser', id, 'accept'), rpc('owner', 'cancel_workspace_invitation', { p_invitation: id })]);
      const st = (await q(`select status from workspace_invitations where id = $1`, [id]))[0].status;
      const n = (await q(`select count(*)::int c from workspace_members where workspace_id = $1 and user_id = $2`, [farmWs, uid('newuser')]))[0].c;
      if (!((st === 'accepted' && n === 1 && a.body === 'accepted' && refused(c)) || (st === 'cancelled' && n === 0 && c.body === 'cancelled' && refused(a)))) dups++;
      mixed.push(st[0]);
    }
    ok('K accept vs cancel at the same time ×10 → always one consistent outcome', dups === 0, { outcomes: mixed.join('') });
  }
  {
    await q(`delete from workspace_invitations where workspace_id = $1`, [farmWs]); await q(`delete from workspace_members where workspace_id = $1 and user_id = $2`, [farmWs, uid('newuser')]);
    await inv('owner', 'newuser', 'staff'); const id = await myInv('newuser');
    const rs = await Promise.all([1, 2, 3].map(() => respond('newuser', id, 'accept')));
    const n = (await q(`select count(*)::int c from workspace_members where workspace_id = $1 and user_id = $2`, [farmWs, uid('newuser')]))[0].c;
    ok('K accept ×3 at once → one membership', n === 1 && rs.every((r) => r.body === 'accepted'), { n, r: rs.map((r) => r.body) });
  }
  {
    await q(`delete from workspace_invitations where workspace_id = $1`, [farmWs]);
    const rs = await Promise.all([1, 2, 3].map(() => inv('owner', 'stranger', 'viewer')));
    const n = (await q(`select count(*)::int c from workspace_invitations where workspace_id = $1 and invitee_id = $2 and status = 'pending'`, [farmWs, uid('stranger')]))[0].c;
    ok('K three invites for the same person at once → one pending', n === 1 && rs.filter((r) => r.status === 200).length === 1, { n, s: rs.map((r) => r.status) });
  }
  {
    await q(`delete from workspace_invitations where workspace_id = $1`, [farmWs]); await q(`delete from workspace_members where workspace_id = $1 and user_id = $2`, [farmWs, uid('buyer')]);
    const mid = await memberId(farmWs, 'manager');
    const [d, i] = await Promise.all([rpc('owner', 'set_workspace_member_role', { p_member: mid, p_role: 'viewer' }), inv('manager', 'buyer', 'staff')]);
    const id = await myInv('buyer'); const a = id ? await respond('buyer', id, 'accept') : { body: 'no invitation' };
    ok('K owner demotes a manager while that manager invites → no membership from the stale invitation', d.status === 200 && !(await members(farmWs)).includes('05:'), { demote: d.status, invite: i.status, accept: a.body });
    await q(`update workspace_members set role = 'manager' where id = $1`, [mid]);
  }

  // ── unchanged: business powers, sign-up ──
  await resetFarm();
  ok('B farm permission functions per role identical to the baseline (team, privacy, weight, transfer, reservation)', (await fns()) === fnBaseline, { now: await fns() });
  { const id = '00000000-0000-4000-8000-00000000ac01'; await q(`delete from auth.users where id = $1`, [id]);
    await q(`insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'whiskora-qa+wsm-signup@example.com', '{"full_name":"QA WSM"}', now(), now())`, [id]);
    const w = await q(`select w.type, m.role from workspaces w join workspace_members m on m.workspace_id = w.id where w.owner_id = $1`, [id]); await q(`delete from auth.users where id = $1`, [id]);
    ok('B sign-up still creates the personal workspace + owner row', w.length === 1 && w[0].type === 'personal' && w[0].role === 'owner', w); }
  await resetFarm();
  await db.end();
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch((e) => { console.log('ERROR', e.message); process.exitCode = 2; });
