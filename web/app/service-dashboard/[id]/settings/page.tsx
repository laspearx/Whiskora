"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';
import AddressFields, { AddressValue, emptyAddress, composeAddress } from '@/app/components/AddressFields';
import { SPECIES_LIST } from '@/lib/species';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

const SERVICE_CATEGORIES = [
  { id: 'grooming', label: 'อาบน้ำตัดขน', emoji: '✂️' },
  { id: 'transport', label: 'รับส่งสัตว์เลี้ยง', emoji: '🚗' },
  { id: 'cat_hotel', label: 'โรงแรมสัตว์', emoji: '🏨' },
  { id: 'pet_care', label: 'บริการดูแลสัตว์เลี้ยง', emoji: '🦮' },
  { id: 'clinic', label: 'คลินิก / โรงพยาบาลสัตว์', emoji: '🏥' },
];


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

export default function ServiceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({ service_name: '', owner_name: '', phone: '', category: '', bio: '' });
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
      if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/service-dashboard/${serviceId}/settings`)}`);

      const [serviceRes, profileRes] = await Promise.all([
        supabase.from('services').select('*').eq('id', serviceId).single(),
        supabase.from('profiles').select('full_name, phone, house_no, room_no, moo, soi, road, sub_district, district, province, postal_code').eq('id', session.user.id).single(),
      ]);

      if (serviceRes.error || !serviceRes.data) return router.push('/partner');
      const data = serviceRes.data;
      setForm({
        service_name: data.service_name || '',
        owner_name: data.owner_name || '',
        phone: data.phone || '',
        category: data.category || '',
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
    if (serviceId) load();
  }, [serviceId, router]);

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
    if (!form.service_name.trim()) return alert('กรุณากรอกชื่อร้าน / ชื่อบริการ');
    if (!form.owner_name.trim()) return alert('กรุณากรอกชื่อ-สกุลเจ้าของ');
    if (!form.phone.trim()) return alert('กรุณากรอกเบอร์โทรศัพท์');
    if (!addr.province.trim()) return alert('กรุณาระบุที่อยู่ / สถานที่ให้บริการ (จังหวัด)');
    if (mapLat === null || mapLng === null) return alert('กรุณาปักหมุดตำแหน่งบนแผนที่');
    if (!form.category) return alert('กรุณาเลือกประเภทบริการ');
    if (selectedSpecies.length === 0) return alert('กรุณาเลือกสัตว์ที่รองรับอย่างน้อย 1 ชนิด');

    setIsSaving(true);
    try {
      const { error } = await supabase.from('services').update({
        service_name: form.service_name,
        owner_name: form.owner_name,
        phone: form.phone,
        category: form.category,
        bio: form.bio,
        address: composeAddress(addr),
        house_no: addr.house_no || null, room_no: addr.room_no || null,
        moo: addr.moo || null, soi: addr.soi || null, road: addr.road || null,
        sub_district: addr.sub_district || null, district: addr.district || null,
        province: addr.province || null, postal_code: addr.postal_code || null,
        lat: mapLat,
        lng: mapLng,
        supported_species: selectedSpecies.join(','),
      }).eq('id', serviceId);
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
        .se-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .se-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .se-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .se-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .se-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .se-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .se-sub { font-size: 12px; font-weight: 600; color: ${F.blue}; margin-top: 2px; }
        .se-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .se-card-title { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .se-field { margin-bottom: 16px; }
        .se-field:last-child { margin-bottom: 0; }
        .se-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .se-req { color: #E84677; }
        .se-input, .se-select, .se-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .se-input:focus, .se-select:focus, .se-textarea:focus { border-color: ${F.blue}; box-shadow: 0 0 0 3px ${F.blueSoft}; }
        .se-textarea { resize: none; }
        .se-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .se-addr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .se-addr-label { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-left: 2px; }
        .se-profile-addr-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1.5px solid ${F.blueBorder}; background: ${F.blueSoft}; color: ${F.blue}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap; }
        .se-profile-addr-btn:hover { background: #DBEAFE; border-color: ${F.blue}; }
        .se-species-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .se-species-btn { padding: 12px 4px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all .15s; font-family: inherit; }
        .se-species-btn.active { border-color: ${F.blue}; background: ${F.blueSoft}; }
        .se-species-btn .emoji { width: 28px; height: 28px; object-fit: contain; }
        .se-species-btn .lbl { font-size: 10px; font-weight: 700; color: ${F.inkSoft}; }
        .se-species-btn.active .lbl { color: ${F.blue}; }
        .se-map-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 14px; border: 1.5px dashed ${F.lineMid}; background: white; cursor: pointer; width: 100%; font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.inkSoft}; transition: all .15s; }
        .se-map-toggle:hover { border-color: ${F.blue}; color: ${F.blue}; }
        .se-map-toggle.has-pin { border-style: solid; border-color: #16A34A; color: #16A34A; }
        .se-map-box { border-radius: 14px; overflow: hidden; border: 1px solid ${F.lineMid}; margin-top: 10px; height: 260px; }
        .se-map-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .se-geo-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid ${F.lineMid}; background: white; font-size: 12px; font-weight: 700; color: ${F.ink}; cursor: pointer; font-family: inherit; transition: all .15s; }
        .se-geo-btn:hover { background: ${F.blueSoft}; border-color: ${F.blue}; color: ${F.blue}; }
        .se-pin-coords { font-size: 11px; color: ${F.muted}; }
        .se-savebar { position: fixed; bottom: calc(68px + env(safe-area-inset-bottom, 0px)); left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .se-savebar-inner { max-width: 600px; margin: 0 auto; display: flex; gap: 12px; }
        .se-cancel-btn { flex: 0 0 auto; padding: 14px 22px; background: white; color: #4B5563; border: 1.5px solid #E5E7EB; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .se-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.blue}; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
        .se-btn:hover { background: #1D4FD7; }
        .se-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 420px) { .se-species-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="se-page">
        <div className="se-body">
          <div className="se-header">
            <button className="se-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="se-title">ข้อมูลสถานบริการ</h1>
              <p className="se-sub">แก้ไขข้อมูลและรายละเอียดบริการ</p>
            </div>
          </div>

          <div className="se-card">
            <div className="se-field">
              <label className="se-label">ชื่อร้าน / ชื่อบริการ <span className="se-req">*</span></label>
              <input className="se-input" value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })} placeholder="ชื่อบริการของคุณ" />
            </div>
            <div className="se-field">
              <label className="se-label">ชื่อ-สกุลเจ้าของ <span className="se-req">*</span></label>
              <input className="se-input" value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="ชื่อจริง นามสกุล" />
            </div>
            <div className="se-field">
              <label className="se-label">ประเภทบริการ <span className="se-req">*</span></label>
              <select className="se-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="" disabled>เลือกประเภทบริการ</option>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="se-field">
              <label className="se-label">เบอร์โทรศัพท์ <span className="se-req">*</span></label>
              <input type="tel" className="se-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
            </div>
            <div className="se-field">
              <div className="se-addr-header">
                <span className="se-addr-label">ที่อยู่ / สถานที่ให้บริการ <span className="se-req">*</span></span>
                {hasProfileAddr && (
                  <button type="button" className="se-profile-addr-btn" onClick={handleUseProfileAddress}>
                    <Icon.User /> ใช้ที่อยู่จากโปรไฟล์หลัก
                  </button>
                )}
              </div>
              <AddressFields value={addr} onChange={setAddr} required />
            </div>
            <div className="se-field">
              <label className="se-label">รายละเอียดเพิ่มเติม</label>
              <textarea className="se-textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="อธิบายจุดเด่นหรือรายละเอียดของบริการ..." />
            </div>
          </div>

          <div className="se-card">
            <div className="se-card-title"><Icon.MapPin /> ตำแหน่งบนแผนที่ <span className="se-req">*</span></div>
            <button type="button" className={`se-map-toggle ${mapLat !== null ? 'has-pin' : ''}`} onClick={() => setMapVisible(v => !v)}>
              <Icon.MapPin />
              {mapLat !== null ? `ปักหมุดแล้ว (${mapLat.toFixed(4)}, ${mapLng?.toFixed(4)})` : 'แตะเพื่อเปิดแผนที่และปักหมุด'}
            </button>
            {mapVisible && (
              <>
                <div className="se-map-box" ref={mapRef} />
                <div className="se-map-actions">
                  <button type="button" className="se-geo-btn" onClick={handleGeolocate}><Icon.Locate /> ใช้ตำแหน่งปัจจุบัน</button>
                  {mapLat !== null && <span className="se-pin-coords">{mapLat.toFixed(5)}, {mapLng?.toFixed(5)}</span>}
                </div>
                <p style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>ลากหมุดบนแผนที่เพื่อปรับตำแหน่ง</p>
              </>
            )}
          </div>

          <div className="se-card">
            <div className="se-card-title">บริการที่รองรับสัตว์ชนิดใดบ้าง? <span className="se-req">*</span></div>
            <div className="se-species-grid">
              {SPECIES_LIST.map(s => (
                <button key={s.id} type="button" className={`se-species-btn ${selectedSpecies.includes(s.id) ? 'active' : ''}`} onClick={() => toggleSpecies(s.id)}>
                  <img className="emoji" src={s.icon} alt={s.th} /><span className="lbl">{s.th}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="se-savebar">
          <div className="se-savebar-inner">
            <button type="button" className="se-cancel-btn" onClick={() => router.back()}>ยกเลิก</button>
            <button type="button" className="se-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
