// Static checks for H1 (20261102110000): the app never selects '*' (or a private column) from farms, and the app's
// FARM_PUBLIC_COLUMNS equals the migration's column grant list. node --test supabase/tests/farm_columns_static.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIG = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261102110000_farm_private_location.sql'), 'utf8');
const LIB = fs.readFileSync(path.join(ROOT, 'web/lib/farmColumns.ts'), 'utf8');
const PRIVATE = ['address', 'house_no', 'room_no', 'moo', 'soi', 'road', 'postal_code', 'lat', 'lng', 'verification_note'];
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean).sort();

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'node_modules' || d.name.startsWith('.') ? [] : files(p);
    return /\.(tsx?|mjs)$/.test(d.name) ? [p] : [];
  });
}

test('FARM_PUBLIC_COLUMNS = the columns the migration grants', () => {
  const granted = MIG.match(/grant select \(([^)]*)\)\s+on public\.farms to anon, authenticated/)[1];
  const app = LIB.match(/FARM_PUBLIC_COLUMNS = '([^']*)'/)[1];
  assert.deepEqual(list(app), list(granted));
  for (const c of PRIVATE) assert.ok(!list(granted).includes(c), c);
});

test('no farms query selects * or a private column (web/app, web/lib)', () => {
  const bad = [];
  for (const f of [...files(path.join(ROOT, 'web/app')), ...files(path.join(ROOT, 'web/lib'))]) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/from\(\s*['"]farms['"]\s*\)([\s\S]{0,400}?)(?=;|\n\s*\n|\.from\(|from\()/g)) { // one query chain
      const sel = (m[1].match(/\.select\(\s*(['"`])([^'"`]*)\1/) || [])[2];
      if (sel == null) continue;
      const cols = sel.split(',').map((x) => x.trim());
      if (cols.includes('*') || cols.some((c) => PRIVATE.includes(c))) bad.push(`${path.relative(ROOT, f)}: ${sel}`);
    }
    for (const m of s.matchAll(/farms(?:!inner)?\(([^)]*)\)/g)) { // embedded selects, e.g. pets → farms(...)
      const cols = m[1].split(',').map((x) => x.trim());
      if (cols.includes('*') || cols.some((c) => PRIVATE.includes(c))) bad.push(`${path.relative(ROOT, f)}: embedded farms(${m[1]})`);
    }
  }
  assert.deepEqual(bad, []);
});
