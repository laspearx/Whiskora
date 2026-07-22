"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', green: '#16A34A',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Weight: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Plus: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export default function LitterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [litter, setLitter] = useState<any>(null);
  const [sire, setSire] = useState<any>(null);
  const [dam, setDam] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);
  const [petWeights, setPetWeights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchLitterDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/farm-dashboard/${farmId}/litters/${litterId}`)}`);
        const { data: litterData, error: litterError } = await supabase.from('litters').select('*').eq('id', litterId).single();
        if (litterError) throw litterError;
        setLitter(litterData);
        const { data: parentsData } = await supabase.from('pets').select('*').in('id', [litterData.sire_id, litterData.dam_id]);
        if (parentsData) {
          setSire(parentsData.find((p) => p.id === litterData.sire_id));
          setDam(parentsData.find((p) => p.id === litterData.dam_id));
        }
        const { data: babiesData } = await supabase.from('pets').select('*').eq('litter_id', litterId).order('id', { ascending: true });
        if (babiesData) {
          setBabies(babiesData);
          if (babiesData.length > 0) {
            const { data: wData } = await supabase
              .from('pet_weights')
              .select('pet_id, weight, recorded_date')
              .in('pet_id', babiesData.map(b => b.id))
              .order('recorded_date', { ascending: true });
            if (wData) setPetWeights(wData);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        router.push(`/farm-dashboard/${farmId}`);
      } finally { setIsLoading(false); }
    };
    if (litterId) fetchLitterDetails();
  }, [litterId, farmId, router]);

  const born = litter?.status === 'คลอดแล้ว';

  const handlePhotoUpload = async (baby: any, file: File) => {
    setUploadingId(baby.id);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${farmId}/${baby.id}/photo.${ext}`;
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
      await supabase.from('pets').update({ image_url: publicUrl }).eq('id', baby.id);
      setBabies(prev => prev.map(b => b.id === baby.id ? { ...b, image_url: publicUrl } : b));
    } catch (e: any) {
      alert('อัพโหลดไม่สำเร็จ: ' + e.message);
    } finally { setUploadingId(null); }
  };

  // Build per-member weight summary: original (first recorded) vs latest weight,
  // so the farm can see each kitten's growth at a glance instead of a litter average
  type BabyWeightSummary = {
    baby: any;
    original: number;
    latest: number;
    delta: number;
    isNew: boolean; // only one weight record so far — nothing to compare yet
  };
  const weightSummaries: BabyWeightSummary[] = babies
    .map((baby) => {
      const records = petWeights
        .filter((w) => w.pet_id === baby.id)
        .sort((a, b) => a.recorded_date.localeCompare(b.recorded_date));
      if (records.length === 0) return null;
      const latest = records[records.length - 1].weight;
      if (records.length >= 2) {
        const original = records[0].weight;
        return { baby, original, latest, delta: latest - original, isNew: false };
      }
      // only one tracked weigh-in so far — compare against the recorded birth weight if it differs
      if (baby.weight != null && baby.weight !== latest) {
        return { baby, original: baby.weight, latest, delta: latest - baby.weight, isNew: false };
      }
      return { baby, original: latest, latest, delta: 0, isNew: true };
    })
    .filter((s): s is BabyWeightSummary => s !== null)
    .sort((a, b) => b.delta - a.delta); // fastest-growing first, biggest decline last
  const maxGain = Math.max(0, ...weightSummaries.map((s) => s.delta));
  const topGainerId = maxGain > 0 ? weightSummaries.find((s) => s.delta === maxGain)?.baby.id : null;
  const noDataBabies = babies.filter((baby) => !petWeights.some((w) => w.pet_id === baby.id));
  const latestWeightByPet = new Map<number, number>(weightSummaries.map((s) => [s.baby.id, s.latest]));

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .ld-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; }
        .ld-body { max-width: 680px; margin: 0 auto; padding: 24px 20px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .ld-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .ld-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .ld-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ld-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; flex: 1; }
        .ld-title .code { color: ${F.pink}; }
        .ld-title-edit { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer; text-decoration: none; flex-shrink: 0; opacity: .85; transition: opacity .15s; }
        .ld-title-edit:hover { opacity: 1; }
        .ld-title-edit img { width: 36px; height: 36px; object-fit: contain; }
        .ld-birth-btn { background: ${F.pink}; color: white; padding: 9px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; transition: all .15s; white-space: nowrap; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .ld-birth-btn:hover { background: #D63F6A; }
        /* parents */
        .ld-parents { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 22px; margin-bottom: 14px; }
        .ld-parents-row { display: flex; align-items: center; justify-content: center; gap: 18px; }
        .ld-parents-foot { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; padding-top: 14px; border-top: 1px solid ${F.line}; font-size: 12px; font-weight: 600; color: ${F.muted}; }
        .ld-parents-foot .highlight { color: ${F.green}; font-weight: 700; }
        .ld-parent { display: flex; flex-direction: column; align-items: center; text-decoration: none; width: 92px; }
        .ld-parent-photo { width: 76px; height: 76px; border-radius: 50%; overflow: hidden; border: 3px solid; display: flex; align-items: center; justify-content: center; font-size: 26px; background: ${F.bg}; }
        .ld-parent.sire .ld-parent-photo { border-color: #BFDBFE; color: ${F.blue}; }
        .ld-parent.dam .ld-parent-photo { border-color: ${F.pinkBorder}; color: ${F.pink}; }
        .ld-parent-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ld-parent-name { font-family: inherit; font-size: 13px; font-weight: 700; color: ${F.ink}; margin-top: 8px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .ld-parent-role { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; }
        .ld-parent.sire .ld-parent-role { color: ${F.blue}; }
        .ld-parent.dam .ld-parent-role { color: ${F.pink}; }
        .ld-heart { color: ${F.pinkBorder}; flex-shrink: 0; }
        /* edit action */
        .ld-weight-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 12px; font-weight: 700; text-decoration: none; transition: all .15s; }
        .ld-weight-btn:hover { background: #fbd5e3; }
        /* babies */
        .ld-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; gap: 8px; }
        .ld-sec-head-left { display: flex; align-items: center; gap: 8px; }
        .ld-sec-title { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .ld-sec-count { font-size: 11px; font-weight: 700; color: ${F.muted}; background: ${F.line}; padding: 4px 11px; border-radius: 999px; }
        .ld-add-baby-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 10px; background: ${F.pink}; color: white; font-size: 12px; font-weight: 700; text-decoration: none; transition: all .15s; box-shadow: 0 2px 8px rgba(232,70,119,.25); }
        .ld-add-baby-btn:hover { background: #D63F6A; }
        .ld-empty { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 32px; text-align: center; font-size: 13px; font-weight: 600; color: ${F.muted}; }
        .ld-babies { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
        .ld-baby { background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 8px; text-decoration: none; transition: all .15s; display: flex; flex-direction: column; position: relative; }
        .ld-baby:hover { border-color: ${F.pinkBorder}; }
        .ld-baby-photo { aspect-ratio: 1; border-radius: 11px; overflow: hidden; background: ${F.bg}; position: relative; margin-bottom: 7px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
        .ld-baby-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ld-baby-weight { position: absolute; top: 4px; left: 4px; background: rgba(255,255,255,0.92); border-radius: 6px; padding: 1px 5px; font-size: 9px; font-weight: 700; color: ${F.inkSoft}; }
        .ld-baby-name { font-family: inherit; font-size: 12px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
        .ld-baby-foot { display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-top: auto; }
        .ld-baby-gender { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 5px; }
        .ld-baby-gender.m { background: #EFF6FF; color: ${F.blue}; }
        .ld-baby-gender.f { background: ${F.pinkSoft}; color: ${F.pink}; }
        .ld-baby-status { font-size: 9px; font-weight: 600; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* weight trend */
        .ld-trend { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 18px; margin-bottom: 14px; }
        .ld-trend-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .ld-trend-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .ld-trend-empty { font-size: 12px; color: ${F.muted}; font-weight: 600; }
        .ld-wsum-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; border: 1px solid ${F.line}; margin-bottom: 8px; }
        .ld-wsum-row:last-child { margin-bottom: 0; }
        .ld-wsum-row.down { background: #FEF2F2; border-color: #FECACA; }
        .ld-wsum-row.top { background: #F0FDF4; border-color: #BBF7D0; }
        .ld-wsum-photo { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: white; border: 1.5px solid ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .ld-wsum-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ld-wsum-info { flex: 1; min-width: 0; }
        .ld-wsum-name { font-size: 13px; font-weight: 700; color: ${F.ink}; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .ld-wsum-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 999px; white-space: nowrap; }
        .ld-wsum-badge.top { background: #DCFCE7; color: #15803D; }
        .ld-wsum-badge.down { background: #FEE2E2; color: #DC2626; }
        .ld-wsum-range { font-size: 11px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .ld-wsum-note { font-size: 10px; font-weight: 500; color: #B91C1C; margin-top: 2px; }
        .ld-wsum-delta { font-size: 13px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
        .ld-wsum-delta.up { color: ${F.green}; }
        .ld-wsum-delta.down { color: #DC2626; }
        .ld-wsum-delta.same { color: ${F.muted}; }
        .ld-nodata-note { font-size: 11px; font-weight: 500; color: ${F.muted}; margin-top: 12px; padding-top: 12px; border-top: 1px dashed ${F.lineMid}; }

        /* photo upload overlay */
        .ld-baby-upload { position: absolute; bottom: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1.5px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; z-index: 2; }
        .ld-baby-upload:hover { background: ${F.pinkSoft}; }
        .ld-baby-uploading { opacity: 0.5; pointer-events: none; }
      `}</style>

      {isLoading || !litter ? (
        <PageLoader />
      ) : (
        <div className="ld-page">
          <div className="ld-body">
            <div className="ld-top">
              <button className="ld-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <h1 className="ld-title">ครอก <span className="code">{litter.litter_code || 'ไม่ระบุ'}</span></h1>
              <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/edit`} className="ld-title-edit" aria-label="แก้ไขข้อมูลการบรีด">
                <img src="/icons/icon-edit.png" alt="" />
              </Link>
            </div>

            <div className="ld-parents">
              <div className="ld-parents-row">
                <Link href={`/pets/${sire?.id}`} className="ld-parent sire">
                  <div className="ld-parent-photo">{sire?.image_url ? <img src={sire.image_url} alt={sire.name} /> : <img src="/icons/icon-men.png" alt="พ่อพันธุ์" style={{width:36,height:36,objectFit:'contain',opacity:0.6}} />}</div>
                  <span className="ld-parent-name">{sire?.name || 'ไม่ระบุ'}</span>
                  <span className="ld-parent-role">SIRE</span>
                </Link>
                <span className="ld-heart"><Icon.Heart /></span>
                <Link href={`/pets/${dam?.id}`} className="ld-parent dam">
                  <div className="ld-parent-photo">{dam?.image_url ? <img src={dam.image_url} alt={dam.name} /> : <img src="/icons/icon-women.png" alt="แม่พันธุ์" style={{width:36,height:36,objectFit:'contain',opacity:0.6}} />}</div>
                  <span className="ld-parent-name">{dam?.name || 'ไม่ระบุ'}</span>
                  <span className="ld-parent-role">DAM</span>
                </Link>
              </div>
              <div className="ld-parents-foot">
                <span>ทับ: {fmtDate(litter.mating_date)}</span>
                <span>•</span>
                {born ? (
                  <span className="highlight">คลอด: {fmtDate(litter.actual_birth_date)}</span>
                ) : (
                  <>
                    <span>กำหนดคลอด: {fmtDate(litter.expected_birth_date)}</span>
                    <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/birth`} className="ld-birth-btn">บันทึกการคลอด</Link>
                  </>
                )}
              </div>
            </div>

            {/* Per-member weight tracking */}
            {born && (
              <div className="ld-trend">
                <div className="ld-trend-head">
                  <span className="ld-trend-title">ติดตามน้ำหนักรายตัว</span>
                  <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/weights`} className="ld-weight-btn" style={{ marginTop: 0 }}>
                    <Icon.Weight /> บันทึกวันนี้
                  </Link>
                </div>
                {weightSummaries.length === 0 ? (
                  <div className="ld-trend-empty">ยังไม่มีข้อมูลน้ำหนัก — กด "บันทึกวันนี้" เพื่อเริ่มแทร็ก</div>
                ) : (
                  <>
                    {weightSummaries.map(s => {
                      const isMale = s.baby.gender === 'male' || s.baby.gender === 'ตัวผู้';
                      const isTop = s.baby.id === topGainerId;
                      return (
                        <div key={s.baby.id} className={`ld-wsum-row ${s.delta < 0 ? 'down' : ''} ${isTop ? 'top' : ''}`}>
                          <div className="ld-wsum-photo">
                            {s.baby.image_url ? <img src={s.baby.image_url} alt={s.baby.name} /> : <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{width:18,height:18,objectFit:'contain'}} />}
                          </div>
                          <div className="ld-wsum-info">
                            <div className="ld-wsum-name">
                              {s.baby.name || 'ยังไม่ตั้งชื่อ'}
                              {isTop && <span className="ld-wsum-badge top">🏆 โตไวสุด</span>}
                              {s.delta < 0 && <span className="ld-wsum-badge down">⚠ ควรดูแล</span>}
                            </div>
                            <div className="ld-wsum-range">
                              {s.isNew ? `บันทึกครั้งแรก ${s.latest}g` : `${s.original}g → ${s.latest}g`}
                            </div>
                            {s.delta < 0 && <div className="ld-wsum-note">น้ำหนักลดลง {Math.abs(s.delta)} กรัม — ควรดูแลเรื่องนมหรืออาหารเพิ่มเติม</div>}
                          </div>
                          {!s.isNew && (
                            <div className={`ld-wsum-delta ${s.delta > 0 ? 'up' : s.delta < 0 ? 'down' : 'same'}`}>
                              {s.delta > 0 ? '+' : ''}{s.delta}g
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {noDataBabies.length > 0 && (
                      <div className="ld-nodata-note">ยังไม่มีบันทึกน้ำหนัก: {noDataBabies.map(b => b.name || '?').join(', ')}</div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="ld-sec-head">
              <div className="ld-sec-head-left">
                <h2 className="ld-sec-title">สมาชิกในครอก</h2>
                <span className="ld-sec-count">{babies.length} ตัว</span>
              </div>
              {born && (
                <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/add-baby`} className="ld-add-baby-btn">
                  <Icon.Plus /> เพิ่มสมาชิก
                </Link>
              )}
            </div>

            {babies.length === 0 ? (
              <div className="ld-empty">ยังไม่มีข้อมูลสมาชิกในครอก</div>
            ) : (
              <div className="ld-babies">
                {babies.map((baby) => {
                  const isMale = baby.gender === 'male' || baby.gender === 'ตัวผู้';
                  const displayWeight = latestWeightByPet.get(baby.id) ?? baby.weight;
                  return (
                    <div key={baby.id} className="ld-baby">
                      <Link href={`/pets/${baby.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="ld-baby-photo">
                          {baby.image_url ? <img src={baby.image_url} alt={baby.name} /> : <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{width:36,height:36,objectFit:'contain',opacity:0.45}} />}
                          <span className="ld-baby-weight">{displayWeight ? `${displayWeight}g` : '-'}</span>
                          {/* Photo upload button — overlaps the bottom-right of the photo frame */}
                          <div
                            className={`ld-baby-upload ${uploadingId === baby.id ? 'ld-baby-uploading' : ''}`}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); fileRefs.current[baby.id]?.click(); }}
                          >
                            {uploadingId === baby.id
                              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            }
                          </div>
                        </div>
                      </Link>
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        ref={el => { fileRefs.current[baby.id] = el; }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(baby, f); e.target.value = ''; }}
                      />
                      <Link href={`/pets/${baby.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="ld-baby-name">{baby.name || 'ยังไม่ตั้งชื่อ'}</div>
                        <div className="ld-baby-foot">
                          <span className="ld-baby-status">{baby.status || 'เด็ก'}</span>
                          <span className={`ld-baby-gender ${isMale ? 'm' : 'f'}`} style={{ display:'inline-flex', alignItems:'center', gap:3 }}><img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{width:10,height:10,objectFit:'contain'}} />{isMale ? 'ผู้' : 'เมีย'}</span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}