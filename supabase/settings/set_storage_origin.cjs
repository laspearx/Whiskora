// Set platform_settings.storage_public_origin for the database in <db-url-file>; the origin is derived from that
// connection's project ref (pooler user `postgres.<ref>` or host `db.<ref>.supabase.co`), never typed in.
// usage: NODE_PATH=<dir with pg> node supabase/settings/set_storage_origin.cjs <db-url-file> [--dry-run]
const { Client } = require('pg'); const fs = require('fs');
const [file, flag] = process.argv.slice(2);
const url = fs.readFileSync(file, 'utf8').trim();
const u = new URL(url);
const ref = (u.username.match(/^postgres\.([a-z0-9]{20})$/) || u.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/) || [])[1];
if (!ref) { console.error('cannot derive the project ref from the connection'); process.exit(2); }
const origin = `https://${ref}.supabase.co`;
const sql = fs.readFileSync(__dirname + '/storage_public_origin.sql', 'utf8');
(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect();
  try {
    await c.query('begin');
    await c.query(`select set_config('whiskora.storage_origin', $1, true)`, [origin]);
    await c.query(sql);
    const r = await c.query(`select value from public.platform_settings where key = 'storage_public_origin'`);
    if (flag === '--dry-run') { await c.query('rollback'); console.log(`dry run ok: would set ${r.rows[0].value}`); }
    else { await c.query('commit'); console.log(`set storage_public_origin = ${r.rows[0].value}`); }
  } catch (e) { await c.query('rollback').catch(() => {}); console.error('ROLLED BACK', e.message); process.exitCode = 1; }
  await c.end();
})();
