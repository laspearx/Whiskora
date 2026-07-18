"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  IdCard: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 9h4"/><path d="M14 12h4"/><path d="M14 15h2"/></svg>,
  QrCode: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/><path d="M14 14h3v3"/><path d="M17 17v3h3"/><path d="M14 21h3"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Paw: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
};

const features = [
  { icon: <Icon.IdCard />, title: 'ข้อมูลครบถ้วน', desc: 'ชื่อ สายพันธุ์ สี วันเกิด อายุ และกรุ๊ปเลือด' },
  { icon: <Icon.QrCode />, title: 'QR Code โปรไฟล์', desc: 'สแกนเพื่อดูข้อมูลสัตว์เลี้ยงได้ทุกที่ทุกเวลา' },
  { icon: <Icon.Shield />, title: 'ตราพิสูจน์ตัวตน', desc: 'ตรา WHISKORA VERIFIED รับรองความถูกต้อง' },
  { icon: <Icon.Download />, title: 'ดาวน์โหลด & แชร์', desc: 'บันทึกเป็นรูปภาพหรือแชร์ลิงก์ให้ผู้อื่นได้เลย' },
];

export default function PetIdCardLandingPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setAuthed(true);
      const { data } = await supabase
        .from('pets')
        .select('id, name, image_url, breed, gender, species')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setPets(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = () => {
    if (selected) router.push(`/pets/${selected}/id-card`);
  };

  return (
    <>
      <style>{`
        .pic-page { font-family: inherit; min-height: 100vh; background: #FFFAFC; }
        .pic-wrap { max-width: 640px; margin: 0 auto; padding: 24px 20px 100px; }

        /* top bar */
        .pic-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .pic-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .pic-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .pic-head-text h1 { font-size: 22px; font-weight: 800; color: ${F.ink}; line-height: 1.1; }
        .pic-head-text p { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.1em; }

        /* hero */
        .pic-hero { background: linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 60%, #FFF5F8 100%); border-radius: 24px; border: 1.5px solid #FBCFE8; padding: 28px 24px 24px; margin-bottom: 20px; text-align: center; }
        .pic-hero-icon { width: 68px; height: 68px; background: linear-gradient(135deg, ${F.pink}, #F472B6); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; margin: 0 auto 16px; box-shadow: 0 8px 20px rgba(232,70,119,0.3); }
        .pic-hero-title { font-size: 22px; font-weight: 900; color: ${F.ink}; letter-spacing: -0.5px; margin-bottom: 8px; }
        .pic-hero-title span { color: ${F.pink}; }
        .pic-hero-desc { font-size: 13px; font-weight: 500; color: ${F.inkSoft}; line-height: 1.6; max-width: 420px; margin: 0 auto; }

        /* features */
        .pic-features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
        .pic-feat { background: white; border: 1.5px solid ${F.line}; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 8px; transition: border-color .18s; }
        .pic-feat:hover { border-color: #FBCFE8; }
        .pic-feat-icon { width: 40px; height: 40px; background: #FFF0F5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: ${F.pink}; flex-shrink: 0; }
        .pic-feat-title { font-size: 12px; font-weight: 800; color: ${F.ink}; }
        .pic-feat-desc { font-size: 11px; font-weight: 500; color: ${F.muted}; line-height: 1.5; }

        /* divider */
        .pic-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .pic-divider-line { flex: 1; height: 1px; background: ${F.line}; }
        .pic-divider-text { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }

        /* pet selector */
        .pic-pets { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .pic-pet { display: flex; align-items: center; gap: 14px; background: white; border: 2px solid ${F.line}; border-radius: 18px; padding: 12px 16px; cursor: pointer; transition: all .18s; }
        .pic-pet:hover { border-color: #FBCFE8; background: #FFFAFC; }
        .pic-pet.selected { border-color: ${F.pink}; background: #FFF5F8; box-shadow: 0 0 0 3px rgba(232,70,119,0.12); }
        .pic-pet-photo { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; background: #FDF2F5; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; }
        .pic-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .pic-pet-info { flex: 1; min-width: 0; }
        .pic-pet-name { font-size: 15px; font-weight: 800; color: ${F.ink}; }
        .pic-pet-breed { font-size: 12px; font-weight: 500; color: ${F.muted}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pic-pet-check { width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${F.line}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .18s; }
        .pic-pet.selected .pic-pet-check { background: ${F.pink}; border-color: ${F.pink}; color: white; }

        /* empty state */
        .pic-empty { text-align: center; padding: 36px 20px; background: white; border-radius: 20px; border: 2px dashed #FBCFE8; }
        .pic-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .pic-empty-title { font-size: 15px; font-weight: 800; color: ${F.ink}; margin-bottom: 6px; }
        .pic-empty-desc { font-size: 13px; color: ${F.muted}; line-height: 1.5; margin-bottom: 18px; }
        .pic-empty-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; background: ${F.pink}; color: white; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; box-shadow: 0 4px 12px rgba(232,70,119,0.3); transition: all .18s; }
        .pic-empty-btn:hover { background: #D63F6A; transform: translateY(-1px); }

        /* CTA */
        .pic-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px; background: rgba(255,250,252,0.95); backdrop-filter: blur(12px); border-top: 1px solid ${F.line}; z-index: 60; }
        .pic-cta-inner { max-width: 640px; margin: 0 auto; }
        .pic-cta-btn { width: 100%; padding: 16px; border-radius: 18px; font-size: 16px; font-weight: 800; border: none; cursor: pointer; transition: all .2s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .pic-cta-btn.active { background: ${F.pink}; color: white; box-shadow: 0 6px 20px rgba(232,70,119,0.35); }
        .pic-cta-btn.active:hover { background: #D63F6A; transform: translateY(-1px); }
        .pic-cta-btn.inactive { background: #F3F4F6; color: #9CA3AF; cursor: not-allowed; }

        @media (max-width: 480px) {
          .pic-wrap { padding: 16px 14px 90px; }
          .pic-features { grid-template-columns: 1fr 1fr; gap: 8px; }
        }
      `}</style>

      <div className="pic-page">
        <div className="pic-wrap">

          {/* Top bar */}
          <div className="pic-topbar">
            <button onClick={() => router.back()} className="pic-back" aria-label="ย้อนกลับ">
              <Icon.ArrowLeft />
            </button>
            <div className="pic-head-text">
              <h1>Pet ID Card</h1>
              <p>บัตรประจำตัวสัตว์เลี้ยง</p>
            </div>
          </div>

          {/* Hero */}
          <div className="pic-hero">
            <div className="pic-hero-icon"><img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            <div className="pic-hero-title">
              บัตรประจำตัว<span>สัตว์เลี้ยง</span>คืออะไร?
            </div>
            <p className="pic-hero-desc">
              Pet ID Card คือบัตรดิจิทัลที่รวบรวมข้อมูลสำคัญของสัตว์เลี้ยงไว้ในที่เดียว
              พร้อม QR Code ที่ให้ผู้อื่นสแกนดูโปรไฟล์ได้ทันที เหมาะสำหรับเก็บไว้ในโทรศัพท์
              หรือพิมพ์ติดคอลลาร์สัตว์เลี้ยง
            </p>
          </div>

          {/* Features */}
          <div className="pic-features">
            {features.map((f, i) => (
              <div key={i} className="pic-feat">
                <div className="pic-feat-icon">{f.icon}</div>
                <div>
                  <div className="pic-feat-title">{f.title}</div>
                  <div className="pic-feat-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pet selector */}
          <div className="pic-divider">
            <div className="pic-divider-line" />
            <span className="pic-divider-text">เลือกสัตว์เลี้ยงที่ต้องการ</span>
            <div className="pic-divider-line" />
          </div>

          {!loading && (authed ? pets.length === 0 : true) && (
            <div className="pic-empty">
              <div className="pic-empty-icon">🐾</div>
              <div className="pic-empty-title">
                {authed ? 'ยังไม่มีสัตว์เลี้ยง' : 'เริ่มต้นด้วยการเพิ่มสัตว์เลี้ยง'}
              </div>
              <p className="pic-empty-desc">
                {authed
                  ? 'เพิ่มสัตว์เลี้ยงของคุณก่อน แล้วค่อยมาสร้าง Pet ID Card ได้เลย'
                  : 'สร้างโปรไฟล์สัตว์เลี้ยงฟรี พร้อมรับ Pet ID Card ทันที'}
              </p>
              <Link
                href="/pets/create"
                className="pic-empty-btn"
              >
                <Icon.Plus /> เพิ่มสัตว์เลี้ยง
              </Link>
            </div>
          )}

          {authed && !loading && pets.length > 0 && (
            <div className="pic-pets">
              {pets.map(pet => (
                <div
                  key={pet.id}
                  className={`pic-pet${selected === String(pet.id) ? ' selected' : ''}`}
                  onClick={() => setSelected(String(pet.id))}
                >
                  <div className="pic-pet-photo">
                    {pet.image_url
                      ? <img src={pet.image_url} alt={pet.name} />
                      : '🐾'}
                  </div>
                  <div className="pic-pet-info">
                    <div className="pic-pet-name">{pet.name}</div>
                    <div className="pic-pet-breed">{pet.breed || pet.species || 'ไม่ระบุสายพันธุ์'}</div>
                  </div>
                  <div className="pic-pet-check">
                    {selected === String(pet.id) && <Icon.Check />}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Sticky CTA */}
      {authed && pets.length > 0 && (
        <div className="pic-cta">
          <div className="pic-cta-inner">
            <button
              className={`pic-cta-btn ${selected ? 'active' : 'inactive'}`}
              onClick={handleCreate}
              disabled={!selected}
            >
              <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              {selected ? 'สร้าง Pet ID Card' : 'เลือกสัตว์เลี้ยงก่อน'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
