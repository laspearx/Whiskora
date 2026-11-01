// Atomic business create (20261101160000 create_business; 20261101170000 direct INSERT closed) — real REST on
// whiskora-staging with synthetic QA accounts. Every business created here is named "QA-CB …" and removed at the end.
// Fault injection: staging-only triggers (qa_cb_fault) are created for the failure checks and dropped in `finally`.
// Prints PASS/FAIL with statuses / codes only.
// usage: NODE_PATH=<dir with pg> STAGING_ANON_KEY=<key> node supabase/tests/create_business_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const U = { owner: '01', stranger: '06', newuser: '08' };
const uid = (who) => `a0000000-0000-4000-8000-0000000000${U[who]}`;
const key = () => crypto.randomUUID();
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
const create = (who, type, fields, k = key()) => rpc(who, 'create_business', { p_type: type, p_fields: fields, p_request_key: k });
async function upload(who, bucket, path) {
  const r = await fetch(`${SB}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${await tok(who)}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: Buffer.from('qa-synthetic') });
  return r.status;
}
const removeObj = async (who, bucket, path) => (await fetch(`${SB}/storage/v1/object/${bucket}/${path}`, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${await tok(who)}` } })).status;
const pub = (path) => `${SB}/storage/v1/object/public/partner-photos/${path}`;

const base = (type, name, extra = {}) => ({
  [`${type}_name`]: name, owner_name: 'QA Synthetic', phone: '0800000000', province: 'กรุงเทพมหานคร', lat: 13.75, lng: 100.5,
  bio: 'synthetic', ...(type === 'farm' ? { species: 'cat' } : { supported_species: ['dog', 'cat', 'dog'] }),
  ...(type === 'service' ? { category: 'grooming' } : {}), ...extra });

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const counts = async () => (await q(`select (select count(*) from farms) f, (select count(*) from shops) s, (select count(*) from services) v,
      (select count(*) from workspaces) w, (select count(*) from workspace_members) m, (select count(*) from business_create_requests) r`))[0];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const phase2 = !(await q(`select has_table_privilege('authenticated', 'public.shops', 'INSERT') p`))[0].p;
  console.log(`schema: create_business ${(await q(`select to_regprocedure('public.create_business(text,jsonb,uuid)') is not null a`))[0].a ? 'installed' : 'MISSING'}; direct INSERT ${phase2 ? 'closed (20261101170000)' : 'still open'}\n`);

  const cleanup = async () => {
    for (const [t, col] of [['farms', 'farm_name'], ['shops', 'shop_name'], ['services', 'service_name']]) {
      const typ = t === 'farms' ? 'farm' : t === 'shops' ? 'shop' : 'service';
      await q(`delete from workspaces where type = $1 and entity_id in (select id from ${t} where ${col} like 'QA-CB%')`, [typ]);
      await q(`delete from ${t} where ${col} like 'QA-CB%'`);
    }
    await q(`delete from business_create_requests where user_id = any($1::uuid[])`, [[uid('owner'), uid('stranger'), uid('newuser')]]);
  };
  const dropFaults = async () => {
    for (const t of ['farms', 'shops', 'services', 'workspaces', 'workspace_members', 'business_create_requests'])
      await q(`drop trigger if exists qa_cb_fault on public.${t}`);
    await q(`drop function if exists public.qa_cb_fault()`);
  };
  const files = { mine: `shops/${uid('newuser')}/qa-cb-logo.jpg`, mineFarm: `farms/${uid('newuser')}/qa-cb-logo.jpg`, theirs: `shops/${uid('stranger')}/qa-cb-logo.jpg` };
  const savedOrigin = (await q(`select value from platform_settings where key = 'storage_public_origin'`).catch(() => []))[0]?.value;
  try {
    await dropFaults(); await cleanup();
    ok('S0 synthetic photos uploaded by their owners', (await upload('newuser', 'partner-photos', files.mine)) === 200
      && (await upload('newuser', 'partner-photos', files.mineFarm)) === 200 && (await upload('stranger', 'partner-photos', files.theirs)) === 200);
    const c0 = await counts();

    // ── access ──
    { const r = await create('anon', 'shop', base('shop', 'QA-CB anon')); ok('A1 anon cannot call', r.status === 401, { status: r.status, code: r.code }); }
    { const r = await rest('newuser', 'GET', 'business_create_requests?select=*'); ok('A2 request claims not readable by the API', r.status >= 400, { status: r.status, code: r.code }); }

    // ── happy path, per type ──
    const made = {};
    for (const type of ['farm', 'shop', 'service']) {
      const k = key();
      const r = await create('newuser', type, base(type, `QA-CB ${type} 1`, { image_url: pub(type === 'farm' ? files.mineFarm : type === 'shop' ? files.mine : files.mine.replace('shops/', 'services/')) }), k);
      // service photo does not exist → expect refusal; create service again without photo
      if (type === 'service') {
        ok('B0 service: photo that was never uploaded is refused', r.status === 400 && r.code === '22023', { status: r.status, code: r.code });
        const r2 = await create('newuser', type, base(type, `QA-CB ${type} 1`), k);
        made[type] = { ...r2.body?.[0], k, status: r2.status };
      } else made[type] = { ...r.body?.[0], k, status: r.status };
      const m = made[type]; const tbl = type + (type === 'farm' ? 's' : type === 'shop' ? 's' : 's');
      const ent = (await q(`select * from ${tbl} where id = $1`, [m.entity_id]))[0];
      const ws = (await q(`select * from workspaces where id = $1`, [m.workspace_id]))[0];
      const mem = await q(`select user_id, role from workspace_members where workspace_id = $1`, [m.workspace_id]);
      ok(`B1 ${type}: entity + workspace + owner row, all for the caller`, m.status === 200 && m.replayed === false && ent?.user_id === uid('newuser')
        && ws?.type === type && ws.entity_id == m.entity_id && ws.owner_id === uid('newuser') && mem.length === 1 && mem[0].user_id === uid('newuser') && mem[0].role === 'owner',
        { status: m.status, members: mem.length });
      ok(`B2 ${type}: system fields keep their defaults`, type === 'farm' ? ent.is_verified === false && ent.verification_status === null && ent.verified_at === null
        : type === 'service' ? ent.is_published === false && ent.category === 'grooming' && ent.supported_species === 'dog,cat' : ent.supported_species === 'dog,cat',
        { species: ent.supported_species ?? ent.species });
    }
    ok('B3 farm / shop keep the uploaded photo; workspace avatar = photo', (await q(`select count(*)::int n from workspaces where id = any($1::uuid[]) and avatar_url like '%qa-cb-logo.jpg'`, [[made.farm.workspace_id, made.shop.workspace_id]]))[0].n === 2);

    // ── idempotency ──
    { const before = await counts();
      const r = await create('newuser', 'shop', base('shop', 'QA-CB shop 1', { image_url: pub(files.mine) }), made.shop.k);
      ok('I1 same key + same data → same business, replayed, nothing new', r.status === 200 && r.body?.[0]?.entity_id === made.shop.entity_id && r.body[0].replayed === true && same(before, await counts()), { status: r.status });
      const r2 = await create('newuser', 'shop', base('shop', 'QA-CB shop 1 changed'), made.shop.k);
      ok('I2 same key + other data → refused, nothing new', r2.status === 400 && r2.code === 'P0001' && same(before, await counts()), { status: r2.status, code: r2.code });
      const r3 = await create('stranger', 'shop', base('shop', 'QA-CB stranger same key'), made.shop.k);
      const own = r3.body?.[0] && (await q(`select user_id from shops where id = $1`, [r3.body[0].entity_id]))[0]?.user_id;
      ok('I3 another user with the same key gets their own business (no leak of the first)', r3.status === 200 && r3.body[0].entity_id !== made.shop.entity_id && r3.body[0].replayed === false && own === uid('stranger'), { status: r3.status });
      const r4 = await create('newuser', 'shop', base('shop', 'QA-CB shop 1', { image_url: pub(files.mine) }));
      ok('I4 new key → a second business is allowed', r4.status === 200 && r4.body?.[0]?.entity_id !== made.shop.entity_id, { status: r4.status }); }

    // ── forged owner / system fields / bad input ──
    for (const [n, extra] of [['user_id', { user_id: uid('owner') }], ['owner_id', { owner_id: uid('owner') }], ['role', { role: 'owner' }], ['id', { id: 1 }],
      ['created_at', { created_at: '2020-01-01' }], ['is_verified', { is_verified: true }], ['verification_status', { verification_status: 'approved' }],
      ['is_published', { is_published: true }], ['entity_id', { entity_id: 9001 }]]) {
      const before = await counts(); const r = await create('newuser', n === 'is_published' ? 'service' : n.startsWith('verif') || n === 'is_verified' ? 'farm' : 'shop', base(n === 'is_published' ? 'service' : n.startsWith('verif') || n === 'is_verified' ? 'farm' : 'shop', 'QA-CB forged', extra));
      ok(`F1 field ${n} refused, nothing written`, r.status === 400 && r.code === '22023' && same(before, await counts()), { status: r.status, code: r.code });
    }
    { const before = await counts(); const r = await rpc('newuser', 'create_business', { p_type: 'shop', p_fields: base('shop', 'QA-CB forged arg'), p_request_key: key(), p_owner: uid('owner') });
      ok('F2 extra owner argument → no such function, nothing written', r.status >= 400 && same(before, await counts()), { status: r.status, code: r.code }); }
    for (const [n, type, fields] of [
      ['someone else\'s photo', 'shop', base('shop', 'QA-CB x', { image_url: pub(files.theirs) })],
      ['photo from another type folder', 'shop', base('shop', 'QA-CB x', { image_url: pub(files.mineFarm) })],
      ['external photo URL', 'shop', base('shop', 'QA-CB x', { cover_url: 'https://example.com/a.jpg' })],
      ['personal type', 'personal', base('shop', 'QA-CB x')],
      ['missing name', 'shop', { ...base('shop', 'QA-CB x'), shop_name: '  ' }],
      ['missing lat', 'farm', { ...base('farm', 'QA-CB x'), lat: null }],
      ['name too long', 'shop', base('shop', 'QA-CB ' + 'x'.repeat(130))],
      ['lat out of range', 'shop', base('shop', 'QA-CB x', { lat: 120 })],
      ['species not a list', 'shop', base('shop', 'QA-CB x', { supported_species: 'dog' })],
      ['bad category', 'service', base('service', 'QA-CB x', { category: 'DROP TABLE' })],
      ['name not text', 'shop', base('shop', 'QA-CB x', { shop_name: 5 })]]) {
      const before = await counts(); const r = await create('newuser', type, fields);
      ok(`F3 ${n} refused, nothing written`, r.status === 400 && r.code === '22023' && same(before, await counts()), { status: r.status, code: r.code });
    }
    { const before = await counts(); const r = await rpc('newuser', 'create_business', { p_type: 'shop', p_fields: base('shop', 'QA-CB x'), p_request_key: null });
      ok('F4 missing request key refused', r.status === 400 && same(before, await counts()), { status: r.status, code: r.code }); }

    // ── photo origin: only this environment's Storage origin (platform_settings), canonical URL stored ──
    { const path = files.mine; const host = (h) => `${h}/storage/v1/object/public/partner-photos/${path}`;
      for (const [n, u] of [['another website', host('https://evil.example')], ['another Supabase project', host('https://zzzzzzzzzzzzzzzzzzzz.supabase.co')],
        ['http instead of https', host(SB.replace('https://', 'http://'))], ['look-alike host', host(SB + '.evil.example')],
        ['query string', pub(path) + '?x=1'], ['protocol-relative', '//' + host(SB).slice(8)]]) {
        const before = await counts(); const r = await create('newuser', 'shop', base('shop', 'QA-CB host', { image_url: u }));
        ok(`H1 own photo but ${n} → refused, nothing written`, r.status === 400 && r.code === '22023' && same(before, await counts()), { status: r.status, code: r.code });
      }
      const k = key(); const r = await create('newuser', 'shop', base('shop', 'QA-CB path form', { image_url: path }), k);
      const stored = r.body?.[0] && (await q(`select image_url from shops where id = $1`, [r.body[0].entity_id]))[0].image_url;
      const origin = (await q(`select value from platform_settings where key = 'storage_public_origin'`))[0]?.value;
      ok('H2 object path accepted; stored URL = canonical URL built from the environment setting', r.status === 200 && origin === SB && stored === pub(path), { status: r.status, canonical: stored === pub(path) });
      const r2 = await create('newuser', 'shop', base('shop', 'QA-CB path form', { image_url: pub(path) }), k);
      ok('H3 same photo as URL with the same key → same business (same canonical data)', r2.status === 200 && r2.body?.[0]?.entity_id === r.body?.[0]?.entity_id && r2.body[0].replayed === true, { status: r2.status });
      // another environment's origin (derived from the production connection string's user name — no DB connection):
      // with that setting the same code accepts that origin and refuses this one (rolled back, nothing persists)
      const prodUser = new URL(fs.readFileSync(os.homedir() + '/.whiskora/prod_db_url', 'utf8').trim()).username;
      const otherOrigin = `https://${prodUser.split('.')[1]}.supabase.co`;
      const t = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await t.connect();
      try {
        await t.query('begin');
        await t.query(`update platform_settings set value = $1 where key = 'storage_public_origin'`, [otherOrigin]);
        await t.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid('newuser'), role: 'authenticated' })]);
        await t.query('set local role authenticated');
        const call = async (u) => { await t.query('savepoint s'); try { const x = await t.query(`select * from create_business('shop', $1::jsonb, gen_random_uuid())`, [JSON.stringify(base('shop', 'QA-CB other env', { image_url: u }))]);
          const v = (await t.query(`select image_url from shops where id = $1`, [x.rows[0].entity_id])).rows[0].image_url; await t.query('release savepoint s'); return v; }
          catch (e) { await t.query('rollback to savepoint s'); return 'ERR ' + e.code; } };
        const a = await call(`${otherOrigin}/storage/v1/object/public/partner-photos/${path}`); const b = await call(pub(path)); const c = await call(path);
        ok('H4 other environment setting: its own origin accepted, this origin refused, path → its canonical URL (rolled back)',
          a.startsWith(otherOrigin + '/') && b === 'ERR 22023' && c.startsWith(otherOrigin + '/'), { a: a.startsWith(otherOrigin + '/'), b, c: c.startsWith(otherOrigin + '/') });
      } finally { await t.query('rollback').catch(() => {}); await t.end(); }
      // setting script guard: refuses when stored photo URLs belong to another project (rolled back)
      const g = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await g.connect();
      let guard = 'no error';
      try {
        await g.query('begin');
        await g.query(`insert into farms (user_id, farm_name, image_url) values ($1, 'QA-CB origin guard', $2)`, [uid('newuser'), `${otherOrigin}/storage/v1/object/public/farm-assets/1/a.jpg`]);
        await g.query(`select set_config('whiskora.storage_origin', $1, true)`, [SB]);
        await g.query(fs.readFileSync(__dirname + '/../settings/storage_public_origin.sql', 'utf8'));
      } catch (e) { guard = e.message.includes('another Supabase project') ? 'refused' : e.message; }
      finally { await g.query('rollback').catch(() => {}); await g.end(); }
      ok('H5 setting script refuses an origin that does not match the stored photo URLs (rolled back)', guard === 'refused', { guard });
      const saved = (await q(`select value from platform_settings where key = 'storage_public_origin'`))[0]?.value;
      await q(`delete from platform_settings where key = 'storage_public_origin'`);
      const before = await counts();
      const m1 = await create('newuser', 'shop', base('shop', 'QA-CB no setting', { image_url: pub(path) }));
      const after1 = await counts();
      const m2 = await create('newuser', 'shop', base('shop', 'QA-CB no setting no photo'));
      await q(`insert into platform_settings (key, value) values ('storage_public_origin', $1)`, [saved]);
      ok('H6 setting missing → photo refused (fail closed), nothing written; a business without photos still works', m1.status === 400 && m1.code === '22023' && same(before, after1) && m2.status === 200, { photo: m1.status, nophoto: m2.status }); }

    // ── concurrency ──
    { const before = await counts(); const k = key(); const f = base('shop', 'QA-CB concurrent same key');
      const rs = await Promise.all(Array.from({ length: 10 }, () => create('newuser', 'shop', f, k)));
      const ids = new Set(rs.map((r) => r.body?.[0]?.entity_id)); const after = await counts();
      ok('P1 10 parallel calls, same key → all 200, one business, one replay source', rs.every((r) => r.status === 200) && ids.size === 1 && !ids.has(undefined)
        && rs.filter((r) => r.body[0].replayed === false).length === 1 && after.s - before.s === 1 && after.w - before.w === 1 && after.m - before.m === 1, { statuses: [...new Set(rs.map((r) => r.status))], ids: ids.size }); }
    { const before = await counts();
      const rs = await Promise.all(Array.from({ length: 5 }, (_, i) => create('newuser', 'service', base('service', `QA-CB concurrent ${i}`))));
      const after = await counts();
      ok('P2 5 parallel calls, different keys → 5 complete businesses', rs.every((r) => r.status === 200) && after.v - before.v === 5 && after.w - before.w === 5 && after.m - before.m === 5, { statuses: rs.map((r) => r.status) }); }

    // ── failure at every step (staging-only fault triggers) → nothing left half-way; the key is not burnt ──
    await q(`create function public.qa_cb_fault() returns trigger language plpgsql as $f$
      declare j jsonb := to_jsonb(new);
      begin
        if tg_table_name = 'business_create_requests' then
          if tg_op = 'INSERT' and j->>'request_key' = '00000000-0000-4000-8000-00000000fa11' then raise exception 'qa fault: claim'; end if;
          if tg_op = 'UPDATE' and exists (select 1 from public.workspaces w where w.id = (j->>'workspace_id')::uuid and w.name like '%QA-CB-FAIL-FINAL%') then raise exception 'qa fault: final'; end if;
        elsif tg_table_name in ('farms', 'shops', 'services') then
          if j::text like '%QA-CB-FAIL-ENTITY%' then raise exception 'qa fault: entity'; end if;
        elsif tg_table_name = 'workspaces' then
          if j->>'name' like '%QA-CB-FAIL-WS%' then raise exception 'qa fault: workspace'; end if;
        elsif tg_table_name = 'workspace_members' then
          if exists (select 1 from public.workspaces w where w.id = (j->>'workspace_id')::uuid and w.name like '%QA-CB-FAIL-MEMBER%') then raise exception 'qa fault: member'; end if;
        end if;
        return new;
      end $f$`);
    for (const t of ['farms', 'shops', 'services', 'workspaces', 'workspace_members', 'business_create_requests'])
      await q(`create trigger qa_cb_fault before insert or update on public.${t} for each row execute function public.qa_cb_fault()`);
    for (const [stage, type, name, k] of [
      ['claim', 'shop', 'QA-CB claim', '00000000-0000-4000-8000-00000000fa11'],
      ['entity', 'farm', 'QA-CB QA-CB-FAIL-ENTITY', key()], ['entity', 'shop', 'QA-CB QA-CB-FAIL-ENTITY', key()], ['entity', 'service', 'QA-CB QA-CB-FAIL-ENTITY', key()],
      ['workspace', 'shop', 'QA-CB QA-CB-FAIL-WS', key()], ['member', 'service', 'QA-CB QA-CB-FAIL-MEMBER', key()], ['final', 'farm', 'QA-CB QA-CB-FAIL-FINAL', key()]]) {
      const before = await counts(); const r = await create('newuser', type, base(type, name), k); const after = await counts();
      ok(`X1 failure at ${stage} (${type}) → error, no entity / workspace / member / claim left`, r.status === 400 && r.body?.message === `qa fault: ${stage}` && same(before, after), { status: r.status, msg: r.body?.message });
      if (stage !== 'claim') {
        const r2 = await create('newuser', type, base(type, name.replace(/QA-CB-FAIL-\w+/, 'retry')), k);
        ok(`X2 retry with the same key after the ${stage} failure succeeds once`, r2.status === 200 && r2.body?.[0]?.replayed === false, { status: r2.status });
      }
    }
    await dropFaults();

    // ── installed rules still hold on a business made by the RPC ──
    { const ws = made.shop.workspace_id; const id = made.shop.entity_id;
      const l = await rpc('newuser', 'list_workspace_members', { p_workspace: ws });
      ok('R1 member RPC: owner sees themselves as owner (with the owner row)', l.status === 200 && l.rows === 1 && l.body[0].role === 'owner' && l.body[0].member_id !== null, { status: l.status });
      const e = await rpc('newuser', 'ensure_workspace_owner_membership', { p_workspace: ws });
      ok('R2 ensure_workspace_owner_membership stays idempotent', e.status === 200 && (await q(`select count(*)::int n from workspace_members where workspace_id = $1`, [ws]))[0].n === 1, { status: e.status });
      const s = await rpc('stranger', 'list_workspace_members', { p_workspace: ws });
      ok('R3 stranger cannot list the new business\'s members', s.status >= 400, { status: s.status });
      const i = await rpc('stranger', 'invite_workspace_member', { p_workspace: ws, p_invitee: uid('stranger'), p_role: 'manager' });
      ok('R4 stranger cannot invite into it', i.status >= 400, { status: i.status });
      const up1 = await upload('newuser', 'shop-assets', `${id}/qa-cb.jpg`); const up2 = await upload('stranger', 'shop-assets', `${id}/qa-cb-x.jpg`);
      ok('R5 storage scoping: owner can upload to shop-assets/<id>/, stranger cannot', up1 === 200 && up2 >= 400, { owner: up1, stranger: up2 });
      await removeObj('newuser', 'shop-assets', `${id}/qa-cb.jpg`);
      const w = await rest('stranger', 'POST', 'workspaces', { type: 'shop', name: 'QA-CB forged ws', owner_id: uid('stranger'), entity_id: id });
      ok('R6 workspace guard: stranger cannot add a workspace for it', w.status >= 400, { status: w.status, code: w.code });
      const p = await rest('newuser', 'PATCH', `workspaces?id=eq.${ws}`, { owner_id: uid('stranger') });
      ok('R7 workspace guard: owner cannot hand the workspace to someone else', p.status >= 400, { status: p.status, code: p.code }); }

    // ── direct writes (old register pages) ──
    { const before = await counts();
      const r = await rest('newuser', 'POST', 'shops', { user_id: uid('newuser'), shop_name: 'QA-CB direct' });
      if (phase2) ok('D1 direct INSERT into shops refused (step 2), nothing written', r.status >= 400 && same(before, await counts()), { status: r.status, code: r.code });
      else ok('D1 direct INSERT still works before step 2 (old app keeps working)', r.status === 201, { status: r.status });
      for (const t of ['farms', 'services']) {
        const r2 = await rest('newuser', 'POST', t, { user_id: uid('newuser'), [`${t.slice(0, -1)}_name`]: 'QA-CB direct' });
        if (phase2) ok(`D2 direct INSERT into ${t} refused (step 2)`, r2.status >= 400, { status: r2.status, code: r2.code });
      }
      if (phase2) {
        const own = (await q(`select id from shops where shop_name = 'QA-CB shop 1' order by id limit 1`))[0];
        const r3 = await rest('newuser', 'POST', 'workspaces', { type: 'shop', name: 'QA-CB direct ws', owner_id: uid('newuser'), entity_id: own.id });
        ok('D3 direct INSERT into workspaces refused (step 2)', r3.status >= 400, { status: r3.status, code: r3.code });
        // since 20261101200000 profile edits go through update_business_profile (direct UPDATE refused)
        const profileRpc = !(await q(`select has_table_privilege('authenticated', 'public.shops', 'UPDATE') p`))[0].p;
        const u = profileRpc ? await rpc('newuser', 'update_business_profile', { p_type: 'shop', p_id: own.id, p_fields: { bio: 'QA-CB edited' } })
                             : await rest('newuser', 'PATCH', `shops?id=eq.${own.id}`, { bio: 'QA-CB edited' });
        ok(`D4 owner can still edit their business (${profileRpc ? 'update_business_profile' : 'direct UPDATE'})`, u.status === 200 && (profileRpc || u.rows === 1), { status: u.status, rows: u.rows });
      } }
  } catch (e) { fail++; console.log('FAIL exception', e.message); }
  finally {
    if (savedOrigin) await q(`insert into platform_settings (key, value) values ('storage_public_origin', $1) on conflict (key) do nothing`, [savedOrigin]).catch(() => {});
    await dropFaults().catch(() => {}); await cleanup().catch((e) => console.log('cleanup error', e.message));
    for (const [who, p] of [['newuser', files.mine], ['newuser', files.mineFarm], ['stranger', files.theirs]]) await removeObj(who, 'partner-photos', p).catch(() => {});
    const left = (await q(`select (select count(*) from farms where farm_name like 'QA-CB%') + (select count(*) from shops where shop_name like 'QA-CB%')
      + (select count(*) from services where service_name like 'QA-CB%') + (select count(*) from workspaces where name like 'QA-CB%') n`))[0].n;
    console.log(`cleanup: QA-CB rows left ${left}`);
    await db.end();
  }
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})();
