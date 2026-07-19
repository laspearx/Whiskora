"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  line: "#f3dde3", bg: "#fffafc",
  amber: "#D97706", amberSoft: "#FFFBEB",
};

interface Pet { id: number; name: string; image_url: string | null; gender: string | null; }

function ActivityCreateContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const presetPetId = searchParams.get("petId");

  const [activityType, setActivityType] = useState<"ความสำเร็จ" | "อื่นๆ">("ความสำเร็จ");
  const [customType, setCustomType]     = useState("");
  const [title, setTitle]               = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription]  = useState("");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [pets, setPets]                 = useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);
  const [presetPetName, setPresetPetName]   = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

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

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await compressImage(f, 1200, 0.78);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const removeImage = () => { setImageFile(null); setImagePreview(null); };

  const handleSave = async () => {
    const finalTitle = activityType === "อื่นๆ" ? (customType.trim() || title.trim()) : title.trim();
    if (!finalTitle) { setError("กรุณาระบุหัวข้อ"); return; }
    if (!activityDate) { setError("กรุณาเลือกวันที่"); return; }
    const petIds = presetPetId ? [parseInt(presetPetId)] : selectedPetIds;
    if (petIds.length === 0) { setError("กรุณาเลือกสัตว์อย่างน้อย 1 ตัว"); return; }
    setSaving(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const path = `activities/${session.user.id}/${Date.now()}.jpg`;
        const { data: up } = await supabase.storage.from("pet-photos").upload(path, imageFile, { upsert: true });
        if (up) {
          const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(up.path);
          uploadedImageUrl = publicUrl;
        }
      }

      const rows = petIds.map(petId => ({
        pet_id:        petId,
        activity_type: activityType,
        title:         activityType === "อื่นๆ" ? (customType.trim() || "อื่นๆ") : title.trim(),
        description:   activityType === "อื่นๆ" && customType.trim() ? title.trim() || description.trim() || null : description.trim() || null,
        activity_date: activityDate,
        image_url:     uploadedImageUrl,
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
        .ac-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ac-type-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 12px; border-radius: 14px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; font-weight: 600; color: ${F.inkSoft}; cursor: pointer; transition: all .15s; }
        .ac-type-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pink}; }
        .ac-type-icon { font-size: 24px; line-height: 1; }
        .ac-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .ac-input:focus { border-color: ${F.pink}; }
        .ac-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; color: ${F.ink}; outline: none; transition: border-color .15s; resize: none; min-height: 70px; }
        .ac-textarea:focus { border-color: ${F.pink}; }
        .ac-preset-pet { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: ${F.pinkSoft}; border: 1.5px solid ${F.pinkBorder}; font-size: 13px; font-weight: 600; color: ${F.pink}; }
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
        .ac-img-zone { border: 2px dashed ${F.line}; border-radius: 14px; padding: 22px; text-align: center; cursor: pointer; background: white; transition: all .15s; }
        .ac-img-zone:hover { border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; }
        .ac-img-zone-text { font-size: 13px; font-weight: 600; color: ${F.muted}; margin-top: 6px; }
        .ac-img-zone-sub { font-size: 11px; color: ${F.muted}; margin-top: 2px; }
        .ac-img-preview { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; background: ${F.line}; }
        .ac-img-preview img { width: 100%; height: 100%; object-fit: cover; }
        .ac-img-remove { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,.55); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
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
          <div className="ac-type-grid">
            <button type="button" className={`ac-type-btn ${activityType === "ความสำเร็จ" ? "active" : ""}`} onClick={() => setActivityType("ความสำเร็จ")}>
              <span className="ac-type-icon">🏆</span>ความสำเร็จ
            </button>
            <button type="button" className={`ac-type-btn ${activityType === "อื่นๆ" ? "active" : ""}`} onClick={() => setActivityType("อื่นๆ")}>
              <span className="ac-type-icon">📝</span>อื่นๆ
            </button>
          </div>

          {activityType === "อื่นๆ" && (
            <>
              <div className="ac-label">เกี่ยวกับอะไร</div>
              <input className="ac-input" placeholder="เช่น ออกโฆษณา, เปิดตัวครั้งแรก..." value={customType} onChange={e => setCustomType(e.target.value)} />
            </>
          )}

          <div className="ac-label">{activityType === "ความสำเร็จ" ? "ชื่อรางวัล / ความสำเร็จ" : "รายละเอียดเพิ่มเติม (ไม่บังคับ)"}</div>
          <input className="ac-input" placeholder={activityType === "ความสำเร็จ" ? "เช่น ชนะเลิศ Best of Breed, ได้รับรางวัล..." : "รายละเอียด..."} value={title} onChange={e => setTitle(e.target.value)} />

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

          <div className="ac-label">รูปภาพ (ไม่บังคับ)</div>
          {imagePreview ? (
            <div className="ac-img-preview">
              <img src={imagePreview} alt="preview" />
              <button className="ac-img-remove" onClick={removeImage}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <div className="ac-img-zone" onClick={() => imgRef.current?.click()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={F.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <div className="ac-img-zone-text">แตะเพื่ออัพโหลดรูป</div>
              <div className="ac-img-zone-sub">รูปถูกบีบอัดอัตโนมัติก่อนบันทึก</div>
            </div>
          )}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

          {activityType === "ความสำเร็จ" && (
            <>
              <div className="ac-label">หมายเหตุ (ไม่บังคับ)</div>
              <textarea className="ac-textarea" placeholder="รายละเอียดเพิ่มเติม..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </>
          )}

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
