"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Check: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Syringe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
};

export default function BulkAddVaccinePage() {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [dateGiven, setDateGiven] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [nextDue, setNextDue] = useState("");

  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/login?redirect=${encodeURIComponent('/pets/vaccines/bulk-add')}`);
          return;
        }
        const { data: petsData, error } = await supabase
          .from("pets").select("id, name, image_url")
          .eq("user_id", session.user.id).order("name", { ascending: true });
        if (error) throw error;
        if (petsData) setPets(petsData);
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPets();
  }, [router]);

  const togglePetSelection = (petId: string) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  };

  const selectAllPets = () => {
    setSelectedPetIds(selectedPetIds.length === pets.length ? [] : pets.map((p) => p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return alert("กรุณาเลือกประเภทบริการด้วยครับ");
    if (selectedPetIds.length === 0) return alert("กรุณาเลือกเด็กๆ อย่างน้อย 1 ตัวครับ 🐾");
    const finalVaccineName = selectedType === "วัคซีนเพิ่มเติม" ? customVaccineName : selectedType;
    if (!finalVaccineName || !dateGiven) return alert("กรุณากรอกชื่อบริการและวันที่รับบริการให้ครบถ้วนครับ");

    setSaving(true);
    try {
      // ตาราง vaccines ใช้คอลัมน์ pet_id (ตรงกับ schema จริง)
      const insertData = selectedPetIds.map((petId) => ({
        pet_id: petId,
        vaccine_name: finalVaccineName,
        date_given: dateGiven,
        next_due: nextDue || null,
      }));
      const { error } = await supabase.from("vaccines").insert(insertData);
      if (error) throw error;
      router.push(`/profile`);
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
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .bv-page { font-family: 'Sarabun', sans-serif; min-height: 100vh; color: ${F.ink}; }
        .bv-body { max-width: 720px; margin: 0 auto; padding: 24px 20px 120px; }
        /* header */
        .bv-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .bv-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .bv-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .bv-title { font-family: 'Prompt', sans-serif; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .bv-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        /* card */
        .bv-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .bv-card-title { font-family: 'Prompt', sans-serif; font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
        .bv-card-icon { color: ${F.pink}; display: flex; }
        /* fields */
        .bv-field { margin-bottom: 16px; }
        .bv-field:last-child { margin-bottom: 0; }
        .bv-label { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .bv-label .opt { color: ${F.muted}; font-weight: 500; }
        .bv-input, .bv-select { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .bv-input:focus, .bv-select:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .bv-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .bv-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        /* members */
        .bv-members-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 12px; }
        .bv-selectall { font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 10px; background: ${F.pinkSoft}; color: ${F.pink}; border: 1px solid ${F.pinkBorder}; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: inherit; }
        .bv-selectall:hover { background: ${F.pink}; color: white; }
        .bv-pets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 18px 12px; }
        .bv-pet { cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .bv-pet-avatar-wrap { position: relative; margin-bottom: 8px; }
        .bv-pet-avatar { width: 70px; height: 70px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 2px solid ${F.lineMid}; transition: all .18s; }
        .bv-pet.sel .bv-pet-avatar { border-color: transparent; box-shadow: 0 0 0 2px white, 0 0 0 4px ${F.pink}; }
        .bv-pet:not(.sel):hover .bv-pet-avatar { border-color: ${F.pinkBorder}; }
        .bv-pet-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .bv-pet-check { position: absolute; top: -2px; right: -2px; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; background: ${F.pink}; color: white; display: flex; align-items: center; justify-content: center; transform: scale(0); transition: transform .18s; }
        .bv-pet.sel .bv-pet-check { transform: scale(1); }
        .bv-pet-name { font-size: 12px; font-weight: 700; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; transition: color .15s; }
        .bv-pet.sel .bv-pet-name { color: ${F.ink}; }
        .bv-empty { text-align: center; padding: 32px; color: ${F.muted}; font-size: 13px; font-weight: 600; }
        /* save bar */
        .bv-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .bv-savebar-inner { max-width: 720px; margin: 0 auto; display: flex; gap: 12px; }
        .bv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
        .bv-btn-cancel { flex: 0 0 auto; padding: 14px 22px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        .bv-btn-cancel:hover { background: ${F.line}; }
        .bv-btn-save { flex: 1; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .bv-btn-save:hover { background: #D63F6A; }
        .bv-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        /* loading */
        .bv-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .bv-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: bvspin 1s linear infinite; }
        @keyframes bvspin { to { transform: rotate(360deg); } }
      `}</style>

      {isLoading ? (
        <div className="bv-loading">
          <div className="bv-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>กำลังดึงข้อมูล...</p>
        </div>
      ) : (
        <div className="bv-page">
          <div className="bv-body">
            {/* Header */}
            <div className="bv-header">
              <button className="bv-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="bv-title">เพิ่มประวัติให้หลายตัว</h1>
                <p className="bv-sub">เลือกเด็กๆ ที่ไปรับบริการพร้อมกัน</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* การ์ด 1: รายละเอียดบริการ */}
              <div className="bv-card">
                <div className="bv-card-title"><span className="bv-card-icon"><Icon.Syringe /></span> รายละเอียดการรับบริการ</div>

                <div className="bv-field">
                  <label className="bv-label">ประเภทบริการ / วัคซีน *</label>
                  <select className="bv-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="" disabled>เลือกประเภทบริการ</option>
                    <option value="วัคซีนรวม">วัคซีนรวม</option>
                    <option value="วัคซีนพิษสุนัขบ้า">วัคซีนพิษสุนัขบ้า</option>
                    <option value="หยดหลังป้องกันเห็บหมัด">หยดหลังป้องกันเห็บหมัด</option>
                    <option value="ถ่ายพยาธิ">ถ่ายพยาธิ</option>
                    <option value="วัคซีนเพิ่มเติม">วัคซีนเพิ่มเติม (พิมพ์ระบุเอง)</option>
                  </select>
                </div>

                {selectedType === "วัคซีนเพิ่มเติม" && (
                  <div className="bv-field">
                    <label className="bv-label">ระบุชื่อบริการ / วัคซีน *</label>
                    <input type="text" className="bv-input" value={customVaccineName} onChange={(e) => setCustomVaccineName(e.target.value)} placeholder="เช่น วัคซีนลิวคีเมีย" />
                  </div>
                )}

                <div className="bv-grid2">
                  <div className="bv-field" style={{ marginBottom: 0 }}>
                    <label className="bv-label">วันที่รับบริการ *</label>
                    <input type="date" className="bv-input" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} required />
                  </div>
                  <div className="bv-field" style={{ marginBottom: 0 }}>
                    <label className="bv-label">วันนัดครั้งถัดไป <span className="opt">(ถ้ามี)</span></label>
                    <input type="date" className="bv-input" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* การ์ด 2: เลือกสมาชิก */}
              <div className="bv-card">
                <div className="bv-members-head">
                  <div>
                    <div className="bv-card-title" style={{ marginBottom: 4 }}><span className="bv-card-icon"><Icon.Paw /></span> เลือกสมาชิก</div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: F.muted, marginLeft: 2 }}>เลือกเด็กๆ ที่ไปรับบริการด้วยกัน *</p>
                  </div>
                  {pets.length > 0 && (
                    <button type="button" className="bv-selectall" onClick={selectAllPets}>
                      {selectedPetIds.length === pets.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                    </button>
                  )}
                </div>

                {pets.length === 0 ? (
                  <div className="bv-empty">ยังไม่มีสัตว์เลี้ยง — เพิ่มสัตว์เลี้ยงก่อนนะครับ 🐾</div>
                ) : (
                  <div className="bv-pets-grid">
                    {pets.map((pet) => {
                      const isSelected = selectedPetIds.includes(pet.id);
                      return (
                        <div key={pet.id} className={`bv-pet ${isSelected ? 'sel' : ''}`} onClick={() => togglePetSelection(pet.id)}>
                          <div className="bv-pet-avatar-wrap">
                            <div className="bv-pet-avatar">
                              {pet.image_url ? <img src={pet.image_url} alt={pet.name} /> : '🐾'}
                            </div>
                            <div className="bv-pet-check"><Icon.Check /></div>
                          </div>
                          <span className="bv-pet-name">{pet.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Save bar */}
          <div className="bv-savebar">
            <div className="bv-savebar-inner">
              <button type="button" className="bv-btn bv-btn-cancel" onClick={() => router.back()}>ยกเลิก</button>
              <button type="button" className="bv-btn bv-btn-save" onClick={handleSubmit} disabled={saving || selectedPetIds.length === 0}>
                <Icon.Save /> {saving ? "กำลังบันทึก..." : `บันทึกประวัติ (${selectedPetIds.length} ตัว)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}