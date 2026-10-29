// ใช้ใน route handler ที่ middleware ไม่ได้ครอบ (auth callbacks) ให้ redirect กลับภาษาที่ผู้ใช้เลือกล่าสุด
// ชื่อ cookie ต้องตรงกับที่ middleware.ts ตั้งไว้
export const LOCALE_COOKIE = 'NEXT_LOCALE';
const LOCALES = ['th', 'en'];

export function resolveLocale(cookieValue: string | undefined): string {
  return cookieValue && LOCALES.includes(cookieValue) ? cookieValue : 'th';
}

// เติม prefix ภาษาให้ path ภายใน ถ้ายังไม่มี
export function withLocale(path: string, locale: string): string {
  return /^\/(th|en)(\/|$)/.test(path) ? path : `/${locale}${path}`;
}

// ตัด /th หรือ /en ด้านหน้าออก — ใช้ก่อนส่งให้ router ของ i18n (ซึ่งเติม prefix เอง) ไม่งั้นได้ /th/th/...
export function stripLocale(path: string): string {
  return path.replace(/^\/(th|en)(?=\/|$)/, '') || '/';
}

// path ภายในที่ปลอดภัยเท่านั้น — กัน open redirect แบบ //evil.com และ /\evil.com
export function safeInternalPath(raw: string | null | undefined, fallback = '/profile'): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : fallback;
}
