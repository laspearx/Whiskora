"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', orange: '#F97316',
  teal: '#0D9488', tealLight: '#14B8A6', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  X: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

function VaccineTimeline() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const petId = params.id as string;
  const filterType = searchParams.get("type");

  const [petName, setPetName] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/login?redirect=${encodeURIComponent(`/pets/${petId}/vaccines`)}`);
          return;
        }
        const { data: petData, error: petError } = await supabase
          .from("pets").select("name").eq("id", petId).eq("user_id", session.user.id).single();
        if (petError || !petData) throw petError;
        setPetName(petData.name);

        let query = supabase.from("vaccines").select("*").eq("pet_id", petId).order("date_given", { ascending: false });
        if (filterType) query = query.eq("vaccine_name", filterType);
        const { data: vaccineData, error: vacError } = await query;
        if (vacError) throw vacError;
        if (vaccineData) setRecords(vaccineData);
      } catch (error) {
        console.error("Error fetching timeline:", error);
        router.push(`/pets/${petId}`);
      } finally {
        setIsLoading(false);
      }
    };
    if (petId) fetchHistory();
  }, [petId, filterType, router]);

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .vh-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .vh-body { max-width: 760px; margin: 0 auto; padding: 24px 20px 90px; }
        .vh-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .vh-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .vh-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .vh-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .vh-sub { font-size: 13px; font-weight: 700; color: ${F.teal}; margin-top: 2px; }
        /* filter chip */
        .vh-filter { display: inline-flex; align-items: center; gap: 8px; background: ${F.tealSoft}; padding: 7px 8px 7px 14px; border-radius: 12px; border: 1px solid ${F.tealBorder}; margin-bottom: 18px; }
        .vh-filter-label { font-size: 10px; font-weight: 700; color: ${F.teal}; text-transform: uppercase; letter-spacing: 0.06em; }
        .vh-filter-val { font-size: 13px; font-weight: 700; color: ${F.teal}; }
        .vh-filter-x { display: inline-flex; width: 22px; height: 22px; border-radius: 50%; background: white; color: ${F.muted}; align-items: center; justify-content: center; transition: all .15s; }
        .vh-filter-x:hover { color: ${F.pink}; }
        /* card wrapper */
        .vh-card { background: white; border: 1px solid ${F.line}; border-radius: 22px; padding: 24px; }
        /* empty */
        .vh-empty { text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .vh-empty-emoji { font-size: 44px; }
        .vh-empty-text { font-size: 14px; font-weight: 700; color: ${F.muted}; }
        .vh-empty-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; background: ${F.teal}; color: white; padding: 11px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(13,148,136,0.3); transition: all .15s; }
        .vh-empty-btn:hover { background: #0B7E74; }
        /* timeline */
        .vh-timeline { position: relative; border-left: 2px solid ${F.tealBorder}; margin-left: 8px; display: flex; flex-direction: column; gap: 22px; }
        .vh-item { position: relative; padding-left: 26px; }
        .vh-dot { position: absolute; left: -11px; top: 6px; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; background: ${F.lineMid}; }
        .vh-item.latest .vh-dot { background: ${F.teal}; box-shadow: 0 0 0 4px ${F.tealSoft}; }
        .vh-rec { background: white; padding: 18px; border-radius: 16px; border: 1px solid ${F.line}; transition: all .2s; }
        .vh-item.latest .vh-rec { border-color: ${F.tealBorder}; box-shadow: 0 2px 12px rgba(13,148,136,0.08); }
        .vh-rec-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .vh-rec-name { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .vh-rec-date { font-size: 12px; font-weight: 500; color: ${F.muted}; margin-top: 2px; }
        .vh-rec-date b { color: ${F.inkSoft}; font-weight: 700; }
        .vh-badge { flex-shrink: 0; background: ${F.tealSoft}; color: ${F.teal}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 5px 11px; border-radius: 9px; border: 1px solid ${F.tealBorder}; white-space: nowrap; }
        .vh-next { background: #FAFAFA; border: 1px solid ${F.line}; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 11px; }
        .vh-next-icon { width: 34px; height: 34px; border-radius: 10px; background: white; border: 1px solid ${F.line}; display: flex; align-items: center; justify-content: center; color: ${F.orange}; flex-shrink: 0; }
        .vh-next-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.04em; }
        .vh-next-val { font-size: 13px; font-weight: 700; color: ${F.orange}; margin-top: 1px; }
        .vh-next-val.none { color: ${F.muted}; }
        /* fab add */
        .vh-fab { position: fixed; bottom: 20px; right: 20px; z-index: 40; display: inline-flex; align-items: center; gap: 8px; background: ${F.teal}; color: white; padding: 14px 20px; border-radius: 16px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 20px rgba(13,148,136,0.4); transition: all .18s; border: none; cursor: pointer; }
        .vh-fab:hover { background: #0B7E74; transform: translateY(-1px); }
        .vh-loading { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .vh-spinner { padding: 9px 14px; border-radius: 12px; border: 3px solid ${F.tealBorder}; border-top-color: ${F.teal}; animation: vhspin 1s linear infinite; }
        @keyframes vhspin { to { transform: rotate(360deg); } }
      `}</style>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="vh-page">
          <div className="vh-body">
            <div className="vh-header">
              <button className="vh-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="vh-title">ประวัติสมุดพก</h1>
                <p className="vh-sub">สมุดพกของน้อง {petName}</p>
              </div>
            </div>

            {filterType && (
              <div className="vh-filter">
                <span className="vh-filter-label">กำลังดู</span>
                <span className="vh-filter-val">{filterType}</span>
                <Link href={`/pets/${petId}/vaccines`} className="vh-filter-x" aria-label="ล้างตัวกรอง"><Icon.X /></Link>
              </div>
            )}

            <div className="vh-card">
              {records.length === 0 ? (
                <div className="vh-empty">
                  <span className="vh-empty-emoji">📭</span>
                  <p className="vh-empty-text">ยังไม่มีประวัติในหมวดหมู่นี้</p>
                  <Link href={`/pets/${petId}/vaccines/create`} className="vh-empty-btn"><Icon.Plus /> เพิ่มประวัติใหม่</Link>
                </div>
              ) : (
                <div className="vh-timeline">
                  {records.map((record, index) => (
                    <div key={record.id} className={`vh-item ${index === 0 ? 'latest' : ''}`}>
                      <div className="vh-dot" />
                      <div className="vh-rec">
                        <div className="vh-rec-head">
                          <div>
                            <div className="vh-rec-name">{record.vaccine_name}</div>
                            <div className="vh-rec-date"><b>วันที่รับบริการ:</b> {fmtDate(record.date_given)}</div>
                          </div>
                          {index === 0 && <span className="vh-badge">ล่าสุด ✨</span>}
                        </div>
                        <div className="vh-next">
                          <div className="vh-next-icon"><Icon.Calendar /></div>
                          <div>
                            <div className="vh-next-label">วันนัดครั้งถัดไป</div>
                            {record.next_due
                              ? <div className="vh-next-val">{fmtDate(record.next_due)}</div>
                              : <div className="vh-next-val none">— ไม่มีการนัดหมาย —</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {records.length > 0 && (
            <Link href={`/pets/${petId}/vaccines/create`} className="vh-fab"><Icon.Plus /> เพิ่มประวัติ</Link>
          )}
        </div>
      )}
    </>
  );
}

export default function VaccinesHistoryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VaccineTimeline />
    </Suspense>
  );
}