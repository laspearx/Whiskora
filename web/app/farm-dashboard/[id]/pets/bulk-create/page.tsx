"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PageLoader from '@/app/components/PageLoader';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

// ─── สายพันธุ์ตามชนิดสัตว์ (ชุดเดียวกับหน้า create) ───
const breedData: Record<string, string[]> = {
  "cat": ["โกนจา (Konja)", "ขาวมณี (Khao Manee)", "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)", "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)", "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)", "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)"],
  "dog": ["คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)", "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)", "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)", "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)", "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)", "อลาสกัน มาลามิวท์ (Alaskan Malamute)"],
  "กระต่าย": ["ฮอลแลนด์ ลอป (Holland Lop)", "เนเธอร์แลนด์ ดวอร์ฟ (Netherland Dwarf)", "มินิเร็กซ์ (Mini Rex)", "ไลอ้อนเฮด (Lionhead)", "อิงลิช แองโกร่า (English Angora)", "เฟรนช์ ลอป (French Lop)"],
  "หนูแฮมสเตอร์": ["วินเทอร์ไวท์ (Winter White)", "ไซเรียน (Syrian / ไจแอนท์)", "โรโบรอฟสกี (Roborovski)", "แคมป์เบลล์ (Campbell)"],
  "นก": ["ฟอพัส (Forpus)", "ค็อกคาเทล (Cockatiel)", "ซันคอนัวร์ (Sun Conure)", "เลิฟเบิร์ด (Lovebird)", "หงส์หยก (Budgerigar)", "แอฟริกันเกรย์ (African Grey)", "มาคอว์ (Macaw)", "กรีนชีค (Green Cheek)"],
  "กระรอก": ["กระรอกบิน (Flying Squirrel)", "ชูการ์ไกลเดอร์ (Sugar Glider)", "แพรี่ด็อก (Prairie Dog)", "กระรอกดง (Finlayson's)"],
  "เม่นแคระ": ["เม่นแคระแอฟริกัน (African Pygmy)"],
  "ปลา": ["ปลากัด (Betta)", "ปลาคาร์ป (Koi)", "ปลาทอง (Goldfish)", "ปลาหางนกยูง (Guppy)", "ปลาหมอสี (Flowerhorn)", "ปลามังกร (Arowana)"],
  "เต่า": ["ซูคาต้า (Sulcata)", "ดาวอินเดีย (Indian Star)", "อัลดราบร้า (Aldabra)", "เต่าญี่ปุ่น (Red-eared Slider)", "เต่าหมูบิน (Pig-nosed)"],
  "กบ": ["ฮอร์นฟร็อก (Horned Frog)", "ไวท์ทรีฟร็อก (White's Tree Frog)", "อึ่งแม่หนาว (Chubby Frog)", "กบลูกศรพิษ (Poison Dart)"],
  "กิ้งก่า": ["เบียร์ดดราก้อน (Bearded Dragon)", "เตกู (Tegu)", "อีกัวน่า (Iguana)", "คาเมเลี่ยน (Chameleon)", "เครสเตดเกตุโก (Crested Gecko)", "เลพเพิร์ดเกตุโก (Leopard Gecko)"],
  "งู": ["คอร์นสเนค (Corn Snake)", "บอลไพธอน (Ball Python)", "ฮ็อกโนส (Hognose)", "คิงสเนค (King Snake)", "มิลค์สเนค (Milk Snake)"],
  "แร็กคูน": ["แร็กคูน (Raccoon)"],
  "สัตว์แปลกอื่นๆ": ["เมียร์แคต (Meerkat)", "เฟอร์เรท (Ferret)", "ชินชิลล่า (Chinchilla)", "บุชเบบี้ (Bushbaby)"]
};

const STATUS_OPTIONS = ["พ่อพันธุ์ / แม่พันธุ์", "เด็ก", "พร้อมย้ายบ้าน", "ติดจอง", "ทำหมัน / ปลดระวาง"];

const EAR_OPTIONS = ["หูตั้ง", "หูพับ", "หูพลิก"];
const LEG_OPTIONS = ["ขาสั้น", "ขายาว"];
const COAT_OPTIONS = ["ขนสั้น", "ขนยาว", "ขนหยิก", "ไม่มีขน"];

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Info: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

// ─── หนึ่งแถว = สัตว์หนึ่งตัว ───
type PetRow = {
  key: string;
  name: string;
  gender: string;
  birth_date: string;
  breed: string;
  color: string;
  ear: string;
  leg: string;
  coat: string;
  eye_color: string;
  price: string;
  status: string;
  sire_id: string;
  dam_id: string;
};

const blankRow = (): PetRow => ({
  key: Math.random().toString(36).slice(2),
  name: '', gender: '', birth_date: '', breed: '', color: '',
  ear: '', leg: '', coat: '', eye_color: '', price: '',
  status: 'พ่อพันธุ์ / แม่พันธุ์', sire_id: '', dam_id: '',
});

function BulkCreateContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [farm, setFarm] = useState<any>(null);
  const [existingPets, setExistingPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<PetRow[]>([blankRow()]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data: farmData } = await supabase.from("farms").select("id, farm_name, species").eq("id", farmId).eq("user_id", session.user.id).single();
        if (!farmData) return router.push("/partner");
        setFarm(farmData);

        // ดึงสัตว์ที่มีอยู่ในฟาร์ม — ใช้เป็นตัวเลือกพ่อ/แม่
        const { data: petsData } = await supabase.from("pets").select("id, name, gender, image_url, breed").eq("farm_id", farmId).order("created_at", { ascending: false });
        if (petsData) setExistingPets(petsData);
      } catch (error) {
        console.error("Error loading bulk-create:", error);
      } finally {
        setLoading(false);
      }
    };
    if (farmId) fetchData();
  }, [farmId, router]);

  // พ่อ = ตัวผู้, แม่ = ตัวเมีย (กรองจากสัตว์ในฟาร์ม)
  const sireOptions = existingPets.filter(p => p.gender === 'male' || p.gender === 'ตัวผู้');
  const damOptions = existingPets.filter(p => p.gender === 'female' || p.gender === 'ตัวเมีย');

  const availableBreeds = farm ? (breedData[farm.species] || []) : [];

  // ─── จัดการแถว ───
  const addRow = () => setRows(prev => [...prev, blankRow()]);
  const removeRow = (key: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.key !== key) : prev);
  const updateRow = (key: string, field: keyof PetRow, value: string) =>
    setRows(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  const duplicateRow = (key: string) => setRows(prev => {
    const idx = prev.findIndex(r => r.key === key);
    if (idx === -1) return prev;
    const copy = { ...prev[idx], key: Math.random().toString(36).slice(2), name: '' };
    const next = [...prev];
    next.splice(idx + 1, 0, copy);
    return next;
  });

  // ─── บันทึกทั้งหมดทีเดียว ───
  const handleSaveAll = async () => {
    // ตรวจ: ทุกแถวต้องมีอย่างน้อยชื่อ + เพศ
    const validRows = rows.filter(r => r.name.trim());
    if (validRows.length === 0) { alert('กรุณากรอกชื่อสัตว์อย่างน้อย 1 ตัว'); return; }
    const missingGender = validRows.find(r => !r.gender);
    if (missingGender) { alert(`กรุณาเลือกเพศของ "${missingGender.name}"`); return; }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const payload = validRows.map(r => ({
        user_id: session.user.id,
        farm_id: farm.id,
        species: farm.species,
        name: r.name.trim(),
        gender: r.gender,
        birth_date: r.birth_date || null,
        breed: r.breed || null,
        color: r.color || null,
        pattern: null,
        ear: r.ear || null,
        leg: r.leg || null,
        coat: r.coat || null,
        eye_color: r.eye_color || null,
        price: r.price ? Number(r.price) : null,
        status: r.status || null,
        sire_id: r.sire_id || null,
        dam_id: r.dam_id || null,
        is_public: true,
      }));

      const { error } = await supabase.from("pets").insert(payload);
      if (error) throw error;

      alert(`บันทึกสำเร็จ ${payload.length} ตัว 🎉`);
      router.push(`/farm-dashboard/${farmId}?from=${fromPage}`);
    } catch (err: any) {
      console.error(err);
      alert('บันทึกไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setSaving(false);
    }
  };

  const filledCount = rows.filter(r => r.name.trim()).length;

  if (loading) return <PageLoader />;
  if (!farm) return null;

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .bc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .bc-body { max-width: 920px; margin: 0 auto; padding: 28px 20px 140px; }
        .bc-header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
        .bc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .bc-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .bc-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.15; letter-spacing: -0.4px; }
        .bc-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        /* info banner */
        .bc-info { display: flex; align-items: flex-start; gap: 10px; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; border-radius: 14px; padding: 12px 16px; margin: 18px 0 22px; }
        .bc-info-icon { color: ${F.pink}; flex-shrink: 0; margin-top: 1px; }
        .bc-info-text { font-size: 12px; color: ${F.inkSoft}; line-height: 1.6; }
        .bc-info-text b { color: ${F.pink}; font-weight: 700; }
        /* row card */
        .bc-rows { display: flex; flex-direction: column; gap: 16px; }
        .bc-row { background: white; border: 1px solid ${F.line}; border-radius: 18px; overflow: hidden; transition: all .2s; }
        .bc-row:hover { box-shadow: 0 4px 16px rgba(232,70,119,.06); }
        .bc-row-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: linear-gradient(135deg, #FFF5F8, white); border-bottom: 1px solid ${F.line}; }
        .bc-row-num { display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .bc-row-badge { width: 26px; height: 26px; border-radius: 50%; background: ${F.pink}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .bc-row-actions { display: flex; gap: 6px; }
        .bc-icon-btn { width: 32px; height: 32px; border-radius: 9px; border: 1px solid ${F.lineMid}; background: white; color: ${F.muted}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
        .bc-icon-btn:hover { color: ${F.pink}; border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; }
        .bc-icon-btn.del:hover { color: #EF4444; border-color: #FECACA; background: #FEF2F2; }
        .bc-icon-btn:disabled { opacity: .4; cursor: not-allowed; }
        .bc-row-body { padding: 18px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .bc-field { display: flex; flex-direction: column; gap: 6px; }
        .bc-field.full { grid-column: 1 / -1; }
        .bc-label { font-size: 11px; font-weight: 700; color: ${F.muted}; }
        .bc-label .req { color: ${F.pink}; }
        .bc-input, .bc-select { width: 100%; padding: 11px 13px; border-radius: 11px; background: #F9FAFB; border: 1px solid ${F.lineMid}; outline: none; font-size: 14px; font-weight: 500; color: ${F.ink}; transition: all .15s; font-family: inherit; }
        .bc-input:focus, .bc-select:focus { border-color: ${F.pinkBorder}; background: white; }
        .bc-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
        .bc-parents-note { grid-column: 1 / -1; font-size: 10px; color: ${F.muted}; margin-top: -4px; }
        /* add row button */
        .bc-add-row { width: 100%; margin-top: 16px; padding: 16px; border-radius: 16px; border: 1.5px dashed ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .15s; font-family: inherit; }
        .bc-add-row:hover { background: #FDE7EF; border-color: ${F.pink}; }
        /* sticky save bar */
        .bc-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .bc-savebar-inner { max-width: 920px; margin: 0 auto; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .bc-savebar-count { font-size: 13px; font-weight: 600; color: ${F.inkSoft}; }
        .bc-savebar-count b { color: ${F.pink}; font-family: inherit; font-size: 16px; }
        .bc-save-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px; border-radius: 26px; background: ${F.pink}; color: white; font-size: 15px; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: all .18s ease; }
        .bc-save-btn:hover { background: #D63F6A; box-shadow: 0 6px 20px rgba(232,70,119,0.4); }
        .bc-save-btn:active { transform: scale(0.97); }
        .bc-save-btn:disabled { opacity: .6; cursor: wait; }
        @media (max-width: 600px) {
          .bc-body { padding: 18px 14px 140px; }
          .bc-title { font-size: 21px; }
          .bc-row-body { grid-template-columns: 1fr; gap: 12px; }
          .bc-savebar-count { font-size: 12px; }
          .bc-save-btn { padding: 12px 20px; font-size: 14px; }
        }
      `}</style>

      <div className="bc-page">
        <div className="bc-body">
          {/* Header */}
          <div className="bc-header">
            <button onClick={() => router.push(`/farm-dashboard/${farmId}?from=${fromPage}`)} className="bc-back" aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="bc-title">เพิ่มสมาชิกฟาร์ม (หลายตัว)</h1>
              <p className="bc-sub">{farm.farm_name} · กรอกได้หลายตัวพร้อมกัน บันทึกครั้งเดียว</p>
            </div>
          </div>

          {/* Info */}
          <div className="bc-info">
            <span className="bc-info-icon"><Icon.Info /></span>
            <div className="bc-info-text">
              ครั้งแรกแนะนำให้บันทึก <b>พ่อแม่พันธุ์</b> ก่อน เพื่อให้รอบถัดไปเลือกพ่อ-แม่จากในฟาร์มได้เลย ·
              รูปประจำตัวเว้นไว้ก่อนได้ ไปเพิ่มทีหลังที่หน้าโปรไฟล์สัตว์แต่ละตัว
              {existingPets.length > 0 && <> · ตอนนี้ฟาร์มมี <b>{existingPets.length} ตัว</b> ให้เลือกเป็นพ่อแม่ได้</>}
            </div>
          </div>

          {/* Rows */}
          <div className="bc-rows">
            {rows.map((row, idx) => (
              <div key={row.key} className="bc-row">
                <div className="bc-row-head">
                  <div className="bc-row-num"><span className="bc-row-badge">{idx + 1}</span>{row.name.trim() || `สัตว์ตัวที่ ${idx + 1}`}</div>
                  <div className="bc-row-actions">
                    <button className="bc-icon-btn" onClick={() => duplicateRow(row.key)} title="ทำซ้ำแถวนี้"><Icon.Plus /></button>
                    <button className="bc-icon-btn del" onClick={() => removeRow(row.key)} disabled={rows.length <= 1} title="ลบแถวนี้"><Icon.Trash /></button>
                  </div>
                </div>
                <div className="bc-row-body">
                  <div className="bc-field">
                    <label className="bc-label">ชื่อ <span className="req">*</span></label>
                    <input className="bc-input" type="text" value={row.name} onChange={e => updateRow(row.key, 'name', e.target.value)} placeholder="เช่น มะลิ" />
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">เพศ <span className="req">*</span></label>
                    <select className="bc-select" value={row.gender} onChange={e => updateRow(row.key, 'gender', e.target.value)}>
                      <option value="">เลือกเพศ</option>
                      <option value="male">♂ ตัวผู้</option>
                      <option value="female">♀ ตัวเมีย</option>
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">วันเกิด</label>
                    <input className="bc-input" type="date" value={row.birth_date} onChange={e => updateRow(row.key, 'birth_date', e.target.value)} />
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">สถานะ</label>
                    <select className="bc-select" value={row.status} onChange={e => updateRow(row.key, 'status', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">สายพันธุ์</label>
                    <select className="bc-select" value={row.breed} onChange={e => updateRow(row.key, 'breed', e.target.value)}>
                      <option value="">เลือกสายพันธุ์</option>
                      {availableBreeds.map(b => <option key={b} value={b}>{b}</option>)}
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">สี</label>
                    <input className="bc-input" type="text" value={row.color} onChange={e => updateRow(row.key, 'color', e.target.value)} placeholder="เช่น ดำ, ขาว, สามสี..." />
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">ลักษณะหู</label>
                    <select className="bc-select" value={row.ear} onChange={e => updateRow(row.key, 'ear', e.target.value)}>
                      <option value="">เลือกลักษณะหู</option>
                      {EAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">ลักษณะขา</label>
                    <select className="bc-select" value={row.leg} onChange={e => updateRow(row.key, 'leg', e.target.value)}>
                      <option value="">เลือกลักษณะขา</option>
                      {LEG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">ลักษณะขน</label>
                    <select className="bc-select" value={row.coat} onChange={e => updateRow(row.key, 'coat', e.target.value)}>
                      <option value="">เลือกลักษณะขน</option>
                      {COAT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">สีตา</label>
                    <input className="bc-input" type="text" value={row.eye_color} onChange={e => updateRow(row.key, 'eye_color', e.target.value)} placeholder="เช่น ดำ, น้ำตาล, เหลือง..." />
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">ราคา (บาท)</label>
                    <input className="bc-input" type="number" inputMode="numeric" value={row.price} onChange={e => updateRow(row.key, 'price', e.target.value)} placeholder="เช่น 15000" />
                  </div>
                  {/* เลือกพ่อ-แม่จากในฟาร์ม (ถ้ามี) */}
                  <div className="bc-field">
                    <label className="bc-label">พ่อ (เลือกจากในฟาร์ม)</label>
                    <select className="bc-select" value={row.sire_id} onChange={e => updateRow(row.key, 'sire_id', e.target.value)} disabled={sireOptions.length === 0}>
                      <option value="">{sireOptions.length === 0 ? 'ยังไม่มีตัวผู้ในฟาร์ม' : '— ไม่ระบุ —'}</option>
                      {sireOptions.map(p => <option key={p.id} value={p.id}>{p.name}{p.breed ? ` · ${p.breed.split('(')[0].trim()}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="bc-field">
                    <label className="bc-label">แม่ (เลือกจากในฟาร์ม)</label>
                    <select className="bc-select" value={row.dam_id} onChange={e => updateRow(row.key, 'dam_id', e.target.value)} disabled={damOptions.length === 0}>
                      <option value="">{damOptions.length === 0 ? 'ยังไม่มีตัวเมียในฟาร์ม' : '— ไม่ระบุ —'}</option>
                      {damOptions.map(p => <option key={p.id} value={p.id}>{p.name}{p.breed ? ` · ${p.breed.split('(')[0].trim()}` : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="bc-add-row" onClick={addRow}><Icon.Plus /> เพิ่มอีกตัว</button>
        </div>

        {/* Sticky save bar */}
        <div className="bc-savebar">
          <div className="bc-savebar-inner">
            <div className="bc-savebar-count">พร้อมบันทึก <b>{filledCount}</b> ตัว</div>
            <button className="bc-save-btn" onClick={handleSaveAll} disabled={saving || filledCount === 0}>
              <Icon.Save /> {saving ? 'กำลังบันทึก...' : `บันทึกทั้งหมด (${filledCount})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function BulkCreatePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BulkCreateContent />
    </Suspense>
  );
}