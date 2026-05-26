"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── CI Design tokens ────────────────────────────────────────────────────────
const F = {
  ink:      '#1f1a1c',
  inkSoft:  '#4a3f44',
  cream:    '#fffafc',
  paper:    '#fdf0f3',
  line:     '#f3dde3',
  muted:    '#8e7e84',
  pink:     '#e84677',
  pinkSoft: '#fde2ea',
  pinkDeep: '#c4325f',
  sky:      '#5b8dc7',
  leaf:     '#5a9065',
  sun:      '#e8a63a',
  purple:   '#7c5cbf',
};

// ─── Static sample farm data ─────────────────────────────────────────────────
const FARMS = [
  { id: '1', name: 'ฟาร์มน้องเหมียว',  loc: 'กรุงเทพฯ',    rating: 4.9, breed: 'แมวเปอร์เซีย',       certs: ['CFA'] },
  { id: '2', name: 'The Paws Bangkok',  loc: 'นนทบุรี',      rating: 4.8, breed: 'โกลเด้น รีทรีฟเวอร์', certs: ['TICA'] },
  { id: '3', name: 'Siam Feline',       loc: 'กรุงเทพฯ',    rating: 5.0, breed: 'แมววิเชียรมาศ',       certs: ['CFA'] },
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icon = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Farm: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Shop: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Clinic: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  IdCard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="8" cy="12" r="2"/>
      <path d="M14 10h4"/><path d="M14 14h4"/>
    </svg>
  ),
  Book: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Tool: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Community: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Partner: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Heart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @keyframes float-anim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float-anim { animation: float-anim 6s ease-in-out infinite; }

        .hp-card { transition: transform .2s, box-shadow .2s; }
        .hp-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(31,26,28,.08); }

        .hp-btn-pink { transition: background .15s, transform .15s, box-shadow .15s; }
        .hp-btn-pink:hover { background: #c4325f !important; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(232,70,119,.35) !important; }

        .hp-btn-outline { transition: all .15s; }
        .hp-btn-outline:hover { background: #fde2ea !important; color: #c4325f !important; }

        .hp-btn-dark { transition: all .15s; }
        .hp-btn-dark:hover { background: #2e2228 !important; transform: translateY(-1px); }

        .hp-quick-tile { transition: all .2s; }
        .hp-quick-tile:hover { border-color: #e84677 !important; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(31,26,28,.06); }

        .hp-farm-card { transition: transform .2s, box-shadow .2s; cursor: pointer; }
        .hp-farm-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(31,26,28,.08); }

        .hp-fav:hover { color: #e84677 !important; }
        .hp-see-all:hover { color: #c4325f !important; }

        .hp-search-wrap:focus-within { border-color: #e84677 !important; box-shadow: 0 2px 16px rgba(232,70,119,.15) !important; }
        .hp-search-wrap input { border:none; outline:none; background:transparent; width:100%; font-size:15px; color:#1f1a1c; padding:12px 0; }
        .hp-search-wrap input::placeholder { color:#8e7e84; }

        .hp-section { padding: 48px 0 0; }

        @media (max-width: 900px) {
          .hp-hero-inner { flex-direction: column !important; text-align: center; }
          .hp-hero-text p { margin-left:auto !important; margin-right:auto !important; }
          .hp-hero-btns { justify-content: center !important; }
          .hp-hero-mockup { display: none; }
          .hp-two-col { grid-template-columns: 1fr !important; }
          .hp-three-col { grid-template-columns: repeat(2,1fr) !important; }
          .hp-feature-band { grid-template-columns: 1fr !important; text-align: center; }
          .hp-feature-band-img { display:none; }
          .hp-feature-band-btns { justify-content: center !important; }
          .hp-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 600px) {
          .hp-three-col { grid-template-columns: 1fr !important; }
          .hp-quick-grid { grid-template-columns: repeat(3,1fr) !important; }
          .hp-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={{ color: F.ink, fontFamily: 'var(--font-ui)', paddingBottom: 80 }}>

        {/* ══════════════════════════════════════════════════════ HERO */}
        <section style={{ padding: '36px 0 0' }}>
          <div
            className="hp-hero-inner"
            style={{
              background: `linear-gradient(135deg, ${F.pink} 0%, #f06d98 55%, #f8a5c2 100%)`,
              borderRadius: 28, padding: '52px 48px', color: '#fff', position: 'relative',
              overflow: 'hidden', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 32, minHeight: 340,
              boxShadow: '0 24px 48px rgba(232,70,119,.18)',
            }}
          >
            {/* blobs */}
            <div style={{ position:'absolute', top:-100, right:-60, width:360, height:360, background:'radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-80, left:-40, width:240, height:240, background:'radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 70%)', pointerEvents:'none' }} />

            {/* Text */}
            <div className="hp-hero-text" style={{ position:'relative', zIndex:2, flex:1, maxWidth:580 }}>
              <span style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:800, padding:'5px 14px', borderRadius:999, letterSpacing:1.5, border:'1px solid rgba(255,255,255,0.3)', display:'inline-block', marginBottom:20 }}>
                🐾 WHISKORA PLATFORM
              </span>
              <h1 style={{ fontSize:42, fontWeight:900, lineHeight:1.1, letterSpacing:-1.5, margin:'0 0 16px', color:'#fff' }}>
                ศูนย์กลางทุกชีวิต<br />
                <span style={{ color:'#fde2ea' }}>สัตว์เลี้ยง ในที่เดียว</span>
              </h1>
              <p style={{ fontSize:15, lineHeight:1.6, opacity:.92, margin:'0 0 28px', maxWidth:420 }}>
                ค้นหาฟาร์มคุณภาพ จองคลินิก ช้อปเพ็ทช็อป และดูแลน้องๆ ครบจบที่เดียว — ฟรีตลอดชีพ
              </p>
              <div className="hp-hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button
                  className="hp-btn-dark"
                  style={{ background:'#fff', color:F.pink, padding:'14px 26px', borderRadius:16, fontWeight:800, fontSize:15, border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)' }}
                  onClick={() => router.push('/farm-hub')}
                >
                  ค้นหาฟาร์ม <Icon.ArrowRight />
                </button>
                <button
                  className="hp-btn-outline"
                  style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', color:'#fff', padding:'14px 26px', borderRadius:16, fontWeight:700, fontSize:15, border:'1px solid rgba(255,255,255,0.35)', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }}
                  onClick={() => router.push('/about')}
                >
                  รู้จัก Whiskora
                </button>
              </div>
            </div>

            {/* Floating badge stack */}
            <div className="hp-hero-mockup float-anim" style={{ position:'relative', zIndex:2, flexShrink:0 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12, width:200 }}>
                {[
                  { icon:'🏡', label:'ฟาร์มคุณภาพ',     sub:'1,200+ แห่ง', color:'#fff' },
                  { icon:'🛒', label:'ตลาดสัตว์เลี้ยง', sub:'5,000+ รายการ', color:'#fff' },
                  { icon:'🩺', label:'คลินิก & บริการ',  sub:'จองได้ทันที', color:'#fff' },
                ].map(b => (
                  <div key={b.label} style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:24 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'#fff' }}>{b.label}</div>
                      <div style={{ fontSize:11, opacity:.8, color:'#fff' }}>{b.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ SEARCH */}
        <section style={{ padding:'20px 0 0' }}>
          <div
            className="hp-search-wrap"
            style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:`1px solid ${F.line}`, borderRadius:999, padding:'6px 6px 6px 20px', boxShadow:'0 2px 12px rgba(31,26,28,.04)', transition:'border-color .2s, box-shadow .2s' }}
          >
            <span style={{ color:F.muted, display:'flex', flexShrink:0 }}><Icon.Search /></span>
            <input
              type="text"
              placeholder="ค้นหาฟาร์ม สายพันธุ์ หรือบริการ..."
              onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}`); }}
            />
            <button
              className="hp-btn-pink"
              style={{ background:F.pink, color:'#fff', padding:'10px 20px', borderRadius:999, fontWeight:600, fontSize:14, border:'none', cursor:'pointer', flexShrink:0, boxShadow:'0 4px 14px rgba(232,70,119,.25)' }}
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                if (input?.value.trim()) router.push(`/search?q=${encodeURIComponent(input.value)}`);
              }}
            >
              ค้นหา
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ QUICK ACCESS */}
        <section style={{ padding:'28px 0 0' }}>
          <div
            className="hp-quick-grid"
            style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 }}
          >
            {[
              { href:'/farm-hub',      icon:<Icon.Farm />,      bg:F.pinkSoft, color:F.pink,   label:'ฟาร์ม' },
              { href:'/marketplace',   icon:<Icon.Shop />,      bg:'#dbeafe',  color:F.sky,    label:'ตลาดสัตว์' },
              { href:'/service-hub',   icon:<Icon.Clinic />,    bg:'#dcfce7',  color:F.leaf,   label:'บริการ' },
              { href:'/community',     icon:<Icon.Community />, bg:'#fef9c3',  color:F.sun,    label:'คอมมูนิตี้' },
              { href:'/pet-knowledge', icon:<Icon.Book />,      bg:'#ede9fe',  color:F.purple, label:'ความรู้' },
              { href:'/pet-tools',     icon:<Icon.Tool />,      bg:'#dcfce7',  color:F.leaf,   label:'Tools' },
            ].map(t => (
              <Link
                key={t.href}
                href={t.href}
                className="hp-quick-tile"
                style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:18, padding:'18px 10px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:10, textDecoration:'none' }}
              >
                <div style={{ width:44, height:44, borderRadius:14, background:t.bg, display:'grid', placeItems:'center', color:t.color }}>
                  {t.icon}
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:F.ink }}>{t.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ STATS */}
        <section className="hp-section">
          <div
            className="hp-stats-grid"
            style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}
          >
            {[
              { num:'1,200+', label:'ฟาร์มคุณภาพ', emoji:'🏡' },
              { num:'5,000+', label:'สัตว์เลี้ยงที่ลงทะเบียน', emoji:'🐾' },
              { num:'10+',    label:'ประเภทสัตว์',  emoji:'🦜' },
              { num:'100%',   label:'ฟรีสำหรับผู้เลี้ยง', emoji:'🎉' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:20, padding:'24px 20px', textAlign:'center' }}>
                <div style={{ fontSize:28 }}>{s.emoji}</div>
                <div style={{ fontSize:28, fontWeight:900, color:F.pink, letterSpacing:-1, marginTop:8 }}>{s.num}</div>
                <div style={{ fontSize:12, color:F.muted, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ FARM SECTION */}
        <section className="hp-section">
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.pink, marginBottom:6 }}>FARM HUB</div>
              <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5, margin:0 }}>ฟาร์มสัตว์เลี้ยงคุณภาพ</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'6px 0 0' }}>รับรองมาตรฐาน มีใบเซอร์ ดูแลโดยผู้เชี่ยวชาญ</p>
            </div>
            <Link href="/farm-hub" className="hp-see-all" style={{ fontSize:13, color:F.pink, fontWeight:600, transition:'color .15s', whiteSpace:'nowrap' }}>ดูทั้งหมด →</Link>
          </div>

          {/* Farm cards */}
          <div className="hp-three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {FARMS.map(farm => (
              <div
                key={farm.id}
                className="hp-farm-card"
                style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:20, overflow:'hidden' }}
                onClick={() => router.push(`/farm/${farm.id}`)}
              >
                <div style={{ height:160, background:`repeating-linear-gradient(135deg,${F.paper} 0 10px,#fff 10px 20px)`, display:'grid', placeItems:'center', position:'relative' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:F.muted, letterSpacing:1.5 }}>FARM PHOTO</span>
                  <button
                    className="hp-fav"
                    style={{ position:'absolute', top:12, right:12, width:34, height:34, background:'rgba(255,255,255,.95)', borderRadius:999, border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:F.muted, transition:'color .15s' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon.Heart />
                  </button>
                </div>
                <div style={{ padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15 }}>{farm.name}</div>
                      <div style={{ fontSize:12, color:F.muted, marginTop:3 }}>{farm.loc} · {farm.breed}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, display:'inline-flex', alignItems:'center', gap:3, color:F.sun, flexShrink:0 }}>
                      <Icon.Star /> {farm.rating}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                    <span style={{ padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:700, background:'rgba(90,144,101,.12)', color:F.leaf }}>✓ ยืนยันแล้ว</span>
                    {farm.certs.map(c => (
                      <span key={c} style={{ padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:600, background:F.paper, color:F.inkSoft }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop:20, textAlign:'center' }}>
            <button
              className="hp-btn-pink"
              style={{ background:F.pink, color:'#fff', padding:'13px 28px', borderRadius:16, fontWeight:700, fontSize:15, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,70,119,.25)', display:'inline-flex', alignItems:'center', gap:8 }}
              onClick={() => router.push('/farm-hub')}
            >
              ดูฟาร์มทั้งหมด <Icon.ArrowRight />
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ MARKETPLACE BAND */}
        <section className="hp-section">
          <div
            className="hp-feature-band"
            style={{ background:`linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%)`, border:'1px solid #bfdbfe', borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden' }}
          >
            <div style={{ position:'absolute', right:-60, top:-60, width:200, height:200, background:'radial-gradient(circle,rgba(91,141,199,.15) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.sky, marginBottom:8 }}>MARKETPLACE</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:F.ink }}>ตลาดสัตว์เลี้ยงออนไลน์</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>
                ซื้อขายสัตว์เลี้ยงจากผู้ขายที่ผ่านการตรวจสอบ มีระบบรับประกัน พร้อมเอกสารสายพันธุ์ครบถ้วน
              </p>
              <div className="hp-feature-band-btns" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button
                  className="hp-btn-pink"
                  style={{ background:F.sky, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(91,141,199,.3)', display:'inline-flex', alignItems:'center', gap:8 }}
                  onClick={() => router.push('/marketplace')}
                >
                  เข้าสู่ตลาด <Icon.ArrowRight />
                </button>
                <button
                  className="hp-btn-outline"
                  style={{ background:'#fff', color:F.sky, padding:'12px 22px', borderRadius:14, fontWeight:600, fontSize:14, border:'1px solid #bfdbfe', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }}
                  onClick={() => router.push('/farm-hub')}
                >
                  ค้นหาฟาร์ม
                </button>
              </div>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>🛒</div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ SERVICES BAND */}
        <section className="hp-section">
          <div
            className="hp-feature-band"
            style={{ background:`linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)`, border:'1px solid #bbf7d0', borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden' }}
          >
            <div style={{ position:'absolute', right:-60, top:-60, width:200, height:200, background:'radial-gradient(circle,rgba(90,144,101,.15) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.leaf, marginBottom:8 }}>SERVICE HUB</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:F.ink }}>คลินิก & บริการสัตว์เลี้ยง</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>
                จองนัดคลินิก ฝากเลี้ยง กรูมมิ่ง ฝึก และอื่นๆ อีกมากมาย รีวิวจริงจากผู้ใช้จริง
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                {['คลินิกสัตว์','กรูมมิ่ง','ฝากเลี้ยง','ฝึกสัตว์'].map(s => (
                  <span key={s} style={{ padding:'5px 12px', background:'rgba(90,144,101,.1)', borderRadius:999, fontSize:12, fontWeight:600, color:F.leaf, display:'inline-flex', alignItems:'center', gap:4 }}>
                    <Icon.Check /> {s}
                  </span>
                ))}
              </div>
              <button
                className="hp-btn-pink"
                style={{ background:F.leaf, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(90,144,101,.3)', display:'inline-flex', alignItems:'center', gap:8 }}
                onClick={() => router.push('/service-hub')}
              >
                ดูบริการทั้งหมด <Icon.ArrowRight />
              </button>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>🩺</div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ PET ID CARD BAND */}
        <section className="hp-section">
          <div
            className="hp-feature-band"
            style={{ background:`linear-gradient(135deg,${F.pink} 0%,#f06d98 55%,#f8a5c2 100%)`, borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden', boxShadow:'0 16px 40px rgba(232,70,119,.15)' }}
          >
            <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, background:'radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'rgba(255,255,255,.8)', marginBottom:8 }}>PET ID CARD</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:'#fff' }}>บัตรประจำตัวสัตว์เลี้ยง</h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,.9)', margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>
                สร้างบัตรดิจิทัลสวยงาม พร้อม QR Code ประวัติสุขภาพ สายพันธุ์ และชื่อน้อง แชร์ได้ทุกโซเชียล
              </p>
              <button
                className="hp-btn-outline"
                style={{ background:'#fff', color:F.pink, padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,.12)', display:'inline-flex', alignItems:'center', gap:8 }}
                onClick={() => router.push('/pet-id-card')}
              >
                สร้างบัตรฟรี 🪪
              </button>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>🪪</div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ KNOWLEDGE & TOOLS */}
        <section className="hp-section">
          <div className="hp-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Knowledge */}
            <div
              className="hp-card"
              style={{ background:`linear-gradient(135deg,#ede9fe 0%,#f5f3ff 100%)`, border:'1px solid #ddd6fe', borderRadius:24, padding:'32px 28px', position:'relative', overflow:'hidden' }}
            >
              <div style={{ position:'absolute', right:-30, bottom:-30, fontSize:80, opacity:.15 }}>📚</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.purple, marginBottom:8 }}>PET KNOWLEDGE</div>
              <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 8px', color:F.ink }}>ความรู้สัตว์เลี้ยง</h3>
              <p style={{ fontSize:13, color:F.inkSoft, lineHeight:1.6, margin:'0 0 20px' }}>
                บทความโภชนาการ สุขภาพ พฤติกรรม และพันธุกรรม สำหรับแมว หมา และสัตว์ exotic
              </p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
                {['สุขภาพ','โภชนาการ','พฤติกรรม','พันธุกรรม'].map(t => (
                  <span key={t} style={{ padding:'4px 10px', background:'rgba(124,92,191,.1)', borderRadius:999, fontSize:11, fontWeight:600, color:F.purple }}>{t}</span>
                ))}
              </div>
              <button
                className="hp-btn-pink"
                style={{ background:F.purple, color:'#fff', padding:'11px 20px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(124,92,191,.3)', display:'inline-flex', alignItems:'center', gap:8 }}
                onClick={() => router.push('/pet-knowledge')}
              >
                อ่านบทความ <Icon.ArrowRight />
              </button>
            </div>

            {/* Tools */}
            <div
              className="hp-card"
              style={{ background:`linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)`, border:'1px solid #bbf7d0', borderRadius:24, padding:'32px 28px', position:'relative', overflow:'hidden' }}
            >
              <div style={{ position:'absolute', right:-30, bottom:-30, fontSize:80, opacity:.15 }}>🔧</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.leaf, marginBottom:8 }}>PET TOOLS</div>
              <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 8px', color:F.ink }}>เครื่องมือสำหรับผู้เลี้ยง</h3>
              <p style={{ fontSize:13, color:F.inkSoft, lineHeight:1.6, margin:'0 0 20px' }}>
                คำนวณอายุเทียบมนุษย์ วันคลอด แคลอรีประจำวัน และน้ำหนักมาตรฐานตามสายพันธุ์
              </p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
                {['อายุ','วันคลอด','แคลอรี','น้ำหนัก'].map(t => (
                  <span key={t} style={{ padding:'4px 10px', background:'rgba(90,144,101,.1)', borderRadius:999, fontSize:11, fontWeight:600, color:F.leaf }}>{t}</span>
                ))}
              </div>
              <button
                className="hp-btn-pink"
                style={{ background:F.leaf, color:'#fff', padding:'11px 20px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(90,144,101,.3)', display:'inline-flex', alignItems:'center', gap:8 }}
                onClick={() => router.push('/pet-tools')}
              >
                เปิดใช้งาน <Icon.ArrowRight />
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ HOW IT WORKS */}
        <section className="hp-section">
          <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 20px' }}>เริ่มต้นง่ายมาก</h2>
          <div className="hp-three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { n:'01', title:'สมัครฟรี',            desc:'สร้างบัญชีด้วยอีเมลหรือ Google ภายใน 1 นาที ไม่ต้องบัตรเครดิต', emoji:'🔑' },
              { n:'02', title:'เพิ่มสัตว์เลี้ยง',    desc:'เพิ่มข้อมูลน้องๆ รูปภาพ วัคซีน และประวัติสุขภาพ', emoji:'🐾' },
              { n:'03', title:'ค้นหา & เชื่อมต่อ',   desc:'ค้นหาฟาร์ม คลินิก หรือบริการที่ต้องการ พร้อม GPS', emoji:'🗺️' },
            ].map(s => (
              <div key={s.n} style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:24, padding:28 }}>
                <div style={{ fontSize:32, marginBottom:14 }}>{s.emoji}</div>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:F.pink, marginBottom:8 }}>STEP {s.n}</div>
                <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 8px', color:F.ink }}>{s.title}</h3>
                <p style={{ fontSize:13, color:F.inkSoft, lineHeight:1.6, margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ COMMUNITY BAND */}
        <section className="hp-section">
          <div
            className="hp-feature-band"
            style={{ background:`linear-gradient(135deg,#fef9c3 0%,#fffbeb 100%)`, border:'1px solid #fde68a', borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden' }}
          >
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.sun, marginBottom:8 }}>COMMUNITY</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:F.ink }}>ชุมชนคนรักสัตว์</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>
                แชร์ประสบการณ์ ขอคำแนะนำ และพบปะเพื่อนคนรักสัตว์เลี้ยงในชุมชนออนไลน์ของเรา
              </p>
              <button
                className="hp-btn-pink"
                style={{ background:F.sun, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,166,58,.3)', display:'inline-flex', alignItems:'center', gap:8 }}
                onClick={() => router.push('/community')}
              >
                เข้าร่วมชุมชน <Icon.ArrowRight />
              </button>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>👥</div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ PARTNER CTA */}
        <section style={{ padding:'48px 0 0' }}>
          <div
            className="hp-feature-band"
            style={{ background:F.ink, color:'#fff', borderRadius:24, padding:'40px 44px', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center', position:'relative', overflow:'hidden' }}
          >
            <div style={{ position:'absolute', right:-80, bottom:-80, width:280, height:280, background:'radial-gradient(circle,rgba(232,70,119,.25) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, color:F.pink, letterSpacing:2, marginBottom:10, fontWeight:700 }}>PARTNER WITH US</div>
              <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.3, margin:'0 0 6px' }}>ร่วมเป็นพาร์ทเนอร์กับ Whiskora</h2>
              <p style={{ fontSize:13, color:'#bdb0a2', margin:'0 0 24px' }}>เปิดฟาร์ม ร้านค้า หรือคลินิกของคุณ — เข้าถึงลูกค้าหมื่นคน ฟรีในช่วง Genesis Program</p>
              <div className="hp-feature-band-btns" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button
                  className="hp-btn-pink"
                  style={{ background:F.pink, color:'#fff', padding:'13px 24px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,70,119,.35)', position:'relative', zIndex:2, display:'inline-flex', alignItems:'center', gap:8 }}
                  onClick={() => router.push('/partner')}
                >
                  สมัครเลยฟรี <Icon.ArrowRight />
                </button>
                <button
                  className="hp-btn-outline"
                  style={{ background:'transparent', color:'#e5e7eb', padding:'13px 24px', borderRadius:14, fontWeight:600, fontSize:14, border:'1px solid rgba(255,255,255,.2)', cursor:'pointer', position:'relative', zIndex:2 }}
                  onClick={() => router.push('/about')}
                >
                  เรียนรู้เพิ่มเติม
                </button>
              </div>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:80, position:'relative', zIndex:2 }}>🤝</div>
          </div>
        </section>

      </div>
    </>
  );
}
