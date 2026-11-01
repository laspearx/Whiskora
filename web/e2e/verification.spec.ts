import { test, expect, type Page } from '@playwright/test';

// Admin review of farm verification through admin_review_farm_verification (staging only). Needs
// supabase/tests/verification_fixture_staging.sql first, and:
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD           the QA admin account
//   E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY       staging, to read the farm's public verification fields
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

async function farmState(page: Page, name: string) {
  const r = await page.request.get(`${env.E2E_SUPABASE_URL}/rest/v1/farms?select=is_verified,verification_status&farm_name=eq.${encodeURIComponent(name)}`,
    { headers: { apikey: env.E2E_SUPABASE_ANON_KEY! } });
  expect(r.status()).toBe(200);
  return (await r.json())[0] as { is_verified: boolean; verification_status: string | null };
}

test.describe('admin farm verification', () => {
  test.skip(!has('E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD', 'E2E_SUPABASE_URL', 'E2E_SUPABASE_ANON_KEY'), 'staging admin / Supabase env not configured');

  for (const action of ['approve', 'reject'] as const) {
    test(`admin ${action}s a pending request; the farm shows the result`, async ({ page }, info) => {
      const name = `QA-VG E2E ${action} ${info.project.name}`;
      expect(await farmState(page, name)).toEqual({ is_verified: false, verification_status: 'pending' });
      const alerts: string[] = [];
      page.on('dialog', d => { alerts.push(d.message()); d.accept(); });
      await signIn(page, env.E2E_ADMIN_EMAIL!, env.E2E_ADMIN_PASSWORD!, '/admin/verifications');
      const card = page.locator('.av-card', { hasText: name });
      await card.locator('.av-card-head').click();
      const rpc = page.waitForResponse('**/rest/v1/rpc/admin_review_farm_verification');
      if (action === 'reject') {
        await card.getByPlaceholder(/ระบุเหตุผลในการปฏิเสธ/).fill('QA-VG E2E: เอกสารไม่ชัดเจน');
        await card.getByRole('button', { name: 'ปฏิเสธ' }).click();
      } else {
        await card.getByRole('button', { name: 'อนุมัติ' }).click();
      }
      expect((await rpc).status()).toBe(200);
      await expect(page.locator('.av-card', { hasText: name })).toHaveCount(0);   // gone from the pending list
      expect(alerts).toEqual([]);
      expect(await farmState(page, name)).toEqual(action === 'approve'
        ? { is_verified: true, verification_status: 'verified' }
        : { is_verified: false, verification_status: 'rejected' });
    });
  }
});
