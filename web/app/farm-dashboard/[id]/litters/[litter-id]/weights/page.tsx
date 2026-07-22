"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', blueSoft: '#EFF6FF',
  green: '#16A34A', greenSoft: '#F0FDF4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

// Weight is always stored in grams. >= 1000g shows/accepts kg instead, purely a display/input convenience.
const useKgFor = (lastKnownGrams: number | null | undefined) => (lastKnownGrams ?? 0) >= 1000;
const fmtWeightHint = (g: number) => useKgFor(g) ? `${(g / 1000).toFixed(2)} กก.` : `${g} กรัม`;

interface PetWeight { petId: number; weight: string; }

export default function LitterWeightsPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [litter, setLitter] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);
  const [petWeights, setPetWeights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [unitOverrides, setUnitOverrides] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=/farm-dashboard/${farmId}/litters/${litterId}/weights`); return; }
      setUserId(session.user.id);

      const [{ data: litterData }, { data: babiesData }] = await Promise.all([
        supabase.from('litters').select('id, litter_code, status, actual_birth_date').eq('id', litterId).single(),
        supabase.from('pets').select('id, name, image_url, gender').eq('litter_id', litterId).order('id', { ascending: true }),
      ]);

      if (!litterData) { router.push(`/farm-dashboard/${farmId}`); return; }
      if (litterData.status !== 'คลอดแล้ว') { router.push(`/farm-dashboard/${farmId}/litters/${litterId}`); return; }

      setLitter(litterData);
      setBabies(babiesData || []);

      if (babiesData && babiesData.length > 0) {
        const { data: wData } = await supabase
          .from('pet_weights')
          .select('pet_id, weight, recorded_date')
          .in('pet_id', babiesData.map(b => b.id))
          .order('recorded_date', { ascending: true });
        if (wData) setPetWeights(wData);
      }

      setIsLoading(false);
    };
    load();
  }, [litterId, farmId, router]);

  const latestWeightByPet = new Map<number, number>();
  for (const baby of babies) {
    const records = petWeights.filter(w => w.pet_id === baby.id);
    if (records.length > 0) latestWeightByPet.set(baby.id, records[records.length - 1].weight);
  }

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
          pet_id: parseInt(petId),
          weight: weightInGrams,
          recorded_date: recordedDate,
          notes: notes || null,
          user_id: userId,
        };
      });
      const { error } = await supabase.from('pet_weights').insert(inserts);
      if (error) throw error;

      setSavedIds(new Set(entries.map(([id]) => parseInt(id))));
      alert(`บันทึกน้ำหนัก ${entries.length} ตัวเรียบร้อยแล้ว`);
      router.push(`/farm-dashboard/${farmId}/litters/${litterId}`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally { setIsSaving(false); }
  };

  const filledCount = Object.values(weights).filter(w => w.trim() !== '').length;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .lw-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .lw-body { max-width: 640px; margin: 0 auto; padding: 24px 20px 32px; }
        .lw-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .lw-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; margin-top: 2px; }
        .lw-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .lw-title { font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .lw-sub { font-size: 12px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }
        .lw-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px; margin-bottom: 14px; }
        .lw-date-label { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 7px; }
        .lw-input { width: 100%; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: white; }
        .lw-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .lw-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .lw-sec-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .lw-sec-badge { font-size: 10px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; padding: 3px 10px; border-radius: 999px; }
        .lw-pet-row { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; transition: border-color .15s; }
        .lw-pet-row.filled { border-color: ${F.pinkBorder}; }
        .lw-pet-photo { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 2px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .lw-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .lw-pet-info { flex: 1; min-width: 0; }
        .lw-pet-name { font-size: 13px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lw-pet-gender { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 5px; display: inline-block; margin-top: 2px; }
        .lw-pet-gender.m { background: ${F.blueSoft}; color: ${F.blue}; }
        .lw-pet-gender.f { background: ${F.pinkSoft}; color: ${F.pink}; }
        .lw-pet-prev { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .lw-weight-input { width: 90px; padding: 9px 10px; border: 1.5px solid ${F.lineMid}; border-radius: 10px; font-size: 15px; font-weight: 700; color: ${F.ink}; text-align: center; outline: none; font-family: inherit; transition: all .15s; }
        .lw-weight-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .lw-weight-unit-toggle { font-size: 11px; font-weight: 600; color: ${F.pink}; text-align: center; margin-top: 3px; background: none; border: none; cursor: pointer; padding: 2px 4px; font-family: inherit; }
        .lw-weight-unit-toggle:hover { text-decoration: underline; }
        .lw-actions { display: flex; gap: 12px; margin-top: 24px; }
        .lw-save-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .lw-save-btn:hover { background: #D63F6A; }
        .lw-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="lw-page">
          <div className="lw-body">
            <div className="lw-top">
              <button className="lw-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <div>
                <div className="lw-title">บันทึกน้ำหนักทั้งครอก</div>
                <div className="lw-sub">
                  ครอก {litter?.litter_code} · คลอดวันที่ {fmtDate(litter?.actual_birth_date)}
                </div>
              </div>
            </div>

            <div className="lw-card">
              <label className="lw-date-label">วันที่บันทึก</label>
              <input type="date" className="lw-input" value={recordedDate} onChange={e => setRecordedDate(e.target.value)} />
              <div style={{ marginTop: 12 }}>
                <label className="lw-date-label">หมายเหตุสำหรับทุกตัว (ไม่บังคับ)</label>
                <input type="text" className="lw-input" placeholder="เช่น ชั่งน้ำหนักหลังตื่นนอนเช้า" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="lw-sec-head">
              <span className="lw-sec-title">สมาชิก ({babies.length} ตัว)</span>
              <span className="lw-sec-badge">{filledCount}/{babies.length} กรอกแล้ว</span>
            </div>

            {babies.map(baby => {
              const isMale = baby.gender === 'male' || baby.gender === 'ตัวผู้';
              const val = weights[baby.id] ?? '';
              const latestWeight = latestWeightByPet.get(baby.id);
              const useKg = unitOverrides[baby.id] ?? useKgFor(latestWeight);
              return (
                <div key={baby.id} className={`lw-pet-row ${val.trim() ? 'filled' : ''}`}>
                  <div className="lw-pet-photo">
                    {baby.image_url ? <img src={baby.image_url} alt={baby.name} /> : '🐾'}
                  </div>
                  <div className="lw-pet-info">
                    <div className="lw-pet-name">{baby.name || 'ยังไม่ตั้งชื่อ'}</div>
                    <span className={`lw-pet-gender ${isMale ? 'm' : 'f'}`} style={{ display:'inline-flex', alignItems:'center', gap:3 }}><img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{width:10,height:10,objectFit:'contain'}} />{isMale ? 'ผู้' : 'เมีย'}</span>
                    {latestWeight && <div className="lw-pet-prev">น้ำหนักล่าสุด: {fmtWeightHint(latestWeight)}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <input
                      type="number"
                      step={useKg ? '0.01' : '1'}
                      min="0"
                      className="lw-weight-input"
                      placeholder={useKg ? '0.00' : '0'}
                      value={val}
                      onChange={e => setWeights(w => ({ ...w, [baby.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="lw-weight-unit-toggle"
                      onClick={() => setUnitOverrides(o => ({ ...o, [baby.id]: !useKg }))}
                      title="แตะเพื่อสลับหน่วย"
                    >
                      {useKg ? 'กก.' : 'กรัม'} ⇄
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lw-actions">
            <button className="lw-save-btn" onClick={handleSave} disabled={isSaving || filledCount === 0}>
              <Icon.Save /> {isSaving ? 'กำลังบันทึก...' : `บันทึกน้ำหนัก ${filledCount > 0 ? filledCount : babies.length} ตัว`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
