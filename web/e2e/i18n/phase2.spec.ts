// i18n Phase 2 — scoped messages + marketplace, service-hub, community, about (desktop + mobile projects).
// No real backend: non-local requests are aborted; the dummy Supabase URL answers with SYNTHETIC rows ("Sample").
import { test, expect, type Page } from '@playwright/test';

const SUPA = 'http://127.0.0.1:9';
const PRODUCTS = [{ id: 501, name: 'Sample Kibble', price: 450, original_price: 500, discount: 10, image_url: null, category: 'อาหาร', pet_type: 'cat', created_at: '2026-10-01', shops: { shop_name: 'Sample Shop', id: 77 } }];
const SERVICES = [{ id: 601, service_name: 'Sample Grooming', category: 'อาบน้ำ-ตัดขน', address: null, image_url: null, pet_types: ['cat'], is_published: true, created_at: '2026-10-01' }];
// Thai script, excluding the baht sign U+0E3F (used in English prices too)
const THAI = /[\u0E00-\u0E3E\u0E40-\u0E7F]/;

async function offline(page: Page, data?: 'ok' | 'fail', seen?: string[]) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
  if (data) {
    await page.route(`${SUPA}/rest/v1/**`, (r) => {
      const url = r.request().url();
      seen?.push(decodeURIComponent(url));
      if (data === 'fail') return r.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"unavailable"}' });
      const path = new URL(url).pathname;
      const body = path.endsWith('/products') ? PRODUCTS : path.endsWith('/services') ? SERVICES : [];
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
  return errors;
}
const lang = (page: Page) => page.evaluate(() => document.documentElement.lang);
const main = (page: Page) => page.locator('main').first();
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

test('marketplace: English UI, translated categories, the API still receives the stored Thai category', async ({ page }) => {
  const seen: string[] = [];
  const errors = await offline(page, 'ok', seen);
  await page.goto('/en/marketplace');
  await expect(page).toHaveTitle('Pet product marketplace | Whiskora');
  await expect(page.getByRole('heading', { level: 1, name: 'Marketplace' })).toBeVisible();
  const cats = page.getByRole('group', { name: 'Product category' }).getByRole('button');
  await expect(cats).toHaveText(['All', 'Food', 'Toys', 'Accessories', 'Beds & cages', 'Health & grooming']);
  await expect(page.getByRole('group', { name: 'Species' }).getByRole('button').last()).toHaveText('Other pets');
  await expect(page.getByText('฿450')).toBeVisible();
  await expect(page.getByText('Sale 10%')).toBeVisible();
  await cats.filter({ hasText: 'Food' }).click();
  await expect(cats.filter({ hasText: 'Food' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => seen.some((u) => u.includes('category=eq.อาหาร'))).toBe(true);
  expect(await main(page).innerText()).not.toMatch(THAI);
  expect(errors).toEqual([]);
});

test('marketplace / service-hub: load failure = error state with retry; empty catalogue texts', async ({ page }) => {
  await offline(page, 'fail');
  await page.goto('/en/marketplace');
  await expect(page.getByTestId('marketplace-error')).toContainText("Couldn't load this page");
  await page.goto('/th/service-hub');
  await expect(page.getByTestId('service-hub-error')).toContainText('โหลดข้อมูลไม่สำเร็จ');
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await offline(page);   // backend unreachable → supabase-js error → error state too
  await page.route(`${SUPA}/rest/v1/**`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/en/marketplace');
  await expect(page.getByText('No products for sale yet')).toBeVisible();
  await page.goto('/en/service-hub');
  await expect(page.getByText('No clinics or services yet')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register your service' })).toBeVisible();
});

test('service-hub: English UI; stored category shown with its translated label', async ({ page }) => {
  const seen: string[] = [];
  const errors = await offline(page, 'ok', seen);
  await page.goto('/en/service-hub');
  await expect(page).toHaveTitle('Pet clinics and services | Whiskora');
  await expect(page.getByRole('heading', { level: 1, name: 'Clinics & services' })).toBeVisible();
  await expect(page.getByText('Sample Grooming')).toBeVisible();
  await expect(page.locator('a[href*="/services/601"]')).toContainText('Grooming');   // badge from the stored Thai value
  await expect(page.getByText('Professional pet care')).toBeVisible();
  await page.getByRole('group', { name: 'Service category' }).getByRole('button', { name: 'Pet hotels' }).click();
  await expect.poll(() => seen.some((u) => u.includes('category=eq.โรงแรมสัตว์เลี้ยง'))).toBe(true);
  expect(await main(page).innerText()).not.toMatch(THAI);
  expect(errors).toEqual([]);
});

test('community and about: both languages, metadata, html lang', async ({ page }) => {
  const errors = await offline(page);
  await page.goto('/en/community');
  await expect(page).toHaveTitle('Pet lovers community (coming soon) | Whiskora');
  await expect(page.getByText('Coming soon', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to home' })).toBeVisible();
  expect(await main(page).innerText()).not.toMatch(THAI);
  await page.goto('/en/about');
  await expect(page).toHaveTitle('About Whiskora | Whiskora');
  await expect(page.locator('link[rel="alternate"][hreflang="th"]')).toHaveAttribute('href', /\/th\/about$/);
  await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
  await expect(page.getByText('What you can do on Whiskora')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  expect(await main(page).innerText()).not.toMatch(THAI);
  expect(await lang(page)).toBe('en');
  await page.goto('/th/about');
  await expect(page.getByRole('heading', { level: 1, name: 'เกี่ยวกับ Whiskora' })).toBeVisible();
  await expect(page.getByText('ลองเลย').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('scoped messages: a page ships only its namespaces', async ({ request }) => {
  const terms = await (await request.get('/en/terms')).text();
  expect(terms).toContain('Pet farms');                          // nav (global)
  expect(terms).not.toContain("All your pet's records");         // landing (home only)
  expect(terms).not.toContain('Pet product marketplace');         // meta is server-only
  const home = await (await request.get('/en')).text();
  expect(home).toContain("All your pet's records");
  expect(home).not.toContain('Quality products for your pet');   // marketplace
  expect(terms).toContain('Signed up with email? Log in here');   // `login` stays global until PR #37 lands
});

test('client-side navigation between translated pages never shows raw keys', async ({ page }) => {
  const errors = await offline(page, 'ok');
  const nav = page.locator('nav').first();
  const open = async () => {
    if (isMobile(page)) await page.getByRole('button', { name: 'Open menu' }).click();
    else await nav.getByRole('button', { name: 'Explore' }).click();
  };
  // Discovery promotion is hidden in Public Beta; legacy routes and their translations remain supported.
  await page.goto('/en/service-hub');
  await expect(page).toHaveURL(/\/en\/service-hub$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Clinics & services' })).toBeVisible();
  await open();
  await expect(nav.getByRole(isMobile(page) ? 'button' : 'link', { name: /Clinics & services/ })).toHaveCount(0);
  await nav.getByRole(isMobile(page) ? 'button' : 'link', { name: /About Whiskora/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
  await expect(main(page)).not.toContainText(/\b(subtitle|noteText|featuresLabel|category\.\w+)\b/);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Clinics & services' })).toBeVisible();
  await page.goto('/en/marketplace');
  await expect(page).toHaveURL(/\/en\/marketplace$/);
  await expect(page.getByText('Quality products for your pet from our partner shops')).toBeVisible();
  await open();
  await expect(nav.getByRole(isMobile(page) ? 'button' : 'link', { name: /Pet Shop/ })).toHaveCount(0);
  await nav.getByRole(isMobile(page) ? 'button' : 'link', { name: /About Whiskora/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
  await expect(main(page)).not.toContainText(/\b(subtitle|noteText|featuresLabel|category\.\w+)\b/);
  await page.goBack();
  await expect(page.getByText('Quality products for your pet from our partner shops')).toBeVisible();
  expect(errors).toEqual([]);
});

test('language switch on a Phase 2 page keeps path, query and hash; refresh / back / forward', async ({ page }) => {
  await offline(page, 'ok');
  await page.goto('/th/about?ref=test#features');
  if (isMobile(page)) await page.getByRole('button', { name: 'เปิดเมนู' }).click();
  await page.locator('nav').first().getByRole('button', { name: /^EN\b/ }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/about\?ref=test#features$/);
  await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'เกี่ยวกับ Whiskora' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
});

test('no overflow / hydration errors / Thai on /en at 1440 / 768 / 390 / 360', async ({ page }) => {
  test.setTimeout(900_000);   // 32 fresh tabs on `next dev`
  const ctx = page.context();
  for (const width of [1440, 768, 390, 360]) {
    for (const path of ['/marketplace', '/service-hub', '/community', '/about']) {
      for (const loc of ['th', 'en']) {
        const p = await ctx.newPage();
        const errors = await offline(p, 'ok');
        await p.setViewportSize({ width, height: 900 });
        await p.goto(`/${loc}${path}`, { timeout: 60_000 }).catch(() => p.goto(`/${loc}${path}`, { timeout: 60_000 }));
        await p.waitForLoadState('networkidle');
        const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `${loc}${path} @${width}`).toBeLessThanOrEqual(0);
        if (loc === 'en') expect(await p.locator('body').innerText(), `${path} @${width}`).not.toMatch(THAI);
        expect(errors, `${loc}${path} @${width}`).toEqual([]);
        await p.close();
      }
    }
  }
});
