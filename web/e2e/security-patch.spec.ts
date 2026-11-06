import { test, expect, type Page } from '@playwright/test';

// Only synthetic records. Every browser request outside this local server is blocked.
const origin = 'http://127.0.0.1:3291';
const uid = '00000000-0000-4000-8000-000000000001';
const pet = { id: 990001, name: 'Security Mock Pet', species: 'cat', breed: 'Mock',
  gender: 'female', user_id: uid, farm_id: 990001, image_url: null,
  created_at: '2026-01-01T00:00:00Z', birth_date: '2025-01-01', status: 'เลี้ยงเอง',
  is_public: true, privacy_settings: {}, is_pet_id_registered: true };
const farm = { id: 990001, farm_name: 'Security Mock Farm', user_id: uid, is_verified: false };

type AccessFixture = {
  kind?: 'farm' | 'service' | 'shop';
  role?: 'owner' | 'manager' | 'staff' | 'viewer' | 'legacy-owner' | 'denied';
};

async function mock(page: Page, signedIn = false, { kind = 'farm', role = 'owner' }: AccessFixture = {}) {
  const external: string[] = [];
  const errors: string[] = [];
  const queries: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  if (signedIn) await page.addInitScript(({ uid }) => {
    const enc = (v: object) => btoa(JSON.stringify(v)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: uid, exp: 4102444800, role: 'authenticated' })}.mock`,
      refresh_token: 'mock-refresh', token_type: 'bearer', expires_at: 4102444800,
      user: { id: uid, email: 'security@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
    }));
  }, { uid });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.origin === 'https://fonts.googleapis.com') {
      return route.fulfill({ status: 200, contentType: 'text/css', body: '/* local font fixture */' });
    }
    if (url.origin !== 'http://127.0.0.1:9') {
      external.push(url.origin); return route.abort();
    }
    const path = url.pathname;
    queries.push(`${path}${url.search}`);
    let data: unknown = [];
    if (path === '/auth/v1/user') data = { id: uid, email: 'security@example.invalid' };
    else if (path.endsWith('/get_my_pet_access')) data = { overview: true, health: true, vaccination: true, pedigree: true, timeline: true };
    else if (path.endsWith('/get_pet_health')) data = [];
    else if (path.endsWith('/get_pet_pedigree')) data = [];
    else if (path === '/rest/v1/pets') data = [pet];
    else if (path === '/rest/v1/farms') data = [farm];
    else if (path === '/rest/v1/profiles') data = [{ id: uid, full_name: 'Mock Owner' }];
    else if (path === '/rest/v1/workspaces') data = ['denied', 'legacy-owner'].includes(role) ? []
      : [{ id: 'mock-workspace', type: kind, entity_id: 990001, name: `Security Mock ${kind}`, workspace_members: [{ role }] }];
    else if (path === '/rest/v1/services' || path === '/rest/v1/shops') {
      data = url.searchParams.get('select') === 'id'
        ? role === 'legacy-owner' ? [{ id: 990001 }] : []
        : [{ id: 990001, user_id: uid, service_name: 'Security Mock service', shop_name: 'Security Mock shop',
          category: 'grooming', supported_species: [], image_url: null, cover_url: null }];
    }
    const accept = route.request().headers().accept || '';
    if (accept.includes('vnd.pgrst.object')) data = Array.isArray(data) ? data[0] ?? null : data;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data),
      headers: { 'access-control-allow-origin': '*', 'content-range': '0-0/0' } });
  });
  return { external, errors, queries };
}

for (const locale of ['th', 'en']) {
  test(`${locale}: routing, RootChrome, login and public profile`, async ({ page }) => {
    const seen = await mock(page);
    await page.goto(`/${locale}/login`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByText(locale === 'en' ? 'Continue with Google' : 'ดำเนินการต่อด้วย Google').first()).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(1);
    await page.goto(`/${locale}/p/990001`);
    await expect(page.getByText(pet.name).first()).toBeVisible();
    await expect(page.locator('.owner-info-row')).toHaveCount(0);
    expect(seen.external).toEqual([]);
    expect(seen.errors).toEqual([]);
  });
}

test('middleware remembers EN and redirects unprefixed routes', async ({ page }) => {
  await mock(page);
  await page.goto('/en/login');
  await page.goto('/login');
  await expect(page).toHaveURL('/en/login');
  const cookies = await page.context().cookies();
  expect(cookies.find(c => c.name === 'NEXT_LOCALE')?.value).toBe('en');
});

test('Pet ID demonstration renders a QR code', async ({ page }) => {
  const seen = await mock(page);
  await page.goto('/pet-id-card-preview');
  await expect(page.getByText('PET IDENTIFICATION CARD').first()).toBeAttached();
  await expect(page.locator('img[src^="data:image/png"]').first()).toBeAttached();
  expect(seen.errors).toEqual([]);
});

test('anonymous farm dashboard redirects to local login', async ({ page }) => {
  const seen = await mock(page);
  await page.goto('/th/farm-dashboard/990001');
  await expect(page).toHaveURL(/\/th\/login/);
  expect(seen.errors).toEqual([]);
});

test('synthetic session opens farm dashboard without duplicate chrome', async ({ page }) => {
  const seen = await mock(page, true);
  await page.goto('/th/farm-dashboard/990001');
  await expect(page.getByText(farm.farm_name).first()).toBeVisible();
  await expect(page).toHaveURL(/farm-dashboard\/990001/);
  expect(seen.errors).toEqual([]);
  expect(seen.external).toEqual([]);
});

test('local image optimizer processes a safe PNG', async ({ request }) => {
  const response = await request.get('/_next/image?url=%2Flogo.png&w=256&q=75');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\//);
  expect((await response.body()).length).toBeGreaterThan(100);
});

for (const kind of ['service', 'shop'] as const) {
  for (const role of ['owner', 'manager', 'staff', 'viewer', 'legacy-owner'] as const) {
    test(`${kind}: ${role} keeps dashboard access and editing controls`, async ({ page }) => {
      const seen = await mock(page, true, { kind, role });
      await page.goto(`/th/${kind}-dashboard/990001`);
      await expect(page.getByRole('heading', { name: `Security Mock ${kind}`, exact: true })).toBeVisible();
      await expect(page).toHaveURL(`/th/${kind}-dashboard/990001`);
      const canEdit = ['owner', 'manager', 'legacy-owner'].includes(role);
      await expect(page.getByRole('button', { name: 'เปลี่ยนรูปปก', exact: true })).toHaveCount(canEdit ? 1 : 0);
      expect(seen.external).toEqual([]);
      expect(seen.errors).toEqual([]);
    });
  }

  test(`${kind}: signed-in nonmember is redirected without loading dashboard data`, async ({ page }) => {
    const seen = await mock(page, true, { kind, role: 'denied' });
    await page.goto(`/th/${kind}-dashboard/990001`);
    await expect(page).toHaveURL('/th/partner');
    await expect(page.getByRole('heading', { name: `Security Mock ${kind}`, exact: true })).toHaveCount(0);
    const table = kind === 'service' ? 'services' : 'shops';
      // The partner destination may list the user's own businesses. Only reads of
      // the denied target ID belong to the dashboard access check.
      const businessQueries = seen.queries.filter(q => q.startsWith(`/rest/v1/${table}?`)
        && new URL(q, origin).searchParams.get('id') === 'eq.990001');
    expect(businessQueries.length).toBeGreaterThan(0);
    expect(businessQueries.every(q => new URL(q, origin).searchParams.get('select') === 'id')).toBe(true);
    expect(seen.external).toEqual([]);
    expect(seen.errors).toEqual([]);
  });

  test(`${kind}: anonymous session redirects to login without membership reads`, async ({ page }) => {
    const seen = await mock(page, false, { kind });
    await page.goto(`/th/${kind}-dashboard/990001`);
    await expect(page).toHaveURL(/\/th\/login/);
    expect(seen.queries.some(q => q.startsWith('/rest/v1/workspaces?'))).toBe(false);
    expect(seen.errors).toEqual([]);
  });
}
