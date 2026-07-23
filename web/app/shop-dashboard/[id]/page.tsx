"use client";

import React, { useCallback, useEffect, useState, useRef, Suspense } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';
import { useShopAccess } from "./layout";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF', pink: '#E84677',
  orange: '#F97316', red: '#EF4444', green: '#16A34A',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>,
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

function ShopDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";
  const { myRole } = useShopAccess();
  const canEdit = myRole === "owner" || myRole === "manager";

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, outOfStock: 0, totalSales: 0 });

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
    const fetchShopData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/shop-dashboard/${shopId}`)}`);
        const { data: shopData } = await supabase.from("shops").select("*").eq("id", shopId).single();
        if (!shopData) return router.push("/partner");
        setShop(shopData);
        const { data: productsData } = await supabase.from("products").select("*").eq("shop_id", shopId);
        if (productsData) {
          setProducts(productsData);
          setStats({
            totalItems: productsData.length,
            lowStock: productsData.filter((p) => p.stock > 0 && p.stock <= 5).length,
            outOfStock: productsData.filter((p) => p.stock === 0).length,
            totalSales: 0,
          });
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    if (shopId) fetchShopData();
  }, [shopId, router]);

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
      const path = `${shopId}/${isAvatar ? 'avatar' : 'cover'}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from('shop-assets').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) { alert('อัพโหลดรูปไม่สำเร็จ: ' + error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('shop-assets').getPublicUrl(data.path);
      const url = `${publicUrl}?t=${Date.now()}`;
      const field = isAvatar ? 'image_url' : 'cover_url';
      await supabase.from('shops').update({ [field]: url, updated_at: new Date().toISOString() }).eq('id', shopId);
      setShop((s: any) => ({ ...s, [field]: url }));
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
    { label: 'สินค้าทั้งหมด', value: stats.totalItems, unit: 'รายการ', color: F.ink, icon: '📦' },
    { label: 'สต็อกใกล้หมด', value: stats.lowStock, unit: 'รายการ', color: F.orange, icon: '⚠️' },
    { label: 'สินค้าหมด', value: stats.outOfStock, unit: 'รายการ', color: F.red, icon: '🚫' },
    { label: 'ยอดขายเดือนนี้', value: 0, unit: 'บาท', color: F.teal, icon: '💰' },
  ];
  const tools = [
    { href: `/shop-dashboard/${shopId}/orders?from=${fromPage}`, icon: '📜', title: 'รายการคำสั่งซื้อ', desc: 'จัดการออเดอร์จากลูกค้า' },
    { href: `/shop-dashboard/${shopId}/finance?from=${fromPage}`, icon: '💸', title: 'บัญชีร้านค้า', desc: 'สรุปรายรับ-รายจ่ายร้าน' },
    { href: `/shop-dashboard/${shopId}/edit?from=${fromPage}`, icon: '⚙️', title: 'ตั้งค่าหน้าร้าน', desc: 'ข้อมูลติดต่อและเวลาเปิด-ปิด' },
    { href: `/shop-dashboard/${shopId}/members`, icon: '👥', title: 'จัดการสมาชิก', desc: 'เพิ่ม / ลบ / เปลี่ยนสิทธิ์สมาชิก' },
  ];

  if (loading) return <PageLoader />;
  if (!shop) return null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        /* Crop modal */
        .sd-crop-overlay { position:fixed; inset:0; z-index:500; display:flex; flex-direction:column; background:#000; }
        .sd-crop-area { flex:1; position:relative; min-height:260px; }
        .sd-crop-controls { padding:16px 20px env(safe-area-inset-bottom,24px); background:#111; display:flex; flex-direction:column; gap:14px; }
        .sd-crop-zoom-row { display:flex; align-items:center; gap:10px; }
        .sd-crop-zoom-label { font-size:12px; color:rgba(255,255,255,.6); flex-shrink:0; }
        .sd-crop-zoom-input { flex:1; accent-color:${F.teal}; cursor:pointer; }
        .sd-crop-actions { display:flex; gap:12px; }
        .sd-crop-cancel { flex:1; padding:13px; border:1.5px solid rgba(255,255,255,.25); border-radius:14px; background:transparent; color:white; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }
        .sd-crop-confirm { flex:2; padding:13px; border:none; border-radius:14px; background:${F.teal}; color:white; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
        .sd-crop-confirm:disabled { opacity:.6; cursor:not-allowed; }

        .sd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; padding-bottom: 80px; }

        /* Cover + Identity */
        .sd-cover { position:relative; height:168px; margin:0 -16px; background:linear-gradient(135deg,${F.teal} 0%,#14b8a6 55%,#5eead4 100%); overflow:hidden; z-index:0; }
        .sd-cover img.sd-cover-img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
        .sd-cover-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,.22),transparent 50%); }
        .sd-cover-cam { position:absolute; bottom:10px; right:14px; z-index:2; width:34px; height:34px; border-radius:999px; background:rgba(0,0,0,.42); display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; }
        .sd-cover-spin { position:absolute; inset:0; background:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; z-index:3; font-size:13px; font-weight:600; color:${F.teal}; }

        .sd-identity { padding:0 0 14px; }
        .sd-id-row { display:flex; align-items:center; gap:12px; margin-top:8px; padding-bottom:12px; }
        .sd-avatar-wrap { position:relative; flex-shrink:0; }
        .sd-avatar { width:80px; height:80px; border-radius:50%; border:3.5px solid white; overflow:hidden; background:${F.tealSoft}; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,0,0,.13); cursor:pointer; position:relative; }
        .sd-avatar img { width:100%; height:100%; object-fit:cover; }
        .sd-avatar-edit { position:absolute; bottom:2px; right:0px; width:24px; height:24px; background:white; border-radius:999px; border:2px solid ${F.line}; color:${F.teal}; display:flex; align-items:center; justify-content:center; pointer-events:none; box-shadow:0 2px 8px rgba(0,0,0,.1); z-index:2; }
        .sd-avatar-spin { position:absolute; inset:0; background:rgba(255,255,255,.6); border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:1; }
        .sd-id-main { flex:1; min-width:0; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
        .sd-id-text { flex:1; min-width:0; }
        .sd-name { font-size:18px; font-weight:700; color:${F.ink}; line-height:1.25; margin:0 0 2px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .sd-tagline { font-size:12px; color:${F.muted}; font-weight:400; }
        .sd-view-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:500; background:#F3F4F6; color:${F.inkSoft}; text-decoration:none; transition:background .15s; white-space:nowrap; }
        .sd-view-btn:hover { background:#E5E7EB; }
        .sd-edit-icon { flex-shrink:0; display:flex; align-items:center; justify-content:center; text-decoration:none; }

        .sd-body { max-width: 960px; margin: 0 auto; }
        .sd-add { display: inline-flex; align-items: center; gap: 6px; background: ${F.teal}; color: white; padding: 11px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(13,148,136,0.25); transition: all .15s; white-space: nowrap; }
        .sd-add:hover { background: #0B7E74; }
        .sd-top-action { display:flex; justify-content:flex-end; margin-bottom:22px; }
        .sd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .sd-stat { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; position: relative; overflow: hidden; }
        .sd-stat-icon { position: absolute; right: -4px; top: -4px; font-size: 38px; opacity: 0.1; }
        .sd-stat-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .sd-stat-value { font-family: inherit; font-size: 24px; font-weight: 700; }
        .sd-stat-unit { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-left: 3px; }
        .sd-cols { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .sd-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .sd-sec-title { font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; }
        .sd-sec-link { font-size: 12px; font-weight: 700; color: ${F.teal}; text-decoration: none; }
        .sd-table-wrap { background: white; border: 1px solid ${F.line}; border-radius: 18px; overflow: hidden; }
        .sd-empty { padding: 40px; text-align: center; color: ${F.muted}; font-size: 14px; font-weight: 600; }
        .sd-table { width: 100%; border-collapse: collapse; }
        .sd-table th { padding: 13px 16px; text-align: left; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; background: #FAFAFA; border-bottom: 1px solid ${F.line}; }
        .sd-table td { padding: 13px 16px; border-bottom: 1px solid ${F.line}; }
        .sd-table tr:last-child td { border-bottom: none; }
        .sd-prod { display: flex; align-items: center; gap: 10px; }
        .sd-prod-img { width: 38px; height: 38px; border-radius: 9px; overflow: hidden; background: ${F.tealSoft}; border: 1px solid ${F.line}; flex-shrink: 0; }
        .sd-prod-img img { width: 100%; height: 100%; object-fit: cover; }
        .sd-prod-name { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sd-price { font-family: inherit; font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .sd-stock { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
        .sd-stock.low { background: #FEF2F2; color: ${F.red}; }
        .sd-stock.ok { background: #F0FDF4; color: ${F.green}; }
        .sd-edit-link { color: ${F.muted}; display: inline-flex; transition: color .15s; }
        .sd-edit-link:hover { color: ${F.teal}; }
        .sd-tools { display: flex; flex-direction: column; gap: 12px; }
        .sd-tool { display: flex; align-items: center; gap: 13px; background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 16px; text-decoration: none; transition: all .15s; }
        .sd-tool:hover { border-color: ${F.tealBorder}; }
        .sd-tool-icon { width: 44px; height: 44px; border-radius: 13px; background: ${F.tealSoft}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .sd-tool-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .sd-tool-desc { font-size: 11px; font-weight: 500; color: ${F.muted}; margin-top: 1px; }
        @media (max-width: 720px) { .sd-stats { grid-template-columns: 1fr 1fr; } .sd-cols { grid-template-columns: 1fr; } }
      `}</style>

      {cropSrc && (
        <div className="sd-crop-overlay">
          <div className="sd-crop-area">
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
          <div className="sd-crop-controls">
            <div className="sd-crop-zoom-row">
              <span className="sd-crop-zoom-label">ขยาย</span>
              <input className="sd-crop-zoom-input" type="range" min={1} max={3} step={0.01} value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} />
            </div>
            <div className="sd-crop-actions">
              <button className="sd-crop-cancel" onClick={cancelCrop}>ยกเลิก</button>
              <button className="sd-crop-confirm" disabled={cropUploading} onClick={confirmCrop}>{cropUploading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="sd-page">
        {/* Cover */}
        <div className="sd-cover">
          {shop.cover_url && <img className="sd-cover-img" src={shop.cover_url} alt={shop.shop_name} />}
          <div className="sd-cover-overlay" />
          {canEdit && (
            <button className="sd-cover-cam" onClick={() => coverInputRef.current?.click()} aria-label="เปลี่ยนรูปปก">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          )}
          {uploadingCover && <div className="sd-cover-spin">กำลังอัพโหลด...</div>}
          {canEdit && (
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "cover"); if (coverInputRef.current) coverInputRef.current.value = ""; }} />
          )}
        </div>

        {/* Identity — outside sd-body so it inherits main's px-4 padding */}
        <div className="sd-identity">
            <div className="sd-id-row">
              <div className="sd-avatar-wrap">
                <div className="sd-avatar" onClick={() => canEdit && avatarInputRef.current?.click()} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                  {shop.image_url
                    ? <img src={shop.image_url} alt={shop.shop_name} />
                    : <img src="/icons/icon-shop.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />}
                  {uploadingAvatar && (
                    <div className="sd-avatar-spin">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={F.teal} strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <>
                    <div className="sd-avatar-edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "avatar"); if (avatarInputRef.current) avatarInputRef.current.value = ""; }} />
                  </>
                )}
              </div>
              <div className="sd-id-main">
                <div className="sd-id-text">
                  <h1 className="sd-name">{shop.shop_name}</h1>
                  <div className="sd-tagline">แดชบอร์ดจัดการร้านค้า</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, alignSelf: 'flex-start' }}>
                  <Link href={`/shop/${shopId}`} className="sd-view-btn">
                    <Icon.Eye /> ดูหน้าร้านค้า
                  </Link>
                  {canEdit && (
                    <Link href={`/shop-dashboard/${shopId}/edit?from=${fromPage}`} className="sd-edit-icon" aria-label="ตั้งค่าร้านค้า">
                      <img src="/icons/icon-setting.png" style={{ width: 36, height: 36 }} alt="ตั้งค่า" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
        </div>{/* end sd-identity */}

        <div className="sd-body">
          <div className="sd-top-action">
            {canEdit && (
              <Link href={`/shop-dashboard/${shopId}/products/create?from=${fromPage}`} className="sd-add"><Icon.Plus /> เพิ่มสินค้า</Link>
            )}
          </div>

          <div className="sd-stats">
            {stat.map((s, i) => (
              <div key={i} className="sd-stat">
                <div className="sd-stat-icon">{s.icon}</div>
                <div className="sd-stat-label">{s.label}</div>
                <div><span className="sd-stat-value" style={{ color: s.color }}>{s.value}</span><span className="sd-stat-unit">{s.unit}</span></div>
              </div>
            ))}
          </div>

          <div className="sd-cols">
            <div>
              <div className="sd-sec-head">
                <h2 className="sd-sec-title">📦 คลังสินค้าล่าสุด</h2>
                <Link href={`/shop-dashboard/${shopId}/products?from=${fromPage}`} className="sd-sec-link">ดูทั้งหมด →</Link>
              </div>
              <div className="sd-table-wrap">
                {products.length === 0 ? (
                  <div className="sd-empty">ยังไม่มีสินค้าในร้าน</div>
                ) : (
                  <table className="sd-table">
                    <thead><tr><th>สินค้า</th><th>ราคา</th><th>คงเหลือ</th><th></th></tr></thead>
                    <tbody>
                      {products.slice(0, 5).map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="sd-prod">
                              <div className="sd-prod-img">{product.image_url && <img src={product.image_url} alt={product.name} />}</div>
                              <span className="sd-prod-name">{product.name}</span>
                            </div>
                          </td>
                          <td><span className="sd-price">฿{Number(product.price).toLocaleString()}</span></td>
                          <td><span className={`sd-stock ${product.stock <= 5 ? 'low' : 'ok'}`}>{product.stock} ชิ้น</span></td>
                          <td style={{ textAlign: 'right' }}>
                            {canEdit && (
                              <Link href={`/shop-dashboard/${shopId}/products/${product.id}/edit?from=${fromPage}`} className="sd-edit-link"><Icon.Edit /></Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div>
              <div className="sd-sec-head"><h2 className="sd-sec-title">🛠️ เครื่องมือ</h2></div>
              <div className="sd-tools">
                {tools.map((t, i) => (
                  <Link key={i} href={t.href} className="sd-tool">
                    <div className="sd-tool-icon">{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="sd-tool-title">{t.title}</div>
                      <div className="sd-tool-desc">{t.desc}</div>
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

export default function ShopDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ShopDashboardContent />
    </Suspense>
  );
}
