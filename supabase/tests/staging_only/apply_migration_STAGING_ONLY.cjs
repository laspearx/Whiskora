// Apply one migration file to whiskora-staging in a single transaction after a sha256 check.
// usage: NODE_PATH=<dir with pg> node supabase/tests/staging_only/apply_migration_STAGING_ONLY.cjs <file.sql> <expected sha256>
const { Client } = require('pg'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto');
const url = fs.readFileSync(os.homedir() + '/.whiskora/staging_db_url', 'utf8').trim();
if (!url.includes('wpxcukrwmegwzfccbbga')) { console.error('refusing: not staging'); process.exit(2); }
const [file, want] = process.argv.slice(2);
const sql = fs.readFileSync(file, 'utf8');
const got = crypto.createHash('sha256').update(sql).digest('hex');
if (got !== want) { console.error(`sha256 mismatch: ${got}`); process.exit(2); }
(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect();
  try {
    await c.query('begin'); await c.query(`set local lock_timeout = '5s'`);
    await c.query(sql); await c.query('commit'); console.log(`applied ${file} (${got.slice(0, 12)}…)`);
  } catch (e) { await c.query('rollback').catch(() => {}); console.error('ROLLED BACK', e.code, e.message); process.exitCode = 1; }
  await c.end();
})();
