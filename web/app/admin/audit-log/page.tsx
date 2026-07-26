"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  line: '#F3F4F6', lineMid: '#E5E7EB', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
};

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, string> = {
  verification_approve: 'อนุมัติคำขอยืนยัน',
  verification_reject: 'ปฏิเสธคำขอยืนยัน',
  verification_needs_more_info: 'ขอข้อมูลเพิ่มเติม',
};

interface AuditLogRow {
  id: number;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  note: string | null;
  created_at: string;
}

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(true);
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }
      await fetchLogs(0, entityFilter);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = async (targetPage: number, filter: string) => {
    setIsFetching(true);
    let query = supabase
      .from('admin_audit_logs')
      .select('id, admin_user_id, action, entity_type, entity_id, note, created_at')
      .order('created_at', { ascending: false })
      .range(targetPage * PAGE_SIZE, targetPage * PAGE_SIZE + PAGE_SIZE - 1);

    if (filter !== 'all') query = query.eq('entity_type', filter);

    const { data, error } = await query;
    if (!error && data) {
      setRows(data as AuditLogRow[]);
      setHasMore(data.length === PAGE_SIZE);
      const ids = Array.from(new Set(data.map(r => r.admin_user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        if (profs) {
          const map: Record<string, string> = {};
          profs.forEach((p: any) => { map[p.id] = p.full_name || 'แอดมิน'; });
          setAdminNames(map);
        }
      }
    }
    setIsFetching(false);
  };

  const changeFilter = (filter: string) => {
    setEntityFilter(filter);
    setPage(0);
    fetchLogs(0, filter);
  };

  const changePage = (next: number) => {
    setPage(next);
    fetchLogs(next, entityFilter);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: F.bg, color: F.ink }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl border bg-white"
            style={{ borderColor: F.lineMid, color: '#6B7280' }}
          >
            <Icon.ArrowLeft />
          </button>
          <div>
            <div className="text-xl font-bold">Audit Log</div>
            <div className="text-xs" style={{ color: F.muted }}>ประวัติการดำเนินการของแอดมินทั้งหมด (แก้ไข/ลบไม่ได้)</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {[{ key: 'all', label: 'ทั้งหมด' }, { key: 'farm_verification', label: 'คำขอยืนยันฟาร์ม' }].map(f => (
            <button
              key={f.key}
              onClick={() => changeFilter(f.key)}
              className="px-4 py-2 rounded-full text-xs font-bold border"
              style={entityFilter === f.key
                ? { background: '#FDE2EA', borderColor: '#E84677', color: '#E84677' }
                : { background: 'white', borderColor: F.lineMid, color: F.inkSoft }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isFetching ? (
          <PageLoader />
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: F.muted }}>ยังไม่มีรายการ</div>
        ) : (
          <>
            <div className="space-y-2">
              {rows.map(r => (
                <div key={r.id} className="rounded-xl border bg-white p-3" style={{ borderColor: F.lineMid }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{ACTION_LABELS[r.action] || r.action}</span>
                    <span className="text-xs" style={{ color: F.muted }}>{fmt(r.created_at)}</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: F.inkSoft }}>
                    โดย {adminNames[r.admin_user_id] || 'แอดมิน'} · {r.entity_type} #{r.entity_id}
                  </div>
                  {r.note && <div className="text-xs mt-1" style={{ color: F.muted }}>{r.note}</div>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <button
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
                className="px-4 py-2 rounded-lg text-xs font-bold border disabled:opacity-40"
                style={{ borderColor: F.lineMid, color: F.inkSoft }}
              >
                ก่อนหน้า
              </button>
              <span className="text-xs" style={{ color: F.muted }}>หน้า {page + 1}</span>
              <button
                disabled={!hasMore}
                onClick={() => changePage(page + 1)}
                className="px-4 py-2 rounded-lg text-xs font-bold border disabled:opacity-40"
                style={{ borderColor: F.lineMid, color: F.inkSoft }}
              >
                ถัดไป
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
