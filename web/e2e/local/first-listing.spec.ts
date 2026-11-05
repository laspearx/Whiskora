import { test, expect } from '@playwright/test';

const uid = '00000000-0000-4000-8000-000000000001';
for (const locale of ['th', 'en']) {
  test(`${locale}: first listing, validation, optional fields, failure and confirmed ID`, async ({ page }, info) => {
    let fail = true;
    let returnId = true;
    const inserts: Record<string, unknown>[] = [];
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const id = '00000000-0000-4000-8000-000000000001';
      const encode = (v: object) => btoa(JSON.stringify(v)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.mock`, refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800, user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
    });
    await page.route('**/*', async route => {
      const req = route.request(); const url = new URL(req.url());
      const mock = url.pathname.startsWith('/mock-supabase/') || url.origin === 'http://127.0.0.1:9';
      if (url.origin === 'http://127.0.0.1:3217' && !mock) return route.continue();
      if (!mock) return route.abort();
      const table = url.pathname.split('/').pop();
      let body: unknown = [];
      if (table === 'farms') body = { id: 9901, user_id: uid, farm_name: 'Synthetic First Farm', species: 'cat', is_verified: false };
      if (table === 'workspaces') body = url.searchParams.has('entity_id') ? { id: 'synthetic', workspace_members: [{ role: 'owner' }] } : [];
      if (req.method() === 'POST' && table === 'pets') {
        inserts.push(req.postDataJSON()[0]);
        if (fail) return route.fulfill({ status: 400, json: { message: 'Synthetic save failure', code: '23514' } });
        body = returnId ? [{ id: 990123 }] : [];
      } else if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) throw new Error(`Unexpected write ${req.method()} ${url.pathname}`);
      return route.fulfill({ status: 200, json: body });
    });
    await page.goto(`/${locale}/farm-dashboard/9901`);
    const entry = page.locator('section').getByRole('link', { name: locale === 'en' ? 'Add a pet' : 'เพิ่มสัตว์เลี้ยง', exact: true }).first();
    await expect(entry).toBeVisible();
    await expect(page.locator('.fbn-nav a[href="/farm-dashboard/9901/pets/create"]')).toBeVisible();
    await expect(page.getByRole('link', { name: locale === 'en' ? 'Add multiple pets' : 'เพิ่มหลายตัว', exact: true })).toHaveAttribute('href', '/farm-dashboard/9901/pets/bulk-create');
    await page.screenshot({ path: info.outputPath(`dashboard-${locale}.png`), fullPage: true });
    await entry.click();
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Add a pet' : 'เพิ่มสัตว์เลี้ยง' })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`form-initial-${locale}.png`), fullPage: true });
    const save = page.getByRole('button', { name: locale === 'en' ? 'Save' : 'บันทึก', exact: true });
    const dialogs: string[] = [];
    page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
    await save.click(); expect(dialogs).toHaveLength(1); expect(inserts).toHaveLength(0);
    await page.getByLabel(locale === 'en' ? 'Name' : 'ชื่อ', { exact: true }).fill('Synthetic Luna');
    await save.click(); expect(dialogs).toHaveLength(2);
    await page.getByLabel(locale === 'en' ? 'Breed' : 'สายพันธุ์', { exact: true }).selectOption('อื่นๆ');
    await save.click(); expect(dialogs).toHaveLength(3);
    await page.getByLabel(locale === 'en' ? 'Enter breed' : 'พิมพ์สายพันธุ์').fill('Synthetic mix');
    const sex = page.getByLabel(locale === 'en' ? 'Sex' : 'เพศ', { exact: true });
    await expect(sex).toHaveValue(''); await save.click(); expect(dialogs).toHaveLength(4); expect(inserts).toHaveLength(0);
    await sex.selectOption('female');
    await page.getByLabel(locale === 'en' ? 'Date of birth' : 'วันเกิด').fill('2099-01-01');
    await save.click(); expect(dialogs).toHaveLength(5); expect(inserts).toHaveLength(0);
    await page.getByLabel(locale === 'en' ? 'Date of birth' : 'วันเกิด').fill('');
    const sections = page.locator('details'); await expect(sections).toHaveCount(3);
    for (const section of await sections.all()) { await expect(section).not.toHaveAttribute('open', ''); await section.locator('summary').click(); await expect(section).toHaveAttribute('open', ''); }
    await page.getByLabel(locale === 'en' ? 'Notes' : 'หมายเหตุ', { exact: true }).fill('Synthetic optional note');
    await sections.last().locator('summary').click();
    await expect(page.getByText(locale === 'en' ? /Before saving: this is not a private draft/ : /ก่อนบันทึก: ข้อมูลนี้ไม่ใช่ร่างส่วนตัว/)).toBeVisible();
    await page.screenshot({ path: info.outputPath(`form-${locale}.png`), fullPage: true });
    await save.click(); await expect(page.locator('.fpc-page').getByRole('alert')).toContainText('Synthetic save failure');
    await expect(page.getByLabel(locale === 'en' ? 'Name' : 'ชื่อ', { exact: true })).toHaveValue('Synthetic Luna');
    fail = false; await save.click();
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Pet saved' : 'บันทึกข้อมูลสัตว์แล้ว' })).toBeVisible();
    await expect(page.getByText(/Public Share: Pending Review/)).toBeVisible();
    const detail = page.getByRole('link', { name: locale === 'en' ? 'View the pet you added' : 'ดูรายละเอียดสัตว์ที่เพิ่งเพิ่ม' });
    await expect(detail).toHaveAttribute('href', '/pets/990123');
    await expect(page.locator('main a[href*="/p/"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: locale === 'en' ? 'Manage farm pets' : 'กลับไปจัดการสัตว์ของฟาร์ม' })).toHaveAttribute('href', '/farm-dashboard/9901/pets');
    expect(inserts).toHaveLength(2);
    expect(inserts[1]).toMatchObject({ user_id: uid, farm_id: 9901, species: 'cat', gender: 'female', is_public: true, note: 'Synthetic optional note', sire_id: null, dam_id: null, status: null });
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`saved-${locale}.png`), fullPage: true });
    await page.getByRole('button', { name: locale === 'en' ? 'Add another pet' : 'เพิ่มสัตว์ตัวถัดไป' }).click();
    await expect(sex).toHaveValue('');
    await expect(page.getByLabel(locale === 'en' ? 'Name' : 'ชื่อ', { exact: true })).toHaveValue('');
    // A successful response without a returned ID must never produce a guessed pet URL.
    returnId = false;
    await page.getByLabel(locale === 'en' ? 'Name' : 'ชื่อ', { exact: true }).fill('Synthetic second pet');
    await page.getByLabel(locale === 'en' ? 'Breed' : 'สายพันธุ์', { exact: true }).selectOption({ index: 1 });
    await sex.selectOption('male'); await save.click();
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Pet saved' : 'บันทึกข้อมูลสัตว์แล้ว' })).toBeVisible();
    await expect(page.getByRole('link', { name: locale === 'en' ? 'View the pet you added' : 'ดูรายละเอียดสัตว์ที่เพิ่งเพิ่ม' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: locale === 'en' ? 'Manage farm pets' : 'กลับไปจัดการสัตว์ของฟาร์ม' })).toBeVisible();
    expect(inserts).toHaveLength(3);
    expect(errors).toEqual([]);
  });
}

for (const role of ['manager', 'staff', 'viewer']) {
  test(`existing ${role} cannot enter owner creation`, async ({ page }) => {
    await page.addInitScript(() => {
      const id = '00000000-0000-4000-8000-000000000001';
      const encode = (v: object) => btoa(JSON.stringify(v)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.mock`, refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800, user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
    });
    await page.route('**/*', async route => {
      const req = route.request(); const url = new URL(req.url());
      const mock = url.pathname.startsWith('/mock-supabase/') || url.origin === 'http://127.0.0.1:9';
      if (url.origin === 'http://127.0.0.1:3217' && !mock) return route.continue();
      if (!mock) return route.abort();
      const table = url.pathname.split('/').pop();
      let body: unknown = [];
      if (table === 'farms') body = { id: 9901, user_id: uid, farm_name: 'Synthetic First Farm', species: 'cat', is_verified: false };
      if (table === 'workspaces') body = url.searchParams.has('entity_id') ? { id: 'synthetic', workspace_members: [{ role }] } : [];
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) throw new Error('Unexpected write');
      return route.fulfill({ status: 200, json: body });
    });
    await page.goto('/th/farm-dashboard/9901');
    await expect(page.getByText('Synthetic First Farm', { exact: true })).toBeVisible();
    await expect(page.locator('a[href="/farm-dashboard/9901/pets/create"]')).toHaveCount(0);
    await page.goto('/th/farm-dashboard/9901/pets/create');
    await expect(page.getByText('หน้านี้สำหรับเจ้าของฟาร์มเท่านั้น')).toBeVisible();
    await expect(page.locator('.fpc-page')).toHaveCount(0);
  });
}
