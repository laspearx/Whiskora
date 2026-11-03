// Locale-aware formatting for system UI (i18n Phase 1). One place for dates, numbers, prices and ages so /th and /en
// never disagree and server / browser renders match (fixed time zone, explicit locale — never the runtime default).
//
// Thai: Buddhist-era year (th-TH default calendar), e.g. "10 มี.ค. 2567". English: Gregorian, day-month-year,
// e.g. "10 Mar 2024" (en-GB order reads naturally for a Thai audience and avoids US month-first ambiguity).

export type AppLocale = 'th' | 'en';
export const TIME_ZONE = 'Asia/Bangkok';

export const asLocale = (l: string | null | undefined): AppLocale => (l === 'en' ? 'en' : 'th');
export const intlLocale = (l: string | null | undefined) => (asLocale(l) === 'en' ? 'en-GB' : 'th-TH');

type DateInput = Date | string | number | null | undefined;
const toDate = (d: DateInput): Date | null => {
  if (d === null || d === undefined || d === '') return null;
  const v = d instanceof Date ? d : new Date(d);
  return Number.isNaN(v.getTime()) ? null : v;
};

/** "10 มี.ค. 2567" / "10 Mar 2024". style 'long' → "10 มีนาคม 2567" / "10 March 2024". Invalid / empty → ''. */
export function formatDate(d: DateInput, locale: string, style: 'short' | 'long' = 'short'): string {
  const v = toDate(d);
  if (!v) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric', month: style === 'long' ? 'long' : 'short', year: 'numeric', timeZone: TIME_ZONE,
  }).format(v);
}

/** Date + time, e.g. "10 มี.ค. 2567 14:05" / "10 Mar 2024, 14:05" (24 h in both). */
export function formatDateTime(d: DateInput, locale: string): string {
  const v = toDate(d);
  if (!v) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE,
  }).format(v);
}

export function formatNumber(n: number | null | undefined, locale: string, maxFractionDigits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: maxFractionDigits }).format(n);
}

/** Thai baht, no decimals: "฿18,000" in both languages (THB is the only currency on Whiskora). */
export function formatPrice(n: number | null | undefined, locale: string): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency', currency: 'THB', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0, minimumFractionDigits: 0,
  }).format(n);
}

/** Age from a birth date: "1 ปี 2 เดือน" / "1 yr 2 mo"; under a month → days; future / invalid → ''. */
export function formatAge(birth: DateInput, locale: string, now: Date = new Date()): string {
  const b = toDate(birth);
  if (!b || b > now) return '';
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  const en = asLocale(locale) === 'en';
  if (years > 0) return en ? `${years} yr${months > 0 ? ` ${months} mo` : ''}` : `${years} ปี${months > 0 ? ` ${months} เดือน` : ''}`;
  if (months > 0) return en ? `${months} mo` : `${months} เดือน`;
  const days = Math.floor((now.getTime() - b.getTime()) / 86_400_000);
  if (days <= 0) return '';
  return en ? `${days} ${days === 1 ? 'day' : 'days'}` : `${days} วัน`;
}
