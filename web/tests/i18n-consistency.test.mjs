// cd web && node --test tests/i18n-consistency.test.mjs — messages/{th,en}.json consistency + static key usage.
// No browser, no network. Language-switch behaviour in the browser: e2e/i18n/language.spec.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WEB = new URL('../', import.meta.url).pathname;
const th = JSON.parse(readFileSync(join(WEB, 'messages/th.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(WEB, 'messages/en.json'), 'utf8'));
const THAI = /[฀-๿]/;
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const fth = new Map(flat(th)), fen = new Map(flat(en));
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

test('th and en have exactly the same keys', () => {
  assert.deepEqual([...fth.keys()].filter((k) => !fen.has(k)), [], 'only in th');
  assert.deepEqual([...fen.keys()].filter((k) => !fth.has(k)), [], 'only in en');
});
test('no empty values', () => {
  for (const [m, name] of [[fth, 'th'], [fen, 'en']]) for (const [k, v] of m) assert.ok(v !== '' && v != null, `${name}:${k}`);
});
test('placeholders ({n}, {name}, …) match between th and en', () => {
  for (const [k, v] of fth) if (typeof v === 'string') assert.equal(vars(fen.get(k)), vars(v), k);
});
test('English values contain no Thai text', () => {
  for (const [k, v] of fen) assert.doesNotMatch(String(v), THAI, k);
});

// ── static: keys called in code exist in both files ─────────────────────────────────────────────────────────────
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|mts)$/.test(n)) files.push(p);
  }
})(join(WEB, 'app'));
test('every literal key passed to t() exists in th and en', () => {
  const missing = [];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    for (const [, v, ns] of s.matchAll(/const (\w+)\s*=\s*useTranslations\(['"](\w+)['"]\)/g)) {
      for (const [, key] of s.matchAll(new RegExp(`\\b${v}(?:\\.raw)?\\(\\s*['"]([\\w.]+)['"]\\s*[),]`, 'g'))) {
        for (const [m, name] of [[fth, 'th'], [fen, 'en']]) {
          const full = `${ns}.${key}`;
          if (!m.has(full) && ![...m.keys()].some((k) => k.startsWith(full + '.'))) missing.push(`${name}:${full} (${relative(WEB, f)})`);
        }
      }
    }
  }
  assert.deepEqual(missing, []);
});
test('Navbar: every nav key it uses exists, and no Thai UI text is hard-coded (comments excepted)', () => {
  const src = readFileSync(join(WEB, 'app/components/Navbar.tsx'), 'utf8');
  const code = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '').replace(/(^|\s)\/\*[\s\S]*?\*\//g, '$1');
  assert.doesNotMatch(code, THAI);
  // keys referenced indirectly through the EXPLORE table / workspace labels
  const table = [...src.matchAll(/(?:label|sub|badge):\s*'(\w+)'/g)].map((m) => m[1]);
  const ws = [...src.matchAll(/(?:personal|farm|shop|service):\s*'(ws\w+)'/g)].map((m) => m[1]);
  for (const k of [...table, ...ws]) for (const [m, name] of [[fth, 'th'], [fen, 'en']]) assert.ok(m.has(`nav.${k}`), `${name}:nav.${k}`);
  assert.ok(table.length >= 13 && ws.length === 4);
});
