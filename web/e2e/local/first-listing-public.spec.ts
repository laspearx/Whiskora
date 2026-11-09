import { test, expect } from '@playwright/test';
for (const locale of ['th', 'en']) {
  test(`${locale}: anonymous public pet retains allowed seller fields, price semantics and contact channels`, async ({ page }, info) => {
    let status = 'เปิดจอง'; let price: number | null = 2500; let phone: string | null = '0000000000';
    const errors: string[] = []; const writes: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const req = route.request(); const url = new URL(req.url());
      const mock = url.pathname.startsWith('/mock-supabase/') || url.origin === 'http://127.0.0.1:9';
      if (url.origin === 'http://127.0.0.1:3217' && url.pathname === '/synthetic-first-listing.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#fce7ef"/><text x="200" y="200" text-anchor="middle" fill="#9d174d">Synthetic pet photo</text></svg>' });
      if (url.origin === 'http://127.0.0.1:3217' && !mock) return route.continue();
      if (!mock) return route.abort();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && !url.pathname.includes('/rpc/')) writes.push(url.pathname);
      const table = url.pathname.split('/').pop(); let body: unknown = [];
      if (table === 'pets') body = { id: 990123, name: 'Synthetic Public Luna', image_url: '/synthetic-first-listing.svg', gender: 'female', breed: 'Synthetic mix', species: 'cat', user_id: 'synthetic-owner', farm_id: 9901, status, price, is_public: true };
      if (table === 'farms') { expect(url.searchParams.get('select')).toBe('id,farm_name,phone,facebook_link,line_id,is_verified'); body = { id: 9901, farm_name: 'Synthetic Public Farm', phone, facebook_link: null, line_id: null, is_verified: false }; }
      if (table === 'profiles') { expect(url.searchParams.get('select')).toBe('id,full_name,avatar_url'); body = { id: 'synthetic-owner', full_name: 'Synthetic Owner', avatar_url: null }; }
      if (table === 'get_my_pet_access') body = { health: false, vaccination: false, weight: false, pedigree: false };
      return route.fulfill({ json: body });
    });
    await page.goto(`/${locale}/p/990123`);
    await expect(page.locator('.pet-name')).toHaveText('Synthetic Public Luna');
    await expect(page.locator('.pet-name')).toBeVisible();
    await expect.poll(() => page.locator('img[src="/synthetic-first-listing.svg"]').first().evaluate(img => (img as HTMLImageElement).naturalWidth)).toBe(400);
    await expect(page.locator('.price-pill')).toContainText('2,500');
    await expect(page.getByText(locale === 'en' ? /Status is provided by the farm/ : /สถานะเป็นข้อมูลจากฟาร์ม/)).toBeVisible();
    const contact = page.locator('.contact-btn').first(); await expect(contact).toBeVisible();
    expect((await contact.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await contact.click(); await expect(page.locator('.contact-phone')).toContainText('0000000000');
    await expect(page.locator('.contact-line, .contact-fb')).toHaveCount(0);
    await page.locator('.contact-close').click();
    expect(page.url()).toContain(`/${locale}/p/990123`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`public-${locale}.png`), fullPage: true });
    status = 'พร้อมย้ายบ้าน'; price = null; phone = null;
    await page.reload(); await expect(page.getByText(locale === 'en' ? /No price specified; this does not mean free/ : /ยังไม่ระบุราคา ไม่ได้หมายถึงให้ฟรี/)).toBeVisible();
    await expect(page.locator('.price-pill')).toHaveCount(0); await expect(page.locator('.contact-btn')).toHaveCount(0);
    expect(writes).toEqual([]); expect(errors).toEqual([]);
  });
}
