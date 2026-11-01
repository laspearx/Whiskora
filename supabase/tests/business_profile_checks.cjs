// Profile edit by role (20261101190000 update_business_profile; 20261101200000 UPDATE privileges) — real REST on
// whiskora-staging with synthetic QA accounts. For each type a "QA-BP" business is created by owner 01 through
// create_business, with members manager 02 / staff 03 / viewer 04 added by the fixture step below; a second business
// of newuser 08 is the "someone else's business". Everything named QA-BP and its storage objects are removed at the end.
// usage: NODE_PATH=<dir with pg> STAGING_ANON_KEY=<key> node supabase/tests/business_profile_checks.cjs
const { Client } = require('pg'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const SB = 'https://wpxcukrwmegwzfccbbga.supabase.co';
const KEY = process.env.STAGING_ANON_KEY; if (!KEY) { console.error('set STAGING_ANON_KEY'); process.exit(2); }
const PW = fs.readFileSync(os.homedir() + '/.whiskora/staging_qa_password', 'utf8').trim();
const U = { owner: '01', manager: '02', staff: '03', viewer: '04', stranger: '06', newuser: '08' };
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
  return { status: r.status, rows: Array.isArray(b) ? b.length : null, code: b && !Array.isArray(b) ? b.code : null, msg: b?.message, body: b };
}
const rpc = (who, fn, args) => rest(who, 'POST', `rpc/${fn}`, args);
const edit = (who, type, id, fields) => rpc(who, 'update_business_profile', { p_type: type, p_id: id, p_fields: fields });
async function upload(who, bucket, path) {
  const r = await fetch(`${SB}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${await tok(who)}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: Buffer.from('qa-synthetic') });
  return r.status;
}
const pub = (bucket, path) => `${SB}/storage/v1/object/public/${bucket}/${path}`;
const TBL = { farm: 'farms', shop: 'shops', service: 'services' };
const base = (type, name) => ({ [`${type}_name`]: name, owner_name: 'QA Synthetic', phone: '0800000000', province: 'กรุงเทพมหานคร', lat: 13.75, lng: 100.5,
  bio: 'synthetic', ...(type === 'farm' ? { species: 'cat' } : { supported_species: ['dog'] }), ...(type === 'service' ? { category: 'grooming' } : {}) });

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (s, p = []) => (await db.query(s, p)).rows;
  const step2 = !(await q(`select has_table_privilege('authenticated', 'public.shops', 'UPDATE') p`))[0].p;
  console.log(`schema: update_business_profile ${(await q(`select to_regprocedure('public.update_business_profile(text,bigint,jsonb)') is not null a`))[0].a ? 'installed' : 'MISSING'}; direct UPDATE ${step2 ? 'closed (20261101200000)' : 'still open'}\n`);
  const objects = [];
  const cleanup = async () => {
    for (const [t, col] of [['farms', 'farm_name'], ['shops', 'shop_name'], ['services', 'service_name']]) {
      const typ = t.slice(0, -1);
      await q(`delete from workspaces where type = $1 and entity_id in (select id from ${t} where ${col} like 'QA-BP%')`, [typ]);
      await q(`delete from ${t} where ${col} like 'QA-BP%'`);
    }
    await q(`delete from business_create_requests where entity_id is null or not exists (select 1 from workspaces w where w.id = business_create_requests.workspace_id)`);
  };
  const row = async (type, id) => (await q(`select * from ${TBL[type]} where id = $1`, [id]))[0];
  const snap = async (type, id) => JSON.stringify(await row(type, id));
  try {
    await cleanup();
    const biz = {}, other = {};
    for (const type of ['farm', 'shop', 'service']) {
      const r = await rpc('owner', 'create_business', { p_type: type, p_fields: base(type, `QA-BP ${type}`), p_request_key: crypto.randomUUID() });
      biz[type] = { id: r.body?.[0]?.entity_id, ws: r.body?.[0]?.workspace_id };
      for (const [who, role] of [['manager', 'manager'], ['staff', 'staff'], ['viewer', 'viewer']])
        await q(`insert into workspace_members (workspace_id, user_id, role) values ($1, $2, $3)`, [biz[type].ws, uid(who), role]);
      const o = await rpc('newuser', 'create_business', { p_type: type, p_fields: base(type, `QA-BP other ${type}`), p_request_key: crypto.randomUUID() });
      other[type] = { id: o.body?.[0]?.entity_id };
    }
    ok('S0 synthetic businesses + members ready', Object.values(biz).every((b) => b.id && b.ws) && Object.values(other).every((b) => b.id));

    for (const type of ['farm', 'shop', 'service']) {
      const id = biz[type].id; const nk = `${type}_name`;
      const species = type === 'farm' ? { species: 'dog' } : { supported_species: ['cat', 'rabbit', 'cat'] };
      // ── owner ──
      { const f = { [nk]: `QA-BP ${type} renamed`, owner_name: 'QA Owner 2', phone: '0811111111', bio: 'owner bio', province: 'เชียงใหม่', lat: 18.8, lng: 98.9, ...species, ...(type === 'service' ? { category: 'pet_care' } : {}) };
        const r = await edit('owner', type, id, f); const d = await row(type, id);
        const ws = (await q(`select name from workspaces where id = $1`, [biz[type].ws]))[0].name;
        ok(`O1 ${type}: owner saves identity + content; response = stored row; workspace renamed`, r.status === 200 && r.body.role === 'owner' && d[nk] === f[nk] && d.owner_name === 'QA Owner 2'
          && d.province === 'เชียงใหม่' && r.body[nk] === d[nk] && r.body.phone === d.phone && ws === f[nk]
          && (type === 'farm' ? d.species === 'dog' : d.supported_species === 'cat,rabbit') && (type !== 'service' || d.category === 'pet_care'), { status: r.status, code: r.code, msg: r.msg }); }
      { const before = await snap(type, id); const r = await edit('owner', type, id, { bio: 'only bio' }); const d = await row(type, id);
        const b = JSON.parse(before);
        ok(`O2 ${type}: partial update changes only the sent key`, r.status === 200 && d.bio === 'only bio' && d[nk] === b[nk] && d.phone === b.phone && d.lat === b.lat, { status: r.status }); }
      for (const [n, f] of [['user_id', { user_id: uid('stranger') }], ['owner_id', { owner_id: uid('stranger') }], ['role', { role: 'owner' }], ['id', { id: 1 }],
        ['created_at', { created_at: '2020-01-01' }], ['updated_at', { updated_at: '2020-01-01' }], ['is_verified', { is_verified: true }], ['verified_at', { verified_at: '2020-01-01' }],
        ['verification_status', { verification_status: 'verified' }], ['verification_note', { verification_note: 'x' }], ['is_published', { is_published: true }],
        ['facebook_link', { facebook_link: 'x' }], ['line_id', { line_id: 'x' }], ['unknown', { foo: 1 }]]) {
        const before = await snap(type, id); const r = await edit('owner', type, id, { bio: 'x', ...f });
        ok(`O3 ${type}: owner cannot send ${n} (22023, nothing saved)`, r.status === 400 && r.code === '22023' && before === await snap(type, id), { status: r.status, code: r.code });
      }
      for (const [n, f] of [['empty name', { [nk]: '  ' }], ['empty phone', { phone: '' }], ['name too long', { [nk]: 'x'.repeat(130) }], ['lat out of range', { lat: 200 }],
        ['species not ids', type === 'farm' ? { species: 5 } : { supported_species: 'cat' }], ...(type === 'service' ? [['bad category', { category: 'DROP' }]] : [])]) {
        const before = await snap(type, id); const r = await edit('owner', type, id, f);
        ok(`O4 ${type}: ${n} refused, nothing saved`, r.status === 400 && r.code === '22023' && before === await snap(type, id), { status: r.status, code: r.code });
      }
      // ── manager ──
      { const r = await edit('manager', type, id, { bio: 'manager bio', phone: '0822222222', ...species }); const d = await row(type, id);
        ok(`M1 ${type}: manager saves bio / phone / species`, r.status === 200 && r.body.role === 'manager' && d.bio === 'manager bio' && d.phone === '0822222222', { status: r.status, code: r.code, msg: r.msg }); }
      if (type === 'service') { const r = await edit('manager', type, id, { category: 'grooming' });
        ok('M1 service: manager saves category', r.status === 200 && (await row(type, id)).category === 'grooming', { status: r.status }); }
      for (const [n, f] of [['name', { [nk]: 'QA-BP manager rename' }], ['owner_name', { owner_name: 'x' }], ['province', { province: 'x' }], ['address', { address: 'x' }], ['lat', { lat: 1 }]]) {
        const before = await snap(type, id); const r = await edit('manager', type, id, { bio: 'm', ...f });
        ok(`M2 ${type}: manager cannot change ${n} (42501, nothing saved)`, r.status === 403 && r.code === '42501' && before === await snap(type, id), { status: r.status, code: r.code });
      }
      { const before = await snap(type, id); const r = await edit('manager', type, id, { is_published: true });
        ok(`M3 ${type}: manager cannot send is_published (refused)`, r.status === 400 && before === await snap(type, id), { status: r.status, code: r.code }); }
      // ── no edit rights ──
      for (const who of ['staff', 'viewer', 'stranger', 'newuser']) {
        const before = await snap(type, id); const r = await edit(who, type, id, { bio: `${who} was here` });
        ok(`N1 ${type}: ${who} cannot edit (42501, nothing saved)`, r.status === 403 && r.code === '42501' && before === await snap(type, id), { status: r.status, code: r.code });
      }
      { const before = await snap(type, other[type].id); const r = await edit('owner', type, other[type].id, { bio: 'not mine' });
        ok(`N2 ${type}: owner of one business cannot edit someone else's`, r.status === 403 && before === await snap(type, other[type].id), { status: r.status, code: r.code }); }
      { const r = await edit('anon', type, id, { bio: 'anon' }); ok(`N3 ${type}: anon refused`, r.status === 401, { status: r.status }); }
      { const r = await edit('owner', type, 999999999, { bio: 'x' }); ok(`N4 ${type}: unknown business → not found`, r.status === 404 || r.code === 'PT404', { status: r.status, code: r.code }); }

      // ── photos ──
      const asset = `${type}-assets`; const ts = Date.now();
      const okUp = await upload('owner', asset, `${id}/avatar_${ts}.jpg`); objects.push(['owner', asset, `${id}/avatar_${ts}.jpg`]);
      { const u = `${pub(asset, `${id}/avatar_${ts}.jpg`)}?t=${ts}`; const r = await edit('owner', type, id, { image_url: u });
        const d = await row(type, id); const ws = (await q(`select avatar_url from workspaces where id = $1`, [biz[type].ws]))[0].avatar_url;
        ok(`P1 ${type}: dashboard photo (${asset}/<id>/…?t=) saved as sent, workspace avatar follows`, okUp === 200 && r.status === 200 && d.image_url === u && r.body.image_url === u && ws === u, { up: okUp, status: r.status, code: r.code, msg: r.msg }); }
      { const up = await upload('manager', asset, `${id}/cover_${ts}.jpg`); objects.push(['manager', asset, `${id}/cover_${ts}.jpg`]);
        const u = `${pub(asset, `${id}/cover_${ts}.jpg`)}?t=${ts}`; const r = await edit('manager', type, id, { cover_url: u });
        ok(`P2 ${type}: manager uploads + sets the cover`, up === 200 && r.status === 200 && (await row(type, id)).cover_url === u, { up, status: r.status, msg: r.msg }); }
      { const up = await upload('staff', asset, `${id}/staff_${ts}.jpg`);
        ok(`P3 ${type}: staff cannot upload to the business folder (storage scoping kept)`, up >= 400, { up }); }
      { const reg = `${type}s/${uid('owner')}/qa-bp-${ts}.jpg`; const up = await upload('owner', 'partner-photos', reg); objects.push(['owner', 'partner-photos', reg]);
        const r = await edit('owner', type, id, { cover_url: pub('partner-photos', reg) });
        ok(`P4 ${type}: register-page photo (partner-photos/${type}s/<uid>/…) accepted`, up === 200 && r.status === 200, { up, status: r.status, msg: r.msg }); }
      { const otherUp = await upload('newuser', `${type}-assets`, `${other[type].id}/avatar_${ts}.jpg`); objects.push(['newuser', `${type}-assets`, `${other[type].id}/avatar_${ts}.jpg`]);
        const reg = `${type}s/${uid('newuser')}/qa-bp-${ts}.jpg`; const up2 = await upload('newuser', 'partner-photos', reg); objects.push(['newuser', 'partner-photos', reg]);
        const good = `${pub(asset, `${id}/avatar_${ts}.jpg`)}`;
        for (const [n, u] of [['another business folder', pub(`${type}-assets`, `${other[type].id}/avatar_${ts}.jpg`)], ['someone else\'s register photo', pub('partner-photos', reg)],
          ['another website, same path', good.replace(SB, 'https://evil.example')], ['another Supabase project', good.replace(SB, 'https://zzzzzzzzzzzzzzzzzzzz.supabase.co')],
          ['query other than ?t=', `${good}?x=1`], ['?t= not digits', `${good}?t=abc`], ['never uploaded', pub(asset, `${id}/never_${ts}.jpg`)],
          ['other bucket', pub('pet-photos', `${id}/avatar_${ts}.jpg`)], ['wrong type bucket', pub(type === 'farm' ? 'shop-assets' : 'farm-assets', `${id}/avatar_${ts}.jpg`)]]) {
          const before = await snap(type, id); const r = await edit('owner', type, id, { image_url: u });
          ok(`P5 ${type}: photo ${n} → refused, nothing saved`, r.status === 400 && r.code === '22023' && before === await snap(type, id), { status: r.status, code: r.code, up: [otherUp, up2] });
        } }
      // existing value kept as is even if it would not pass the new-photo rules (no retroactive change)
      { await q(`update ${TBL[type]} set image_url = $2 where id = $1`, [id, 'https://legacy.example/old.jpg']);
        const r = await edit('owner', type, id, { image_url: 'https://legacy.example/old.jpg', bio: 'legacy kept' }); const d = await row(type, id);
        ok(`P6 ${type}: unchanged legacy photo URL is kept, other fields save`, r.status === 200 && d.image_url === 'https://legacy.example/old.jpg' && d.bio === 'legacy kept', { status: r.status, msg: r.msg });
        await q(`update ${TBL[type]} set image_url = '' where id = $1`, [id]);
        const r2 = await edit('owner', type, id, { image_url: '', bio: 'empty kept' });
        ok(`P7 ${type}: unchanged empty photo value is kept`, r2.status === 200 && (await row(type, id)).image_url === '', { status: r2.status, msg: r2.msg }); }
      { const r = await edit('owner', type, id, { cover_url: null }); ok(`P8 ${type}: null clears the cover`, r.status === 200 && (await row(type, id)).cover_url === null, { status: r.status }); }

      // ── direct writes (old pages) and the paths that stay ──
      { const before = await snap(type, id); const r = await rest('owner', 'PATCH', `${TBL[type]}?id=eq.${id}`, { bio: 'direct' });
        if (step2) ok(`D1 ${type}: direct UPDATE of a profile field refused (step 2), nothing saved`, r.status === 403 && before === await snap(type, id), { status: r.status, code: r.code });
        else ok(`D1 ${type}: direct UPDATE still works before step 2 (old app)`, r.status === 200 && r.rows === 1, { status: r.status }); }
    }
    // publish button (owner only via RLS; unchanged) and the verify request path
    { const id = biz.service.id;
      const r = await rest('owner', 'PATCH', `services?id=eq.${id}`, { is_published: true });
      const m = await rest('manager', 'PATCH', `services?id=eq.${id}`, { is_published: false });
      const pubNow = (await row('service', id)).is_published;
      ok('K1 publish button: owner toggles is_published (unchanged); manager still matches 0 rows', r.status === 200 && r.rows === 1 && (m.status >= 400 || m.rows === 0) && pubNow === true, { owner: [r.status, r.rows], manager: [m.status, m.rows] }); }
    { const id = biz.farm.id;
      const r1 = await rest('owner', 'POST', 'farm_verifications', { farm_id: id, user_id: uid('owner'), phone: '0', status: 'pending' });
      const r2 = await rest('owner', 'PATCH', `farms?id=eq.${id}`, { verification_status: 'pending' });
      const r3 = await rest('owner', 'PATCH', `farms?id=eq.${id}`, { is_verified: true });
      ok('K2 verify request path: request + farms.verification_status → pending still works; is_verified still refused', r1.status === 201 && r2.status === 200 && r2.rows === 1 && r3.status >= 400 && (await row('farm', id)).is_verified === false, { req: r1.status, pending: [r2.status, r2.rows], verified: r3.status });
      await q(`delete from farm_verifications where farm_id = $1`, [id]); }
  } catch (e) { fail++; console.log('FAIL exception', e.message); }
  finally {
    for (const [who, bucket, path] of objects) await fetch(`${SB}/storage/v1/object/${bucket}/${path}`, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${await tok(who)}` } }).catch(() => {});
    // farm-assets has no DELETE policy for the API and SQL deletes on storage are blocked: those synthetic files stay
    // (3 per run, tiny, in folders of deleted QA farms); remove them with the Storage API + service role if wanted
    const left = (await q(`select count(*)::int n from storage.objects where (bucket_id, name) in (select * from unnest($1::text[], $2::text[]))`, [objects.map((o) => o[1]), objects.map((o) => o[2])]))[0].n;
    console.log(`synthetic storage objects left: ${left}`);
    await cleanup().catch((e) => console.log('cleanup error', e.message));
    console.log(`cleanup: QA-BP rows left ${(await q(`select (select count(*) from farms where farm_name like 'QA-BP%') + (select count(*) from shops where shop_name like 'QA-BP%') + (select count(*) from services where service_name like 'QA-BP%') n`))[0].n}`);
    await db.end();
  }
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})();
