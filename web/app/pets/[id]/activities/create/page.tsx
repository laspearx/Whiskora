"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import { useRouter, useParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  line: "#f3dde3", bg: "#fffafc",
};

function PetActivityCreateContent() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [petName, setPetName]           = useState("");
  const [activityType, setActivityType] = useState<"ความสำเร็จ" | "อื่นๆ">("ความสำเร็จ");
  const [customType, setCustomType]     = useState("");
  const [title, setTitle]               = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription]  = useState("");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("pets").select("name").eq("id", petId).single()
      .then(({ data }) => { if (data) setPetName(data.name || ""); });
  }, [petId]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await compressImage(f, 1200, 0.78);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const removeImage = () => { setImageFile(null); setImagePreview(null); };

  const handleSave = async () => {
    const mainTitle = activityType === "อื่นๆ" ? (customType.trim()) : title.trim();
    if (!mainTitle) { setError(activityType === "อื่นๆ" ? "กรุณาระบุว่าเกี่ยวกับอะไร" : "กรุณาระบุชื่อรางวัล/ความสำเร็จ"); return; }
    if (!activityDate) { setError("กรุณาเลือกวันที่"); return; }
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

      const { error: err } = await supabase.from("pet_activities").insert({
        pet_id:        parseInt(petId),
        activity_type: activityType,
        title:         activityType === "อื่นๆ" ? (customType.trim() || "อื่นๆ") : title.trim(),
        description:   activityType === "อื่นๆ" && title.trim() ? title.trim() : (description.trim() || null),
        activity_date: activityDate,
        image_url:     uploadedImageUrl,
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
        .pa-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pa-type-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 12px; border-radius: 14px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; font-weight: 600; color: ${F.inkSoft}; cursor: pointer; transition: all .15s; }
        .pa-type-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pink}; }
        .pa-type-icon { font-size: 24px; line-height: 1; }
        .pa-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .pa-input:focus { border-color: ${F.pink}; }
        .pa-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 13px; color: ${F.ink}; outline: none; transition: border-color .15s; resize: none; min-height: 70px; }
        .pa-textarea:focus { border-color: ${F.pink}; }
        .pa-img-zone { border: 2px dashed ${F.line}; border-radius: 14px; padding: 22px; text-align: center; cursor: pointer; background: white; transition: all .15s; }
        .pa-img-zone:hover { border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; }
        .pa-img-zone-text { font-size: 13px; font-weight: 600; color: ${F.muted}; margin-top: 6px; }
        .pa-img-zone-sub { font-size: 11px; color: ${F.muted}; margin-top: 2px; }
        .pa-img-preview { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; background: ${F.line}; }
        .pa-img-preview img { width: 100%; height: 100%; object-fit: cover; }
        .pa-img-remove { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,.55); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
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
          <div className="pa-type-grid">
            <button type="button" className={`pa-type-btn ${activityType === "ความสำเร็จ" ? "active" : ""}`} onClick={() => setActivityType("ความสำเร็จ")}>
              <span className="pa-type-icon">🏆</span>ความสำเร็จ
            </button>
            <button type="button" className={`pa-type-btn ${activityType === "อื่นๆ" ? "active" : ""}`} onClick={() => setActivityType("อื่นๆ")}>
              <span className="pa-type-icon">📝</span>อื่นๆ
            </button>
          </div>

          {activityType === "อื่นๆ" && (
            <>
              <div className="pa-label">เกี่ยวกับอะไร</div>
              <input className="pa-input" placeholder="เช่น ออกโฆษณา, เปิดตัวครั้งแรก..." value={customType} onChange={e => setCustomType(e.target.value)} />
            </>
          )}

          <div className="pa-label">{activityType === "ความสำเร็จ" ? "ชื่อรางวัล / ความสำเร็จ" : "รายละเอียดเพิ่มเติม (ไม่บังคับ)"}</div>
          <input className="pa-input" placeholder={activityType === "ความสำเร็จ" ? "เช่น ชนะเลิศ Best of Breed..." : "รายละเอียด..."} value={title} onChange={e => setTitle(e.target.value)} />

          <div className="pa-label">วันที่</div>
          <input className="pa-input" type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} />

          <div className="pa-label">รูปภาพ (ไม่บังคับ)</div>
          {imagePreview ? (
            <div className="pa-img-preview">
              <img src={imagePreview} alt="preview" />
              <button className="pa-img-remove" onClick={removeImage}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <div className="pa-img-zone" onClick={() => imgRef.current?.click()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={F.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <div className="pa-img-zone-text">แตะเพื่ออัพโหลดรูป</div>
              <div className="pa-img-zone-sub">รูปถูกบีบอัดอัตโนมัติก่อนบันทึก</div>
            </div>
          )}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

          {activityType === "ความสำเร็จ" && (
            <>
              <div className="pa-label">หมายเหตุ (ไม่บังคับ)</div>
              <textarea className="pa-textarea" placeholder="รายละเอียดเพิ่มเติม..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </>
          )}

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
