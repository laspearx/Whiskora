"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  line: "#f3dde3", bg: "#fffafc",
};

const ACTIVITY_TYPES = ["หาหมอ", "หยดเห็บหมัด", "ถ่ายพยาธิ", "อาหาร", "นิสัย", "ทั่วไป", "นัดหมาย", "ประกวด"];

function PetActivityCreateContent() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [petName, setPetName]           = useState("");
  const [activityType, setActivityType] = useState("ทั่วไป");
  const [title, setTitle]               = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription]  = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    supabase.from("pets").select("name").eq("id", petId).single()
      .then(({ data }) => { if (data) setPetName(data.name || ""); });
  }, [petId]);

  const handleSave = async () => {
    if (!title.trim()) { setError("กรุณาระบุหัวข้อกิจกรรม"); return; }
    if (!activityDate)  { setError("กรุณาเลือกวันที่"); return; }
    setSaving(true); setError("");
    try {
      const { error: err } = await supabase.from("pet_activities").insert({
        pet_id:        parseInt(petId),
        activity_type: activityType,
        title:         title.trim(),
        description:   description.trim() || null,
        activity_date: activityDate,
      });
      if (err) throw err;
      router.back();
    } catch (e: any) {
      setError(e.message || "บันทึกไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pa-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .pa-body { max-width: 480px; margin: 0 auto; padding: 20px 16px 100px; }
        .pa-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .pa-back { width: 38px; height: 38px; border-radius: 11px; background: white; border: 1px solid ${F.line}; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; flex-shrink: 0; }
        .pa-title { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }
        .pa-sub { font-size: 12px; font-weight: 600; color: ${F.pink}; margin-top: 2px; }
        .pa-label { font-size: 12px; font-weight: 600; color: ${F.inkSoft}; margin-bottom: 8px; margin-top: 18px; }
        .pa-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pa-chip { padding: 7px 14px; border-radius: 20px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 12px; font-weight: 600; color: ${F.inkSoft}; cursor: pointer; transition: all .15s; }
        .pa-chip.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pink}; }
        .pa-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .pa-input:focus { border-color: ${F.pink}; }
        .pa-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; color: ${F.ink}; outline: none; transition: border-color .15s; resize: none; min-height: 80px; }
        .pa-textarea:focus { border-color: ${F.pink}; }
        .pa-error { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: #FEF2F2; border: 1px solid #FECACA; font-size: 12px; color: #DC2626; font-weight: 500; }
        .pa-save { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px calc(env(safe-area-inset-bottom,0px) + 12px); background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-top: 1px solid ${F.line}; z-index: 60; }
        .pa-save-btn { width: 100%; max-width: 480px; margin: 0 auto; display: block; padding: 14px; border-radius: 14px; background: ${F.pink}; color: white; font-family: inherit; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: opacity .15s; }
        .pa-save-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div className="pa-page">
        <div className="pa-body">
          <div className="pa-header">
            <button className="pa-back" onClick={() => router.back()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h1 className="pa-title">บันทึกกิจกรรม</h1>
              {petName && <div className="pa-sub">{petName}</div>}
            </div>
          </div>

          <div className="pa-label">ประเภทกิจกรรม</div>
          <div className="pa-chips">
            {ACTIVITY_TYPES.map(t => (
              <button key={t} type="button" className={`pa-chip ${activityType === t ? "active" : ""}`} onClick={() => setActivityType(t)}>{t}</button>
            ))}
          </div>

          <div className="pa-label">หัวข้อ</div>
          <input className="pa-input" placeholder="เช่น พาไปตรวจสุขภาพ, ชนะเลิศประกวด..." value={title} onChange={e => setTitle(e.target.value)} />

          <div className="pa-label">วันที่</div>
          <input className="pa-input" type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} />

          <div className="pa-label">รายละเอียด (ไม่บังคับ)</div>
          <textarea className="pa-textarea" placeholder="บันทึกเพิ่มเติม..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />

          {error && <div className="pa-error">{error}</div>}
        </div>
      </div>

      <div className="pa-save">
        <button className="pa-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
        </button>
      </div>
    </>
  );
}

export default function PetActivityCreatePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PetActivityCreateContent />
    </Suspense>
  );
}
