import { test, expect } from '@playwright/test';

test('integration: farm dashboard access module renders synthetic data in TH/EN after refresh', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const writes: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if (location.origin !== 'http://127.0.0.1:3217') return;
    const id = '00000000-0000-4000-8000-000000000001';
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.mock`,
      refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800,
      user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
    }));
  });
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const mock = (url.origin === 'http://127.0.0.1:3217' && url.pathname.startsWith('/mock-supabase/')) || url.origin === 'http://127.0.0.1:9';
    if (url.origin === 'http://127.0.0.1:3217' && !mock) return route.continue();
    if (!mock) return route.abort();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(url.pathname);
    const table = url.pathname.split('/').pop();
    let body: unknown = [];
    if (table === 'farms') body = { id: 9901, user_id: '00000000-0000-4000-8000-000000000001', farm_name: 'Synthetic Integration Farm', pet_type: 'cat', province: 'กรุงเทพมหานคร', is_verified: false };
    if (table === 'workspaces') body = url.searchParams.has('entity_id') ? { id: 'synthetic-workspace', workspace_members: [{ role: 'owner' }] } : [];
    return route.fulfill({ status: 200, json: body });
  });
  for (const locale of ['th', 'en']) {
    await page.goto(`/${locale}/farm-dashboard/9901`);
    await expect(page.getByText('Synthetic Integration Farm', { exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await page.reload();
    await expect(page.getByText('Synthetic Integration Farm', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`farm-${locale}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});
