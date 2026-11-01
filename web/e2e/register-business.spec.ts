import { test, expect, type Page } from '@playwright/test';

// Register a shop through create_business (staging only, synthetic account). Needs:
//   E2E_NEW_EMAIL / E2E_NEW_PASSWORD   a QA account (businesses it creates are named "QA-CB E2E …")
//   E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY   staging, to count the created shops (public read)
// Clean-up: supabase/tests/create_business_checks.cjs removes every "QA-CB…" business (or delete them by name).
const env = process.env;
const has = (...keys: string[]) => keys.every(k => !!env[k]);

async function signIn(page: Page, email: string, password: string, redirect: string) {
  await page.goto(`/th/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByRole('button', { name: 'เคยสมัครด้วยอีเมล? เข้าสู่ระบบที่นี่' }).filter({ visible: true }).first().click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(url => url.pathname.endsWith(redirect), { timeout: 20_000 });
}

async function shopCount(page: Page, name: string) {
  const r = await page.request.get(`${env.E2E_SUPABASE_URL}/rest/v1/shops?select=id&shop_name=eq.${encodeURIComponent(name)}`,
    { headers: { apikey: env.E2E_SUPABASE_ANON_KEY! } });
  expect(r.status()).toBe(200);
  return (await r.json()).length as number;
}

async function fillShop(page: Page, name: string) {
  await page.getByPlaceholder('ชื่อร้านค้าของคุณ').fill(name);
  await page.getByPlaceholder('ชื่อจริง นามสกุล').fill('QA Synthetic');
  await page.getByPlaceholder('08X-XXX-XXXX').fill('0800000000');
  const province = page.locator('select').first();
  await expect(province.locator('option', { hasText: 'กรุงเทพมหานคร' })).toHaveCount(1);
  await province.selectOption({ label: 'กรุงเทพมหานคร' });
  await page.getByRole('button', { name: /แตะเพื่อเปิดแผนที่/ }).click();
  await page.getByRole('button', { name: /ใช้ตำแหน่งปัจจุบัน/ }).click();
  await expect(page.getByRole('button', { name: /ปักหมุดแล้ว/ })).toBeVisible();
  await page.locator('.ps-species-btn', { hasText: 'แมว' }).click();
}

test.describe('register shop (create_business)', () => {
  test.skip(!has('E2E_NEW_EMAIL', 'E2E_NEW_PASSWORD', 'E2E_SUPABASE_URL', 'E2E_SUPABASE_ANON_KEY'), 'staging QA account / Supabase env not configured');
  test.use({ geolocation: { latitude: 13.7563, longitude: 100.5018 }, permissions: ['geolocation'] });

  test('response lost after the save → retry with the same form gives the same single shop', async ({ page }, info) => {
    const name = `QA-CB E2E lost ${info.project.name} ${Date.now()}`;
    await signIn(page, env.E2E_NEW_EMAIL!, env.E2E_NEW_PASSWORD!, '/partner/register-shop');
    await fillShop(page, name);

    const keys: string[] = [];
    await page.route('**/rest/v1/rpc/create_business', async route => {
      keys.push(JSON.parse(route.request().postData() || '{}').p_request_key);
      const resp = await route.fetch();                      // the database commits …
      if (keys.length === 1) return route.abort('failed');  // … but the browser never sees the answer
      return route.fulfill({ response: resp });
    });
    const alerts: string[] = [];
    page.on('dialog', d => { alerts.push(d.message()); d.accept(); });

    await page.getByRole('button', { name: 'ยืนยันการเปิดร้าน' }).click();
    await expect.poll(() => alerts.length).toBe(1);           // error shown, still on the form
    expect(await shopCount(page, name)).toBe(1);              // first call was saved
    await page.getByRole('button', { name: 'ยืนยันการเปิดร้าน' }).click();
    await page.waitForURL(url => url.pathname.endsWith('/profile'), { timeout: 20_000 });
    expect(alerts[1]).toContain('สำเร็จ');
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);                            // same request key → replay, not a second shop
    expect(await shopCount(page, name)).toBe(1);
  });

  test('server refuses the form → error shown, nothing saved', async ({ page }, info) => {
    const name = `QA-CB E2E refused ${info.project.name} ${Date.now()} ${'x'.repeat(120)}`;   // over 120 characters
    await signIn(page, env.E2E_NEW_EMAIL!, env.E2E_NEW_PASSWORD!, '/partner/register-shop');
    await fillShop(page, name);
    const alerts: string[] = [];
    page.on('dialog', d => { alerts.push(d.message()); d.accept(); });
    const resp = page.waitForResponse('**/rest/v1/rpc/create_business');
    await page.getByRole('button', { name: 'ยืนยันการเปิดร้าน' }).click();
    expect((await resp).status()).toBe(400);
    await expect.poll(() => alerts.length).toBe(1);
    expect(alerts[0]).toContain('too long');
    await expect(page).toHaveURL(/register-shop/);
    expect(await shopCount(page, name)).toBe(0);
  });
});
