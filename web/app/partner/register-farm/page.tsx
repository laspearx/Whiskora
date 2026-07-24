"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OTHER_SPECIES } from '@/lib/species';
import Cropper from 'react-easy-crop';
import AddressFields, { AddressValue, emptyAddress, composeAddress } from '@/app/components/AddressFields';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Trash: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Locate: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>,
};

export default function RegisterFarmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  const [form, setForm] = useState({
    farmName: '', ownerName: '', species: '', subSpecies: '', customSpecies: '',
    phone: '', bio: '',
  });
  const [addr, setAddr] = useState<AddressValue>(emptyAddress());
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('profiles').select('full_name,phone,house_no,room_no,moo,soi,road,sub_district,district,province,postal_code').eq('id', session.user.id).single().then(({ data }) => {
        if (data) setProfileData(data);
      });
    });
  }, []);

  const fillFromProfile = () => {
    if (!profileData) return;
    setForm(f => ({ ...f, ownerName: profileData.full_name || '', phone: profileData.phone || '' }));
    setAddr({
      house_no: profileData.house_no || '', room_no: profileData.room_no || '',
      moo: profileData.moo || '', soi: profileData.soi || '', road: profileData.road || '',
      sub_district: profileData.sub_district || '', district: profileData.district || '',
      province: profileData.province || '', postal_code: profileData.postal_code || '',
    });
  };

  // ── Map state ─────────────────────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

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
    if (!avatarSrc || !avatarAreaPx) return;
    try {
      setUploadingAvatar(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const blob = await getCroppedImg(avatarSrc, avatarAreaPx, true);
      const url = await uploadToStorage(blob, `farms/${session.user.id}/new-logo-${Date.now()}.jpg`);
      setImageUrl(url); setAvatarSrc(null);
    } catch { alert('อัปโหลดรูปโปรไฟล์ไม่สำเร็จ'); }
    finally { setUploadingAvatar(false); }
  };

  const handleUploadCover = async () => {
    if (!coverSrc || !coverAreaPx) return;
    try {
      setUploadingCover(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const blob = await getCroppedImg(coverSrc, coverAreaPx);
      const url = await uploadToStorage(blob, `farms/${session.user.id}/new-cover-${Date.now()}.jpg`);
      setCoverUrl(url); setCoverSrc(null);
    } catch { alert('อัปโหลดภาพปกไม่สำเร็จ'); }
    finally { setUploadingCover(false); }
  };

  const handleSubmit = async () => {
    if (!form.farmName.trim()) return alert('กรุณากรอกชื่อฟาร์ม');
    if (!form.ownerName.trim()) return alert('กรุณากรอกชื่อ-สกุลเจ้าของฟาร์ม');
    if (!form.phone.trim()) return alert('กรุณากรอกเบอร์โทรศัพท์');
    if (!addr.province.trim()) return alert('กรุณาระบุที่อยู่ฟาร์ม (จังหวัด)');
    if (mapLat === null || mapLng === null) return alert('กรุณาปักหมุดตำแหน่งฟาร์มบนแผนที่');
    if (!form.species) return alert('กรุณาเลือกชนิดสัตว์ที่เพาะพันธุ์');

    let finalSpecies = form.species;
    if (form.species === 'other') {
      if (!form.subSpecies) return alert('กรุณาเลือกชนิดสัตว์');
      finalSpecies = form.subSpecies === 'other' ? form.customSpecies.trim() : form.subSpecies;
      if (form.subSpecies === 'other' && !form.customSpecies.trim()) return alert('กรุณาระบุชื่อสัตว์');
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent('/partner/register-farm')}`); return; }
      const { data: farmData, error } = await supabase.from('farms').insert([{
        user_id: session.user.id,
        farm_name: form.farmName,
        owner_name: form.ownerName,
        species: finalSpecies,
        phone: form.phone,
        address: composeAddress(addr),
        house_no: addr.house_no || null, room_no: addr.room_no || null,
        moo: addr.moo || null, soi: addr.soi || null, road: addr.road || null,
        sub_district: addr.sub_district || null, district: addr.district || null,
        province: addr.province || null, postal_code: addr.postal_code || null,
        lat: mapLat,
        lng: mapLng,
        bio: form.bio,
        image_url: imageUrl || null,
        cover_url: coverUrl || null,
      }]).select('id').single();
      if (error) throw error;

      const { data: wsData } = await supabase.from('workspaces').insert({
        type: 'farm', name: form.farmName,
        owner_id: session.user.id, entity_id: farmData.id, avatar_url: imageUrl || null,
      }).select('id').single();
      if (wsData) {
        await supabase.from('workspace_members').insert({
          workspace_id: wsData.id, user_id: session.user.id, role: 'owner',
        });
      }

      alert('ยินดีด้วย! เปิดฟาร์มใหม่เรียบร้อยแล้ว');
      router.push('/partner');
      router.refresh();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message || err.details}`);
    } finally { setLoading(false); }
  };

  const canSubmit = !loading && !uploadingAvatar && !uploadingCover;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pf-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; }
        .pf-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 32px; }
        .pf-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .pf-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .pf-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .pf-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .pf-sub { font-size: 12px; font-weight: 600; color: ${F.pink}; margin-top: 2px; }

        .pf-cover-wrap { margin-bottom: 24px; }
        .pf-cover-label { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 8px; letter-spacing: 0.04em; text-transform: uppercase; }
        .pf-cover-box { position: relative; width: 100%; aspect-ratio: 3/1; border-radius: 18px; overflow: hidden; background: ${F.pinkSoft}; border: 2px dashed ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .15s; }
        .pf-cover-box:hover { border-color: ${F.pink}; }
        .pf-cover-box img { width: 100%; height: 100%; object-fit: cover; }
        .pf-cover-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: ${F.muted}; }
        .pf-cover-placeholder-icon { width: 48px; height: 48px; border-radius: 14px; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); color: ${F.pink}; }
        .pf-cover-placeholder-text { font-size: 13px; font-weight: 600; }
        .pf-cover-optional { font-size: 11px; color: ${F.muted}; margin-top: 2px; }
        .pf-cover-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; }
        .pf-cover-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 10px; border: none; cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit; transition: all .15s; }
        .pf-cover-btn-edit { background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); color: ${F.ink}; }
        .pf-cover-btn-edit:hover { background: white; }
        .pf-cover-btn-del { background: rgba(239,68,68,0.12); color: #DC2626; }
        .pf-cover-btn-del:hover { background: rgba(239,68,68,0.2); }

        .pf-avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
        .pf-avatar-wrap { position: relative; }
        .pf-avatar-circle { width: 110px; height: 110px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 3px solid white; box-shadow: 0 4px 16px rgba(232,70,119,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: box-shadow .18s; }
        .pf-avatar-circle:hover { box-shadow: 0 6px 22px rgba(232,70,119,0.25); }
        .pf-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .pf-avatar-cam { position: absolute; bottom: 2px; right: 2px; width: 36px; height: 36px; border-radius: 50%; background: ${F.pink}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
        .pf-avatar-cam:hover { background: #D63F6A; }
        .pf-avatar-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; letter-spacing: 0.04em; }
        .pf-avatar-del { margin-top: 6px; display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; background: none; border: 1px solid #FCA5A5; color: #DC2626; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .15s; }
        .pf-avatar-del:hover { background: #FEF2F2; }

        .pf-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .pf-card-title { font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .pf-field { margin-bottom: 16px; }
        .pf-field:last-child { margin-bottom: 0; }
        .pf-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .pf-req { color: ${F.pink}; }
        .pf-input, .pf-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .pf-input:focus, .pf-textarea:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .pf-textarea { resize: none; }
        .pf-species { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .pf-species-btn { padding: 14px 8px; border-radius: 14px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
        .pf-species-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .pf-species-btn .emoji { width: 32px; height: 32px; object-fit: contain; }
        .pf-species-btn .lbl { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; }
        .pf-species-btn.active .lbl { color: ${F.pink}; }
        .pf-other-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .pf-other-btn { padding: 10px 4px; border-radius: 11px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all .15s; font-family: inherit; }
        .pf-other-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .pf-other-btn .emoji { width: 28px; height: 28px; object-fit: contain; }
        .pf-other-btn .lbl { font-size: 9px; font-weight: 700; color: ${F.inkSoft}; text-align: center; line-height: 1.2; }
        .pf-other-btn.active .lbl { color: ${F.pink}; }

        /* ── Map ── */
        .pf-map-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 14px; border: 1.5px dashed ${F.lineMid}; background: white; cursor: pointer; width: 100%; font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.inkSoft}; transition: all .15s; }
        .pf-map-toggle:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .pf-map-toggle.has-pin { border-style: solid; border-color: #16A34A; color: #16A34A; }
        .pf-map-box { border-radius: 14px; overflow: hidden; border: 1px solid ${F.lineMid}; margin-top: 10px; height: 260px; }
        .pf-map-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .pf-geo-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid ${F.lineMid}; background: white; font-size: 12px; font-weight: 700; color: ${F.ink}; cursor: pointer; font-family: inherit; transition: all .15s; }
        .pf-geo-btn:hover { background: ${F.pinkSoft}; border-color: ${F.pink}; color: ${F.pink}; }
        .pf-pin-coords { font-size: 11px; color: ${F.muted}; font-weight: 500; }

        .pf-actions { display: flex; gap: 12px; margin-top: 24px; }
        .pf-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .pf-btn:hover { background: #D63F6A; }
        .pf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pf-autofill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 20px; border: 1.5px solid ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; margin-bottom: 14px; }
        .pf-autofill-btn:hover { background: #FCE7EF; }

        .pf-modal { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); padding: 16px; }
        .pf-modal-card { background: white; width: 100%; max-width: 400px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .pf-crop-area { position: relative; width: 100%; background: #111; }
        .pf-crop-area-sq { height: 300px; }
        .pf-crop-area-wide { height: 200px; }
        .pf-modal-body { padding: 20px; }
        .pf-zoom { width: 100%; accent-color: ${F.pink}; margin-bottom: 16px; }
        .pf-modal-btns { display: flex; gap: 10px; }
        .pf-btn-cancel { flex: 1; padding: 14px; border-radius: 14px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .pf-btn-cancel:hover { background: ${F.line}; }
        .pf-btn-confirm { flex: 1; padding: 14px; border-radius: 14px; background: ${F.pink}; color: white; border: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .pf-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="pf-page">
        <div className="pf-body">
          <div className="pf-header">
            <button className="pf-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="pf-title">เปิดฟาร์มสัตว์เลี้ยง</h1>
              <p className="pf-sub">ฟาร์มบรีดสัตว์เลี้ยงที่น่ารักเพื่อคนรักสัตว์</p>
            </div>
          </div>

          {/* ── ภาพปก (ไม่บังคับ) ── */}
          <div className="pf-cover-wrap">
            <p className="pf-cover-label">ภาพปกฟาร์ม</p>
            <div className="pf-cover-box" onClick={() => !coverUrl && coverInputRef.current?.click()}>
              {coverUrl ? (
                <>
                  <img src={coverUrl} alt="ภาพปก" />
                  <div className="pf-cover-actions">
                    <button type="button" className="pf-cover-btn pf-cover-btn-edit" onClick={e => { e.stopPropagation(); coverInputRef.current?.click(); }}>
                      <Icon.Camera /> เปลี่ยน
                    </button>
                    <button type="button" className="pf-cover-btn pf-cover-btn-del" onClick={e => { e.stopPropagation(); setCoverUrl(null); }}>
                      <Icon.Trash /> ลบ
                    </button>
                  </div>
                </>
              ) : (
                <div className="pf-cover-placeholder">
                  <div className="pf-cover-placeholder-icon"><Icon.Camera /></div>
                  <p className="pf-cover-placeholder-text">แตะเพื่อเพิ่มภาพปก</p>
                  <p className="pf-cover-optional">(ไม่บังคับ)</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={coverInputRef} onChange={e => onFileChange(e, setCoverSrc)} onClick={e => (e.currentTarget.value = '')} style={{ display: 'none' }} />
          </div>

          {/* ── รูปโปรไฟล์ฟาร์ม ── */}
          <div className="pf-avatar-section">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar-circle" onClick={() => avatarInputRef.current?.click()}>
                {imageUrl
                  ? <img src={imageUrl} alt="โลโก้ฟาร์ม" />
                  : <img src="/icons/icon-farm.png" alt="" style={{ width: 52, height: 52, objectFit: 'contain', opacity: 0.4 }} />}
              </div>
              <button type="button" className="pf-avatar-cam" onClick={() => avatarInputRef.current?.click()}><Icon.Camera /></button>
              <input type="file" accept="image/*" ref={avatarInputRef} onChange={e => onFileChange(e, setAvatarSrc)} onClick={e => (e.currentTarget.value = '')} style={{ display: 'none' }} />
            </div>
            <p className="pf-avatar-hint">โลโก้ / รูปโปรไฟล์ฟาร์ม (ไม่บังคับ)</p>
            {imageUrl && (
              <button type="button" className="pf-avatar-del" onClick={() => setImageUrl(null)}>
                <Icon.Trash /> ลบรูปโปรไฟล์
              </button>
            )}
          </div>

          {/* ── ข้อมูลพื้นฐาน ── */}
          <div className="pf-card">
            <div className="pf-field">
              <label className="pf-label">ชื่อฟาร์มของคุณ <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.farmName} onChange={e => setForm({ ...form, farmName: e.target.value })} placeholder="เช่น Happy Paw Cattery" />
            </div>

            {profileData && (
              <button type="button" className="pf-autofill-btn" onClick={fillFromProfile}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ใช้ข้อมูลจากโปรไฟล์ของฉัน
              </button>
            )}

            <div className="pf-field">
              <label className="pf-label">ชื่อ-สกุลเจ้าของฟาร์ม <span className="pf-req">*</span></label>
              <input className="pf-input" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} placeholder="ชื่อจริง นามสกุล" />
            </div>

            <div className="pf-field">
              <label className="pf-label">เบอร์โทรศัพท์ <span className="pf-req">*</span></label>
              <input type="tel" className="pf-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
            </div>

            <div className="pf-field">
              <label className="pf-label">ที่อยู่ <span className="pf-req">*</span></label>
              <AddressFields value={addr} onChange={setAddr} required />
            </div>
          </div>

          {/* ── หมุดแผนที่ ── */}
          <div className="pf-card">
            <div className="pf-card-title"><Icon.MapPin /> ตำแหน่งฟาร์มบนแผนที่ <span className="pf-req">*</span></div>
            <button
              type="button"
              className={`pf-map-toggle ${mapLat !== null ? 'has-pin' : ''}`}
              onClick={() => setMapVisible(v => !v)}
            >
              <Icon.MapPin />
              {mapLat !== null ? `ปักหมุดแล้ว (${mapLat.toFixed(4)}, ${mapLng?.toFixed(4)})` : 'แตะเพื่อเปิดแผนที่และปักหมุด'}
            </button>
            {mapVisible && (
              <>
                <div className="pf-map-box" ref={mapRef} />
                <div className="pf-map-actions">
                  <button type="button" className="pf-geo-btn" onClick={handleGeolocate}>
                    <Icon.Locate /> ใช้ตำแหน่งปัจจุบัน
                  </button>
                  {mapLat !== null && (
                    <span className="pf-pin-coords">{mapLat.toFixed(5)}, {mapLng?.toFixed(5)}</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>ลากหมุดบนแผนที่เพื่อปรับตำแหน่ง</p>
              </>
            )}
          </div>

          {/* ── ชนิดสัตว์ ── */}
          <div className="pf-card">
            <div className="pf-field">
              <label className="pf-label">ชนิดสัตว์ที่เพาะพันธุ์ <span className="pf-req">*</span></label>
              <div className="pf-species">
                {[{ id: 'cat', icon: '/icons/icon-species-cat.png', lbl: 'แมว' }, { id: 'dog', icon: '/icons/icon-species-dog.png', lbl: 'สุนัข' }, { id: 'other', icon: '/icons/icon-paw-pink.png', lbl: 'อื่นๆ' }].map(t => (
                  <button key={t.id} type="button" className={`pf-species-btn ${form.species === t.id ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, species: t.id, subSpecies: '', customSpecies: '' })}>
                    <img className="emoji" src={t.icon} alt={t.lbl} /><span className="lbl">{t.lbl}</span>
                  </button>
                ))}
              </div>
              {form.species === 'other' && (
                <div className="pf-other-grid">
                  {OTHER_SPECIES.map(o => (
                    <button key={o.id} type="button" className={`pf-other-btn ${form.subSpecies === o.id ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, subSpecies: o.id, customSpecies: '' })}>
                      <img className="emoji" src={o.icon} alt={o.th} /><span className="lbl">{o.th}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.species === 'other' && form.subSpecies === 'other' && (
                <input className="pf-input" style={{ marginTop: 10 }} value={form.customSpecies}
                  onChange={e => setForm({ ...form, customSpecies: e.target.value })} placeholder="เช่น ชินชิลล่า, เฟอร์เรท" />
              )}
            </div>
          </div>

          {/* ── รายละเอียดเพิ่มเติม ── */}
          <div className="pf-card">
            <div className="pf-field">
              <label className="pf-label">รายละเอียดเพิ่มเติม</label>
              <textarea className="pf-textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="บอกเล่าประสบการณ์ ความตั้งใจ หรือสายพันธุ์ที่เพาะ..." />
            </div>
          </div>

          <div className="pf-actions">
            <button type="button" className="pf-btn-cancel" onClick={() => router.back()}>ยกเลิก</button>
            <button type="button" className="pf-btn" onClick={handleSubmit} disabled={!canSubmit}>
              {loading ? 'กำลังบันทึก...' : 'ยืนยันการเปิดฟาร์ม'}
            </button>
          </div>
        </div>
      </div>

      {/* Crop modal: avatar */}
      {avatarSrc && (
        <div className="pf-modal">
          <div className="pf-modal-card">
            <div className="pf-crop-area pf-crop-area-sq">
              <Cropper image={avatarSrc} crop={avatarCrop} zoom={avatarZoom} aspect={1} cropShape="round"
                onCropChange={setAvatarCrop} onCropComplete={onAvatarCropComplete} onZoomChange={setAvatarZoom} />
            </div>
            <div className="pf-modal-body">
              <input type="range" className="pf-zoom" value={avatarZoom} min={1} max={3} step={0.1} onChange={e => setAvatarZoom(Number(e.target.value))} />
              <div className="pf-modal-btns">
                <button className="pf-btn-cancel" onClick={() => setAvatarSrc(null)}>ยกเลิก</button>
                <button className="pf-btn-confirm" onClick={handleUploadAvatar} disabled={uploadingAvatar}>{uploadingAvatar ? 'กำลังอัปโหลด...' : 'ยืนยัน'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop modal: cover */}
      {coverSrc && (
        <div className="pf-modal">
          <div className="pf-modal-card" style={{ maxWidth: 480 }}>
            <div className="pf-crop-area pf-crop-area-wide">
              <Cropper image={coverSrc} crop={coverCrop} zoom={coverZoom} aspect={3}
                onCropChange={setCoverCrop} onCropComplete={onCoverCropComplete} onZoomChange={setCoverZoom} />
            </div>
            <div className="pf-modal-body">
              <input type="range" className="pf-zoom" value={coverZoom} min={1} max={3} step={0.1} onChange={e => setCoverZoom(Number(e.target.value))} />
              <div className="pf-modal-btns">
                <button className="pf-btn-cancel" onClick={() => setCoverSrc(null)}>ยกเลิก</button>
                <button className="pf-btn-confirm" onClick={handleUploadCover} disabled={uploadingCover}>{uploadingCover ? 'กำลังอัปโหลด...' : 'ยืนยัน'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
