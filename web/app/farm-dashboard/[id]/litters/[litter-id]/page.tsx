"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', green: '#16A34A', orange: '#F97316',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
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
  const [isLoading, setIsLoading] = useState(true);

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
        if (babiesData) setBabies(babiesData);
      } catch (error) {
        console.error('Error:', error);
        router.push(`/farm-dashboard/${farmId}`);
      } finally { setIsLoading(false); }
    };
    if (litterId) fetchLitterDetails();
  }, [litterId, farmId, router]);

  const born = litter?.status === 'คลอดแล้ว';

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .ld-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ld-body { max-width: 680px; margin: 0 auto; padding: 24px 20px 80px; }
        .ld-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .ld-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .ld-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ld-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; }
        .ld-title .code { color: ${F.pink}; }
        /* status card */
        .ld-status { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
        .ld-status-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; border: 3px solid; }
        .ld-status-info { flex: 1; min-width: 160px; }
        .ld-status-badge { display: inline-block; padding: 3px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; margin-bottom: 6px; }
        .ld-status-dates { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; font-weight: 600; color: ${F.muted}; }
        .ld-birth-btn { background: ${F.pink}; color: white; padding: 11px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all .15s; white-space: nowrap; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .ld-birth-btn:hover { background: #D63F6A; }
        /* parents */
        .ld-parents { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 22px; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; gap: 18px; }
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
        /* babies */
        .ld-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .ld-sec-title { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .ld-sec-count { font-size: 11px; font-weight: 700; color: ${F.muted}; background: ${F.line}; padding: 4px 11px; border-radius: 999px; }
        .ld-empty { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 32px; text-align: center; font-size: 13px; font-weight: 600; color: ${F.muted}; }
        .ld-babies { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
        .ld-baby { background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 8px; text-decoration: none; transition: all .15s; display: flex; flex-direction: column; }
        .ld-baby:hover { border-color: ${F.pinkBorder}; }
        .ld-baby-photo { aspect-ratio: 1; border-radius: 11px; overflow: hidden; background: ${F.bg}; position: relative; margin-bottom: 7px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
        .ld-baby-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ld-baby-weight { position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,0.92); border-radius: 6px; padding: 1px 5px; font-size: 9px; font-weight: 700; color: ${F.inkSoft}; }
        .ld-baby-name { font-family: inherit; font-size: 12px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px; }
        .ld-baby-foot { display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-top: auto; }
        .ld-baby-gender { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 5px; }
        .ld-baby-gender.m { background: #EFF6FF; color: ${F.blue}; }
        .ld-baby-gender.f { background: ${F.pinkSoft}; color: ${F.pink}; }
        .ld-baby-status { font-size: 9px; font-weight: 600; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>

      {isLoading || !litter ? (
        <PageLoader />
      ) : (
        <div className="ld-page">
          <div className="ld-body">
            <div className="ld-top">
              <button className="ld-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <h1 className="ld-title">🐾 ครอก <span className="code">{litter.litter_code || 'ไม่ระบุ'}</span></h1>
            </div>

            <div className="ld-status">
              <div className="ld-status-icon" style={born ? { background: '#F0FDF4', borderColor: '#BBF7D0', color: F.green } : { background: '#FFF7ED', borderColor: '#FED7AA', color: F.orange }}>
                {born ? '🎉' : '⏳'}
              </div>
              <div className="ld-status-info">
                <span className="ld-status-badge" style={born ? { background: '#F0FDF4', color: F.green, borderColor: '#BBF7D0' } : { background: '#FFF7ED', color: F.orange, borderColor: '#FED7AA' }}>
                  สถานะ: {litter.status}
                </span>
                <div className="ld-status-dates">
                  <span>ทับ: {fmtDate(litter.mating_date)}</span>
                  <span style={{ color: born ? F.green : F.pink }}>
                    {born && litter.actual_birth_date ? `คลอด: ${fmtDate(litter.actual_birth_date)}` : `กำหนด: ${fmtDate(litter.expected_birth_date)}`}
                  </span>
                </div>
              </div>
              {litter.status === 'รอคลอด' && (
                <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/birth`} className="ld-birth-btn">บันทึกการคลอด</Link>
              )}
            </div>

            <div className="ld-parents">
              <Link href={`/pets/${sire?.id}`} className="ld-parent sire">
                <div className="ld-parent-photo">{sire?.image_url ? <img src={sire.image_url} alt={sire.name} /> : '♂'}</div>
                <span className="ld-parent-name">{sire?.name || 'ไม่ระบุ'}</span>
                <span className="ld-parent-role">SIRE</span>
              </Link>
              <span className="ld-heart"><Icon.Heart /></span>
              <Link href={`/pets/${dam?.id}`} className="ld-parent dam">
                <div className="ld-parent-photo">{dam?.image_url ? <img src={dam.image_url} alt={dam.name} /> : '♀'}</div>
                <span className="ld-parent-name">{dam?.name || 'ไม่ระบุ'}</span>
                <span className="ld-parent-role">DAM</span>
              </Link>
            </div>

            <div className="ld-sec-head">
              <h2 className="ld-sec-title">🍼 สมาชิกในครอก</h2>
              <span className="ld-sec-count">{babies.length} ตัว</span>
            </div>

            {babies.length === 0 ? (
              <div className="ld-empty">ยังไม่มีข้อมูลสมาชิกในครอก</div>
            ) : (
              <div className="ld-babies">
                {babies.map((baby) => {
                  const isMale = baby.gender === 'male' || baby.gender === 'ตัวผู้';
                  return (
                    <Link key={baby.id} href={`/pets/${baby.id}`} className="ld-baby">
                      <div className="ld-baby-photo">
                        {baby.image_url ? <img src={baby.image_url} alt={baby.name} /> : '🐾'}
                        <span className="ld-baby-weight">{baby.weight ? `${baby.weight}g` : '-'}</span>
                      </div>
                      <div className="ld-baby-name">{baby.name || 'ยังไม่ตั้งชื่อ'}</div>
                      <div className="ld-baby-foot">
                        <span className={`ld-baby-gender ${isMale ? 'm' : 'f'}`}>{isMale ? '♂ ผู้' : '♀ เมีย'}</span>
                        <span className="ld-baby-status">{baby.status || 'เด็ก'}</span>
                      </div>
                    </Link>
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