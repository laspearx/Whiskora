"use client";

// Branded 404 for every unmatched URL (Next renders the root not-found outside the [locale] layout, so the i18n
// context is not available here: the copy is local TH / EN, picked from the URL prefix, like terms / contact).
import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';

const COPY = {
  th: {
    title: 'ไม่พบหน้านี้',
    text: 'ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว',
    home: 'กลับหน้าแรก',
    explore: 'ดูฟาร์มสัตว์เลี้ยง',
  },
  en: {
    title: 'Page not found',
    text: 'The link may be wrong, or this page has moved.',
    home: 'Back to home',
    explore: 'Browse pet farms',
  },
} as const;

// The 404 is prerendered once (no request path at build time): the server snapshot is Thai, the browser then
// re-renders with the real URL — useSyncExternalStore does that without a hydration mismatch.
const noop = () => () => {};
const clientPath = () => window.location.pathname;
const serverPath = () => '';

export default function NotFoundView() {
  const pathname = useSyncExternalStore(noop, clientPath, serverPath);
  const locale: 'th' | 'en' = /^\/en(\/|$)/.test(pathname) ? 'en' : 'th';
  const t = COPY[locale];
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  return (
    <main lang={locale} className="min-h-[70vh] flex items-center justify-center px-5 py-16" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="w-full max-w-md text-center">
        <Link href={`/${locale}`} className="inline-block mb-8" aria-label="Whiskora">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Whiskora" width={180} height={58} style={{ height: 58, width: 'auto', margin: '0 auto' }} />
        </Link>
        <p className="text-sm font-bold tracking-widest" style={{ color: 'var(--pink-deep)' }}>404</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-gray-900">{t.title}</h1>
        <p className="mt-3 text-sm text-gray-600">{t.text}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/${locale}`} className="min-h-11 inline-flex items-center justify-center rounded-xl px-5 text-sm font-bold" style={{ background: 'var(--pink-deep)', color: '#fff' }}>
            {t.home}
          </Link>
          <Link href={`/${locale}/farm-hub`} className="min-h-11 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {t.explore}
          </Link>
        </div>
      </div>
    </main>
  );
}
