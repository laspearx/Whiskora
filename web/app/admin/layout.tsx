"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/app/components/PageLoader';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'ภาพรวม & งานที่ต้องจัดการ' },
  { href: '/admin/verifications', label: 'คำขอยืนยันตัวตน' },
  { href: '/admin/users', label: 'ผู้ใช้' },
  { href: '/admin/pets', label: 'สัตว์' },
  { href: '/admin/farms', label: 'ฟาร์ม' },
  { href: '/admin/shops', label: 'ร้านค้า' },
  { href: '/admin/services', label: 'บริการ' },
  { href: '/admin/audit-log', label: 'Audit Log' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking');
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) { setStatus('denied'); router.push('/login'); }
        return;
      }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') {
        if (active) { setStatus('denied'); router.push('/'); }
        return;
      }
      if (active) {
        setAdminEmail(session.user.email ?? null);
        setStatus('ok');
      }
    };
    check();
    return () => { active = false; };
  }, [router]);

  // Real route is always served under /th/admin/* or /en/admin/* (middleware redirects
  // un-prefixed URLs) — strip the locale prefix before matching NAV_ITEMS.
  const normalizedPath = (() => {
    const parts = (pathname || '').split('/').filter(Boolean);
    if (parts.length && (parts[0] === 'th' || parts[0] === 'en')) {
      return '/' + parts.slice(1).join('/');
    }
    return pathname || '';
  })();

  if (status !== 'ok') return <PageLoader />;

  return (
    <div className="min-h-screen -mx-4 md:-mx-6 flex flex-col md:flex-row" style={{ background: '#F9FAFB' }}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB', background: '#fff' }}>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border"
          style={{ borderColor: '#E5E7EB' }}
          aria-label="เปิดเมนู"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <div className="font-bold text-sm" style={{ color: '#111827' }}>Whiskora Admin</div>
        <div style={{ width: 36 }} />
      </div>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <nav className="relative w-64 max-w-[80vw] h-full bg-white p-4 overflow-y-auto">
            <div className="font-bold text-sm mb-4" style={{ color: '#111827' }}>Whiskora Admin</div>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium mb-1"
                style={normalizedPath === item.href
                  ? { background: 'var(--pink-soft, #FDE2EA)', color: 'var(--pink, #E84677)' }
                  : { color: '#4B5563' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:sticky md:top-0 md:h-screen border-r px-4 py-6"
        style={{ borderColor: '#E5E7EB', background: '#fff' }}
      >
        <div className="px-2 mb-6">
          <div className="font-extrabold text-base" style={{ color: '#111827' }}>Whiskora Admin</div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Operations & Analytics</div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={normalizedPath === item.href
                ? { background: '#FDE2EA', color: '#E84677' }
                : { color: '#4B5563' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 pt-4 border-t" style={{ borderColor: '#F3F4F6' }}>
          {adminEmail && <div className="text-xs truncate mb-2" style={{ color: '#9CA3AF' }} title={adminEmail}>{adminEmail}</div>}
          <Link href="/" className="text-xs font-semibold" style={{ color: '#6B7280' }}>← กลับสู่เว็บไซต์</Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
