import { test, expect, type Page } from '@playwright/test';

// Signed-in flows. Run ONLY against staging with synthetic test accounts:
//   E2E_BASE_URL=https://<staging> \
//   E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD   farm owner of E2E_FARM_ID
//   E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD   unrelated buyer account
//   E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD   staff (or viewer) member of the same farm
//   E2E_LISTED_PET_ID                      a farm pet with status เปิดจอง and no reservations
// Every test is skipped when its accounts are missing, so this never touches production by accident.
const env = process.env;
const FARM_ID = env.E2E_FARM_ID || '';
const has = (...keys: string[]) => keys.every(k => !!env[k]);

async function signIn(page: Page, email: string, password: string, redirect = '/profile') {
  await page.goto(`/th/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByText('เคยสมัครด้วยอีเมล? เข้าสู่ระบบที่นี่').click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(url => url.pathname.endsWith(redirect), { timeout: 20_000 });
}

test.describe('workspace roles', () => {
  test.skip(!has('E2E_STAFF_EMAIL', 'E2E_STAFF_PASSWORD', 'E2E_FARM_ID'), 'staff test account not configured');

  test('staff can open the farm overview but not owner-only pages', async ({ page }) => {
    await signIn(page, env.E2E_STAFF_EMAIL!, env.E2E_STAFF_PASSWORD!, `/farm-dashboard/${FARM_ID}`);
    await expect(page).toHaveURL(new RegExp(`/farm-dashboard/${FARM_ID}$`)); // not bounced to /partner
    await expect(page.locator('a[aria-label="แก้ไขโปรไฟล์"]')).toHaveCount(0);

    await page.goto(`/th/farm-dashboard/${FARM_ID}/edit`);
    await expect(page.getByText('หน้านี้สำหรับเจ้าของฟาร์มเท่านั้น')).toBeVisible();
    await page.goto(`/th/farm-dashboard/${FARM_ID}/reservations`);
    await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toHaveCount(0);
  });
});

test.describe('reservation → transfer', () => {
  test.skip(!has('E2E_OWNER_EMAIL', 'E2E_OWNER_PASSWORD', 'E2E_BUYER_EMAIL', 'E2E_BUYER_PASSWORD', 'E2E_FARM_ID', 'E2E_LISTED_PET_ID'),
    'owner/buyer test accounts not configured');
  test.describe.configure({ mode: 'serial' });
  const PET = env.E2E_LISTED_PET_ID!;

  test('buyer reserves a listed pet', async ({ page }) => {
    await signIn(page, env.E2E_BUYER_EMAIL!, env.E2E_BUYER_PASSWORD!, `/p/${PET}`);
    await page.getByRole('button', { name: /จองสัตว์ตัวนี้/ }).click();
    await expect(page.getByText('รอฟาร์มยืนยันการจอง')).toBeVisible();
  });

  test('farm confirms: reservation and pet status change together; double click is harmless', async ({ page }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/farm-dashboard/${FARM_ID}/reservations`);
    const confirm = page.getByRole('button', { name: 'ยืนยัน', exact: true }).first();
    await confirm.dblclick();
    await expect(page.getByText('ยืนยันแล้ว').first()).toBeVisible();
    await page.goto(`/th/p/${PET}`);
    await expect(page.getByText('ติดจอง').first()).toBeVisible();
  });

  test('farm sends a transfer request to the buyer', async ({ page }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/farm-dashboard/${FARM_ID}/reservations`);
    await page.getByRole('button', { name: 'ส่งคำขอโอนเจ้าของ' }).first().click();
    await expect(page.getByText('ส่งคำขอโอนแล้ว · รอผู้ซื้อยอมรับ').first()).toBeVisible();
  });

  test('buyer accepts and becomes the owner', async ({ page }) => {
    await signIn(page, env.E2E_BUYER_EMAIL!, env.E2E_BUYER_PASSWORD!, '/profile/transfers');
    await page.getByRole('button', { name: 'ยืนยันรับสิทธิ์' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/pets/${PET}`));
  });
});
