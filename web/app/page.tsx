"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── CI Design tokens ───────────────────────────────────────────────────────
const F = {
  ink: '#1f1a1c',
  inkSoft: '#4a3f44',
  cream: '#fffafc',
  paper: '#fdf0f3',
  line: '#f3dde3',
  muted: '#8e7e84',
  pink: '#e84677',
  pinkSoft: '#fde2ea',
  pinkDeep: '#c4325f',
  sky: '#5b8dc7',
  leaf: '#5a9065',
  sun: '#e8a63a',
};

// ─── Farm data ───────────────────────────────────────────────────────────────
const FARMS = [
  { id: '1', name: 'ฟาร์มน้องเหมียว',  loc: 'กรุงเทพฯ · 2.4 กม.',    rating: 4.9, breed: 'แมวเปอร์เซีย',        certs: ['CFA'] },
  { id: '2', name: 'The Paws Bangkok',  loc: 'นนทบุรี · 8.1 กม.',      rating: 4.8, breed: 'โกลเด้น รีทรีฟเวอร์',  certs: ['TICA'] },
  { id: '3', name: 'ฟาร์มคุณหมอ',      loc: 'ปทุมธานี · 12 กม.',      rating: 4.9, breed: 'แมวบริติช',            certs: ['CFA','TICA'] },
  { id: '4', name: 'Siam Feline',       loc: 'กรุงเทพฯ · 5.2 กม.',    rating: 5.0, breed: 'แมววิเชียรมาศ',        certs: ['CFA'] },
  { id: '5', name: 'Happy Tails Farm',  loc: 'สมุทรปราการ · 15 กม.',   rating: 4.7, breed: 'พุดเดิ้ล',              certs: [] },
  { id: '6', name: 'ฟาร์มบ้านแมว',    loc: 'กรุงเทพฯ · 3.8 กม.',    rating: 4.9, breed: 'แมวอเมริกันขนสั้น',    certs: ['TICA'] },
];

const FILTERS = ['ทั้งหมด', 'สุนัข', 'แมว', 'กระต่าย', 'ใกล้ฉัน', 'ยืนยันแล้ว'];
const CHIPS   = ['แมวเปอร์เซีย', 'โกลเด้น', 'คลินิก', 'วัคซีน', 'กรูมมิ่ง'];

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const Icon = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Dog: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2 .336-3.5 2-3.5 3.5 0 1.079.49 2.044 1.267 2.688L5 15h5V7c.667-.667 0-1.828 0-1.828z"/><path d="M14.267 9.188C15.044 8.544 15.5 7.579 15.5 6.5c0-1.5-1.5-3.164-3.5-3.5-1.923-.321-3.5.782-3.5 2.172 0 0-.667 1.161 0 1.828"/>
      <path d="M5 15v3a2 2 0 0 0 4 0v-3"/><path d="M14 15v3a2 2 0 0 0 4 0v-3"/><path d="M9 15h6"/>
    </svg>
  ),
  Cat: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5z"/>
      <path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17z"/>
    </svg>
  ),
  Clinic: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      <path d="M12 8v4"/><path d="M10 10h4"/>
    </svg>
  ),
  Scissors: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  Community: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  IdCard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="8" cy="12" r="2"/>
      <path d="M14 10h4"/><path d="M14 14h4"/>
    </svg>
  ),
  Heart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10"/>
    </svg>
  ),
  Pet: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  ),
  AI: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
};

// ─── Paw logo (reused in footer) ─────────────────────────────────────────────
function PawMark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size, filter: 'drop-shadow(0 2px 4px rgba(232,70,119,.15))' }}>
      <defs>
        <radialGradient id="pawFootGrad" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="60%" stopColor="#fff0f5"/>
          <stop offset="100%" stopColor="#fcd3e0"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#pawFootGrad)" stroke="#f8a5bf" strokeWidth="1.5"/>
      <g fill="#ec5b89">
        <ellipse cx="32" cy="43" rx="10" ry="8.5"/>
        <ellipse cx="19.5" cy="31" rx="4.2" ry="5.6" transform="rotate(-20 19.5 31)"/>
        <ellipse cx="26" cy="20" rx="3.8" ry="5" transform="rotate(-10 26 20)"/>
        <g transform="matrix(-1 0 0 1 64 0)">
          <ellipse cx="19.5" cy="31" rx="4.2" ry="5.6" transform="rotate(-20 19.5 31)"/>
          <ellipse cx="26" cy="20" rx="3.8" ry="5" transform="rotate(-10 26 20)"/>
        </g>
      </g>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilter, setActiveFilter] = useState("ทั้งหมด");

  const goSearch = () => {
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <style>{`
        /* ─── Responsive grid overrides ─────────────────────────────── */
        @media (max-width: 900px) {
          .hero-grid  { grid-template-columns: 1fr !important; }
          .hero-banner-inner { flex-direction: column !important; text-align: center; justify-content: center; padding: 40px 24px !important; }
          .hero-banner-inner p { margin: 0 auto 24px !important; }
          .hero-mockup { margin-top: 24px; }
          .cats-grid  { grid-template-columns: repeat(3,1fr) !important; }
          .farms-grid { grid-template-columns: repeat(2,1fr) !important; }
          .how-grid   { grid-template-columns: 1fr !important; }
          .ai-band    { grid-template-columns: auto 1fr !important; }
          .partner-band { grid-template-columns: 1fr !important; }
          .footer-grid  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .cats-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .farms-grid { grid-template-columns: 1fr !important; }
          .ai-band    { grid-template-columns: 1fr !important; text-align: center; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }

        /* ─── Interactive states & Animations ────────────────────────── */
        .farm-card { transition: transform .2s, box-shadow .2s; }
        .farm-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(31,26,28,.08); }

        .cat-tile:hover { border-color: #e84677 !important; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(31,26,28,.06); }

        .btn-pink  { transition: background .15s, transform .15s, box-shadow .15s; }
        .btn-pink:hover  { background: #c4325f !important; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(232,70,119,.35) !important; }
        .btn-white { transition: transform .15s, box-shadow .15s; }
        .btn-white:hover { background: #fdf0f3 !important; transform: translateY(-1px); }
        .btn-outline-white:hover { background: rgba(255,255,255,.22) !important; }

        .fchip:hover { border-color: #e84677 !important; color: #e84677 !important; }
        .fchip-active { background: #1f1a1c !important; color: #fff !important; border-color: #1f1a1c !important; }

        .search-bar:focus-within { border-color: #e84677 !important; box-shadow: 0 2px 16px rgba(232,70,119,.15) !important; }
        .search-bar input { border: none; outline: none; background: transparent; width: 100%; font-family: inherit; font-size: 15px; color: #1f1a1c; padding: 12px 0; }
        .search-bar input::placeholder { color: #8e7e84; }

        @keyframes float-anim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .float-anim { animation: float-anim 6s ease-in-out infinite; }

        .chip-hover:hover { background: #fde2ea !important; color: #c4325f !important; cursor: pointer; }
        .fav-btn:hover { color: #e84677 !important; }
        .footer-link:hover { color: #e84677 !important; }
        .see-all:hover { color: #c4325f !important; }
      `}</style>

      <div style={{ color: F.ink, fontFamily: 'var(--font-ui)', paddingBottom: 0 }}>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section style={{ padding: '28px 0 12px' }}>
          <div
            className="hero-grid"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 20, alignItems: 'stretch' }}
          >
            {/* 🌟 Left: Gradient Hero */}
            <div className="hero-banner-inner" style={{
              background: `linear-gradient(135deg, ${F.pink} 0%, #f06d98 60%, #f49ab8 100%)`,
              borderRadius: 24, padding: '40px 32px', color: '#fff',
              position: 'relative', overflow: 'hidden', minHeight: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
              boxShadow: '0 20px 40px rgba(232,70,119,0.15)'
            }}>
              {/* Decorative blobs */}
              <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, background: 'radial-gradient(circle, rgba(255,255,255,.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 999, letterSpacing: 1.5, border: '1px solid rgba(255,255,255,0.3)', display: 'inline-block', marginBottom: 16 }}>
                  NEW FEATURE ✨
                </span>
                <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1, margin: '0 0 14px', color: '#fff' }}>
                  สร้างบัตรประจำตัว<br />
                  <span style={{ color: '#fde2ea' }}>ให้น้องๆ สุดคิวท์ 🪪</span>
                </h1>
                <p style={{ fontSize: 14, lineHeight: 1.5, opacity: .92, margin: '0 0 24px', maxWidth: 360 }}>
                  อวดความน่ารักของลูกๆ ด้วยบัตร Pet ID Card ระดับ Collector's Edition พร้อมเก็บประวัติสุขภาพไว้ในที่เดียว
                </p>
                <button
                  className="btn-white"
                  style={{ background: '#fff', color: F.pink, padding: '14px 24px', borderRadius: 16, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(232,70,119,.4)' }}
                  // 🌟 แก้ไขจุดที่ 1: เปลี่ยนลิงก์ไปที่ /profile/pets
                  onClick={() => router.push('/profile/pets')}
                >
                  <span style={{ fontSize: 18 }}>🐾</span> เริ่มสร้างบัตรฟรี
                </button>
              </div>

              {/* 🌟 ID Card Mockup (ลอยได้) */}
              <div className="hero-mockup float-anim" style={{ width: 230, position: 'relative', zIndex: 2 }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', padding: 10, borderRadius: 24, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: 16, color: F.ink }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22 }}>
                          <img src="/mini-logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 900, color: F.pink, letterSpacing: 0.5 }}>WHISKORA</div>
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 900, color: '#d1d5db', letterSpacing: 0.5 }}>ID CARD</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 54, height: 70, background: '#f3f4f6', borderRadius: 8 }}></div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                        <div style={{ height: 8, width: 70, background: '#e5e7eb', borderRadius: 4 }}></div>
                        <div style={{ height: 5, width: '100%', background: '#f3f4f6', borderRadius: 4 }}></div>
                        <div style={{ height: 5, width: 50, background: '#f3f4f6', borderRadius: 4 }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: My Pets panel */}
            <div style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 24, padding: 22, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: F.muted, fontWeight: 600, marginBottom: 14 }}>
                น้อง ๆ ของฉัน
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '18px 0' }}>
                <div style={{ width: 60, height: 60, background: F.pinkSoft, borderRadius: 18, display: 'grid', placeItems: 'center', color: F.pink, marginBottom: 12 }}>
                  <Icon.Pet />
                </div>
                <strong style={{ fontSize: 14, color: F.ink }}>ยังไม่มีสัตว์เลี้ยง</strong>
                <span style={{ fontSize: 12, color: F.muted, marginTop: 4, marginBottom: 16, display: 'block' }}>เพิ่มน้องเพื่อเริ่มต้น</span>
                <button
                  className="btn-pink"
                  style={{ background: F.pink, color: '#fff', padding: '10px 20px', borderRadius: 999, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(232,70,119,.25)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  // 🌟 แก้ไขจุดที่ 2: เปลี่ยนลิงก์ไปที่ /pets/create
                  onClick={() => router.push('/pets/create')}
                >
                  + เพิ่มน้องเลย
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEARCH ──────────────────────────────────────────────────── */}
        <section style={{ padding: '20px 0' }}>
          <div
            className="search-bar"
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${F.line}`, borderRadius: 999, padding: '6px 6px 6px 20px', boxShadow: '0 2px 12px rgba(31,26,28,.04)' }}
          >
            <span style={{ color: F.muted, display: 'flex', flexShrink: 0 }}><Icon.Search /></span>
            <input
              type="text"
              placeholder="ค้นหาฟาร์ม สายพันธุ์ หรือบริการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goSearch(); }}
            />
            <button
              className="btn-pink"
              style={{ background: F.pink, color: '#fff', padding: '10px 20px', borderRadius: 999, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 14px rgba(232,70,119,.25)' }}
              onClick={goSearch}
            >
              ค้นหา
            </button>
          </div>

          {/* Popular chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: F.muted }}>ยอดฮิต:</span>
            {CHIPS.map(chip => (
              <span
                key={chip}
                className="chip-hover"
                style={{ padding: '6px 14px', background: F.paper, borderRadius: 999, fontSize: 12, color: F.inkSoft, fontWeight: 500, transition: 'background .15s, color .15s' }}
                onClick={() => router.push(`/search?q=${encodeURIComponent(chip)}`)}
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        {/* ── CATEGORIES ──────────────────────────────────────────────── */}
        <section style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>หมวดหมู่</h2>
          </div>
          <div className="cats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {[
              { href: '/farm-hub?pet=dog',              icon: <Icon.Dog />,       bg: F.pinkSoft,  color: F.pink,  label: 'สุนัข' },
              { href: '/farm-hub?pet=cat',              icon: <Icon.Cat />,       bg: F.pinkSoft,  color: F.pink,  label: 'แมว' },
              { href: '/service-hub?category=คลินิก',  icon: <Icon.Clinic />,    bg: '#dbeafe',   color: F.sky,   label: 'คลินิก' },
              { href: '/service-hub?category=กรูมมิ่ง', icon: <Icon.Scissors />, bg: '#dcfce7',   color: F.leaf,  label: 'กรูมมิ่ง' },
              { href: '/community',                     icon: <Icon.Community />, bg: '#fef9c3',   color: F.sun,   label: 'คอมมูนิตี้' },
              // 🌟 แก้ไขจุดที่ 3: เปลี่ยนลิงก์ Pet ID Card ไปที่ /profile/pets
              { href: '/profile/pets',                  icon: <Icon.IdCard />,    bg: F.pinkSoft,  color: F.pink,  label: 'Pet ID Card' },
            ].map(cat => (
              <Link
                key={cat.href}
                href={cat.href}
                className="cat-tile"
                style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 18, padding: '18px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all .2s' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: cat.bg, display: 'grid', placeItems: 'center', color: cat.color, marginBottom: 10 }}>
                  {cat.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: F.ink }}>{cat.label}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FARM FEED ────────────────────────────────────────────────── */}
        <section style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>ฟาร์มแนะนำ</h2>
            <Link href="/farm-hub" className="see-all" style={{ fontSize: 13, color: F.pink, fontWeight: 600, transition: 'color .15s' }}>ดูทั้งหมด →</Link>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`fchip${activeFilter === f ? ' fchip-active' : ''}`}
                style={{ padding: '8px 16px', background: activeFilter === f ? F.ink : '#fff', color: activeFilter === f ? '#fff' : F.ink, border: `1px solid ${activeFilter === f ? F.ink : F.line}`, borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Farm cards */}
          <div className="farms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 18 }}>
            {FARMS.map(farm => (
              <div
                key={farm.id}
                className="farm-card"
                style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => router.push(`/farm/${farm.id}`)}
              >
                {/* Photo placeholder */}
                <div style={{ height: 170, background: `repeating-linear-gradient(135deg, ${F.paper} 0 10px, #fff 10px 20px)`, display: 'grid', placeItems: 'center', position: 'relative' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: F.muted, letterSpacing: 1.5 }}>FARM PHOTO</span>
                  <button
                    className="fav-btn"
                    style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, background: 'rgba(255,255,255,.95)', borderRadius: 999, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: F.muted, transition: 'color .15s' }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="บันทึก"
                  >
                    <Icon.Heart />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{farm.name}</div>
                      <div style={{ fontSize: 12, color: F.muted, marginTop: 3 }}>{farm.loc} · {farm.breed}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ color: F.sun }}>★</span> {farm.rating}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(90,144,101,.15)', color: F.leaf }}>✓ ยืนยันแล้ว</span>
                    {farm.certs.map(c => (
                      <span key={c} style={{ padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: F.paper, color: F.inkSoft }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI BAND ──────────────────────────────────────────────────── */}
        <div
          className="ai-band"
          style={{ marginTop: 36, background: `linear-gradient(135deg, #fff 0%, ${F.pinkSoft} 100%)`, border: `1px solid ${F.line}`, borderRadius: 24, padding: 32, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center' }}
        >
          <div style={{ width: 64, height: 64, background: F.pink, borderRadius: 20, display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
            <Icon.AI />
          </div>
          <div>
            <strong style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3, display: 'block', color: F.ink }}>AI ช่วยวิเคราะห์อาการเบื้องต้น</strong>
            <span style={{ fontSize: 13, color: F.inkSoft, marginTop: 4, display: 'block' }}>บอกอาการน้อง รับคำแนะนำก่อนพาไปหาหมอ — ใช้ฟรีทุกวัน</span>
          </div>
          <button
            className="btn-pink"
            style={{ background: F.pink, color: '#fff', padding: '12px 22px', borderRadius: 999, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(232,70,119,.25)', whiteSpace: 'nowrap' }}
            onClick={() => router.push('/service-hub')}
          >
            ลองเลย →
          </button>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, margin: '0 0 18px' }}>เริ่มต้นง่ายมาก</h2>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { n: '01', title: 'สมัครฟรี',       desc: 'สร้างบัญชีด้วยอีเมลหรือ Google ภายใน 1 นาที ไม่ต้องบัตรเครดิต' },
              { n: '02', title: 'เพิ่มน้องของคุณ',    desc: 'เพิ่มข้อมูลสัตว์เลี้ยง รูปภาพ วัคซีน และประวัติสุขภาพ' },
              { n: '03', title: 'ค้นหาและเชื่อมต่อ', desc: 'ค้นหาฟาร์ม คลินิก หรือบริการที่ต้องการ พร้อม GPS ใกล้ฉัน' },
            ].map(step => (
              <div key={step.n} style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 24, padding: 24 }}>
                <div style={{ width: 36, height: 36, background: F.pink, color: '#fff', borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, marginBottom: 14 }}>
                  {step.n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: F.ink }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.55, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIAL ──────────────────────────────────────────────── */}
        <section style={{ marginTop: 36, background: '#fff', border: `1px solid ${F.line}`, borderRadius: 24, padding: '36px 40px' }}>
          <p style={{ fontSize: 22, lineHeight: 1.5, color: F.ink, fontWeight: 500, letterSpacing: -0.2, margin: 0 }}>
            <span style={{ fontSize: 42, color: F.pink, lineHeight: 0, marginRight: 4, verticalAlign: '-0.15em' }}>"</span>
            Whiskora ช่วยให้ผมจัดการฟาร์มได้ง่ายขึ้นมาก ลูกค้าใหม่มาจากแพลตฟอร์มนี้เพิ่มขึ้นทุกเดือน
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <div style={{ width: 44, height: 44, background: F.pinkSoft, borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 800, color: F.pink, fontSize: 16 }}>
              ส
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>คุณสมชาย</div>
              <div style={{ fontSize: 12, color: F.muted }}>เจ้าของฟาร์มโกลเด้น · กรุงเทพฯ</div>
            </div>
          </div>
        </section>

        {/* ── PARTNER CTA ──────────────────────────────────────────────── */}
        <section
          className="partner-band"
          style={{ margin: '40px 0 60px', background: F.ink, color: '#fff', borderRadius: 24, padding: '36px 40px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', right: -80, bottom: -80, width: 280, height: 280, background: 'radial-gradient(circle, rgba(232,70,119,.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: F.pink, letterSpacing: 2, marginBottom: 10 }}>PARTNER WITH US</div>
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3, margin: '0 0 6px' }}>ร่วมเป็นพาร์ทเนอร์กับ Whiskora</h2>
            <p style={{ fontSize: 13, color: '#bdb0a2', margin: 0 }}>เปิดฟาร์ม ร้านค้า หรือคลินิกของคุณ — เข้าถึงลูกค้าหมื่นคน</p>
          </div>
          <button
            className="btn-pink"
            style={{ background: F.pink, color: '#fff', padding: '14px 24px', borderRadius: 999, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(232,70,119,.35)', position: 'relative', zIndex: 2, whiteSpace: 'nowrap' }}
            onClick={() => router.push('/partner')}
          >
            สมัครเลยฟรี →
          </button>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${F.line}`, padding: '40px 0 60px' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                <PawMark size={40} />
                <span style={{ color: F.pink }}>Whiskora</span>
              </div>
              <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.6, margin: 0 }}>
                ศูนย์กลางของทุกชีวิตสัตว์เลี้ยง — One platform, every pet life.
              </p>
            </div>
            {[
              { title: 'ผู้ใช้งาน',  links: [{ label: 'ค้นหาฟาร์ม', href: '/farm-hub' }, { label: 'จองคลินิก', href: '/service-hub' }, { label: 'Pet ID Card', href: '/profile/pets' }, { label: 'คอมมูนิตี้', href: '/community' }] },
              { title: 'พาร์ทเนอร์', links: [{ label: 'เปิดฟาร์ม', href: '/partner' }, { label: 'เปิดร้านค้า', href: '/partner' }, { label: 'Genesis Program', href: '/partner' }, { label: 'ราคา PRO', href: '/partner' }] },
              { title: 'บริษัท',     links: [{ label: 'เกี่ยวกับเรา', href: '/' }, { label: 'นโยบายความเป็นส่วนตัว', href: '/' }, { label: 'ข้อกำหนด', href: '/' }, { label: 'ติดต่อ', href: '/' }] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: F.muted, margin: '0 0 14px', fontWeight: 600 }}>{col.title}</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {col.links.map(l => (
                    <li key={l.label} style={{ marginBottom: 10 }}>
                      <Link href={l.href} className="footer-link" style={{ fontSize: 13, color: F.inkSoft, transition: 'color .15s' }}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${F.line}`, fontSize: 12, color: F.muted }}>
            <span>© 2026 Whiskora · Made in Bangkok</span>
            <span>PDPA compliant</span>
          </div>
        </footer>
      </div>
    </>
  );
}