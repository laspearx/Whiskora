import { test, expect, type Page } from '@playwright/test';

// Anonymous-visitor checks. Defaults match the public records used in the
// 2026-10-29 audit (pet 134 "ลูเธอร์" of unverified farm 11 "Wintermerry");
// override on staging with synthetic data.
const PET_ID = process.env.E2E_PET_ID || '134';
const FARM_ID = process.env.E2E_FARM_ID || '11';
const FARM_NAME = process.env.E2E_FARM_NAME || 'Wintermerry';
const FARM_VERIFIED = process.env.E2E_FARM_VERIFIED === 'true';

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page should not scroll sideways').toBeLessThanOrEqual(1);
}

test.describe('public pet profile', () => {
  test('badges reflect real data and nothing hangs on Loading', async ({ page }) => {
    await page.goto(`/th/p/${PET_ID}`);
    await expect(page.getByText('ลงทะเบียน Pet ID แล้ว').first()).toBeVisible();
    await expect(page.getByText('Verified by Whiskora')).toHaveCount(0);

    const farmBadge = FARM_VERIFIED ? 'ฟาร์มยืนยันตัวตนแล้ว' : 'ฟาร์มยังไม่ยืนยันตัวตน';
    await expect(page.getByText(farmBadge).first()).toBeVisible();

    // pedigree resolves to a final state (tree, empty, locked or error) — never stuck loading
    await expect(page.getByText('กำลังโหลดแผนผังสายเลือด...')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByText('Loading...')).toHaveCount(0);

    // unknown health values are never presented as "none"
    const health = page.locator('.card', { hasText: 'ข้อมูลสุขภาพ' }).first();
    await expect(health).toBeVisible();
    await expect(health.getByText('ไม่มี', { exact: true })).toHaveCount(0);
    await noHorizontalScroll(page);
  });

  test('owner home address is not rendered for visitors', async ({ page }) => {
    await page.goto(`/th/p/${PET_ID}`);
    await expect(page.locator('.owner-info-row')).toHaveCount(0);
  });
});

test.describe('listing counts', () => {
  test('farm-hub card count equals the farm page list', async ({ page }) => {
    await page.goto('/th/farm-hub');
    const card = page.locator('a', { has: page.getByRole('heading', { name: FARM_NAME, exact: true }) }).first();
    await expect(card).toBeVisible();
    const cardText = await card.innerText();
    const m = cardText.match(/(\d+) ตัวพร้อมย้ายบ้าน\/เปิดจอง/);
    const cardCount = m ? Number(m[1]) : 0;
    // default audit data has listings; make sure we are not comparing 0 with 0 by accident
    if (!process.env.E2E_FARM_ID) expect(cardCount).toBeGreaterThan(0);

    await page.goto(`/th/farm/${FARM_ID}`);
    await expect(page.getByText('สัตว์เลี้ยงพร้อมย้ายบ้านและเปิดจอง').first()).toBeVisible();
    const listed = await page.locator('a.fp-pet-card').count();
    expect(listed).toBe(cardCount);
    await expect(page.getByText(FARM_VERIFIED ? 'ฟาร์มยืนยันตัวตนแล้ว' : 'ฟาร์มยังไม่ยืนยันตัวตน').first()).toBeVisible();
    await noHorizontalScroll(page);
  });
});

test.describe('navigation and locale', () => {
  for (const locale of ['th', 'en'] as const) {
    test(`footer terms/contact work in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const footer = page.locator('footer');
      await footer.getByRole('link', { name: locale === 'th' ? 'ข้อกำหนด' : 'Terms of Service' }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/terms$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale === 'th' ? 'ข้อกำหนดการใช้งาน' : 'Terms of Service');

      await page.locator('footer').getByRole('link', { name: locale === 'th' ? 'ติดต่อ' : 'Contact', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/contact$`));
      await expect(page.getByText('whiskora.pet@gmail.com')).toBeVisible();
    });
  }

  test('unprefixed links keep the chosen locale (en)', async ({ page }) => {
    await page.goto('/en/farm-hub');
    // farm cards use plain next/link (no locale prefix) — middleware must keep /en
    await page.locator('a[href^="/farm/"]').first().click();
    await expect(page).toHaveURL(/\/en\/farm\/\d+/);
  });

  test('Pet ID demo opens from the homepage without signing in', async ({ page }) => {
    await page.goto('/th');
    await page.getByRole('link', { name: 'ดูตัวอย่าง Pet ID' }).first().click();
    await expect(page).toHaveURL(/pet-id-card-preview/);
    await expect(page.getByText('ข้อมูลสาธิต — ไม่ใช่สัตว์จริง')).toBeVisible();
    await expect(page.getByText('PET IDENTIFICATION CARD').first()).toBeAttached();
    await noHorizontalScroll(page);
  });

  test('knowledge cards do not promise full articles', async ({ page }) => {
    await page.goto('/th/pet-knowledge');
    await expect(page.getByText(/อ่าน \d+ นาที/)).toHaveCount(0);
    await expect(page.getByText('คำตอบสรุป · บทความเต็มกำลังจัดทำ').first()).toBeVisible();
  });
});

test.describe('English system text', () => {
  test('public profile and sign-in are translated under /en', async ({ page }) => {
    await page.goto(`/en/p/${PET_ID}`);
    await expect(page.getByText('Pet ID registered').first()).toBeVisible();
    await expect(page.getByText(FARM_VERIFIED ? 'Farm identity verified' : 'Farm not verified').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByText('ลงทะเบียน Pet ID แล้ว')).toHaveCount(0);

    await page.goto('/en/login');
    await expect(page.getByText('Continue with Google').first()).toBeVisible();
    await expect(page.getByText('Continue with LINE').first()).toBeVisible();
    await page.goto('/en/register');
    await expect(page.getByRole('heading', { name: 'Create a new account' })).toBeVisible();
  });
});
