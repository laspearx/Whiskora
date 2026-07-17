"use client";

import React, { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  line: "#f3dde3", bg: "#fffafc",
};

const QUICK_TYPES = [
  { label: "นัดส่งมอบสัตว์เลี้ยง",     icon: "/icons/icon-pet-carrier.png" },
  { label: "ตรวจสุขภาพก่อนย้าย",        icon: "/icons/icon-vet-care.png" },
  { label: "อาบน้ำ / ตัดขน",            icon: "/icons/icon-health.png" },
  { label: "ฉีดวัคซีน",                  icon: "/icons/icon-health.png" },
  { label: "ติดตามลูกค้า",              icon: "/icons/icon-partner.png" },
  { label: "อื่นๆ",                      icon: "/icons/icon-calendar.png" },
];

function AppointmentCreateContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const fromPage = searchParams.get("from") || "dashboard";

  const [title, setTitle]     = useState("");
  const [apptDate, setApptDate] = useState("");
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const handleQuick = (label: string) => setTitle(label);

  const handleSave = async () => {
    if (!title.trim()) { setError("กรุณาระบุชื่อนัดหมาย"); return; }
    if (!apptDate)      { setError("กรุณาเลือกวันที่นัดหมาย"); return; }
    setSaving(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { error: err } = await supabase.from("appointments").insert({
        farm_id:   farmId,
        user_id:   session.user.id,
        title:     title.trim(),
        appt_date: apptDate,
        appt_type: "farm",
        notes:     notes.trim() || null,
        is_done:   false,
      });
      if (err) throw err;
      router.push(`/farm-dashboard/${farmId}`);
    } catch (e: any) {
      setError(e.message || "บันทึกไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .apc-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .apc-body { max-width: 480px; margin: 0 auto; padding: 20px 16px 80px; }
        .apc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .apc-back { width: 38px; height: 38px; border-radius: 11px; background: white; border: 1px solid ${F.line}; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; flex-shrink: 0; }
        .apc-title { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }
        .apc-label { font-size: 12px; font-weight: 600; color: ${F.inkSoft}; margin-bottom: 8px; margin-top: 18px; }
        .apc-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px; }
        .apc-quick-btn { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid ${F.line}; background: white; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 500; color: ${F.ink}; text-align: left; transition: all .15s; }
        .apc-quick-btn:hover, .apc-quick-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pink}; }
        .apc-quick-btn img { width: 22px; height: 22px; object-fit: contain; flex-shrink: 0; }
        .apc-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .apc-input:focus { border-color: ${F.pink}; }
        .apc-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; color: ${F.ink}; outline: none; transition: border-color .15s; resize: none; min-height: 80px; }
        .apc-textarea:focus { border-color: ${F.pink}; }
        .apc-error { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: #FEF2F2; border: 1px solid #FECACA; font-size: 12px; color: #DC2626; font-weight: 500; }
        .apc-save { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px); background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-top: 1px solid ${F.line}; }
        .apc-save-btn { width: 100%; max-width: 480px; margin: 0 auto; display: block; padding: 14px; border-radius: 14px; background: ${F.pink}; color: white; font-family: inherit; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: opacity .15s; }
        .apc-save-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div className="apc-page">
        <div className="apc-body">
          <div className="apc-header">
            <button className="apc-back" onClick={() => router.back()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="apc-title">เพิ่มนัดหมาย</h1>
          </div>

          <div className="apc-label">ประเภทนัดหมาย</div>
          <div className="apc-quick">
            {QUICK_TYPES.map(t => (
              <button key={t.label} className={`apc-quick-btn ${title === t.label ? "active" : ""}`}
                onClick={() => handleQuick(t.label)} type="button">
                <img src={t.icon} alt="" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="apc-label" style={{ marginTop: 16 }}>ชื่อนัดหมาย</div>
          <input className="apc-input" placeholder="ระบุชื่อนัดหมาย..." value={title}
            onChange={e => setTitle(e.target.value)} />

          <div className="apc-label">วันที่นัดหมาย</div>
          <input className="apc-input" type="date" value={apptDate}
            onChange={e => setApptDate(e.target.value)} />

          <div className="apc-label">หมายเหตุ (ไม่บังคับ)</div>
          <textarea className="apc-textarea" placeholder="รายละเอียดเพิ่มเติม..."
            value={notes} onChange={e => setNotes(e.target.value)} rows={3} />

          {error && <div className="apc-error">{error}</div>}
        </div>
      </div>

      <div className="apc-save">
        <button className="apc-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกนัดหมาย"}
        </button>
      </div>
    </>
  );
}

export default function AppointmentCreatePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AppointmentCreateContent />
    </Suspense>
  );
}
