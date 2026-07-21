"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  amber: '#D97706', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  red: '#EF4444', redSoft: '#FEF2F2', redBorder: '#FECACA',
  line: '#F3F4F6', lineMid: '#E5E7EB', bg: '#FDF6F8',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const daysDiff = (d: string) => {
  const date = new Date(d); date.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

export default function AppointmentsPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [appts, setAppts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState<number | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'done'>('upcoming');

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=/farm-dashboard/${farmId}/appointments`); return; }
      const { data } = await supabase.from('appointments')
        .select('*')
        .eq('farm_id', farmId)
        .order('appt_date', { ascending: true });
      setAppts(data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, [farmId]);

  const handleMarkDone = async (id: number) => {
    setMarkingDone(id);
    await supabase.from('appointments').update({ is_done: true }).eq('id', id);
    setAppts(prev => prev.map(a => a.id === id ? { ...a, is_done: true } : a));
    setMarkingDone(null);
  };

  if (isLoading) return <PageLoader />;

  const upcoming = appts.filter(a => !a.is_done);
  const done     = appts.filter(a => a.is_done);
  const list     = tab === 'upcoming' ? upcoming : done;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ap-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ap-body { max-width: 680px; margin: 0 auto; padding: 24px 20px 80px; }
        .ap-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .ap-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; flex-shrink: 0; transition: all .18s; }
        .ap-back:hover { background: #F9FAFB; transform: translateX(-1px); }
        .ap-title { font-size: 22px; font-weight: 700; }
        .ap-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .ap-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .ap-tab { flex: 1; padding: 9px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; font-family: inherit; font-size: 13px; font-weight: 700; color: ${F.muted}; cursor: pointer; transition: all .15s; }
        .ap-tab.active { background: ${F.pink}; border-color: ${F.pink}; color: white; }
        .ap-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 16px 18px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 14px; }
        .ap-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .ap-info { flex: 1; min-width: 0; }
        .ap-name { font-size: 14px; font-weight: 700; color: ${F.ink}; margin-bottom: 3px; }
        .ap-date { font-size: 12px; color: ${F.muted}; margin-bottom: 6px; }
        .ap-badge { display: inline-flex; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; }
        .ap-notes { font-size: 12px; color: ${F.inkSoft}; margin-top: 6px; line-height: 1.5; }
        .ap-done-btn { flex-shrink: 0; padding: 8px 14px; border-radius: 10px; border: 1.5px solid ${F.greenBorder}; background: ${F.greenSoft}; color: ${F.green}; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .ap-done-btn:hover { background: #DCFCE7; }
        .ap-done-btn:disabled { opacity: .5; cursor: wait; }
        .ap-done-check { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: ${F.greenSoft}; border: 1.5px solid ${F.greenBorder}; display: flex; align-items: center; justify-content: center; color: ${F.green}; }
        .ap-empty { text-align: center; padding: 48px 24px; background: white; border: 1px dashed ${F.lineMid}; border-radius: 18px; }
        .ap-empty-icon { font-size: 36px; margin-bottom: 10px; }
        .ap-empty-text { font-size: 14px; font-weight: 600; color: ${F.muted}; }
        .ap-fab { position: fixed; bottom: calc(16px + env(safe-area-inset-bottom,0px)); left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
        .ap-fab-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 22px; border-radius: 999px; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; border: none; text-decoration: none; box-shadow: 0 4px 16px rgba(0,0,0,.15); white-space: nowrap; }
        .ap-fab-appt { background: ${F.pink}; color: white; }
        .ap-fab-act  { background: white; color: ${F.inkSoft}; border: 1.5px solid ${F.lineMid}; }
      `}</style>

      <div className="ap-page">
        <div className="ap-body">
          <div className="ap-top">
            <button className="ap-back" onClick={() => router.back()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="ap-title">นัดหมาย & กิจกรรม</div>
              <div className="ap-sub">{upcoming.length} รายการที่ยังไม่เสร็จ</div>
            </div>
          </div>

          <div className="ap-tabs">
            <button className={`ap-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
              กำลังดำเนินการ ({upcoming.length})
            </button>
            <button className={`ap-tab ${tab === 'done' ? 'active' : ''}`} onClick={() => setTab('done')}>
              เสร็จแล้ว ({done.length})
            </button>
          </div>

          {list.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">{tab === 'upcoming' ? <img src="/icons/icon-calendar.png" alt="" style={{width:36,height:36,objectFit:'contain',opacity:0.35}} /> : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"><polyline points="20 6 9 17 4 12"/></svg>}</div>
              <div className="ap-empty-text">{tab === 'upcoming' ? 'ยังไม่มีนัดหมายที่ค้างอยู่' : 'ยังไม่มีรายการที่เสร็จแล้ว'}</div>
            </div>
          ) : (
            list.map(a => {
              const diff = a.appt_date ? daysDiff(a.appt_date) : null;
              const isOverdue = diff !== null && diff < 0 && !a.is_done;
              const isToday   = diff === 0 && !a.is_done;
              const dotColor  = a.is_done ? F.green : isOverdue ? F.red : isToday ? F.amber : F.pink;
              const badgeBg   = a.is_done ? F.greenSoft : isOverdue ? F.redSoft : isToday ? F.amberSoft : F.pinkSoft;
              const badgeColor = a.is_done ? F.green : isOverdue ? F.red : isToday ? F.amber : F.pink;
              const badgeText  = a.is_done ? 'เสร็จแล้ว' : isOverdue ? `เลย ${Math.abs(diff!)} วัน` : isToday ? 'วันนี้' : diff !== null ? `อีก ${diff} วัน` : '';
              return (
                <div key={a.id} className="ap-card">
                  <div className="ap-dot" style={{ background: dotColor }} />
                  <div className="ap-info">
                    <div className="ap-name">{a.title}</div>
                    <div className="ap-date">
                      {a.appt_date ? fmtDate(a.appt_date) : 'ไม่ระบุวัน'}
                      {a.appt_type && <span style={{ marginLeft: 6, color: F.muted }}> · {a.appt_type}</span>}
                    </div>
                    {badgeText && (
                      <span className="ap-badge" style={{ background: badgeBg, color: badgeColor }}>{badgeText}</span>
                    )}
                    {a.notes && <div className="ap-notes">{a.notes}</div>}
                  </div>
                  {!a.is_done ? (
                    <button className="ap-done-btn" onClick={() => handleMarkDone(a.id)} disabled={markingDone === a.id}>
                      {markingDone === a.id ? '...' : 'เสร็จแล้ว'}
                    </button>
                  ) : (
                    <div className="ap-done-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="ap-fab">
        <Link href={`/farm-dashboard/${farmId}/appointments/create`} className="ap-fab-btn ap-fab-appt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          นัดหมายใหม่
        </Link>
        <Link href={`/farm-dashboard/${farmId}/appointments/create?type=activity`} className="ap-fab-btn ap-fab-act">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          กิจกรรม
        </Link>
      </div>
    </>
  );
}
