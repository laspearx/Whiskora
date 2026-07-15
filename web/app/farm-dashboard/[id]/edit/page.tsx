"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Cropper from "react-easy-crop";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  line: "#F3F4F6", lineMid: "#E5E7EB",
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Trash: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

export default function EditFarmPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [farmName, setFarmName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // avatar crop state
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarAreaPx, setAvatarAreaPx] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // cover crop state
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverAreaPx, setCoverAreaPx] = useState<any>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const onAvatarCropComplete = useCallback((_: any, px: any) => setAvatarAreaPx(px), []);
  const onCoverCropComplete = useCallback((_: any, px: any) => setCoverAreaPx(px), []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("farms").select("*").eq("id", farmId).eq("user_id", session.user.id).single();
      if (!data) { router.push("/partner"); return; }
      setFarmName(data.farm_name || "");
      setBio(data.bio || "");
      setPhone(data.phone || "");
      setImageUrl(data.image_url || null);
      setCoverUrl(data.cover_url || null);
      setLoading(false);
    };
    if (farmId) load();
  }, [farmId, router]);

  const getCroppedImg = async (src: string, px: any, round = false): Promise<Blob> => {
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = src; });
    const canvas = document.createElement("canvas");
    canvas.width = px.width; canvas.height = px.height;
    const ctx = canvas.getContext("2d")!;
    if (round) {
      ctx.beginPath();
      ctx.arc(px.width / 2, px.height / 2, px.width / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
    return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error("empty")), "image/jpeg", 0.92));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setter(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadToStorage = async (blob: Blob, path: string) => {
    const file = new File([blob], path.split("/").pop()!, { type: "image/jpeg" });
    const { error } = await supabase.storage.from("partner-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("partner-photos").getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  };

  const handleUploadAvatar = async () => {
    if (!avatarSrc || !avatarAreaPx) return;
    try {
      setUploadingAvatar(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const blob = await getCroppedImg(avatarSrc, avatarAreaPx, true);
      const url = await uploadToStorage(blob, `farms/${session.user.id}/${farmId}-logo-${Date.now()}.jpg`);
      setImageUrl(url);
      setAvatarSrc(null);
    } catch { alert("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ"); }
    finally { setUploadingAvatar(false); }
  };

  const handleUploadCover = async () => {
    if (!coverSrc || !coverAreaPx) return;
    try {
      setUploadingCover(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const blob = await getCroppedImg(coverSrc, coverAreaPx);
      const url = await uploadToStorage(blob, `farms/${session.user.id}/${farmId}-cover-${Date.now()}.jpg`);
      setCoverUrl(url);
      setCoverSrc(null);
    } catch { alert("อัปโหลดภาพปกไม่สำเร็จ"); }
    finally { setUploadingCover(false); }
  };

  const handleSave = async () => {
    if (!farmName.trim()) { alert("กรุณาใส่ชื่อฟาร์มด้วยครับ"); return; }
    setSaving(true);
    const { error } = await supabase.from("farms").update({
      farm_name: farmName.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      image_url: imageUrl,
      cover_url: coverUrl,
      updated_at: new Date(),
    }).eq("id", farmId);
    if (error) { alert("บันทึกไม่สำเร็จ: " + error.message); setSaving(false); }
    else { router.back(); router.refresh(); }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .fe-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: #FDF6F8; }
        .fe-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }

        .fe-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .fe-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .fe-back:hover { background: ${F.line}; color: ${F.ink}; transform: translateX(-1px); }
        .fe-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .fe-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }

        /* ── Cover image ── */
        .fe-cover-wrap { position: relative; margin-bottom: 24px; }
        .fe-cover-label { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 8px; letter-spacing: 0.04em; text-transform: uppercase; }
        .fe-cover-box { position: relative; width: 100%; aspect-ratio: 3/1; border-radius: 18px; overflow: hidden; background: ${F.pinkSoft}; border: 2px dashed ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .15s; }
        .fe-cover-box:hover { border-color: ${F.pink}; }
        .fe-cover-box img { width: 100%; height: 100%; object-fit: cover; }
        .fe-cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: ${F.muted}; }
        .fe-cover-placeholder-icon { width: 48px; height: 48px; border-radius: 14px; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); color: ${F.pink}; }
        .fe-cover-placeholder-text { font-size: 13px; font-weight: 600; }
        .fe-cover-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; }
        .fe-cover-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 10px; border: none; cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit; transition: all .15s; }
        .fe-cover-btn-edit { background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); color: ${F.ink}; }
        .fe-cover-btn-edit:hover { background: white; }
        .fe-cover-btn-del { background: rgba(239,68,68,0.12); color: #DC2626; }
        .fe-cover-btn-del:hover { background: rgba(239,68,68,0.2); }

        /* ── Avatar ── */
        .fe-avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
        .fe-avatar-wrap { position: relative; }
        .fe-avatar-circle { width: 110px; height: 110px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 3px solid white; box-shadow: 0 4px 16px rgba(232,70,119,0.15); display: flex; align-items: center; justify-content: center; font-size: 40px; cursor: pointer; transition: box-shadow .18s; }
        .fe-avatar-circle:hover { box-shadow: 0 6px 22px rgba(232,70,119,0.25); }
        .fe-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .fe-avatar-cam { position: absolute; bottom: 2px; right: 2px; width: 36px; height: 36px; border-radius: 50%; background: ${F.pink}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
        .fe-avatar-cam:hover { background: #D63F6A; }
        .fe-avatar-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; letter-spacing: 0.04em; }
        .fe-avatar-del { margin-top: 6px; display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; background: none; border: 1px solid #FCA5A5; color: #DC2626; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .15s; }
        .fe-avatar-del:hover { background: #FEF2F2; }

        /* ── Form card ── */
        .fe-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .fe-card-title { font-size: 13px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; }
        .fe-field { margin-bottom: 16px; }
        .fe-field:last-child { margin-bottom: 0; }
        .fe-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .fe-label .opt { color: ${F.muted}; font-weight: 500; }
        .fe-input, .fe-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .fe-input:focus, .fe-textarea:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fe-textarea { resize: none; }

        /* ── Save bar ── */
        .fe-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .fe-savebar-inner { max-width: 600px; margin: 0 auto; display: flex; gap: 12px; }
        .fe-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
        .fe-btn-cancel { flex: 0 0 auto; padding: 14px 22px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        .fe-btn-cancel:hover { background: ${F.line}; }
        .fe-btn-save { flex: 1; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .fe-btn-save:hover { background: #D63F6A; }
        .fe-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Crop modal ── */
        .fe-modal { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); padding: 16px; }
        .fe-modal-card { background: white; width: 100%; max-width: 400px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .fe-crop-area { position: relative; width: 100%; background: #111; }
        .fe-crop-area-sq { height: 300px; }
        .fe-crop-area-wide { height: 200px; }
        .fe-modal-body { padding: 20px; }
        .fe-zoom { width: 100%; accent-color: ${F.pink}; margin-bottom: 16px; }
        .fe-modal-btns { display: flex; gap: 10px; }
      `}</style>

      <div className="fe-page">
        <div className="fe-body">
          <div className="fe-header">
            <button className="fe-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="fe-title">แก้ไขข้อมูลฟาร์ม</h1>
              <p className="fe-sub">อัปเดตรายละเอียดและรูปภาพของฟาร์ม</p>
            </div>
          </div>

          {/* ── ภาพปก ── */}
          <div className="fe-cover-wrap">
            <p className="fe-cover-label">ภาพปกฟาร์ม</p>
            <div className="fe-cover-box" onClick={() => !coverUrl && coverInputRef.current?.click()}>
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="ภาพปก" />
                  <div className="fe-cover-actions">
                    <button type="button" className="fe-cover-btn fe-cover-btn-edit" onClick={e => { e.stopPropagation(); coverInputRef.current?.click(); }}>
                      <Icon.Camera /> เปลี่ยน
                    </button>
                    <button type="button" className="fe-cover-btn fe-cover-btn-del" onClick={e => { e.stopPropagation(); setCoverUrl(null); }}>
                      <Icon.Trash /> ลบ
                    </button>
                  </div>
                </>
              ) : (
                <div className="fe-cover-placeholder">
                  <div className="fe-cover-placeholder-icon"><Icon.Camera /></div>
                  <p className="fe-cover-placeholder-text">แตะเพื่อเพิ่มภาพปก</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={coverInputRef} onChange={e => onFileChange(e, setCoverSrc)} onClick={e => (e.currentTarget.value = "")} style={{ display: 'none' }} />
          </div>

          {/* ── ภาพโลโก้ฟาร์ม ── */}
          <div className="fe-avatar-section">
            <div className="fe-avatar-wrap">
              <div className="fe-avatar-circle" onClick={() => avatarInputRef.current?.click()}>
                {imageUrl
                  ? <img src={imageUrl} alt="โลโก้ฟาร์ม" />
                  : <img src="/icons/icon-farm.png" alt="" style={{ width: 52, height: 52, objectFit: 'contain', opacity: 0.4 }} />}
              </div>
              <button type="button" className="fe-avatar-cam" onClick={() => avatarInputRef.current?.click()}><Icon.Camera /></button>
              <input type="file" accept="image/*" ref={avatarInputRef} onChange={e => onFileChange(e, setAvatarSrc)} onClick={e => (e.currentTarget.value = "")} style={{ display: 'none' }} />
            </div>
            <p className="fe-avatar-hint">โลโก้ / รูปโปรไฟล์ฟาร์ม</p>
            {imageUrl && (
              <button type="button" className="fe-avatar-del" onClick={() => setImageUrl(null)}>
                <Icon.Trash /> ลบรูปโปรไฟล์
              </button>
            )}
          </div>

          {/* ── ข้อมูลหลัก ── */}
          <div className="fe-card">
            <p className="fe-card-title">ข้อมูลฟาร์ม</p>
            <div className="fe-field">
              <label className="fe-label">ชื่อฟาร์ม</label>
              <input className="fe-input" value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="เช่น Happy Paws Farm" />
            </div>
            <div className="fe-field">
              <label className="fe-label">เบอร์โทรศัพท์ <span className="opt">(ไม่บังคับ)</span></label>
              <input type="tel" className="fe-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" />
            </div>
            <div className="fe-field">
              <label className="fe-label">คำอธิบายฟาร์ม <span className="opt">(ไม่บังคับ)</span></label>
              <textarea className="fe-textarea" rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="เล่าเรื่องราวของฟาร์มคุณ สิ่งที่ทำให้ฟาร์มคุณพิเศษ..." />
            </div>
          </div>
        </div>

        {/* ── Save bar ── */}
        <div className="fe-savebar">
          <div className="fe-savebar-inner">
            <button type="button" className="fe-btn fe-btn-cancel" onClick={() => router.back()}>ยกเลิก</button>
            <button type="button" className="fe-btn fe-btn-save" onClick={handleSave} disabled={saving}>
              <Icon.Save /> {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Crop modal: avatar (1:1 round) ── */}
      {avatarSrc && (
        <div className="fe-modal">
          <div className="fe-modal-card">
            <div className="fe-crop-area fe-crop-area-sq">
              <Cropper image={avatarSrc} crop={avatarCrop} zoom={avatarZoom} aspect={1} cropShape="round"
                onCropChange={setAvatarCrop} onCropComplete={onAvatarCropComplete}
                onZoomChange={setAvatarZoom} />
            </div>
            <div className="fe-modal-body">
              <input type="range" className="fe-zoom" value={avatarZoom} min={1} max={3} step={0.1} onChange={e => setAvatarZoom(Number(e.target.value))} />
              <div className="fe-modal-btns">
                <button className="fe-btn fe-btn-cancel" style={{ flex: 1 }} onClick={() => setAvatarSrc(null)}>ยกเลิก</button>
                <button className="fe-btn fe-btn-save" onClick={handleUploadAvatar} disabled={uploadingAvatar}>
                  {uploadingAvatar ? "กำลังอัปโหลด..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Crop modal: cover (3:1 wide) ── */}
      {coverSrc && (
        <div className="fe-modal">
          <div className="fe-modal-card" style={{ maxWidth: 480 }}>
            <div className="fe-crop-area fe-crop-area-wide">
              <Cropper image={coverSrc} crop={coverCrop} zoom={coverZoom} aspect={3}
                onCropChange={setCoverCrop} onCropComplete={onCoverCropComplete}
                onZoomChange={setCoverZoom} />
            </div>
            <div className="fe-modal-body">
              <input type="range" className="fe-zoom" value={coverZoom} min={1} max={3} step={0.1} onChange={e => setCoverZoom(Number(e.target.value))} />
              <div className="fe-modal-btns">
                <button className="fe-btn fe-btn-cancel" style={{ flex: 1 }} onClick={() => setCoverSrc(null)}>ยกเลิก</button>
                <button className="fe-btn fe-btn-save" onClick={handleUploadCover} disabled={uploadingCover}>
                  {uploadingCover ? "กำลังอัปโหลด..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
