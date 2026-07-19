"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OTHER_SPECIES } from '@/lib/species';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const OTHER_PETS = OTHER_SPECIES;

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};

export default function RegisterFarmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [form, setForm] = useState({
    farmName: '', species: '', subSpecies: '', customSpecies: '', phone: '', bio: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent('/partner/register-farm')}`); return; }
      const ext = file.name.split('.').pop();
      const filePath = `farms/${session.user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('partner-photos').upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('partner-photos').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (err: any) {
      alert('อัปโหลดรูปไม่สำเร็จ: ' + (err.message || ''));
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.species) return alert('กรุณาเลือกชนิดสัตว์ที่เพาะพันธุ์หลักด้วยครับ');

    let finalSpecies = form.species;
    if (form.species === 'other') {
      if (!form.subSpecies) return alert('กรุณาเลือกชนิดสัตว์ด้วยครับ');
      finalSpecies = form.subSpecies === 'other' ? form.customSpecies.trim() : form.subSpecies;
      if (form.subSpecies === 'other' && !form.customSpecies.trim()) return alert('กรุณาระบุชื่อสัตว์ด้วยครับ');
    } else if (form.species === 'cat') finalSpecies = 'cat';
    else if (form.species === 'dog') finalSpecies = 'dog';

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent('/partner/register-farm')}`); return; }
      const { data: farmData, error } = await supabase.from('farms').insert([{
        user_id: session.user.id,
        farm_name: form.farmName,
        species: finalSpecies,
        phone: form.phone,
        bio: form.bio,
        image_url: imageUrl || null,
      }]).select('id').single();
      if (error) throw error;

      // Create workspace for this farm
      const { data: wsData } = await supabase.from('workspaces').insert({
        type: 'farm',
        name: form.farmName,
        owner_id: session.user.id,
        entity_id: farmData.id,
        avatar_url: imageUrl || null,
      }).select('id').single();
      if (wsData) {
        await supabase.from('workspace_members').insert({
          workspace_id: wsData.id,
          user_id: session.user.id,
          role: 'owner',
        });
      }

      alert('🎉 ยินดีด้วย! เปิดฟาร์มใหม่เรียบร้อยแล้ว');
      router.push('/partner');
      router.refresh();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message || err.details}`);
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pf-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .pf-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .pf-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .pf-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .pf-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .pf-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .pf-sub { font-size: 12px; font-weight: 600; color: ${F.pink}; margin-top: 2px; }
        .pf-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
        .pf-photo { position: relative; }
        .pf-photo-box { width: 110px; height: 110px; border-radius: 24px; overflow: hidden; background: ${F.pinkSoft}; border: 2px dashed ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; color: ${F.pink}; }
        .pf-photo-box.has-img { border-style: solid; }
        .pf-photo-box:hover { border-color: ${F.pink}; }
        .pf-photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .pf-photo-btn { position: absolute; bottom: -4px; right: -4px; width: 36px; height: 36px; border-radius: 50%; background: ${F.pink}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .pf-photo-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; }
        .pf-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; }
        .pf-field { margin-bottom: 16px; }
        .pf-field:last-child { margin-bottom: 0; }
        .pf-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .pf-req { color: ${F.pink}; }
        .pf-input, .pf-select, .pf-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .pf-input:focus, .pf-select:focus, .pf-textarea:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .pf-textarea { resize: none; }
        .pf-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .pf-species { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .pf-species-btn { padding: 14px 8px; border-radius: 14px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
        .pf-species-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .pf-species-btn .emoji { font-size: 24px; }
        .pf-species-btn .lbl { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; }
        .pf-species-btn.active .lbl { color: ${F.pink}; }
        .pf-other-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .pf-other-btn { padding: 10px 4px; border-radius: 11px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all .15s; font-family: inherit; }
        .pf-other-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .pf-other-btn .emoji { font-size: 20px; }
        .pf-other-btn .lbl { font-size: 9px; font-weight: 700; color: ${F.inkSoft}; text-align: center; line-height: 1.2; }
        .pf-other-btn.active .lbl { color: ${F.pink}; }
        .pf-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .pf-savebar-inner { max-width: 600px; margin: 0 auto; }
        .pf-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .pf-btn:hover { background: #D63F6A; }
        .pf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="pf-page">
        <div className="pf-body">
          <div className="pf-header">
            <button className="pf-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="pf-title">เปิดฟาร์มสัตว์เลี้ยง 🏡</h1>
              <p className="pf-sub">ฟาร์มบรีดสัตว์เลี้ยงที่น่ารักเพื่อคนรักสัตว์</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pf-photo-wrap">
              <div className="pf-photo">
                <div className={`pf-photo-box ${imageUrl ? 'has-img' : ''}`} onClick={() => fileInputRef.current?.click()}>
                  {imageUrl ? <img src={imageUrl} alt="รูปฟาร์ม" /> : (uploading ? '...' : <Icon.Home />)}
                </div>
                <button type="button" className="pf-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} onClick={(e) => (e.currentTarget.value = '')} style={{ display: 'none' }} />
              </div>
              <p className="pf-photo-hint">{uploading ? 'กำลังอัปโหลด...' : imageUrl ? 'แตะเพื่อเปลี่ยนรูป' : 'อัปโหลดรูปฟาร์ม / โลโก้'}</p>
            </div>

            <div className="pf-card">
              <div className="pf-field">
                <label className="pf-label">ชื่อฟาร์มของคุณ <span className="pf-req">*</span></label>
                <input className="pf-input" required value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })} placeholder="เช่น Happy Paw Cattery" />
              </div>

              <div className="pf-field">
                <label className="pf-label">ชนิดสัตว์ที่เพาะพันธุ์ <span className="pf-req">*</span></label>
                <div className="pf-species">
                  {[{ id: 'cat', emoji: '🐱', lbl: 'แมว' }, { id: 'dog', emoji: '🐶', lbl: 'สุนัข' }, { id: 'other', emoji: '🐾', lbl: 'อื่นๆ' }].map((t) => (
                    <button key={t.id} type="button" className={`pf-species-btn ${form.species === t.id ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, species: t.id, subSpecies: '', customSpecies: '' })}>
                      <span className="emoji">{t.emoji}</span><span className="lbl">{t.lbl}</span>
                    </button>
                  ))}
                </div>

                {form.species === 'other' && (
                  <div className="pf-other-grid">
                    {OTHER_PETS.map((o) => (
                      <button key={o.id} type="button" className={`pf-other-btn ${form.subSpecies === o.id ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, subSpecies: o.id, customSpecies: '' })}>
                        <span className="emoji">{o.emoji}</span><span className="lbl">{o.th}</span>
                      </button>
                    ))}
                  </div>
                )}

                {form.species === 'other' && form.subSpecies === 'other' && (
                  <input className="pf-input" style={{ marginTop: 10 }} required value={form.customSpecies}
                    onChange={(e) => setForm({ ...form, customSpecies: e.target.value })} placeholder="เช่น ชินชิลล่า, เฟอร์เรท" />
                )}
              </div>

              <div className="pf-field">
                <label className="pf-label">เบอร์โทรศัพท์ <span className="pf-req">*</span></label>
                <input type="tel" className="pf-input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
              </div>

              <div className="pf-field">
                <label className="pf-label">รายละเอียดเพิ่มเติม</label>
                <textarea className="pf-textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="บอกเล่าประสบการณ์ ความตั้งใจ หรือสายพันธุ์ที่เพาะ..." />
              </div>
            </div>
          </form>
        </div>

        <div className="pf-savebar">
          <div className="pf-savebar-inner">
            <button type="button" className="pf-btn" onClick={handleSubmit} disabled={loading || uploading}>
              {loading ? '⏳ กำลังบันทึก...' : '🏡 ยืนยันการเปิดฟาร์ม'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
