"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  purple: '#7C3AED', purpleSoft: '#F3E8FF',
  amber: '#D97706', amberSoft: '#FFFBEB',
  red: '#DC2626', redSoft: '#FEF2F2',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [totalFarms, setTotalFarms] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [totalServices, setTotalServices] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const { data: stats } = await supabase.rpc('admin_get_stats');

      setTotalUsers(stats?.users || 0);
      setTotalPets(stats?.pets || 0);
      setTotalFarms(stats?.farms || 0);
      setTotalShops(stats?.shops || 0);
      setTotalServices(stats?.services || 0);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <PageLoader />;

  const stats = [
    { href: '/admin/users',    icon: '/icons/icon-nav-profile.png', num: totalUsers,    label: 'ผู้ใช้งาน\nทั้งหมด',   color: F.blue },
    { href: '/admin/pets',     icon: '/icons/icon-my-pets.png',      num: totalPets,     label: 'สัตว์เลี้ยง\nในระบบ',   color: F.pink },
    { href: '/admin/farms',    icon: '/icons/icon-farm.png',         num: totalFarms,    label: 'ฟาร์ม',                  color: F.green },
    { href: '/admin/shops',    icon: '/icons/icon-shop.png',         num: totalShops,    label: 'ร้านค้า',                color: F.amber },
    { href: '/admin/services', icon: '/icons/icon-service.png',      num: totalServices, label: 'บริการ',               color: F.purple },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ad-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .ad-body { max-width: 860px; margin: 0 auto; padding: 24px 16px 80px; }

        .ad-top { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ad-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .ad-back:hover { background: ${F.line}; color: ${F.ink}; transform: translateX(-1px); }
        .ad-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .ad-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        .ad-sec-label { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 12px; }

        /* Stats grid */
        .ad-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
        @media (min-width: 520px) { .ad-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 720px) { .ad-stats { grid-template-columns: repeat(5, 1fr); } }
        .ad-stat { background: white; border: 1px solid ${F.lineMid}; border-radius: 16px; padding: 16px 14px 14px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: inherit; position: relative; transition: border-color .15s, transform .15s, box-shadow .15s; cursor: pointer; }
        .ad-stat:hover { border-color: ${F.pinkBorder}; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.06); }
        .ad-stat-icon { display: flex; align-items: center; justify-content: center; }
        .ad-stat-icon img { width: 44px; height: 44px; object-fit: contain; }
        .ad-stat-num { font-size: 28px; font-weight: 800; line-height: 1; }
        .ad-stat-label { font-size: 11px; font-weight: 600; color: ${F.muted}; text-align: center; line-height: 1.3; }
        .ad-stat-arrow { position: absolute; top: 12px; right: 12px; color: ${F.muted}; opacity: .5; }

        .ad-hint { text-align: center; font-size: 12px; color: ${F.muted}; margin-top: -8px; }
      `}</style>

      <div className="ad-page">
        <div className="ad-body">

          {/* Header */}
          <div className="ad-top">
            <button className="ad-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
            <div>
              <div className="ad-title">แดชบอร์ดหลังบ้าน</div>
              <div className="ad-sub">ข้อมูลผู้ใช้งานและพาร์ทเนอร์ทั้งหมด</div>
            </div>
          </div>

          <div className="ad-sec-label">สรุปยอด</div>

          {/* Stats — คลิกเพื่อดูรายละเอียดแต่ละหมวด */}
          <div className="ad-stats">
            {stats.map((s, i) => (
              <Link key={i} href={s.href} className="ad-stat">
                <span className="ad-stat-arrow"><Icon.ChevronRight /></span>
                <div className="ad-stat-icon"><img src={s.icon} alt="" /></div>
                <div className="ad-stat-num" style={{ color: s.color }}>{s.num.toLocaleString()}</div>
                <div className="ad-stat-label" style={{ whiteSpace: 'pre-line' }}>{s.label}</div>
              </Link>
            ))}
          </div>

          <div className="ad-hint">แตะที่การ์ดเพื่อดูรายละเอียดแต่ละหมวด</div>

        </div>
      </div>
    </>
  );
}
