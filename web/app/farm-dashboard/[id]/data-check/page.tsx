"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { PET_STATUS } from '@/lib/constants';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  amber: '#D97706', amberSoft: '#FEF3C7', amberBorder: '#FDE68A',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

export default function DataCheckPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const focus = searchParams.get('focus');

  const [pets, setPets] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);

  const [birthDrafts, setBirthDrafts] = useState<Record<number, string>>({});
  const [savingBirthId, setSavingBirthId] = useState<number | null>(null);

  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingPhotoId, setUploadingPhotoId] = useState<number | null>(null);
  const [cropPet, setCropPet] = useState<any | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const statusSectionRef = useRef<HTMLDivElement>(null);
  const photoSectionRef = useRef<HTMLDivElement>(null);
  const birthSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=/farm-dashboard/${farmId}/data-check`); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('pets')
        .select('id, name, image_url, status, birth_date, gender, species')
        .eq('farm_id', farmId)
        .order('id', { ascending: true });
      setPets(data || []);
      setIsLoading(false);
    };
    load();
  }, [farmId, router]);

  useEffect(() => {
    if (isLoading || !focus) return;
    const ref = focus === 'status' ? statusSectionRef : focus === 'photo' ? photoSectionRef : focus === 'birth' ? birthSectionRef : null;
    if (ref?.current) setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [isLoading, focus]);

  const noStatus = pets.filter(p => !p.status);
  const noPhoto = pets.filter(p => !p.image_url);
  const noBirth = pets.filter(p => !p.birth_date);
  const totalMissing = noStatus.length + noPhoto.length + noBirth.length;

  const saveStatus = async (pet: any) => {
    const val = statusDrafts[pet.id];
    if (!val) return;
    setSavingStatusId(pet.id);
    try {
      const { error } = await supabase.from('pets').update({ status: val }).eq('id', pet.id);
      if (error) throw error;
      setPets(prev => prev.map(p => p.id === pet.id ? { ...p, status: val } : p));
    } catch (e: any) {
      alert('บันทึกไม่สำเร็จ: ' + e.message);
    } finally { setSavingStatusId(null); }
  };

  const saveBirth = async (pet: any) => {
    const val = birthDrafts[pet.id];
    if (!val) return;
    setSavingBirthId(pet.id);
    try {
      const { error } = await supabase.from('pets').update({ birth_date: val }).eq('id', pet.id);
      if (error) throw error;
      setPets(prev => prev.map(p => p.id === pet.id ? { ...p, birth_date: val } : p));
    } catch (e: any) {
      alert('บันทึกไม่สำเร็จ: ' + e.message);
    } finally { setSavingBirthId(null); }
  };

  const startPhotoCrop = (pet: any, file: File) => {
    const reader = new FileReader();
    reader.onload = () => { setCropPet(pet); setCropSrc(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const cancelPhotoCrop = () => {
    setCropPet(null); setCropSrc(null); setCrop({ x: 0, y: 0 }); setZoom(1);
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => setCroppedAreaPixels(pixels), []);

  const getCroppedBlob = (src: string, pixelCrop: any): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no ctx')); return; }
        ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas empty'))), 'image/jpeg', 0.9);
      };
      img.src = src;
    });

  const confirmPhotoCrop = async () => {
    if (!userId || !cropPet || !cropSrc || !croppedAreaPixels) return;
    setUploadingPhotoId(cropPet.id);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const path = `${userId}/${cropPet.id}-photo-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, blob, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('pets').update({ image_url: url }).eq('id', cropPet.id);
      setPets(prev => prev.map(p => p.id === cropPet.id ? { ...p, image_url: url } : p));
      cancelPhotoCrop();
    } catch (e: any) {
      alert('อัพโหลดไม่สำเร็จ: ' + e.message);
    } finally { setUploadingPhotoId(null); }
  };

  if (isLoading) return <PageLoader />;

  const renderThumb = (pet: any) => {
    const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
    return pet.image_url
      ? <img src={pet.image_url} alt={pet.name} />
      : <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />;
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .dc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; }
        .dc-body { max-width: 680px; margin: 0 auto; padding: 24px 20px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .dc-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .dc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; transition: all .18s; flex-shrink: 0; }
        .dc-back:hover { background: #F9FAFB; color: ${F.ink}; transform: translateX(-1px); }
        .dc-title { font-size: 20px; font-weight: 700; color: ${F.ink}; }
        .dc-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }

        .dc-empty { background: white; border: 1px dashed ${F.lineMid}; border-radius: 20px; padding: 40px 24px; text-align: center; }
        .dc-empty img { width: 40px; height: 40px; object-fit: contain; margin-bottom: 12px; }
        .dc-empty-text { font-size: 14px; font-weight: 700; color: ${F.ink}; }

        .dc-sec { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 16px; margin-bottom: 14px; scroll-margin-top: 16px; }
        .dc-sec-title { font-size: 13px; font-weight: 700; color: ${F.ink}; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid ${F.line}; }

        .dc-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${F.line}; flex-wrap: wrap; }
        .dc-row:last-child { border-bottom: none; padding-bottom: 0; }

        .dc-thumb { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: ${F.bg}; border: 2px solid ${F.line}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dc-thumb img { width: 100%; height: 100%; object-fit: cover; }

        .dc-thumb-wrap { position: relative; flex-shrink: 0; }
        .dc-cam-btn { position: absolute; bottom: -3px; right: -3px; width: 22px; height: 22px; border-radius: 50%; background: ${F.pink}; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; padding: 0; box-shadow: 0 1px 4px rgba(0,0,0,.15); }
        .dc-cam-btn:hover { background: #D63F6A; }

        .dc-name { font-size: 13px; font-weight: 600; color: ${F.ink}; flex: 1; min-width: 80px; }
        .dc-hint { font-size: 11px; color: ${F.muted}; flex-basis: 100%; margin-top: -4px; margin-left: 50px; }

        .dc-select { padding: 7px 10px; border-radius: 10px; border: 1.5px solid ${F.lineMid}; background: white; font-family: inherit; font-size: 12px; color: ${F.ink}; outline: none; }
        .dc-select:focus { border-color: ${F.pink}; }
        .dc-date { padding: 7px 10px; border-radius: 10px; border: 1.5px solid ${F.lineMid}; background: white; font-family: inherit; font-size: 12px; color: ${F.ink}; outline: none; }
        .dc-date:focus { border-color: ${F.pink}; }

        .dc-save-btn { padding: 7px 14px; border-radius: 10px; border: none; background: ${F.pink}; color: white; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity .15s; }
        .dc-save-btn:disabled { opacity: .4; cursor: not-allowed; }
        .dc-save-btn:not(:disabled):hover { background: #D63F6A; }
      `}</style>

      <div className="dc-page">
        <div className="dc-body">
          <div className="dc-top">
            <button className="dc-back" onClick={() => router.back()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="dc-title">ข้อมูลสัตว์ที่ยังไม่ครบ</div>
              <div className="dc-sub">{totalMissing > 0 ? `${totalMissing} รายการต้องอัปเดต` : 'ข้อมูลครบถ้วนแล้ว'}</div>
            </div>
          </div>

          {totalMissing === 0 ? (
            <div className="dc-empty">
              <img src="/icons/icon-verified.png" alt="" />
              <div className="dc-empty-text">ข้อมูลสัตว์ในฟาร์มครบถ้วนแล้ว</div>
            </div>
          ) : (
            <>
              {noStatus.length > 0 && (
                <div ref={statusSectionRef} className="dc-sec">
                  <div className="dc-sec-title">ยังไม่ใส่สถานะในฟาร์ม ({noStatus.length})</div>
                  {noStatus.map(pet => (
                    <div key={pet.id} className="dc-row">
                      <div className="dc-thumb">{renderThumb(pet)}</div>
                      <Link href={`/pets/${pet.id}`} className="dc-name" style={{ textDecoration: 'none' }}>{pet.name || '?'}</Link>
                      <select
                        className="dc-select"
                        value={statusDrafts[pet.id] ?? ''}
                        onChange={e => setStatusDrafts(d => ({ ...d, [pet.id]: e.target.value }))}
                      >
                        <option value="">เลือกสถานะ</option>
                        <option value={PET_STATUS.KID}>เด็ก</option>
                        <option value={PET_STATUS.BREEDER}>พ่อพันธุ์ / แม่พันธุ์</option>
                        <option value={PET_STATUS.AVAILABLE}>พร้อมย้ายบ้าน</option>
                        <option value={PET_STATUS.OPEN_RESERVE}>เปิดจอง</option>
                        <option value={PET_STATUS.RESERVED}>ติดจอง</option>
                        <option value={PET_STATUS.RETIRED}>ทำหมัน / ปลดระวาง</option>
                      </select>
                      <button
                        className="dc-save-btn"
                        disabled={!statusDrafts[pet.id] || savingStatusId === pet.id}
                        onClick={() => saveStatus(pet)}
                      >
                        {savingStatusId === pet.id ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {noPhoto.length > 0 && (
                <div ref={photoSectionRef} className="dc-sec">
                  <div className="dc-sec-title">ยังไม่มีรูปภาพ ({noPhoto.length})</div>
                  {noPhoto.map(pet => (
                    <div key={pet.id} className="dc-row">
                      <div className="dc-thumb-wrap">
                        <div className="dc-thumb">{renderThumb(pet)}</div>
                        <button
                          type="button"
                          className="dc-cam-btn"
                          onClick={() => fileRefs.current[pet.id]?.click()}
                          aria-label="อัปโหลดรูป หรือ ถ่ายรูป"
                        >
                          {uploadingPhotoId === pet.id
                            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          }
                        </button>
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          ref={el => { fileRefs.current[pet.id] = el; }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) startPhotoCrop(pet, f); e.target.value = ''; }}
                        />
                      </div>
                      <Link href={`/pets/${pet.id}`} className="dc-name" style={{ textDecoration: 'none' }}>{pet.name || '?'}</Link>
                      <span className="dc-hint">แตะไอคอนกล้องเพื่อถ่ายรูป อัปโหลด หรือเลือกไฟล์</span>
                    </div>
                  ))}
                </div>
              )}

              {noBirth.length > 0 && (
                <div ref={birthSectionRef} className="dc-sec">
                  <div className="dc-sec-title">ยังไม่มีวันเกิด ({noBirth.length})</div>
                  {noBirth.map(pet => (
                    <div key={pet.id} className="dc-row">
                      <div className="dc-thumb">{renderThumb(pet)}</div>
                      <Link href={`/pets/${pet.id}`} className="dc-name" style={{ textDecoration: 'none' }}>{pet.name || '?'}</Link>
                      <input
                        type="date"
                        className="dc-date"
                        value={birthDrafts[pet.id] ?? ''}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setBirthDrafts(d => ({ ...d, [pet.id]: e.target.value }))}
                      />
                      <button
                        className="dc-save-btn"
                        disabled={!birthDrafts[pet.id] || savingBirthId === pet.id}
                        onClick={() => saveBirth(pet)}
                      >
                        {savingBirthId === pet.id ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {cropSrc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', padding: 16 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', height: 300, background: '#111' }}>
              <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div style={{ padding: '20px 20px 24px' }}>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={e => setZoom(Number(e.target.value))} style={{ width: '100%', accentColor: F.pink, marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={cancelPhotoCrop} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${F.lineMid}`, background: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: F.inkSoft, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="button" onClick={confirmPhotoCrop} disabled={uploadingPhotoId === cropPet?.id} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: F.ink, color: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: uploadingPhotoId === cropPet?.id ? .6 : 1 }}>{uploadingPhotoId === cropPet?.id ? 'กำลังอัปโหลด...' : 'ยืนยัน'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
