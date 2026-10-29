import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['th', 'en'];
const defaultLocale = 'th';
// จำภาษาล่าสุดที่ผู้ใช้เปิด เพื่อให้ลิงก์/redirect ที่ไม่มี prefix (next/link ตรงๆ, router.push('/login') ฯลฯ)
// พากลับไปภาษาเดิม แทนที่จะตกไป /th เสมอ — auth callback routes อ่าน cookie เดียวกันนี้ผ่าน lib/locale.ts
const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/pet-id-card-preview' || pathname.startsWith('/pet-id-card-preview/')) {
    return NextResponse.next();
  }

  const currentLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!currentLocale) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = saved && locales.includes(saved) ? saved : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== currentLocale) {
    response.cookies.set(LOCALE_COOKIE, currentLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)', ],
};
