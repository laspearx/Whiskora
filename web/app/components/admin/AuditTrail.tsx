"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditLogRow {
  id: number;
  admin_user_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  verification_approve: 'อนุมัติคำขอยืนยัน',
  verification_reject: 'ปฏิเสธคำขอยืนยัน',
  verification_needs_more_info: 'ขอข้อมูลเพิ่มเติม',
};

export default function AuditTrail({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('id, admin_user_id, action, note, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (!error && data) {
        setRows(data as AuditLogRow[]);
        const ids = Array.from(new Set(data.map(r => r.admin_user_id)));
        if (ids.length) {
          const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
          if (active && profs) {
            const map: Record<string, string> = {};
            profs.forEach((p: any) => { map[p.id] = p.full_name || 'แอดมิน'; });
            setAdminNames(map);
          }
        }
      }
      if (active) setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [entityType, entityId]);

  if (loading) return <div className="text-xs" style={{ color: '#9CA3AF' }}>กำลังโหลดประวัติ...</div>;
  if (rows.length === 0) return <div className="text-xs" style={{ color: '#9CA3AF' }}>ยังไม่มีประวัติการดำเนินการ</div>;

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.id} className="text-xs rounded-lg px-3 py-2" style={{ background: '#F9FAFB', color: '#4B5563' }}>
          <span className="font-semibold" style={{ color: '#111827' }}>{ACTION_LABELS[r.action] || r.action}</span>
          {' · '}{adminNames[r.admin_user_id] || 'แอดมิน'}{' · '}{fmt(r.created_at)}
          {r.note && <div className="mt-1" style={{ color: '#6B7280' }}>{r.note}</div>}
        </div>
      ))}
    </div>
  );
}
