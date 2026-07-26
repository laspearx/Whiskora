"use client";

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';
import KpiCard from '@/app/components/admin/KpiCard';
import DateRangePicker from '@/app/components/admin/DateRangePicker';
import { resolveDateRange, DateRangePreset } from '@/lib/adminDateRange';

interface MetricPair { current: number; previous: number; }

interface PlatformOverviewData {
  total_users: MetricPair;
  new_users: MetricPair;
  users_with_pet: MetricPair;
  total_pets: MetricPair;
  public_pets: MetricPair;
  total_farms: MetricPair;
  active_farms: MetricPair;
  verified_farms: MetricPair;
  total_shops: MetricPair;
  total_services: MetricPair;
  reservations: MetricPair;
  confirmed_reservations: MetricPair;
  accepted_transfers: MetricPair;
  contact_actions: MetricPair;
  onboarding_completion: {
    owner_total: number; owner_completed: number;
    farm_total: number; farm_completed: number;
  };
}

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

function AdminDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<PlatformOverviewData | null>(null);
  const [overviewError, setOverviewError] = useState(false);
  const [actionCenter, setActionCenter] = useState<ActionCenterData | null>(null);
  const [actionCenterError, setActionCenterError] = useState(false);

  const preset = (searchParams.get('range') as DateRangePreset) || 'last7';
  const customFrom = searchParams.get('from') || undefined;
  const customTo = searchParams.get('to') || undefined;
  const resolvedRange = resolveDateRange(preset, customFrom, customTo);

  const fetchOverview = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_get_platform_overview', {
      p_start: resolvedRange.start.toISOString(),
      p_end: resolvedRange.end.toISOString(),
      p_compare_start: resolvedRange.compareStart.toISOString(),
      p_compare_end: resolvedRange.compareEnd.toISOString(),
    });
    if (error) {
      setOverviewError(true);
    } else {
      setOverviewError(false);
      setOverview(data as PlatformOverviewData);
    }
  }, [resolvedRange.start, resolvedRange.end, resolvedRange.compareStart, resolvedRange.compareEnd]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const [, actionCenterRes] = await Promise.all([
        fetchOverview(),
        supabase.rpc('admin_get_action_center'),
      ]);

      if (actionCenterRes.error) {
        setActionCenterError(true);
      } else {
        setActionCenter(actionCenterRes.data as ActionCenterData);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Re-fetch just the Platform Overview KPIs whenever the date range changes (post-initial-load).
  useEffect(() => {
    if (!loading) fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  if (loading) return <PageLoader />;

  const ob = overview?.onboarding_completion;
  const ownerRate = ob && ob.owner_total > 0 ? Math.round((ob.owner_completed / ob.owner_total) * 100) : null;
  const farmRate = ob && ob.farm_total > 0 ? Math.round((ob.farm_completed / ob.farm_total) * 100) : null;

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

        .ad-hint { text-align: center; font-size: 12px; color: ${F.muted}; margin-top: 12px; }
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

          <div className="ad-sec-label">ภาพรวมแพลตฟอร์ม</div>
          <DateRangePicker preset={preset} customFrom={customFrom} customTo={customTo} />

          {overviewError ? (
            <div className="rounded-2xl border p-4 text-sm mb-6" style={{ borderColor: F.lineMid, color: F.muted, background: 'white' }}>
              ไม่สามารถโหลดข้อมูลภาพรวมได้ในขณะนี้
            </div>
          ) : (
            <div className="grid gap-3 mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              <KpiCard title="ผู้ใช้ทั้งหมด" value={overview?.total_users.current || 0} previous={overview?.total_users.previous} showComparison={resolvedRange.hasComparison} href="/admin/users" tooltip="จำนวนบัญชีผู้ใช้ (profiles) ทั้งหมด ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="ผู้ใช้ใหม่" value={overview?.new_users.current || 0} previous={overview?.new_users.previous} showComparison={resolvedRange.hasComparison} href="/admin/users" tooltip="ผู้ใช้ที่สมัครสมาชิกภายในช่วงเวลาที่เลือก นับจาก created_at" />
              <KpiCard title="ผู้ใช้ที่ยัง Active" value={0} unavailable unavailableNote="ต้องมี event tracking การ login/activity ก่อน (ดูสถานะ Point 3)" tooltip="วัดไม่ได้ในตอนนี้ — ระบบยังไม่มี last_active_at หรือ event login ต้องไม่เดาจาก updated_at" />
              <KpiCard title="ผู้ใช้ที่มีสัตว์ ≥1 ตัว" value={overview?.users_with_pet.current || 0} previous={overview?.users_with_pet.previous} showComparison={resolvedRange.hasComparison} href="/admin/users" tooltip="จำนวนผู้ใช้ที่เป็นเจ้าของสัตว์อย่างน้อยหนึ่งตัว ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="สัตว์เลี้ยงทั้งหมด" value={overview?.total_pets.current || 0} previous={overview?.total_pets.previous} showComparison={resolvedRange.hasComparison} href="/admin/pets" tooltip="จำนวนสัตว์เลี้ยงทั้งหมดในระบบ ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="สัตว์เลี้ยงที่เปิดสาธารณะ" value={overview?.public_pets.current || 0} previous={overview?.public_pets.previous} showComparison={resolvedRange.hasComparison} href="/admin/pets" tooltip="นับเฉพาะสัตว์ที่ is_public = true และยังไม่ถูกลบ" />
              <KpiCard title="ฟาร์มทั้งหมด" value={overview?.total_farms.current || 0} previous={overview?.total_farms.previous} showComparison={resolvedRange.hasComparison} href="/admin/farms" tooltip="จำนวนฟาร์มทั้งหมด ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="ฟาร์มที่มีกิจกรรม" value={overview?.active_farms.current || 0} previous={overview?.active_farms.previous} showComparison={resolvedRange.hasComparison} href="/admin/farms" tooltip="ฟาร์มที่มีการเพิ่มสัตว์ตัวใหม่อย่างน้อย 1 ตัวภายในช่วงเวลาที่เลือก — นิยามชั่วคราวเพราะยังไม่มี activity log ระดับฟาร์ม" />
              <KpiCard title="ฟาร์มที่ยืนยันตัวตนแล้ว" value={overview?.verified_farms.current || 0} previous={overview?.verified_farms.previous} showComparison={resolvedRange.hasComparison} href="/admin/farms" tooltip="ฟาร์มที่ is_verified = true ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="ร้านค้าทั้งหมด" value={overview?.total_shops.current || 0} previous={overview?.total_shops.previous} showComparison={resolvedRange.hasComparison} href="/admin/shops" tooltip="จำนวนร้านค้าทั้งหมด ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="ธุรกิจบริการทั้งหมด" value={overview?.total_services.current || 0} previous={overview?.total_services.previous} showComparison={resolvedRange.hasComparison} href="/admin/services" tooltip="จำนวนธุรกิจบริการทั้งหมด ณ สิ้นช่วงเวลาที่เลือก" />
              <KpiCard title="คำขอจอง" value={overview?.reservations.current || 0} previous={overview?.reservations.previous} showComparison={resolvedRange.hasComparison} tooltip="จำนวน pet_reservations ที่สร้างภายในช่วงเวลาที่เลือก (ทุกสถานะ)" />
              <KpiCard title="การจองที่ยืนยันแล้ว" value={overview?.confirmed_reservations.current || 0} previous={overview?.confirmed_reservations.previous} showComparison={resolvedRange.hasComparison} tooltip="การจองที่ status = confirmed และ confirmed_at อยู่ในช่วงเวลาที่เลือก" />
              <KpiCard title="การโอนกรรมสิทธิ์สำเร็จ" value={overview?.accepted_transfers.current || 0} previous={overview?.accepted_transfers.previous} showComparison={resolvedRange.hasComparison} tooltip="pet_ownership_transfers ที่ status = accepted และ accepted_at อยู่ในช่วงเวลาที่เลือก (schema ปัจจุบันไม่มีสถานะ 'completed' แยกต่างหาก)" />
              <KpiCard title="เปิดดูโปรไฟล์สาธารณะ" value={0} unavailable unavailableNote="ยังไม่เริ่มเก็บข้อมูล (ต้องเพิ่ม page-view event)" tooltip="วัดไม่ได้ในตอนนี้ — ยังไม่มีระบบ track การเปิดดู public profile" />
              <KpiCard title="การติดต่อผู้ขาย" value={overview?.contact_actions.current || 0} previous={overview?.contact_actions.previous} showComparison={resolvedRange.hasComparison} tooltip="จำนวนแถวใน contact_leads ที่สร้างภายในช่วงเวลาที่เลือก (รวมทุกช่องทาง)" />
              <KpiCard title="แชร์โปรไฟล์" value={0} unavailable unavailableNote="ยังไม่เริ่มเก็บข้อมูล (ต้องเพิ่ม share event)" tooltip="วัดไม่ได้ในตอนนี้ — ยังไม่มีระบบ track การแชร์โปรไฟล์" />
              <KpiCard
                title="Onboarding สำเร็จ (เจ้าของสัตว์)"
                value={ownerRate ?? 0}
                showComparison={false}
                suffix="%"
                unavailable={ownerRate === null}
                unavailableNote="ไม่มีผู้เริ่ม onboarding ในช่วงเวลานี้"
                tooltip={`ผู้ใช้ที่เริ่ม owner onboarding ในช่วงนี้ (${ob?.owner_total || 0} คน) แล้วมี completed_at กี่เปอร์เซ็นต์`}
              />
              <KpiCard
                title="Onboarding สำเร็จ (ฟาร์ม)"
                value={farmRate ?? 0}
                showComparison={false}
                suffix="%"
                unavailable={farmRate === null}
                unavailableNote="ไม่มีฟาร์มเริ่ม onboarding ในช่วงเวลานี้"
                tooltip={`ฟาร์มที่เริ่ม farm onboarding ในช่วงนี้ (${ob?.farm_total || 0} ฟาร์ม) แล้วมี completed_at กี่เปอร์เซ็นต์`}
              />
            </div>
          )}

          <div className="ad-hint">ตัวเลข &quot;ผู้ใช้ที่ยัง Active&quot;, &quot;เปิดดูโปรไฟล์สาธารณะ&quot; และ &quot;แชร์โปรไฟล์&quot; ยังวัดไม่ได้จริง — ดูรายละเอียดที่ Data Quality</div>

        </div>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDashboardInner />
    </Suspense>
  );
}
