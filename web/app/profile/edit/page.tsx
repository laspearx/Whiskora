"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";

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
      alert("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธ");
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
      alert("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ");
      setSaving(false);
    } else {
      // เนเธเน replace: เธซเธฅเธฑเธเธเธฑเธเธ—เธถเธเน€เธ”เนเธเนเธเนเธเธฃเนเธเธฅเน เนเธฅเธฐเธ–เธญเธ”เธซเธเนเธฒเนเธเนเนเธเธญเธญเธเธเธฒเธ history
      // โ’ เธเธ”เธขเนเธญเธเธเธฅเธฑเธเธเธฒเธเนเธเธฃเนเธเธฅเนเธเธฐเธเนเธฒเธกเธซเธเนเธฒเนเธเนเนเธ เนเธเธซเธเนเธฒเธเนเธญเธเธซเธเนเธฒเน€เธฅเธข
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
        .pe-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .pe-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
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
        .pe-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .pe-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: pespin 1s linear infinite; }
        @keyframes pespin { to { transform: rotate(360deg); } }
        /* crop modal */
        .pe-modal { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); padding: 16px; }
        .pe-modal-card { background: white; width: 100%; max-width: 380px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .pe-crop-area { position: relative; width: 100%; height: 320px; background: #111; }
        .pe-modal-body { padding: 20px; }
        .pe-zoom { width: 100%; accent-color: ${F.pink}; margin-bottom: 16px; }
        .pe-modal-btns { display: flex; gap: 10px; }
      `}</style>

      {loading ? (
        <div className="pe-loading">
          <div className="pe-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>เธเธณเธฅเธฑเธเนเธซเธฅเธ”...</p>
        </div>
      ) : (
        <div className="pe-page">
          <div className="pe-body">
            <div className="pe-header">
              <button className="pe-back" onClick={() => router.back()} aria-label="เธขเนเธญเธเธเธฅเธฑเธ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="pe-title">เนเธเนเนเธเนเธเธฃเนเธเธฅเน</h1>
                <p className="pe-sub">เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅเธชเนเธงเธเธ•เธฑเธงเธเธญเธเธเธธเธ“</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              {/* เธฃเธนเธเนเธเธฃเนเธเธฅเน */}
              <div className="pe-photo-wrap">
                <div className="pe-photo">
                  <div className="pe-photo-circle" onClick={() => fileInputRef.current?.click()}>
                    {avatarUrl ? <img src={avatarUrl} alt="เนเธเธฃเนเธเธฅเน" /> : '๐‘ค'}
                  </div>
                  <button type="button" className="pe-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} style={{ display: 'none' }} />
                </div>
                <p className="pe-photo-hint">เนเธ•เธฐเน€เธเธทเนเธญเน€เธเธฅเธตเนเธขเธเธฃเธนเธเนเธเธฃเนเธเธฅเน</p>
              </div>

              <div className="pe-card">
                <div className="pe-field">
                  <label className="pe-label">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</label>
                  <input className="pe-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="เน€เธเนเธ เธชเธกเธเธฒเธข เนเธเธ”เธต" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">เธเธทเนเธญเธเธนเนเนเธเน (Username)</label>
                  <input className="pe-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="เน€เธเนเธ somchai_pet" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน</label>
                  <input type="tel" className="pe-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" />
                </div>
                <div className="pe-field">
                  <label className="pe-label">เธ—เธตเนเธญเธขเธนเน <span className="opt">(เธเธฑเธเธซเธงเธฑเธ”/เธเธทเนเธเธ—เธตเน)</span></label>
                  <textarea className="pe-textarea" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="เน€เธเนเธ เธเธฃเธธเธเน€เธ—เธเธกเธซเธฒเธเธเธฃ" />
                </div>
              </div>
            </form>
          </div>

          <div className="pe-savebar">
            <div className="pe-savebar-inner">
              <button type="button" className="pe-btn pe-btn-cancel" onClick={() => router.back()}>เธขเธเน€เธฅเธดเธ</button>
              <button type="button" className="pe-btn pe-btn-save" onClick={handleSave} disabled={saving}>
                <Icon.Save /> {saving ? "เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ..." : "เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ"}
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
                <button type="button" className="pe-btn pe-btn-cancel" style={{ flex: 1 }} onClick={() => setImageSrc(null)}>เธขเธเน€เธฅเธดเธ</button>
                <button type="button" className="pe-btn pe-btn-save" onClick={handleUploadCropped} disabled={isUploading}>
                  {isUploading ? 'เธเธณเธฅเธฑเธเธญเธฑเธเนเธซเธฅเธ”...' : 'เธขเธทเธเธขเธฑเธ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}