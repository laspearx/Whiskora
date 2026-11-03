import { test, expect, type Page, type CDPSession } from '@playwright/test';

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
  accessError?: boolean; reloadFailure?: boolean; routeRace?: boolean;
  anonymous?: boolean; petDenied?: boolean; networkFailure?: boolean; accountDenied?: boolean;
  refreshOwnership?: boolean;
  pedigreeError?: boolean;
  deniedGroups?: readonly (keyof typeof access)[];
};
type Observations = { pageErrors: string[]; unexpected: string[]; writes: string[]; runtimeEvents: string[]; apiPaths: string[]; releaseAccess: () => void; slowStarted: Promise<void>; slowFinished: Promise<void>; releaseSlow: () => void };
const observations = new WeakMap<Page, Observations>();
const crashSessions = new WeakMap<Page, CDPSession>();

test.afterEach(async ({ page }, testInfo) => {
  const observed = observations.get(page);
  if (!observed) return;
  observed.releaseAccess();
  observed.releaseSlow();
  await crashSessions.get(page)?.detach().catch(() => {});
  await testInfo.attach('mock-observations', {
    body: JSON.stringify(observed, null, 2), contentType: 'application/json',
  });
  expect(observed.runtimeEvents).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
  expect(observed.unexpected).toEqual([]);
  expect(observed.writes).toEqual([]);
});

async function mockPet(page: Page, { owner = true, vaccination = true, empty = false, delayedAccess = false, readError = false, accessError = false, reloadFailure = false, routeRace = false, anonymous = false, petDenied = false, networkFailure = false, accountDenied = false, refreshOwnership = false, pedigreeError = false, deniedGroups = [] }: MockOptions = {}) {
  const pageErrors: string[] = [];
  const unexpected: string[] = [];
  const writes: string[] = [];
  const runtimeEvents: string[] = [];
  const apiPaths: string[] = [];
  let releaseSlow = () => {};
  let markSlowStarted = () => {};
  let markSlowFinished = () => {};
  const slowGate = new Promise<void>(resolve => { releaseSlow = resolve; });
  const slowStarted = new Promise<void>(resolve => { markSlowStarted = resolve; });
  const slowFinished = new Promise<void>(resolve => { markSlowFinished = resolve; });
  let slowRequests = 0;
  let slowResponses = 0;
  let reloaded = false;
  const observed: Observations = { pageErrors, unexpected, writes, runtimeEvents, apiPaths, releaseAccess: () => {}, releaseSlow, slowStarted, slowFinished };
  observations.set(page, observed);
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('crash', () => runtimeEvents.push('page-crash'));
  const crashSession = await page.context().browser()!.newBrowserCDPSession();
  crashSessions.set(page, crashSession);
  crashSession.on('Target.targetCrashed', ({ status, errorCode }) => {
    runtimeEvents.push(`target-crash:${status}:${errorCode}`);
  });
  await crashSession.send('Target.setDiscoverTargets', { discover: true });
  await page.addInitScript(({ userId, anonymous }) => {
    // Seed once per tab/origin; a history navigation must not sign a logged-out user back in.
    // Playwright may also initialize an opaque about:blank document during Back navigation.
    if (location.origin !== 'http://127.0.0.1:3217') return;
    // Freeze calendar time only; keep timers, animation and auth locks native.
    const NativeDate = Date;
    const fixedNow = NativeDate.parse('2026-11-01T10:00:00Z');
    window.Date = new Proxy(NativeDate, {
      construct(target, args) { return Reflect.construct(target, args.length ? args : [fixedNow]); },
      apply() { return new NativeDate(fixedNow).toString(); },
      get(target, key, receiver) { return key === 'now' ? () => fixedNow : Reflect.get(target, key, receiver); },
    });
    // Synthetic session only: no real account, credentials, or production token.
    if (sessionStorage.getItem('vaccine-mock-initialized')) return;
    sessionStorage.setItem('vaccine-mock-initialized', '1');
    if (anonymous) { localStorage.removeItem('sb-127-auth-token'); return; }
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const payload = encode({ sub: userId, exp: 4102444800, role: 'authenticated' });
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `${header}.${payload}.mock-signature`, refresh_token: 'mock-refresh', token_type: 'bearer',
      expires_at: 4102444800, expires_in: 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
    }));
  }, { userId: owner ? OWNER : READER, anonymous });
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
    if ((reloadFailure || refreshOwnership) && path === '/rest/v1/pets' && request.method() === 'PATCH') {
      reloaded = true;
      return route.fulfill({ status: 204, body: '' });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !path.startsWith('/rest/v1/rpc/')) writes.push(path);
    const requestedPet = path.startsWith('/rest/v1/rpc/') ? String(request.postDataJSON()?.p_pet_id ?? PET) : (url.searchParams.get(path === '/rest/v1/pets' ? 'id' : 'pet_id')?.replace('eq.', '') ?? PET);
    const isSlow = routeRace && requestedPet === '990002' && ['/rest/v1/rpc/get_my_pet_access', '/rest/v1/vaccines'].includes(path);
    if (isSlow) {
      if (++slowRequests === 2) markSlowStarted();
      await slowGate;
    }
    let body: unknown = [];
    if (path === '/rest/v1/pets') {
      const token = request.headers().authorization?.split('.')[1];
      const viewer = token ? JSON.parse(Buffer.from(token, 'base64url').toString()).sub : null;
      if (petDenied || (accountDenied && viewer === READER)) return route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ message: 'Mock inaccessible pet', code: 'PGRST116' }) });
      body = { id: requestedPet, user_id: refreshOwnership && reloaded ? READER : OWNER, name: requestedPet === PET ? 'Mock Pet' : 'Slow Pet', species: 'cat', gender: 'ตัวเมีย', is_neutered: null, is_public: true, image_url: reloadFailure || refreshOwnership || (routeRace && requestedPet === PET) ? '/logo.png' : null, gallery_urls: (reloadFailure || refreshOwnership) && !reloaded ? '["/icons/icon-health.png"]' : '[]', farm_id: null };
    } else if (path === '/rest/v1/rpc/get_my_pet_access') {
      if (accessError) return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Mock access refusal', code: '42501' }) });
      if (delayedAccess) await gate;
      body = { ...access, vaccination: isSlow ? false : vaccination, ...Object.fromEntries(deniedGroups.map(group => [group, false])) };
    } else if (path === '/rest/v1/rpc/get_pet_health') {
      body = [{ blood_type: 'Mock private blood', allergies: null }];
    } else if (path === '/rest/v1/vaccines') {
      if (networkFailure) return route.abort('failed');
      if (readError || (reloadFailure && reloaded)) return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Mock read refusal', code: '42501' }) });
      body = empty ? [] : isSlow ? [{ id: '99', vaccine_name: 'Stale Slow Record', next_due: null }] : sampleRecords;
    } else if (path === '/rest/v1/rpc/get_pet_pedigree' && pedigreeError) {
      return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Mock pedigree refusal', code: '42501' }) });
    } else if (path === '/rest/v1/rpc/get_pet_pedigree' && routeRace) {
      body = [
        { node_id: Number(requestedPet), child_id: null, name: requestedPet === PET ? 'Mock Pet' : 'Slow Pet', relation: 'self', generation: 0 },
        { node_id: 990002, child_id: Number(PET), name: 'Slow Pet', relation: 'sire', generation: 1 },
      ];
    } else if (path === '/rest/v1/pet_ownership_transfers') {
      body = null;
    } else if (path === '/rest/v1/pet_weights' && routeRace) {
      if (requestedPet !== PET) return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Mock weight refusal' }) });
      body = [{ weight: 4321, recorded_date: '2026-11-01' }];
    } else if (!['/rest/v1/rpc/get_pet_pedigree', '/rest/v1/pet_activities', '/rest/v1/pet_documents', '/rest/v1/pet_co_owners', '/rest/v1/pet_weights', '/rest/v1/workspace_members', '/rest/v1/workspaces'].includes(path)) {
      unexpected.push(path);
      return route.fulfill({ status: 501, contentType: 'application/json', body: JSON.stringify({ message: 'Unconfigured mock endpoint' }) });
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (isSlow && ++slowResponses === 2) markSlowFinished();
  });
  await page.goto(`/th/pets/${PET}`);
  if (!anonymous && !petDenied) await expect(page.locator('.pet-name')).toContainText('Mock Pet');
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
  // Cold compilation of the destination can exceed the normal 30-second assertion budget.
  await expect(page).toHaveURL(`/th/pets/${PET}/vaccines/create`, { timeout: 90_000 });
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
  await expect(page.getByText('ไม่มีข้อมูลสายเลือดที่แสดงได้', { exact: true })).toBeVisible();
  await expect(page.getByText('กำลังโหลดข้อมูลสายเลือด...', { exact: true })).toHaveCount(0);
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
  await nav.getByRole('button', { name: 'ไทม์ไลน์', exact: true }).click();
  await expect(page.getByText(/อัปเดตวัคซีน/)).toHaveCount(0);
});

test('pending access does not expose category contents or vaccine actions', async ({ page }) => {
  const observed = await mockPet(page, { delayedAccess: true });
  await expect(categoryNav(page).getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'แก้ไขข้อมูลสัตว์เลี้ยง' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'เปลี่ยนรูปโปรไฟล์' })).toHaveCount(0);
  await expect(page.getByText('Mock private blood', { exact: true })).toHaveCount(0);
  await expect(page.locator(`a[href="/pets/${PET}/weight"]`)).toHaveCount(0);
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
  await expect(page.getByText('Mock private blood', { exact: true })).toHaveCount(0);
});


test('successful history followed by an actual gallery-triggered reload failure clears old records', async ({ page }) => {
  await mockPet(page, { reloadFailure: true });
  await expect(page.getByText('วัคซีนรวม', { exact: true })).toBeVisible();
  await expect(page.locator('.pet-id-qr img')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  // This existing owner action calls fetchPetData again; the PATCH is intercepted locally.
  await page.locator('.gallery-item').nth(1).hover();
  await page.locator('.gallery-item-del').click();
  await expect(summary(page)).toContainText('โหลดประวัติไม่สำเร็จ');
  await expect(page.getByText('วัคซีนรวม', { exact: true })).toHaveCount(0);
  await expect(page.locator('.vaccine-row')).toHaveCount(0);
  await expect(page.locator('.pet-id-qr img')).toBeVisible();
  await categoryNav(page).getByRole('button', { name: 'วัคซีน', exact: true }).click();
  await expect(page.getByText('โหลดประวัติไม่สำเร็จ', { exact: false })).toBeVisible();
  await expect(page.locator('.vaccine-row')).toHaveCount(0);
});

test('late responses after pedigree navigation and browser back cannot replace the current pet or access', async ({ page }) => {
  const observed = await mockPet(page, { routeRace: true });
  await expect(summary(page)).toContainText('4 รายการ');
  // Use the actual pedigree Link and browser history; no injected router or artificial route events.
  await page.locator('a.ped-card-link[href="/pets/990002"]').first().click();
  await expect(page).toHaveURL('/th/pets/990002');
  await observed.slowStarted;
  await page.goBack();
  await expect(page).toHaveURL(`/th/pets/${PET}`);
  await expect(page.locator('.pet-name')).toHaveText('Mock Pet');
  await expect(summary(page)).toContainText('4 รายการ');
  observed.releaseSlow();
  await observed.slowFinished;
  // A browser render turn after the delayed fetch callbacks have been delivered.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator('.pet-name')).toHaveText('Mock Pet');
  await expect(categoryNav(page).getByRole('button', { name: 'วัคซีน', exact: true })).toBeVisible();
  await expect(summary(page)).toContainText('4 รายการ');
  await expect(page.getByText('Stale Slow Record', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveAttribute('href', `/pets/${PET}/vaccines/create`);
  await page.goForward();
  await expect(page.locator('.pet-name')).toHaveText('Slow Pet');
  await expect(page.locator('.hero-main-image img')).toHaveAttribute('src', '/icons/icon-paw-pink.png');
  await expect(page.locator('.pet-info-table')).not.toContainText('4.32');
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
});

test('failed access RPC shows an explicit error and keeps all unconfirmed categories and actions closed', async ({ page }) => {
  await mockPet(page, { accessError: true });
  await expect(page.getByRole('alert').filter({ hasText: 'โหลดสิทธิ์ไม่สำเร็จ' })).toBeVisible();
  await expect(categoryNav(page).getByRole('button')).toHaveCount(0);
  await expect(summary(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  await expect(page.getByText('วัคซีนรวม', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'แก้ไขข้อมูลสัตว์เลี้ยง' })).toHaveCount(0);
});

test('anonymous visitor is redirected to login without requesting private pet data', async ({ page }) => {
  const observed = await mockPet(page, { anonymous: true });
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.locator('.pet-name')).toHaveCount(0);
  expect(observed.apiPaths.some(path => path.includes('/rest/v1/pets'))).toBe(false);
});

test('inaccessible private pet shows no profile or related data requests', async ({ page }) => {
  const observed = await mockPet(page, { petDenied: true, owner: false });
  await expect(page.getByText('ไม่พบข้อมูลสัตว์เลี้ยง', { exact: true })).toBeVisible();
  await expect(page.locator('.pet-name')).toHaveCount(0);
  expect(observed.apiPaths.some(path => path.includes('/rest/v1/vaccines'))).toBe(false);
});

test('transport failure shows a history error without leaving the loader stuck', async ({ page }) => {
  await mockPet(page, { networkFailure: true });
  await expect(summary(page)).toContainText('โหลดประวัติไม่สำเร็จ');
  await expect(page.locator('.vaccine-row')).toHaveCount(0);
});

// Exercise the SDK's real cross-tab notification channel, with synthetic local sessions only.
async function changeAccount(page: Page, signedIn: boolean) {
  await page.evaluate(({ signedIn, reader }) => {
    const key = 'sb-127-auth-token';
    const session = JSON.parse(localStorage.getItem(key)!);
    if (signedIn) {
      session.user.id = reader;
      const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      session.access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: reader, exp: 4102444800, role: 'authenticated' })}.mock-signature`;
      localStorage.setItem(key, JSON.stringify(session));
    } else localStorage.removeItem(key);
    const channel = new BroadcastChannel(key);
    channel.postMessage({ event: signedIn ? 'SIGNED_IN' : 'SIGNED_OUT', session: signedIn ? session : null });
    channel.close();
  }, { signedIn, reader: READER });
}

test('logout clears history and invalidates pending access responses, including browser back', async ({ page }) => {
  const observed = await mockPet(page, { routeRace: true });
  await expect(summary(page)).toContainText('4 รายการ');
  await page.locator('a.ped-card-link[href="/pets/990002"]').first().click();
  await expect(page).toHaveURL('/th/pets/990002');
  await observed.slowStarted;
  await changeAccount(page, false);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  observed.releaseSlow();
  await observed.slowFinished;
  await expect(page.locator('.pet-name')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.locator('.pet-name')).toHaveCount(0);
  await expect(page.getByText('วัคซีนรวม', { exact: true })).toHaveCount(0);
});

test('switching accounts discards the prior profile and rechecks private pet access', async ({ page }) => {
  const observed = await mockPet(page, { accountDenied: true, delayedAccess: true });
  await changeAccount(page, true);
  await expect(page.getByText('ไม่พบข้อมูลสัตว์เลี้ยง', { exact: true })).toBeVisible();
  observed.releaseAccess();
  await expect(page.locator('.pet-name')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
});

test('logout after visible history removes the loaded profile and vaccine actions', async ({ page }) => {
  await mockPet(page);
  await expect(summary(page)).toContainText('4 รายการ');
  await changeAccount(page, false);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.locator('.pet-name')).toHaveCount(0);
  await expect(summary(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
});

test('refresh after an ownership change drops the former owner management actions', async ({ page }) => {
  await mockPet(page, { refreshOwnership: true });
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('.gallery-item').nth(1).hover();
  await page.locator('.gallery-item-del').click();
  await expect(page.locator('.gallery-item')).toHaveCount(1);
  await expect(summary(page)).toContainText('4 รายการ');
  await expect(page.getByRole('link', { name: /เพิ่มวัคซีน/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'แก้ไขข้อมูลสัตว์เลี้ยง' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'เปลี่ยนรูปโปรไฟล์' })).toHaveCount(0);
});

test('failed pedigree read shows an error instead of an endless loading or empty state', async ({ page }) => {
  await mockPet(page, { pedigreeError: true });
  await expect(page.getByRole('alert').filter({ hasText: 'โหลดข้อมูลสายเลือดไม่สำเร็จ' })).toBeVisible();
  await expect(page.getByText('กำลังโหลดข้อมูลสายเลือด...', { exact: true })).toHaveCount(0);
  await expect(page.getByText('ไม่มีข้อมูลสายเลือดที่แสดงได้', { exact: true })).toHaveCount(0);
  await categoryNav(page).getByRole('button', { name: 'แผนผังสายเลือด', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'โหลดข้อมูลสายเลือดไม่สำเร็จ' })).toBeVisible();
});
