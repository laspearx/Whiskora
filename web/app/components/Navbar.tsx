"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from '@/i18n/context';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleProtectedAction = (path: string) => {
    if (!session) {
      router.push('/login');
    } else {
      router.push(path as any);
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push('/login');
  };

  const switchLocale = (next: 'th' | 'en') => {
    router.replace(pathname, { locale: next });
    setIsOpen(false);
  };

  const linkClass = (path: string) =>
    `hover:text-pink-500 transition ${isActive(path) ? 'text-pink-500 font-bold underline underline-offset-8 decoration-2' : ''}`;

  const dropClass = (path: string) =>
    `px-4 py-2.5 text-sm font-medium transition ${isActive(path) ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`;

  return (
    <nav ref={navRef} className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">

          <Link href="/" className="flex items-center shrink-0 transition-transform hover:scale-105 py-2">
            <Image src="/logo.png" alt="Whiskora Logo" width={160} height={48} className="h-22 md:h-30 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-5 items-center font-medium text-gray-600 text-sm">
            <Link href="/" className={linkClass('/')}>{t('home')}</Link>
            <button onClick={() => handleProtectedAction('/profile')} className={`hover:text-pink-500 transition ${isActive('/profile') ? 'text-pink-500 font-bold' : ''}`}>{t('profile')}</button>
            <Link href="/marketplace" className={linkClass('/marketplace')}>{t('petShop')}</Link>
            <Link href="/service-hub" className={linkClass('/service-hub')}>{t('services')}</Link>
            <Link href="/community" className={linkClass('/community')}>{t('community')}</Link>
            <Link href="/farm-hub" className={linkClass('/farm-hub')}>{t('petMarket')}</Link>
            <Link href="/partner" className={linkClass('/partner')}>{t('partner')}</Link>
            <Link href="/pet-knowledge" className={linkClass('/pet-knowledge')}>{t('knowledge')}</Link>
            <Link href="/pet-tools" className={linkClass('/pet-tools')}>{t('tools')}</Link>
            <Link href="/about" className={linkClass('/about')}>{t('about')}</Link>

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
