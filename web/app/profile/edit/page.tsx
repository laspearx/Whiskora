"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";
import PageLoader from '@/app/components/PageLoader';
import { useWorkspace } from "@/app/contexts/WorkspaceContext";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

export default function EditProfilePage() {
  const router = useRouter();
  const { refreshWorkspaces } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent('/profile/edit')}`); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (data) {
        setUsername(data.username || "");
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || null);
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImageSrc(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_ca: any, cap: any) => setCroppedAreaPixels(cap), []);

  const getCroppedImg = async (src: string, pc: any): Promise<Blob> => {
    const image = new Image(); image.src = src;
    await new Promise((res) => (image.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = pc.width; canvas.height = pc.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(image, pc.x, pc.y, pc.width, pc.height, 0, 0, pc.width, pc.height);
    return new Promise((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("empty")), "image/jpeg", 0.9));
  };

  const handleUploadCropped = async () => {
    try {
      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !imageSrc || !croppedAreaPixels) return;
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
      const filePath = `${session.user.id}/profile.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      setImageSrc(null);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally { setIsUploading(false); }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("profiles").upsert({
      id: session?.user.id,
      username, full_name: fullName, avatar_url: avatarUrl, phone, address,
      updated_at: new Date(),
    });
    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setSaving(false);
    } else {
      await refreshWorkspaces();
      router.replace("/profile");
      router.refresh();
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pe-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .pe-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .pe-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .pe-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .pe-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .pe-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .pe-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .pe-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 22px; }
        .pe-photo { position: relative; }
        .pe-photo-circle { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 3px solid white; box-shadow: 0 4px 16px rgba(232,70,119,0.15); display: flex; align-items: center; justify-content: center; font-size: 44px; cursor: pointer; transition: all .18s; }
        .pe-photo-circle:hover { box-shadow: 0 6px 22px rgba(232,70,119,0.25); }
        .pe-photo-circle img { width: 100%; height: 100%; object-fit: cover; }
        .pe-photo-btn { position: absolute; bottom: 2px; right: 2px; width: 38px; height: 38px; border-radius: 50%; background: ${F.pink}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
        .pe-photo-btn:hover { background: #D63F6A; }
        .pe-photo-btn:active { transform: scale(0.9); }
        .pe-photo-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; letter-spacing: 0.04em; }
        .pe-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; }
        .pe-field { margin-bottom: 16px; }
        .pe-field:last-child { margin-bottom: 0; }
        .pe-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .pe-label .opt { color: ${F.muted}; font-weight: 500; }
        .pe-input, .pe-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .pe-input:focus, .pe-textarea:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .pe-textarea { resize: none; }
        .pe-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .pe-savebar-inner { max-width: 600px; margin: 0 auto; display: flex; gap: 12px; }
        .pe-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
        .pe-btn-cancel { flex: 0 0 auto; padding: 14px 22px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        .pe-btn-cancel:hover { background: ${F.line}; }
        .pe-btn-save { flex: 1; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .pe-btn-save:hover { background: #D63F6A; }
        .pe-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        /* crop modal */
        .pe-modal { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); padding: 16px; }
        .pe-modal-card { background: white; width: 100%; max-width: 380px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .pe-crop-area { position: relative; width: 100%; height: 320px; background: #111; }
        .pe-modal-body { padding: 20px; }
        .pe-zoom { width: 100%; accent-color: ${F.pink}; margin-bottom: 16px; }
        .pe-modal-btns { display: flex; gap: 10px; }
      `}</style>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="pe-page">
          <div className="pe-body">
            <div className="pe-header">
              <button className="pe-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="pe-title">แก้ไขโปรไฟล์</h1>
                <p className="pe-sub">อัปเดตข้อมูลส่วนตัวของคุณ</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              {/* รูปโปรไฟล์ */}
              <div className="pe-photo-wrap">
                <div className="pe-photo">
                  <div className="pe-photo-circle" onClick={() => fileInputRef.current?.click()}>
                    {avatarUrl ? <img src={avatarUrl} alt="โปรไฟล์" /> : '👤'}
                  </div>
                  <button type="button" className="pe-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} style={{ display: 'none' }} />
                </div>
                <p className="pe-photo-hint">แตะเพื่อเปลี่ยนรูปโปรไฟล์</p>
              </div>

              {/* Connected accounts shortcut */}
              <Link
                href="/profile/connections"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', background: 'white', border: `1px solid ${F.lineMid}`,
                  borderRadius: 20, marginBottom: 16, textDecoration: 'none', transition: 'background .15s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = F.line)}
                onMouseOut={e => (e.currentTarget.style.background = 'white')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: F.pinkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: F.ink, margin: 0 }}>บัญชีที่เชื่อมต่อ</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: F.muted, margin: 0, marginTop: 1 }}>Google, LINE และช่องทางอื่น ๆ</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={F.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>

              <div className="pe-card">
                <div className="pe-field">
                  <label className="pe-label">ชื่อ-นามสกุล</label>
                  <input className="pe-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="เช่น สมชาย ใจดี" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">ชื่อผู้ใช้ (Username)</label>
                  <input className="pe-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="เช่น somchai_pet" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">เบอร์โทรศัพท์</label>
                  <input type="tel" className="pe-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">ที่อยู่ <span className="opt">(จังหวัด/พื้นที่)</span></label>
                  <textarea className="pe-textarea" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="เช่น กรุงเทพมหานคร" />
                </div>
              </div>
            </form>
          </div>

          <div className="pe-savebar">
            <div className="pe-savebar-inner">
              <button type="button" className="pe-btn pe-btn-cancel" onClick={() => router.back()}>ยกเลิก</button>
              <button type="button" className="pe-btn pe-btn-save" onClick={handleSave} disabled={saving}>
                <Icon.Save /> {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      )}

      {imageSrc && (
        <div className="pe-modal">
          <div className="pe-modal-card">
            <div className="pe-crop-area">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="pe-modal-body">
              <input type="range" className="pe-zoom" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} />
              <div className="pe-modal-btns">
                <button type="button" className="pe-btn pe-btn-cancel" style={{ flex: 1 }} onClick={() => setImageSrc(null)}>ยกเลิก</button>
                <button type="button" className="pe-btn pe-btn-save" onClick={handleUploadCropped} disabled={isUploading}>
                  {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
