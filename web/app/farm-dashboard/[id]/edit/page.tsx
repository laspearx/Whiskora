"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";
import AddressFields, { AddressValue, emptyAddress, composeAddress } from "@/app/components/AddressFields";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  line: "#F3F4F6", lineMid: "#E5E7EB",
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Locate: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  house_no: string | null; room_no: string | null;
  moo: string | null; soi: string | null; road: string | null;
  sub_district: string | null; district: string | null;
  province: string | null; postal_code: string | null;
}

export default function EditFarmPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState<AddressValue>(emptyAddress());
  const [bio, setBio] = useState("");

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
      if (!session) { router.push("/login"); return; }

      const [farmRes, profileRes] = await Promise.all([
        supabase.from("farms").select("*").eq("id", farmId).eq("user_id", session.user.id).single(),
        supabase.from("profiles").select("full_name, phone, house_no, room_no, moo, soi, road, sub_district, district, province, postal_code").eq("id", session.user.id).single(),
      ]);

      if (!farmRes.data) { router.push("/partner"); return; }
      const data = farmRes.data;
      setFarmName(data.farm_name || "");
      setOwnerName(data.owner_name || "");
      setPhone(data.phone || "");
      setAddr({
        house_no: data.house_no || "", room_no: data.room_no || "",
        moo: data.moo || "", soi: data.soi || "", road: data.road || "",
        sub_district: data.sub_district || "", district: data.district || "",
        province: data.province || "", postal_code: data.postal_code || "",
      });
      setBio(data.bio || "");
      if (data.lat) setMapLat(data.lat);
      if (data.lng) setMapLng(data.lng);

      if (profileRes.data) setProfileData(profileRes.data);
      setLoading(false);
    };
    if (farmId) load();
  }, [farmId, router]);

  useEffect(() => {
    if (!mapVisible) return;
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;
      const lat = mapLat ?? 13.7563, lng = mapLng ?? 100.5018;
      const map = L.map(mapRef.current).setView([lat, lng], mapLat ? 15 : 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", (e: any) => {
        const p = e.target.getLatLng();
        setMapLat(+p.lat.toFixed(6)); setMapLng(+p.lng.toFixed(6));
      });
      mapInstanceRef.current = map; markerRef.current = marker;
    };
    if ((window as any).L) { setTimeout(initMap, 50); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setTimeout(initMap, 50);
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [mapVisible]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return alert("เบราว์เซอร์นี้ไม่รองรับ GPS");
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: la, longitude: lo } = pos.coords;
      setMapLat(+la.toFixed(6)); setMapLng(+lo.toFixed(6));
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([la, lo], 16);
        markerRef.current.setLatLng([la, lo]);
      }
    }, () => alert("ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS หรือลากหมุดบนแผนที่"));
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
    if (profileData.phone) setPhone(profileData.phone);
    if (profileData.full_name) setOwnerName(profileData.full_name);
  };

  const handleSave = async () => {
    if (!farmName.trim()) return alert("กรุณากรอกชื่อฟาร์ม");
    if (!ownerName.trim()) return alert("กรุณากรอกชื่อ-สกุลเจ้าของฟาร์ม");
    if (!phone.trim()) return alert("กรุณากรอกเบอร์โทรศัพท์");
    if (!addr.province.trim()) return alert("กรุณาระบุที่อยู่ฟาร์ม (จังหวัด)");
    setSaving(true);
    const { error } = await supabase.from("farms").update({
      farm_name: farmName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      address: composeAddress(addr),
      house_no: addr.house_no || null, room_no: addr.room_no || null,
      moo: addr.moo || null, soi: addr.soi || null, road: addr.road || null,
      sub_district: addr.sub_district || null, district: addr.district || null,
      province: addr.province || null, postal_code: addr.postal_code || null,
      bio: bio.trim(),
      lat: mapLat,
      lng: mapLng,
      updated_at: new Date(),
    }).eq("id", farmId);
    if (error) { alert("บันทึกไม่สำเร็จ: " + error.message); setSaving(false); }
    else { router.back(); router.refresh(); }
  };

  if (loading) return <PageLoader />;

  const hasProfileAddr = !!(profileData?.province);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .fe-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: #FDF6F8; }
        .fe-body { max-width: 600px; margin: 0 auto; padding: 24px 20px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .fe-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .fe-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .fe-back:hover { background: ${F.line}; color: ${F.ink}; transform: translateX(-1px); }
        .fe-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .fe-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .fe-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .fe-card-title { font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .fe-field { margin-bottom: 16px; }
        .fe-field:last-child { margin-bottom: 0; }
        .fe-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .fe-req { color: ${F.pink}; }
        .fe-input, .fe-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .fe-input:focus, .fe-textarea:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fe-textarea { resize: none; }
        .fe-addr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .fe-addr-label { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-left: 2px; }
        .fe-profile-addr-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1.5px solid ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap; }
        .fe-profile-addr-btn:hover { background: #FBDCE9; border-color: ${F.pink}; }
        .fe-map-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 14px; border: 1.5px dashed ${F.lineMid}; background: white; cursor: pointer; width: 100%; font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.inkSoft}; transition: all .15s; }
        .fe-map-toggle:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .fe-map-toggle.has-pin { border-style: solid; border-color: #16A34A; color: #16A34A; }
        .fe-map-box { border-radius: 14px; overflow: hidden; border: 1px solid ${F.lineMid}; margin-top: 10px; height: 260px; }
        .fe-map-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .fe-geo-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid ${F.lineMid}; background: white; font-size: 12px; font-weight: 700; color: ${F.ink}; cursor: pointer; font-family: inherit; transition: all .15s; }
        .fe-geo-btn:hover { background: ${F.pinkSoft}; border-color: ${F.pink}; color: ${F.pink}; }
        .fe-pin-coords { font-size: 11px; color: ${F.muted}; }
        .fe-actions { display: flex; gap: 12px; margin-top: 24px; }
        .fe-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; }
        .fe-btn-cancel { flex: 0 0 auto; padding: 14px 22px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        .fe-btn-cancel:hover { background: ${F.line}; }
        .fe-btn-save { flex: 1; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .fe-btn-save:hover { background: #D63F6A; }
        .fe-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="fe-page">
        <div className="fe-body">
          <div className="fe-header">
            <button className="fe-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="fe-title">แก้ไขข้อมูลฟาร์ม</h1>
              <p className="fe-sub">อัปเดตรายละเอียดของฟาร์ม</p>
            </div>
          </div>

          <div className="fe-card">
            <div className="fe-field">
              <label className="fe-label">ชื่อฟาร์ม <span className="fe-req">*</span></label>
              <input className="fe-input" value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="เช่น Happy Paws Farm" />
            </div>
            <div className="fe-field">
              <label className="fe-label">ชื่อ-สกุลเจ้าของฟาร์ม <span className="fe-req">*</span></label>
              <input className="fe-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="ชื่อจริง นามสกุล" />
            </div>
            <div className="fe-field">
              <label className="fe-label">เบอร์โทรศัพท์ <span className="fe-req">*</span></label>
              <input type="tel" className="fe-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" />
            </div>
            <div className="fe-field">
              <div className="fe-addr-header">
                <span className="fe-addr-label">ที่อยู่ <span className="fe-req">*</span></span>
                {hasProfileAddr && (
                  <button type="button" className="fe-profile-addr-btn" onClick={handleUseProfileAddress}>
                    <Icon.User /> ใช้ที่อยู่จากโปรไฟล์หลัก
                  </button>
                )}
              </div>
              <AddressFields value={addr} onChange={setAddr} required />
            </div>
            <div className="fe-field">
              <label className="fe-label">รายละเอียดเพิ่มเติม</label>
              <textarea className="fe-textarea" rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="เล่าเรื่องราวของฟาร์มคุณ..." />
            </div>
          </div>

          <div className="fe-card">
            <div className="fe-card-title"><Icon.MapPin /> ตำแหน่งฟาร์มบนแผนที่</div>
            <button type="button" className={`fe-map-toggle ${mapLat !== null ? "has-pin" : ""}`} onClick={() => setMapVisible(v => !v)}>
              <Icon.MapPin />
              {mapLat !== null ? `ปักหมุดแล้ว (${mapLat.toFixed(4)}, ${mapLng?.toFixed(4)})` : "แตะเพื่อเปิดแผนที่และปักหมุด"}
            </button>
            {mapVisible && (
              <>
                <div className="fe-map-box" ref={mapRef} />
                <div className="fe-map-actions">
                  <button type="button" className="fe-geo-btn" onClick={handleGeolocate}><Icon.Locate /> ใช้ตำแหน่งปัจจุบัน</button>
                  {mapLat !== null && <span className="fe-pin-coords">{mapLat.toFixed(5)}, {mapLng?.toFixed(5)}</span>}
                </div>
                <p style={{ fontSize: 11, color: F.muted, marginTop: 6 }}>ลากหมุดบนแผนที่เพื่อปรับตำแหน่ง</p>
              </>
            )}
          </div>

          <div className="fe-actions">
            <button type="button" className="fe-btn fe-btn-cancel" onClick={() => router.back()}>ยกเลิก</button>
            <button type="button" className="fe-btn fe-btn-save" onClick={handleSave} disabled={saving}>
              <Icon.Save /> {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
