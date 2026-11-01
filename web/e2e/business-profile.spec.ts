import { test, expect, type Page } from '@playwright/test';

// Profile edit by role through update_business_profile (staging only). Needs supabase/tests/business_profile_fixture_staging.sql
// (shop 990201: owner 01, manager 02, staff 03) and:
//   E2E_OWNER_* / E2E_MANAGER_* / E2E_STAFF_*        QA accounts
//   E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY         staging, to read the shop as stored (public read)
// Run with --workers=1 (desktop and mobile edit the same shop).
const env = process.env;
const has = (...keys: string[]) => keys.every(k => !!env[k]);
const SHOP = '990201';

async function signIn(page: Page, email: string, password: string, redirect: string) {
  await page.goto(`/th/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByRole('button', { name: 'เคยสมัครด้วยอีเมล? เข้าสู่ระบบที่นี่' }).filter({ visible: true }).first().click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(url => url.pathname.endsWith(redirect), { timeout: 20_000 });
}
async function stored(page: Page) {
  const r = await page.request.get(`${env.E2E_SUPABASE_URL}/rest/v1/shops?select=shop_name,bio,phone,cover_url&id=eq.${SHOP}`, { headers: { apikey: env.E2E_SUPABASE_ANON_KEY! } });
  expect(r.status()).toBe(200);
  return (await r.json())[0] as { shop_name: string; bio: string; phone: string; cover_url: string | null };
}
const alertsOf = (page: Page) => { const a: string[] = []; page.on('dialog', d => { a.push(d.message()); d.accept(); }); return a; };

test.describe('business profile by role (shop 990201)', () => {
  test.skip(!has('E2E_OWNER_EMAIL', 'E2E_OWNER_PASSWORD', 'E2E_MANAGER_EMAIL', 'E2E_MANAGER_PASSWORD', 'E2E_STAFF_EMAIL', 'E2E_STAFF_PASSWORD',
    'E2E_SUPABASE_URL', 'E2E_SUPABASE_ANON_KEY'), 'staging accounts / Supabase env not configured');

  test('owner saves the profile; the page shows what the server stored', async ({ page }, info) => {
    const bio = `owner bio ${info.project.name} ${Date.now()}`;
    const alerts = alertsOf(page);
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/shop-dashboard/${SHOP}/edit`);
    await expect(page.getByPlaceholder('ชื่อร้านค้าของคุณ')).toBeEnabled();
    await page.locator('textarea').fill(bio);
    const rpc = page.waitForResponse('**/rest/v1/rpc/update_business_profile');
    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    expect((await rpc).status()).toBe(200);
    await expect.poll(() => alerts.length).toBe(1);
    expect(alerts[0]).toContain('เรียบร้อย');
    expect((await stored(page)).bio).toBe(bio);
  });

  test('server refusal → error shown, no success, nothing saved', async ({ page }) => {
    const before = await stored(page);
    const alerts = alertsOf(page);
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/shop-dashboard/${SHOP}/edit`);
    await page.getByPlaceholder('ชื่อร้านค้าของคุณ').fill('x'.repeat(130));        // over 120 characters
    await page.locator('textarea').fill('should not be saved');
    const rpc = page.waitForResponse('**/rest/v1/rpc/update_business_profile');
    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    expect((await rpc).status()).toBe(400);
    await expect.poll(() => alerts.length).toBe(1);
    expect(alerts[0]).not.toContain('เรียบร้อย');
    await expect(page).toHaveURL(new RegExp(`/shop-dashboard/${SHOP}/edit`));
    expect(await stored(page)).toEqual(before);
  });

  test('manager: identity fields locked; content saves', async ({ page }, info) => {
    const bio = `manager bio ${info.project.name} ${Date.now()}`;
    const alerts = alertsOf(page);
    await signIn(page, env.E2E_MANAGER_EMAIL!, env.E2E_MANAGER_PASSWORD!, `/shop-dashboard/${SHOP}/edit`);
    await expect(page.getByPlaceholder('ชื่อร้านค้าของคุณ')).toBeDisabled();
    await expect(page.getByPlaceholder('ชื่อจริง นามสกุล')).toBeDisabled();
    await expect(page.getByPlaceholder('08X-XXX-XXXX')).toBeEnabled();
    await page.locator('textarea').fill(bio);
    const req = page.waitForRequest('**/rest/v1/rpc/update_business_profile');
    const rpc = page.waitForResponse('**/rest/v1/rpc/update_business_profile');
    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    const sent = JSON.parse((await req).postData() || '{}').p_fields;
    expect(Object.keys(sent).sort()).toEqual(['bio', 'phone', 'supported_species']);   // only manager fields leave the browser
    expect((await rpc).status()).toBe(200);
    await expect.poll(() => alerts.length).toBe(1);
    expect(alerts[0]).toContain('เรียบร้อย');
    expect((await stored(page)).bio).toBe(bio);
  });

  test('staff cannot open the edit page', async ({ page }) => {
    await signIn(page, env.E2E_STAFF_EMAIL!, env.E2E_STAFF_PASSWORD!, `/shop-dashboard/${SHOP}`);
    await page.goto(`/th/shop-dashboard/${SHOP}/edit`);
    await page.waitForURL(url => /\/shop-dashboard\/990201$/.test(url.pathname), { timeout: 20_000 });
  });

  test('owner changes the cover on the dashboard; a tampered photo URL is refused and not shown', async ({ page }) => {
    const alerts = alertsOf(page);
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/shop-dashboard/${SHOP}`);
    const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 200;
      const g = c.getContext('2d')!; g.fillStyle = '#14b8a6'; g.fillRect(0, 0, 600, 200); return c.toDataURL('image/png').split(',')[1]; });
    const file = { name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') };

    // 1) real save
    await page.locator('input[type="file"]').first().setInputFiles(file);
    const rpc = page.waitForResponse('**/rest/v1/rpc/update_business_profile');
    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    expect((await rpc).status()).toBe(200);
    const saved = (await stored(page)).cover_url!;
    expect(saved).toMatch(new RegExp(`/storage/v1/object/public/shop-assets/${SHOP}/cover_\\d+\\.jpg\\?t=\\d+$`));
    await expect(page.locator('img.sd-cover-img')).toHaveAttribute('src', saved);
    expect(alerts).toEqual([]);

    // 2) the request is tampered to point at another site → server refuses, page keeps the stored photo
    await page.route('**/rest/v1/rpc/update_business_profile', async route => {
      const body = JSON.parse(route.request().postData() || '{}');
      body.p_fields.cover_url = String(body.p_fields.cover_url).replace(/^https:\/\/[^/]+/, 'https://evil.example');
      await route.continue({ postData: JSON.stringify(body) });
    });
    await page.locator('input[type="file"]').first().setInputFiles(file);
    const bad = page.waitForResponse('**/rest/v1/rpc/update_business_profile');
    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    expect((await bad).status()).toBe(400);
    await expect.poll(() => alerts.length).toBe(1);
    expect(alerts[0]).toContain('บันทึกรูปไม่สำเร็จ');
    expect((await stored(page)).cover_url).toBe(saved);
    await expect(page.locator('img.sd-cover-img')).toHaveAttribute('src', saved);
  });
});
