"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useTranslations, useLocale } from '@/i18n/context';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [visibleDesktopCount, setVisibleDesktopCount] = useState(10);
  const [session, setSession] = useState<Session | null>(null);
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  type RouterPath = Parameters<typeof router.push>[0];
  type DesktopNavItem = {
    key: string;
    label: string;
    href?: RouterPath;
    protectedHref?: RouterPath;
  };
  const navRef = useRef<HTMLElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const desktopMeasureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleProtectedAction = (path: RouterPath) => {
    if (!session) {
      router.push('/login');
    } else {
      router.push(path);
    }
    setIsOpen(false);
    setIsMoreOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsMoreOpen(false);
    router.push('/login');
  };

  const switchLocale = (next: 'th' | 'en') => {
    router.replace(pathname, { locale: next });
    setIsOpen(false);
    setIsMoreOpen(false);
  };

  const desktopNavItems: DesktopNavItem[] = [
    { key: 'home', label: t('home'), href: '/' },
    { key: 'profile', label: t('profile'), protectedHref: '/profile' },
    { key: 'marketplace', label: t('petShop'), href: '/marketplace' },
    { key: 'services', label: t('services'), href: '/service-hub' },
    { key: 'community', label: t('community'), href: '/community' },
    { key: 'farm', label: t('petMarket'), href: '/farm-hub' },
    { key: 'partner', label: t('partner'), href: '/partner' },
    { key: 'knowledge', label: t('knowledge'), href: '/pet-knowledge' },
    { key: 'tools', label: t('tools'), href: '/pet-tools' },
    { key: 'about', label: t('about'), href: '/about' },
  ];

  useEffect(() => {
    const calculateVisibleItems = () => {
      const container = desktopNavRef.current;
      const measure = desktopMeasureRef.current;
      if (!container || !measure) return;

      const containerWidth = container.getBoundingClientRect().width;
      const itemNodes = Array.from(measure.querySelectorAll<HTMLElement>('[data-nav-probe-item]'));
      const languageNode = measure.querySelector<HTMLElement>('[data-nav-probe-language]');
      const authNode = measure.querySelector<HTMLElement>('[data-nav-probe-auth]');
      const moreNode = measure.querySelector<HTMLElement>('[data-nav-probe-more]');
      if (!languageNode || !authNode || !moreNode || itemNodes.length === 0) return;

      const gap = 16;
      const itemWidths = itemNodes.map((node) => Math.ceil(node.getBoundingClientRect().width));
      const languageWidth = Math.ceil(languageNode.getBoundingClientRect().width);
      const authWidth = Math.ceil(authNode.getBoundingClientRect().width);
      const moreWidth = Math.ceil(moreNode.getBoundingClientRect().width);
      const fullElements = itemWidths.length + 2;
      const fullWidth = itemWidths.reduce((sum, width) => sum + width, 0) + languageWidth + authWidth + gap * Math.max(0, fullElements - 1);

      if (fullWidth <= containerWidth) {
        setVisibleDesktopCount((prev) => (prev === itemWidths.length ? prev : itemWidths.length));
        setIsMoreOpen(false);
        return;
      }

      let nextVisibleCount = itemWidths.length;
      while (nextVisibleCount > 0) {
        const visibleWidth = itemWidths.slice(0, nextVisibleCount).reduce((sum, width) => sum + width, 0);
        const elements = nextVisibleCount + 3;
        const requiredWidth = visibleWidth + moreWidth + languageWidth + authWidth + gap * Math.max(0, elements - 1);
        if (requiredWidth <= containerWidth) break;
        nextVisibleCount -= 1;
      }

      setVisibleDesktopCount((prev) => (prev === nextVisibleCount ? prev : nextVisibleCount));
    };

    calculateVisibleItems();
    const observer = new ResizeObserver(calculateVisibleItems);
    if (desktopNavRef.current) observer.observe(desktopNavRef.current);
    window.addEventListener('resize', calculateVisibleItems);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateVisibleItems);
    };
  }, [locale, session]);

  const linkClass = (path: string) =>
    `whitespace-nowrap hover:text-pink-500 transition ${isActive(path) ? 'text-pink-500 font-bold underline underline-offset-8 decoration-2' : ''}`;

  const dropClass = (path: string) =>
    `px-4 py-2.5 text-sm font-medium transition ${isActive(path) ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`;

  const renderDesktopNavItem = (item: DesktopNavItem) => {
    if (item.protectedHref) {
      return (
        <button
          key={item.key}
          onClick={() => handleProtectedAction(item.protectedHref as RouterPath)}
          className={`whitespace-nowrap hover:text-pink-500 transition ${isActive(item.protectedHref) ? 'text-pink-500 font-bold' : ''}`}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link key={item.key} href={item.href as RouterPath} className={linkClass(item.href as string)}>
        {item.label}
      </Link>
    );
  };

  const renderOverflowNavItem = (item: DesktopNavItem) => {
    if (item.protectedHref) {
      return (
        <button
          key={item.key}
          onClick={() => handleProtectedAction(item.protectedHref as RouterPath)}
          className={`w-full text-left ${dropClass(item.protectedHref)}`}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href as RouterPath}
        onClick={() => setIsMoreOpen(false)}
        className={`block ${dropClass(item.href as string)}`}
      >
        {item.label}
      </Link>
    );
  };

  if (pathname === '/') return null;

  if (pathname === '/') {
    return (
      <nav ref={navRef} className="bg-white sticky top-0 z-50 border-b border-pink-100/70">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center shrink-0 transition-transform hover:scale-105">
              <Image src="/logo.png" alt="Whiskora Logo" width={178} height={54} className="h-12 md:h-14 w-auto object-contain" priority />
            </Link>

            <div className="flex items-center gap-4 text-[#5a1649]">
              <button
                aria-label="Notifications"
                onClick={() => handleProtectedAction('/profile')}
                className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-pink-50"
              >
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <button
                aria-label="Favorites"
                onClick={() => router.push('/pet-id-card')}
                className="grid h-11 w-11 place-items-center rounded-full text-[#ef3e7b] transition hover:bg-pink-50"
              >
                <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                </svg>
              </button>
              <button
                aria-label="Menu"
                onClick={() => setIsOpen(!isOpen)}
                className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-pink-50"
              >
                <svg width="31" height="31" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round">
                  {isOpen ? <path d="M6 18 18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="absolute right-6 top-20 w-56 overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl">
              <div className="flex flex-col py-2">
                <Link href="/pet-id-card" onClick={() => setIsOpen(false)} className={dropClass('/pet-id-card')}>Pet ID Card</Link>
                <Link href="/profile" onClick={() => setIsOpen(false)} className={dropClass('/profile')}>{t('profile')}</Link>
                <Link href="/partner" onClick={() => setIsOpen(false)} className={dropClass('/partner')}>{t('partner')}</Link>
                <Link href="/about" onClick={() => setIsOpen(false)} className={dropClass('/about')}>{t('about')}</Link>
                <div className="border-t border-pink-50 px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => switchLocale('th')} className={`flex-1 rounded-xl border py-1.5 text-xs font-bold ${locale === 'th' ? 'border-pink-200 bg-pink-50 text-pink-500' : 'border-gray-100 text-gray-400'}`}>TH</button>
                    <button onClick={() => switchLocale('en')} className={`flex-1 rounded-xl border py-1.5 text-xs font-bold ${locale === 'en' ? 'border-pink-200 bg-pink-50 text-pink-500' : 'border-gray-100 text-gray-400'}`}>EN</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  const visibleDesktopItems = desktopNavItems.slice(0, visibleDesktopCount);
  const overflowDesktopItems = desktopNavItems.slice(visibleDesktopCount);

  return (
    <nav ref={navRef} className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">

          <Link href="/" className="flex items-center shrink-0 transition-transform hover:scale-105 py-2">
            <Image src="/logo.png" alt="Whiskora Logo" width={160} height={48} className="h-22 md:h-30 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div ref={desktopNavRef} className="hidden md:flex min-w-0 flex-1 justify-end gap-4 items-center font-medium text-gray-600 text-sm">
            {visibleDesktopItems.map(renderDesktopNavItem)}

            {overflowDesktopItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="More navigation"
                  aria-expanded={isMoreOpen}
                  onClick={() => setIsMoreOpen((open) => !open)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-pink-100 bg-white text-pink-500 shadow-sm transition hover:bg-pink-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isMoreOpen && (
                  <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-pink-100 bg-white py-2 shadow-2xl">
                    {overflowDesktopItems.map(renderOverflowNavItem)}
                  </div>
                )}
              </div>
            )}

            {/* Language switcher */}
            <div className="flex items-center gap-1 ml-1 bg-gray-50 rounded-xl border border-gray-200 px-1 py-1">
              <button
                onClick={() => switchLocale('th')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${locale === 'th' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                TH
              </button>
              <button
                onClick={() => switchLocale('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${locale === 'en' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                EN
              </button>
            </div>

            {session ? (
              <button onClick={handleLogout} className="ml-1 text-red-400 hover:text-red-600 font-bold transition">{t('logout')}</button>
            ) : (
              <Link href="/login" className="ml-1 text-pink-500 font-bold transition">{t('login')}</Link>
            )}
          </div>

          <div
            ref={desktopMeasureRef}
            aria-hidden="true"
            className="pointer-events-none invisible fixed left-0 top-0 -z-10 hidden w-max md:flex items-center gap-4 whitespace-nowrap font-medium text-gray-600 text-sm"
          >
            {desktopNavItems.map((item) => (
              <span key={item.key} data-nav-probe-item>
                {item.label}
              </span>
            ))}
            <span data-nav-probe-more className="grid h-9 w-9 place-items-center rounded-xl border px-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span data-nav-probe-language className="flex items-center gap-1 rounded-xl border px-1 py-1">
              <span className="px-2.5 py-1 text-xs font-bold">TH</span>
              <span className="px-2.5 py-1 text-xs font-bold">EN</span>
            </span>
            <span data-nav-probe-auth className="ml-1 font-bold">
              {session ? t('logout') : t('login')}
            </span>
          </div>

          {/* Mobile header buttons */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/" className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <button
              onClick={() => handleProtectedAction('/profile')}
              className="flex items-center justify-center w-10 h-10 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-100 transition shadow-sm border border-pink-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-800 rounded-xl focus:outline-none transition-colors border border-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isOpen && (
          <div className="md:hidden absolute top-14 right-4 w-52 bg-white rounded-2xl shadow-xl border border-pink-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col py-2">
              <Link href="/" onClick={() => setIsOpen(false)} className={dropClass('/')}>{t('home')}</Link>
              <button onClick={() => handleProtectedAction('/profile')} className={`text-left ${dropClass('/profile')}`}>{t('profile')}</button>
              <Link href="/marketplace" onClick={() => setIsOpen(false)} className={dropClass('/marketplace')}>{t('petShop')}</Link>
              <Link href="/service-hub" onClick={() => setIsOpen(false)} className={dropClass('/service-hub')}>{t('services')}</Link>
              <Link href="/community" onClick={() => setIsOpen(false)} className={dropClass('/community')}>{t('community')}</Link>
              <Link href="/farm-hub" onClick={() => setIsOpen(false)} className={dropClass('/farm-hub')}>{t('petMarket')}</Link>
              <Link href="/partner" onClick={() => setIsOpen(false)} className={dropClass('/partner')}>{t('partner')}</Link>
              <Link href="/pet-knowledge" onClick={() => setIsOpen(false)} className={dropClass('/pet-knowledge')}>{t('knowledgeFull')}</Link>
              <Link href="/pet-tools" onClick={() => setIsOpen(false)} className={dropClass('/pet-tools')}>{t('tools')}</Link>
              <Link href="/about" onClick={() => setIsOpen(false)} className={dropClass('/about')}>{t('about')}</Link>

              {/* Language switcher (mobile) */}
              <div className="border-t border-gray-100 mt-1 pt-1 px-4 pb-1">
                <div className="flex gap-2 py-2">
                  <button
                    onClick={() => switchLocale('th')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border ${locale === 'th' ? 'bg-pink-50 text-pink-500 border-pink-200' : 'text-gray-400 border-gray-100 hover:border-gray-200'}`}
                  >
                    🇹🇭 TH
                  </button>
                  <button
                    onClick={() => switchLocale('en')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border ${locale === 'en' ? 'bg-pink-50 text-pink-500 border-pink-200' : 'text-gray-400 border-gray-100 hover:border-gray-200'}`}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100">
                {session ? (
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition">{t('logout')}</button>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="w-full block px-4 py-2.5 text-sm font-bold text-pink-500 hover:bg-pink-50 transition">{t('login')}</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
