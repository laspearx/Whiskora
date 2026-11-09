import { test, expect, type Page, type Route } from '@playwright/test';

const SUPA = 'http://127.0.0.1:9';
const cases = [
  { path: 'marketplace', table: 'products', group: 'Product category', category: 'Food' },
  { path: 'service-hub', table: 'services', group: 'Service category', category: 'Grooming' },
] as const;

async function controlled(page: Page, table: string) {
  const pending: { route: Route; done: () => void; finished: Promise<void>; replied: boolean }[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/hydration|Minified React error #(418|423|425)/i.test(message.text())) errors.push(message.text());
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost') return route.continue();
    if (url.origin === SUPA && url.pathname.startsWith('/rest/v1/')) return route.fulfill({ json: [] });
    return route.abort();
  });
  await page.route(`${SUPA}/rest/v1/${table}?*`, async route => {
    let done!: () => void;
    const finished = new Promise<void>(resolve => { done = resolve; });
    pending.push({ route, done, finished, replied: false });
    await finished;
  });
  return {
    pending, errors,
    async count(n: number) { await expect.poll(() => pending.length).toBe(n); },
    async reply(index: number, title: string | null) {
      const item = pending[index];
      expect(item.replied).toBe(false); item.replied = true;
      const response = page.waitForResponse(res => res.request() === item.route.request());
      const row = table === 'products'
        ? { id: 501, name: title, price: 450, image_url: null, shops: { id: 77, shop_name: 'Sample Shop' } }
        : { id: 601, service_name: title, category: 'อาบน้ำ-ตัดขน', address: null, image_url: null, pet_types: ['cat'], is_published: true };
      await item.route.fulfill(title === null
        ? { status: 400, json: { code: 'SYNTHETIC', message: 'Synthetic request failure' } }
        : { json: [row] });
      item.done();
      await (await response).finished();
      // Let response parsing and React rendering run before checking a late result.
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    },
  };
}

for (const c of cases) {
  test(`${c.path}: rapid filters ignore slow success and error from older requests`, async ({ page }) => {
    const mock = await controlled(page, c.table);
    await page.goto(`/en/${c.path}`); await mock.count(1);
    await page.getByRole('group', { name: c.group }).getByRole('button', { name: c.category, exact: true }).click(); await mock.count(2);
    await page.getByRole('group', { name: 'Species' }).getByRole('button', { name: 'Cat', exact: true }).click(); await mock.count(3);
    const url = new URL(mock.pending[2].route.request().url());
    expect(url.searchParams.get('category')).toBe(`eq.${c.table === 'products' ? 'อาหาร' : 'อาบน้ำ-ตัดขน'}`);
    if (c.table === 'products') expect(url.searchParams.get('pet_type')).toBe('eq.cat');
    else { expect(url.searchParams.get('pet_types')).toBe('cs.{cat}'); expect(url.searchParams.get('is_published')).toBe('eq.true'); }
    await mock.reply(2, 'Newest filter success'); await expect(page.getByText('Newest filter success', { exact: true })).toBeVisible();
    await mock.reply(1, 'Obsolete middle result'); await mock.reply(0, null);
    await expect(page.getByText('Newest filter success', { exact: true })).toBeVisible();
    await expect(page.getByText('Obsolete middle result', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId(`${c.path}-error`)).toHaveCount(0);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    expect(mock.errors).toEqual([]);
  });

  test(`${c.path}: pending retry cannot overwrite a newer successful filter`, async ({ page }) => {
    const mock = await controlled(page, c.table);
    await page.goto(`/en/${c.path}`); await mock.count(1); await mock.reply(0, null);
    await expect(page.getByTestId(`${c.path}-error`)).toBeVisible();
    await page.getByRole('button', { name: 'Try again', exact: true }).click(); await mock.count(2);
    await page.getByRole('group', { name: c.group }).getByRole('button', { name: c.category, exact: true }).click(); await mock.count(3);
    await mock.reply(2, 'After retry success'); await mock.reply(1, null);
    await expect(page.getByText('After retry success', { exact: true })).toBeVisible();
    await expect(page.getByTestId(`${c.path}-error`)).toHaveCount(0);
    expect(mock.errors).toEqual([]);
  });

  test(`${c.path}: unmount and back navigation isolate each page instance`, async ({ page }) => {
    const mock = await controlled(page, c.table);
    await page.goto(`/en/${c.path}`); await mock.count(1);
    await page.locator('footer').getByRole('link', { name: /About/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
    await mock.reply(0, null);
    await expect(page.getByRole('heading', { level: 1, name: 'About Whiskora' })).toBeVisible();
    await page.goBack(); await mock.count(2); await mock.reply(1, 'Remounted success');
    await expect(page.getByText('Remounted success', { exact: true })).toBeVisible();
    await expect(page.getByTestId(`${c.path}-error`)).toHaveCount(0);
    expect(mock.errors).toEqual([]);
  });

  test(`${c.path}: newest failure survives an older success and recovers on retry`, async ({ page }) => {
    const mock = await controlled(page, c.table);
    await page.goto(`/en/${c.path}`); await mock.count(1);
    await page.getByRole('group', { name: c.group }).getByRole('button', { name: c.category, exact: true }).click(); await mock.count(2);
    await mock.reply(1, null); await mock.reply(0, 'Outdated success');
    await expect(page.getByTestId(`${c.path}-error`)).toBeVisible();
    await expect(page.getByText('Outdated success', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again', exact: true }).click(); await mock.count(3); await mock.reply(2, 'Recovered latest request');
    await expect(page.getByText('Recovered latest request', { exact: true })).toBeVisible();
    expect(mock.errors).toEqual([]);
  });
}

test('service cards in TH/EN retain their layout without invented reviews', async ({ page }, testInfo) => {
  const mock = await controlled(page, 'services');
  for (const [index, locale] of ['th', 'en'].entries()) {
    await page.goto(`/${locale}/service-hub`); await mock.count(index + 1); await mock.reply(index, 'Sample service');
    const card = page.locator('a[href*="/services/601"]');
    await expect(card).toBeVisible(); await expect(card).not.toContainText(/4\.9|\(120\)/);
    await expect(card.locator('svg polygon')).toHaveCount(0);
    const action = card.getByText(locale === 'en' ? 'View details' : 'ดูรายละเอียด', { exact: false });
    await expect(action).toBeVisible();
    const bounds = await card.boundingBox(), actionBounds = await action.boundingBox();
    expect(bounds).not.toBeNull(); expect(actionBounds).not.toBeNull();
    expect(actionBounds!.x).toBeGreaterThanOrEqual(bounds!.x);
    expect(actionBounds!.x + actionBounds!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: testInfo.outputPath(`service-hub-${locale}.png`), fullPage: true });
  }
  expect(mock.errors).toEqual([]);
});
