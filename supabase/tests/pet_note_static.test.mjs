// Static check for M4 (20261102130000): no pets query in the app asks for `note`. node --test supabase/tests/pet_note_static.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === 'node_modules' || e.name.startsWith('.') ? [] : walk(path.join(d, e.name))) : /\.(tsx?|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []);
test('PET_COLUMNS has no note', () => {
  const s = fs.readFileSync(path.join(ROOT, 'web/lib/columns.ts'), 'utf8');
  const cols = s.match(/PET_COLUMNS =\s*'([^']*)'/)[1].split(',').map((x) => x.trim());
  assert.ok(!cols.includes('note'));
});
test('no pets select lists note (web/app, web/lib)', () => {
  const bad = [];
  for (const f of [...walk(path.join(ROOT, 'web/app')), ...walk(path.join(ROOT, 'web/lib'))]) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/from\(\s*['"]pets['"]\s*\)\s*\.select\(\s*(['"`])([\s\S]*?)\1/g)) {
      const cols = m[2].replace(/\w+:\w+\([^)]*\)|\w+\([^)]*\)/g, '').split(',').map((x) => x.trim());
      if (cols.includes('note') || cols.includes('*')) bad.push(path.relative(ROOT, f));
    }
  }
  assert.deepEqual(bad, []);
});
