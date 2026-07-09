"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useLocale } from '@/i18n/context';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';

// ─── Nav config ───────────────────────────────────────────────────────────────
type Href = string;

const PRIMARY: { key: string; label: string; href: Href }[] = [
  { key: 'home',      label: 'หน้าแรก',   href: '/' },
  { key: 'petid',     label: 'Pet ID',     href: '/pet-id-card' },
  { key: 'knowledge', label: 'ความรู้',    href: '/pet-knowledge' },
  { key: 'partner',   label: 'พาร์ทเนอร์', href: '/partner' },
];

const EXPLORE: { key: string; label: string; sub: string; href: Href }[] = [
  { key: 'farm',        label: 'ฟาร์มสัตว์เลี้ยง',   sub: 'ค้นหาฟาร์มที่ตรวจสอบแล้ว',      href: '/farm-hub' },
  { key: 'marketplace', label: 'ตลาดสัตว์เลี้ยง',    sub: 'ซื้อขายจากผู้ขายที่ยืนยัน',      href: '/marketplace' },
  { key: 'services',    label: 'คลินิกและบริการ',     sub: 'จองคลินิก กรูมมิ่ง ฝากเลี้ยง',   href: '/service-hub' },
  { key: 'community',   label: 'ชุมชนคนรักสัตว์',    sub: 'แชร์ประสบการณ์ ขอคำแนะนำ',       href: '/community' },
  { key: 'tools',       label: 'เครื่องมือ',          sub: 'คำนวณอายุ แคลอรี วันคลอด',        href: '/pet-tools' },
  { key: 'about',       label: 'เกี่ยวกับ Whiskora',  sub: 'พันธกิจ ทีมงาน และวิสัยทัศน์',    href: '/about' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [session,     setSession]     = useState<Session | null>(null);
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);

  const locale   = useLocale();
  const pathname = usePathname();
  const router   = useRouter();
  const navRef   = useRef<HTMLElement>(null);

  const active          = (h: Href) => pathname === h;
  const exploreActive   = EXPLORE.some(i => pathname === i.href);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // ── Scroll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setExploreOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Close mobile on route change ──────────────────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
    setExploreOpen(false);
    setUserOpen(false);
  }, [pathname]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const go = (href: Href) => {
    router.push(href as any);
    setMobileOpen(false);
    setUserOpen(false);
  };

  const guarded = (href: Href) => go(session ? href : '/login');

  const switchLocale = (next: 'th' | 'en') => {
    router.replace(pathname, { locale: next });
    setMobileOpen(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserOpen(false);
    router.push('/login');
  };

  // ── Shared class helpers ──────────────────────────────────────────────────
  const navLink = (isActive: boolean) =>
    `text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-xl transition-colors ${
      isActive
        ? 'text-pink-500 bg-pink-50'
        : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'
    }`;

  const langBtn = (on: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
      on ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
    }`;

  const dropItem = (isActive: boolean) =>
    `block w-full text-left px-4 py-2.5 text-sm transition-colors ${
      isActive ? 'text-pink-500 bg-pink-50 font-semibold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'
    }`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    <nav
      ref={navRef}
      className={`bg-white sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? 'shadow-sm border-b border-gray-100' : 'border-b border-gray-50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[64px] gap-2">

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Link href="/" className="shrink-0 mr-2 transition-transform hover:scale-[1.03]" style={{ overflow: 'visible' }}>
            <Image
              src="/logo.png"
              alt="Whiskora"
              width={300}
              height={96}
              className="w-auto object-contain"
              style={{ height: '96px', marginTop: '-16px', marginBottom: '-16px', display: 'block' }}
              priority
            />
          </Link>

          {/* ── Desktop primary nav ───────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-0.5">

            {/* หน้าแรก */}
            <Link href="/" className={navLink(active('/'))}>หน้าแรก</Link>

            {/* สำรวจ dropdown */}
            <div className="relative">
              <button
                onClick={() => { setExploreOpen(o => !o); setUserOpen(false); }}
                className={`${navLink(exploreActive)} flex items-center gap-1`}
              >
                สำรวจ
                <ChevronDown open={exploreOpen} />
              </button>

              {exploreOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1.5">
                    {EXPLORE.map(item => (
                      <Link
                        key={item.key}
                        href={item.href as any}
                        onClick={() => setExploreOpen(false)}
                        className={`block px-4 py-2.5 transition-colors group ${
                          active(item.href) ? 'bg-pink-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-sm font-semibold leading-tight ${active(item.href) ? 'text-pink-500' : 'text-gray-700 group-hover:text-pink-500'}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 leading-tight">{item.sub}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pet ID */}
            <Link href="/pet-id-card" className={navLink(active('/pet-id-card'))}>Pet ID</Link>

            {/* ความรู้ */}
            <Link href="/pet-knowledge" className={navLink(active('/pet-knowledge'))}>ความรู้</Link>

            {/* พาร์ทเนอร์ */}
            <Link href="/partner" className={navLink(active('/partner'))}>พาร์ทเนอร์</Link>
          </div>

          {/* ── Desktop right side ────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2.5 ml-auto">

            {/* Language switcher */}
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
              <button onClick={() => switchLocale('th')} className={langBtn(locale === 'th')}>TH</button>
              <button onClick={() => switchLocale('en')} className={langBtn(locale === 'en')}>EN</button>
            </div>

            {/* Auth */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => { setUserOpen(o => !o); setExploreOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-pink-100 bg-pink-50 text-pink-600 text-sm font-semibold hover:bg-pink-100 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  โปรไฟล์
                  <ChevronDown open={userOpen} />
                </button>

                {userOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1.5">
                      <button onClick={() => go('/profile')} className={dropItem(active('/profile'))}>
                        โปรไฟล์ของฉัน
                      </button>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors shadow-sm shadow-pink-200"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>

          {/* ── Mobile: hamburger only ───────────────────────────────── */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={mobileOpen}
              className="w-11 h-11 grid place-items-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                {mobileOpen
                  ? <path d="M6 18 18 6M6 6l12 12" />
                  : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile dropdown menu ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">

            {/* Main links */}
            <button onClick={() => go('/')} className={dropItem(active('/'))}>หน้าแรก</button>
            <button onClick={() => go('/pet-id-card')} className={dropItem(active('/pet-id-card'))}>Pet ID Card</button>
            <button onClick={() => go('/pet-knowledge')} className={dropItem(active('/pet-knowledge'))}>ความรู้สัตว์เลี้ยง</button>
            <button onClick={() => go('/partner')} className={dropItem(active('/partner'))}>พาร์ทเนอร์</button>

            {/* Explore group */}
            <div className="border-t border-gray-100 mt-1.5 pt-1.5">
              <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">สำรวจ</div>
              {EXPLORE.map(item => (
                <button
                  key={item.key}
                  onClick={() => go(item.href)}
                  className={dropItem(active(item.href))}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Language + Auth */}
            <div className="border-t border-gray-100 mt-1.5 pt-2 pb-1 px-1 flex items-center justify-between">
              <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
                <button onClick={() => switchLocale('th')} className={langBtn(locale === 'th')}>TH</button>
                <button onClick={() => switchLocale('en')} className={langBtn(locale === 'en')}>EN</button>
              </div>
              {session ? (
                <button onClick={logout} className="text-sm font-bold text-red-500 hover:text-red-600 px-3 py-1.5">
                  ออกจากระบบ
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

    </nav>

    {/* ── Floating Bottom Tab Bar (mobile only) ─────────────────── */}
    <nav
      aria-label="เมนูหลัก"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(232,70,119,0.10)',
        boxShadow: '0 -4px 24px rgba(31,26,28,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch h-16">

        {/* หน้าแรก */}
        <TabBtn
          label="หน้าแรก"
          active={pathname === '/'}
          onClick={() => go('/')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden>
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
              <path d="M9 21v-7h6v7" />
            </svg>
          }
        />

        {/* สัตว์เลี้ยง */}
        <TabBtn
          label="สัตว์เลี้ยง"
          active={pathname.startsWith('/pets')}
          onClick={() => guarded('/pets')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden>
              <circle cx="7.5" cy="9" r="2" />
              <circle cx="12" cy="6.8" r="2" />
              <circle cx="16.5" cy="9" r="2" />
              <path d="M6.5 16.4c0-2.5 2.4-4.6 5.5-4.6s5.5 2.1 5.5 4.6c0 1.6-1 2.8-2.6 2.8-1.1 0-1.7-.5-2.9-.5s-1.8.5-2.9.5c-1.6 0-2.6-1.2-2.6-2.8Z" />
            </svg>
          }
        />

        {/* + สร้าง (center raised) */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => guarded('/pets/create')}
            aria-label="เพิ่มสัตว์เลี้ยง"
            style={{
              width: 52,
              height: 52,
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #e84677 0%, #f06d98 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(232,70,119,0.38)',
              marginTop: -14,
              border: '3px solid white',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="22" height="22" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* สำรวจ */}
        <TabBtn
          label="สำรวจ"
          active={exploreActive}
          onClick={() => go('/farm-hub')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
            </svg>
          }
        />

        {/* โปรไฟล์ */}
        <TabBtn
          label="โปรไฟล์"
          active={pathname === '/profile'}
          onClick={() => guarded('/profile')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
        />

      </div>
    </nav>
  </>
  );
}

function TabBtn({
  label, active, onClick, icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
      style={{ color: active ? '#e84677' : '#9ca3af' }}
    >
      <span style={{
        width: 36,
        height: 28,
        borderRadius: 10,
        background: active ? 'rgba(232,70,119,0.10)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .15s',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1.2 }}>
        {label}
      </span>
    </button>
  );
}
