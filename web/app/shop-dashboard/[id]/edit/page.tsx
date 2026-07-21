"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';
import AddressFields, { AddressValue, emptyAddress, composeAddress } from '@/app/components/AddressFields';
import { SPECIES_LIST } from '@/lib/species';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};


const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Locate: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

interface ProfileData {
  full_name: string | null; phone: string | null;
  house_no: string | null; room_no: string | null; moo: string | null;
  soi: string | null; road: string | null; sub_district: string | null;
  district: string | null; province: string | null; postal_code: string | null;
}

export default function ShopEditPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({ shop_name: '', owner_name: '', phone: '', bio: '' });
  const [addr, setAddr] = useState<AddressValue>(emptyAddress());
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/shop-dashboard/${shopId}/edit`)}`);

      const [shopRes, profileRes] = await Promise.all([
        supabase.from('shops').select('*').eq('id', shopId).single(),
        supabase.from('profiles').select('full_name, phone, house_no, room_no, moo, soi, road, sub_district, district, province, postal_code').eq('id', session.user.id).single(),
      ]);

      if (shopRes.error || !shopRes.data) return router.push('/partner');
      const data = shopRes.data;
      setForm({
        shop_name: data.shop_name || '',
        owner_name: data.owner_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
      });
      setAddr({
        house_no: data.house_no || "", room_no: data.room_no || "",
        moo: data.moo || "", soi: data.soi || "", road: data.road || "",
        sub_district: data.sub_district || "", district: data.district || "",
        province: data.province || "", postal_code: data.postal_code || "",
      });
      if (data.lat) setMapLat(data.lat);
      if (data.lng) setMapLng(data.lng);
      const sp = data.supported_species;
      if (Array.isArray(sp)) setSelectedSpecies(sp);
      else if (typeof sp === 'string' && sp) setSelectedSpecies(sp.split(',').filter(Boolean));

      if (profileRes.data) setProfileData(profileRes.data);
      setLoading(false);
    };
    if (shopId) load();
  }, [shopId, router]);

  useEffect(() => {
    if (!mapVisible) return;
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;
      const lat = mapLat ?? 13.7563, lng = mapLng ?? 100.5018;
      const map = L.map(mapRef.current).setView([lat, lng], mapLat ? 15 : 13);
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

  const handleUseProfileAddress = () => {
    if (!profileData) return;
    setAddr({
      house_no: profileData.house_no || "",
      room_no: profileData.room_no || "",
      moo: profileData.moo || "",
      soi: profileData.soi || "",
      road: profileData.road || "",
      sub_district: profileData.sub_district || "",
      district: profileData.district || "",
      province: profileData.province || "",
      postal_code: profileData.postal_code || "",
    });
    setForm(prev => ({
      ...prev,
      ...(profileData.phone ? { phone: profileData.phone } : {}),
      ...(profileData.full_name ? { owner_name: profileData.full_name } : {}),
    }));
  };

  const toggleSpecies = (id: string) =>
    setSelectedSpecies(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!form.shop_name.trim()) return alert('กรุณากรอกชื่อร้าน');
    if (!form.owner_name.trim()) return alert('กรุณากรอกชื่อ-สกุลเจ้าของ');
    if (!form.phone.trim()) return alert('กรุณากรอกเบอร์โทรศัพท์');
    if (!addr.province.trim()) return alert('กรุณาระบุที่อยู่ร้าน (จังหวัด)');
    if (mapLat === null || mapLng === null) return alert('กรุณาปักหมุดตำแหน่งร้านบนแผนที่');
    if (selectedSpecies.length === 0) return alert('กรุณาเลือกสัตว์ที่ร้านรองรับอย่างน้อย 1 ชนิด');

    setIsSaving(true);
    try {
      const { error } = await supabase.from('shops').update({
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
        supported_species: selectedSpecies,
      }).eq('id', shopId);
      if (error) throw error;
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      router.back();
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setIsSaving(false); }
  };

  if (loading) return <PageLoader />;

  const hasProfileAddr = !!(profileData?.province);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .she-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .she-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 32px; }
        .she-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .she-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .she-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .she-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .she-sub { font-size: 12px; font-weight: 600; color: ${F.teal}; margin-top: 2px; }
        .she-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .she-card-title { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .she-field { margin-bottom: 16px; }
        .she-field:last-child { margin-bottom: 0; }
        .she-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .she-req { color: #E84677; }
        .she-input, .she-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .she-input:focus, .she-textarea:focus { border-color: ${F.teal}; box-shadow: 0 0 0 3px ${F.tealSoft}; }
        .she-textarea { resize: none; }
        .she-addr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .she-addr-label { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-left: 2px; }
        .she-profile-addr-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1.5px solid ${F.tealBorder}; background: ${F.tealSoft}; color: ${F.teal}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap; }
        .she-profile-addr-btn:hover { background: #CCFBF1; border-color: ${F.teal}; }
        .she-species-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .she-species-btn { padding: 12px 4px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all .15s; font-family: inherit; }
        .she-species-btn.active { border-color: ${F.teal}; background: ${F.tealSoft}; }
        .she-species-btn .emoji { width: 28px; height: 28px; object-fit: contain; }
        .she-species-btn .lbl { font-size: 10px; font-weight: 700; color: ${F.inkSoft}; }
        .she-species-btn.active .lbl { color: ${F.teal}; }
        .she-map-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 14px; border: 1.5px dashed ${F.lineMid}; background: white; cursor: pointer; width: 100%; font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.inkSoft}; transition: all .15s; }
        .she-map-toggle:hover { border-color: ${F.teal}; color: ${F.teal}; }
        .she-map-toggle.has-pin { border-style: solid; border-color: #16A34A; color: #16A34A; }
        .she-map-box { border-radius: 14px; overflow: hidden; border: 1px solid ${F.lineMid}; margin-top: 10px; height: 260px; }
        .she-map-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .she-geo-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid ${F.lineMid}; background: white; font-size: 12px; font-weight: 700; color: ${F.ink}; cursor: pointer; font-family: inherit; transition: all .15s; }
        .she-geo-btn:hover { background: ${F.tealSoft}; border-color: ${F.teal}; color: ${F.teal}; }
        .she-pin-coords { font-size: 11px; color: ${F.muted}; }
        .she-actions { display: flex; gap: 12px; margin-top: 24px; }
        .she-cancel-btn { flex: 0 0 auto; padding: 14px 22px; background: white; color: #4B5563; border: 1.5px solid #E5E7EB; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .she-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.teal}; color: white; box-shadow: 0 4px 14px rgba(13,148,136,0.3); }
        .she-btn:hover { background: #0B7E74; }
        .she-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 420px) { .she-species-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="she-page">
        <div className="she-body">
          <div className="she-header">
            <button className="she-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="she-title">ตั้งค่าหน้าร้าน</h1>
              <p className="she-sub">แก้ไขข้อมูลและรายละเอียดร้านค้า</p>
            </div>
          </div>

          <div className="she-card">
            <div className="she-field">
              <label className="she-label">ชื่อร้าน <span className="she-req">*</span></label>
              <input className="she-input" value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} placeholder="ชื่อร้านค้าของคุณ" />
            </div>
            <div className="she-field">
              <label className="she-label">ชื่อ-สกุลเจ้าของ <span className="she-req">*</span></label>
              <input className="she-input" value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="ชื่อจริง นามสกุล" />
            </div>
            <div className="she-field">
              <label className="she-label">เบอร์โทรศัพท์ <span className="she-req">*</span></label>
              <input type="tel" className="she-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
            </div>
            <div className="she-field">
              <div className="she-addr-header">
                <span className="she-addr-label">ที่อยู่ร้าน <span className="she-req">*</span></span>
                {hasProfileAddr && (
                  <button type="button" className="she-profile-addr-btn" onClick={handleUseProfileAddress}>
                    <Icon.User /> ใช้ที่อยู่จากโปรไฟล์หลัก
                  </button>
                )}
              </div>
              <AddressFields value={addr} onChange={setAddr} required />
            </div>
            <div className="she-field">
              <label className="she-label">รายละเอียดเพิ่มเติม</label>
              <textarea className="she-textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="แนะนำร้านค้าหรือสินค้าเด่นของร้าน..." />
            </div>
          </div>

          <div className="she-card">
            <div className="she-card-title"><Icon.MapPin /> ตำแหน่งร้านบนแผนที่ <span className="she-req">*</span></div>
            <button type="button" className={`she-map-toggle ${mapLat !== null ? 'has-pin' : ''}`} onClick={() => setMapVisible(v => !v)}>
              <Icon.MapPin />
              {mapLat !== null ? `ปักหมุดแล้ว (${mapLat.toFixed(4)}, ${mapLng?.toFixed(4)})` : 'แตะเพื่อเปิดแผนที่และปักหมุด'}
            </button>
            {mapVisible && (
              <>
                <div className="she-map-box" ref={mapRef} />
                <div className="she-map-actions">
                  <button type="button" className="she-geo-btn" onClick={handleGeolocate}><Icon.Locate /> ใช้ตำแหน่งปัจจุบัน</button>
                  {mapLat !== null && <span className="she-pin-coords">{mapLat.toFixed(5)}, {mapLng?.toFixed(5)}</span>}
                </div>
                <p style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>ลากหมุดบนแผนที่เพื่อปรับตำแหน่ง</p>
              </>
            )}
          </div>

          <div className="she-card">
            <div className="she-card-title">ร้านของคุณมีของสำหรับสัตว์ชนิดใดบ้าง? <span className="she-req">*</span></div>
            <div className="she-species-grid">
              {SPECIES_LIST.map(s => (
                <button key={s.id} type="button" className={`she-species-btn ${selectedSpecies.includes(s.id) ? 'active' : ''}`} onClick={() => toggleSpecies(s.id)}>
                  <img className="emoji" src={s.icon} alt={s.th} /><span className="lbl">{s.th}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="she-actions">
            <button type="button" className="she-cancel-btn" onClick={() => router.back()}>ยกเลิก</button>
            <button type="button" className="she-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
