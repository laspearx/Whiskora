// Public grants clean-up (20261101140000) on whiskora-staging: real REST calls with synthetic QA accounts + catalog /
// rolled-back SQL probes. Runs on the before and after schema. TRUNCATE is only ever tried on STAGING inside a
// transaction that is rolled back. Prints PASS/FAIL with statuses only.
// usage: fixtures (transfer_access_reset + workspace_guard) applied, then
//        NODE_PATH=<dir with pg> STAGING_ANON_KEY=<staging anon key> node supabase/tests/public_grants_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const ID = { owner: 'a0000000-0000-4000-8000-000000000001', stranger: 'a0000000-0000-4000-8000-000000000006', admin: 'a0000000-0000-4000-8000-000000000007' };
const PUBLIC_PET = 900012, PRIVATE_PET = 900011;
let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${n} :: ${JSON.stringify(i)}`); };
const toks = {};
async function tok(who) {
  if (who === 'anon') return null; if (toks[who]) return toks[who];
  const d = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `whiskora-qa+${who}@example.com`, password: PW }) })).json();
  return (toks[who] = d.access_token);
}
async function rest(who, method, path, body, prefer = 'return=representation') {
  const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: prefer }; const t = await tok(who); if (t) h.Authorization = `Bearer ${t}`;
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, body: b };
}
const rpc = (who, fn, args = {}) => rest(who, 'POST', `rpc/${fn}`, args);

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const after = (await q(`select not has_function_privilege('anon', 'public.admin_get_stats()', 'execute') a`))[0].a;
  console.log(`schema: ${after ? 'AFTER (cleaned up)' : 'BEFORE'}\n`);

  // ---- catalog ----
  const extra = (await q(`select count(*)::int c from information_schema.role_table_grants where table_schema = 'public'
      and grantee in ('anon', 'authenticated', 'PUBLIC') and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')`))[0].c;
  ok('G1 no TRUNCATE / TRIGGER / REFERENCES for anon / authenticated / PUBLIC on public tables', extra === 0, { grants: extra });
  const crud = (await q(`select md5(string_agg(table_name || grantee || privilege_type, ',' order by table_name, grantee, privilege_type)) m, count(*)::int n
      from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')`))[0];
  // column privileges without REFERENCES (table-level REFERENCES shows up per column; the clean-up removes it on purpose)
  const cols = (await q(`select md5(string_agg(table_name || column_name || grantee || privilege_type, ',' order by 1)) m from information_schema.column_privileges
      where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type <> 'REFERENCES' and table_name not like 'qa_push_mock%'`))[0].m;
  console.log(`info CRUD table grants n=${crud.n} md5=${crud.m}; column grants md5=${cols}`);

  // ---- TRUNCATE (staging, rolled back) ----
  for (const role of ['anon', 'authenticated']) {
    let res;
    await q('begin');
    try { await q(`set local role ${role}`); await q('truncate table public.analytics_events'); res = 'allowed'; }
    catch (e) { res = e.code; }
    await q('rollback');
    ok(`G2 ${role} cannot TRUNCATE (staging, rolled back)`, res === '42501', { result: res });
  }

  // ---- RPCs by real caller ----
  { const a = await rpc('anon', 'get_pet_health', { p_pet_id: PUBLIC_PET }), b = await rpc('anon', 'get_pet_pedigree', { p_pet_id: PUBLIC_PET, p_max_gen: 3 }), c = await rpc('anon', 'get_my_pet_access', { p_pet_id: PUBLIC_PET });
    ok('G3 anon public-pet RPCs still work (/p/[id]: health, pedigree, my access)', a.status === 200 && b.status === 200 && c.status === 200, { s: [a.status, b.status, c.status] }); }
  { const a = await rpc('admin', 'admin_get_stats'), n = await rpc('owner', 'admin_get_stats'), x = await rpc('anon', 'admin_get_stats');
    ok('G4 admin_get_stats: admin 200, non-admin refused, anon refused', a.status === 200 && n.status >= 400 && x.status >= 400, { admin: a.status, user: n.status, anon: x.status, anon_code: x.code }); }
  { const a = await rpc('admin', 'admin_get_users', { p_search: '', p_limit: 5, p_offset: 0 }); ok('G5 admin_get_users (3 args) works for the admin', a.status === 200, { status: a.status }); }
  { const u = await rpc('owner', 'get_my_pending_transfers'), x = await rpc('anon', 'get_my_pending_transfers');
    ok('G6 get_my_pending_transfers: signed-in 200; anon refused after', u.status === 200 && (after ? x.status >= 400 : true), { user: u.status, anon: x.status }); }
  { const x = await rpc('anon', 'resolve_pet_tags', { p_pet_id: PRIVATE_PET, p_viewer: ID.owner }), s = await rpc('stranger', 'resolve_pet_tags', { p_pet_id: PRIVATE_PET, p_viewer: ID.owner });
    ok('G7 resolve_pet_tags cannot be called directly (anon / signed-in) — no probing of other viewers\' relations', x.status >= 400 && s.status >= 400, { anon: x.status, user: s.status }); }
  { const v = await rpc('stranger', 'search_users_for_invite', { p_query: 'whiskora-qa+owner@example.com' }), f = await rpc('owner', 'find_user_by_email', { p_email: 'whiskora-qa+buyer@example.com' });
    ok('G8 signed-in RPCs still work (search_users_for_invite, find_user_by_email)', v.status === 200 && f.status === 200, { s: [v.status, f.status] }); }
  { const h = await rpc('owner', 'get_pet_health', { p_pet_id: PRIVATE_PET }), p = await rpc('owner', 'get_pet_pedigree_fields', { p_pet_id: PRIVATE_PET }), m = await rpc('owner', 'get_my_profile');
    ok('G9 owner RPCs still work (health, pedigree fields, my profile)', h.status === 200 && h.rows > 0 && p.status === 200 && m.status === 200, { s: [h.status, p.status, m.status] }); }

  // ---- inserts through sequences ----
  { const r = await rest('anon', 'POST', 'contact_leads', { channel: 'qa-grants', pet_id: PUBLIC_PET }, 'return=minimal');
    await q(`delete from contact_leads where channel = 'qa-grants'`);
    ok('G10 anon insert with an identity id (contact_leads) still works', r.status === 201, { status: r.status, code: r.code }); }
  { const r = await rest('owner', 'POST', 'pet_weights', { pet_id: PRIVATE_PET, weight: 1.23, user_id: ID.owner });
    await q(`delete from pet_weights where pet_id = $1 and weight = 1.23`, [PRIVATE_PET]);
    ok('G11 signed-in insert with an identity id (pet_weights) still works', r.status === 201, { status: r.status, code: r.code }); }
  { const r = await rest('owner', 'POST', 'farms', { user_id: ID.owner, farm_name: 'QA-GRANTS farm', phone: '000' });
    const fid = r.body?.[0]?.id;
    const w = fid ? await rest('owner', 'POST', 'workspaces', { type: 'farm', name: 'QA-GRANTS ws', owner_id: ID.owner, entity_id: fid }) : null;
    if (fid) { await q(`delete from workspaces where type = 'farm' and entity_id = $1`, [fid]); await q(`delete from farms where id = $1`, [fid]); }
    ok('G12 business creation (new farm + its workspace) still works', r.status === 201 && w?.status === 201, { farm: r.status, ws: w?.status }); }
  { const r = await rest('owner', 'POST', 'farm_verifications', { farm_id: 9001, user_id: ID.owner, status: 'pending' }, 'return=minimal');
    await q(`delete from farm_verifications where farm_id = 9001 and user_id = $1`, [ID.owner]);
    const seqOk = (await q(`select has_sequence_privilege('authenticated', 'public.farm_verifications_id_seq', 'usage') u, has_sequence_privilege('anon', 'public.farm_verifications_id_seq', 'usage') a`))[0];
    ok('G13 serial sequence: authenticated keeps USAGE (farm verification insert outcome unchanged), anon has none after', seqOk.u === true && (after ? seqOk.a === false : true), { status: r.status, code: r.code, ...seqOk }); }

  // ---- sign-up / name sync (system triggers keep working without EXECUTE for API roles) ----
  { const uid = '00000000-0000-4000-8000-00000000ab01';
    await q(`delete from auth.users where id = $1`, [uid]);
    await q(`insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
             values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'whiskora-qa+grants-signup@example.com', '{"full_name":"QA Grants"}', now(), now())`, [uid]);
    const w = await q(`select w.type, m.role from workspaces w join workspace_members m on m.workspace_id = w.id where w.owner_id = $1`, [uid]);
    const p = await q(`select id from profiles where id = $1`, [uid]);
    await q(`delete from auth.users where id = $1`, [uid]);
    ok('G14 sign-up trigger still creates profile + personal workspace', w.length === 1 && w[0].role === 'owner' && p.length === 1, { ws: w.length, profile: p.length }); }
  { const prev = (await q(`select full_name from profiles where id = $1`, [ID.owner]))[0].full_name;
    const r = await rest('owner', 'PATCH', `profiles?id=eq.${ID.owner}`, { full_name: 'QA Grants Sync' }, 'return=minimal');
    const synced = (await q(`select name from workspaces where owner_id = $1 and type = 'personal'`, [ID.owner]))[0].name === 'QA Grants Sync';
    await rest('owner', 'PATCH', `profiles?id=eq.${ID.owner}`, { full_name: prev }, 'return=minimal');
    ok('G15 profile name sync trigger still runs', r.status === 204 && synced, { status: r.status, synced }); }

  // ---- default privileges for new objects (created as postgres, rolled back) ----
  { await q('begin');
    await q(`create table public.qa_grants_probe (id bigint generated always as identity primary key, x text)`);
    await q(`create function public.qa_grants_probe_fn() returns int language sql as 'select 1'`);
    const t = (await q(`select string_agg(privilege_type, ',' order by privilege_type) p from information_schema.role_table_grants where table_schema = 'public' and table_name = 'qa_grants_probe' and grantee = 'anon'`))[0].p;
    const fAnon = (await q(`select has_function_privilege('anon', 'public.qa_grants_probe_fn()', 'execute') a, has_function_privilege('authenticated', 'public.qa_grants_probe_fn()', 'execute') u`))[0];
    await q('rollback');
    ok('G16 new table: no TRUNCATE / TRIGGER / REFERENCES for anon; new function: not executable by anon / PUBLIC, executable by authenticated',
      after ? (!/TRUNCATE|TRIGGER|REFERENCES/.test(t ?? '') && fAnon.a === false && fAnon.u === true) : false, { anon_table: t, fn: fAnon }); }

  await db.end();
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch((e) => { console.log('ERROR', e.message); process.exitCode = 2; });
