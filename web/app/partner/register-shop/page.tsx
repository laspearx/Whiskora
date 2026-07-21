"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import AddressFields, { AddressValue, emptyAddress, composeAddress } from '@/app/components/AddressFields';
import { SPECIES_LIST } from '@/lib/species';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};


const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Trash: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Locate: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>,
};

export default function RegisterShopPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarAreaPx, setAvatarAreaPx] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverAreaPx, setCoverAreaPx] = useState<any>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const onAvatarCropComplete = useCallback((_: any, px: any) => setAvatarAreaPx(px), []);
  const onCoverCropComplete = useCallback((_: any, px: any) => setCoverAreaPx(px), []);

  const [form, setForm] = useState({ shop_name: '', owner_name: '', phone: '', bio: '' });
  const [addr, setAddr] = useState<AddressValue>(emptyAddress());
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push(`/login?redirect=${encodeURIComponent('/partner/register-shop')}`);
      setUserId(session.user.id);
      supabase.from('profiles').select('full_name,phone,house_no,room_no,moo,soi,road,sub_district,district,province,postal_code').eq('id', session.user.id).single().then(({ data }) => {
        if (data) setProfileData(data);
      });
    });
  }, [router]);

  const fillFromProfile = () => {
    if (!profileData) return;
    setForm(f => ({ ...f, owner_name: profileData.full_name || '', phone: profileData.phone || '' }));
    setAddr({
      house_no: profileData.house_no || '', room_no: profileData.room_no || '',
      moo: profileData.moo || '', soi: profileData.soi || '', road: profileData.road || '',
      sub_district: profileData.sub_district || '', district: profileData.district || '',
      province: profileData.province || '', postal_code: profileData.postal_code || '',
    });
  };

  useEffect(() => {
    if (!mapVisible) return;
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;
      const lat = mapLat ?? 13.7563, lng = mapLng ?? 100.5018;
      const map = L.map(mapRef.current).setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', (e: any) => {
        const p = e.target.getLatLng();
        setMapLat(+p.lat.toFixed(6)); setMapLng(+p.lng.toFixed(6));
      });
      mapInstanceRef.current = map; markerRef.current = marker;
    };
    if ((window as any).L) { setTimeout(initMap, 50); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setTimeout(initMap, 50);
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [mapVisible]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return alert('เบราว์เซอร์นี้ไม่รองรับ GPS');
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: la, longitude: lo } = pos.coords;
      setMapLat(+la.toFixed(6)); setMapLng(+lo.toFixed(6));
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([la, lo], 16);
        markerRef.current.setLatLng([la, lo]);
      }
    }, () => alert('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS หรือลากหมุดบนแผนที่'));
  };

  const getCroppedImg = async (src: string, px: any, round = false): Promise<Blob> => {
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = src; });
    const canvas = document.createElement('canvas');
    canvas.width = px.width; canvas.height = px.height;
    const ctx = canvas.getContext('2d')!;
    if (round) { ctx.beginPath(); ctx.arc(px.width / 2, px.height / 2, px.width / 2, 0, Math.PI * 2); ctx.clip(); }
    ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
    return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('empty')), 'image/jpeg', 0.92));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setter(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadToStorage = async (blob: Blob, path: string) => {
    const file = new File([blob], path.split('/').pop()!, { type: 'image/jpeg' });
    const { error } = await supabase.storage.from('partner-photos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('partner-photos').getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  };

  const handleUploadAvatar = async () => {
    if (!avatarSrc || !avatarAreaPx || !userId) return;
    try {
      setUploadingAvatar(true);
      const blob = await getCroppedImg(avatarSrc, avatarAreaPx, true);
      setImageUrl(await uploadToStorage(blob, `shops/${userId}/logo-${Date.now()}.jpg`));
      setAvatarSrc(null);
    } catch { alert('อัปโหลดรูปไม่สำเร็จ'); } finally { setUploadingAvatar(false); }
  };

  const handleUploadCover = async () => {
    if (!coverSrc || !coverAreaPx || !userId) return;
    try {
      setUploadingCover(true);
      const blob = await getCroppedImg(coverSrc, coverAreaPx);
      setCoverUrl(await uploadToStorage(blob, `shops/${userId}/cover-${Date.now()}.jpg`));
      setCoverSrc(null);
    } catch { alert('อัปโหลดภาพปกไม่สำเร็จ'); } finally { setUploadingCover(false); }
  };

  const toggleSpecies = (id: string) =>
    setSelectedSpecies(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (!form.shop_name.trim()) return alert('กรุณากรอกชื่อร้าน');
    if (!form.owner_name.trim()) return alert('กรุณากรอกชื่อ-สกุลเจ้าของ');
    if (!form.phone.trim()) return alert('กรุณากรอกเบอร์โทรศัพท์');
    if (!addr.province.trim()) return alert('กรุณาระบุที่อยู่ร้าน (จังหวัด)');
    if (mapLat === null || mapLng === null) return alert('กรุณาปักหมุดตำแหน่งร้านบนแผนที่');
    if (selectedSpecies.length === 0) return alert('กรุณาเลือกสัตว์ที่ร้านรองรับอย่างน้อย 1 ชนิด');
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data: shopData, error } = await supabase.from('shops').insert([{
        user_id: userId,
        shop_name: form.shop_name,
        owner_name: form.owner_name,
        phone: form.phone,
        bio: form.bio,
        address: composeAddress(addr),
        house_no: addr.house_no || null, room_no: addr.room_no || null,
        moo: addr.moo || null, soi: addr.soi || null, road: addr.road || null,
        sub_district: addr.sub_district || null, district: addr.district || null,
        province: addr.province || null, postal_code: addr.postal_code || null,
        lat: mapLat,
        lng: mapLng,
        image_url: imageUrl || null,
        cover_url: coverUrl || null,
        supported_species: selectedSpecies,
      }]).select('id').single();
      if (error) throw error;

      const { data: wsData } = await supabase.from('workspaces').insert({
        type: 'shop', name: form.shop_name,
        owner_id: userId, entity_id: shopData.id, avatar_url: imageUrl || null,
      }).select('id').single();
      if (wsData) {
        await supabase.from('workspace_members').insert({
          workspace_id: wsData.id, user_id: userId, role: 'owner',
        });
      }

      alert('เปิดร้าน Pet Shop สำเร็จ!');
      router.push('/profile');
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setIsLoading(false); }
  };

  const canSubmit = !isLoading && !uploadingAvatar && !uploadingCover;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ps-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ps-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .ps-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .ps-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .ps-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ps-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .ps-sub { font-size: 12px; font-weight: 600; color: ${F.teal}; margin-top: 2px; }

        /* Cover */
        .ps-cover-wrap { margin-bottom: 20px; }
        .ps-cover-label { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 8px; letter-spacing: 0.04em; text-transform: uppercase; }
        .ps-cover-box { position: relative; width: 100%; aspect-ratio: 3/1; border-radius: 18px; overflow: hidden; background: ${F.tealSoft}; border: 2px dashed ${F.tealBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .15s; }
        .ps-cover-box:hover { border-color: ${F.teal}; }
        .ps-cover-box img { width: 100%; height: 100%; object-fit: cover; }
        .ps-cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: ${F.muted}; }
        .ps-cover-placeholder-icon { width: 48px; height: 48px; border-radius: 14px; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); color: ${F.teal}; }
        .ps-cover-placeholder-text { font-size: 13px; font-weight: 600; }
        .ps-cover-optional { font-size: 11px; color: ${F.muted}; margin-top: 2px; }
        .ps-cover-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; }
        .ps-cover-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 10px; border: none; cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit; transition: all .15s; }
        .ps-cover-btn-edit { background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); color: ${F.ink}; }
        .ps-cover-btn-del { background: rgba(239,68,68,0.12); color: #DC2626; }

        /* Avatar */
        .ps-avatar-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; position: relative; }
        .ps-avatar-circle { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; background: ${F.tealSoft}; border: 3px solid white; box-shadow: 0 4px 16px rgba(13,148,136,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ps-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .ps-avatar-cam { position: absolute; bottom: 30px; right: calc(50% - 62px); width: 34px; height: 34px; border-radius: 50%; background: ${F.teal}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ps-avatar-hint { margin-top: 8px; font-size: 11px; font-weight: 700; color: ${F.muted}; }
        .ps-avatar-del { margin-top: 5px; display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; background: none; border: 1px solid #FCA5A5; color: #DC2626; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; }

        .ps-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .ps-card-title { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .ps-field { margin-bottom: 16px; }
        .ps-field:last-child { margin-bottom: 0; }
        .ps-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .ps-req { color: #E84677; }
        .ps-input, .ps-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .ps-input:focus, .ps-textarea:focus { border-color: ${F.teal}; box-shadow: 0 0 0 3px ${F.tealSoft}; }
        .ps-textarea { resize: none; }
        .ps-species-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .ps-species-btn { padding: 12px 4px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all .15s; font-family: inherit; }
        .ps-species-btn.active { border-color: ${F.teal}; background: ${F.tealSoft}; }
        .ps-species-btn .emoji { width: 28px; height: 28px; object-fit: contain; }
        .ps-species-btn .lbl { font-size: 10px; font-weight: 700; color: ${F.inkSoft}; }
        .ps-species-btn.active .lbl { color: ${F.teal}; }

        /* Map */
        .ps-map-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 14px; border: 1.5px dashed ${F.lineMid}; background: white; cursor: pointer; width: 100%; font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.inkSoft}; transition: all .15s; }
        .ps-map-toggle:hover { border-color: ${F.teal}; color: ${F.teal}; }
        .ps-map-toggle.has-pin { border-style: solid; border-color: #16A34A; color: #16A34A; }
        .ps-map-box { border-radius: 14px; overflow: hidden; border: 1px solid ${F.lineMid}; margin-top: 10px; height: 260px; }
        .ps-map-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .ps-geo-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid ${F.lineMid}; background: white; font-size: 12px; font-weight: 700; color: ${F.ink}; cursor: pointer; font-family: inherit; transition: all .15s; }
        .ps-geo-btn:hover { background: ${F.tealSoft}; border-color: ${F.teal}; color: ${F.teal}; }
        .ps-pin-coords { font-size: 11px; color: ${F.muted}; }

        .ps-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .ps-savebar-inner { max-width: 600px; margin: 0 auto; }
        .ps-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.teal}; color: white; box-shadow: 0 4px 14px rgba(13,148,136,0.3); }
        .ps-btn:hover { background: #0B7E74; }
        .ps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ps-autofill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 20px; border: 1.5px solid ${F.tealBorder}; background: ${F.tealSoft}; color: ${F.teal}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; margin-bottom: 14px; }
        .ps-autofill-btn:hover { background: #CCFBF1; }

        .ps-modal { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); padding: 16px; }
        .ps-modal-card { background: white; width: 100%; max-width: 400px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .ps-crop-area { position: relative; width: 100%; background: #111; }
        .ps-crop-area-sq { height: 300px; }
        .ps-crop-area-wide { height: 200px; }
        .ps-modal-body { padding: 20px; }
        .ps-zoom { width: 100%; accent-color: ${F.teal}; margin-bottom: 16px; }
        .ps-modal-btns { display: flex; gap: 10px; }
        .ps-btn-cancel { flex: 1; padding: 14px; border-radius: 14px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ps-btn-confirm { flex: 1; padding: 14px; border-radius: 14px; background: ${F.teal}; color: white; border: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ps-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 420px) { .ps-species-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="ps-page">
        <div className="ps-body">
          <div className="ps-header">
            <button className="ps-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="ps-title">เปิดร้าน Pet Shop</h1>
              <p className="ps-sub">เพราะเหล่าน้องเลี้ยงสัตว์ ต้องการคุณ</p>
            </div>
          </div>

          {/* ── ภาพปก (ไม่บังคับ) ── */}
          <div className="ps-cover-wrap">
            <p className="ps-cover-label">ภาพปก</p>
            <div className="ps-cover-box" onClick={() => !coverUrl && coverInputRef.current?.click()}>
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="ภาพปก" />
                  <div className="ps-cover-actions">
                    <button type="button" className="ps-cover-btn ps-cover-btn-edit" onClick={e => { e.stopPropagation(); coverInputRef.current?.click(); }}><Icon.Camera /> เปลี่ยน</button>
                    <button type="button" className="ps-cover-btn ps-cover-btn-del" onClick={e => { e.stopPropagation(); setCoverUrl(null); }}><Icon.Trash /> ลบ</button>
                  </div>
                </>
              ) : (
                <div className="ps-cover-placeholder">
                  <div className="ps-cover-placeholder-icon"><Icon.Camera /></div>
                  <p className="ps-cover-placeholder-text">แตะเพื่อเพิ่มภาพปก</p>
                  <p className="ps-cover-optional">(ไม่บังคับ)</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={coverInputRef} onChange={e => onFileChange(e, setCoverSrc)} onClick={e => (e.currentTarget.value = '')} style={{ display: 'none' }} />
          </div>

          {/* ── รูปโปรไฟล์ ── */}
          <div className="ps-avatar-wrap">
            <div className="ps-avatar-circle" onClick={() => avatarInputRef.current?.click()}>
              {imageUrl
                ? <img src={imageUrl} alt="โลโก้" />
                : <img src="/icons/icon-shop.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.4 }} />}
            </div>
            <button type="button" className="ps-avatar-cam" onClick={() => avatarInputRef.current?.click()}><Icon.Camera /></button>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={e => onFileChange(e, setAvatarSrc)} onClick={e => (e.currentTarget.value = '')} style={{ display: 'none' }} />
            <p className="ps-avatar-hint">รูปโปรไฟล์ / โลโก้ร้าน (ไม่บังคับ)</p>
            {imageUrl && <button type="button" className="ps-avatar-del" onClick={() => setImageUrl(null)}><Icon.Trash /> ลบ</button>}
          </div>

          {/* ── ข้อมูลพื้นฐาน ── */}
          <div className="ps-card">
            <div className="ps-field">
              <label className="ps-label">ชื่อร้าน <span className="ps-req">*</span></label>
              <input className="ps-input" value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} placeholder="ชื่อร้านค้าของคุณ" />
            </div>
            <div className="ps-field">
              <label className="ps-label">ชื่อ-สกุลเจ้าของ <span className="ps-req">*</span></label>
              {profileData && (
                <button type="button" className="ps-autofill-btn" onClick={fillFromProfile}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ใช้ข้อมูลจากโปรไฟล์ของฉัน
                </button>
              )}
              <input className="ps-input" value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="ชื่อจริง นามสกุล" />
            </div>
            <div className="ps-field">
              <label className="ps-label">เบอร์โทรศัพท์ <span className="ps-req">*</span></label>
              <input type="tel" className="ps-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
            </div>
            <div className="ps-field">
              <label className="ps-label">ที่อยู่ร้าน <span className="ps-req">*</span></label>
              <AddressFields value={addr} onChange={setAddr} required />
            </div>
            <div className="ps-field">
              <label className="ps-label">รายละเอียดเพิ่มเติม</label>
              <textarea className="ps-textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="แนะนำร้านค้าหรือสินค้าเด่นของร้าน..." />
            </div>
          </div>

          {/* ── หมุดแผนที่ ── */}
          <div className="ps-card">
            <div className="ps-card-title"><Icon.MapPin /> ตำแหน่งร้านบนแผนที่ <span className="ps-req">*</span></div>
            <button type="button" className={`ps-map-toggle ${mapLat !== null ? 'has-pin' : ''}`} onClick={() => setMapVisible(v => !v)}>
              <Icon.MapPin />
              {mapLat !== null ? `ปักหมุดแล้ว (${mapLat.toFixed(4)}, ${mapLng?.toFixed(4)})` : 'แตะเพื่อเปิดแผนที่และปักหมุด'}
            </button>
            {mapVisible && (
              <>
                <div className="ps-map-box" ref={mapRef} />
                <div className="ps-map-actions">
                  <button type="button" className="ps-geo-btn" onClick={handleGeolocate}><Icon.Locate /> ใช้ตำแหน่งปัจจุบัน</button>
                  {mapLat !== null && <span className="ps-pin-coords">{mapLat.toFixed(5)}, {mapLng?.toFixed(5)}</span>}
                </div>
                <p style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>ลากหมุดบนแผนที่เพื่อปรับตำแหน่ง</p>
              </>
            )}
          </div>

          {/* ── สัตว์ที่รองรับ ── */}
          <div className="ps-card">
            <div className="ps-card-title">ร้านของคุณมีของสำหรับสัตว์ชนิดใดบ้าง? <span className="ps-req">*</span></div>
            <div className="ps-species-grid">
              {SPECIES_LIST.map(s => (
                <button key={s.id} type="button" className={`ps-species-btn ${selectedSpecies.includes(s.id) ? 'active' : ''}`} onClick={() => toggleSpecies(s.id)}>
                  <img className="emoji" src={s.icon} alt={s.th} /><span className="lbl">{s.th}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ps-savebar">
          <div className="ps-savebar-inner">
            <button type="button" className="ps-btn" onClick={handleSubmit} disabled={!canSubmit}>
              {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการเปิดร้าน'}
            </button>
          </div>
        </div>
      </div>

      {/* Crop modal: avatar */}
      {avatarSrc && (
        <div className="ps-modal">
          <div className="ps-modal-card">
            <div className="ps-crop-area ps-crop-area-sq">
              <Cropper image={avatarSrc} crop={avatarCrop} zoom={avatarZoom} aspect={1} cropShape="round"
                onCropChange={setAvatarCrop} onCropComplete={onAvatarCropComplete} onZoomChange={setAvatarZoom} />
            </div>
            <div className="ps-modal-body">
              <input type="range" className="ps-zoom" value={avatarZoom} min={1} max={3} step={0.1} onChange={e => setAvatarZoom(Number(e.target.value))} />
              <div className="ps-modal-btns">
                <button className="ps-btn-cancel" onClick={() => setAvatarSrc(null)}>ยกเลิก</button>
                <button className="ps-btn-confirm" onClick={handleUploadAvatar} disabled={uploadingAvatar}>{uploadingAvatar ? 'กำลังอัปโหลด...' : 'ยืนยัน'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop modal: cover */}
      {coverSrc && (
        <div className="ps-modal">
          <div className="ps-modal-card" style={{ maxWidth: 480 }}>
            <div className="ps-crop-area ps-crop-area-wide">
              <Cropper image={coverSrc} crop={coverCrop} zoom={coverZoom} aspect={3}
                onCropChange={setCoverCrop} onCropComplete={onCoverCropComplete} onZoomChange={setCoverZoom} />
            </div>
            <div className="ps-modal-body">
              <input type="range" className="ps-zoom" value={coverZoom} min={1} max={3} step={0.1} onChange={e => setCoverZoom(Number(e.target.value))} />
              <div className="ps-modal-btns">
                <button className="ps-btn-cancel" onClick={() => setCoverSrc(null)}>ยกเลิก</button>
                <button className="ps-btn-confirm" onClick={handleUploadCover} disabled={uploadingCover}>{uploadingCover ? 'กำลังอัปโหลด...' : 'ยืนยัน'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
