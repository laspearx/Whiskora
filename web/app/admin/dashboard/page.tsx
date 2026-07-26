"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

interface ActionCenterData {
  verifications: {
    pending_count: number;
    needs_more_info_count: number;
    new_today: number;
    new_this_week: number;
    oldest_pending_days: number;
    avg_wait_hours: number;
    items: { id: number; farm_name: string; submitted_at: string; status: string; days_pending: number }[];
  };
  stale_reservations: {
    count: number;
    items: { id: number; pet_name: string; created_at: string; days_pending: number }[];
  };
  stale_transfers: {
    count: number;
    items: { id: number; pet_name: string; initiated_at: string; days_pending: number }[];
  };
}

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

function ActionCenterCard({
  title, count, accent, href, emptyLabel, meta, items,
}: {
  title: string;
  count: number;
  accent: string;
  href?: string;
  emptyLabel: string;
  meta?: string;
  items: { id: number; label: string; sub: string }[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: F.lineMid }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-bold" style={{ color: F.ink }}>{title}</div>
        <div className="text-2xl font-extrabold leading-none" style={{ color: count > 0 ? accent : F.muted }}>{count}</div>
      </div>
      {meta && <div className="text-xs mb-2" style={{ color: F.muted }}>{meta}</div>}
      {count === 0 ? (
        <div className="text-xs" style={{ color: F.muted }}>{emptyLabel} 🎉</div>
      ) : (
        <div className="space-y-1 mb-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span className="truncate" style={{ color: F.inkSoft }}>{item.label}</span>
              <span className="shrink-0 ml-2" style={{ color: F.muted }}>{item.sub}</span>
            </div>
          ))}
        </div>
      )}
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: accent }}>
          ตรวจสอบ <Icon.ChevronRight />
        </Link>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [totalFarms, setTotalFarms] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [actionCenter, setActionCenter] = useState<ActionCenterData | null>(null);
  const [actionCenterError, setActionCenterError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const [{ data: stats }, actionCenterRes] = await Promise.all([
        supabase.rpc('admin_get_stats'),
        supabase.rpc('admin_get_action_center'),
      ]);

      setTotalUsers(stats?.users || 0);
      setTotalPets(stats?.pets || 0);
      setTotalFarms(stats?.farms || 0);
      setTotalShops(stats?.shops || 0);
      setTotalServices(stats?.services || 0);

      if (actionCenterRes.error) {
        setActionCenterError(true);
      } else {
        setActionCenter(actionCenterRes.data as ActionCenterData);
      }
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

          <div className="ad-sec-label">งานที่ต้องจัดการ</div>
          {actionCenterError ? (
            <div className="rounded-2xl border p-4 text-sm mb-6" style={{ borderColor: F.lineMid, color: F.muted, background: 'white' }}>
              ไม่สามารถโหลดข้อมูลงานที่ต้องจัดการได้ในขณะนี้
            </div>
          ) : (
            <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <ActionCenterCard
                title="คำขอยืนยันตัวตนฟาร์ม"
                count={(actionCenter?.verifications.pending_count || 0) + (actionCenter?.verifications.needs_more_info_count || 0)}
                accent={F.pink}
                href="/admin/verifications"
                emptyLabel="ไม่มีคำขอค้างตรวจสอบ"
                meta={actionCenter ? `ใหม่วันนี้ ${actionCenter.verifications.new_today} · สัปดาห์นี้ ${actionCenter.verifications.new_this_week} · รอนานสุด ${actionCenter.verifications.oldest_pending_days} วัน` : undefined}
                items={(actionCenter?.verifications.items || []).slice(0, 3).map(i => ({ id: i.id, label: i.farm_name, sub: `รอ ${i.days_pending} วัน` }))}
              />
              <ActionCenterCard
                title="การจองค้างเกิน 3 วัน"
                count={actionCenter?.stale_reservations.count || 0}
                accent={F.amber}
                emptyLabel="ไม่มีการจองค้างนาน"
                items={(actionCenter?.stale_reservations.items || []).slice(0, 3).map(i => ({ id: i.id, label: i.pet_name, sub: `ค้าง ${i.days_pending} วัน` }))}
              />
              <ActionCenterCard
                title="การโอนกรรมสิทธิ์ค้างเกิน 7 วัน"
                count={actionCenter?.stale_transfers.count || 0}
                accent={F.purple}
                emptyLabel="ไม่มีการโอนค้างนาน"
                items={(actionCenter?.stale_transfers.items || []).slice(0, 3).map(i => ({ id: i.id, label: i.pet_name, sub: `ค้าง ${i.days_pending} วัน` }))}
              />
            </div>
          )}

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
