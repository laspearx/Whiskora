"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', teal: '#0D9488',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

interface KittenForm { tempId: number; name: string; gender: string; weight: string; }

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

export default function RecordBirthPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [litterInfo, setLitterInfo] = useState<any>(null);
  const [actualBirthDate, setActualBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [kittens, setKittens] = useState<KittenForm[]>([{ tempId: Date.now(), name: '', gender: 'male', weight: '' }]);

  useEffect(() => {
    const fetchLitter = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/farm-dashboard/${farmId}/litters/${litterId}/birth`)}`); return; }
        setUserId(session.user.id);
        const { data, error } = await supabase.from('litters')
          .select(`*, dam:pets!dam_id(name, breed, species), sire:pets!sire_id(name, breed, species)`)
          .eq('id', litterId).single();
        if (error || !data) { router.push(`/farm-dashboard/${farmId}`); return; }
        setLitterInfo(data);
      } catch { router.push(`/farm-dashboard/${farmId}`); }
      finally { setIsFetching(false); }
    };
    if (litterId) fetchLitter();
  }, [litterId, farmId, router]);

  const addKitten = () => setKittens([...kittens, { tempId: Date.now(), name: '', gender: 'male', weight: '' }]);
  const removeKitten = (id: number) => setKittens(kittens.filter((k) => k.tempId !== id));
  const updateKitten = (id: number, field: keyof KittenForm, value: string) =>
    setKittens(kittens.map((k) => (k.tempId === id ? { ...k, [field]: value } : k)));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userId || !litterInfo) return;
    setIsLoading(true);
    try {
      const { error: litterError } = await supabase.from('litters').update({ status: 'คลอดแล้ว' }).eq('id', litterId);
      if (litterError) throw litterError;
      const petsData = kittens.map((k, index) => ({
        user_id: userId, farm_id: farmId, litter_id: parseInt(litterId),
        name: k.name || `ลูก${litterInfo.dam?.name || ''} (${litterInfo.litter_code}) #${index + 1}`,
        gender: k.gender, status: 'เด็ก', birth_date: actualBirthDate,
        weight: k.weight ? parseFloat(k.weight) : null,
        species: litterInfo.dam?.species || litterInfo.sire?.species || null,
        breed: litterInfo.dam?.breed || litterInfo.sire?.breed || null,
      }));
      const { error: petsError } = await supabase.from('pets').insert(petsData);
      if (petsError) throw petsError;
      alert(`🎉 บันทึกสมาชิกใหม่ทั้ง ${kittens.length} ตัว เรียบร้อยแล้ว!`);
      router.push(`/farm-dashboard/${farmId}`);
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .rb-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .rb-body { max-width: 640px; margin: 0 auto; padding: 24px 20px 120px; }
        .rb-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .rb-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .rb-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .rb-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .rb-sub { font-size: 12px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }
        .rb-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 22px; margin-bottom: 16px; }
        .rb-date-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 8px; }
        .rb-input { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .rb-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .rb-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 0 2px; }
        .rb-sec-title { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .rb-sec-badge { font-size: 10px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; padding: 4px 11px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; }
        .rb-baby { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; margin-bottom: 12px; position: relative; }
        .rb-baby-head { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
        .rb-baby-num { width: 28px; height: 28px; background: ${F.pink}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .rb-baby-label { font-size: 14px; font-weight: 700; color: ${F.inkSoft}; }
        .rb-baby-remove { position: absolute; top: 14px; right: 14px; color: ${F.muted}; background: none; border: none; cursor: pointer; transition: color .15s; }
        .rb-baby-remove:hover { color: #EF4444; }
        .rb-field { margin-bottom: 12px; }
        .rb-field:last-child { margin-bottom: 0; }
        .rb-flabel { display: block; font-size: 11px; font-weight: 700; color: ${F.muted}; margin-bottom: 5px; margin-left: 1px; }
        .rb-gender { display: flex; gap: 8px; }
        .rb-gender-btn { flex: 1; padding: 10px; border-radius: 11px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; font-size: 13px; font-weight: 700; color: ${F.muted}; transition: all .15s; font-family: inherit; white-space: nowrap; }
        .rb-gender-btn.m.active { border-color: ${F.blue}; background: ${F.blue}; color: white; }
        .rb-gender-btn.f.active { border-color: ${F.pink}; background: ${F.pink}; color: white; }
        .rb-add { width: 100%; border: 2px dashed ${F.lineMid}; color: ${F.muted}; background: none; padding: 16px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
        .rb-add:hover { border-color: ${F.pinkBorder}; color: ${F.pink}; background: ${F.pinkSoft}; }
        .rb-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .rb-savebar-inner { max-width: 640px; margin: 0 auto; }
        .rb-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .rb-btn:hover { background: #D63F6A; }
        .rb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rb-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .rb-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: rbspin 1s linear infinite; }
        @keyframes rbspin { to { transform: rotate(360deg); } }
      `}</style>

      {isFetching ? (
        <div className="rb-loading">
          <div className="rb-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>กำลังเตรียมข้อมูลครอก...</p>
        </div>
      ) : (
        <div className="rb-page">
          <div className="rb-body">
            <div className="rb-header">
              <button className="rb-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="rb-title">บันทึกข้อมูลแรกเกิด</h1>
                <p className="rb-sub">ครอกรหัส: {litterInfo?.litter_code} ( แม่: {litterInfo?.dam?.name} • พ่อ: {litterInfo?.sire?.name} )</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="rb-card">
                <label className="rb-date-label">📅 วันที่คลอดจริง</label>
                <input type="date" className="rb-input" value={actualBirthDate} onChange={(e) => setActualBirthDate(e.target.value)} required />
              </div>

              <div className="rb-sec-head">
                <h3 className="rb-sec-title">รายการเด็กๆ ({kittens.length})</h3>
                <span className="rb-sec-badge">Newborn List</span>
              </div>

              {kittens.map((kitten, index) => (
                <div key={kitten.tempId} className="rb-baby">
                  {kittens.length > 1 && (
                    <button type="button" className="rb-baby-remove" onClick={() => removeKitten(kitten.tempId)} aria-label="ลบ"><Icon.X /></button>
                  )}
                  <div className="rb-baby-head">
                    <div className="rb-baby-num">{index + 1}</div>
                    <span className="rb-baby-label">ข้อมูลเด็กน้อย</span>
                  </div>
                  <div className="rb-field">
                    <label className="rb-flabel">ชื่อ (เว้นได้)</label>
                    <input type="text" className="rb-input" placeholder="เช่น จิ๋ว" value={kitten.name} onChange={(e) => updateKitten(kitten.tempId, 'name', e.target.value)} />
                  </div>
                  <div className="rb-field">
                    <label className="rb-flabel">เพศ</label>
                    <div className="rb-gender">
                      <button type="button" className={`rb-gender-btn m ${kitten.gender === 'male' || kitten.gender === 'ตัวผู้' ? 'active' : ''}`} onClick={() => updateKitten(kitten.tempId, 'gender', 'male')}>♂ ตัวผู้</button>
                      <button type="button" className={`rb-gender-btn f ${kitten.gender === 'female' || kitten.gender === 'ตัวเมีย' ? 'active' : ''}`} onClick={() => updateKitten(kitten.tempId, 'gender', 'female')}>♀ ตัวเมีย</button>
                    </div>
                  </div>
                  <div className="rb-field">
                    <label className="rb-flabel">น้ำหนักแรกเกิด (กรัม)</label>
                    <input type="number" className="rb-input" placeholder="เช่น 50" value={kitten.weight} onChange={(e) => updateKitten(kitten.tempId, 'weight', e.target.value)} />
                  </div>
                </div>
              ))}

              <button type="button" className="rb-add" onClick={addKitten}><Icon.Plus /> เพิ่มเด็กๆ อีกตัว</button>
            </form>
          </div>

          <div className="rb-savebar">
            <div className="rb-savebar-inner">
              <button type="button" className="rb-btn" onClick={handleSubmit} disabled={isLoading}>
                <Icon.Save /> {isLoading ? "กำลังเซฟข้อมูล..." : `ยืนยันบันทึกเด็กๆ ทั้ง ${kittens.length} ตัว`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}