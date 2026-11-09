import { test, expect, type Page } from '@playwright/test';

// F4 UI (TH / EN): sign-in notices and the LINE connection screen. Synthetic data only; every request outside the
// local server is answered here or blocked.
const uid = '00000000-0000-4000-8000-0000000000f4';
const LINE = 'U' + 'f'.repeat(32);

type UserState = { app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown>; email: string; identities: { provider: string }[] };

async function mock(page: Page, opts: { signedIn?: boolean; user?: UserState; confirm?: { status: number; body: object }; unlink?: { status: number; body: object } } = {}) {
  const errors: string[] = []; const external: string[] = []; const calls: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const user = opts.user ?? { app_metadata: {}, user_metadata: {}, email: 'f4@example.invalid', identities: [{ provider: 'email' }] };
  const view = () => ({ id: uid, aud: 'authenticated', role: 'authenticated', ...user });
  if (opts.signedIn) await page.addInitScript(({ uid, u }) => {
    const enc = (v: object) => btoa(JSON.stringify(v)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: uid, exp: 4102444800, role: 'authenticated' })}.mock`,
      refresh_token: 'mock-refresh', token_type: 'bearer', expires_at: 4102444800, user: { id: uid, ...u },
    }));
  }, { uid, u: user });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.origin === 'http://127.0.0.1:3291') {
      if (url.pathname === '/api/auth/line/confirm') {
        calls.push(`${method} confirm`);
        const r = opts.confirm ?? { status: 200, body: { ok: true } };
        if (r.status === 200 && method === 'POST') { user.app_metadata = { ...user.app_metadata, line_id: LINE, line_link_pending: null }; user.user_metadata = { ...user.user_metadata, line_display_name: 'Synthetic LINE' }; }
        if (method === 'DELETE') user.app_metadata = { ...user.app_metadata, line_link_pending: null };
        return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
      }
      if (url.pathname === '/api/auth/line' && method !== 'GET') {
        calls.push(`${method} line`);
        const r = method === 'DELETE' ? (opts.unlink ?? { status: 200, body: { ok: true } }) : { status: 200, body: { ok: true } };
        return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
      }
      return route.continue();
    }
    if (url.origin === 'https://fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (url.origin !== 'http://127.0.0.1:9') { external.push(url.origin); return route.abort(); }
    let data: unknown = [];
    if (url.pathname === '/auth/v1/user') data = view();
    else if (url.pathname === '/auth/v1/token') data = { access_token: 'x.y.z', refresh_token: 'mock-refresh', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user: view() };
    else if (url.pathname.startsWith('/rest/v1/')) data = [];
    const accept = route.request().headers().accept || '';
    if (accept.includes('vnd.pgrst.object')) data = Array.isArray(data) ? data[0] ?? null : data;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data), headers: { 'access-control-allow-origin': '*' } });
  });
  return { errors, external, calls };
}

for (const locale of ['th', 'en'] as const) {
  const T = locale === 'th'
    ? { review: 'ต้องยืนยันบัญชีเดิมก่อน', ref: 'รหัสอ้างอิง', relink: 'สร้างบัญชีใหม่ด้วย LINE', generic: 'เข้าสู่ระบบไม่สำเร็จ', conflict: 'มากกว่าหนึ่งบัญชี',
        confirm: 'ยืนยันการเชื่อมต่อ', linked: 'เชื่อมต่อ LINE สำเร็จแล้ว', banner: 'เพื่อความปลอดภัย', lineOnly: 'ช่องทางเข้าสู่ระบบเพียงช่องทางเดียว', expired: 'หมดอายุ' }
    : { review: 'Your existing account needs verification', ref: 'Reference', relink: 'Create a new account with LINE', generic: 'Sign-in failed', conflict: 'more than one',
        confirm: 'Confirm', linked: 'LINE connected.', banner: 'For your security', lineOnly: 'only sign-in method', expired: 'expired' };

  test(`${locale}: legacy LINE account shows the review notice with its reference, no auto sign-in`, async ({ page }) => {
    const seen = await mock(page);
    await page.goto(`/${locale}/login?auth_error=LINE_ACCOUNT_REVIEW&ref=abcd1234`);
    await expect(page.getByTestId('line-review')).toContainText(T.review);
    await expect(page.getByTestId('line-review')).toContainText(`${T.ref}: abcd1234`);
    expect(seen.errors).toEqual([]); expect(seen.external).toEqual([]);
  });

  test(`${locale}: relink prompt offers an explicit new-account button`, async ({ page }) => {
    await mock(page);
    await page.goto(`/${locale}/login?auth_error=LINE_RELINK_SUGGESTED`);
    await expect(page.getByTestId('line-relink').getByRole('button', { name: T.relink })).toBeVisible();
  });

  test(`${locale}: unknown / injected error text is never shown raw`, async ({ page }) => {
    await mock(page);
    await page.goto(`/${locale}/login?auth_error=${encodeURIComponent('<b>x</b> session_create_failed: {"msg":"secret"}')}&ref=<script>`);
    await expect(page.getByTestId('auth-error')).toContainText(T.generic);
    await expect(page.locator('body')).not.toContainText('secret');
    await expect(page.locator('body')).not.toContainText('<script>');
  });

  test(`${locale}: conflict code maps to the fixed conflict message`, async ({ page }) => {
    await mock(page);
    await page.goto(`/${locale}/login?auth_error=LINE_ACCOUNT_CONFLICT`);
    await expect(page.getByTestId('auth-error')).toContainText(T.conflict);
  });

  test(`${locale}: pending LINE link asks for confirmation, confirm links`, async ({ page }) => {
    const seen = await mock(page, { signedIn: true, user: { email: 'f4@example.invalid', identities: [{ provider: 'email' }, { provider: 'google' }], user_metadata: {},
      app_metadata: { line_link_pending: { display_name: 'Synthetic LINE', line_id: LINE, exp: 4102444800000, nonce_hash: 'x' } } } });
    await page.goto(`/${locale}/profile/connections?confirm_line=1`);
    const box = page.getByTestId('line-confirm');
    await expect(box).toContainText('Synthetic LINE');
    await box.getByRole('button', { name: T.confirm, exact: true }).click();
    await expect(page.getByText(T.linked)).toBeVisible();
    expect(seen.calls).toContain('POST confirm');
    expect(seen.errors).toEqual([]);
  });

  test(`${locale}: expired pending link shows the fixed expired message`, async ({ page }) => {
    await mock(page, { signedIn: true, confirm: { status: 409, body: { error: 'LINK_PENDING_EXPIRED' } },
      user: { email: 'f4@example.invalid', identities: [{ provider: 'email' }], user_metadata: {}, app_metadata: { line_link_pending: { display_name: 'Synthetic LINE', line_id: LINE, exp: 1, nonce_hash: 'x' } } } });
    await page.goto(`/${locale}/profile/connections?confirm_line=1`);
    await page.getByTestId('line-confirm').getByRole('button', { name: T.confirm, exact: true }).click();
    await expect(page.locator('.cn-alert-err')).toContainText(T.expired);
  });

  test(`${locale}: legacy user_metadata claim is not shown as linked; banner asks to re-link`, async ({ page }) => {
    await mock(page, { signedIn: true, user: { email: 'f4@example.invalid', identities: [{ provider: 'email' }], user_metadata: { line_id: LINE }, app_metadata: {} } });
    await page.goto(`/${locale}/profile/connections`);
    await expect(page.getByTestId('line-legacy-banner')).toContainText(T.banner);
  });

  test(`${locale}: LINE-only account cannot unlink (server refusal shown)`, async ({ page }) => {
    const seen = await mock(page, { signedIn: true, unlink: { status: 409, body: { error: 'line_only_login' } },
      user: { email: `line_${LINE.toLowerCase()}@line.whiskora.internal`, identities: [{ provider: 'email' }], user_metadata: {}, app_metadata: { line_id: LINE } } });
    await page.goto(`/${locale}/profile/connections`);
    await page.locator('.cn-btn-unlink').last().click();
    await expect(page.locator('.cn-alert-err')).toContainText(T.lineOnly);
    expect(seen.calls).toContain('DELETE line');
  });
}
