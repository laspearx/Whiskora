"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';
import ConfirmDialog from '@/app/components/admin/ConfirmDialog';
import AuditTrail from '@/app/components/admin/AuditTrail';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#10B981', greenSoft: '#ECFDF5',
  red: '#EF4444', redSoft: '#FEF2F2',
  yellow: '#F59E0B', yellowSoft: '#FFFBEB',
  blue: '#2563EB', blueSoft: '#EFF6FF',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Help: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ChevronUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
  Farm: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

type ReviewAction = 'approve' | 'reject' | 'needs_more_info';

interface Verification {
  id: number;
  farm_id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_note: string | null;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  bank_book_url: string | null;
  farm_photo_urls: string[] | null;
  house_registration_url: string | null;
  farm: { farm_name: string | null; image_url: string | null } | null;
  profile: { full_name: string | null; email: string | null } | null;
}

const DOC_LABELS: { key: keyof Verification; label: string }[] = [
  { key: 'id_card_front_url', label: 'บัตรประชาชน (หน้าหน้า)' },
  { key: 'id_card_back_url', label: 'บัตรประชาชน (หน้าหลัง)' },
  { key: 'bank_book_url', label: 'สมุดบัญชี' },
  { key: 'house_registration_url', label: 'ทะเบียนบ้าน' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: 'รอตรวจสอบ',        color: F.yellow, bg: F.yellowSoft },
  needs_more_info:  { label: 'ขอข้อมูลเพิ่มเติม', color: F.blue,   bg: F.blueSoft },
  approved:         { label: 'อนุมัติแล้ว',        color: F.green,  bg: F.greenSoft },
  rejected:         { label: 'ปฏิเสธ',            color: F.red,    bg: F.redSoft },
};

const TABS = ['pending', 'needs_more_info', 'approved', 'rejected'] as const;

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<typeof TABS[number]>('pending');
  const [noteDraft, setNoteDraft] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ v: Verification; action: ReviewAction } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!profile || profile.role !== 'admin') { router.push('/'); return; }

      await fetchVerifications();
    };
    load();
  }, []);

  const fetchVerifications = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('farm_verifications')
      .select(`
        *,
        farm:farms!farm_id(farm_name, image_url),
        profile:profiles!user_id(full_name, email)
      `)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setVerifications(data as any);
      const reviewerIds = Array.from(new Set((data as Verification[]).map(v => v.reviewed_by).filter(Boolean))) as string[];
      if (reviewerIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', reviewerIds);
        if (profs) {
          const map: Record<string, string> = {};
          profs.forEach((p: any) => { map[p.id] = p.full_name || 'แอดมิน'; });
          setReviewerNames(map);
        }
      }
    }
    setIsFetching(false);
  };

  const stats = useMemo(() => {
    const pending = verifications.filter(v => v.status === 'pending' || v.status === 'needs_more_info');
    const now = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const newToday = pending.filter(v => new Date(v.submitted_at).getTime() >= startOfToday.getTime()).length;
    const newThisWeek = pending.filter(v => new Date(v.submitted_at).getTime() >= weekAgo).length;
    const oldest = pending.reduce<number | null>((acc, v) => {
      const days = Math.floor((now - new Date(v.submitted_at).getTime()) / (24 * 60 * 60 * 1000));
      return acc === null || days > acc ? days : acc;
    }, null);
    const reviewed = verifications.filter(v => v.reviewed_at);
    const avgWaitHours = reviewed.length
      ? Math.round(reviewed.reduce((sum, v) => sum + (new Date(v.reviewed_at!).getTime() - new Date(v.submitted_at).getTime()), 0) / reviewed.length / (60 * 60 * 1000))
      : null;
    return { pendingCount: pending.length, newToday, newThisWeek, oldestDays: oldest, avgWaitHours };
  }, [verifications]);

  const startReview = (v: Verification, action: ReviewAction) => {
    setNoteDraft(prev => ({ ...prev, [v.id]: prev[v.id] || '' }));
    setConfirmTarget({ v, action });
  };

  const confirmReview = async () => {
    if (!confirmTarget) return;
    const { v, action } = confirmTarget;
    const note = noteDraft[v.id]?.trim() || null;
    if (action !== 'approve' && !note) return;

    setProcessing(v.id);
    try {
      const { error } = await supabase.rpc('admin_review_farm_verification', {
        p_verification_id: v.id,
        p_action: action,
        p_note: note,
      });
      if (error) throw error;
      setConfirmTarget(null);
      await fetchVerifications();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err?.message || 'ไม่สามารถดำเนินการได้'));
    } finally {
      setProcessing(null);
    }
  };

  const filtered = verifications.filter(v => v.status === filterStatus);
  const counts = TABS.reduce((acc, s) => ({ ...acc, [s]: verifications.filter(v => v.status === s).length }), {} as Record<string, number>);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const actionCopy: Record<ReviewAction, { title: string; confirmLabel: string; tone: 'default' | 'danger'; requireNote: boolean; placeholder?: string }> = {
    approve: { title: 'ยืนยันอนุมัติฟาร์มนี้?', confirmLabel: 'อนุมัติ', tone: 'default', requireNote: false },
    reject: { title: 'ยืนยันปฏิเสธคำขอนี้?', confirmLabel: 'ปฏิเสธ', tone: 'danger', requireNote: true, placeholder: 'ระบุเหตุผลในการปฏิเสธ เช่น เอกสารไม่ชัดเจน...' },
    needs_more_info: { title: 'ขอข้อมูลเพิ่มเติมจากฟาร์มนี้?', confirmLabel: 'ส่งคำขอ', tone: 'default', requireNote: true, placeholder: 'ระบุว่าต้องการเอกสาร/ข้อมูลอะไรเพิ่ม...' },
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .av-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .av-body { max-width: 860px; margin: 0 auto; padding: 24px 20px 60px; }
        .av-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .av-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .av-back:hover { background: ${F.line}; color: ${F.ink}; transform: translateX(-1px); }
        .av-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .av-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        .av-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        @media (min-width: 640px) { .av-stats { grid-template-columns: repeat(4, 1fr); } }
        .av-stat { background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; padding: 12px 14px; }
        .av-stat-num { font-size: 20px; font-weight: 800; color: ${F.ink}; }
        .av-stat-label { font-size: 11px; color: ${F.muted}; margin-top: 2px; }

        .av-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .av-tab { padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; transition: all .15s; font-family: inherit; }
        .av-tab.active-pending { background: ${F.yellowSoft}; border-color: ${F.yellow}; color: ${F.yellow}; }
        .av-tab.active-needs_more_info { background: ${F.blueSoft}; border-color: ${F.blue}; color: ${F.blue}; }
        .av-tab.active-approved { background: ${F.greenSoft}; border-color: ${F.green}; color: ${F.green}; }
        .av-tab.active-rejected { background: ${F.redSoft}; border-color: ${F.red}; color: ${F.red}; }
        .av-tab:not([class*="active"]) { background: white; border-color: ${F.lineMid}; color: ${F.inkSoft}; }
        .av-tab:not([class*="active"]):hover { background: ${F.line}; }
        .av-empty { text-align: center; padding: 60px 20px; color: ${F.muted}; font-size: 14px; }
        .av-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 18px; margin-bottom: 12px; overflow: hidden; }
        .av-card-head { display: flex; align-items: center; gap: 14px; padding: 16px 18px; cursor: pointer; transition: background .15s; }
        .av-card-head:hover { background: ${F.line}; }
        .av-farm-av { width: 48px; height: 48px; border-radius: 14px; object-fit: cover; background: ${F.line}; flex-shrink: 0; }
        .av-farm-av-ph { width: 48px; height: 48px; border-radius: 14px; background: ${F.line}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${F.muted}; }
        .av-card-info { flex: 1; min-width: 0; }
        .av-farm-name { font-size: 15px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .av-farm-meta { font-size: 12px; color: ${F.muted}; margin-top: 2px; display: flex; align-items: center; gap: 6px; }
        .av-status-chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .av-chevron { color: ${F.muted}; flex-shrink: 0; }
        .av-detail { border-top: 1px solid ${F.line}; padding: 18px; }
        .av-sec { margin-bottom: 18px; }
        .av-sec-title { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
        .av-docs { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .av-doc { border-radius: 12px; overflow: hidden; border: 1px solid ${F.lineMid}; cursor: pointer; transition: transform .15s, box-shadow .15s; }
        .av-doc:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .av-doc img { width: 100%; height: 100px; object-fit: cover; display: block; }
        .av-doc-label { padding: 6px 8px; font-size: 10px; font-weight: 700; color: ${F.inkSoft}; background: ${F.line}; }
        .av-farm-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
        .av-farm-photo { width: 100%; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid ${F.lineMid}; cursor: pointer; transition: transform .15s; }
        .av-farm-photo:hover { transform: scale(1.02); }
        .av-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .av-btn { flex: 1; min-width: 110px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
        .av-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .av-btn-approve { background: ${F.green}; color: white; box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
        .av-btn-approve:hover:not(:disabled) { background: #059669; }
        .av-btn-reject { background: ${F.red}; color: white; box-shadow: 0 4px 12px rgba(239,68,68,0.2); }
        .av-btn-reject:hover:not(:disabled) { background: #DC2626; }
        .av-btn-info { background: ${F.blue}; color: white; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .av-btn-info:hover:not(:disabled) { background: #1D4ED8; }
        .av-result-note { padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 12px; }
        .av-result-approved { background: ${F.greenSoft}; color: ${F.green}; font-weight: 600; }
        .av-result-rejected { background: ${F.redSoft}; color: ${F.red}; }
        .av-result-info { background: ${F.blueSoft}; color: ${F.blue}; }
        .av-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .av-lightbox img { max-width: 100%; max-height: 90vh; border-radius: 12px; object-fit: contain; }
        .av-lightbox-close { position: absolute; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; color: ${F.ink}; }
      `}</style>

      {lightbox && (
        <div className="av-lightbox" onClick={() => setLightbox(null)}>
          <button className="av-lightbox-close" onClick={() => setLightbox(null)}><Icon.X /></button>
          <img src={lightbox} alt="document" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {confirmTarget && (
        <ConfirmDialog
          open
          title={actionCopy[confirmTarget.action].title}
          description={confirmTarget.v.farm?.farm_name ? `ฟาร์ม: ${confirmTarget.v.farm.farm_name}` : undefined}
          confirmLabel={actionCopy[confirmTarget.action].confirmLabel}
          tone={actionCopy[confirmTarget.action].tone}
          requireNote={actionCopy[confirmTarget.action].requireNote}
          notePlaceholder={actionCopy[confirmTarget.action].placeholder}
          noteValue={noteDraft[confirmTarget.v.id] || ''}
          onNoteChange={val => setNoteDraft(prev => ({ ...prev, [confirmTarget.v.id]: val }))}
          busy={processing === confirmTarget.v.id}
          onConfirm={confirmReview}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {isFetching ? (
        <PageLoader />
      ) : (
        <div className="av-page">
          <div className="av-body">
            <div className="av-top">
              <button className="av-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <div>
                <div className="av-title">คำขอยืนยันตัวตน</div>
                <div className="av-sub">ตรวจสอบและอนุมัติฟาร์ม</div>
              </div>
            </div>

            <div className="av-stats">
              <div className="av-stat">
                <div className="av-stat-num">{stats.pendingCount}</div>
                <div className="av-stat-label">รอตรวจ/ขอข้อมูลเพิ่ม</div>
              </div>
              <div className="av-stat">
                <div className="av-stat-num">{stats.newToday} / {stats.newThisWeek}</div>
                <div className="av-stat-label">ใหม่วันนี้ / สัปดาห์นี้</div>
              </div>
              <div className="av-stat">
                <div className="av-stat-num">{stats.oldestDays === null ? '–' : `${stats.oldestDays} วัน`}</div>
                <div className="av-stat-label">รอนานที่สุด</div>
              </div>
              <div className="av-stat">
                <div className="av-stat-num">{stats.avgWaitHours === null ? '–' : `${stats.avgWaitHours} ชม.`}</div>
                <div className="av-stat-label">เวลารอเฉลี่ย</div>
              </div>
            </div>

            <div className="av-tabs">
              {TABS.map(s => (
                <button
                  key={s}
                  className={`av-tab${filterStatus === s ? ` active-${s}` : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {STATUS_CONFIG[s].label} ({counts[s]})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="av-empty">ไม่มีคำขอในสถานะนี้</div>
            ) : (
              filtered.map(v => {
                const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
                const isOpen = expanded === v.id;
                const farmPhotos = v.farm_photo_urls || [];
                const canReview = v.status === 'pending' || v.status === 'needs_more_info';
                return (
                  <div key={v.id} className="av-card">
                    <div className="av-card-head" onClick={() => setExpanded(isOpen ? null : v.id)}>
                      {v.farm?.image_url
                        ? <img className="av-farm-av" src={v.farm.image_url} alt="" />
                        : <div className="av-farm-av-ph"><Icon.Farm /></div>
                      }
                      <div className="av-card-info">
                        <div className="av-farm-name">{v.farm?.farm_name || '(ไม่ทราบชื่อ)'}</div>
                        <div className="av-farm-meta">
                          <span>{v.profile?.full_name || v.profile?.email || v.user_id.slice(0, 8)}</span>
                          <span>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon.Clock /> {fmt(v.submitted_at)}</span>
                        </div>
                      </div>
                      <div className="av-status-chip" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</div>
                      <div className="av-chevron">{isOpen ? <Icon.ChevronUp /> : <Icon.ChevronDown />}</div>
                    </div>

                    {isOpen && (
                      <div className="av-detail">
                        <div className="av-sec">
                          <div className="av-sec-title">เอกสาร</div>
                          <div className="av-docs">
                            {DOC_LABELS.map(({ key, label }) => {
                              const url = v[key] as string | null;
                              if (!url) return null;
                              return (
                                <div key={key} className="av-doc" onClick={() => setLightbox(url)}>
                                  <img src={url} alt={label} />
                                  <div className="av-doc-label">{label}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {farmPhotos.length > 0 && (
                          <div className="av-sec">
                            <div className="av-sec-title">รูปฟาร์ม ({farmPhotos.length} รูป)</div>
                            <div className="av-farm-photos">
                              {farmPhotos.map((url, i) => (
                                <img key={i} className="av-farm-photo" src={url} alt={`รูปฟาร์ม ${i + 1}`} onClick={() => setLightbox(url)} />
                              ))}
                            </div>
                          </div>
                        )}

                        {v.status === 'approved' && (
                          <div className="av-result-note av-result-approved">
                            อนุมัติแล้ว เมื่อ {fmt(v.reviewed_at!)}{v.reviewed_by && reviewerNames[v.reviewed_by] ? ` · โดย ${reviewerNames[v.reviewed_by]}` : ''}
                          </div>
                        )}
                        {v.status === 'rejected' && (
                          <div className="av-result-note av-result-rejected">
                            <strong>ปฏิเสธ</strong> เมื่อ {fmt(v.reviewed_at!)}{v.reviewed_by && reviewerNames[v.reviewed_by] ? ` · โดย ${reviewerNames[v.reviewed_by]}` : ''}{v.admin_note ? ` · ${v.admin_note}` : ''}
                          </div>
                        )}
                        {v.status === 'needs_more_info' && (
                          <div className="av-result-note av-result-info">
                            <strong>ขอข้อมูลเพิ่มเติม</strong> เมื่อ {fmt(v.reviewed_at!)}{v.reviewed_by && reviewerNames[v.reviewed_by] ? ` · โดย ${reviewerNames[v.reviewed_by]}` : ''}{v.admin_note ? ` · ${v.admin_note}` : ''}
                          </div>
                        )}

                        {canReview && (
                          <div className="av-btn-row">
                            <button className="av-btn av-btn-reject" disabled={processing === v.id} onClick={() => startReview(v, 'reject')}>
                              <Icon.X /> ปฏิเสธ
                            </button>
                            <button className="av-btn av-btn-info" disabled={processing === v.id} onClick={() => startReview(v, 'needs_more_info')}>
                              <Icon.Help /> ขอข้อมูลเพิ่ม
                            </button>
                            <button className="av-btn av-btn-approve" disabled={processing === v.id} onClick={() => startReview(v, 'approve')}>
                              <Icon.Check /> อนุมัติ
                            </button>
                          </div>
                        )}

                        <div className="av-sec" style={{ marginTop: 18, marginBottom: 0 }}>
                          <div className="av-sec-title">ประวัติการดำเนินการ</div>
                          <AuditTrail entityType="farm_verification" entityId={String(v.id)} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
