"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF', pink: '#E84677',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Syringe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
};

export default function CreateVaccinePage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [petName, setPetName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [dateGiven, setDateGiven] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [nextDue, setNextDue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/pets/${petId}/vaccines/create`)}`); return; }
        const { data, error } = await supabase.from("pets").select("name").eq("id", petId).eq("user_id", session.user.id).single();
        if (error || !data) { router.push("/profile"); return; }
        setPetName(data.name);
      } catch { router.push("/profile"); }
      finally { setIsLoading(false); }
    };
    if (petId) fetchPet();
  }, [petId, router]);

  // เพิ่มนัดวัคซีนลง Google Calendar (เฉพาะผู้ล็อกอินด้วย Google)
  const addVaccineToGoogleCalendar = async (petName: string, vaccineName: string, nextDueDate: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      if (!providerToken) {
        alert("ไม่สามารถบันทึกได้: กรุณาล็อกอินด้วย Google ใหม่อีกครั้งเพื่อรับสิทธิ์เข้าถึงปฏิทินครับ 🥲");
        return false;
      }
      const startDate = new Date(nextDueDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      const endString = endDate.toISOString().split('T')[0];
      const event = {
        summary: `💉 นัดฉีดวัคซีน ${vaccineName} ให้น้อง ${petName}`,
        description: `แจ้งเตือนอัตโนมัติจากแอป Whiskora 🐾\nถึงเวลาพาน้อง ${petName} ไปรับวัคซีน ${vaccineName} แล้วครับ!`,
        start: { date: nextDueDate, timeZone: 'Asia/Bangkok' },
        end: { date: endString, timeZone: 'Asia/Bangkok' },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 24 * 60 }, { method: 'popup', minutes: 60 * 9 }] },
      };
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${providerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!response.ok) { console.error("Google API Error:", await response.json()); throw new Error('บันทึกลงปฏิทินไม่สำเร็จ'); }
      alert("✅ บันทึกนัดหมายลง Google Calendar เรียบร้อยแล้ว! 📅");
      return true;
    } catch (error) {
      console.error("Calendar Error:", error);
      alert("เกิดข้อผิดพลาด หรือเซสชั่น Google หมดอายุ กรุณาล็อกอินใหม่อีกครั้งครับ");
      return false;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedType) return alert("กรุณาเลือกประเภทบริการด้วยครับ");
    const finalVaccineName = selectedType === "วัคซีนเพิ่มเติม" ? customVaccineName : selectedType;
    if (!finalVaccineName || !dateGiven) return alert("กรุณากรอกชื่อบริการและวันที่รับบริการให้ครบถ้วนครับ");

    setSaving(true);
    try {
      const { error } = await supabase.from("vaccines").insert([{
        pet_id: petId, vaccine_name: finalVaccineName, date_given: dateGiven, next_due: nextDue || null,
      }]);
      if (error) throw error;

      if (nextDue) {
        const wantToSync = confirm("💉 บันทึกวัคซีนสำเร็จ! 🐾 \n\nต้องการเพิ่มวันนัดถัดไปลงใน Google Calendar เพื่อแจ้งเตือนด้วยไหมครับ?");
        if (wantToSync) await addVaccineToGoogleCalendar(petName, finalVaccineName, nextDue);
      } else {
        alert("💉 บันทึกประวัติวัคซีนเรียบร้อยแล้ว!");
      }
      router.push(`/pets/${petId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error saving vaccine:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .vc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .vc-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .vc-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .vc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .vc-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .vc-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .vc-sub { font-size: 13px; font-weight: 700; color: ${F.teal}; margin-top: 2px; }
        .vc-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; }
        .vc-card-title { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
        .vc-card-icon { color: ${F.teal}; display: flex; }
        .vc-field { margin-bottom: 16px; }
        .vc-field:last-child { margin-bottom: 0; }
        .vc-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .vc-label .opt { color: ${F.muted}; font-weight: 500; }
        .vc-req { color: ${F.pink}; }
        .vc-input, .vc-select { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .vc-input:focus, .vc-select:focus { border-color: ${F.teal}; box-shadow: 0 0 0 3px ${F.tealSoft}; }
        .vc-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .vc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .vc-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .vc-savebar-inner { max-width: 600px; margin: 0 auto; display: flex; gap: 12px; }
        .vc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
        .vc-btn-cancel { flex: 0 0 auto; padding: 14px 22px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        .vc-btn-cancel:hover { background: ${F.line}; }
        .vc-btn-save { flex: 1; background: ${F.teal}; color: white; box-shadow: 0 4px 14px rgba(13,148,136,0.3); }
        .vc-btn-save:hover { background: #0B7E74; }
        .vc-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .vc-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .vc-spinner { padding: 9px 14px; border-radius: 12px; border: 3px solid ${F.tealBorder}; border-top-color: ${F.teal}; animation: vcspin 1s linear infinite; }
        @keyframes vcspin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .vc-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {isLoading ? (
        <div className="vc-loading">
          <div className="vc-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>กำลังดึงข้อมูล...</p>
        </div>
      ) : (
        <div className="vc-page">
          <div className="vc-body">
            <div className="vc-header">
              <button className="vc-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="vc-title">เพิ่มประวัติวัคซีน</h1>
                <p className="vc-sub">สมุดพกของน้อง {petName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="vc-card">
                <div className="vc-card-title"><span className="vc-card-icon"><Icon.Syringe /></span> รายละเอียดการรับบริการ</div>

                <div className="vc-field">
                  <label className="vc-label">ประเภทบริการ / วัคซีน <span className="vc-req">*</span></label>
                  <select className="vc-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="" disabled>เลือกประเภทบริการ</option>
                    <option value="วัคซีนรวม">วัคซีนรวม</option>
                    <option value="วัคซีนพิษสุนัขบ้า">วัคซีนพิษสุนัขบ้า</option>
                    <option value="หยดหลังป้องกันเห็บหมัด">หยดหลังป้องกันเห็บหมัด</option>
                    <option value="ถ่ายพยาธิ">ถ่ายพยาธิ</option>
                    <option value="วัคซีนเพิ่มเติม">วัคซีนเพิ่มเติม (พิมพ์ระบุเอง)</option>
                  </select>
                </div>

                {selectedType === "วัคซีนเพิ่มเติม" && (
                  <div className="vc-field">
                    <label className="vc-label">ระบุชื่อบริการ / วัคซีน <span className="vc-req">*</span></label>
                    <input type="text" className="vc-input" value={customVaccineName} onChange={(e) => setCustomVaccineName(e.target.value)} placeholder="เช่น วัคซีนลิวคีเมีย" />
                  </div>
                )}

                <div className="vc-grid2">
                  <div className="vc-field" style={{ marginBottom: 0 }}>
                    <label className="vc-label">วันที่รับบริการ <span className="vc-req">*</span></label>
                    <input type="date" className="vc-input" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} required />
                  </div>
                  <div className="vc-field" style={{ marginBottom: 0 }}>
                    <label className="vc-label">วันนัดครั้งถัดไป <span className="opt">(ถ้ามี)</span></label>
                    <input type="date" className="vc-input" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="vc-savebar">
            <div className="vc-savebar-inner">
              <button type="button" className="vc-btn vc-btn-cancel" onClick={() => router.back()}>ยกเลิก</button>
              <button type="button" className="vc-btn vc-btn-save" onClick={handleSubmit} disabled={saving}>
                <Icon.Save /> {saving ? "กำลังบันทึก..." : "บันทึกประวัติ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}