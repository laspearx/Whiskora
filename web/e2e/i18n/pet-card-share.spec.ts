import { test, expect } from '@playwright/test';

test('actual card shares its existing public URL and clipboard fallback; normal-size card remains intact', async ({ page }) => {
  const writes: string[] = [];
  await page.addInitScript(() => {
    if (location.origin !== 'http://localhost:3132') return;
    const id = '00000000-0000-4000-8000-000000000001';
    const encode = (v: object) => btoa(JSON.stringify(v)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.synthetic`, refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800, user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost') return route.continue();
    if (url.origin !== 'http://127.0.0.1:9') return route.abort();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) && !url.pathname.includes('/rpc/')) writes.push(url.pathname);
    if (url.pathname.endsWith('/pets')) return route.fulfill({ json: { id: 990001, name: 'Synthetic Pet', species: 'cat', gender: 'female', farm_id: null } });
    return route.fulfill({ json: [] });
  });
  page.on('dialog', dialog => dialog.accept());
  for (const width of [320, 390, 1440]) for (const locale of ['th', 'en']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${locale}/pets/990001/id-card`);
    await expect(page.getByText('Synthetic Pet', { exact: true })).toBeVisible();
    await expect(page.locator('.pc-qr-box > img')).toHaveAttribute('src', /^data:image\/png/);
    await expect.poll(() => page.locator('.pet-card').evaluate(n => Math.round((n as HTMLElement).offsetHeight))).toBe(580);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { document.body.dataset.shared = JSON.stringify(data); } });
    });
    await page.locator('.idc-actions button').click();
    await expect.poll(() => page.locator('body').getAttribute('data-shared')).toBe(JSON.stringify({ title: 'Synthetic Pet - Whiskora Pet ID', url: 'http://localhost:3132/p/990001' }));
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (url: string) => { document.body.dataset.copied = url; } } });
    });
    await page.locator('.idc-actions button').click();
    await expect(page.locator('body')).toHaveAttribute('data-copied', 'http://localhost:3132/p/990001');
  }
  expect(writes).toEqual([]);
});
