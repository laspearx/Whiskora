"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  amber: '#D97706', amberSoft: '#FEF3C7', amberBorder: '#FDE68A',
  green: '#16A34A', greenSoft: '#F0FDF4',
  blue: '#2563EB', blueSoft: '#EFF6FF',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export default function BabyDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [babies, setBabies] = useState<any[]>([]);
  const [litters, setLitters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push(`/login?redirect=/farm-dashboard/${farmId}/babies`); return; }
        setUserId(session.user.id);

        const [{ data: babiesData }, { data: littersData }] = await Promise.all([
          supabase.from('pets')
            .select('id, name, image_url, gender, litter_id')
            .eq('farm_id', farmId)
            .in('status', ['เด็ก', 'ยังไม่เปิดจอง', 'เก็บ', 'เปิดจอง', 'พร้อมย้ายบ้าน'])
            .order('id', { ascending: true }),
          supabase.from('litters')
            .select('id, litter_code, status, actual_birth_date, expected_birth_date')
            .eq('farm_id', farmId),
        ]);

        setBabies(babiesData || []);
        setLitters(littersData || []);
      } catch (e) {
        console.error('babies load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [farmId, router]);

  const renderBabyThumb = (baby: any) => {
    const isMale = baby.gender === 'male' || baby.gender === 'ตัวผู้';
    const hasPhoto = !!baby.image_url;
    return (
      <div key={baby.id} className="bd-baby-thumb">
        <div className="bd-baby-photo">
          <Link href={`/pets/${baby.id}`} className="bd-baby-photo-frame">
            {hasPhoto
              ? <img src={baby.image_url} alt={baby.name} />
              : <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            }
          </Link>
          {!hasPhoto && (
            <button
              type="button"
              className={`bd-baby-upload ${uploadingId === baby.id ? 'bd-baby-uploading' : ''}`}
              onClick={() => fileRefs.current[baby.id]?.click()}
              aria-label="อัปโหลดรูป หรือ ถ่ายรูป"
            >
              {uploadingId === baby.id
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              }
            </button>
          )}
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            ref={el => { fileRefs.current[baby.id] = el; }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(baby, f); e.target.value = ''; }}
          />
        </div>
        <Link href={`/pets/${baby.id}`} className="bd-baby-name">{baby.name || '?'}</Link>
      </div>
    );
  };

  const handlePhotoUpload = async (baby: any, file: File) => {
    if (!userId) return;
    setUploadingId(baby.id);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${baby.id}-photo.${ext}`;
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
      await supabase.from('pets').update({ image_url: publicUrl }).eq('id', baby.id);
      setBabies(prev => prev.map(b => b.id === baby.id ? { ...b, image_url: publicUrl } : b));
    } catch (e: any) {
      alert('อัพโหลดไม่สำเร็จ: ' + e.message);
    } finally { setUploadingId(null); }
  };

  if (isLoading) return <PageLoader />;

  const litterMap = new Map((litters || []).map(l => [l.id, l]));
  const grouped: Record<string, any[]> = {};
  const noLitter: any[] = [];

  for (const baby of babies) {
    if (baby.litter_id) {
      if (!grouped[baby.litter_id]) grouped[baby.litter_id] = [];
      grouped[baby.litter_id].push(baby);
    } else {
      noLitter.push(baby);
    }
  }

  const litterIds = Object.keys(grouped);
  const maleCount = babies.filter(b => b.gender === 'male' || b.gender === 'ตัวผู้').length;
  const femaleCount = babies.length - maleCount;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .bd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; }
        .bd-body { max-width: 680px; margin: 0 auto; padding: 24px 20px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .bd-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .bd-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; transition: all .18s; flex-shrink: 0; }
        .bd-back:hover { background: #F9FAFB; color: ${F.ink}; transform: translateX(-1px); }
        .bd-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .bd-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }

        /* Stats row */
        .bd-stats { display: flex; gap: 10px; margin-bottom: 20px; }
        .bd-stat { flex: 1; background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 14px 12px; text-align: center; }
        .bd-stat-icon { display: block; width: 30px; height: 30px; object-fit: contain; margin: 0 auto 6px; }
        .bd-stat-icon-bottle { width: 38px; height: 38px; }
        .bd-stat-val { font-size: 22px; font-weight: 800; line-height: 1; }
        .bd-stat-lbl { font-size: 10px; font-weight: 700; color: ${F.muted}; margin-top: 4px; letter-spacing: 0.04em; }

        /* Litter card */
        .bd-litter { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 18px; margin-bottom: 12px; transition: border-color .15s; }
        .bd-litter:hover { border-color: ${F.amberBorder}; }
        .bd-litter-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .bd-litter-info { display: flex; align-items: center; gap: 10px; }
        .bd-litter-badge { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex-shrink: 0; }
        .bd-litter-badge img { width: 38px; height: 38px; object-fit: contain; }
        .bd-litter-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .bd-litter-date { font-size: 11px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .bd-litter-count { font-size: 11px; font-weight: 700; color: ${F.amber}; background: ${F.amberSoft}; padding: 3px 10px; border-radius: 999px; border: 1px solid ${F.amberBorder}; flex-shrink: 0; }
        .bd-litter-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .bd-btn-detail { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; background: ${F.amberSoft}; color: ${F.amber}; border: 1px solid ${F.amberBorder}; transition: all .15s; }
        .bd-btn-detail:hover { background: #FDE68A; }
        .bd-btn-weight { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; background: ${F.pinkSoft}; color: ${F.pink}; border: 1px solid ${F.pinkBorder}; transition: all .15s; }
        .bd-btn-weight:hover { background: #fbd5e3; }

        /* Baby thumbnail strip */
        .bd-babies { display: grid; grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 10px; }
        .bd-baby-thumb { display: flex; flex-direction: column; align-items: center; gap: 5px; text-decoration: none; }
        .bd-baby-photo { width: 100%; aspect-ratio: 1; position: relative; }
        .bd-baby-photo-frame { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: ${F.bg}; border: 2px solid ${F.line}; display: flex; align-items: center; justify-content: center; font-size: 20px; text-decoration: none; }
        .bd-baby-photo-frame img { width: 100%; height: 100%; object-fit: cover; }
        .bd-baby-name { display: block; font-size: 10px; font-weight: 600; color: ${F.inkSoft}; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-decoration: none; }
        .bd-baby-upload { position: absolute; bottom: -3px; right: -3px; width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,0.97); border: 1.5px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; z-index: 2; padding: 0; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
        .bd-baby-upload:hover { background: ${F.pinkSoft}; }
        .bd-baby-uploading { opacity: 0.5; pointer-events: none; }

        /* No litter section */
        .bd-nolitter { background: white; border: 1px dashed ${F.lineMid}; border-radius: 20px; padding: 18px; margin-bottom: 12px; }
        .bd-nolitter-title { font-size: 13px; font-weight: 700; color: ${F.muted}; margin-bottom: 12px; }

        /* Empty */
        .bd-empty { padding: 48px 24px; text-align: center; background: white; border: 1px dashed ${F.lineMid}; border-radius: 20px; }
        .bd-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .bd-empty-text { font-size: 14px; font-weight: 600; color: ${F.muted}; }
        .bd-empty-sub { font-size: 12px; color: ${F.muted}; margin-top: 4px; }
      `}</style>

      <div className="bd-page">
        <div className="bd-body">
          <div className="bd-top">
            <button className="bd-back" onClick={() => router.back()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="bd-title">เบบี๋ในฟาร์ม</div>
              <div className="bd-sub">{litterIds.length} ครอก · {babies.length} ตัว</div>
            </div>
          </div>

          {/* Stats */}
          {babies.length > 0 && (
            <div className="bd-stats">
              <div className="bd-stat">
                <img className="bd-stat-icon bd-stat-icon-bottle" src="/icons/icon-feeding.png" alt="" />
                <div className="bd-stat-val" style={{ color: F.amber }}>{babies.length}</div>
                <div className="bd-stat-lbl">เบบี๋ทั้งหมด</div>
              </div>
              <div className="bd-stat">
                <img className="bd-stat-icon" src="/icons/icon-men.png" alt="" />
                <div className="bd-stat-val" style={{ color: F.blue }}>{maleCount}</div>
                <div className="bd-stat-lbl">ตัวผู้</div>
              </div>
              <div className="bd-stat">
                <img className="bd-stat-icon" src="/icons/icon-women.png" alt="" />
                <div className="bd-stat-val" style={{ color: F.pink }}>{femaleCount}</div>
                <div className="bd-stat-lbl">ตัวเมีย</div>
              </div>
              <div className="bd-stat">
                <img className="bd-stat-icon" src="/icons/icon-barrier.png" alt="" />
                <div className="bd-stat-val" style={{ color: F.green }}>{litterIds.length}</div>
                <div className="bd-stat-lbl">ครอก</div>
              </div>
            </div>
          )}

          {babies.length === 0 ? (
            <div className="bd-empty">
              <div className="bd-empty-icon"><img src="/icons/icon-paw-pink.png" alt="" style={{width:40,height:40,objectFit:'contain',opacity:0.3}} /></div>
              <div className="bd-empty-text">ยังไม่มีเบบี๋ในฟาร์ม</div>
              <div className="bd-empty-sub">สัตว์ที่มีสถานะ "เด็ก" จะแสดงที่นี่</div>
            </div>
          ) : (
            <>
              {/* Litter groups */}
              {litterIds.map(litId => {
                const litter = litterMap.get(parseInt(litId));
                const kids = grouped[litId];
                const born = litter?.status === 'คลอดแล้ว';
                const dateLabel = born && litter?.actual_birth_date
                  ? `คลอด ${fmtDate(litter.actual_birth_date)}`
                  : litter?.expected_birth_date
                  ? `กำหนด ${fmtDate(litter.expected_birth_date)}`
                  : '';

                return (
                  <div key={litId} className="bd-litter">
                    <div className="bd-litter-head">
                      <div className="bd-litter-info">
                        <div className="bd-litter-badge"><img src="/icons/icon-foster-home.png" alt="" /></div>
                        <div>
                          <div className="bd-litter-title">ครอก {litter?.litter_code || 'ไม่ระบุ'}</div>
                          {dateLabel && <div className="bd-litter-date">{dateLabel}</div>}
                        </div>
                      </div>
                      <span className="bd-litter-count">{kids.length} ตัว</span>
                    </div>

                    {/* Baby thumbnails */}
                    <div className="bd-babies" style={{ marginBottom: 14 }}>
                      {kids.map(baby => renderBabyThumb(baby))}
                    </div>

                    {/* Action buttons */}
                    <div className="bd-litter-btns">
                      <Link href={`/farm-dashboard/${farmId}/litters/${litId}`} className="bd-btn-detail">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        รายละเอียดครอก
                      </Link>
                      {born && (
                        <Link href={`/farm-dashboard/${farmId}/litters/${litId}/weights`} className="bd-btn-weight">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          บันทึกน้ำหนักทั้งครอก
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Babies without litter */}
              {noLitter.length > 0 && (
                <div className="bd-nolitter">
                  <div className="bd-nolitter-title">ไม่ระบุครอก ({noLitter.length} ตัว)</div>
                  <div className="bd-babies">
                    {noLitter.map(baby => renderBabyThumb(baby))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
