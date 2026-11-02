#!/usr/bin/env node
// One-time backfill for H2 (docs/SECURITY_PHASE1.md): copy the legacy user_metadata.line_id (user-writable) into
// app_metadata.line_id (server-writable), which the new LINE login uses. DRY RUN unless --apply.
// Prints counts and short user-id prefixes only — no email, no names, no LINE ids.
// A LINE id claimed by more than one account (or already set differently in app_metadata) is a CONFLICT: reported,
// never written — an admin decides by hand. Accounts already carrying app_metadata.line_id are left alone.
// usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node supabase/scripts/line_identity_backfill.mjs [--apply] [--expect-ref <ref>]
// (the key comes from the environment only; run it where the owner keeps it — never paste it into chat or a file)
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = process.argv.slice(2), apply = args.includes('--apply');
const expectRef = args.includes('--expect-ref') ? args[args.indexOf('--expect-ref') + 1] : null;
const H = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' };
const short = (id) => String(id).slice(0, 8);

export function plan(users) {
  const byLine = new Map();
  for (const u of users) {
    const legacy = u.user_metadata?.line_id, current = u.app_metadata?.line_id;
    for (const v of [legacy, current]) if (typeof v === 'string' && v) { if (!byLine.has(v)) byLine.set(v, new Set()); byLine.get(v).add(u.id); }
  }
  const out = { write: [], skipAlready: 0, conflicts: [], invalid: 0 };
  for (const u of users) {
    const legacy = u.user_metadata?.line_id, current = u.app_metadata?.line_id;
    if (typeof current === 'string' && current) { if (legacy && legacy !== current) out.conflicts.push({ id: u.id, why: 'app_metadata differs from user_metadata' }); else out.skipAlready++; continue; }
    if (legacy == null || legacy === '') continue;
    if (typeof legacy !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(legacy)) { out.invalid++; continue; }
    if (byLine.get(legacy).size > 1) { out.conflicts.push({ id: u.id, why: 'LINE id claimed by more than one account' }); continue; }
    out.write.push({ id: u.id, line_id: legacy, app_metadata: u.app_metadata || {} });
  }
  return out;
}

async function listAll() {
  const users = [];
  for (let page = 1; page < 1000; page++) {
    const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: H });
    if (!r.ok) throw new Error(`list users HTTP ${r.status}`);
    const b = await r.json(); const batch = b.users || [];
    users.push(...batch); if (batch.length < 200) break;
  }
  return users;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!url || !key) { console.error('set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }
  if (expectRef && !new URL(url).hostname.startsWith(`${expectRef}.`)) { console.error(`refusing: URL is not project ${expectRef}`); process.exit(2); }
  const users = await listAll();
  const p = plan(users);
  console.log(`users ${users.length}; to write ${p.write.length}; already set ${p.skipAlready}; conflicts ${p.conflicts.length}; invalid ${p.invalid}; mode ${apply ? 'APPLY' : 'dry run'}`);
  for (const c of p.conflicts) console.log(`CONFLICT ${short(c.id)}… ${c.why}`);
  if (apply) {
    let ok = 0, bad = 0;
    for (const w of p.write) {
      const r = await fetch(`${url}/auth/v1/admin/users/${w.id}`, { method: 'PUT', headers: H, body: JSON.stringify({ app_metadata: { ...w.app_metadata, line_id: w.line_id } }) });
      if (r.ok) ok++; else { bad++; console.log(`FAILED ${short(w.id)}… HTTP ${r.status}`); }
    }
    console.log(`written ${ok}, failed ${bad}`); process.exitCode = bad ? 1 : 0;
  }
}
