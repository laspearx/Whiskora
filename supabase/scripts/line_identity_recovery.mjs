// F4 — admin recovery of a legacy LINE-only account. DRY RUN unless --apply. Needs migration 20261110090000.
//
// A LINE sign-in for a legacy account records a request (line_identity_ops, kind admin_recovery) and shows the user an
// 8-hex reference. The reviewer verifies ownership of the OLD ACCOUNT out of band (at least two checks on data that is
// not public — e.g. private pets count, a finance entry, an appointment; never name / photo / public pet pages) and
// then approves THAT request:
//
//   list open requests            node line_identity_recovery.mjs list --project <ref> [--production]
//   show server signals           node … evidence --request <ref8> --project <ref>
//   approve (dry run)             node … approve --request <ref8> --user <full-uuid> --version <n> --actor <name>
//                                       --reason "<why>" --check "<owner check 1>" --check "<owner check 2>" --project <ref>
//   approve (for real)            same + --apply
//   resume after a crash          node … resume --request <ref8> [--user <full-uuid>] --apply --project <ref>
//   decline                       node … decline --request <ref8> --version <n> --actor <name> --reason "<why>" --apply --project <ref>
//
// Approve = (1) line_recovery_begin: request version + full user id + freshness (14 days) + reviewer + ≥2 checks,
// records the current password digest → (2) password rotated via the Auth admin API (revokes every session and refresh
// token) → (3) line_op_mark_reset: the database verifies the password changed AND no session is left → (4)
// line_op_commit: maps the LINE id under the same lock/uniqueness as every other writer. Each step's result is checked;
// a failure leaves a durable state ('open' before the reset, 'approving' + reset recorded → resume, 'failed' → review)
// and every step is in line_identity_audit. Access tokens issued before the reset stay valid until they expire (JWT
// exp; production setting must be confirmed) — tell the user, and keep the account under watch for that window.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (never printed). Output: short ids / references only.
import crypto from 'node:crypto';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const cmd = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'list'; // the command is the first argument
const one = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const many = (k) => argv.flatMap((a, i) => (a === k ? [argv[i + 1]] : []));
const apply = argv.includes('--apply');
const project = one('--project');
const PRODUCTION_REF = 'vhudldcizmbpujedojei';
const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stop = (m, code = 2) => { console.error('STOP: ' + m); process.exit(code); };
if (!project || url !== `https://${project}.supabase.co` && !(process.env.F4_TEST_URL && url === process.env.F4_TEST_URL)) stop('--project must match SUPABASE_URL');
if (project === PRODUCTION_REF && !argv.includes('--production')) stop('production project: add --production');
if (!key) stop('SUPABASE_SERVICE_ROLE_KEY missing');

const H = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
async function rpc(fn, args = {}) {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(args) });
  const t = await r.text(); let d; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) stop(`${fn} failed (${r.status}): ${typeof d === 'object' && d?.message ? d.message : 'see logs'}`, 5);
  return d;
}
async function rotate(userId) {
  const r = await fetch(`${url}/auth/v1/admin/users/${userId}`, { method: 'PUT', headers: H, body: JSON.stringify({ password: crypto.randomBytes(32).toString('base64url') }) });
  return r.ok;
}
const log = (o) => { const f = process.env.F4_RECOVERY_LOG; if (f) fs.appendFileSync(f, JSON.stringify({ at: new Date().toISOString(), project, ...o }) + '\n'); };
const findReq = async (ref) => {
  if (!/^[0-9a-f]{8}$/.test(ref || '')) stop('--request <8-hex reference> required');
  const row = (await rpc('line_recovery_list')).find((r) => r.ref === ref);
  if (!row) stop('no open / in-progress / failed request with that reference', 3);
  return row;
};

if (cmd === 'list') {
  const rows = await rpc('line_recovery_list');
  console.log(`${rows.length} request(s) on ${project}`);
  for (const r of rows) console.log(`  ${r.ref}  ${r.kind}  user ${r.user_prefix}…  ${r.status}  v${r.version}  x${r.request_count}  last ${r.last_requested_at}${r.credentials_reset_at ? '  RESET DONE → resume' : ''}`);
  process.exit(0);
}

if (cmd === 'evidence') {
  const r = await findReq(one('--request'));
  console.log(JSON.stringify({ ref: r.ref, status: r.status, version: r.version, server: await rpc('line_recovery_evidence', { p_ref: r.ref }) }, null, 1));
  process.exit(0);
}

if (cmd === 'decline') {
  const r = await findReq(one('--request'));
  const version = Number(one('--version')); const actor = one('--actor') || ''; const reason = one('--reason') || '';
  console.log(`decline ${r.ref} v${version} by ${actor}: ${reason}`);
  if (!apply) { console.log('DRY RUN — add --apply'); process.exit(0); }
  const res = await rpc('line_recovery_decline', { p_ref: r.ref, p_version: version, p_actor: actor, p_reason: reason });
  log({ action: 'decline', ref: r.ref, actor, res });
  if (res !== 'ok') stop(`decline refused: ${res}`, 4);
  console.log('DECLINED — tell the user (template in docs/LINE_ACCOUNT_RECOVERY.md)');
  process.exit(0);
}

async function finish(ref, token, userId, actor, resetAlready) {
  if (!resetAlready) {
    if (!(await rotate(userId))) {
      const ab = await rpc('line_op_abort', { p_ref: ref, p_token: token, p_actor: actor, p_reason: 'password rotation failed' });
      log({ action: 'rotate_failed', ref, abort: ab });
      stop(`password rotation failed — request back to 'open' (abort: ${ab}); nothing was mapped`, 6);
    }
    const mr = await rpc('line_op_mark_reset', { p_ref: ref, p_token: token, p_actor: actor });
    log({ action: 'mark_reset', ref, res: mr });
    if (mr !== 'ok') stop(`reset not verified (${mr}) — request stays 'approving'; run again with resume after checking sessions`, 7);
  }
  const cm = await rpc('line_op_commit', { p_ref: ref, p_token: token, p_actor: actor });
  log({ action: 'commit', ref, res: cm });
  if (cm !== 'ok' && cm !== 'already') stop(`mapping refused (${cm}) — request marked 'failed'; account was signed out, nothing mapped`, 8);
  console.log('APPROVED — the user can sign in with LINE now; all their devices were signed out (template in docs/LINE_ACCOUNT_RECOVERY.md)');
}

if (cmd === 'approve') {
  const r = await findReq(one('--request'));
  const user = one('--user') || ''; const version = Number(one('--version')); const actor = one('--actor') || ''; const reason = one('--reason') || '';
  const checks = many('--check').filter(Boolean);
  if (!/^[0-9a-f-]{36}$/.test(user)) stop('--user <full uuid> required');
  if (r.status !== 'open') stop(`request is ${r.status}${r.credentials_reset_at ? ' (reset done: use resume)' : ''}`, 3);
  if (!user.startsWith(r.user_prefix)) stop('user id does not match the request', 3);
  const ev = await rpc('line_recovery_evidence', { p_ref: r.ref });
  console.log(JSON.stringify({ ref: r.ref, version, actor, reason, checks, server: ev }, null, 1));
  const blockers = [!ev?.placeholder_matches && 'placeholder does not match', ev?.line_held_by_other && 'LINE id held by another account',
    ev?.account_mapped && 'account already mapped', ev?.oauth_identity && 'account has an OAuth identity (use signed-in link)',
    ev?.pending_email_change && 'pending email change', checks.length < 2 && 'need two --check'].filter(Boolean);
  if (blockers.length) stop('cannot approve:\n  - ' + blockers.join('\n  - '), 4);
  if (!apply) { console.log('DRY RUN — re-run with --apply after reviewing the evidence above'); process.exit(0); }
  const token = await rpc('line_recovery_begin', { p_ref: r.ref, p_user_id: user, p_version: version, p_actor: actor, p_reason: reason, p_owner_checks: checks });
  log({ action: 'begin', ref: r.ref, actor, version, checks });
  await finish(r.ref, token, user, actor, false);
  process.exit(0);
}

if (cmd === 'resume') {
  const r = await findReq(one('--request'));
  if (r.status !== 'approving' || !r.lock_token) stop(`request is ${r.status}: nothing to resume`, 3);
  const user = one('--user') || '';
  if (!r.credentials_reset_at && !/^[0-9a-f-]{36}$/.test(user)) stop('reset not recorded: pass --user <full uuid> to retry the reset');
  console.log(`resume ${r.ref}: ${r.credentials_reset_at ? 'commit only' : 'reset + commit'}`);
  if (!apply) { console.log('DRY RUN — add --apply'); process.exit(0); }
  await finish(r.ref, r.lock_token, user, one('--actor') || 'resume', !!r.credentials_reset_at);
  process.exit(0);
}

stop(`unknown command ${cmd}`);
