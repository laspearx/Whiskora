import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, QRCodeReader } from '@zxing/library';

const out = resolve('../local-evidence/pet-id-mobile-card-20261104');
const themes = ['Whiskora Pink', 'Soft Blue', 'Mint Care', 'Lavender', 'Cream Classic', 'Rose Gold'];
const widths = [320, 360, 375, 390, 430, 1440];

async function decode(png: Buffer) {
  const { data, info } = await sharp(png).flatten({ background: '#ffffff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height)))).getText();
}

async function fixture(page: Page, name: string) {
  const errors: string[] = [], external: string[] = [], writes: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if (location.origin !== 'http://localhost:3132') return;
    const id = '00000000-0000-4000-8000-000000000001';
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: 4102444800, role: 'authenticated' })}.synthetic`, refresh_token: 'synthetic', token_type: 'bearer', expires_at: 4102444800, user: { id, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
  });
  const photo = await sharp({ create: { width: 240, height: 120, channels: 3, background: '#50bca4' } }).png().toBuffer();
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === 'localhost') {
      if (url.pathname === '/synthetic-pet.png') return route.fulfill({ body: photo, contentType: 'image/png' });
      return route.continue();
    }
    if (url.origin !== 'http://127.0.0.1:9') {
      external.push(url.origin);
      return route.abort();
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !url.pathname.includes('/rpc/')) writes.push(url.pathname);
    if (url.pathname.endsWith('/pets')) return route.fulfill({ json: { id: 990001, name, breed: 'Synthetic Long Breed Name สายพันธุ์ทดสอบ', color: 'Synthetic cream tabby สีครีม', birth_date: '2024-03-10', image_url: '/synthetic-pet.png', species: 'cat', gender: 'female', farm_id: null, is_public: true } });
    if (url.pathname.endsWith('/get_pet_health')) return route.fulfill({ json: [{ blood_type: 'A' }] });
    return route.fulfill({ json: [] });
  });
  return { errors, external, writes };
}

for (const width of widths) for (const locale of ['th', 'en']) {
  test(`card quality ${width}px ${locale}: all themes, long text, local QR and real demo PNG`, async ({ page }) => {
    const name = locale === 'th' ? 'ลูน่าดวงจันทร์แห่งบ้านทดสอบสัตว์เลี้ยง' : 'Luna Moonlight Synthetic Family Companion';
    const observed = await fixture(page, name);
    const dir = resolve(out, process.env.I18N_RUN_LABEL || 'quality', `after-${width}-${locale}`);
    mkdirSync(dir, { recursive: true });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/${locale}/pets/990001/id-card`);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    const metrics = [];
    for (const theme of themes) {
      await page.locator('.idc-theme-btn').filter({ hasText: theme }).click();
      await expect(page.locator('.pc-qr-box > img')).toHaveAttribute('src', /^data:image\/png/);
      await page.waitForTimeout(500); // finish documented card entrance/theme transitions
      const m = await page.evaluate(() => {
        const card = document.querySelector('.pet-card')!, scaler = document.querySelector('.idc-card-scaler')!;
        const c = card.getBoundingClientRect(), s = scaler.getBoundingClientRect();
        const nodes = [...card.querySelectorAll('.pc-name, .pc-cr-val, .pc-footer, .pc-id-bar, .pc-qr-box')];
        return { card: c.toJSON(), scaler: s.toJSON(), overflow: document.documentElement.scrollWidth - innerWidth, children: nodes.map(n => ({ text: n.textContent, rect: n.getBoundingClientRect().toJSON(), clippedText: n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1 })), photo: { fit: getComputedStyle(document.querySelector('.pc-photo > img')!).objectFit, width: (document.querySelector('.pc-photo > img') as HTMLImageElement).naturalWidth, height: (document.querySelector('.pc-photo > img') as HTMLImageElement).naturalHeight } };
      });
      expect(m.card.left).toBeGreaterThanOrEqual(m.scaler.left - 1);
      expect(m.card.right).toBeLessThanOrEqual(m.scaler.right + 1);
      expect(m.card.bottom).toBeLessThanOrEqual(m.scaler.bottom + 1);
      expect(m.card.right).toBeLessThanOrEqual(width);
      expect(m.overflow).toBeLessThanOrEqual(0);
      for (const child of m.children) {
        expect(child.rect.right, child.text || theme).toBeLessThanOrEqual(m.card.right + 1);
        expect(child.rect.bottom, child.text || theme).toBeLessThanOrEqual(m.card.bottom + 1);
        expect(child.clippedText, child.text || theme).toBe(false);
      }
      expect(m.photo).toEqual({ fit: 'cover', width: 240, height: 120 });
      // Locator screenshots can otherwise include the app's fixed navbar over the QR.
      // Centre the real element and verify its viewport position before capturing pixels.
      await page.locator('.pc-qr-box').evaluate(n => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect.poll(() => page.locator('.pc-qr-box').evaluate(n => n.getBoundingClientRect().top)).toBeGreaterThan(100);
      const qr = await page.locator('.pc-qr-box').screenshot();
      writeFileSync(resolve(dir, `actual-qr-${theme}.png`), qr);
      expect(await decode(qr)).toBe('http://localhost:3132/p/990001');
      await page.locator('.pet-card').evaluate(n => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.locator('.pet-card').screenshot({ path: resolve(dir, `actual-${theme}.png`) });
      metrics.push({ theme, actual: m });
    }
    await page.screenshot({ path: resolve(dir, 'actual-page.png'), fullPage: true });
    await page.goto(`/${locale}/pet-id-card-preview`);
    let previous = '';
    const exportHashes = new Set<string>();
    for (const theme of themes) {
      await page.locator('.theme-choice').filter({ hasText: theme }).click();
      await expect(page.locator('.sample-card-rendered')).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => page.locator('.sample-card-rendered').getAttribute('src')).not.toBe(previous);
      const src = (await page.locator('.sample-card-rendered').getAttribute('src'))!;
      expect(src).toMatch(/^data:image\/png;base64,/);
      previous = src;
      const png = Buffer.from(src.split(',')[1], 'base64');
      writeFileSync(resolve(dir, `export-${theme}.png`), png); // actual application export, saved even if validation fails
      const metadata = await sharp(png).metadata();
      expect([metadata.width, metadata.height]).toEqual([1200, 1800]);
      expect((await sharp(png).stats()).entropy).toBeGreaterThan(1);
      const m = await page.evaluate(() => {
        const card = document.querySelector('.sample-card')!, c = card.getBoundingClientRect();
        const qr = document.querySelector('.sample-qr')!.getBoundingClientRect();
        const image = document.querySelector('.sample-card-rendered')!.getBoundingClientRect();
        return { card: c.toJSON(), image: image.toJSON(), qr: { left: qr.left - c.left, top: qr.top - c.top, width: qr.width, height: qr.height }, children: [...card.querySelectorAll('.sample-row, .sample-line, .sample-footer, .sample-bottom')].map(n => ({ text: n.textContent, right: n.getBoundingClientRect().right - c.left, bottom: n.getBoundingClientRect().bottom - c.top, clipped: n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1 })) };
      });
      expect(m.image.right).toBeLessThanOrEqual(width);
      expect(m.image.width / m.image.height).toBeCloseTo(2 / 3, 2);
      for (const child of m.children) {
        expect(child.right, child.text || theme).toBeLessThanOrEqual(401);
        expect(child.bottom, child.text || theme).toBeLessThanOrEqual(601);
        expect(child.clipped, child.text || theme).toBe(false);
      }
      const crop = await sharp(png).extract({ left: Math.floor(m.qr.left * 3), top: Math.floor(m.qr.top * 3), width: Math.floor(m.qr.width * 3), height: Math.floor(m.qr.height * 3) }).png().toBuffer();
      expect(await decode(crop)).toBe('http://localhost:3132/pet-id-card-preview#demo-profile');
      exportHashes.add((await sharp(png).stats()).channels.map(c => c.mean.toFixed(4)).join(','));
      metrics.push({ theme, demo: m, png: { width: metadata.width, height: metadata.height } });
    }
    expect(exportHashes.size).toBe(6);
    await page.screenshot({ path: resolve(dir, 'demo-page.png'), fullPage: true });
    expect(observed.errors).toEqual([]);
    expect(observed.writes).toEqual([]);
    expect(observed.external.filter(origin => origin !== 'https://fonts.googleapis.com')).toEqual([]);
    writeFileSync(resolve(dir, 'metrics.json'), JSON.stringify(metrics, null, 2));
  });
}
