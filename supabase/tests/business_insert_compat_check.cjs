// Old-app compatibility grants (supabase/emergency/business_insert_old_app_compat_DECISION_REQUIRED.sql) on whiskora-staging:
// applied inside ONE transaction, exercised as QA users, then ROLLED BACK — staging privileges are not changed.
// usage: NODE_PATH=<dir with pg> node supabase/tests/business_insert_compat_check.cjs supabase/emergency/business_insert_old_app_compat_DECISION_REQUIRED.sql
const { Client } = require('pg'); const fs = require('fs'); const os = require('os');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) process.exit(2);
const as = (u) => `select set_config('request.jwt.claims', '{"sub":"${u}","role":"authenticated"}', true)`;
const NEW = 'a0000000-0000-4000-8000-000000000008', OWNER = 'a0000000-0000-4000-8000-000000000001';
(async () => { const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect();
  const res = {}; let sp = 0;
  const tryq = async (name, sql, p = []) => { const s = 's' + (++sp); await c.query(`savepoint ${s}`);
    try { const r = await c.query(sql, p); res[name] = 'ok ' + (r.rows[0] ? JSON.stringify(r.rows[0]) : r.rowCount); await c.query(`release savepoint ${s}`); return r; }
    catch (e) { res[name] = 'ERR ' + e.code; await c.query(`rollback to savepoint ${s}`); } };
  await c.query('begin');
  await c.query(fs.readFileSync(process.argv[2], 'utf8'));
  await c.query(as(NEW)); await c.query('set local role authenticated');
  const shop = await tryq('old shop insert', `insert into shops (user_id, shop_name, owner_name, phone, province, lat, lng, supported_species) values ($1, 'QA-CB compat', 'QA', '0', 'x', 1, 1, 'cat') returning id`, [NEW]);
  await tryq('old workspace insert', `insert into workspaces (type, name, owner_id, entity_id) values ('shop', 'QA-CB compat', $1, $2) returning type`, [NEW, shop?.rows[0]?.id]);
  await tryq('owner row rpc', `select ensure_workspace_owner_membership((select id from workspaces where type = 'shop' and entity_id = $1)) r`, [shop?.rows[0]?.id]);
  await tryq('insert is_verified', `insert into farms (user_id, farm_name, is_verified) values ($1, 'QA-CB compat', true)`, [NEW]);
  await tryq('insert is_published', `insert into services (user_id, service_name, is_published) values ($1, 'QA-CB compat', true)`, [NEW]);
  await tryq('insert for another user', `insert into shops (user_id, shop_name) values ($1, 'QA-CB compat')`, [OWNER]);
  await tryq('workspace for farm 9001 (not theirs)', `insert into workspaces (type, name, owner_id, entity_id) values ('farm', 'QA-CB compat', $1, 9001)`, [NEW]);
  await tryq('personal workspace', `insert into workspaces (type, name, owner_id) values ('personal', 'QA-CB compat', $1)`, [NEW]);
  await c.query('reset role');
  res['anon insert privilege'] = String((await c.query(`select has_table_privilege('anon', 'public.shops', 'INSERT') a`)).rows[0].a);
  await c.query('rollback'); console.table(res);
  const after = await c.query(`select has_table_privilege('authenticated', 'public.shops', 'INSERT') a, (select count(*) from shops where shop_name like 'QA-CB%') n`);
  console.log('after rollback: authenticated INSERT on shops =', after.rows[0].a, '; QA-CB rows =', after.rows[0].n); await c.end(); })();
