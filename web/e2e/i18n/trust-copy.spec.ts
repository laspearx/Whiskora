import { test, expect } from '@playwright/test';

const legacyClaims = /PDPA compliant|Verified by Whiskora|WHISKORA VERIFIED|รับรองความถูกต้อง/;

test('Pet ID marketing explains registration and QR access in TH/EN across navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost') return route.continue();
    if (url.origin === 'http://127.0.0.1:9') return route.fulfill({ json: [] });
    return route.abort();
  });
  for (const locale of ['th', 'en']) {
    await page.goto(`/${locale}/pet-id-card`);
    await expect(page.getByText(locale === 'th' ? 'ลงทะเบียน Pet ID แล้ว' : 'Pet ID registered', { exact: true })).toBeVisible();
    await expect(page.getByText(locale === 'th' ? 'QR เชื่อมโยงโปรไฟล์' : 'QR profile link', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(legacyClaims);
    await expect(page.locator('footer a[href$="/privacy"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('body')).not.toContainText(/trustCopy\.|registeredHint/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
  await page.goBack();
  await expect(page.locator('body')).not.toContainText(legacyClaims);
  expect(errors).toEqual([]);
});

test('card themes do not imply verification on the demo or actual synthetic card', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if (location.origin !== 'http://localhost:3132') return;
    const id = '00000000-0000-4000-8000-000000000001';
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.synthetic`,
      refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800,
      user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
    }));
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost') return route.continue();
    if (url.origin !== 'http://127.0.0.1:9') return route.abort();
    if (url.pathname.endsWith('/pets')) return route.fulfill({ json: { id: 990001, name: 'Synthetic Trust Pet', species: 'cat', gender: 'female', farm_id: null, is_public: true, user_id: '00000000-0000-4000-8000-000000000001' } });
    if (url.pathname.endsWith('/get_pet_health')) return route.fulfill({ json: [{ blood_type: null }] });
    return route.fulfill({ json: [] });
  });
  for (const locale of ['th', 'en']) {
    await page.goto(`/${locale}/pet-id-card-preview`);
    await expect(page.locator('body')).not.toContainText(legacyClaims);
    await expect(page.locator('body')).not.toContainText(/\bVerified\b/);
    await page.goto(`/${locale}/pets/990001/id-card`);
    await expect(page.getByText('Synthetic Trust Pet', { exact: true })).toBeVisible();
    await expect(page.locator('.idc-theme-caption').filter({ hasText: /^Rose Gold$/ })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(legacyClaims);
    await expect(page.locator('.idc-theme-caption')).not.toContainText(['Verified']);
    await page.screenshot({ path: testInfo.outputPath(`card-${locale}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
