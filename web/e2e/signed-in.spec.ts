import { test, expect, type Page } from '@playwright/test';

// Signed-in flows. Run ONLY against staging with synthetic test accounts:
//   E2E_BASE_URL=https://<staging> \
//   E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD   farm owner of E2E_FARM_ID
//   E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD   unrelated buyer account
//   E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD   staff (or viewer) member of the same farm
//   E2E_LISTED_PET_ID                      a farm pet with status เปิดจอง and no reservations
//   E2E_LISTED_PET_ID_MOBILE               a second such pet for the mobile project (the chain transfers the pet)
// Every test is skipped when its accounts are missing, so this never touches production by accident.
const env = process.env;
const FARM_ID = env.E2E_FARM_ID || '';
const has = (...keys: string[]) => keys.every(k => !!env[k]);

async function signIn(page: Page, email: string, password: string, redirect = '/profile') {
  await page.goto(`/th/login?redirect=${encodeURIComponent(redirect)}`);
  // the login page can briefly render this toggle twice (one hidden) — click the visible one
  await page.getByRole('button', { name: 'เคยสมัครด้วยอีเมล? เข้าสู่ระบบที่นี่' }).filter({ visible: true }).first().click();
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
  // the chain transfers the pet away, so each viewport project needs its own listed pet
  let PET = env.E2E_LISTED_PET_ID!;
  test.beforeAll(({}, info) => {
    if (info.project.name === 'mobile') PET = env.E2E_LISTED_PET_ID_MOBILE || PET;
  });

  test('buyer reserves a listed pet', async ({ page }) => {
    await signIn(page, env.E2E_BUYER_EMAIL!, env.E2E_BUYER_PASSWORD!, `/p/${PET}`);
    await page.getByRole('button', { name: /จองสัตว์ตัวนี้/ }).click();
    await expect(page.getByText('รอฟาร์มยืนยันการจอง')).toBeVisible();
  });

  test('staff and viewer see the reservation but get no confirm/cancel/transfer buttons', async ({ page }) => {
    test.skip(!has('E2E_STAFF_EMAIL', 'E2E_STAFF_PASSWORD', 'E2E_VIEWER_EMAIL', 'E2E_VIEWER_PASSWORD'), 'staff/viewer not configured');
    for (const who of ['STAFF', 'VIEWER'] as const) {
      await page.context().clearCookies({ name: /^sb-/ });
      await signIn(page, env[`E2E_${who}_EMAIL`]!, env[`E2E_${who}_PASSWORD`]!, `/farm-dashboard/${FARM_ID}/reservations`);
      await expect(page.getByText('รอยืนยัน').first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'ยืนยัน', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'ส่งคำขอโอนเจ้าของ' })).toHaveCount(0);
      await page.evaluate(() => localStorage.clear());
    }
  });

  test('farm confirms: reservation and pet status change together; double click is harmless', async ({ page }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/farm-dashboard/${FARM_ID}/reservations`);
    const confirm = page.getByRole('button', { name: 'ยืนยัน', exact: true });
    await confirm.first().dblclick();
    // wait for the pending row to leave the list before navigating (other rows may already say "ยืนยันแล้ว")
    await expect(confirm).toHaveCount(0);
    await expect(page.getByText('ยืนยันแล้ว').first()).toBeVisible();
    await page.goto(`/th/p/${PET}`);
    await expect(page.getByText('ติดจอง').first()).toBeVisible();
  });

  test('farm sends a transfer request to the buyer', async ({ page }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/farm-dashboard/${FARM_ID}/reservations`);
    await page.getByRole('button', { name: 'ส่งคำขอโอนเจ้าของ' }).first().click();
    await expect(page.getByText('ส่งคำขอโอนแล้ว · รอผู้ซื้อยอมรับ').first()).toBeVisible();
  });

  test('buyer declines: owner and reservation unchanged, farm can send again', async ({ page }) => {
    await signIn(page, env.E2E_BUYER_EMAIL!, env.E2E_BUYER_PASSWORD!, '/profile/transfers');
    await page.getByRole('button', { name: 'ปฏิเสธ' }).first().dblclick();
    await expect(page.getByRole('button', { name: 'ปฏิเสธ' })).toHaveCount(0);
    await page.context().clearCookies({ name: /^sb-/ });
    await page.evaluate(() => localStorage.clear());
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/farm-dashboard/${FARM_ID}/reservations`);
    await expect(page.getByRole('button', { name: 'ส่งคำขอโอนเจ้าของ' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'ส่งคำขอโอนเจ้าของ' }).first().dblclick();
    await expect(page.getByText('ส่งคำขอโอนแล้ว · รอผู้ซื้อยอมรับ').first()).toBeVisible();
  });

  test('buyer accepts and becomes the owner', async ({ page }) => {
    await signIn(page, env.E2E_BUYER_EMAIL!, env.E2E_BUYER_PASSWORD!, '/profile/transfers');
    await page.getByRole('button', { name: 'ยืนยันรับสิทธิ์' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/pets/${PET}`));
    await page.goto('/th/profile/pets');
    await expect(page.locator(`a[href^="/pets/${PET}"]`).first()).toBeVisible();
  });

  test('after transfer: public page not reserved and not reservable; pet left the farm page', async ({ browser }) => {
    const visitor = await browser.newContext();
    const v = await visitor.newPage();
    await v.goto(`/th/p/${PET}`);
    await expect(v.getByText(/WSK-/).first()).toBeVisible();   // pet data loaded before checking what is absent
    await expect(v.locator('.status-pill')).toHaveCount(0);      // status cleared (NULL), not ติดจอง / เปิดจอง
    await expect(v.locator('body')).not.toContainText('ติดจอง');
    await expect(v.getByRole('button', { name: /จองสัตว์ตัวนี้/ })).toHaveCount(0);
    await v.goto(`/th/farm/${FARM_ID}`);
    await expect(v.locator('.fp-pet-card').first()).toBeVisible(); // farm list loaded (farm still has other pets)
    await expect(v.locator(`a[href$="/p/${PET}"]`)).toHaveCount(0);
    await visitor.close();
  });
});

// ── Privacy (migration 20261029100000_private_columns) ───────────────────────
// Extra staging env: E2E_MANAGER_*, E2E_VIEWER_*, E2E_STRANGER_*, E2E_NEW_* (EMAIL/PASSWORD),
// E2E_FARM_PET_ID (public farm pet with health data), E2E_PRIVATE_PET_ID (owner's non-public pet
// with allergies = E2E_PRIVATE_PET_ALLERGIES). Private markers below must never appear for visitors.
const PRIVATE_MARKERS = [/QA-ALLERGY/, /QA-CHRONIC/, /QA-NOTES/, /QA address/, /@example\.com/, /0800000\d{3}/];

test.describe('privacy: own profile', () => {
  test.skip(!has('E2E_NEW_EMAIL', 'E2E_NEW_PASSWORD'), 'new-user test account not configured');

  test('a fresh account can edit its own profile and the change persists', async ({ page }) => {
    await signIn(page, env.E2E_NEW_EMAIL!, env.E2E_NEW_PASSWORD!, '/profile/edit');
    const phone = page.locator('input[type="tel"]');
    const value = `08${Date.now().toString().slice(-8)}`;
    await phone.fill(value);
    await page.getByRole('button', { name: 'บันทึก', exact: false }).last().click();
    await page.waitForURL(url => url.pathname.endsWith('/profile'), { timeout: 20_000 });
    await page.goto('/th/profile/edit');
    await expect(phone).toHaveValue(value);   // read back through get_my_profile()
  });
});

test.describe('privacy: profile photo', () => {
  test.skip(!has('E2E_NEW_EMAIL', 'E2E_NEW_PASSWORD'), 'new-user test account not configured');

  test('changing the profile photo is saved (not just shown)', async ({ page }) => {
    await signIn(page, env.E2E_NEW_EMAIL!, env.E2E_NEW_PASSWORD!, '/profile');
    // 8x8 PNG generated in the browser, so the test needs no fixture file
    const png = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = c.height = 8;
      const g = c.getContext('2d')!; g.fillStyle = '#e91e63'; g.fillRect(0, 0, 8, 8);
      return c.toDataURL('image/png').split(',')[1];
    });
    await page.locator('input[type="file"]').nth(1).setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    const saved = page.waitForResponse(r => r.url().includes('/rest/v1/profiles') && r.request().method() === 'PATCH');
    await page.locator('.crop-confirm-btn').click();
    expect((await saved).status()).toBeLessThan(300);
    await page.reload();
    await expect(page.locator('img[src*="/avatars/"]').first()).toBeVisible();
  });
});

test.describe('privacy: pet health', () => {
  test.skip(!has('E2E_OWNER_EMAIL', 'E2E_OWNER_PASSWORD', 'E2E_PRIVATE_PET_ID', 'E2E_PRIVATE_PET_ALLERGIES'), 'owner pet not configured');
  const PET = env.E2E_PRIVATE_PET_ID!;
  const allergies = (page: Page) => page.locator('input[placeholder="เช่น อาหารทะเล, ยา..."]');
  const save = (page: Page) => page.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' });

  test('owner edit form is prefilled with health and saving keeps it', async ({ page }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/pets/${PET}/edit`);
    await expect(allergies(page)).toHaveValue(env.E2E_PRIVATE_PET_ALLERGIES!);
    await expect(allergies(page)).toBeEnabled();
    await save(page).click();
    await page.waitForURL(url => !url.pathname.endsWith('/edit'), { timeout: 20_000 });
    await page.goto(`/th/pets/${PET}/edit`);
    await expect(allergies(page)).toHaveValue(env.E2E_PRIVATE_PET_ALLERGIES!);
  });

  test('if health fails to load, saving does not blank it', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_pet_health*', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"simulated"}' }));
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/pets/${PET}/edit`);
    await expect(page.getByText('โหลดข้อมูลสุขภาพเดิมไม่ได้')).toBeVisible();
    await expect(allergies(page)).toBeDisabled();
    await save(page).click();
    await page.waitForURL(url => !url.pathname.endsWith('/edit'), { timeout: 20_000 });
    await page.unroute('**/rest/v1/rpc/get_pet_health*');
    await page.goto(`/th/pets/${PET}/edit`);
    await expect(allergies(page)).toHaveValue(env.E2E_PRIVATE_PET_ALLERGIES!);
  });

  test('owner can add a pet with health fields (insert returns id only)', async ({ page }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, '/pets/create');
    await page.locator('input[placeholder="เช่น น้องถุงทอง"]').fill(`QA e2e pet ${Date.now()}`);
    await page.locator('input[placeholder="เช่น แพ้อาหารทะเล, แพ้ยาบางชนิด"]').fill('QA-ALLERGY-E2E');
    await page.getByRole('button', { name: /เพิ่มสัตว์เลี้ยง/ }).click();
    await page.waitForURL(/\/pets\/\d+$/, { timeout: 20_000 });
    await page.goto(page.url() + '/edit');
    await expect(allergies(page)).toHaveValue('QA-ALLERGY-E2E');
  });
});

test.describe('privacy: public pet page and QR', () => {
  test.skip(!has('E2E_OWNER_EMAIL', 'E2E_OWNER_PASSWORD', 'E2E_STRANGER_EMAIL', 'E2E_STRANGER_PASSWORD', 'E2E_FARM_PET_ID'), 'public pet not configured');
  const PET = env.E2E_FARM_PET_ID!;

  test('visitor and unrelated user see the pet but no private data', async ({ page }) => {
    await page.goto(`/th/p/${PET}`);
    await expect(page.getByText('ลงทะเบียน Pet ID แล้ว').first()).toBeVisible();
    await expect(page.getByText('Loading')).toHaveCount(0);
    const anon = await page.locator('body').innerText();
    for (const m of PRIVATE_MARKERS) expect(anon).not.toMatch(m);

    await signIn(page, env.E2E_STRANGER_EMAIL!, env.E2E_STRANGER_PASSWORD!, `/p/${PET}`);
    await expect(page.getByText('ลงทะเบียน Pet ID แล้ว').first()).toBeVisible();
    const stranger = await page.locator('body').innerText();
    for (const m of PRIVATE_MARKERS) expect(stranger).not.toMatch(m);
  });

  test('ID card QR opens the public page without login', async ({ page, browser }) => {
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/pets/${PET}/id-card`);
    const src = await page.locator('img[alt="QR Code"]').getAttribute('src');
    const target = new URL(new URL(src!).searchParams.get('data')!);
    expect(target.pathname).toBe(`/p/${PET}`);
    const visitor = await browser.newContext();
    const v = await visitor.newPage();
    await v.goto(target.pathname);                    // same origin as baseURL
    await expect(v).not.toHaveURL(/login/);
    const text = await v.locator('body').innerText();
    for (const m of PRIVATE_MARKERS) expect(text).not.toMatch(m);
    await visitor.close();
  });
});

test.describe('privacy: roles', () => {
  test.skip(!has('E2E_MANAGER_EMAIL', 'E2E_MANAGER_PASSWORD', 'E2E_VIEWER_EMAIL', 'E2E_VIEWER_PASSWORD', 'E2E_FARM_ID'), 'manager/viewer not configured');

  for (const role of ['MANAGER', 'VIEWER'] as const) {
    test(`${role.toLowerCase()} opens the farm overview; farm edit stays owner-only`, async ({ page }) => {
      await signIn(page, env[`E2E_${role}_EMAIL`]!, env[`E2E_${role}_PASSWORD`]!, `/farm-dashboard/${FARM_ID}`);
      await expect(page).toHaveURL(new RegExp(`/farm-dashboard/${FARM_ID}$`));
      await page.goto(`/th/farm-dashboard/${FARM_ID}/edit`);
      await expect(page.getByText('หน้านี้สำหรับเจ้าของฟาร์มเท่านั้น')).toBeVisible();
    });
  }

  test('owner invite search matches names, not email fragments, and shows no emails', async ({ page }) => {
    test.skip(!has('E2E_OWNER_EMAIL', 'E2E_OWNER_PASSWORD'), 'owner not configured');
    await signIn(page, env.E2E_OWNER_EMAIL!, env.E2E_OWNER_PASSWORD!, `/farm-dashboard/${FARM_ID}/members`);
    const box = page.locator('input[placeholder="ค้นหาด้วยชื่อ, username หรืออีเมลแบบเต็ม"]');
    await box.fill('whiskora-qa');
    await box.press('Enter');
    await page.locator('.fm-search-btn').click();
    await expect(page.locator('.fm-result')).toHaveCount(0);
    await box.fill('QA Bu');
    await page.locator('.fm-search-btn').click();
    await expect(page.locator('.fm-result').first()).toContainText('QA Buyer');
    expect(await page.locator('body').innerText()).not.toMatch(/@example\.com/);
  });
});

test.describe('admin', () => {
  test.skip(!has('E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD'), 'admin test account not configured');

  test('admin user list loads through admin_get_users (no PGRST203 overload error)', async ({ page }) => {
    const rpc = page.waitForResponse(r => r.url().includes('/rpc/admin_get_users'));
    await signIn(page, env.E2E_ADMIN_EMAIL!, env.E2E_ADMIN_PASSWORD!, '/admin/users');
    expect((await rpc).status()).toBe(200);
    await expect(page.getByText(env.E2E_BUYER_EMAIL || '@').first()).toBeVisible();
  });
});
