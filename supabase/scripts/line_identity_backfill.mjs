#!/usr/bin/env node
// One-time backfill for H2 (docs/SECURITY_PHASE1.md §H2). DRY RUN unless --apply.
// Source of truth = the server-side evidence report public.legacy_line_evidence() (migration 20261102150000) — NOT
// user_metadata (user-writable). Only the 'verified' group is written: accounts carrying the server-made shape of a
// LINE signup by our callback (placeholder email, no password, original email identity, no pending change, no other
// trusted holder). 'conflict' and 'unverified' are reported (short id prefix + reason) and NEVER written — their owners
// re-link LINE through link mode (signed in with their existing method), or an admin resolves a conflict by hand.
// Prints counts and short user-id prefixes only — no email, no names, no LINE ids.
// usage: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node supabase/scripts/line_identity_backfill.mjs [--apply] [--expect-ref <ref>]
// (the key comes from the environment only; run it where the owner keeps it — never paste it into chat or a file)
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = process.argv.slice(2), apply = args.includes('--apply');
const expectRef = args.includes('--expect-ref') ? args[args.indexOf('--expect-ref') + 1] : null;
const H = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' };
const short = (id) => String(id).slice(0, 8);
const SAFE = /^[A-Za-z0-9_-]{1,128}$/;

// rows: [{ user_id, line_id, class, reason }] from legacy_line_evidence()
export function plan(rows) {
  const out = { write: [], already: 0, conflicts: [], unverified: [], invalid: 0 };
  for (const r of rows) {
    if (r.class === 'already') out.already++;
    else if (r.class === 'conflict') out.conflicts.push({ id: r.user_id, why: r.reason });
    else if (r.class === 'unverified') out.unverified.push({ id: r.user_id, why: r.reason });
    else if (r.class === 'verified') {
      if (typeof r.line_id === 'string' && SAFE.test(r.line_id)) out.write.push({ id: r.user_id, line_id: r.line_id }); else out.invalid++;
    } else out.invalid++;
  }
  // defence in depth: one LINE id may be written to one account only
  const seen = new Map(); for (const w of out.write) seen.set(w.line_id, (seen.get(w.line_id) || 0) + 1);
  const dup = out.write.filter((w) => seen.get(w.line_id) > 1);
  out.write = out.write.filter((w) => seen.get(w.line_id) === 1);
  for (const d of dup) out.conflicts.push({ id: d.id, why: 'duplicate verified id in one report' });
  return out;
}

async function rpc(name, body = {}) {
  const r = await fetch(`${url}/rest/v1/rpc/${name}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${name} HTTP ${r.status}`);
  return r.json();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!url || !key) { console.error('set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }
  if (expectRef && !new URL(url).hostname.startsWith(`${expectRef}.`)) { console.error(`refusing: URL is not project ${expectRef}`); process.exit(2); }
  const p = plan(await rpc('legacy_line_evidence'));
  console.log(`verified (to write) ${p.write.length}; already ${p.already}; conflicts ${p.conflicts.length}; unverified ${p.unverified.length}; invalid ${p.invalid}; mode ${apply ? 'APPLY' : 'dry run'}`);
  for (const c of p.conflicts) console.log(`CONFLICT   ${short(c.id)}… ${c.why}`);
  for (const u of p.unverified) console.log(`UNVERIFIED ${short(u.id)}… ${u.why} → re-link`);
  if (apply) {
    let ok = 0, bad = 0;
    for (const w of p.write) {
      const cur = await fetch(`${url}/auth/v1/admin/users/${w.id}`, { headers: H });
      if (!cur.ok) { bad++; console.log(`FAILED ${short(w.id)}… read HTTP ${cur.status}`); continue; }
      const u = await cur.json();
      if (u.app_metadata?.line_id && u.app_metadata.line_id !== w.line_id) { bad++; console.log(`SKIPPED ${short(w.id)}… changed since the report`); continue; }
      const r = await fetch(`${url}/auth/v1/admin/users/${w.id}`, { method: 'PUT', headers: H, body: JSON.stringify({ app_metadata: { ...(u.app_metadata || {}), line_id: w.line_id } }) });
      if (r.ok) ok++; else { bad++; console.log(`FAILED ${short(w.id)}… HTTP ${r.status}`); }
    }
    console.log(`written ${ok}, failed / skipped ${bad}`); process.exitCode = bad ? 1 : 0;
  }
}
