// Config: ops/monitor/monitor.json (shared) + ops/monitor/projects/<id>.json (one file per project).
// Adding a project = adding one JSON file. Disabled projects may hold unknown values (null URLs); enabled ones may not.
import fs from 'node:fs';
import path from 'node:path';

const ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
const ENV = /^[A-Z][A-Z0-9_]{1,80}$/;

export class ConfigError extends Error {}

function httpsUrl(v) {
  if (typeof v !== 'string') return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}

function regex(src, where, errors) {
  if (typeof src !== 'string') { errors.push(`${where}: versionPattern missing`); return; }
  try { const r = new RegExp(src); if (!/\((?!\?)/.test(src)) errors.push(`${where}: versionPattern needs one capture group`); return r; }
  catch (e) { errors.push(`${where}: versionPattern invalid (${e.message})`); }
}

export function validate(shared, projects) {
  const errors = [];
  for (const [k, v] of Object.entries(shared.routes || {})) if (!ENV.test(v)) errors.push(`routes.${k}: not an env var name`);
  if (!shared.routes?.monitor) errors.push('routes.monitor missing');
  for (const c of shared.canaries || []) if (!httpsUrl(c)) errors.push(`canary ${c}: not https`);
  const seen = new Set();
  for (const p of projects) {
    const w = `project ${p.id ?? '?'}`;
    if (!ID.test(p.id || '')) errors.push(`${w}: bad id`);
    if (seen.has(p.id)) errors.push(`${w}: duplicate id`); seen.add(p.id);
    if (typeof p.enabled !== 'boolean') errors.push(`${w}: enabled must be true / false`);
    for (const [k, v] of Object.entries(p.routes || {})) if (!ENV.test(v)) errors.push(`${w}: routes.${k} not an env var name`);
    const ids = new Set();
    for (const c of p.checks || []) {
      const cw = `${w} check ${c.id ?? '?'}`;
      if (!ID.test(c.id || '')) errors.push(`${cw}: bad id`);
      if (ids.has(c.id)) errors.push(`${cw}: duplicate id`); ids.add(c.id);
      if (!['http', 'release'].includes(c.type)) errors.push(`${cw}: unknown type ${c.type}`);
      if (!p.enabled) continue; // unknown values allowed while disabled
      if (!httpsUrl(c.url)) errors.push(`${cw}: url must be a known https URL (enabled project)`);
      if (c.type === 'release') {
        regex(c.versionPattern, cw, errors);
        if (c.expected) { if (!httpsUrl(c.expected.url)) errors.push(`${cw}: expected.url must be https`); regex(c.expected.versionPattern, `${cw} expected`, errors); }
      }
    }
    if (p.enabled && !(p.checks || []).length) errors.push(`${w}: enabled without checks`);
    if (p.enabled) for (const k of ['alerts', 'releases']) if (!routeOf(shared, p, k)) errors.push(`${w}: no ${k} route (project routes.${k} or shared routes.${k})`);
  }
  if (errors.length) throw new ConfigError(errors.join('; '));
}

export function load(dir) {
  const shared = JSON.parse(fs.readFileSync(path.join(dir, 'monitor.json'), 'utf8'));
  const pdir = path.join(dir, 'projects');
  const projects = fs.readdirSync(pdir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => ({ ...JSON.parse(fs.readFileSync(path.join(pdir, f), 'utf8')), _file: f }));
  for (const p of projects) if (p.id && `${p.id}.json` !== p._file) throw new ConfigError(`${p._file}: id must match the file name`);
  validate(shared, projects);
  return { shared, projects };
}

// Route for a project: its own env var name if set, else the shared one.
export const routeOf = (shared, project, kind) => project?.routes?.[kind] || shared.routes[kind];
