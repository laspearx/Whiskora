import { test, expect, type Page } from '@playwright/test';

const uid = '00000000-0000-4000-8000-000000000001';
const farm = { id: 9901, user_id: uid, farm_name: 'Synthetic Beta Farm', species: 'cat', is_verified: false, phone: '0000000000' };
const pet = { id: 990123, user_id: uid, farm_id: 9901, name: 'Synthetic Beta Luna', image_url: '/icons/icon-my-pets.png', species: 'cat', breed: 'Synthetic mix', gender: 'female', status: 'พร้อมย้ายบ้าน', is_public: true, price: 2500 };
async function fixture(page: Page, role = 'guest', legacy = false) {
  const errors: string[] = [], writes: string[] = [], external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  if (role !== 'guest') await page.addInitScript(() => {
    const id = '00000000-0000-4000-8000-000000000001';
    const enc = (v: object) => btoa(JSON.stringify(v)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: id, exp: 4102444800, role: 'authenticated' })}.mock`, refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800, user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
  });
  await page.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    const mock = url.origin === 'http://127.0.0.1:9' || url.pathname.startsWith('/mock-supabase/');
    if (url.origin === 'http://127.0.0.1:3217' && !mock) return route.continue();
    if (!mock) { external.push(url.origin); return route.abort(); }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && !url.pathname.includes('/rpc/')) writes.push(url.pathname);
    const table = url.pathname.split('/').pop(); let body: unknown = [];
    const single = url.searchParams.has('id');
    if (table === 'farms') body = single ? farm : role === 'guest' || role === 'owner' ? [farm] : [];
    if (table === 'pets') body = single ? pet : [pet];
    if (table === 'profiles') body = { id: uid, full_name: 'Synthetic Owner', role: role === 'admin' ? 'admin' : 'user' };
    if (table === 'shops') body = single ? { id: 9902, user_id: uid, shop_name: 'Synthetic Legacy Shop' } : legacy ? [{ id: 9902, shop_name: 'Synthetic Legacy Shop' }] : [];
    if (table === 'services') body = single ? { id: 9903, user_id: uid, service_name: 'Synthetic Legacy Service', category: 'grooming', is_published: true } : legacy ? [{ id: 9903, service_name: 'Synthetic Legacy Service' }] : [];
    if (table === 'workspace_members') body = ['personal', 'farm', ...(legacy ? ['shop', 'service'] : [])].map(type => ({ workspace_id: `synthetic-${type}`, role: role === 'guest' ? 'viewer' : role }));
    if (table === 'workspaces') body = url.searchParams.has('entity_id') ? { id: 'synthetic-farm', workspace_members: [{ role }] } : [
      { id: 'synthetic-personal', type: 'personal', name: 'Synthetic personal', entity_id: null },
      { id: 'synthetic-farm', type: 'farm', name: 'Synthetic Beta Farm', entity_id: 9901 },
      ...(legacy ? [{ id: 'synthetic-shop', type: 'shop', name: 'Synthetic Legacy Shop', entity_id: 9902 }, { id: 'synthetic-service', type: 'service', name: 'Synthetic Legacy Service', entity_id: 9903 }] : []),
    ];
    if (table === 'get_my_pet_access') body = { health: false, vaccination: false, weight: false, pedigree: false };
    return route.fulfill({ json: body });
  });
  return { errors, writes, external };
}
const hiddenPromotion = 'a[href*="/marketplace"],a[href*="/service-hub"],a[href*="/community"],a[href*="register-shop"],a[href*="register-service"]';
for (const locale of ['th', 'en']) {
  test(`${locale}: core navigation, homepage CTAs and public pet link`, async ({ page }, info) => {
    const observed = await fixture(page);
    await page.goto(`/${locale}`);
    const nav = page.locator('nav').first();
    if (info.project.name === 'mobile') await page.getByRole('button', { name: locale === 'en' ? 'Open menu' : 'เปิดเมนู' }).click();
    else await page.getByRole('button', { name: locale === 'en' ? 'Explore' : 'สำรวจ', exact: true }).click();
    await expect(page.locator('nav,footer').locator(hiddenPromotion)).toHaveCount(0);
    await expect(nav).toContainText(locale === 'en' ? 'Find pets & farms' : 'ค้นหาสัตว์และฟาร์ม');
    await expect(nav).toContainText(locale === 'en' ? 'For farms' : 'สำหรับฟาร์ม');
    await expect(page.locator('footer a[href$="/partner/register-farm"]')).toBeVisible();
    for (const path of ['/privacy', '/terms', '/contact']) await expect(page.locator(`footer a[href$="${path}"]`)).toBeVisible();
    // Close the menu before exercising actual homepage actions.
    if (info.project.name === 'mobile') {
      const closeMenu = page.getByRole('button', { name: locale === 'en' ? 'Close menu' : 'ปิดเมนู' });
      await expect(closeMenu).toHaveAttribute('aria-expanded', 'true');
      await closeMenu.click();
      await expect(page.getByRole('button', { name: locale === 'en' ? 'Open menu' : 'เปิดเมนู' })).toHaveAttribute('aria-expanded', 'false');
    } else await page.getByRole('button', { name: locale === 'en' ? 'Explore' : 'สำรวจ', exact: true }).click();
    const hero = page.locator('.hero-actions');
    await expect(hero.getByRole('button').first()).toHaveText(locale === 'en' ? 'Create a free Pet ID' : 'สร้าง Pet ID ฟรี');
    await expect(page.locator('.roadmap-box')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`home-${locale}.png`), fullPage: true });
    await hero.getByRole('button', { name: locale === 'en' ? 'For farms' : 'เริ่มใช้งานสำหรับฟาร์ม', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/partner$`));
    await expect(page.locator('h1')).toHaveText(locale === 'en' ? 'For farms' : 'สำหรับฟาร์ม');
    await expect(page.locator('.pp-page a[href*="register-farm"]')).toHaveCount(1);
    await expect(page.locator(hiddenPromotion)).toHaveCount(0);
    await page.goto(`/${locale}`);
    await hero.getByRole('button', { name: locale === 'en' ? 'Find pets & farms' : 'ค้นหาสัตว์และฟาร์ม', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/farm-hub$`));
    await page.locator('.mode-tab').nth(1).click();
    const link = page.locator('a[href="/p/990123"]');
    await expect(link).toBeVisible(); await expect(page.locator('a[href="/pets/990123"]')).toHaveCount(0);
    await link.click(); await expect(page).toHaveURL(new RegExp(`/${locale}/p/990123$`));
    await expect(page.locator('.pet-name')).toHaveText('Synthetic Beta Luna');
    await expect(page.locator('.contact-btn').first()).toBeVisible();
    await page.screenshot({ path: info.outputPath(`buyer-${locale}.png`), fullPage: true });
    expect(observed.errors).toEqual([]); expect(observed.writes).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`${locale}: hidden discovery and registration pages remain available by direct URL`, async ({ page }) => {
    const observed = await fixture(page);
    for (const path of ['/marketplace', '/service-hub', '/community', '/partner/register-shop', '/partner/register-service']) {
      await page.goto(`/${locale}${path}`);
      if (path.startsWith('/partner/register-')) {
        await expect(page).toHaveURL(/\/login\?redirect=/);
        expect(decodeURIComponent(page.url())).toContain(path);
      } else {
        await expect(page).toHaveURL(new RegExp(`/${locale}${path}$`));
        await expect(page.locator('h1')).toBeVisible();
      }
    }
    expect(observed.errors).toEqual([]); expect(observed.writes).toEqual([]);
  });
}
for (const role of ['owner', 'manager', 'staff', 'viewer']) {
  test(`${role}: existing farm and legacy business access is preserved`, async ({ page }, info) => {
    const observed = await fixture(page, role, true);
    await page.goto('/en/partner');
    await expect(page.locator('h1')).toHaveText('For farms');
    if (role === 'owner') {
      await expect(page.locator('a[href*="shop-dashboard/9902"]')).toBeVisible();
      await expect(page.locator('a[href*="service-dashboard/9903"]')).toBeVisible();
    }
    const switcher = page.getByRole('button', { name: 'Switch workspace', exact: true }).filter({ visible: true });
    await switcher.click();
    await expect(page.getByRole('button', { name: /Synthetic Beta Farm/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Synthetic Legacy Shop/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Synthetic Legacy Service/ })).toBeVisible();
    await page.getByRole('button', { name: /Synthetic Beta Farm/ }).click();
    await expect(page).toHaveURL(/\/en\/farm-dashboard\/9901$/);
    await expect(page.locator('a[href="/farm-dashboard/9901/pets/create"]')).toHaveCount(role === 'owner' ? 2 : 0);
    for (const [path, title] of [['/shop-dashboard/9902', 'Synthetic Legacy Shop'], ['/service-dashboard/9903', 'Synthetic Legacy Service']]) {
      await page.goto(`/en${path}`);
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      if (info.project.name === 'mobile') {
        const bottom = page.locator('nav[aria-label="Main menu"]');
        await expect(bottom).toHaveCount(1);
        await expect(bottom).toContainText('Find pets & farms');
        await expect(bottom).not.toContainText('บริการ');
      }
    }
    await page.screenshot({ path: info.outputPath(`legacy-${role}.png`), fullPage: true });
    expect(observed.errors).toEqual([]); expect(observed.writes).toEqual([]);
  });
}
test('primary navigation fits intermediate widths with signed-in workspaces', async ({ page }) => {
  const observed = await fixture(page, 'owner', true);
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/terms');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'Switch workspace', exact: true }).filter({ visible: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px`).toBe(true);
  }
  expect(observed.errors).toEqual([]);
});
