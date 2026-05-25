"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

const SPECIES = [
  { id: 'cat', label: 'เนเธกเธง', emoji: '๐ฑ' }, { id: 'dog', label: 'เธซเธกเธฒ', emoji: '๐ถ' },
  { id: 'rabbit', label: 'เธเธฃเธฐเธ•เนเธฒเธข', emoji: '๐ฐ' }, { id: 'hamster', label: 'เนเธฎเธกเธชเน€เธ•เธญเธฃเน', emoji: '๐น' },
  { id: 'bird', label: 'เธเธ', emoji: '๐ฆ' }, { id: 'squirrel', label: 'เธเธฃเธฐเธฃเธญเธ', emoji: '๐ฟ๏ธ' },
  { id: 'hedgehog', label: 'เน€เธกเนเธเนเธเธฃเธฐ', emoji: '๐ฆ”' }, { id: 'fish', label: 'เธเธฅเธฒ', emoji: '๐' },
  { id: 'turtle', label: 'เน€เธ•เนเธฒ', emoji: '๐ข' }, { id: 'frog', label: 'เธเธ', emoji: '๐ธ' },
  { id: 'lizard', label: 'เธเธดเนเธเธเนเธฒ', emoji: '๐ฆ' }, { id: 'snake', label: 'เธเธน', emoji: '๐' },
  { id: 'raccoon', label: 'เนเธฃเนเธเธเธนเธ', emoji: '๐ฆ' }, { id: 'other', label: 'เธชเธฑเธ•เธงเนเธญเธทเนเธเน', emoji: '๐พ' },
];

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Bag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
};

export default function RegisterShopPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [form, setForm] = useState({ shop_name: '', phone: '', bio: '', address: '' });
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push(`/login?redirect=${encodeURIComponent('/partner/register-shop')}`);
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
      const filePath = `shops/${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('partner-photos').upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('partner-photos').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (err: any) { alert('เธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเนเธกเนเธชเธณเน€เธฃเนเธ: ' + (err.message || '')); }
    finally { setUploading(false); }
  };

  const toggleSpecies = (id: string) =>
    setSelectedSpecies((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (selectedSpecies.length === 0) return alert('เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธชเธฑเธ•เธงเนเธ—เธตเนเธฃเนเธฒเธเธฃเธญเธเธฃเธฑเธเธญเธขเนเธฒเธเธเนเธญเธข 1 เธเธฃเธฐเน€เธ เธ—เธเธฃเธฑเธ');
    setIsLoading(true);
    try {
      const { error } = await supabase.from('shops').insert([{
        user_id: userId, shop_name: form.shop_name, phone: form.phone, bio: form.bio,
        address: form.address || null,
        image_url: imageUrl || null, supported_species: selectedSpecies,
      }]).select().single();
      if (error) throw error;
      alert('๐๏ธ เน€เธเธดเธ”เธฃเนเธฒเธ Pet Shop เธชเธณเน€เธฃเนเธ! เนเธเธเธฑเธ”เธเธฒเธฃเธชเธ•เนเธญเธเธชเธดเธเธเนเธฒเธเธฑเธเธเธฃเธฑเธ');
      router.push('/profile');
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .ps-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ps-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .ps-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .ps-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.tealBorder}; box-shadow: 0 2px 8px rgba(13,148,136,0.1); transition: all .18s ease; flex-shrink: 0; }
        .ps-back:hover { color: ${F.teal}; border-color: ${F.teal}; transform: translateX(-1px); }
        .ps-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .ps-sub { font-size: 12px; font-weight: 600; color: ${F.teal}; margin-top: 2px; }
        .ps-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
        .ps-photo { position: relative; }
        .ps-photo-box { width: 110px; height: 110px; border-radius: 24px; overflow: hidden; background: ${F.tealSoft}; border: 2px dashed ${F.tealBorder}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; color: ${F.teal}; }
        .ps-photo-box.has-img { border-style: solid; }
        .ps-photo-box:hover { border-color: ${F.teal}; }
        .ps-photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .ps-photo-btn { position: absolute; bottom: -4px; right: -4px; width: 36px; height: 36px; border-radius: 50%; background: ${F.teal}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .ps-photo-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; }
        .ps-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
        .ps-card-title { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 4px; }
        .ps-card-note { font-size: 11px; color: ${F.muted}; margin-bottom: 16px; }
        .ps-field { margin-bottom: 16px; }
        .ps-field:last-child { margin-bottom: 0; }
        .ps-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .ps-req { color: ${F.pink}; }
        .ps-input, .ps-textarea { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .ps-input:focus, .ps-textarea:focus { border-color: ${F.teal}; box-shadow: 0 0 0 3px ${F.tealSoft}; }
        .ps-textarea { resize: none; }
        .ps-species-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .ps-species-btn { padding: 12px 4px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all .15s; font-family: inherit; }
        .ps-species-btn.active { border-color: ${F.teal}; background: ${F.tealSoft}; }
        .ps-species-btn .emoji { font-size: 20px; }
        .ps-species-btn .lbl { font-size: 10px; font-weight: 700; color: ${F.inkSoft}; }
        .ps-species-btn.active .lbl { color: ${F.teal}; }
        .ps-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .ps-savebar-inner { max-width: 600px; margin: 0 auto; }
        .ps-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.teal}; color: white; box-shadow: 0 4px 14px rgba(13,148,136,0.3); }
        .ps-btn:hover { background: #0B7E74; }
        .ps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 420px) { .ps-species-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className="ps-page">
        <div className="ps-body">
          <div className="ps-header">
            <button className="ps-back" onClick={() => router.back()} aria-label="เธขเนเธญเธเธเธฅเธฑเธ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="ps-title">เน€เธเธดเธ”เธฃเนเธฒเธ Pet Shop ๐๏ธ</h1>
              <p className="ps-sub">เน€เธเธฃเธฒเธฐเน€เธซเธฅเนเธฒเธเธเน€เธฅเธตเนเธขเธเธชเธฑเธ•เธงเน เธ•เนเธญเธเธเธฒเธฃเธเธธเธ“</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ps-photo-wrap">
              <div className="ps-photo">
                <div className={`ps-photo-box ${imageUrl ? 'has-img' : ''}`} onClick={() => fileInputRef.current?.click()}>
                  {imageUrl ? <img src={imageUrl} alt="เธฃเธนเธเธฃเนเธฒเธ" /> : (uploading ? '...' : <Icon.Bag />)}
                </div>
                <button type="button" className="ps-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} onClick={(e) => (e.currentTarget.value = '')} style={{ display: 'none' }} />
              </div>
              <p className="ps-photo-hint">{uploading ? 'เธเธณเธฅเธฑเธเธญเธฑเธเนเธซเธฅเธ”...' : imageUrl ? 'เนเธ•เธฐเน€เธเธทเนเธญเน€เธเธฅเธตเนเธขเธเธฃเธนเธ' : 'เธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธฃเนเธฒเธ / เนเธฅเนเธเน'}</p>
            </div>

            <div className="ps-card">
              <div className="ps-field">
                <label className="ps-label">เธเธทเนเธญเธฃเนเธฒเธ Pet Shop <span className="ps-req">*</span></label>
                <input className="ps-input" required value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="เธเธทเนเธญเธฃเนเธฒเธเธเนเธฒเธเธญเธเธเธธเธ“" />
              </div>
              <div className="ps-field">
                <label className="ps-label">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน <span className="ps-req">*</span></label>
                <input type="tel" className="ps-input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08X-XXX-XXXX" />
              </div>
              <div className="ps-field">
                <label className="ps-label">เธ—เธตเนเธญเธขเธนเนเธฃเนเธฒเธ ๐“</label>
                <textarea className="ps-textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="เน€เธฅเธเธ—เธตเน, เธ–เธเธ, เนเธเธงเธ/เธ•เธณเธเธฅ, เน€เธเธ•/เธญเธณเน€เธ เธญ, เธเธฑเธเธซเธงเธฑเธ”..." />
              </div>
              <div className="ps-field">
                <label className="ps-label">เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก</label>
                <textarea className="ps-textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="เนเธเธฐเธเธณเธฃเนเธฒเธเธเนเธฒเธซเธฃเธทเธญเธชเธดเธเธเนเธฒเน€เธ”เนเธเธเธญเธเธฃเนเธฒเธ..." />
              </div>
            </div>

            <div className="ps-card">
              <div className="ps-card-title">เธฃเนเธฒเธเธเธญเธเธเธธเธ“เธกเธตเธเธญเธเธชเธณเธซเธฃเธฑเธเธชเธฑเธ•เธงเนเธเธเธดเธ”เนเธ”เธเนเธฒเธ? <span className="ps-req">*</span></div>
              <div className="ps-card-note">เน€เธฅเธทเธญเธเนเธ”เนเธซเธฅเธฒเธขเธเธเธดเธ”</div>
              <div className="ps-species-grid">
                {SPECIES.map((s) => (
                  <button key={s.id} type="button" className={`ps-species-btn ${selectedSpecies.includes(s.id) ? 'active' : ''}`} onClick={() => toggleSpecies(s.id)}>
                    <span className="emoji">{s.emoji}</span><span className="lbl">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="ps-savebar">
          <div className="ps-savebar-inner">
            <button type="button" className="ps-btn" onClick={handleSubmit} disabled={isLoading || uploading}>
              {isLoading ? 'โณ เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ...' : '๐๏ธ เธขเธทเธเธขเธฑเธเธเธฒเธฃเน€เธเธดเธ”เธฃเนเธฒเธ'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}