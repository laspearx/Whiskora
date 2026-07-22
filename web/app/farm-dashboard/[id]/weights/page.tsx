"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', blueSoft: '#EFF6FF',
  amber: '#D97706', amberSoft: '#FEF3C7', amberBorder: '#FDE68A',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

const BABY_STATUSES = ['เด็ก', 'ยังไม่เปิดจอง', 'เก็บ', 'เปิดจอง', 'พร้อมย้ายบ้าน'];
const BREEDER_STATUSES = ['พ่อพันธุ์ / แม่พันธุ์', 'พ่อพันธุ์', 'แม่พันธุ์'];

// Weight is always stored in grams. >= 1000g shows/accepts kg instead, purely a display/input convenience.
const useKgFor = (lastKnownGrams: number | null | undefined) => (lastKnownGrams ?? 0) >= 1000;
const fmtWeightHint = (g: number) => useKgFor(g) ? `${(g / 1000).toFixed(2)} กก.` : `${g} กรัม`;

export default function FarmWeightsPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [litters, setLitters] = useState<any[]>([]);
  const [petWeights, setPetWeights] = useState<any[]>([]);
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=/farm-dashboard/${farmId}/weights`); return; }
      setUserId(session.user.id);

      const [{ data: petsData }, { data: littersData }] = await Promise.all([
        supabase.from('pets').select('id, name, image_url, gender, litter_id, status').eq('farm_id', farmId).order('id', { ascending: true }),
        supabase.from('litters').select('id, litter_code').eq('farm_id', farmId),
      ]);

      const loadedPets = petsData || [];
      setPets(loadedPets);
      setLitters(littersData || []);

      if (loadedPets.length > 0) {
        const { data: wData } = await supabase
          .from('pet_weights')
          .select('pet_id, weight, recorded_date')
          .in('pet_id', loadedPets.map(p => p.id))
          .order('recorded_date', { ascending: true });
        if (wData) setPetWeights(wData);
      }

      setIsLoading(false);
    };
    load();
  }, [farmId, router]);

  const latestWeightByPet = new Map<number, number>();
  for (const p of pets) {
    const records = petWeights.filter(w => w.pet_id === p.id);
    if (records.length > 0) latestWeightByPet.set(p.id, records[records.length - 1].weight);
  }

  const breeders = pets.filter(p => BREEDER_STATUSES.includes(p.status));
  const babies = pets.filter(p => BABY_STATUSES.includes(p.status));
  const litterMap = new Map(litters.map(l => [l.id, l]));
  const babiesByLitter: Record<string, any[]> = {};
  const babiesNoLitter: any[] = [];
  for (const b of babies) {
    if (b.litter_id) {
      if (!babiesByLitter[b.litter_id]) babiesByLitter[b.litter_id] = [];
      babiesByLitter[b.litter_id].push(b);
    } else {
      babiesNoLitter.push(b);
    }
  }
  const litterIds = Object.keys(babiesByLitter);

  const filledCount = Object.values(weights).filter(w => w.trim() !== '').length;

  const handleSave = async () => {
    if (!userId) return;
    const entries = Object.entries(weights).filter(([, w]) => w.trim() !== '');
    if (entries.length === 0) { alert('กรุณากรอกน้ำหนักอย่างน้อย 1 ตัว'); return; }
    setIsSaving(true);
    try {
      const inserts = entries.map(([petId, w]) => {
        const useKg = useKgFor(latestWeightByPet.get(parseInt(petId)));
        const weightInGrams = useKg ? Math.round(parseFloat(w) * 1000) : parseFloat(w);
        return {
          pet_id: parseInt(petId),
          weight: weightInGrams,
          recorded_date: recordedDate,
          notes: notes || null,
          user_id: userId,
        };
      });
      const { error } = await supabase.from('pet_weights').insert(inserts);
      if (error) throw error;
      alert(`บันทึกน้ำหนัก ${entries.length} ตัวเรียบร้อยแล้ว`);
      router.push(`/farm-dashboard/${farmId}`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally { setIsSaving(false); }
  };

  const renderPetRow = (pet: any) => {
    const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
    const val = weights[pet.id] ?? '';
    const latestWeight = latestWeightByPet.get(pet.id);
    const useKg = useKgFor(latestWeight);
    return (
      <div key={pet.id} className={`fw-pet-row ${val.trim() ? 'filled' : ''}`}>
        <div className="fw-pet-photo">
          {pet.image_url ? <img src={pet.image_url} alt={pet.name} /> : <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
        </div>
        <div className="fw-pet-info">
          <div className="fw-pet-name">{pet.name || 'ยังไม่ตั้งชื่อ'}</div>
          <span className={`fw-pet-gender ${isMale ? 'm' : 'f'}`}><img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 10, height: 10, objectFit: 'contain' }} />{isMale ? 'ผู้' : 'เมีย'}</span>
          {latestWeight && <div className="fw-pet-prev">น้ำหนักล่าสุด: {fmtWeightHint(latestWeight)}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <input
            type="number"
            step={useKg ? '0.01' : '1'}
            min="0"
            className="fw-weight-input"
            placeholder={useKg ? '0.00' : '0'}
            value={val}
            onChange={e => setWeights(w => ({ ...w, [pet.id]: e.target.value }))}
          />
          <div className="fw-weight-unit">{useKg ? 'กก.' : 'กรัม'}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .fw-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .fw-body { max-width: 640px; margin: 0 auto; padding: 24px 20px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .fw-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .fw-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; margin-top: 2px; }
        .fw-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .fw-title { font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .fw-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 4px; }
        .fw-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px; margin-bottom: 14px; }
        .fw-date-label { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 7px; }
        .fw-input { width: 100%; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: white; }
        .fw-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fw-group { margin-bottom: 18px; }
        .fw-group-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 0 2px; }
        .fw-group-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .fw-group-badge { font-size: 10px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; padding: 3px 10px; border-radius: 999px; }
        .fw-group-badge.amber { color: ${F.amber}; background: ${F.amberSoft}; }
        .fw-pet-row { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; transition: border-color .15s; }
        .fw-pet-row:last-child { margin-bottom: 0; }
        .fw-pet-row.filled { border-color: ${F.pinkBorder}; }
        .fw-pet-photo { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 2px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fw-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .fw-pet-info { flex: 1; min-width: 0; }
        .fw-pet-name { font-size: 13px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fw-pet-gender { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px; margin-top: 2px; }
        .fw-pet-gender.m { background: ${F.blueSoft}; color: ${F.blue}; }
        .fw-pet-gender.f { background: ${F.pinkSoft}; color: ${F.pink}; }
        .fw-pet-prev { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .fw-weight-input { width: 80px; padding: 8px 10px; border: 1.5px solid ${F.lineMid}; border-radius: 10px; font-size: 14px; font-weight: 700; color: ${F.ink}; text-align: center; outline: none; font-family: inherit; transition: all .15s; }
        .fw-weight-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fw-weight-unit { font-size: 10px; font-weight: 600; color: ${F.muted}; text-align: center; margin-top: 2px; }
        .fw-empty { text-align: center; padding: 40px 20px; color: ${F.muted}; font-size: 13px; font-weight: 600; background: white; border: 1px dashed ${F.lineMid}; border-radius: 20px; }
        .fw-actions { display: flex; gap: 12px; margin-top: 8px; }
        .fw-save-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .fw-save-btn:hover { background: #D63F6A; }
        .fw-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="fw-page">
          <div className="fw-body">
            <div className="fw-top">
              <button className="fw-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <div>
                <div className="fw-title">ชั่งน้ำหนักสัตว์ในฟาร์ม</div>
                <div className="fw-sub">กรอกเฉพาะตัวที่ต้องการอัพเดตน้ำหนักใหม่ ตัวที่เว้นว่างไว้จะไม่ถูกบันทึก</div>
              </div>
            </div>

            <div className="fw-card">
              <label className="fw-date-label">วันที่บันทึก</label>
              <input type="date" className="fw-input" value={recordedDate} onChange={e => setRecordedDate(e.target.value)} />
              <div style={{ marginTop: 12 }}>
                <label className="fw-date-label">หมายเหตุสำหรับทุกตัว (ไม่บังคับ)</label>
                <input type="text" className="fw-input" placeholder="เช่น ชั่งน้ำหนักหลังตื่นนอนเช้า" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {breeders.length === 0 && litterIds.length === 0 && babiesNoLitter.length === 0 ? (
              <div className="fw-empty">ยังไม่มีสัตว์ในฟาร์มให้ชั่งน้ำหนัก</div>
            ) : (
              <>
                {breeders.length > 0 && (
                  <div className="fw-group">
                    <div className="fw-group-head">
                      <span className="fw-group-title">พ่อแม่พันธุ์</span>
                      <span className="fw-group-badge">{breeders.length} ตัว</span>
                    </div>
                    {breeders.map(p => renderPetRow(p))}
                  </div>
                )}

                {litterIds.map(litId => {
                  const litter = litterMap.get(parseInt(litId));
                  const kids = babiesByLitter[litId];
                  return (
                    <div key={litId} className="fw-group">
                      <div className="fw-group-head">
                        <span className="fw-group-title">ครอก {litter?.litter_code || 'ไม่ระบุ'}</span>
                        <span className="fw-group-badge amber">{kids.length} ตัว</span>
                      </div>
                      {kids.map(p => renderPetRow(p))}
                    </div>
                  );
                })}

                {babiesNoLitter.length > 0 && (
                  <div className="fw-group">
                    <div className="fw-group-head">
                      <span className="fw-group-title">ไม่ระบุครอก</span>
                      <span className="fw-group-badge amber">{babiesNoLitter.length} ตัว</span>
                    </div>
                    {babiesNoLitter.map(p => renderPetRow(p))}
                  </div>
                )}
              </>
            )}

            <div className="fw-actions">
              <button className="fw-save-btn" onClick={handleSave} disabled={isSaving || filledCount === 0}>
                <Icon.Save /> {isSaving ? 'กำลังบันทึก...' : filledCount > 0 ? `บันทึกน้ำหนัก ${filledCount} ตัว` : 'กรอกน้ำหนักเพื่อบันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
