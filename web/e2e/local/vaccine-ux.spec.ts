import { test, expect, type Page } from '@playwright/test';

const OWNER = '00000000-0000-4000-8000-000000000001';
const READER = '00000000-0000-4000-8000-000000000002';
const PET = '990001';
const access = { overview: true, health: true, vaccination: true, pedigree: true, weight: true, medical_notes: true, documents: true, timeline: true };
const sampleRecords = [
  { id: '1', vaccine_name: 'วัคซีนรวม', date_given: '2026-10-01', next_due: null },
  { id: '2', vaccine_name: 'ถ่ายพยาธิ', date_given: '2026-10-01', next_due: '2026-11-01' },
  { id: '3', vaccine_name: 'หยดหลังป้องกันเห็บหมัด', date_given: '2026-10-01', next_due: '2026-11-02' },
  { id: '4', vaccine_name: 'รายการเดิม', date_given: '2026-10-01', next_due: '2026-10-31' },
];

type MockOptions = {
  owner?: boolean; vaccination?: boolean; empty?: boolean; delayedAccess?: boolean; readError?: boolean;
  deniedGroups?: readonly (keyof typeof access)[];
};
type Observations = { pageErrors: string[]; unexpected: string[]; writes: string[]; runtimeEvents: string[]; apiPaths: string[]; releaseAccess: () => void };
const observations = new WeakMap<Page, Observations>();

test.afterEach(async ({ page }, testInfo) => {
  const observed = observations.get(page);
  if (!observed) return;
  observed.releaseAccess();
  await testInfo.attach('mock-observations', {
    body: JSON.stringify(observed, null, 2), contentType: 'application/json',
  });
  expect(observed.runtimeEvents).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
  expect(observed.unexpected).toEqual([]);
  expect(observed.writes).toEqual([]);
});

async function mockPet(page: Page, { owner = true, vaccination = true, empty = false, delayedAccess = false, readError = false, deniedGroups = [] }: MockOptions = {}) {
  const pageErrors: string[] = [];
  const unexpected: string[] = [];
  const writes: string[] = [];
  const runtimeEvents: string[] = [];
  const apiPaths: string[] = [];
  const observed: Observations = { pageErrors, unexpected, writes, runtimeEvents, apiPaths, releaseAccess: () => {} };
  observations.set(page, observed);
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('crash', () => runtimeEvents.push('page-crash'));
  await page.addInitScript(({ userId }) => {
    // Freeze calendar time only; keep timers, animation and auth locks native.
    const NativeDate = Date;
    const fixedNow = NativeDate.parse('2026-11-01T10:00:00Z');
    window.Date = new Proxy(NativeDate, {
      construct(target, args) { return Reflect.construct(target, args.length ? args : [fixedNow]); },
      apply() { return new NativeDate(fixedNow).toString(); },
      get(target, key, receiver) { return key === 'now' ? () => fixedNow : Reflect.get(target, key, receiver); },
    });
    // Synthetic session only: no real account, credentials, or production token.
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const payload = encode({ sub: userId, exp: 4102444800, role: 'authenticated' });
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `${header}.${payload}.mock-signature`, refresh_token: 'mock-refresh', token_type: 'bearer',
      expires_at: 4102444800, expires_in: 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
    }));
  }, { userId: owner ? OWNER : READER });
  let releaseAccess = () => {};
  const gate = new Promise<void>(resolve => { releaseAccess = resolve; });
  observed.releaseAccess = releaseAccess;
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const isMock = url.origin === 'http://127.0.0.1:3217' && url.pathname.startsWith('/mock-supabase/');
    if (url.origin === 'http://127.0.0.1:3217' && !isMock) return route.continue();
    // Everything external is intercepted; no request reaches a real API or asset host.
    if (!isMock) return route.fulfill({ status: 200, body: '', contentType: 'text/plain' });
    const path = url.pathname.slice('/mock-supabase'.length);
    apiPaths.push(`${request.method()} ${path}`);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !path.startsWith('/rest/v1/rpc/')) writes.push(path);
    let body: unknown = [];
    if (path === '/rest/v1/pets') {
      body = { id: PET, user_id: OWNER, name: 'Mock Pet', species: 'cat', gender: 'ตัวเมีย', is_neutered: null, is_public: true, gallery_urls: '[]', farm_id: null };
    } else if (path === '/rest/v1/rpc/get_my_pet_access') {
      if (delayedAccess) await gate;
      body = { ...access, vaccination, ...Object.fromEntries(deniedGroups.map(group => [group, false])) };
    } else if (path === '/rest/v1/rpc/get_pet_health') {
      body = [{ blood_type: null, allergies: null }];
    } else if (path === '/rest/v1/vaccines') {
      if (readError) return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Mock read refusal', code: '42501' }) });
      body = empty ? [] : sampleRecords;
    } else if (path === '/rest/v1/pet_ownership_transfers') {
      body = null;
    } else if (!['/rest/v1/rpc/get_pet_pedigree', '/rest/v1/pet_activities', '/rest/v1/pet_documents', '/rest/v1/pet_co_owners', '/rest/v1/pet_weights', '/rest/v1/workspace_members', '/rest/v1/workspaces'].includes(path)) {
      unexpected.push(path);
      return route.fulfill({ status: 501, contentType: 'application/json', body: JSON.stringify({ message: 'Unconfigured mock endpoint' }) });
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(`/th/pets/${PET}`);
  await expect(page.locator('.pet-name')).toContainText('Mock Pet');
  return observed;
}

const categoryNav = (page: Page) => page.getByRole('navigation', { name: 'หมวดข้อมูลสัตว์เลี้ยง' });
const summary = (page: Page) => page.getByLabel('สรุปข้อมูลสุขภาพที่บันทึก');

test('owner switches categories and sees identical neutral summaries; direct create link opens the form', async ({ page }, testInfo) => {
  const observed = await mockPet(page);
  const nav = categoryNav(page);
  await expect(nav).toBeVisible();
  await expect(summary(page)).toContainText('ถึงวันนัดวันนี้');
  await expect(summary(page)).toContainText('เลยวันนัดที่บันทึกไว้');
  await expect(summary(page)).toContainText('มีวันนัดในอนาคต');
  await expect(summary(page)).toContainText('ไม่ได้ระบุวันนัดครั้งถัดไป');
  for (const [label, count] of [
    ['ประวัติวัคซีน / การดูแลที่บันทึก', 4],
    ['มีประวัติ แต่ไม่ได้ระบุวันนัดครั้งถัดไป', 1],
    ['เลยวันนัดที่บันทึกไว้', 1], ['ถึงวันนัดวันนี้', 1], ['มีวันนัดในอนาคต', 1],
  ] as const) {
    const row = summary(page).locator('.health-tick-row').filter({ has: page.getByText(label, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(`${count} รายการ`);
  }
  await expect(summary(page).locator('.health-tick.ok')).toHaveCount(0);
  await expect(summary(page)).not.toContainText('FVRCP');
  await expect(summary(page)).not.toContainText('ครบถ้วนสม่ำเสมอ');
  const overviewSummary = await summary(page).innerText();
  await summary(page).screenshot({ path: testInfo.outputPath('summary.png') });
  await nav.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: testInfo.outputPath('categories.png') });
  const add = page.getByRole('link', { name: /เพิ่มวัคซีน/ });
  await expect(add).toHaveAttribute('href', `/pets/${PET}/vaccines/create`);
  await nav.getByRole('button', { name: 'สุขภาพ', exact: true }).click();
  await expect(nav.getByRole('button', { name: 'สุขภาพ', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(summary(page)).toHaveText(overviewSummary, { useInnerText: true });
  await nav.getByRole('button', { name: 'วัคซีน', exact: true }).click();
  await expect(add).toHaveAttribute('href', `/pets/${PET}/vaccines/create`);
  await nav.getByRole('button', { name: 'ภาพรวม', exact: true }).click();
  await add.click();
  await expect(page).toHaveURL(`/th/pets/${PET}/vaccines/create`);
  await expect(page.getByRole('heading', { name: 'เพิ่มประวัติวัคซีน' })).toBeVisible();
  expect(observed.pageErrors).toEqual([]);
  expect(observed.unexpected).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('owner without records can add from overview; no positive health claim', async ({ page }) => {
  await mockPet(page, { empty: true });
  await expect(summary(page)).toContainText('ยังไม่มีประวัติที่บันทึก');
  await expect(summary(page).locator('.health-tick.ok')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('read-only viewer can switch readable categories but gets no vaccine write action', async ({ page }) => {
  const observed = await mockPet(page, { owner: false });
  await expect(summary(page)).toBeVisible();
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  await categoryNav(page).getByRole('button', { name: 'วัคซีน', exact: true }).click();
  await expect(page.getByText('วัคซีนรวม', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  expect(observed.writes).toEqual([]);
});

test('denied vaccination group has no tab, records, summary, or write action', async ({ page }) => {
  await mockPet(page, { owner: false, vaccination: false });
  const nav = categoryNav(page);
  await expect(nav.getByRole('button', { name: 'สุขภาพ', exact: true })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'วัคซีน', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  await expect(page.getByText('วัคซีนรวม', { exact: true })).toHaveCount(0);
  await expect(summary(page)).not.toContainText('การดูแลที่บันทึก');
  await nav.getByRole('button', { name: 'สุขภาพ', exact: true }).click();
  await expect(summary(page)).not.toContainText('การดูแลที่บันทึก');
});

test('pending access does not expose category contents or vaccine actions', async ({ page }) => {
  const observed = await mockPet(page, { delayedAccess: true });
  await expect(categoryNav(page).getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  observed.releaseAccess();
  await expect(categoryNav(page).getByRole('button', { name: 'วัคซีน', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toBeVisible();
});

test('failed history read is not reported as no recorded history', async ({ page }) => {
  await mockPet(page, { readError: true });
  await expect(summary(page)).toContainText('โหลดประวัติไม่สำเร็จ');
  await expect(summary(page)).not.toContainText('ยังไม่มีประวัติ');
  await categoryNav(page).getByRole('button', { name: 'สุขภาพ', exact: true }).click();
  await expect(summary(page)).toContainText('โหลดประวัติไม่สำเร็จ');
});

test('navigation exposes only the categories allowed by fieldAccess', async ({ page }) => {
  await mockPet(page, { owner: false, deniedGroups: ['pedigree', 'health', 'vaccination', 'weight', 'medical_notes', 'documents', 'timeline'] });
  const nav = categoryNav(page);
  await expect(nav.getByRole('button', { name: 'ภาพรวม', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(nav.getByRole('button')).toHaveCount(1);
  for (const label of ['แผนผังสายเลือด', 'สุขภาพ', 'วัคซีน', 'น้ำหนัก', 'โน้ต & พฤติกรรม', 'เอกสาร', 'ไทม์ไลน์']) {
    await expect(nav.getByRole('button', { name: label, exact: true })).toHaveCount(0);
  }
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
});
