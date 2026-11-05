"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useLocale, useTranslations } from '@/i18n/context';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';
import PetQRSheet from '@/app/components/PetQRSheet';
import { useWorkspace } from '@/app/contexts/WorkspaceContext';
import type { Workspace } from '@/app/contexts/WorkspaceContext';

// ─── Nav config ───────────────────────────────────────────────────────────────
type Href = string;

// labels / subtitles are message keys of the `nav` namespace (messages/{th,en}.json)
// Keep legacy route metadata; this is a promotion filter, not an access gate.
const EXPLORE: { key: string; label: string; sub: string; href: Href; badge?: string }[] = [
  { key: 'farm', label: 'farmHub', sub: 'farmHubSub', href: '/farm-hub' },
  { key: 'marketplace', label: 'petShop', sub: 'petShopSub', href: '/marketplace' },
  { key: 'services', label: 'clinics', sub: 'clinicsSub', href: '/service-hub' },
  { key: 'community', label: 'communityFull', sub: 'communitySub', href: '/community', badge: 'soon' },
  { key: 'knowledge', label: 'knowledgeFull', sub: 'betaKnowledgeSub', href: '/pet-knowledge' },
  { key: 'tools', label: 'toolsLabel', sub: 'toolsSub', href: '/pet-tools' },
  { key: 'about', label: 'aboutFull', sub: 'aboutSub', href: '/about' },
];
const PUBLIC_RESOURCES = EXPLORE.filter(item => ['knowledge', 'tools', 'about'].includes(item.key));

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
  const [session,        setSession]        = useState<Session | null>(null);
  const [scrolled,       setScrolled]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [showQrSheet,    setShowQrSheet]    = useState(false);
  const [exploreOpen,    setExploreOpen]    = useState(false);
  const [userOpen,       setUserOpen]       = useState(false);
  const [workspaceOpen,  setWorkspaceOpen]  = useState(false);

  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();

  const locale   = useLocale();
  const t        = useTranslations('nav');
  const pathname = usePathname();
  const router   = useRouter();
  const navRef   = useRef<HTMLElement>(null);

  const active          = (h: Href) => pathname === h;
  const exploreActive   = PUBLIC_RESOURCES.some(i => pathname === i.href);

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
        setWorkspaceOpen(false);
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
    setWorkspaceOpen(false);
  }, [pathname]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const go = (href: Href) => {
    router.push(href as any);
    setMobileOpen(false);
    setUserOpen(false);
  };

  const guarded = (href: Href) => go(session ? href : '/login');

  const switchWs = (ws: Workspace) => {
    switchWorkspace(ws.id);
    setWorkspaceOpen(false);
    setMobileOpen(false);
    if (ws.type === 'personal') go('/profile');
    else if (ws.entity_id) go(`/${ws.type}-dashboard/${ws.entity_id}` as Href);
  };

  const wsIconSrc = (type: Workspace['type']) => {
    const map: Record<string, string> = {
      personal: '/icons/icon-tab-profile.png',
      farm: '/icons/icon-farm.png',
      shop: '/icons/icon-shop.png',
      service: '/icons/icon-service.png',
    };
    return map[type] ?? map.personal;
  };

  const wsLabel = (type: Workspace['type']) => {
    const map: Record<string, string> = { personal: 'wsPersonal', farm: 'wsFarm', shop: 'wsShop', service: 'wsService' };
    return map[type] ? t(map[type]) : type;
  };

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
    `text-sm font-medium whitespace-nowrap px-2 py-1.5 rounded-xl transition-colors ${
      isActive
        ? 'text-pink-700 bg-pink-50'
        : 'text-gray-600 hover:text-pink-700 hover:bg-gray-50'
    }`;

  const langBtn = (on: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
      on ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    }`;

  const dropItem = (isActive: boolean) =>
    `block w-full text-left px-4 py-2.5 text-sm transition-colors ${
      isActive ? 'text-pink-700 bg-pink-50 font-semibold' : 'text-gray-600 hover:text-pink-700 hover:bg-gray-50'
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
        <div className="flex flex-wrap items-center min-h-[64px] gap-2">

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
            <Link href="/" className={navLink(active('/'))}>{t('home')}</Link>

            {/* Pet ID */}
            <Link href="/pet-id-card" className={navLink(active('/pet-id-card'))}>{t('petId')}</Link>

            {/* Buyer discovery */}
            <Link href="/farm-hub" className={navLink(active('/farm-hub'))}>{t('betaBrowse')}</Link>

            {/* Farm entry; legacy businesses remain available inside Partner. */}
            <Link href="/partner" className={navLink(active('/partner'))}>{t('betaFarms')}</Link>
            {/* สำรวจ dropdown */}
            <div className="relative">
              <button
                onClick={() => { setExploreOpen(o => !o); setUserOpen(false); }}
                className={`${navLink(exploreActive)} flex items-center gap-1`}
                aria-expanded={exploreOpen}
              >
                {t('explore')}
                <ChevronDown open={exploreOpen} />
              </button>

              {exploreOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1.5">
                    {PUBLIC_RESOURCES.map(item => (
                      <Link
                        key={item.key}
                        href={item.href as any}
                        onClick={() => setExploreOpen(false)}
                        className={`block px-4 py-2.5 transition-colors group ${
                          active(item.href) ? 'bg-pink-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-sm font-semibold leading-tight ${active(item.href) ? 'text-pink-700' : 'text-gray-700 group-hover:text-pink-700'}`}>
                          {t(item.label)}
                          {item.badge && <span className="ml-1.5 align-middle text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-pink-50 text-pink-700">{t(item.badge)}</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-tight">{t(item.sub)}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Desktop right side ────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2.5 ml-auto">

            {/* Workspace switcher (desktop) */}
            {session && workspaces.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setWorkspaceOpen(o => !o); setExploreOpen(false); setUserOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors"
                  title={t('switchWorkspace')}
                  aria-label={t('switchWorkspace')}
                >
                  <img src={wsIconSrc(activeWorkspace?.type ?? 'personal')} alt="" width={36} height={36} style={{ objectFit: 'contain' }} />
                  <span className="max-w-[110px] truncate">{activeWorkspace?.name ?? '—'}</span>
                  <ChevronDown open={workspaceOpen} />
                </button>

                {workspaceOpen && (
                  <div className="absolute top-full right-0 mt-1 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1.5">
                      <div className="px-4 pt-1 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('workspaces')}</div>
                      {workspaces.map((ws) => (
                        <button key={ws.id} onClick={() => switchWs(ws)}
                          className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors ${ws.id === activeWorkspace?.id ? 'bg-pink-50 text-pink-700' : 'text-gray-600 hover:bg-gray-50 hover:text-pink-700'}`}
                        >
                          <img src={wsIconSrc(ws.type)} alt="" width={44} height={44} style={{ objectFit: 'contain', flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate leading-tight">{ws.name}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{wsLabel(ws.type)}</div>
                          </div>
                          {ws.id === activeWorkspace?.id && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={() => { setWorkspaceOpen(false); go('/partner'); }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-pink-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                          {t('addWorkspace')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language switcher */}
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
              <LangButtons locale={locale} onSwitch={switchLocale} className={langBtn} t={t} />
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
                  {t('profileShort')}
                  <ChevronDown open={userOpen} />
                </button>

                {userOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1.5">
                      <button onClick={() => go('/profile')} className={dropItem(active('/profile'))}>
                        {t('profile')}
                      </button>
                      <button onClick={() => go('/profile/pets')} className={dropItem(active('/profile/pets'))}>{t('tabPets')}</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors shadow-sm shadow-pink-200"
              >
                {t('login')}
              </Link>
            )}
          </div>

          {/* ── Mobile: workspace switcher + hamburger ───────────────── */}
          <div className="md:hidden flex items-center gap-2 ml-auto">

            {/* Workspace switcher button (mobile) */}
            {session && workspaces.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setWorkspaceOpen(o => !o); setMobileOpen(false); }}
                  aria-label={t('switchWorkspace')}
                  className="w-11 h-11 grid place-items-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <img src={wsIconSrc(activeWorkspace?.type ?? 'personal')} alt="" width={44} height={44} style={{ objectFit: 'contain' }} />
                </button>

                {workspaceOpen && (
                  <div className="absolute top-full right-0 mt-1 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1.5">
                      <div className="px-4 pt-1 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('workspaces')}</div>
                      {workspaces.map((ws) => (
                        <button key={ws.id} onClick={() => switchWs(ws)}
                          className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors ${ws.id === activeWorkspace?.id ? 'bg-pink-50 text-pink-700' : 'text-gray-600 hover:bg-gray-50 hover:text-pink-700'}`}
                        >
                          <img src={wsIconSrc(ws.type)} alt="" width={44} height={44} style={{ objectFit: 'contain', flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate leading-tight">{ws.name}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{wsLabel(ws.type)}</div>
                          </div>
                          {ws.id === activeWorkspace?.id && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={() => { setWorkspaceOpen(false); go('/partner'); }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-pink-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                          {t('addWorkspace')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
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
            <button onClick={() => go('/')} className={dropItem(active('/'))}>{t('home')}</button>
            <button onClick={() => go('/pet-id-card')} className={dropItem(active('/pet-id-card'))}>{t('petIdCard')}</button>
            <button onClick={() => go('/farm-hub')} className={dropItem(active('/farm-hub'))}>{t('betaBrowse')}</button>
            <button onClick={() => go('/partner')} className={dropItem(active('/partner'))}>{t('betaFarms')}</button>

            {/* Explore group */}
            <div className="border-t border-gray-100 mt-1.5 pt-1.5">
              <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('explore')}</div>
              {PUBLIC_RESOURCES.map(item => (
                <button
                  key={item.key}
                  onClick={() => go(item.href)}
                  className={dropItem(active(item.href))}
                >
                  {t(item.label)}
                  {item.badge && <span className="ml-1.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-pink-50 text-pink-700">{t(item.badge)}</span>}
                </button>
              ))}
            </div>

            {/* Language + Auth */}
            <div className="border-t border-gray-100 mt-1.5 pt-2 pb-1 px-1 flex items-center justify-between">
              <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
                <LangButtons locale={locale} onSwitch={switchLocale} className={langBtn} t={t} />
              </div>
              {!session && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-colors"
                >
                  {t('login')}
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

    </nav>

    {/* Workspace layouts provide their own bottom navigation. */}
    {!['/farm-dashboard', '/shop-dashboard', '/service-dashboard'].some(base => pathname.startsWith(base + '/')) && <nav
      aria-label={t('mainMenu')}
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
      <div className="flex items-stretch h-[68px]">

        {/* หน้าแรก */}
        <TabBtn
          label={t('home')}
          active={pathname === '/'}
          onClick={() => go('/')}
          icon={<img src="/icons/icon-tab-home.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        {/* สัตว์เลี้ยง */}
        <TabBtn
          label={t('tabPets')}
          active={(pathname.startsWith('/pets') && !pathname.includes('/create')) || pathname === '/profile/pets'}
          onClick={() => guarded('/profile/pets')}
          icon={<img src="/icons/icon-tab-pets.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        {/* QR สัตว์เลี้ยง — elevated center button */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
          <button
            onClick={() => setShowQrSheet(true)}
            aria-label={t('tabQr')}
            style={{
              position: 'absolute',
              top: -22,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fde2ea',
              boxShadow: '0 2px 10px rgba(232,70,119,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
            }}
          >
            <img src="/icons/icon-scan-qr-code.png" alt="QR" width={64} height={64} style={{ objectFit: 'contain' }} />
          </button>
          <span style={{ marginTop: 40, fontSize: 10, fontWeight: 600, color: '#c4325f', lineHeight: 1 }}>QR</span>
        </div>

        {/* ชั่งน้ำหนัก */}
        <TabBtn
          label={t('tabWeigh')}
          active={pathname.startsWith('/weigh-in')}
          onClick={() => guarded('/weigh-in')}
          icon={<img src="/icons/icon-weight.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        {/* โปรไฟล์ */}
        <TabBtn
          label={t('profileShort')}
          active={pathname === '/profile'}
          onClick={() => guarded('/profile')}
          icon={<img src="/icons/icon-tab-profile.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

      </div>
    </nav>}

    {showQrSheet && <PetQRSheet onClose={() => setShowQrSheet(false)} />}
  </>
  );
}

// TH / EN switch: the visible label stays "TH" / "EN"; screen readers get the language name, the pressed state and
// the right pronunciation (lang attribute)
function LangButtons({ locale, onSwitch, className, t }: {
  locale: string; onSwitch: (l: 'th' | 'en') => void; className: (on: boolean) => string; t: (k: string) => string;
}) {
  return (
    <span role="group" aria-label={t('language')} className="contents">
      <button type="button" lang="th" onClick={() => onSwitch('th')} className={className(locale === 'th')} aria-pressed={locale === 'th'}>TH<span className="sr-only"> — {t('langTh')}</span></button>
      <button type="button" lang="en" onClick={() => onSwitch('en')} className={className(locale === 'en')} aria-pressed={locale === 'en'}>EN<span className="sr-only"> — {t('langEn')}</span></button>
    </span>
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
      className="flex-1 flex flex-col items-center justify-center gap-0.5"
      style={{ color: active ? '#c4325f' : '#6f6066' }}   // --pink-deep / darker muted: ≥ 4.5:1 for 10px labels
    >
      <span style={{
        width: 72,
        height: 48,
        borderRadius: 14,
        background: active ? 'rgba(232,70,119,0.09)' : 'transparent',
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
