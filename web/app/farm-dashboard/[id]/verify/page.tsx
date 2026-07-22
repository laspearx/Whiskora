"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', bg: '#FDF6F8',
  green: '#16A34A', greenSoft: '#F0FDF4',
  amber: '#D97706', amberSoft: '#FFFBEB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const STEPS = [
  { id: 'id_card',    label: 'บัตรประชาชน',       sub: 'ถ่ายด้านหน้า ให้เห็นชื่อและเลขบัตรชัดเจน' },
  { id: 'bank_book',  label: 'สมุดบัญชีธนาคาร',   sub: 'ถ่ายหน้าแรก ชื่อต้องตรงกับบัตร' },
  { id: 'farm_photos',label: 'รูปถ่ายฟาร์ม',       sub: 'อย่างน้อย 2 รูป แสดงพื้นที่เลี้ยงจริง' },
  { id: 'house_reg',  label: 'ทะเบียนบ้าน',        sub: 'หน้าแรกที่มีชื่อเจ้าบ้าน' },
];

interface Uploads {
  id_card_front: File | null;
  bank_book: File | null;
  farm_photos: File[];
  house_reg: File | null;
}

export default function VerifyFarmPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [farm, setFarm] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [existingKyc, setExistingKyc] = useState<{ id_card_front_url: string | null; bank_book_url: string | null; house_registration_url: string | null } | null>(null);
  const [uploads, setUploads] = useState<Uploads>({
    id_card_front: null,
    bank_book: null, farm_photos: [], house_reg: null,
  });
  const [previews, setPreviews] = useState<Record<string, string | string[]>>({});
  const [activeStep, setActiveStep] = useState(0);

  const refs = {
    id_card_front: useRef<HTMLInputElement>(null),
    bank_book:     useRef<HTMLInputElement>(null),
    farm_photos:   useRef<HTMLInputElement>(null),
    house_reg:     useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);

      const { data: farmData } = await supabase.from('farms').select('*').eq('id', farmId).eq('user_id', session.user.id).single();
      if (!farmData) { router.push('/partner'); return; }
      if (farmData.is_verified) { router.push(`/farm-dashboard/${farmId}`); return; }
      if (farmData.verification_status === 'pending') { router.push(`/farm-dashboard/${farmId}`); return; }

      setFarm(farmData);
      setPhone(farmData.phone || '');

      // ตรวจว่าเคยยืนยัน KYC ไว้แล้วจากธุรกิจอื่น
      const { data: kycData } = await supabase
        .from('farm_verifications')
        .select('id_card_front_url,bank_book_url,house_registration_url')
        .eq('user_id', session.user.id)
        .not('id_card_front_url', 'is', null)
        .neq('farm_id', parseInt(farmId))
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (kycData?.id_card_front_url) setExistingKyc(kycData);

      setLoading(false);
    };
    load();
  }, [farmId, router]);

  const setFile = (key: keyof Uploads, file: File | null) => {
    setUploads(u => ({ ...u, [key]: file }));
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviews(p => ({ ...p, [key]: url }));
  };

  const addFarmPhoto = (file: File) => {
    setUploads(u => ({ ...u, farm_photos: [...u.farm_photos, file] }));
    const url = URL.createObjectURL(file);
    setPreviews(p => ({ ...p, farm_photos: [...((p.farm_photos as string[]) || []), url] }));
  };

  const removeFarmPhoto = (idx: number) => {
    setUploads(u => ({ ...u, farm_photos: u.farm_photos.filter((_, i) => i !== idx) }));
    setPreviews(p => ({ ...p, farm_photos: (p.farm_photos as string[]).filter((_, i) => i !== idx) }));
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('verification-docs').upload(path, file, { upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('verification-docs').getPublicUrl(data.path);
    return publicUrl;
  };

  const isStepDone = (stepId: string) => {
    if (stepId === 'id_card')     return !!uploads.id_card_front || !!existingKyc?.id_card_front_url;
    if (stepId === 'bank_book')   return !!uploads.bank_book    || !!existingKyc?.bank_book_url;
    if (stepId === 'farm_photos') return uploads.farm_photos.length >= 2;
    if (stepId === 'house_reg')   return !!uploads.house_reg    || !!existingKyc?.house_registration_url;
    return false;
  };
  const allDone = STEPS.every(s => isStepDone(s.id));

  const handleSubmit = async () => {
    if (!userId || !farm) return;
    if (!allDone) { alert('กรุณาอัพโหลดเอกสารให้ครบทุกส่วน'); return; }
    setSubmitting(true);
    try {
      const base = `${userId}/${farmId}`;
      const [frontUrl, bankUrl, houseUrl] = await Promise.all([
        uploads.id_card_front
          ? uploadFile(uploads.id_card_front, `${base}/id_card_front.${uploads.id_card_front.name.split('.').pop()}`)
          : Promise.resolve(existingKyc?.id_card_front_url ?? null),
        uploads.bank_book
          ? uploadFile(uploads.bank_book, `${base}/bank_book.${uploads.bank_book.name.split('.').pop()}`)
          : Promise.resolve(existingKyc?.bank_book_url ?? null),
        uploads.house_reg
          ? uploadFile(uploads.house_reg, `${base}/house_reg.${uploads.house_reg.name.split('.').pop()}`)
          : Promise.resolve(existingKyc?.house_registration_url ?? null),
      ]);

      const farmPhotoUrls: string[] = [];
      for (let i = 0; i < uploads.farm_photos.length; i++) {
        const f = uploads.farm_photos[i];
        const url = await uploadFile(f, `${base}/farm_photo_${i}.${f.name.split('.').pop()}`);
        if (url) farmPhotoUrls.push(url);
      }

      await supabase.from('farm_verifications').insert({
        farm_id: parseInt(farmId),
        user_id: userId,
        id_card_front_url: frontUrl,
        bank_book_url: bankUrl,
        farm_photo_urls: farmPhotoUrls,
        house_registration_url: houseUrl,
        phone,
        status: 'pending',
      });

      await supabase.from('farms').update({ verification_status: 'pending' }).eq('id', farmId);

      router.push(`/farm-dashboard/${farmId}?verified=pending`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .vf-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; overflow-x: clip; }
        .vf-body { max-width: 560px; margin: 0 auto; padding: 0 0 32px; }

        /* Top bar */
        .vf-topbar { display: flex; align-items: center; gap: 12px; padding: 16px 20px 12px; background: ${F.bg}; border-bottom: 1px solid ${F.line}; position: sticky; top: 0; z-index: 10; }
        .vf-back { width: 38px; height: 38px; border-radius: 11px; background: ${F.line}; color: ${F.ink}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .vf-title { font-size: 17px; font-weight: 700; color: ${F.ink}; }
        .vf-sub { font-size: 12px; color: ${F.muted}; font-weight: 400; }

        /* Hero */
        .vf-hero { padding: 20px 20px 16px; }
        .vf-hero-card { background: white; border-radius: 18px; padding: 20px; border: 1px solid ${F.line}; display: flex; gap: 14px; align-items: flex-start; }
        .vf-hero-icon { width: 52px; height: 52px; flex-shrink: 0; }
        .vf-hero-title { font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 4px; }
        .vf-hero-desc { font-size: 12px; color: ${F.inkSoft}; font-weight: 400; line-height: 1.6; }

        /* Steps */
        .vf-steps { padding: 0 20px; display: flex; flex-direction: column; gap: 12px; }
        .vf-step { background: white; border: 1.5px solid ${F.lineMid}; border-radius: 16px; overflow: hidden; transition: border-color .15s; }
        .vf-step.done { border-color: ${F.green}; }
        .vf-step.active { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .vf-step-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; }
        .vf-step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .vf-step-info { flex: 1; }
        .vf-step-label { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .vf-step-sub { font-size: 11px; color: ${F.muted}; font-weight: 400; margin-top: 1px; }
        .vf-step-body { padding: 0 16px 16px; }

        /* Upload zone */
        .vf-upload-zone { border: 2px dashed ${F.lineMid}; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all .15s; background: #FAFAFA; }
        .vf-upload-zone:hover { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .vf-upload-zone-icon { color: ${F.muted}; margin-bottom: 6px; }
        .vf-upload-zone-text { font-size: 13px; font-weight: 600; color: ${F.inkSoft}; }
        .vf-upload-zone-sub { font-size: 11px; color: ${F.muted}; margin-top: 2px; }

        /* Preview */
        .vf-preview { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 4/3; background: ${F.line}; }
        .vf-preview img { width: 100%; height: 100%; object-fit: cover; }
        .vf-preview-remove { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,.55); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .vf-photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }

        /* Phone */
        .vf-input { width: 100%; padding: 11px 14px; border: 1.5px solid ${F.lineMid}; border-radius: 11px; font-size: 15px; font-weight: 500; color: ${F.ink}; outline: none; font-family: inherit; background: white; }
        .vf-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }

        /* Save bar */
        .vf-actions { display: flex; gap: 12px; margin-top: 24px; padding: 0 20px; }
        .vf-cancel-btn { flex: 0 0 auto; padding: 15px 22px; background: white; color: #4B5563; border: 1.5px solid #E5E7EB; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .vf-cancel-btn:hover { background: #F9FAFB; }
        .vf-submit-btn { flex: 1; padding: 15px; border-radius: 14px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .18s; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,.3); }
        .vf-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .vf-submit-btn.not-ready { background: ${F.lineMid}; color: ${F.muted}; box-shadow: none; }
        .vf-reuse-badge { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: ${F.greenSoft}; border: 1px solid #BBF7D0; border-radius: 10px; font-size: 12px; font-weight: 600; color: ${F.green}; }
      `}</style>

      <div className="vf-page">
        <div className="vf-body">

          {/* Top bar */}
          <div className="vf-topbar">
            <button className="vf-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
            <div>
              <div className="vf-title">ยืนยันตัวตนฟาร์ม</div>
              <div className="vf-sub">{farm.farm_name}</div>
            </div>
          </div>

          {/* Hero */}
          <div className="vf-hero">
            <div className="vf-hero-card">
              <img className="vf-hero-icon" src="/icons/icon-non-verified.png" alt="" />
              <div>
                <div className="vf-hero-title">รับป้าย Whiskora Verified</div>
                <div className="vf-hero-desc">
                  อัพโหลดเอกสารยืนยันตัวตน 4 รายการ แอดมินจะตรวจสอบภายใน 1-3 วันทำการ
                  เมื่ออนุมัติฟาร์มของคุณจะได้รับป้ายสีชมพู เพิ่มความน่าเชื่อถือให้ผู้ซื้อ
                </div>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="vf-steps" style={{ marginBottom: 12 }}>
            <div className="vf-step" style={{ borderColor: phone ? F.green : F.lineMid }}>
              <div className="vf-step-head" onClick={() => setActiveStep(activeStep === -1 ? -1 : -1)}>
                <div className="vf-step-num" style={{ background: phone ? F.greenSoft : F.line, color: phone ? F.green : F.muted }}>
                  {phone ? <Icon.Check /> : '0'}
                </div>
                <div className="vf-step-info">
                  <div className="vf-step-label">เบอร์โทรศัพท์</div>
                  <div className="vf-step-sub">สำหรับให้แอดมินติดต่อกลับ</div>
                </div>
              </div>
              <div className="vf-step-body">
                <input
                  className="vf-input"
                  type="tel"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Document steps */}
          <div className="vf-steps">
            {STEPS.map((step, idx) => {
              const done = isStepDone(step.id);
              const open = activeStep === idx;
              return (
                <div key={step.id} className={`vf-step ${done ? 'done' : ''} ${open ? 'active' : ''}`}>
                  <div className="vf-step-head" onClick={() => setActiveStep(open ? -1 : idx)}>
                    <div className="vf-step-num" style={{ background: done ? F.greenSoft : open ? F.pinkSoft : F.line, color: done ? F.green : open ? F.pink : F.muted }}>
                      {done ? <Icon.Check /> : idx + 1}
                    </div>
                    <div className="vf-step-info">
                      <div className="vf-step-label">{step.label}</div>
                      <div className="vf-step-sub">{step.sub}</div>
                    </div>
                  </div>

                  {open && (
                    <div className="vf-step-body">
                      {step.id === 'id_card' && (
                        <>
                          {existingKyc?.id_card_front_url && !uploads.id_card_front ? (
                            <div className="vf-reuse-badge">
                              <Icon.Check />
                              ใช้เอกสารที่ยืนยันไว้แล้ว
                              <button onClick={() => refs.id_card_front.current?.click()} style={{ marginLeft: 'auto', fontSize: 11, color: F.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>อัปโหลดใหม่</button>
                            </div>
                          ) : (previews.id_card_front as string) ? (
                            <div className="vf-preview">
                              <img src={previews.id_card_front as string} alt="" />
                              <button className="vf-preview-remove" onClick={() => setFile('id_card_front', null)}><Icon.X /></button>
                            </div>
                          ) : (
                            <div className="vf-upload-zone" onClick={() => refs.id_card_front.current?.click()}>
                              <div className="vf-upload-zone-icon"><Icon.Camera /></div>
                              <div className="vf-upload-zone-text">ถ่ายรูปด้านหน้าบัตรประชาชน</div>
                              <div className="vf-upload-zone-sub">ให้เห็นชื่อและเลขบัตรชัดเจน</div>
                            </div>
                          )}
                          <input ref={refs.id_card_front} type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => setFile('id_card_front', e.target.files?.[0] || null)} />
                        </>
                      )}

                      {step.id === 'bank_book' && (
                        <>
                          {existingKyc?.bank_book_url && !uploads.bank_book ? (
                            <div className="vf-reuse-badge">
                              <Icon.Check />
                              ใช้เอกสารที่ยืนยันไว้แล้ว
                              <button onClick={() => refs.bank_book.current?.click()} style={{ marginLeft: 'auto', fontSize: 11, color: F.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>อัปโหลดใหม่</button>
                            </div>
                          ) : (previews.bank_book as string) ? (
                            <div className="vf-preview">
                              <img src={previews.bank_book as string} alt="" />
                              <button className="vf-preview-remove" onClick={() => setFile('bank_book', null)}><Icon.X /></button>
                            </div>
                          ) : (
                            <div className="vf-upload-zone" onClick={() => refs.bank_book.current?.click()}>
                              <div className="vf-upload-zone-icon"><Icon.Camera /></div>
                              <div className="vf-upload-zone-text">ถ่ายรูปหน้าแรกสมุดบัญชี</div>
                              <div className="vf-upload-zone-sub">ชื่อต้องตรงกับบัตรประชาชน</div>
                            </div>
                          )}
                          <input ref={refs.bank_book} type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => setFile('bank_book', e.target.files?.[0] || null)} />
                        </>
                      )}

                      {step.id === 'farm_photos' && (
                        <>
                          {(previews.farm_photos as string[])?.length > 0 && (
                            <div className="vf-photo-grid">
                              {(previews.farm_photos as string[]).map((url, i) => (
                                <div key={i} className="vf-preview">
                                  <img src={url} alt="" />
                                  <button className="vf-preview-remove" onClick={() => removeFarmPhoto(i)}><Icon.X /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          {uploads.farm_photos.length < 5 && (
                            <div className="vf-upload-zone" onClick={() => refs.farm_photos.current?.click()}>
                              <div className="vf-upload-zone-icon"><Icon.Camera /></div>
                              <div className="vf-upload-zone-text">
                                {uploads.farm_photos.length === 0 ? 'เพิ่มรูปฟาร์ม (ขั้นต่ำ 2 รูป)' : `เพิ่มรูปอีก (${uploads.farm_photos.length}/5)`}
                              </div>
                            </div>
                          )}
                          <input ref={refs.farm_photos} type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) { addFarmPhoto(f); e.target.value = ''; } }} />
                        </>
                      )}

                      {step.id === 'house_reg' && (
                        <>
                          {existingKyc?.house_registration_url && !uploads.house_reg ? (
                            <div className="vf-reuse-badge">
                              <Icon.Check />
                              ใช้เอกสารที่ยืนยันไว้แล้ว
                              <button onClick={() => refs.house_reg.current?.click()} style={{ marginLeft: 'auto', fontSize: 11, color: F.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>อัปโหลดใหม่</button>
                            </div>
                          ) : (previews.house_reg as string) ? (
                            <div className="vf-preview">
                              <img src={previews.house_reg as string} alt="" />
                              <button className="vf-preview-remove" onClick={() => setFile('house_reg', null)}><Icon.X /></button>
                            </div>
                          ) : (
                            <div className="vf-upload-zone" onClick={() => refs.house_reg.current?.click()}>
                              <div className="vf-upload-zone-icon"><Icon.Camera /></div>
                              <div className="vf-upload-zone-text">ถ่ายรูปทะเบียนบ้านหน้าแรก</div>
                            </div>
                          )}
                          <input ref={refs.house_reg} type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => setFile('house_reg', e.target.files?.[0] || null)} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="vf-actions">
            <button type="button" className="vf-cancel-btn" onClick={() => router.back()}>ยกเลิก</button>
            <button
              className={`vf-submit-btn ${!allDone ? 'not-ready' : ''}`}
              onClick={handleSubmit}
              disabled={submitting || !allDone}
            >
              {submitting ? 'กำลังส่งคำขอ...' : allDone ? 'ส่งคำขอยืนยันตัวตน' : `อัพโหลดเอกสารให้ครบ (${STEPS.filter(s => isStepDone(s.id)).length + (phone ? 1 : 0)}/${STEPS.length + 1})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
