"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

const SERVICE_CATEGORIES = [
  { id: 'grooming', label: 'อาบน้ำตัดขน', emoji: '✂️', needAddress: true },
  { id: 'transport', label: 'รับส่งสัตว์เลี้ยง', emoji: '🚗', needAddress: false },
  { id: 'cat_hotel', label: 'โรงแรมสัตว์', emoji: '🏨', needAddress: true },
  { id: 'pet_care', label: 'บริการดูแลสัตว์เลี้ยง', emoji: '🦮', needAddress: false },
  { id: 'clinic', label: 'คลินิก / โรงพยาบาลสัตว์', emoji: '🏥', needAddress: true },
];

const SPECIES = [
  { id: 'cat', label: 'แมว', emoji: '🐱' }, { id: 'dog', label: 'สุนัข', emoji: '🐶' },
  { id: 'rabbit', label: 'กระต่าย', emoji: '🐰' }, { id: 'hamster', label: 'แฮมสเตอร์', emoji: '🐹' },
  { id: 'bird', label: 'นก', emoji: '🦜' }, { id: 'squirrel', label: 'กระรอก', emoji: '🐿️' },
  { id: 'hedgehog', label: 'เม่นแคระ', emoji: '🦔' }, { id: 'fish', label: 'ปลา', emoji: '🐟' },
  { id: 'turtle', label: 'เต่า', emoji: '🐢' }, { id: 'frog', label: 'กบ', emoji: '🐸' },
  { id: 'lizard', label: 'กิ้งก่า', emoji: '🦎' }, { id: 'snake', label: 'งู', emoji: '🐍' },
  { id: 'raccoon', label: 'แร็กคูน', emoji: '🦝' }, { id: 'other', label: 'สัตว์อื่นๆ', emoji: '🐾' },
];

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Scissors: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>,
};

export default function RegisterServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [form, setForm] = useState({ service_name: '', phone: '', category: '', bio: '', address: '' });
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  const showAddressField = SERVICE_CATEGORIES.find((c) => c.id === form.category)?.needAddress;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push(`/login?redirect=${encodeURIComponent('/partner/register-service')}`);
      setUserId(session.user.id);
    };
    checkUser();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const filePath = `services/${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('partner-photos').upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('partner-photos').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (err: any) { alert('อัปโหลดรูปไม่สำเร็จ: ' + (err.message || '')); }
    finally { setUploading(false); }
  };

  const toggleSpecies = (id: string) =>
    setSelectedSpecies((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!form.category) return alert('กรุณาเลือกประเภทบริการครับ');
    if (selectedSpecies.length === 0) return alert('กรุณาเลือกสัตว์ที่รองรับครับ');
    setIsLoading(true);
    try {
      const { error } = await supabase.from('services').insert([{
        user_id: userId, service_name: form.service_name, phone: form.phone,
        category: form.category, bio: form.bio,
        address: showAddressField ? form.address : null,
        image_url: imageUrl || null,
        supported_species: selectedSpecies.join(','),
      }]);
      if (error) throw error;
      alert('🐾 บันทึกข้อมูลบริการเรียบร้อยแล้ว!');
      router.push('/profile');
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .sv-page { font-family: 'Sarabun', sans-serif; min-height: 100vh; color: ${F.ink}; }
        .sv-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .sv-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .sv-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.blueBorder}; box-shadow: 0 2px 8px rgba(37,99,235,0.1); transition: all .18s ease; flex-shrink: 0; }
        .sv-back:hover { color: ${F.blue}; border-color: ${F.blue}; transform: translateX(-1px); }
        .sv-title { font-family: 'Prompt', sans-serif; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .sv-sub { font-size: 12px; font-weight: 600; color: ${F.blue}; margin-top: 2px; }
        .sv-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
        .sv-photo { position: relative; }
        .sv-photo-box { width: 110px; height: 110px; border-radius: 24px; overflow: hidden; background: ${F.blueSoft}; border: 2px dashed ${F.blueBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; color: ${F.blue}; }
        .sv-photo-box.has-img { border-style: solid; }
        .sv-photo-box:hover { border-color: ${F.blue}; }
        .sv-photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .sv-photo-btn { position: absolute; bottom: -4px; right: -4px; width: 36px; height: 36px; border-radius: 50%; background: ${F.blue}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .sv-photo-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; }
        .sv-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .sv-card-title { font-family: 'Prompt', sans-serif; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 4px; }
        .sv-card-note { font-size: 11px; color: ${F.muted}; margin-bottom: 16px; }
        .sv-field { margin-bottom: 16px; }
        .sv-field:last-child { margin-bottom: 0; }
        .sv-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .sv-req { color: ${F.pink}; }
        .sv-input, .sv-select, .sv-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .sv-input:focus, .sv-select:focus, .sv-textarea:focus { border-color: ${F.blue}; box-shadow: 0 0 0 3px ${F.blueSoft}; }
        .sv-textarea { resize: none; }
        .sv-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .sv-species-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .sv-species-btn { padding: 12px 4px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all .15s; font-family: inherit; }
        .sv-species-btn.active { border-color: ${F.blue}; background: ${F.blueSoft}; }
        .sv-species-btn .emoji { font-size: 20px; }
        .sv-species-btn .lbl { font-size: 10px; font-weight: 700; color: ${F.inkSoft}; }
        .sv-species-btn.active .lbl { color: ${F.blue}; }
        .sv-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .sv-savebar-inner { max-width: 600px; margin: 0 auto; }
        .sv-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.blue}; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
        .sv-btn:hover { background: #1D4FD7; }
        .sv-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 420px) { .sv-species-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="sv-page">
        <div className="sv-body">
          <div className="sv-header">
            <button className="sv-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="sv-title">เปิดบริการสัตว์เลี้ยง ✂️</h1>
              <p className="sv-sub">ขยายบริการให้เข้าถึงคนรักสัตว์มากขึ้น</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="sv-photo-wrap">
              <div className="sv-photo">
                <div className={`sv-photo-box ${imageUrl ? 'has-img' : ''}`} onClick={() => fileInputRef.current?.click()}>
                  {imageUrl ? <img src={imageUrl} alt="รูปบริการ" /> : (uploading ? '...' : <Icon.Scissors />)}
                </div>
                <button type="button" className="sv-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} onClick={(e) => (e.currentTarget.value = '')} style={{ display: 'none' }} />
              </div>
              <p className="sv-photo-hint">{uploading ? 'กำลังอัปโหลด...' : imageUrl ? 'แตะเพื่อเปลี่ยนรูป' : 'อัปโหลดรูปร้าน / บริการ'}</p>
            </div>

            <div className="sv-card">
              <div className="sv-field">
                <label className="sv-label">ชื่อร้าน / ชื่อบริการ <span className="sv-req">*</span></label>
                <input className="sv-input" required value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="ชื่อบริการของคุณ" />
              </div>

              <div className="sv-field">
                <label className="sv-label">ประเภทบริการ <span className="sv-req">*</span></label>
                <select className="sv-select" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="" disabled>เลือกประเภทบริการ</option>
                  {SERVICE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>

              <div className="sv-field">
                <label className="sv-label">เบอร์โทรศัพท์ <span className="sv-req">*</span></label>
                <input type="tel" className="sv-input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
              </div>

              {showAddressField && (
                <div className="sv-field">
                  <label className="sv-label">ที่ตั้งหน้าร้าน / พิกัดบริการ 📍 <span className="sv-req">*</span></label>
                  <textarea className="sv-textarea" rows={2} required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="เลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด..." />
                </div>
              )}

              <div className="sv-field">
                <label className="sv-label">รายละเอียดเพิ่มเติม</label>
                <textarea className="sv-textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="อธิบายจุดเด่นหรือรายละเอียดของบริการ..." />
              </div>
            </div>

            <div className="sv-card">
              <div className="sv-card-title">บริการนี้รองรับสัตว์ชนิดใดบ้าง? <span className="sv-req">*</span></div>
              <div className="sv-card-note">เลือกได้หลายชนิด</div>
              <div className="sv-species-grid">
                {SPECIES.map((s) => (
                  <button key={s.id} type="button" className={`sv-species-btn ${selectedSpecies.includes(s.id) ? 'active' : ''}`} onClick={() => toggleSpecies(s.id)}>
                    <span className="emoji">{s.emoji}</span><span className="lbl">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="sv-savebar">
          <div className="sv-savebar-inner">
            <button type="button" className="sv-btn" onClick={handleSubmit} disabled={isLoading || uploading}>
              {isLoading ? '⏳ กำลังบันทึก...' : '🐾 ยืนยันการสมัครบริการ'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}