"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', blueSoft: '#EFF6FF',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

// Weight is always stored in grams. >= 1000g shows/accepts kg instead, purely a display/input convenience.
// With no prior record to go by, default to kg — most personally-owned pets weighed here are grown pets.
const useKgFor = (lastKnownGrams: number | null | undefined, defaultKg = true) =>
  lastKnownGrams != null ? lastKnownGrams >= 1000 : defaultKg;
const fmtWeightHint = (g: number) => useKgFor(g) ? `${(g / 1000).toFixed(2)} กก.` : `${g} กรัม`;

export default function WeighInPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [personalPets, setPersonalPets] = useState<any[]>([]);
  const [farmPets, setFarmPets] = useState<Record<string, { name: string; pets: any[] }>>({});
  const [petWeights, setPetWeights] = useState<any[]>([]);
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [unitOverrides, setUnitOverrides] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login?redirect=/weigh-in'); return; }
      setUserId(session.user.id);
      const uid = session.user.id;

      const [{ data: farms }, { data: pets }] = await Promise.all([
        supabase.from('farms').select('id, farm_name').eq('user_id', uid),
        supabase.from('pets').select('id, name, image_url, gender, farm_id').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);

      const personal: any[] = [];
      const grouped: Record<string, { name: string; pets: any[] }> = {};
      farms?.forEach(f => { grouped[f.id] = { name: f.farm_name, pets: [] }; });

      pets?.forEach(pet => {
        if (!pet.farm_id || pet.farm_id === 'PERSONAL') personal.push(pet);
        else if (grouped[pet.farm_id]) grouped[pet.farm_id].pets.push(pet);
        else personal.push(pet);
      });

      setPersonalPets(personal);
      setFarmPets(grouped);

      const allPets = pets || [];
      if (allPets.length > 0) {
        const { data: wData } = await supabase
          .from('pet_weights')
          .select('pet_id, weight, recorded_date')
          .in('pet_id', allPets.map(p => p.id))
          .order('recorded_date', { ascending: true });
        if (wData) setPetWeights(wData);
      }

      setIsLoading(false);
    };
    load();
  }, [router]);

  const allPets = [...personalPets, ...Object.values(farmPets).flatMap(f => f.pets)];

  const latestWeightByPet = new Map<number, number>();
  for (const p of allPets) {
    const records = petWeights.filter(w => w.pet_id === p.id);
    if (records.length > 0) latestWeightByPet.set(p.id, records[records.length - 1].weight);
  }

  const filledCount = Object.values(weights).filter(w => w.trim() !== '').length;

  const handleSave = async () => {
    if (!userId) return;
    const entries = Object.entries(weights).filter(([, w]) => w.trim() !== '');
    if (entries.length === 0) { alert('กรุณากรอกน้ำหนักอย่างน้อย 1 ตัว'); return; }
    setIsSaving(true);
    try {
      const inserts = entries.map(([petId, w]) => {
        const pid = parseInt(petId);
        const useKg = unitOverrides[pid] ?? useKgFor(latestWeightByPet.get(pid));
        const weightInGrams = useKg ? Math.round(parseFloat(w) * 1000) : parseFloat(w);
        return {
          pet_id: pid,
          weight: weightInGrams,
          recorded_date: recordedDate,
          notes: notes || null,
          user_id: userId,
        };
      });
      const { error } = await supabase.from('pet_weights').insert(inserts);
      if (error) throw error;
      alert(`บันทึกน้ำหนัก ${entries.length} ตัวเรียบร้อยแล้ว`);
      router.push('/profile');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally { setIsSaving(false); }
  };

  const renderPetRow = (pet: any) => {
    const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
    const val = weights[pet.id] ?? '';
    const latestWeight = latestWeightByPet.get(pet.id);
    const useKg = unitOverrides[pet.id] ?? useKgFor(latestWeight);
    return (
      <div key={pet.id} className={`wi-pet-row ${val.trim() ? 'filled' : ''}`}>
        <div className="wi-pet-photo">
          {pet.image_url ? <img src={pet.image_url} alt={pet.name} /> : <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
        </div>
        <div className="wi-pet-info">
          <div className="wi-pet-name">{pet.name || 'ยังไม่ตั้งชื่อ'}</div>
          <span className={`wi-pet-gender ${isMale ? 'm' : 'f'}`}><img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 10, height: 10, objectFit: 'contain' }} />{isMale ? 'ผู้' : 'เมีย'}</span>
          {latestWeight != null && <div className="wi-pet-prev">น้ำหนักล่าสุด: {fmtWeightHint(latestWeight)}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <input
            type="number"
            step={useKg ? '0.01' : '1'}
            min="0"
            className="wi-weight-input"
            placeholder={useKg ? '0.00' : '0'}
            value={val}
            onChange={e => setWeights(w => ({ ...w, [pet.id]: e.target.value }))}
          />
          <button
            type="button"
            className="wi-weight-unit-toggle"
            onClick={() => setUnitOverrides(o => ({ ...o, [pet.id]: !useKg }))}
            title="แตะเพื่อสลับหน่วย"
          >
            {useKg ? 'กก.' : 'กรัม'} ⇄
          </button>
        </div>
      </div>
    );
  };

  const hasAnyPets = personalPets.length > 0 || Object.values(farmPets).some(f => f.pets.length > 0);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .wi-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .wi-body { max-width: 640px; margin: 0 auto; padding: 24px 20px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .wi-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .wi-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; margin-top: 2px; }
        .wi-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .wi-title { font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .wi-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 4px; }
        .wi-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px; margin-bottom: 14px; }
        .wi-date-label { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 7px; }
        .wi-input { width: 100%; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: white; }
        .wi-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .wi-group { margin-bottom: 18px; }
        .wi-group-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 0 2px; }
        .wi-group-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .wi-group-badge { font-size: 10px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; padding: 3px 10px; border-radius: 999px; }
        .wi-pet-row { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; transition: border-color .15s; }
        .wi-pet-row:last-child { margin-bottom: 0; }
        .wi-pet-row.filled { border-color: ${F.pinkBorder}; }
        .wi-pet-photo { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 2px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wi-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .wi-pet-info { flex: 1; min-width: 0; }
        .wi-pet-name { font-size: 13px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wi-pet-gender { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px; margin-top: 2px; }
        .wi-pet-gender.m { background: ${F.blueSoft}; color: ${F.blue}; }
        .wi-pet-gender.f { background: ${F.pinkSoft}; color: ${F.pink}; }
        .wi-pet-prev { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .wi-weight-input { width: 80px; padding: 8px 10px; border: 1.5px solid ${F.lineMid}; border-radius: 10px; font-size: 14px; font-weight: 700; color: ${F.ink}; text-align: center; outline: none; font-family: inherit; transition: all .15s; }
        .wi-weight-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .wi-weight-unit-toggle { font-size: 10px; font-weight: 600; color: ${F.pink}; text-align: center; margin-top: 3px; background: none; border: none; cursor: pointer; padding: 2px 4px; font-family: inherit; }
        .wi-weight-unit-toggle:hover { text-decoration: underline; }
        .wi-empty { text-align: center; padding: 40px 20px; color: ${F.muted}; font-size: 13px; font-weight: 600; background: white; border: 1px dashed ${F.lineMid}; border-radius: 20px; }
        .wi-actions { display: flex; gap: 12px; margin-top: 8px; }
        .wi-save-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .wi-save-btn:hover { background: #D63F6A; }
        .wi-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="wi-page">
          <div className="wi-body">
            <div className="wi-top">
              <button className="wi-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <div>
                <div className="wi-title">ชั่งน้ำหนักสัตว์เลี้ยง</div>
                <div className="wi-sub">กรอกเฉพาะตัวที่ต้องการอัพเดตน้ำหนักใหม่ ตัวที่เว้นว่างไว้จะไม่ถูกบันทึก</div>
              </div>
            </div>

            <div className="wi-card">
              <label className="wi-date-label">วันที่บันทึก</label>
              <input type="date" className="wi-input" value={recordedDate} onChange={e => setRecordedDate(e.target.value)} />
              <div style={{ marginTop: 12 }}>
                <label className="wi-date-label">หมายเหตุสำหรับทุกตัว (ไม่บังคับ)</label>
                <input type="text" className="wi-input" placeholder="เช่น ชั่งน้ำหนักหลังตื่นนอนเช้า" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {!hasAnyPets ? (
              <div className="wi-empty">ยังไม่มีสัตว์เลี้ยงให้ชั่งน้ำหนัก</div>
            ) : (
              <>
                {personalPets.length > 0 && (
                  <div className="wi-group">
                    <div className="wi-group-head">
                      <span className="wi-group-title">สัตว์เลี้ยงส่วนตัว</span>
                      <span className="wi-group-badge">{personalPets.length} ตัว</span>
                    </div>
                    {personalPets.map(p => renderPetRow(p))}
                  </div>
                )}

                {Object.entries(farmPets).filter(([, f]) => f.pets.length > 0).map(([farmId, farm]) => (
                  <div key={farmId} className="wi-group">
                    <div className="wi-group-head">
                      <span className="wi-group-title">{farm.name}</span>
                      <span className="wi-group-badge">{farm.pets.length} ตัว</span>
                    </div>
                    {farm.pets.map((p: any) => renderPetRow(p))}
                  </div>
                ))}
              </>
            )}

            <div className="wi-actions">
              <button className="wi-save-btn" onClick={handleSave} disabled={isSaving || filledCount === 0}>
                <Icon.Save /> {isSaving ? 'กำลังบันทึก...' : filledCount > 0 ? `บันทึกน้ำหนัก ${filledCount} ตัว` : 'กรอกน้ำหนักเพื่อบันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
