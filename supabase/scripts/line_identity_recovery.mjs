// F4 — admin-reviewed recovery of a legacy LINE account (made before F4, so no app_metadata.line_id). DRY RUN by default.
//
// Why manual: nothing server-side proves that a legacy placeholder account (line_<id>@line.whiskora.internal) was made by
// our LINE callback rather than pre-registered through public signup, and a LINE sign-in proves the LINE id, not the old
// account. A LINE sign-in for such an account therefore only records app_metadata.line_recovery_request {line_id, ref}.
// An admin checks the request with the user (the reference they were shown + what they know about the account) and then:
//   node supabase/scripts/line_identity_recovery.mjs --ref <project-ref>                      # list open requests
//   node supabase/scripts/line_identity_recovery.mjs --ref <project-ref> --approve <user-id>  # show what would change
//   node supabase/scripts/line_identity_recovery.mjs --ref <project-ref> --approve <user-id> --apply
// Apply = set app_metadata.line_id, clear the request, and rotate the password to a random value. Rotating the password
// revokes every session and refresh token of the account (GoTrue Logout); access tokens already issued stay valid until
// they expire (JWT exp, default 1 hour). Only for an account whose email is the placeholder of exactly that LINE id and
// when no other account holds the id.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (never printed). Output has short id prefixes only.
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const ref = arg('--ref'); const approve = arg('--approve'); const apply = args.includes('--apply');
const url = (process.env.SUPABASE_URL || '').replace(/\/$/, ''); const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!ref || url !== `https://${ref}.supabase.co`) { console.error('STOP: --ref must match SUPABASE_URL'); process.exit(2); }
if (!key) { console.error('STOP: SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(2); }

const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
const api = async (method, path, body) => {
  const r = await fetch(`${url}/auth/v1${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path.split('?')[0]} → ${r.status}`);
  return r.json();
};
const short = (id) => String(id).slice(0, 8);
const placeholder = (lineId) => `line_${lineId}@line.whiskora.internal`.toLowerCase();

const users = [];
for (let page = 1; page <= 50; page++) {
  const { users: batch } = await api('GET', `/admin/users?page=${page}&per_page=1000`);
  users.push(...batch); if (batch.length < 1000) break;
}
const open = users.filter((u) => u.app_metadata?.line_recovery_request && !u.app_metadata?.line_id);

if (!approve) {
  console.log(`${open.length} open recovery request(s) on ${ref}`);
  for (const u of open) console.log(`  user ${short(u.id)}  ref ${u.app_metadata.line_recovery_request.ref}  at ${u.app_metadata.line_recovery_request.requested_at}`);
  process.exit(0);
}

const u = users.find((x) => x.id === approve);
if (!u) { console.error('STOP: user not found'); process.exit(3); }
const req = u.app_metadata?.line_recovery_request;
const problems = [];
if (!req || typeof req.line_id !== 'string') problems.push('no recovery request on this account');
if (u.app_metadata?.line_id) problems.push('account already has app_metadata.line_id');
if (req && (u.email || '').toLowerCase() !== placeholder(req.line_id)) problems.push('email is not the placeholder of the requested LINE id');
if (req && users.some((x) => x.id !== u.id && x.app_metadata?.line_id === req.line_id)) problems.push('another account already holds this LINE id');
if ((u.identities || []).some((i) => i.provider !== 'email')) problems.push('account has an OAuth identity (use the signed-in link flow instead)');
if (problems.length) { console.error('STOP:\n  - ' + problems.join('\n  - ')); process.exit(4); }

console.log(`user ${short(u.id)} ref ${req.ref}: will set app_metadata.line_id, clear the request, rotate password (revokes all sessions)`);
if (!apply) { console.log('DRY RUN — add --apply after the owner approved this account'); process.exit(0); }

await api('PUT', `/admin/users/${u.id}`, { password: crypto.randomBytes(32).toString('base64url') });
await api('PUT', `/admin/users/${u.id}`, { app_metadata: { ...u.app_metadata, line_id: req.line_id, line_recovery_request: null, line_link_pending: null } });
const after = await api('GET', `/admin/users/${u.id}`);
console.log(after.app_metadata?.line_id === req.line_id ? 'DONE' : 'CHECK MANUALLY: line_id not set');
