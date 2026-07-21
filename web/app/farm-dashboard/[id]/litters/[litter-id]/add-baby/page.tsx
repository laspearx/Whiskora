"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  X:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
  Save:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

interface BabyForm { tempId: number; name: string; gender: string; weight: string; plan: 'ยังไม่เปิดจอง' | 'เก็บ'; }

export default function AddBabyPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [litterInfo, setLitterInfo] = useState<any>(null);
  const [birthDate, setBirthDate] = useState('');
  const [babies, setBabies] = useState<BabyForm[]>([{ tempId: Date.now(), name: '', gender: 'male', weight: '', plan: 'ยังไม่เปิดจอง' }]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=/farm-dashboard/${farmId}/litters/${litterId}/add-baby`); return; }
      setUserId(session.user.id);

      const { data, error } = await supabase.from('litters')
        .select(`*, dam:pets!dam_id(name, breed, species), sire:pets!sire_id(name)`)
        .eq('id', litterId).single();
      if (error || !data || data.status !== 'คลอดแล้ว') { router.push(`/farm-dashboard/${farmId}/litters/${litterId}`); return; }

      setLitterInfo(data);
      setBirthDate(data.actual_birth_date || new Date().toISOString().split('T')[0]);
      setIsFetching(false);
    };
    load();
  }, [litterId, farmId, router]);

  const addRow = () => setBabies(b => [...b, { tempId: Date.now(), name: '', gender: 'male', weight: '', plan: 'ยังไม่เปิดจอง' }]);
  const removeRow = (id: number) => setBabies(b => b.filter(r => r.tempId !== id));
  const updateRow = (id: number, field: string, value: string) =>
    setBabies(b => b.map(r => r.tempId === id ? { ...r, [field]: value } : r));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userId || !litterInfo) return;
    setIsSaving(true);
    try {
      const inserts = babies.map((b, i) => ({
        user_id: userId,
        farm_id: farmId,
        litter_id: parseInt(litterId),
        name: b.name || `ลูก${litterInfo.dam?.name || ''} (${litterInfo.litter_code}) #${i + 1}`,
        gender: b.gender,
        status: b.plan,
        birth_date: birthDate,
        weight: b.weight ? parseFloat(b.weight) : null,
        species: litterInfo.dam?.species || null,
        breed: litterInfo.dam?.breed || null,
      }));
      const { error } = await supabase.from('pets').insert(inserts);
      if (error) throw error;
      router.push(`/farm-dashboard/${farmId}/litters/${litterId}`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally { setIsSaving(false); }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ab-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .ab-body { max-width: 640px; margin: 0 auto; padding: 24px 20px 32px; }
        .ab-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .ab-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; margin-top: 2px; }
        .ab-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ab-title { font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .ab-sub { font-size: 12px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }
        .ab-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px; margin-bottom: 14px; }
        .ab-label { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 7px; }
        .ab-input { width: 100%; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: white; }
        .ab-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .ab-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .ab-sec-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .ab-sec-badge { font-size: 10px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; padding: 3px 10px; border-radius: 999px; }
        .ab-baby { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; margin-bottom: 10px; position: relative; }
        .ab-baby-head { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
        .ab-baby-num { width: 28px; height: 28px; background: ${F.pink}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .ab-baby-label { font-size: 14px; font-weight: 700; color: ${F.inkSoft}; }
        .ab-baby-remove { position: absolute; top: 14px; right: 14px; color: ${F.muted}; background: none; border: none; cursor: pointer; transition: color .15s; }
        .ab-baby-remove:hover { color: #EF4444; }
        .ab-field { margin-bottom: 12px; }
        .ab-field:last-child { margin-bottom: 0; }
        .ab-flabel { display: block; font-size: 11px; font-weight: 700; color: ${F.muted}; margin-bottom: 5px; margin-left: 1px; }
        .ab-gender { display: flex; gap: 8px; }
        .ab-gender-btn { flex: 1; padding: 10px; border-radius: 11px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; font-size: 13px; font-weight: 700; color: ${F.muted}; transition: all .15s; font-family: inherit; }
        .ab-gender-btn.m.active { border-color: ${F.blue}; background: ${F.blue}; color: white; }
        .ab-gender-btn.f.active { border-color: ${F.pink}; background: ${F.pink}; color: white; }
        .ab-plan { display: flex; gap: 8px; }
        .ab-plan-btn { flex: 1; padding: 10px 8px; border-radius: 11px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; font-size: 12px; font-weight: 700; color: ${F.muted}; transition: all .15s; font-family: inherit; line-height: 1.3; }
        .ab-plan-btn.sell.active { border-color: #D97706; background: #FFFBEB; color: #D97706; }
        .ab-plan-btn.keep.active { border-color: #7C3AED; background: #F5F3FF; color: #7C3AED; }
        .ab-add { width: 100%; border: 2px dashed ${F.lineMid}; color: ${F.muted}; background: none; padding: 14px; border-radius: 14px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
        .ab-add:hover { border-color: ${F.pinkBorder}; color: ${F.pink}; background: ${F.pinkSoft}; }
        .ab-actions { display: flex; gap: 12px; margin-top: 24px; }
        .ab-cancel-btn { flex: 0 0 auto; padding: 14px 22px; background: white; color: #4B5563; border: 1.5px solid #E5E7EB; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ab-save-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .ab-save-btn:hover { background: #D63F6A; }
        .ab-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {isFetching ? (
        <PageLoader />
      ) : (
        <div className="ab-page">
          <div className="ab-body">
            <div className="ab-top">
              <button className="ab-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <div>
                <div className="ab-title">เพิ่มสมาชิกในครอก</div>
                <div className="ab-sub">
                  ครอก {litterInfo?.litter_code} · แม่: {litterInfo?.dam?.name} · พ่อ: {litterInfo?.sire?.name}
                </div>
              </div>
            </div>

            <div className="ab-card">
              <label className="ab-label">วันเกิด</label>
              <input type="date" className="ab-input" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>

            <div className="ab-sec-head">
              <span className="ab-sec-title">รายการ ({babies.length} ตัว)</span>
              <span className="ab-sec-badge">เพิ่มย้อนหลัง</span>
            </div>

            <form onSubmit={handleSubmit}>
              {babies.map((baby, index) => (
                <div key={baby.tempId} className="ab-baby">
                  {babies.length > 1 && (
                    <button type="button" className="ab-baby-remove" onClick={() => removeRow(baby.tempId)}><Icon.X /></button>
                  )}
                  <div className="ab-baby-head">
                    <div className="ab-baby-num">{index + 1}</div>
                    <span className="ab-baby-label">ข้อมูลสมาชิก</span>
                  </div>
                  <div className="ab-field">
                    <label className="ab-flabel">ชื่อ (เว้นได้)</label>
                    <input type="text" className="ab-input" placeholder="เช่น น้องมะลิ" value={baby.name} onChange={e => updateRow(baby.tempId, 'name', e.target.value)} />
                  </div>
                  <div className="ab-field">
                    <label className="ab-flabel">เพศ</label>
                    <div className="ab-gender">
                      <button type="button" className={`ab-gender-btn m ${baby.gender === 'male' ? 'active' : ''}`} onClick={() => updateRow(baby.tempId, 'gender', 'male')}><img src="/icons/icon-men.png" alt="" style={{width:14,height:14,objectFit:'contain',verticalAlign:'middle',marginRight:4}} />ตัวผู้</button>
                      <button type="button" className={`ab-gender-btn f ${baby.gender === 'female' ? 'active' : ''}`} onClick={() => updateRow(baby.tempId, 'gender', 'female')}><img src="/icons/icon-women.png" alt="" style={{width:14,height:14,objectFit:'contain',verticalAlign:'middle',marginRight:4}} />ตัวเมีย</button>
                    </div>
                  </div>
                  <div className="ab-field">
                    <label className="ab-flabel">น้ำหนักแรกเกิด (กรัม) — ไม่บังคับ</label>
                    <input type="number" className="ab-input" placeholder="เช่น 85" value={baby.weight} onChange={e => updateRow(baby.tempId, 'weight', e.target.value)} />
                  </div>
                  <div className="ab-field">
                    <label className="ab-flabel">วางแผนไว้</label>
                    <div className="ab-plan">
                      <button type="button" className={`ab-plan-btn sell ${baby.plan === 'ยังไม่เปิดจอง' ? 'active' : ''}`} onClick={() => updateRow(baby.tempId, 'plan', 'ยังไม่เปิดจอง')}>ยังไม่เปิดจอง</button>
                      <button type="button" className={`ab-plan-btn keep ${baby.plan === 'เก็บ' ? 'active' : ''}`} onClick={() => updateRow(baby.tempId, 'plan', 'เก็บ')}>เก็บไว้เป็นพ่อแม่พันธุ์</button>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="ab-add" onClick={addRow}><Icon.Plus /> เพิ่มอีกตัว</button>
            </form>
          </div>

          <div className="ab-actions">
            <button type="button" className="ab-cancel-btn" onClick={() => router.back()}>ยกเลิก</button>
            <button className="ab-save-btn" onClick={handleSubmit} disabled={isSaving}>
              <Icon.Save /> {isSaving ? 'กำลังบันทึก...' : `บันทึกสมาชิกใหม่ ${babies.length} ตัว`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
