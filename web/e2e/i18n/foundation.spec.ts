// i18n Phase 1 — foundation + first public pages (home, farm-hub, search), desktop and mobile projects.
// No real backend: every non-local request is aborted; the dummy Supabase URL (127.0.0.1:9) is answered here with
// SYNTHETIC rows when a test needs data (names marked "Sample", no real people / farms / photos).
import { test, expect, type Page } from '@playwright/test';

const SUPA = 'http://127.0.0.1:9';
const FARMS = [
  { id: 901, farm_name: 'Sample Farm Bangna', cover_url: null, image_url: null, species: 'cat', province: 'กรุงเทพมหานคร', district: 'บางนา', is_verified: true },
  { id: 902, farm_name: 'Sample Farm North', cover_url: null, image_url: null, species: 'dog', province: 'เชียงใหม่', district: null, is_verified: false },
];
const PETS = [
  { id: 9101, name: 'Sample A', breed: 'Scottish Fold (สก็อตติชโฟลด์)', species: 'cat', gender: 'female', birth_date: '2025-01-15', image_url: null, price: 18000, status: 'พร้อมย้ายบ้าน', is_public: true, farm_id: 901, farms: { farm_name: 'Sample Farm Bangna', district: 'บางนา', province: 'กรุงเทพมหานคร' } },
  { id: 9102, name: 'Sample B', breed: null, species: 'dog', gender: null, birth_date: null, image_url: null, price: null, status: 'เปิดจอง', is_public: true, farm_id: 902, farms: { farm_name: 'Sample Farm North', district: null, province: 'เชียงใหม่' } },
];

async function offline(page: Page, data?: 'ok' | 'fail') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
  if (data) {
    await page.route(`${SUPA}/rest/v1/**`, (r) => {
      if (data === 'fail') return r.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"unavailable"}' });
      const path = new URL(r.request().url()).pathname;
      const body = path.endsWith('/farms') ? (r.request().url().includes('ilike') ? FARMS.slice(0, 1) : FARMS) : path.endsWith('/pets') ? PETS : [];
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
  return errors;
}
const lang = (page: Page) => page.evaluate(() => document.documentElement.lang);
const mainText = (page: Page) => page.locator('main').first().innerText();
// Thai script, excluding the baht sign U+0E3F (used in English prices too)
const THAI = /[\u0E00-\u0E3E\u0E40-\u0E7F]/;

// ── server HTML ────────────────────────────────────────────────────────────────────────────────────────────────
test('server HTML carries <html lang> for /th, /en and the 404', async ({ request }) => {
  for (const [path, l] of [['/th/terms', 'th'], ['/en/terms', 'en'], ['/en', 'en'], ['/th/farm-hub', 'th'], ['/en/does-not-exist', 'en']] as const) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(new RegExp(`<html[^>]*\\blang="${l}"`));
  }
});

test('metadata: titles / descriptions / canonical / hreflang follow the URL language', async ({ page }) => {
  await offline(page);
  await page.goto('/en/farm-hub');
  await expect(page).toHaveTitle('Pet farms and pets ready for a new home | Whiskora');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Browse pet farms on Whiskora/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/farm-hub$/);
  await expect(page.locator('link[rel="alternate"][hreflang="th"]')).toHaveAttribute('href', /\/th\/farm-hub$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_GB');
  await page.goto('/th/farm-hub');
  await expect(page).toHaveTitle('ฟาร์มสัตว์เลี้ยงและสัตว์พร้อมย้ายบ้าน | Whiskora');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/farm-hub$/);
  await page.goto('/en/search?q=x');
  await expect(page).toHaveTitle('Search farms | Whiskora');
  await page.goto('/en/terms');                       // no page metadata → English site title from the layout
  await expect(page).toHaveTitle('Whiskora | Pet ID, QR profiles and trusted pet farms');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);   // never a wrong canonical
  await page.goto('/th/terms');
  await expect(page).toHaveTitle(/^Whiskora \| Pet ID, QR Profile และฟาร์ม/);
});

// ── home ───────────────────────────────────────────────────────────────────────────────────────────────────────
test('home: English page has no Thai system text, Thai page unchanged; dates per language', async ({ page }) => {
  const errors = await offline(page);
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("All your pet's records in one place");
  await expect(page.getByRole('button', { name: /Create a free Pet ID/ }).first()).toBeVisible();
  expect(await page.locator('main.home-page').innerText()).not.toMatch(THAI);
  await expect(page.locator('main.home-page')).toContainText('10 Mar 2024');
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent() ?? '{}');
  const faq = ld['@graph'].find((g: { '@type': string }) => g['@type'] === 'FAQPage');
  expect(faq.mainEntity[0].name).toBe('What is Whiskora?');
  await page.goto('/th');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('เก็บข้อมูลสัตว์เลี้ยงไว้ที่เดียว');
  await expect(page.locator('main.home-page')).toContainText('10 มี.ค. 2567');
  expect(errors).toEqual([]);
});

// ── farm-hub ───────────────────────────────────────────────────────────────────────────────────────────────────
test('farm-hub (synthetic data): English cards — status, price, age, sex, verified badge, Bangkok wording', async ({ page }) => {
  const errors = await offline(page, 'ok');
  await page.goto('/en/farm-hub');
  await expect(page.getByRole('heading', { level: 1, name: 'Pet Market' })).toBeVisible();
  const view = page.getByRole('group', { name: 'Show' });
  await expect(view.getByRole('button', { name: 'Farms', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('group', { name: 'Species' }).getByRole('button')).toHaveText(['All', 'Cat', 'Dog', 'Rabbit', 'Bird', 'Other pets']);
  await expect(page.getByText('1 ready or open for reservation').first()).toBeVisible();
  await expect(page.getByText('บางนา, Bangkok')).toBeVisible();           // district = data, "Bangkok" = UI text
  await expect(page.getByRole('img', { name: 'Verified farm' })).toHaveCount(1);
  await view.getByRole('button', { name: 'Pets', exact: true }).click();
  await expect(page.getByText('฿18,000')).toBeVisible();
  await expect(page.getByText('Price on request')).toBeVisible();
  await expect(page.getByText('Open for reservation', { exact: true })).toBeVisible();
  await expect(page.getByText('Ready now')).toBeVisible();
  await expect(page.getByText('Scottish Fold', { exact: true })).toBeVisible();  // English part of "Scottish Fold (สก็อตติชโฟลด์)"
  await expect(page.getByText(/^Age \d+ yr/)).toBeVisible();
  await expect(page.getByText('Age not specified')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Female', exact: true })).toHaveCount(1);   // unknown sex → no icon
  await expect(page.getByRole('img', { name: 'Male', exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('farm-hub (synthetic data): Thai cards keep Thai wording and Buddhist-era-free numbers', async ({ page }) => {
  await offline(page, 'ok');
  await page.goto('/th/farm-hub');
  await expect(page.getByText('เขตบางนา')).toBeVisible();
  await page.getByRole('group', { name: 'แสดงผล' }).getByRole('button', { name: 'ดูสัตว์เลี้ยง' }).click();
  await expect(page.getByText('สก็อตติชโฟลด์', { exact: true })).toBeVisible();
  await expect(page.getByText('฿18,000')).toBeVisible();
  await expect(page.getByText('สอบถามราคา')).toBeVisible();
  await expect(page.getByText(/^อายุ \d+ ปี/)).toBeVisible();
});

test('farm-hub: a failed load shows an error with retry (not "no farms"), in the page language', async ({ page }) => {
  await offline(page, 'fail');
  await page.goto('/en/farm-hub');
  await expect(page.getByTestId('farm-hub-error')).toContainText("Couldn't load this page");
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.goto('/th/farm-hub');
  await expect(page.getByTestId('farm-hub-error')).toContainText('โหลดข้อมูลไม่สำเร็จ');
});

test('farm-hub (synthetic data): empty search shows the translated empty state', async ({ page }) => {
  await offline(page, 'ok');
  await page.goto('/en/farm-hub');
  await page.getByRole('searchbox', { name: 'Search farms or provinces' }).fill('zzzz');
  await expect(page.getByText('No farms found')).toBeVisible();
  await expect(page.getByText('Try another search or species')).toBeVisible();
});

// ── search ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('search: no query, results, empty and error states in both languages', async ({ page }) => {
  await offline(page, 'ok');
  await page.goto('/en/search');
  await expect(page.getByTestId('search-no-query')).toContainText('Type a farm name to search');
  await page.goto('/en/search?q=Bangna');
  await expect(page.getByText('Results for "Bangna"')).toBeVisible();
  await expect(page.getByText('Sample Farm Bangna')).toBeVisible();
  await expect(page.getByText('Cat farm on Whiskora')).toBeVisible();
  await page.goto('/th/search?q=Bangna');
  await expect(page.getByText('ฟาร์มแมวบน Whiskora')).toBeVisible();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await offline(page, 'fail');
  await page.goto('/en/search?q=Bangna');
  await expect(page.getByTestId('search-error')).toContainText("Couldn't load this page");
  expect(await mainText(page)).not.toMatch(THAI);
});

// ── switching ──────────────────────────────────────────────────────────────────────────────────────────────────
test('switching keeps path, query and hash; refresh / back / forward keep the right language', async ({ page }) => {
  await offline(page, 'ok');
  await page.goto('/th/search?q=Bangna#results');
  const mobile = (page.viewportSize()?.width ?? 1440) < 768;
  if (mobile) await page.getByRole('button', { name: 'เปิดเมนู' }).click();
  await page.locator('nav').first().getByRole('button', { name: /^EN\b/ }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/search\?q=Bangna#results$/);
  await expect.poll(() => lang(page)).toBe('en');
  await expect(page.getByText('Results for "Bangna"')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Results for "Bangna"')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/th\/search\?q=Bangna#results$/);
  await expect(page.getByText('คำค้นหา: "Bangna"')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/en\/search\?q=Bangna#results$/);
});

// ── layout ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('no horizontal overflow or hydration errors at 1440 / 768 / 390 / 360 in TH and EN', async ({ page }) => {
  test.setTimeout(600_000);   // 24 fresh tabs on `next dev`
  // a fresh tab per URL: reloading the image-heavy home page many times in one tab can crash Chromium in dev mode
  const ctx = page.context();
  for (const width of [1440, 768, 390, 360]) {
    for (const path of ['/th', '/en', '/th/farm-hub', '/en/farm-hub', '/th/search?q=Bangna', '/en/search?q=Bangna']) {
      const p = await ctx.newPage();
      const errors = await offline(p, 'ok');
      await p.setViewportSize({ width, height: 900 });
      await p.goto(path, { timeout: 60_000 }).catch(() => p.goto(path, { timeout: 60_000 }));   // dev server: a navigation can be aborted or stall while it compiles
      await p.waitForLoadState('networkidle');
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over, `${path} @${width}`).toBeLessThanOrEqual(0);
      expect(errors, `${path} @${width}`).toEqual([]);
      await p.close();
    }
  }
});
