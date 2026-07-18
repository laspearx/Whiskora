"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  line: "#f3dde3", bg: "#fffafc",
};

const ACTIVITY_TYPES = ["หาหมอ", "หยดเห็บหมัด", "ถ่ายพยาธิ", "อาหาร", "นิสัย", "ทั่วไป", "นัดหมาย", "ประกวด"];

interface Pet { id: number; name: string; image_url: string | null; gender: string | null; }

function ActivityCreateContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const presetPetId = searchParams.get("petId");

  const [activityType, setActivityType] = useState("ทั่วไป");
  const [title, setTitle]               = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription]  = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [pets, setPets]                 = useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [presetPetName, setPresetPetName]   = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (presetPetId) {
        const { data } = await supabase.from("pets").select("id, name").eq("id", presetPetId).single();
        if (data) { setPresetPetName(data.name || ""); setSelectedPetIds([data.id]); }
      } else {
        const { data } = await supabase.from("pets").select("id, name, image_url, gender").eq("farm_id", farmId).order("name");
        if (data) setPets(data);
      }
    };
    load();
  }, [farmId, presetPetId]);

  const togglePet = (id: number) =>
    setSelectedPetIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!title.trim()) { setError("กรุณาระบุหัวข้อกิจกรรม"); return; }
    if (!activityDate)  { setError("กรุณาเลือกวันที่"); return; }
    if (selectedPetIds.length === 0 && !presetPetId) { setError("กรุณาเลือกสัตว์อย่างน้อย 1 ตัว"); return; }
    setSaving(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const petIds = presetPetId ? [parseInt(presetPetId)] : selectedPetIds;
      const rows = petIds.map(petId => ({
        pet_id:        petId,
        activity_type: activityType,
        title:         title.trim(),
        description:   description.trim() || null,
        activity_date: activityDate,
      }));
      const { error: err } = await supabase.from("pet_activities").insert(rows);
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
        .ac-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .ac-body { max-width: 480px; margin: 0 auto; padding: 20px 16px 100px; }
        .ac-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .ac-back { width: 38px; height: 38px; border-radius: 11px; background: white; border: 1px solid ${F.line}; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; flex-shrink: 0; }
        .ac-title { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }
        .ac-label { font-size: 12px; font-weight: 600; color: ${F.inkSoft}; margin-bottom: 8px; margin-top: 18px; }
        .ac-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .ac-chip { padding: 7px 14px; border-radius: 20px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 12px; font-weight: 600; color: ${F.inkSoft}; cursor: pointer; transition: all .15s; }
        .ac-chip.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pink}; }
        .ac-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .ac-input:focus { border-color: ${F.pink}; }
        .ac-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; color: ${F.ink}; outline: none; transition: border-color .15s; resize: none; min-height: 80px; }
        .ac-textarea:focus { border-color: ${F.pink}; }
        .ac-preset-pet { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: ${F.pinkSoft}; border: 1.5px solid ${F.pinkBorder}; font-size: 13px; font-weight: 600; color: ${F.pink}; }

        /* Pet multi-select */
        .ac-pet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .ac-pet-chip { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 6px 8px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; cursor: pointer; transition: all .15s; text-align: center; }
        .ac-pet-chip:hover { border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; }
        .ac-pet-chip.selected { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .ac-pet-photo { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: ${F.line}; display: flex; align-items: center; justify-content: center; border: 2px solid ${F.line}; }
        .ac-pet-chip.selected .ac-pet-photo { border-color: ${F.pink}; }
        .ac-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ac-pet-name { font-size: 11px; font-weight: 600; color: ${F.inkSoft}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
        .ac-pet-chip.selected .ac-pet-name { color: ${F.pink}; }
        .ac-pet-check { position: absolute; top: 5px; right: 5px; width: 16px; height: 16px; border-radius: 50%; background: ${F.pink}; display: flex; align-items: center; justify-content: center; }
        .ac-sel-badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; color: ${F.pink}; background: ${F.pinkSoft}; padding: 3px 9px; border-radius: 999px; margin-left: 6px; }

        .ac-error { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: #FEF2F2; border: 1px solid #FECACA; font-size: 12px; color: #DC2626; font-weight: 500; }
        .ac-save { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px calc(env(safe-area-inset-bottom,0px) + 12px); background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-top: 1px solid ${F.line}; z-index: 60; }
        .ac-save-btn { width: 100%; max-width: 480px; margin: 0 auto; display: block; padding: 14px; border-radius: 14px; background: ${F.pink}; color: white; font-family: inherit; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: opacity .15s; }
        .ac-save-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div className="ac-page">
        <div className="ac-body">
          <div className="ac-header">
            <button className="ac-back" onClick={() => router.back()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="ac-title">บันทึกกิจกรรม</h1>
          </div>

          <div className="ac-label">ประเภทกิจกรรม</div>
          <div className="ac-chips">
            {ACTIVITY_TYPES.map(t => (
              <button key={t} type="button" className={`ac-chip ${activityType === t ? "active" : ""}`} onClick={() => setActivityType(t)}>{t}</button>
            ))}
          </div>

          <div className="ac-label">หัวข้อ</div>
          <input className="ac-input" placeholder="เช่น พาไปตรวจสุขภาพ, ชนะเลิศประกวด..." value={title} onChange={e => setTitle(e.target.value)} />

          <div className="ac-label">วันที่</div>
          <input className="ac-input" type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} />

          {presetPetId ? (
            <>
              <div className="ac-label">สัตว์</div>
              <div className="ac-preset-pet">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {presetPetName || "กำลังโหลด..."}
              </div>
            </>
          ) : pets.length > 0 && (
            <>
              <div className="ac-label" style={{ display: "flex", alignItems: "center" }}>
                สัตว์ที่เกี่ยวข้อง
                {selectedPetIds.length > 0 && <span className="ac-sel-badge">{selectedPetIds.length} ตัว</span>}
              </div>
              <div className="ac-pet-grid">
                {pets.map(pet => {
                  const sel = selectedPetIds.includes(pet.id);
                  const isMale = pet.gender === "male" || pet.gender === "ตัวผู้";
                  return (
                    <div key={pet.id} className={`ac-pet-chip ${sel ? "selected" : ""}`} onClick={() => togglePet(pet.id)}>
                      <div className="ac-pet-photo">
                        {pet.image_url
                          ? <img src={pet.image_url} alt={pet.name} />
                          : <img src={isMale ? "/icons/icon-men.png" : "/icons/icon-women.png"} alt="" style={{ width: 24, height: 24, objectFit: "contain", opacity: 0.45 }} />
                        }
                      </div>
                      <div className="ac-pet-name">{pet.name || "ไม่มีชื่อ"}</div>
                      {sel && (
                        <div className="ac-pet-check">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="ac-label">รายละเอียด (ไม่บังคับ)</div>
          <textarea className="ac-textarea" placeholder="บันทึกเพิ่มเติม..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />

          {error && <div className="ac-error">{error}</div>}
        </div>
      </div>

      <div className="ac-save">
        <button className="ac-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
        </button>
      </div>
    </>
  );
}

export default function ActivityCreatePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ActivityCreateContent />
    </Suspense>
  );
}
