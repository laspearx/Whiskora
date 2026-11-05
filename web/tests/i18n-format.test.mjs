// cd web && node --test tests/i18n-format.test.mjs — lib/format.ts (locale-aware dates, numbers, prices, ages) and the
// dynamic message keys used by the Phase 1 pages. No browser, no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatAge, formatDate, formatDateTime, formatNumber, formatPrice, intlLocale, TIME_ZONE } from '../lib/format.ts';

const th = JSON.parse(readFileSync(new URL('../messages/th.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('../messages/en.json', import.meta.url), 'utf8'));

test('dates: Thai = Buddhist year, English = Gregorian day-month-year', () => {
  assert.equal(formatDate('2024-03-10', 'th'), '10 มี.ค. 2567');
  assert.equal(formatDate('2024-03-10', 'en'), '10 Mar 2024');
  assert.equal(formatDate('2024-03-10', 'th', 'long'), '10 มีนาคม 2567');
  assert.equal(formatDate('2024-03-10', 'en', 'long'), '10 March 2024');
});
test('dates use Asia/Bangkok, so server (UTC) and browser render the same day', () => {
  assert.equal(TIME_ZONE, 'Asia/Bangkok');
  // 2024-03-09 18:30 UTC = 2024-03-10 01:30 in Bangkok
  assert.equal(formatDate('2024-03-09T18:30:00Z', 'en'), '10 Mar 2024');
  assert.equal(formatDateTime('2024-03-09T18:30:00Z', 'en'), '10 Mar 2024, 01:30');
  assert.equal(formatDateTime('2024-03-09T18:30:00Z', 'th'), '10 มี.ค. 2567 01:30');
});
test('dates: empty / invalid → empty string, never "Invalid Date"', () => {
  for (const v of [null, undefined, '', 'nope']) { assert.equal(formatDate(v, 'en'), ''); assert.equal(formatDateTime(v, 'th'), ''); }
});
test('unknown locale falls back to Thai', () => {
  assert.equal(intlLocale('fr'), 'th-TH');
  assert.equal(formatDate('2024-03-10', 'xx'), '10 มี.ค. 2567');
});
test('numbers and prices: grouping, THB symbol, no decimals; empty for missing values', () => {
  assert.equal(formatNumber(1234567, 'en'), '1,234,567');
  assert.equal(formatNumber(1234567, 'th'), '1,234,567');
  assert.equal(formatNumber(2.345, 'en', 1), '2.3');
  assert.equal(formatPrice(18000, 'en'), '฿18,000');
  assert.equal(formatPrice(18000, 'th'), '฿18,000');
  assert.equal(formatPrice(450.6, 'en'), '฿451');
  for (const v of [null, undefined, Number.NaN]) assert.equal(formatPrice(v, 'en'), '');
});
test('ages: years / months / days per language; future or invalid → empty', () => {
  const now = new Date('2026-11-03T12:00:00Z');
  assert.equal(formatAge('2025-09-03', 'th', now), '1 ปี 2 เดือน');
  assert.equal(formatAge('2025-09-03', 'en', now), '1 yr 2 mo');
  assert.equal(formatAge('2025-11-03', 'en', now), '1 yr');
  assert.equal(formatAge('2026-08-03', 'th', now), '3 เดือน');
  assert.equal(formatAge('2026-10-30', 'en', now), '4 days');
  assert.equal(formatAge('2026-11-02', 'en', now), '1 day');
  assert.equal(formatAge('2026-10-30', 'th', now), '4 วัน');
  assert.equal(formatAge('2027-01-01', 'en', now), '');
  assert.equal(formatAge(null, 'en', now), '');
});

// ── dynamic keys built in code exist in both languages ─────────────────────────────────────────────────────────
const get = (o, path) => path.split('.').reduce((n, p) => (n && typeof n === 'object' ? n[p] : undefined), o);
test('home page: every problem / feature / FAQ / roadmap key in the page exists in th and en', () => {
  const src = readFileSync(new URL('../app/[locale]/_home/HomePage.tsx', import.meta.url), 'utf8');
  const block = (name) => [...(src.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\]`))?.[1] ?? '').matchAll(/key: "(\w+)"/g)].map((m) => m[1]);
  const list = (name) => [...(src.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))?.[1] ?? '').matchAll(/"(\w+)"/g)].map((m) => m[1]);
  const keys = [
    ...block('problemCards').flatMap((k) => [`problem.${k}.title`, `problem.${k}.desc`]),
    ...block('ownerFeatures').flatMap((k) => [`owner.${k}.title`, `owner.${k}.desc`]),
    ...block('farmFeatures').flatMap((k) => [`farm.${k}.title`, `farm.${k}.desc`]),
    ...list('roadmapItems').map((k) => `roadmap.${k}`),
    ...list('faqKeys').flatMap((k) => [`faq.${k}.q`, `faq.${k}.a`]),
  ];
  assert.equal(keys.length, 8 + 8 + 8 + 3 + 12);
  for (const k of keys) for (const [m, n] of [[th, 'th'], [en, 'en']]) assert.equal(typeof get(m.landing, k), 'string', `${n}:landing.${k}`);
});
test('metadata keys used by the [locale] shims and layout exist and are not empty', () => {
  for (const k of ['siteTitle', 'siteDescription', 'farmHubTitle', 'farmHubDescription', 'searchTitle', 'searchDescription'])
    for (const m of [th, en]) assert.ok(typeof m.meta[k] === 'string' && m.meta[k].length > 5, k);
  assert.doesNotMatch(en.meta.siteTitle, /[฀-๿]/);
});
test('glossary: shared terms are spelled the same everywhere in English', () => {
  assert.equal(en.common.verifiedFarm, 'Verified farm');
  assert.ok(en.landing.faq.verified.q.includes(`"${en.common.verifiedFarm}"`));
  assert.equal(en.common.statusOpenReserve, 'Open for reservation');
  assert.equal(en.common.statusAvailable, 'Ready for a new home');
  assert.ok(en.nav.farmHubSub.includes('ready for a new home'));
});

// ── Phase 2 pages ──────────────────────────────────────────────────────────────────────────────────────────────
const keysOf = (file, name) => {
  const src = readFileSync(new URL(file, import.meta.url), 'utf8');
  const block = src.match(new RegExp(`const ${name}[^=]*= \\[([\\s\\S]*?)\\];`))?.[1] ?? '';
  return [...block.matchAll(/key: ['"](\w+)['"]/g)].map((m) => m[1]);
};
test('about: every mission / feature key exists in th and en', () => {
  const keys = [
    ...keysOf('../app/about/page.tsx', 'missions').flatMap((k) => [`mission.${k}.title`, `mission.${k}.desc`]),
    ...keysOf('../app/about/page.tsx', 'features').flatMap((k) => [`feature.${k}.title`, `feature.${k}.desc`]),
  ];
  assert.equal(keys.length, 8 + 12);
  for (const k of keys) for (const [m, n] of [[th, 'th'], [en, 'en']]) assert.equal(typeof get(m.about, k), 'string', `${n}:about.${k}`);
});
test('marketplace / service-hub: every category has a label; stored Thai values are unchanged', () => {
  for (const [file, ns, n] of [['../app/marketplace/page.tsx', 'marketplace', 5], ['../app/service-hub/page.tsx', 'serviceHub', 5]]) {
    const keys = keysOf(file, 'CATEGORIES');
    assert.equal(keys.length, n);
    for (const k of keys) for (const m of [th, en]) assert.equal(typeof m[ns].category[k], 'string', `${ns}.category.${k}`);
  }
  const ms = readFileSync(new URL('../app/marketplace/page.tsx', import.meta.url), 'utf8');
  for (const v of ['อาหาร', 'ของเล่น', 'อุปกรณ์', 'ที่นอน/กรง', 'สุขภาพ/อาบน้ำ']) assert.ok(ms.includes(`value: "${v}"`), v);
  const ss = readFileSync(new URL('../app/service-hub/page.tsx', import.meta.url), 'utf8');
  for (const v of ['อาบน้ำ-ตัดขน', 'คลินิก/โรงพยาบาล', 'โรงแรมสัตว์เลี้ยง', 'ฝึกสอนสัตว์', 'บริการอื่นๆ']) assert.ok(ss.includes(`value: "${v}"`), v);
});
test('Phase 2 metadata keys exist; English titles have no Thai', () => {
  for (const p of ['marketplace', 'serviceHub', 'community', 'about'])
    for (const m of [th, en]) { assert.ok(m.meta[`${p}Title`]?.length > 3, p); assert.ok(m.meta[`${p}Description`]?.length > 10, p); }
  for (const p of ['marketplace', 'serviceHub', 'community', 'about']) assert.doesNotMatch(en.meta[`${p}Title`], /[฀-๿]/);
});
test('glossary across pages: one English word per concept', () => {
  assert.equal(en.common.otherPets, 'Other pets');
  assert.equal(en.common.browseFarms, en.landing.farmsBrowse);
  assert.equal(en.serviceHub.title, en.nav.clinics);
  assert.equal(en.meta.serviceHubTitle.toLowerCase().includes('clinics'), true);
  assert.equal(th.serviceHub.title, th.nav.clinics);
});
