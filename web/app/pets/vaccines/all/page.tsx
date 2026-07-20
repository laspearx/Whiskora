"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Syringe: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
};

function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getVaccineEmoji(name: string | null) {
  if (!name) return '💉';
  if (name.includes('เห็บ') || name.includes('หยด')) return '💧';
  if (name.includes('พยาธิ')) return '💊';
  return '💉';
}

function AppointmentsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isDateMode = !!dateParam;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const redirect = dateParam
            ? `/pets/vaccines/all?date=${dateParam}`
            : '/pets/vaccines/all';
          router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
          return;
        }

        const { data: petsData } = await supabase
          .from("pets").select("id, name, image_url").eq("user_id", session.user.id);
        if (!petsData || petsData.length === 0) { setLoading(false); return; }

        const petIds = petsData.map((p) => p.id);

        if (isDateMode) {
          // โหมด: แสดงวัคซีน/นัดหมายของวันที่ระบุ (เรียกจากปฏิทิน)
          const { data: vacData } = await supabase
            .from("vaccines").select("*").in("pet_id", petIds);
          if (vacData) {
            const filtered = vacData.filter((a) => a.next_due && a.next_due.split("T")[0] === dateParam);
            const merged = filtered.map((appt) => ({ ...appt, pet: petsData.find((p) => p.id === appt.pet_id) }));
            const byName = merged.reduce((acc: any, cur: any) => {
              const key = cur.vaccine_name || 'อื่นๆ';
              if (!acc[key]) acc[key] = [];
              acc[key].push(cur);
              return acc;
            }, {});
            setGroupedData(Object.keys(byName).map((key) => ({
              label: key,
              emoji: getVaccineEmoji(key),
              items: byName[key],
            })));
          }
        } else {
          // โหมด: ประวัติวัคซีนทั้งหมด — จัดกลุ่มตามชื่อวัคซีน เรียงตามวันที่ล่าสุด
          const { data: vacData } = await supabase
            .from("vaccines").select("*").in("pet_id", petIds)
            .not("date_given", "is", null)
            .order("date_given", { ascending: false });
          if (vacData) {
            const merged = vacData.map((v) => ({ ...v, pet: petsData.find((p) => p.id === v.pet_id) }));
            const byName = merged.reduce((acc: any, cur: any) => {
              const key = cur.vaccine_name || 'อื่นๆ';
              if (!acc[key]) acc[key] = [];
              acc[key].push(cur);
              return acc;
            }, {});
            setGroupedData(Object.keys(byName).map((key) => ({
              label: key,
              emoji: getVaccineEmoji(key),
              items: byName[key],
            })));
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateParam, isDateMode, router]);

  const pageTitle = isDateMode ? 'รายการนัดหมาย' : 'ประวัติวัคซีนทั้งหมด';
  const pageSubtitle = isDateMode
    ? new Date(dateParam!).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : `${groupedData.reduce((s, g) => s + g.items.length, 0)} รายการจากสัตว์ทุกตัว`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ap-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ap-body { max-width: 760px; margin: 0 auto; padding: 24px 20px 80px; }
        .ap-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ap-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; text-decoration: none; }
        .ap-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ap-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .ap-sub { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: ${F.pink}; margin-top: 3px; }
        /* empty */
        .ap-empty { background: white; border: 1px solid ${F.line}; border-radius: 24px; padding: 48px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .ap-empty-emoji { font-size: 48px; }
        .ap-empty-text { font-size: 15px; font-weight: 700; color: ${F.inkSoft}; }
        .ap-empty-sub { font-size: 13px; color: ${F.muted}; }
        .ap-empty-btn { display: inline-block; margin-top: 4px; background: ${F.pink}; color: white; padding: 11px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; text-decoration: none; }
        /* group card */
        .ap-group { background: white; border: 1px solid ${F.line}; border-radius: 22px; padding: 22px; margin-bottom: 18px; }
        .ap-group-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid ${F.line}; }
        .ap-group-icon { width: 42px; height: 42px; border-radius: 13px; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; color: ${F.pink}; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
        .ap-group-title { font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; letter-spacing: -0.2px; }
        .ap-group-count { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 1px; }
        /* pet items */
        .ap-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .ap-item { display: flex; align-items: center; gap: 12px; padding: 11px 13px; border-radius: 14px; border: 1px solid ${F.line}; background: #FAFAFA; text-decoration: none; transition: all .15s; }
        .ap-item:hover { background: white; border-color: ${F.pinkBorder}; box-shadow: 0 4px 14px rgba(232,70,119,0.1); }
        .ap-item-avatar { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
        .ap-item-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ap-item-info { flex: 1; min-width: 0; }
        .ap-item-tag { font-size: 9px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.08em; }
        .ap-item-name { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ap-item-date { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .ap-item-arrow { color: ${F.muted}; flex-shrink: 0; display: flex; }
        .ap-item:hover .ap-item-arrow { color: ${F.pink}; }
        @media (max-width: 480px) { .ap-items { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ap-page">
        <div className="ap-body">
          <div className="ap-header">
            <Link href="/profile" className="ap-back" aria-label="ย้อนกลับ"><Icon.ArrowLeft /></Link>
            <div>
              <h1 className="ap-title">{pageTitle}</h1>
              {!loading && <span className="ap-sub"><Icon.Calendar /> {pageSubtitle}</span>}
            </div>
          </div>

          {loading ? (
            <PageLoader />
          ) : groupedData.length === 0 ? (
            <div className="ap-empty">
              <span className="ap-empty-emoji">💉</span>
              <p className="ap-empty-text">
                {isDateMode ? 'ไม่มีนัดหมายในวันนี้' : 'ยังไม่มีประวัติวัคซีน'}
              </p>
              {!isDateMode && (
                <>
                  <p className="ap-empty-sub">เริ่มบันทึกวัคซีนของสัตว์เลี้ยงได้เลย</p>
                  <Link href="/pets/vaccines/bulk-add" className="ap-empty-btn">บันทึกวัคซีน</Link>
                </>
              )}
            </div>
          ) : (
            groupedData.map((group, gi) => (
              <div key={gi} className="ap-group">
                <div className="ap-group-head">
                  <div className="ap-group-icon">{group.emoji}</div>
                  <div>
                    <div className="ap-group-title">{group.label}</div>
                    <div className="ap-group-count">{group.items.length} รายการ</div>
                  </div>
                </div>
                <div className="ap-items">
                  {group.items.map((item: any, idx: number) => (
                    <Link key={idx} href={`/pets/${item.pet_id}/vaccines`} className="ap-item">
                      <div className="ap-item-avatar">
                        {item.pet?.image_url ? <img src={item.pet.image_url} alt={item.pet.name} /> : '🐾'}
                      </div>
                      <div className="ap-item-info">
                        <div className="ap-item-tag">{isDateMode ? 'นัดของน้อง' : 'รับเมื่อ'}</div>
                        <div className="ap-item-name">{item.pet?.name || 'ไม่ทราบชื่อ'}</div>
                        <div className="ap-item-date">
                          {isDateMode
                            ? (item.next_due ? `ครบกำหนด ${fmtDate(item.next_due)}` : '-')
                            : fmtDate(item.date_given)
                          }
                        </div>
                      </div>
                      <span className="ap-item-arrow"><Icon.ChevronRight /></span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function AllVaccinesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AppointmentsList />
    </Suspense>
  );
}
