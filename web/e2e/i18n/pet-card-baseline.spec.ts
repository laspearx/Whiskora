import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A new capture directory keeps the original before-fix evidence intact on reruns.
const out = resolve(process.env.I18N_EVIDENCE_DIR || '../local-evidence/pet-id-mobile-card-20261104', `baseline-${Date.now()}`);
const widths = [320, 360, 375, 390, 430, 1440];

test('baseline: record application card bounds and demo export without external QR access', async ({ page }) => {
  mkdirSync(out, { recursive: true });
  await page.addInitScript(() => {
    if (location.origin !== 'http://localhost:3132') return;
    const id = '00000000-0000-4000-8000-000000000001';
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.synthetic`, refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800, user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
  });
  const blocked: string[] = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost') return route.continue();
    if (url.origin !== 'http://127.0.0.1:9') { blocked.push(url.origin); return route.abort(); }
    if (url.pathname.endsWith('/pets')) return route.fulfill({ json: { id: 990001, name: 'Synthetic Trust Pet', species: 'cat', gender: 'female', farm_id: null, is_public: true } });
    if (url.pathname.endsWith('/get_pet_health')) return route.fulfill({ json: [{ blood_type: null }] });
    return route.fulfill({ json: [] });
  });
  const measurements = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/pets/990001/id-card');
    await expect(page.getByText('Synthetic Trust Pet', { exact: true })).toBeVisible();
    await page.waitForTimeout(700); // measure after the application's 450ms entrance animation
    measurements.push(await page.evaluate(() => {
      const card = document.querySelector('.pet-card')!, scaler = document.querySelector('.idc-card-scaler')!;
      const c = card.getBoundingClientRect(), s = scaler.getBoundingClientRect();
      return { width: innerWidth, card: c.toJSON(), scaler: s.toJSON(), transform: getComputedStyle(card).transform, animation: getComputedStyle(card).animation, clippedX: c.right - s.right, clippedY: c.bottom - s.bottom };
    }));
    await page.screenshot({ path: resolve(out, `before-actual-${width}.png`), fullPage: true });
    await page.goto('/en/pet-id-card-preview');
    await expect(page.locator('.sample-card-rendered')).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: resolve(out, `before-demo-${width}.png`), fullPage: true });
  }
  writeFileSync(resolve(out, 'baseline-bounds.json'), JSON.stringify({ measurements, blockedOrigins: [...new Set(blocked)] }, null, 2));
});
