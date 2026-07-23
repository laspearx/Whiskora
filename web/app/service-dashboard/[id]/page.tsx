"use client";

import React, { useCallback, useEffect, useState, useRef, Suspense } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { speciesTh } from "@/lib/species";
import PageLoader from '@/app/components/PageLoader';
import { useServiceAccess } from "./layout";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF', pink: '#E84677',
  orange: '#F97316', green: '#16A34A',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Chevron: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, maxDim = 1200): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => { image.onload = () => resolve(); });
  const scale = Math.min(1, maxDim / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85));
}

function ServiceDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";
  const { myRole } = useServiceAccess();
  const canEdit = myRole === "owner" || myRole === "manager";

  const [service, setService] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBookings: 0, pending: 0, today: 0, revenue: 0 });

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "cover" | null>(null);
  const [cropPos, setCropPos] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [cropUploading, setCropUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/service-dashboard/${serviceId}`)}`);
        const { data: serviceData } = await supabase.from("services").select("*").eq("id", serviceId).single();
        if (!serviceData) return router.push("/partner");
        setService(serviceData);
        const today = new Date().toISOString().split("T")[0];
        const { data: bookingsData } = await supabase.from("service_bookings").select("*, pets(name, species)").eq("service_id", serviceId).order("booking_date", { ascending: true });
        if (bookingsData) {
          setBookings(bookingsData);
          setStats({
            totalBookings: bookingsData.length,
            pending: bookingsData.filter((b) => b.status === "pending").length,
            today: bookingsData.filter((b) => b.booking_date === today).length,
            revenue: 0,
          });
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    if (serviceId) fetchData();
  }, [serviceId, router]);

  const openCrop = (file: File, type: "avatar" | "cover") => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropType(type);
      setCropPos({ x: 0, y: 0 });
      setCropZoom(1);
      setCroppedPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const cancelCrop = () => {
    setCropSrc(null); setCropType(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  const confirmCrop = async () => {
    if (!cropSrc || !croppedPixels) return;
    const isAvatar = cropType === "avatar";
    if (isAvatar) setUploadingAvatar(true); else setUploadingCover(true);
    setCropUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedPixels, isAvatar ? 480 : 1200);
      const path = `${serviceId}/${isAvatar ? 'avatar' : 'cover'}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from('service-assets').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) { alert('อัพโหลดรูปไม่สำเร็จ: ' + error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('service-assets').getPublicUrl(data.path);
      const url = `${publicUrl}?t=${Date.now()}`;
      const field = isAvatar ? 'image_url' : 'cover_url';
      await supabase.from('services').update({ [field]: url, updated_at: new Date().toISOString() }).eq('id', serviceId);
      setService((s: any) => ({ ...s, [field]: url }));
      cancelCrop();
    } catch (err) {
      console.error('Crop upload error:', err);
    } finally {
      setCropUploading(false);
      setUploadingAvatar(false);
      setUploadingCover(false);
    }
  };

  const stat = [
    { label: 'คิววันนี้', value: stats.today, unit: 'นัด', color: F.blue, icon: '📅' },
    { label: 'รออนุมัติ', value: stats.pending, unit: 'รายการ', color: F.orange, icon: '⏳' },
    { label: 'การจองทั้งหมด', value: stats.totalBookings, unit: 'ครั้ง', color: F.ink, icon: '📝' },
    { label: 'รายได้สะสม', value: 0, unit: 'บาท', color: F.green, icon: '💰' },
  ];
  const tools = [
    { href: `/service-dashboard/${serviceId}/manage-services?from=${fromPage}`, icon: '✂️', title: 'รายการบริการ', desc: 'ตั้งราคาและประเภทบริการ' },
    { href: `/service-dashboard/${serviceId}/finance?from=${fromPage}`, icon: '📊', title: 'สรุปรายได้', desc: 'รายงานรายได้งานบริการ' },
    { href: `/service-dashboard/${serviceId}/settings?from=${fromPage}`, icon: '🏥', title: 'ข้อมูลสถานบริการ', desc: 'ที่อยู่และเวลาเปิด-ปิด' },
    { href: `/service-dashboard/${serviceId}/members`, icon: '👥', title: 'จัดการสมาชิก', desc: 'เพิ่ม / ลบ / เปลี่ยนสิทธิ์สมาชิก' },
  ];
  const statusLabel = (s: string) => s === 'confirmed' ? 'ยืนยันแล้ว' : s === 'pending' ? 'รอดำเนินการ' : 'เสร็จสิ้น';
  const statusClass = (s: string) => s === 'confirmed' ? 'ok' : s === 'pending' ? 'pending' : 'done';

  if (loading) return <PageLoader />;
  if (!service) return null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        /* Crop modal */
        .svd-crop-overlay { position:fixed; inset:0; z-index:500; display:flex; flex-direction:column; background:#000; }
        .svd-crop-area { flex:1; position:relative; min-height:260px; }
        .svd-crop-controls { padding:16px 20px env(safe-area-inset-bottom,24px); background:#111; display:flex; flex-direction:column; gap:14px; }
        .svd-crop-zoom-row { display:flex; align-items:center; gap:10px; }
        .svd-crop-zoom-label { font-size:12px; color:rgba(255,255,255,.6); flex-shrink:0; }
        .svd-crop-zoom-input { flex:1; accent-color:${F.blue}; cursor:pointer; }
        .svd-crop-actions { display:flex; gap:12px; }
        .svd-crop-cancel { flex:1; padding:13px; border:1.5px solid rgba(255,255,255,.25); border-radius:14px; background:transparent; color:white; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }
        .svd-crop-confirm { flex:2; padding:13px; border:none; border-radius:14px; background:${F.blue}; color:white; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
        .svd-crop-confirm:disabled { opacity:.6; cursor:not-allowed; }

        .svd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; padding-bottom: 80px; }

        /* Cover + Identity */
        .svd-cover { position:relative; height:168px; margin:0 -16px; background:linear-gradient(135deg,${F.blue} 0%,#3b82f6 55%,#93c5fd 100%); overflow:hidden; z-index:0; }
        .svd-cover img.svd-cover-img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
        .svd-cover-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,.22),transparent 50%); }
        .svd-cover-cam { position:absolute; bottom:10px; right:14px; z-index:2; width:34px; height:34px; border-radius:999px; background:rgba(0,0,0,.42); display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; }
        .svd-cover-spin { position:absolute; inset:0; background:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; z-index:3; font-size:13px; font-weight:600; color:${F.blue}; }

        .svd-identity { padding:0 0 14px; }
        .svd-id-row { display:flex; align-items:center; gap:12px; margin-top:8px; padding-bottom:12px; }
        .svd-avatar-wrap { position:relative; flex-shrink:0; }
        .svd-avatar { width:80px; height:80px; border-radius:50%; border:3.5px solid white; overflow:hidden; background:${F.blueSoft}; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,0,0,.13); cursor:pointer; position:relative; }
        .svd-avatar img { width:100%; height:100%; object-fit:cover; }
        .svd-avatar-edit { position:absolute; bottom:2px; right:0px; width:24px; height:24px; background:white; border-radius:999px; border:2px solid ${F.line}; color:${F.blue}; display:flex; align-items:center; justify-content:center; pointer-events:none; box-shadow:0 2px 8px rgba(0,0,0,.1); z-index:2; }
        .svd-avatar-spin { position:absolute; inset:0; background:rgba(255,255,255,.6); border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:1; }
        .svd-id-main { flex:1; min-width:0; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
        .svd-id-text { flex:1; min-width:0; }
        .svd-name { font-size:18px; font-weight:700; color:${F.ink}; line-height:1.25; margin:0 0 2px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .svd-tagline { font-size:12px; color:${F.muted}; font-weight:400; }
        .svd-view-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:500; background:#F3F4F6; color:${F.inkSoft}; text-decoration:none; transition:background .15s; white-space:nowrap; }
        .svd-view-btn:hover { background:#E5E7EB; }
        .svd-edit-icon { flex-shrink:0; display:flex; align-items:center; justify-content:center; text-decoration:none; }

        .svd-body { max-width: 960px; margin: 0 auto; }
        .svd-add { display: inline-flex; align-items: center; gap: 6px; background: ${F.blue}; color: white; padding: 11px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.25); transition: all .15s; white-space: nowrap; }
        .svd-add:hover { background: #1D4FD7; }
        .svd-top-action { display:flex; justify-content:flex-end; margin-bottom:22px; }
        .svd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .svd-stat { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; position: relative; overflow: hidden; }
        .svd-stat-icon { position: absolute; right: -4px; top: -4px; font-size: 38px; opacity: 0.1; }
        .svd-stat-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .svd-stat-value { font-family: inherit; font-size: 24px; font-weight: 700; }
        .svd-stat-unit { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-left: 3px; }
        .svd-cols { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .svd-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .svd-sec-title { font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; }
        .svd-sec-link { font-size: 12px; font-weight: 700; color: ${F.blue}; text-decoration: none; }
        .svd-table-wrap { background: white; border: 1px solid ${F.line}; border-radius: 18px; overflow: hidden; }
        .svd-empty { padding: 44px; text-align: center; color: ${F.muted}; font-size: 14px; font-weight: 600; }
        .svd-empty-emoji { font-size: 36px; display: block; margin-bottom: 8px; }
        .svd-table { width: 100%; border-collapse: collapse; }
        .svd-table th { padding: 13px 16px; text-align: left; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; background: #FAFAFA; border-bottom: 1px solid ${F.line}; }
        .svd-table td { padding: 13px 16px; border-bottom: 1px solid ${F.line}; }
        .svd-table tr:last-child td { border-bottom: none; }
        .svd-pet-name { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; }
        .svd-pet-species { font-size: 10px; color: ${F.muted}; }
        .svd-svc { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .svd-time { font-size: 10px; font-weight: 700; color: ${F.blue}; }
        .svd-status { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
        .svd-status.ok { background: #F0FDF4; color: ${F.green}; }
        .svd-status.pending { background: #FFF7ED; color: ${F.orange}; }
        .svd-status.done { background: ${F.line}; color: ${F.muted}; }
        .svd-manage { font-size: 11px; font-weight: 700; color: ${F.blue}; background: none; border: none; cursor: pointer; }
        .svd-tools { display: flex; flex-direction: column; gap: 12px; }
        .svd-tool { display: flex; align-items: center; gap: 13px; background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 16px; text-decoration: none; transition: all .15s; }
        .svd-tool:hover { border-color: ${F.blueBorder}; }
        .svd-tool-icon { width: 44px; height: 44px; border-radius: 13px; background: ${F.blueSoft}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .svd-tool-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .svd-tool-desc { font-size: 11px; font-weight: 500; color: ${F.muted}; margin-top: 1px; }
        @media (max-width: 720px) { .svd-stats { grid-template-columns: 1fr 1fr; } .svd-cols { grid-template-columns: 1fr; } }
      `}</style>

      {cropSrc && (
        <div className="svd-crop-overlay">
          <div className="svd-crop-area">
            <Cropper
              image={cropSrc}
              crop={cropPos}
              zoom={cropZoom}
              aspect={cropType === "cover" ? 3 : 1}
              onCropChange={setCropPos}
              onZoomChange={setCropZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="svd-crop-controls">
            <div className="svd-crop-zoom-row">
              <span className="svd-crop-zoom-label">ขยาย</span>
              <input className="svd-crop-zoom-input" type="range" min={1} max={3} step={0.01} value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} />
            </div>
            <div className="svd-crop-actions">
              <button className="svd-crop-cancel" onClick={cancelCrop}>ยกเลิก</button>
              <button className="svd-crop-confirm" disabled={cropUploading} onClick={confirmCrop}>{cropUploading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="svd-page">
        {/* Cover */}
        <div className="svd-cover">
          {service.cover_url && <img className="svd-cover-img" src={service.cover_url} alt={service.service_name} />}
          <div className="svd-cover-overlay" />
          {canEdit && (
            <button className="svd-cover-cam" onClick={() => coverInputRef.current?.click()} aria-label="เปลี่ยนรูปปก">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          )}
          {uploadingCover && <div className="svd-cover-spin">กำลังอัพโหลด...</div>}
          {canEdit && (
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "cover"); if (coverInputRef.current) coverInputRef.current.value = ""; }} />
          )}
        </div>

        {/* Identity — outside svd-body so it inherits main's px-4 padding */}
        <div className="svd-identity">
            <div className="svd-id-row">
              <div className="svd-avatar-wrap">
                <div className="svd-avatar" onClick={() => canEdit && avatarInputRef.current?.click()} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                  {service.image_url
                    ? <img src={service.image_url} alt={service.service_name} />
                    : <img src="/icons/icon-service.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />}
                  {uploadingAvatar && (
                    <div className="svd-avatar-spin">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={F.blue} strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <>
                    <div className="svd-avatar-edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "avatar"); if (avatarInputRef.current) avatarInputRef.current.value = ""; }} />
                  </>
                )}
              </div>
              <div className="svd-id-main">
                <div className="svd-id-text">
                  <h1 className="svd-name">{service.service_name}</h1>
                  <div className="svd-tagline">แดชบอร์ดจัดการบริการ</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, alignSelf: 'flex-start' }}>
                  <Link href={`/service/${serviceId}`} className="svd-view-btn">
                    <Icon.Eye /> ดูหน้าบริการ
                  </Link>
                  {canEdit && (
                    <Link href={`/service-dashboard/${serviceId}/settings?from=${fromPage}`} className="svd-edit-icon" aria-label="ตั้งค่าบริการ">
                      <img src="/icons/icon-setting.png" style={{ width: 36, height: 36 }} alt="ตั้งค่า" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
        </div>{/* end svd-identity */}

        <div className="svd-body">
          <div className="svd-top-action">
            {canEdit && (
              <Link href={`/service-dashboard/${serviceId}/manage-services?from=${fromPage}`} className="svd-add"><Icon.Plus /> จัดการบริการ</Link>
            )}
          </div>

          <div className="svd-stats">
            {stat.map((s, i) => (
              <div key={i} className="svd-stat">
                <div className="svd-stat-icon">{s.icon}</div>
                <div className="svd-stat-label">{s.label}</div>
                <div><span className="svd-stat-value" style={{ color: s.color }}>{s.value}</span><span className="svd-stat-unit">{s.unit}</span></div>
              </div>
            ))}
          </div>

          <div className="svd-cols">
            <div>
              <div className="svd-sec-head">
                <h2 className="svd-sec-title">🗓️ รายการนัดหมายล่าสุด</h2>
                <Link href={`/service-dashboard/${serviceId}/bookings?from=${fromPage}`} className="svd-sec-link">ดูทั้งหมด →</Link>
              </div>
              <div className="svd-table-wrap">
                {bookings.length === 0 ? (
                  <div className="svd-empty"><span className="svd-empty-emoji">🎈</span>ยังไม่มีการจองในขณะนี้</div>
                ) : (
                  <table className="svd-table">
                    <thead><tr><th>สัตว์เลี้ยง</th><th>บริการ/เวลา</th><th>สถานะ</th><th></th></tr></thead>
                    <tbody>
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <div className="svd-pet-name">{booking.pets?.name}</div>
                            <div className="svd-pet-species">{speciesTh(booking.pets?.species)}</div>
                          </td>
                          <td>
                            <div className="svd-svc">{booking.service_type}</div>
                            <div className="svd-time">{booking.booking_time} น.</div>
                          </td>
                          <td><span className={`svd-status ${statusClass(booking.status)}`}>{statusLabel(booking.status)}</span></td>
                          <td style={{ textAlign: 'right' }}>{canEdit && <button className="svd-manage">จัดการ</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div>
              <div className="svd-sec-head"><h2 className="svd-sec-title">🛠️ ตั้งค่าบริการ</h2></div>
              <div className="svd-tools">
                {tools.map((t, i) => (
                  <Link key={i} href={t.href} className="svd-tool">
                    <div className="svd-tool-icon">{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="svd-tool-title">{t.title}</div>
                      <div className="svd-tool-desc">{t.desc}</div>
                    </div>
                    <span style={{ color: F.muted, display: 'flex' }}><Icon.Chevron /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ServiceDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ServiceDashboardContent />
    </Suspense>
  );
}
