// Language switching + navigation i18n (desktop + mobile). Public pages only, no account, no data: every request that
// is not to localhost is aborted.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const AXE = readFileSync(join(process.cwd(), 'node_modules/axe-core/axe.min.js'), 'utf8');
const NAV_KEYS = Object.keys(JSON.parse(readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8')).nav);

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
});
const mobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
async function switchTo(page: Page, lang: 'TH' | 'EN') {
  if (mobile(page)) {
    await page.getByRole('button', { name: /Open menu|เปิดเมนู/ }).click();
  }
  const btn = page.locator('nav').first().getByRole('button', { name: new RegExp(`^${lang}\\b`) }).filter({ visible: true });
  await btn.click();
}
const lang = (page: Page) => page.evaluate(() => document.documentElement.lang);
async function homeLink(page: Page) {
  if (mobile(page)) return page.locator('nav[aria-label]').last().getByRole('button').first();   // bottom tab "Home"
  return page.locator('nav').first().getByRole('link', { name: /^(Home|หน้าแรก)$/ });
}

test('TH → EN → TH on the same page: URL, html lang, navigation labels', async ({ page }) => {
  await page.goto('/th/terms');
  await expect.poll(() => lang(page)).toBe('th');
  await expect(await homeLink(page)).toHaveText(/หน้าแรก/);
  await switchTo(page, 'EN');
  await expect(page).toHaveURL(/\/en\/terms$/);
  await expect.poll(() => lang(page)).toBe('en');
  await expect(await homeLink(page)).toHaveText(/Home/);
  await switchTo(page, 'TH');
  await expect(page).toHaveURL(/\/th\/terms$/);
  await expect.poll(() => lang(page)).toBe('th');
  expect(page.url()).not.toMatch(/\/(th|en)\/(th|en)(\/|$)/);
});

test('refresh keeps English; back / forward move between the two languages', async ({ page }) => {
  await page.goto('/th/about');
  await switchTo(page, 'EN');
  await expect(page).toHaveURL(/\/en\/about$/);
  await page.reload();
  await expect(page).toHaveURL(/\/en\/about$/);
  await expect.poll(() => lang(page)).toBe('en');
  await page.goBack();
  await expect(page).toHaveURL(/\/th\/about$/);
  await expect.poll(() => lang(page)).toBe('th');
  await page.goForward();
  await expect(page).toHaveURL(/\/en\/about$/);
  await expect.poll(() => lang(page)).toBe('en');
});

test('the chosen language is remembered for unprefixed links and new tabs (NEXT_LOCALE cookie)', async ({ page, context }) => {
  await page.goto('/th/terms');
  await switchTo(page, 'EN');
  await expect(page).toHaveURL(/\/en\/terms$/);
  const tab = await context.newPage();
  await tab.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
  await tab.goto('/contact');
  await expect(tab).toHaveURL(/\/en\/contact$/);
  await tab.close();
});

test('deep links open in their own language; no /en/en', async ({ page }) => {
  await page.goto('/en/privacy');
  await expect.poll(() => lang(page)).toBe('en');
  await page.goto('/th/privacy');
  await expect.poll(() => lang(page)).toBe('th');
  const r = await page.goto('/en/en/terms');
  expect(r?.status()).toBe(404);   // never produced by the app; a typed one is a 404, not a loop
});

test('switching language keeps the query string (e.g. search terms)', async ({ page }) => {
  await page.goto('/th/search?q=corgi');
  await switchTo(page, 'EN');
  await expect(page).toHaveURL(/\/en\/search\?q=corgi$/);
});

test('public pet profile link opens in the chosen language', async ({ page }) => {
  await page.goto('/en/p/00000000');           // no data (unreachable backend) — checks the shell language only
  await expect.poll(() => lang(page)).toBe('en');
  await expect(page.locator('body')).not.toContainText(/\{[a-zA-Z]+\}/);
});

test('navigation shows no raw message keys and is fully English on /en', async ({ page }) => {
  await page.goto('/en/terms');
  if (mobile(page)) await page.getByRole('button', { name: 'Open menu' }).click();
  else await page.getByRole('button', { name: 'Explore' }).click();
  const nav = page.locator('nav').first();
  const text = await nav.innerText();
  for (const k of NAV_KEYS) if (k.length > 4 && /[A-Z]/.test(k)) expect(text).not.toContain(k);
  expect(text).not.toMatch(/[฀-๿]/);
  await expect(nav.getByRole('button', { name: /^EN\b/ }).filter({ visible: true })).toHaveAttribute('aria-pressed', 'true');
  const tabs = page.locator('nav[aria-label="Main menu"]');
  if (mobile(page)) await expect(tabs).toContainText('Weigh-in');
});

test('accessibility (axe WCAG 2.1 A/AA) of the navigation in English with the menu open', async ({ page }) => {
  await page.goto('/en/terms');
  if (mobile(page)) await page.getByRole('button', { name: 'Open menu' }).click();
  else await page.getByRole('button', { name: 'Explore' }).click();
  await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async () => {
    // @ts-expect-error injected
    const r = await window.axe.run('nav', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return r.violations.map((x: { id: string; nodes: { target: string[] }[] }) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
  });
  expect(v).toEqual([]);
});

test('404: branded page in the URL language, no hydration error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [path, heading, lang_] of [['/en/does-not-exist', 'Page not found', 'en'], ['/th/does-not-exist', 'ไม่พบหน้านี้', 'th']] as const) {
    const r = await page.goto(path);
    expect(r?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect.poll(() => lang(page)).toBe(lang_);
    await expect(page.getByRole('link', { name: lang_ === 'en' ? 'Back to home' : 'กลับหน้าแรก' })).toHaveAttribute('href', `/${lang_}`);
  }
  expect(errors).toEqual([]);
});
