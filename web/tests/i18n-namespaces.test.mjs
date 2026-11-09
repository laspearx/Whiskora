// cd web && node --test tests/i18n-namespaces.test.mjs — scoped messages (i18n Phase 2): every namespace a component
// asks for must reach it — from the [locale] layout (GLOBAL + LAYOUT_EXTRA) or from the route's <ScopedMessages ns>.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const WEB = new URL('../', import.meta.url).pathname;
const read = (p) => readFileSync(join(WEB, p), 'utf8');
const list = (src, name) => [...(src.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/'(\w+)'/g)].map((m) => m[1]);
const nsFile = read('lib/i18n-namespaces.ts');
const GLOBAL = list(nsFile, 'GLOBAL_NAMESPACES');
const EXTRA = list(nsFile, 'LAYOUT_EXTRA_NAMESPACES');
const messages = JSON.parse(read('messages/en.json'));

const files = [];
(function walk(d) {
  for (const n of readdirSync(join(WEB, d))) {
    const p = join(d, n);
    if (statSync(join(WEB, p)).isDirectory()) walk(p); else if (/\.tsx?$/.test(n)) files.push(p);
  }
})('app');
const used = (src) => [...src.matchAll(/useTranslations\(\s*['"](\w+)['"]\s*\)/g)].map((m) => m[1]);

// the [locale] route file that renders a given component file: its own page, or — for files in private folders
// such as app/explore/_components — the nearest ancestor route that has a [locale] page
function routeFileFor(f) {
  if (f.startsWith('app/[locale]/_home/')) return 'app/[locale]/page.tsx';
  if (f.startsWith('app/[locale]/')) return join(dirname(f), 'page.tsx');
  let dir = dirname(f).replace(/^app\/?/, '');
  while (dir && dir !== '.') {
    const candidate = `app/[locale]/${dir}/page.tsx`;
    if (existsSync(join(WEB, candidate))) return candidate;
    dir = dirname(dir);
  }
  return null;
}
const scoped = (routeFile) => {
  if (!routeFile || !existsSync(join(WEB, routeFile))) return [];
  const m = read(routeFile).match(/ns=\{\[([^\]]*)\]\}/);
  return m ? [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : [];
};

test('global namespaces exist in the messages', () => {
  for (const n of [...GLOBAL, ...EXTRA]) assert.ok(messages[n], n);
  assert.deepEqual(GLOBAL, ['nav', 'footer', 'common']);
});
test('every useTranslations(ns) is provided to its component', () => {
  const missing = [];
  for (const f of files) {
    const src = read(f);
    for (const ns of used(src)) {
      if (GLOBAL.includes(ns) || EXTRA.includes(ns)) continue;
      if (f.startsWith('app/components/')) { missing.push(`${f}: '${ns}' used by a shared component must be global`); continue; }
      const rf = routeFileFor(f);
      if (!scoped(rf).includes(ns)) missing.push(`${f}: '${ns}' not in <ScopedMessages ns> of ${rf}`);
    }
  }
  assert.deepEqual(missing, []);
});
test('every namespace named in a <ScopedMessages ns> exists, and pages do not re-send global ones', () => {
  for (const f of files.filter((x) => x.startsWith('app/[locale]/') && x.endsWith('page.tsx'))) {
    for (const ns of scoped(f)) {
      assert.ok(messages[ns], `${f}: unknown namespace '${ns}'`);
      assert.ok(!GLOBAL.includes(ns), `${f}: '${ns}' is already global`);
    }
  }
});
test('the layout sends only the global namespaces (never the whole messages file)', () => {
  const layout = read('app/[locale]/layout.tsx');
  assert.match(layout, /pickMessages\(locale, \[\.\.\.GLOBAL_NAMESPACES, \.\.\.LAYOUT_EXTRA_NAMESPACES\]\)/);
  assert.doesNotMatch(layout, /import\(['"]@\/messages\//);
});
test('relative path helper sanity', () => {
  assert.equal(routeFileFor('app/farm-hub/page.tsx'), 'app/[locale]/farm-hub/page.tsx');
  assert.equal(routeFileFor('app/[locale]/_home/HomePage.tsx'), 'app/[locale]/page.tsx');
  assert.equal(routeFileFor('app/farm-dashboard/[id]/reservations/page.tsx'), 'app/[locale]/farm-dashboard/[id]/reservations/page.tsx');
  assert.equal(relative('a', 'a/b'), 'b');
});

test('client components never import a complete translation catalogue', () => {
  for (const f of files) {
    const source = read(f);
    if (/^\s*['"]use client['"]/.test(source)) {
      assert.doesNotMatch(source, /(?:from\s*|import\s*\()['"][^'"]*messages\/(?:th|en)\.json/, f);
    }
  }
  assert.match(read('app/components/ScopedMessages.tsx'), /import 'server-only'/);
});

test('RootChrome receives only fallback globals from the server; route scopes remain independent', () => {
  const root = read('app/layout.tsx');
  assert.match(root, /<RootChrome messages=\{pickMessages\('th', GLOBAL_NAMESPACES\)\}/);
  assert.doesNotMatch(read('app/components/RootChrome.tsx'), /messages\/(th|en)\.json|ScopedMessages/);
  for (const locale of ['th', 'en']) {
    const all = JSON.parse(read(`messages/${locale}.json`));
    const globals = Object.fromEntries(GLOBAL.map(n => [n, all[n]]));
    assert.deepEqual(Object.keys(globals), ['nav', 'footer', 'common']);
    assert.ok(!('marketplace' in globals) && !('serviceHub' in globals));
  }
});
