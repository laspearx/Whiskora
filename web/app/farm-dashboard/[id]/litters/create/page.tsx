"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  orange: '#F97316',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

interface Pet { id: number; name: string; gender: string; status: string; months_rested?: number | null; }

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

const letterToNumber = (letters: string) => { let n = 0; for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64); return n; };
const numberToLetter = (n: number) => { let result = ''; while (n > 0) { const rem = (n - 1) % 26; result = String.fromCharCode(65 + rem) + result; n = Math.floor((n - 1) / 26); } return result; };

export default function CreateLitterPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [maleBreeders, setMaleBreeders] = useState<Pet[]>([]);
  const [femaleBreeders, setFemaleBreeders] = useState<Pet[]>([]);
  const [formData, setFormData] = useState({ litter_code: '', sire_id: '', dam_id: '', mating_date: '', expected_birth_date: '' });

  useEffect(() => {
    const fetchBreeders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/farm-dashboard/${farmId}/litters/create`)}`); return; }
      setUserId(session.user.id);
      const { data: petsData } = await supabase.from('pets').select('id, name, gender, status')
        .eq('user_id', session.user.id).eq('farm_id', farmId).eq('status', 'พ่อพันธุ์ / แม่พันธุ์').order('name');
      const { data: allLitters } = await supabase.from('litters').select('dam_id, expected_birth_date, status').eq('user_id', session.user.id);
      if (petsData) {
        const pregnantDamIds = new Set();
        const latestBirthMap = new Map();
        if (allLitters) {
          allLitters.forEach((litter) => {
            if (litter.status === 'รอคลอด') pregnantDamIds.add(litter.dam_id);
            else {
              const existingDate = latestBirthMap.get(litter.dam_id);
              if (!existingDate || new Date(litter.expected_birth_date) > new Date(existingDate)) latestBirthMap.set(litter.dam_id, litter.expected_birth_date);
            }
          });
        }
        setMaleBreeders(petsData.filter((pet) => pet.gender === 'male' || pet.gender === 'ตัวผู้'));
        const availableFemales = petsData
          .filter((pet) => (pet.gender === 'female' || pet.gender === 'ตัวเมีย') && !pregnantDamIds.has(pet.id))
          .map((pet) => {
            const lastBirth = latestBirthMap.get(pet.id);
            let monthsRested = null;
            if (lastBirth) {
              const diffDays = (new Date().getTime() - new Date(lastBirth).getTime()) / (1000 * 60 * 60 * 24);
              monthsRested = diffDays / 30.44;
            }
            return { ...pet, months_rested: monthsRested };
          });
        setFemaleBreeders(availableFemales);
      }
    };
    if (farmId) fetchBreeders();
  }, [farmId, router]);

  const handleMatingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      const matingDate = new Date(dateVal);
      matingDate.setDate(matingDate.getDate() + 65);
      setFormData((prev) => ({ ...prev, mating_date: dateVal, expected_birth_date: matingDate.toISOString().split('T')[0] }));
    } else {
      setFormData((prev) => ({ ...prev, mating_date: '', expected_birth_date: '' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userId) return;
    if (!formData.sire_id || !formData.dam_id) return alert('กรุณาเลือกพ่อพันธุ์และแม่พันธุ์ให้ครบถ้วนครับ');
    setIsLoading(true);
    try {
      let finalLitterCode = formData.litter_code.trim();
      if (!finalLitterCode) {
        const { data: existingLitters } = await supabase.from('litters').select('litter_code').eq('user_id', userId).eq('farm_id', farmId);
        let maxVal = 0;
        if (existingLitters) {
          existingLitters.forEach((l) => {
            const code = l.litter_code;
            if (code && /^[A-Z]+$/.test(code)) { const val = letterToNumber(code); if (val > maxVal) maxVal = val; }
          });
        }
        finalLitterCode = numberToLetter(maxVal + 1);
      }
      const { error } = await supabase.from('litters').insert([{
        litter_code: finalLitterCode, sire_id: parseInt(formData.sire_id), dam_id: parseInt(formData.dam_id),
        mating_date: formData.mating_date, expected_birth_date: formData.expected_birth_date,
        status: 'รอคลอด', user_id: userId, farm_id: farmId,
      }]);
      if (error) throw error;
      alert(`💕 บันทึกการจับคู่ ครอก ${finalLitterCode} เรียบร้อย!`);
      router.push(`/farm-dashboard/${farmId}`);
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally { setIsLoading(false); }
  };

  const selectedDam = femaleBreeders.find((c) => c.id.toString() === formData.dam_id);
  const isDamRestingTooShort = selectedDam && typeof selectedDam.months_rested === 'number' && selectedDam.months_rested < 6;

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .lc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .lc-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .lc-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .lc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .lc-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .lc-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .lc-sub { font-size: 13px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }
        .lc-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; }
        .lc-hero-emoji { text-align: center; font-size: 48px; margin-bottom: 18px; }
        .lc-field { margin-bottom: 16px; }
        .lc-field:last-child { margin-bottom: 0; }
        .lc-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .lc-label .hint { font-size: 10px; color: ${F.muted}; font-weight: 500; margin-left: 6px; }
        .lc-req { color: ${F.pink}; }
        .lc-input, .lc-select { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .lc-input:focus, .lc-select:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .lc-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .lc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lc-warn { margin-top: 8px; font-size: 11px; font-weight: 700; color: ${F.orange}; background: #FFF7ED; padding: 8px 12px; border-radius: 10px; }
        .lc-note { margin-top: 8px; font-size: 11px; font-weight: 600; color: ${F.pink}; margin-left: 2px; }
        .lc-hint-sm { font-size: 10px; color: ${F.muted}; margin-top: 6px; font-weight: 500; line-height: 1.4; }
        .lc-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .lc-savebar-inner { max-width: 600px; margin: 0 auto; }
        .lc-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .lc-btn:hover { background: #D63F6A; }
        .lc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 480px) { .lc-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      <div className="lc-page">
        <div className="lc-body">
          <div className="lc-header">
            <button className="lc-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="lc-title">บันทึกการจับคู่บรีด</h1>
              <p className="lc-sub">สร้างรหัสครอกและคำนวณวันกำหนดคลอด</p>
            </div>
          </div>

          <div className="lc-card">
            <div className="lc-hero-emoji">💗</div>
            <form onSubmit={handleSubmit}>
              <div className="lc-field">
                <label className="lc-label">รหัสครอก (Litter Code) <span className="hint">เว้นว่างเพื่อรันอัตโนมัติ (A, B...)</span></label>
                <input type="text" name="litter_code" className="lc-input" value={formData.litter_code} onChange={handleChange} placeholder="หากเว้นว่าง ระบบจะรันรหัสให้อัตโนมัติ" />
              </div>

              <div className="lc-grid2">
                <div className="lc-field">
                  <label className="lc-label">พ่อพันธุ์ <span className="lc-req">*</span></label>
                  <select name="sire_id" className="lc-select" value={formData.sire_id} onChange={handleChange} required>
                    <option value="" disabled>เลือกพ่อพันธุ์</option>
                    {maleBreeders.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
                  </select>
                </div>
                <div className="lc-field">
                  <label className="lc-label">แม่พันธุ์ <span className="lc-req">*</span></label>
                  <select name="dam_id" className="lc-select" value={formData.dam_id} onChange={handleChange} required>
                    <option value="" disabled>เลือกแม่พันธุ์</option>
                    {femaleBreeders.map((pet) => {
                      const isTooShort = typeof pet.months_rested === 'number' && pet.months_rested < 6;
                      let warningText = '';
                      if (isTooShort) { const dm = pet.months_rested! < 1 ? 'น้อยกว่า 1' : Math.floor(pet.months_rested!); warningText = `(พักท้อง ${dm} เดือน)`; }
                      return <option key={pet.id} value={pet.id}>{pet.name} {warningText}</option>;
                    })}
                  </select>
                </div>
              </div>

              {isDamRestingTooShort && typeof selectedDam?.months_rested === 'number' && (
                <div className="lc-warn">⚠️ แม่พันธุ์พักท้องมา {selectedDam.months_rested < 1 ? 'น้อยกว่า 1' : Math.floor(selectedDam.months_rested)} เดือน (ควรพัก 6 เดือนขึ้นไป)</div>
              )}
              {femaleBreeders.length === 0 && <p className="lc-note">*แม่พันธุ์ในฟาร์มกำลังตั้งท้องทั้งหมด</p>}

              <div className="lc-grid2" style={{ marginTop: 16 }}>
                <div className="lc-field" style={{ marginBottom: 0 }}>
                  <label className="lc-label">วันที่เริ่มทับ / บรีด <span className="lc-req">*</span></label>
                  <input type="date" name="mating_date" className="lc-input" value={formData.mating_date} onChange={handleMatingDateChange} required />
                </div>
                <div className="lc-field" style={{ marginBottom: 0 }}>
                  <label className="lc-label">📅 กำหนดคลอด (65 วัน)</label>
                  <input type="date" name="expected_birth_date" className="lc-input" value={formData.expected_birth_date} onChange={handleChange} required />
                </div>
              </div>
              <p className="lc-hint-sm">*แก้ได้หากหมอประเมินคลาดเคลื่อน (วันคลอดอาจ ± เป็น 62 - 68 วัน)</p>
            </form>
          </div>
        </div>

        <div className="lc-savebar">
          <div className="lc-savebar-inner">
            <button type="button" className="lc-btn" onClick={handleSubmit} disabled={isLoading}>
              <Icon.Save /> {isLoading ? "กำลังบันทึก..." : "ยืนยันบันทึกการจับคู่"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}