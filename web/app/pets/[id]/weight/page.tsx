"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Weight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  TrendUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

// Weight is always stored in grams. >= 1000g shows/accepts kg instead, purely a display/input convenience.
const useKgFor = (lastKnownGrams: number | null | undefined) => (lastKnownGrams ?? 0) >= 1000;
const fmtWeightVal = (g: number) => useKgFor(g) ? (g / 1000).toFixed(2) : `${g}`;
const fmtWeightUnit = (g: number) => useKgFor(g) ? 'กก.' : 'กรัม';
const fmtWeightDiff = (deltaGrams: number, useKg: boolean) =>
  useKg ? `${deltaGrams >= 0 ? '+' : ''}${(deltaGrams / 1000).toFixed(2)} กก.` : `${deltaGrams >= 0 ? '+' : ''}${deltaGrams} กรัม`;

export default function PetWeightPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [weights, setWeights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight: '', recorded_date: new Date().toISOString().split('T')[0], notes: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [unitOverride, setUnitOverride] = useState<boolean | null>(null);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push(`/login?redirect=/pets/${petId}/weight`); return; }
    setUserId(session.user.id);

    const [{ data: petData }, { data: weightData }] = await Promise.all([
      supabase.from('pets').select('id, name, image_url, species, breed').eq('id', petId).single(),
      supabase.from('pet_weights').select('*').eq('pet_id', petId).order('recorded_date', { ascending: false }),
    ]);
    if (petData) setPet(petData);
    if (weightData) setWeights(weightData);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [petId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weight || !userId) return;
    setIsSaving(true);
    try {
      const weightInGrams = useKgForm ? Math.round(parseFloat(form.weight) * 1000) : parseFloat(form.weight);
      const { error } = await supabase.from('pet_weights').insert({
        pet_id: parseInt(petId),
        weight: weightInGrams,
        recorded_date: form.recorded_date,
        notes: form.notes || null,
        user_id: userId,
      });
      if (error) throw error;
      setForm({ weight: '', recorded_date: new Date().toISOString().split('T')[0], notes: '' });
      setShowForm(false);
      setUnitOverride(null);
      await fetchData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบบันทึกน้ำหนักนี้?')) return;
    await supabase.from('pet_weights').delete().eq('id', id);
    setWeights(weights.filter(w => w.id !== id));
  };

  const latestWeight = weights[0]?.weight;
  const prevWeight = weights[1]?.weight;
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight) : null;
  const useKgForm = unitOverride ?? useKgFor(latestWeight);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pw-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .pw-body { max-width: 640px; margin: 0 auto; padding: 24px 20px 80px; }
        .pw-top { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .pw-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .pw-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .pw-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .pw-sub { font-size: 12px; font-weight: 600; color: ${F.pink}; margin-top: 3px; }
        .pw-summary { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px; margin-bottom: 14px; display: flex; align-items: center; gap: 16px; }
        .pw-pet-photo { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; border: 2px solid ${F.pinkBorder}; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
        .pw-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .pw-pet-name { font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .pw-weight-current { font-size: 28px; font-weight: 800; color: ${F.pink}; line-height: 1; margin-top: 4px; }
        .pw-weight-unit { font-size: 13px; font-weight: 600; color: ${F.muted}; }
        .pw-weight-diff { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-top: 4px; display: inline-block; }
        .pw-weight-diff.up { background: ${F.greenSoft}; color: ${F.green}; }
        .pw-weight-diff.down { background: #FEF2F2; color: #EF4444; }
        .pw-add-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 12px; background: ${F.pink}; color: white; font-size: 13px; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: all .15s; margin-bottom: 16px; }
        .pw-add-btn:hover { background: #D63F6A; }
        .pw-form { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px; margin-bottom: 16px; }
        .pw-form-title { font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 14px; }
        .pw-field { margin-bottom: 12px; }
        .pw-label { display: block; font-size: 11px; font-weight: 700; color: ${F.muted}; margin-bottom: 5px; }
        .pw-unit-toggle { margin-left: 8px; font-size: 10px; font-weight: 700; color: ${F.pink}; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
        .pw-unit-toggle:hover { text-decoration: underline; }
        .pw-input { width: 100%; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: white; }
        .pw-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .pw-form-row { display: flex; gap: 10px; }
        .pw-form-row .pw-field { flex: 1; }
        .pw-save-btn { width: 100%; padding: 13px; background: ${F.pink}; color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; transition: all .15s; }
        .pw-save-btn:hover { background: #D63F6A; }
        .pw-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pw-cancel-btn { width: 100%; padding: 11px; background: white; color: ${F.muted}; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: all .15s; }
        .pw-cancel-btn:hover { background: ${F.line}; color: ${F.inkSoft}; }
        .pw-list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 2px; }
        .pw-list-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .pw-list-count { font-size: 11px; font-weight: 700; color: ${F.muted}; background: ${F.line}; padding: 3px 10px; border-radius: 999px; }
        .pw-empty { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 32px; text-align: center; font-size: 13px; font-weight: 600; color: ${F.muted}; }
        .pw-entry { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
        .pw-entry-date { font-size: 12px; font-weight: 700; color: ${F.muted}; flex-shrink: 0; min-width: 72px; }
        .pw-entry-weight { font-size: 20px; font-weight: 800; color: ${F.ink}; }
        .pw-entry-unit { font-size: 11px; font-weight: 600; color: ${F.muted}; }
        .pw-entry-notes { font-size: 11px; font-weight: 600; color: ${F.muted}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pw-entry-del { margin-left: auto; color: ${F.muted}; background: none; border: none; cursor: pointer; padding: 4px; transition: color .15s; flex-shrink: 0; }
        .pw-entry-del:hover { color: #EF4444; }
      `}</style>

      {isLoading ? (
        <PageLoader />
      ) : !pet ? null : (
        <div className="pw-page">
          <div className="pw-body">
            <div className="pw-top">
              <button className="pw-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <div>
                <div className="pw-title">ประวัติน้ำหนัก</div>
                <div className="pw-sub">{pet.name} · {pet.breed || 'ไม่ระบุสายพันธุ์'}</div>
              </div>
            </div>

            <div className="pw-summary">
              <div className="pw-pet-photo">
                {pet.image_url ? <img src={pet.image_url} alt={pet.name} /> : <img src="/icons/icon-paw-pink.png" alt="" style={{width:'55%',height:'55%',objectFit:'contain',opacity:0.35}} />}
              </div>
              <div>
                <div className="pw-pet-name">{pet.name}</div>
                {latestWeight ? (
                  <>
                    <div className="pw-weight-current">{fmtWeightVal(latestWeight)} <span className="pw-weight-unit">{fmtWeightUnit(latestWeight)}</span></div>
                    {weightDiff !== null && (
                      <span className={`pw-weight-diff ${weightDiff >= 0 ? 'up' : 'down'}`}>
                        {fmtWeightDiff(weightDiff, useKgFor(latestWeight))} จากครั้งก่อน
                      </span>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: F.muted, marginTop: 4 }}>ยังไม่มีบันทึกน้ำหนัก</div>
                )}
              </div>
            </div>

            {!showForm ? (
              <button className="pw-add-btn" onClick={() => setShowForm(true)}>
                <Icon.Plus /> บันทึกน้ำหนักใหม่
              </button>
            ) : (
              <div className="pw-form">
                <div className="pw-form-title">บันทึกน้ำหนัก</div>
                <form onSubmit={handleSave}>
                  <div className="pw-form-row">
                    <div className="pw-field">
                      <label className="pw-label">
                        น้ำหนัก ({useKgForm ? 'กก.' : 'กรัม'})
                        <button type="button" className="pw-unit-toggle" onClick={() => setUnitOverride(!useKgForm)}>สลับเป็น{useKgForm ? 'กรัม' : 'กก.'}</button>
                      </label>
                      <input type="number" step={useKgForm ? '0.01' : '1'} min="0" className="pw-input" placeholder={useKgForm ? 'เช่น 4.5' : 'เช่น 450'} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} required autoFocus />
                    </div>
                    <div className="pw-field">
                      <label className="pw-label">วันที่บันทึก</label>
                      <input type="date" className="pw-input" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="pw-field">
                    <label className="pw-label">หมายเหตุ (ไม่บังคับ)</label>
                    <input type="text" className="pw-input" placeholder="เช่น หลังฉีดวัคซีน" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <button type="submit" className="pw-save-btn" disabled={isSaving}>
                    <Icon.Save /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกน้ำหนัก'}
                  </button>
                  <button type="button" className="pw-cancel-btn" onClick={() => setShowForm(false)}>ยกเลิก</button>
                </form>
              </div>
            )}

            <div className="pw-list-head">
              <span className="pw-list-title">ประวัติทั้งหมด</span>
              <span className="pw-list-count">{weights.length} ครั้ง</span>
            </div>

            {weights.length === 0 ? (
              <div className="pw-empty">ยังไม่มีประวัติน้ำหนัก — กดปุ่มด้านบนเพื่อบันทึกครั้งแรก</div>
            ) : (
              weights.map((w, i) => {
                const diff = i < weights.length - 1 ? w.weight - weights[i + 1].weight : null;
                return (
                  <div key={w.id} className="pw-entry">
                    <div className="pw-entry-date">{fmtDate(w.recorded_date)}</div>
                    <div style={{ flex: 1 }}>
                      <div>
                        <span className="pw-entry-weight">{fmtWeightVal(w.weight)}</span>
                        <span className="pw-entry-unit"> {fmtWeightUnit(w.weight)}</span>
                        {diff !== null && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: diff >= 0 ? F.green : '#EF4444' }}>
                            {fmtWeightDiff(diff, useKgFor(w.weight))}
                          </span>
                        )}
                      </div>
                      {w.notes && <div className="pw-entry-notes">{w.notes}</div>}
                    </div>
                    <button className="pw-entry-del" onClick={() => handleDelete(w.id)}><Icon.Trash /></button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
