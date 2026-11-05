// Measure actual JavaScript, separately from HTML/RSC translation payloads.
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

test('cold-page JavaScript and production chunks', async ({ browser }) => {
  test.setTimeout(240_000);
  const routes = [];
  for (const path of ['/en/terms', '/th/terms', '/en/marketplace', '/th/marketplace', '/en/service-hub', '/th/service-hub', '/en/about', '/th/about']) {
    const context = await browser.newContext({ baseURL: 'http://localhost:3132', viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'localhost') return route.continue();
      if (url.origin === 'http://127.0.0.1:9' && url.pathname.startsWith('/rest/v1/')) return route.fulfill({ json: [] });
      return route.abort();
    });
    const pending: Promise<void>[] = [];
    const files = new Map<string, { path: string; rawBytes: number; gzipBytes: number; sha256: string }>();
    page.on('response', response => {
      if (response.request().resourceType() !== 'script' || new URL(response.url()).hostname !== 'localhost') return;
      pending.push((async () => {
        expect(response.ok()).toBe(true);
        const body = await response.body();
        const path = new URL(response.url()).pathname;
        files.set(path, { path, rawBytes: body.length, gzipBytes: gzipSync(body).length, sha256: createHash('sha256').update(body).digest('hex') });
      })());
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    await Promise.all(pending);
    expect(files.size).toBeGreaterThan(0);
    const javascript = [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
    routes.push({ path, javascript, rawBytes: javascript.reduce((n, f) => n + f.rawBytes, 0), gzipBytes: javascript.reduce((n, f) => n + f.gzipBytes, 0) });
    await context.close();
  }
  const chunks: { path: string; rawBytes: number; gzipBytes: number; catalogueSentinel: boolean }[] = [];
  const sentinel = JSON.parse(readFileSync('messages/th.json', 'utf8')).home.heroSubtitle;
  function walk(dir: string) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) walk(path);
      else if (path.endsWith('.js')) {
        const body = readFileSync(path);
        chunks.push({ path: relative('.next', path), rawBytes: body.length, gzipBytes: gzipSync(body).length, catalogueSentinel: body.toString().includes(sentinel) });
      }
    }
  }
  walk('.next/static');
  const label = process.env.I18N_RUN_LABEL || 'bundle';
  const out = resolve(process.env.I18N_EVIDENCE_DIR || '../local-evidence/i18n-phase2-findings-20261104');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${label}-javascript.json`), JSON.stringify({
    label, routes, chunks,
    totalRawBytes: chunks.reduce((n, f) => n + f.rawBytes, 0),
    totalGzipBytes: chunks.reduce((n, f) => n + f.gzipBytes, 0),
    note: 'Raw response bodies and independently gzipped JavaScript, unique URLs per fresh context. HTML/RSC/CSS excluded. Gzip sizes are computed comparison sizes, not claimed browser wire transfer sizes.',
  }, null, 2) + '\n');
});
