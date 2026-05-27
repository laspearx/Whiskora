"use client";

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', cream: '#fffafc', paper: '#fdf0f3',
  line: '#f3dde3', muted: '#8e7e84', pink: '#e84677', pinkSoft: '#fde2ea',
  pinkDeep: '#c4325f', sky: '#5b8dc7', leaf: '#5a9065', sun: '#e8a63a', purple: '#7c5cbf',
};

const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Farm: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Shop: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Clinic: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Book: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Tool: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Community: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

export default function Home() {
  const router = useRouter();
  const t = useTranslations('home');

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

        {/* HERO */}
        <section style={{ padding: '36px 0 0' }}>
          <div className="hp-hero-inner" style={{ background: `linear-gradient(135deg,${F.pink} 0%,#f06d98 55%,#f8a5c2 100%)`, borderRadius: 28, padding: '52px 48px', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, minHeight: 340, boxShadow: '0 24px 48px rgba(232,70,119,.18)' }}>
            <div style={{ position:'absolute', top:-100, right:-60, width:360, height:360, background:'radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-80, left:-40, width:240, height:240, background:'radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div className="hp-hero-text" style={{ position:'relative', zIndex:2, flex:1, maxWidth:580 }}>
              <span style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:800, padding:'5px 14px', borderRadius:999, letterSpacing:1.5, border:'1px solid rgba(255,255,255,0.3)', display:'inline-block', marginBottom:20 }}>
                {t('heroBadge')}
              </span>
              <h1 style={{ fontSize:42, fontWeight:900, lineHeight:1.1, letterSpacing:-1.5, margin:'0 0 16px', color:'#fff' }}>
                {t('heroTitle1')}<br />
                <span style={{ color:'#fde2ea' }}>{t('heroTitle2')}</span>
              </h1>
              <p style={{ fontSize:15, lineHeight:1.6, opacity:.92, margin:'0 0 28px', maxWidth:420 }}>{t('heroSubtitle')}</p>
              <div className="hp-hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button className="hp-btn-dark" style={{ background:'#fff', color:F.pink, padding:'14px 26px', borderRadius:16, fontWeight:800, fontSize:15, border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)' }} onClick={() => router.push('/farm-hub')}>
                  {t('heroCta1')} <Icon.ArrowRight />
                </button>
                <button className="hp-btn-outline" style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', color:'#fff', padding:'14px 26px', borderRadius:16, fontWeight:700, fontSize:15, border:'1px solid rgba(255,255,255,0.35)', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/about')}>
                  {t('heroCta2')}
                </button>
              </div>
            </div>
            <div className="hp-hero-mockup float-anim" style={{ position:'relative', zIndex:2, flexShrink:0 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12, width:200 }}>
                {[
                  { icon:'🏡', label: t('badge1Label'), sub: t('badge1Sub') },
                  { icon:'🛒', label: t('badge2Label'), sub: t('badge2Sub') },
                  { icon:'🩺', label: t('badge3Label'), sub: t('badge3Sub') },
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

        {/* SEARCH */}
        <section style={{ padding:'20px 0 0' }}>
          <div className="hp-search-wrap" style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:`1px solid ${F.line}`, borderRadius:999, padding:'6px 6px 6px 20px', boxShadow:'0 2px 12px rgba(31,26,28,.04)', transition:'border-color .2s, box-shadow .2s' }}>
            <span style={{ color:F.muted, display:'flex', flexShrink:0 }}><Icon.Search /></span>
            <input type="text" placeholder={t('searchPlaceholder')} onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}` as any); }} />
            <button className="hp-btn-pink" style={{ background:F.pink, color:'#fff', padding:'10px 20px', borderRadius:999, fontWeight:600, fontSize:14, border:'none', cursor:'pointer', flexShrink:0, boxShadow:'0 4px 14px rgba(232,70,119,.25)' }}
              onClick={(e) => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); if (input?.value.trim()) router.push(`/search?q=${encodeURIComponent(input.value)}` as any); }}>
              {t('searchBtn')}
            </button>
          </div>
        </section>

        {/* QUICK ACCESS */}
        <section style={{ padding:'28px 0 0' }}>
          <div className="hp-quick-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 }}>
            {[
              { href:'/farm-hub' as const,      icon:<Icon.Farm />,      bg:F.pinkSoft, color:F.pink,   label:t('tileFarm') },
              { href:'/marketplace' as const,   icon:<Icon.Shop />,      bg:'#dbeafe',  color:F.sky,    label:t('tilePetMarket') },
              { href:'/service-hub' as const,   icon:<Icon.Clinic />,    bg:'#dcfce7',  color:F.leaf,   label:t('tileServices') },
              { href:'/community' as const,     icon:<Icon.Community />, bg:'#fef9c3',  color:F.sun,    label:t('tileCommunity') },
              { href:'/pet-knowledge' as const, icon:<Icon.Book />,      bg:'#ede9fe',  color:F.purple, label:t('tileKnowledge') },
              { href:'/pet-tools' as const,     icon:<Icon.Tool />,      bg:'#dcfce7',  color:F.leaf,   label:t('tileTools') },
            ].map(tile => (
              <Link key={tile.href} href={tile.href} className="hp-quick-tile" style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:18, padding:'18px 10px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:10, textDecoration:'none' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:tile.bg, display:'grid', placeItems:'center', color:tile.color }}>{tile.icon}</div>
                <span style={{ fontSize:13, fontWeight:600, color:F.ink }}>{tile.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="hp-section">
          <div className="hp-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {[
              { num:'1,200+', label:t('statFarms'),   emoji:'🏡' },
              { num:'5,000+', label:t('statPets'),    emoji:'🐾' },
              { num:'10+',    label:t('statSpecies'), emoji:'🦜' },
              { num:'100%',   label:t('statFree'),    emoji:'🎉' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:20, padding:'24px 20px', textAlign:'center' }}>
                <div style={{ fontSize:28 }}>{s.emoji}</div>
                <div style={{ fontSize:28, fontWeight:900, color:F.pink, letterSpacing:-1, marginTop:8 }}>{s.num}</div>
                <div style={{ fontSize:12, color:F.muted, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FARM SECTION */}
        <section className="hp-section">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.pink, marginBottom:6 }}>{t('farmLabel')}</div>
              <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5, margin:'0 0 8px' }}>{t('farmTitle')}</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:0, maxWidth:520, lineHeight:1.6 }}>{t('farmDesc')}</p>
            </div>
            <button className="hp-btn-pink" style={{ background:F.pink, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,70,119,.25)', display:'inline-flex', alignItems:'center', gap:8, flexShrink:0 }} onClick={() => router.push('/farm-hub')}>
              {t('farmCta')} <Icon.ArrowRight />
            </button>
          </div>
          <div className="hp-three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { emoji:'📋', title:t('farmCriteria1Title'), desc:t('farmCriteria1Desc'), tags:['ID', 'GPS'], color:F.pink, bg:F.pinkSoft },
              { emoji:'💉', title:t('farmCriteria2Title'), desc:t('farmCriteria2Desc'), tags:['Vaccine', 'Health'], color:F.leaf, bg:'#dcfce7' },
              { emoji:'🧬', title:t('farmCriteria3Title'), desc:t('farmCriteria3Desc'), tags:['CFA/TICA', 'Pedigree'], color:F.sky, bg:'#dbeafe' },
              { emoji:'🏠', title:t('farmCriteria4Title'), desc:t('farmCriteria4Desc'), tags:['Space', 'Clean'], color:F.sun, bg:'#fef9c3' },
              { emoji:'📞', title:t('farmCriteria5Title'), desc:t('farmCriteria5Desc'), tags:['Support', 'Reviews'], color:F.purple, bg:'#ede9fe' },
              { emoji:'⭐', title:t('farmCriteria6Title'), desc:t('farmCriteria6Desc'), tags:['Verified', 'Transparent'], color:F.sun, bg:'#fef9c3' },
            ].map(item => (
              <div key={item.title} className="hp-card" style={{ background:'#fff', border:`1px solid ${F.line}`, borderRadius:20, padding:24 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:item.bg, display:'grid', placeItems:'center', fontSize:22, marginBottom:14 }}>{item.emoji}</div>
                <h3 style={{ fontSize:15, fontWeight:700, margin:'0 0 8px', color:F.ink }}>{item.title}</h3>
                <p style={{ fontSize:13, color:F.inkSoft, lineHeight:1.6, margin:'0 0 12px' }}>{item.desc}</p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {item.tags.map(tag => <span key={tag} style={{ padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600, background:item.bg, color:item.color }}>{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MARKETPLACE BAND */}
        <section className="hp-section">
          <div className="hp-feature-band" style={{ background:`linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%)`, border:'1px solid #bfdbfe', borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-60, top:-60, width:200, height:200, background:'radial-gradient(circle,rgba(91,141,199,.15) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.sky, marginBottom:8 }}>{t('marketLabel')}</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:F.ink }}>{t('marketTitle')}</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>{t('marketDesc')}</p>
              <div className="hp-feature-band-btns" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button className="hp-btn-pink" style={{ background:F.sky, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(91,141,199,.3)', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/marketplace')}>
                  {t('marketCta')} <Icon.ArrowRight />
                </button>
                <button className="hp-btn-outline" style={{ background:'#fff', color:F.sky, padding:'12px 22px', borderRadius:14, fontWeight:600, fontSize:14, border:'1px solid #bfdbfe', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/farm-hub')}>
                  {t('marketCta2')}
                </button>
              </div>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>🛒</div>
          </div>
        </section>

        {/* SERVICES BAND */}
        <section className="hp-section">
          <div className="hp-feature-band" style={{ background:`linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)`, border:'1px solid #bbf7d0', borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-60, top:-60, width:200, height:200, background:'radial-gradient(circle,rgba(90,144,101,.15) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.leaf, marginBottom:8 }}>{t('serviceLabel')}</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:F.ink }}>{t('serviceTitle')}</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>{t('serviceDesc')}</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                {(t.raw('serviceTags') as string[]).map(s => (
                  <span key={s} style={{ padding:'5px 12px', background:'rgba(90,144,101,.1)', borderRadius:999, fontSize:12, fontWeight:600, color:F.leaf, display:'inline-flex', alignItems:'center', gap:4 }}>
                    <Icon.Check /> {s}
                  </span>
                ))}
              </div>
              <button className="hp-btn-pink" style={{ background:F.leaf, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(90,144,101,.3)', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/service-hub')}>
                {t('serviceCta')} <Icon.ArrowRight />
              </button>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>🩺</div>
          </div>
        </section>

        {/* PET ID CARD BAND */}
        <section className="hp-section">
          <div className="hp-feature-band" style={{ background:`linear-gradient(135deg,${F.pink} 0%,#f06d98 55%,#f8a5c2 100%)`, borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden', boxShadow:'0 16px 40px rgba(232,70,119,.15)' }}>
            <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, background:'radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'rgba(255,255,255,.8)', marginBottom:8 }}>{t('idCardLabel')}</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:'#fff' }}>{t('idCardTitle')}</h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,.9)', margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>{t('idCardDesc')}</p>
              <button className="hp-btn-outline" style={{ background:'#fff', color:F.pink, padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,.12)', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/pet-id-card')}>
                {t('idCardCta')}
              </button>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>🪪</div>
          </div>
        </section>

        {/* KNOWLEDGE & TOOLS */}
        <section className="hp-section">
          <div className="hp-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="hp-card" style={{ background:`linear-gradient(135deg,#ede9fe 0%,#f5f3ff 100%)`, border:'1px solid #ddd6fe', borderRadius:24, padding:'32px 28px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-30, bottom:-30, fontSize:80, opacity:.15 }}>📚</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.purple, marginBottom:8 }}>{t('knowledgeLabel')}</div>
              <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 8px', color:F.ink }}>{t('knowledgeTitle')}</h3>
              <p style={{ fontSize:13, color:F.inkSoft, lineHeight:1.6, margin:'0 0 20px' }}>{t('knowledgeDesc')}</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
                {(t.raw('knowledgeTags') as string[]).map(tag => <span key={tag} style={{ padding:'4px 10px', background:'rgba(124,92,191,.1)', borderRadius:999, fontSize:11, fontWeight:600, color:F.purple }}>{tag}</span>)}
              </div>
              <button className="hp-btn-pink" style={{ background:F.purple, color:'#fff', padding:'11px 20px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(124,92,191,.3)', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/pet-knowledge')}>
                {t('knowledgeCta')} <Icon.ArrowRight />
              </button>
            </div>
            <div className="hp-card" style={{ background:`linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)`, border:'1px solid #bbf7d0', borderRadius:24, padding:'32px 28px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-30, bottom:-30, fontSize:80, opacity:.15 }}>🔧</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.leaf, marginBottom:8 }}>{t('toolsLabel')}</div>
              <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 8px', color:F.ink }}>{t('toolsTitle')}</h3>
              <p style={{ fontSize:13, color:F.inkSoft, lineHeight:1.6, margin:'0 0 20px' }}>{t('toolsDesc')}</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
                {(t.raw('toolsTags') as string[]).map(tag => <span key={tag} style={{ padding:'4px 10px', background:'rgba(90,144,101,.1)', borderRadius:999, fontSize:11, fontWeight:600, color:F.leaf }}>{tag}</span>)}
              </div>
              <button className="hp-btn-pink" style={{ background:F.leaf, color:'#fff', padding:'11px 20px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(90,144,101,.3)', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/pet-tools')}>
                {t('toolsCta')} <Icon.ArrowRight />
              </button>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="hp-section">
          <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 20px' }}>{t('howTitle')}</h2>
          <div className="hp-three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { n:'01', title:t('step1Title'), desc:t('step1Desc'), emoji:'🔑' },
              { n:'02', title:t('step2Title'), desc:t('step2Desc'), emoji:'🐾' },
              { n:'03', title:t('step3Title'), desc:t('step3Desc'), emoji:'🗺️' },
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

        {/* MEMBER FEATURES */}
        <section className="hp-section">
          <div style={{ background:`linear-gradient(135deg,${F.pink} 0%,#f06d98 55%,#f8a5c2 100%)`, borderRadius:28, overflow:'hidden', position:'relative', padding:'48px 44px', boxShadow:'0 20px 48px rgba(232,70,119,.16)' }}>
            <div style={{ position:'absolute', top:-80, right:-60, width:320, height:320, background:'radial-gradient(circle,rgba(255,255,255,.18) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-60, left:-40, width:200, height:200, background:'radial-gradient(circle,rgba(255,255,255,.1) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'relative', zIndex:2, marginBottom:36, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                <span style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:800, padding:'5px 14px', borderRadius:999, letterSpacing:1.5, border:'1px solid rgba(255,255,255,0.3)', display:'inline-block', marginBottom:14, color:'#fff' }}>
                  {t('memberBadge')}
                </span>
                <h2 style={{ fontSize:28, fontWeight:900, letterSpacing:-0.5, margin:0, color:'#fff', lineHeight:1.2 }}>{t('memberTitle')}</h2>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.85)', margin:'10px 0 0', maxWidth:440, lineHeight:1.6 }}>{t('memberSubtitle')}</p>
              </div>
              <button className="hp-btn-outline" style={{ background:'#fff', color:F.pink, padding:'13px 24px', borderRadius:14, fontWeight:800, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,.12)', display:'inline-flex', alignItems:'center', gap:8, flexShrink:0 }} onClick={() => router.push('/register')}>
                {t('memberCta')}
              </button>
            </div>
            <div className="hp-two-col" style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
              {[
                { emoji:'🐾', title:t('member1Title'), desc:t('member1Desc') },
                { emoji:'🪪', title:t('member2Title'), desc:t('member2Desc') },
                { emoji:'💉', title:t('member3Title'), desc:t('member3Desc') },
                { emoji:'💰', title:t('member4Title'), desc:t('member4Desc') },
                { emoji:'🧬', title:t('member5Title'), desc:t('member5Desc') },
                { emoji:'📂', title:t('member6Title'), desc:t('member6Desc') },
              ].map(f => (
                <div key={f.title} style={{ background:'rgba(255,255,255,0.14)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.22)', borderRadius:18, padding:'20px 22px', display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ fontSize:28, flexShrink:0, marginTop:2 }}>{f.emoji}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#fff', marginBottom:6 }}>{f.title}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', lineHeight:1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNER BENEFITS */}
        <section className="hp-section">
          <div style={{ background:F.ink, borderRadius:28, overflow:'hidden', position:'relative', padding:'48px 44px' }}>
            <div style={{ position:'absolute', top:-80, left:-60, width:320, height:320, background:'radial-gradient(circle,rgba(232,70,119,.2) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-60, right:-40, width:240, height:240, background:'radial-gradient(circle,rgba(91,141,199,.15) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'relative', zIndex:2, marginBottom:36, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                <span style={{ background:'rgba(232,70,119,0.25)', fontSize:10, fontWeight:800, padding:'5px 14px', borderRadius:999, letterSpacing:1.5, border:'1px solid rgba(232,70,119,0.4)', display:'inline-block', marginBottom:14, color:F.pink }}>
                  {t('partnerBadge')}
                </span>
                <h2 style={{ fontSize:28, fontWeight:900, letterSpacing:-0.5, margin:0, color:'#fff', lineHeight:1.2 }}>
                  {t('partnerTitle1')}<br /><span style={{ color:F.pink }}>{t('partnerTitle2')}</span>
                </h2>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.7)', margin:'10px 0 0', maxWidth:440, lineHeight:1.6 }}>{t('partnerSubtitle')}</p>
              </div>
              <button className="hp-btn-pink" style={{ background:F.pink, color:'#fff', padding:'13px 24px', borderRadius:14, fontWeight:800, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,70,119,.4)', display:'inline-flex', alignItems:'center', gap:8, flexShrink:0, position:'relative', zIndex:2 }} onClick={() => router.push('/partner')}>
                {t('partnerCta')}
              </button>
            </div>
            <div className="hp-three-col" style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                { emoji:'👥', title:t('partner1Title'), desc:t('partner1Desc') },
                { emoji:'📊', title:t('partner2Title'), desc:t('partner2Desc') },
                { emoji:'🆓', title:t('partner3Title'), desc:t('partner3Desc') },
                { emoji:'🏅', title:t('partner4Title'), desc:t('partner4Desc') },
                { emoji:'📣', title:t('partner5Title'), desc:t('partner5Desc') },
                { emoji:'🤝', title:t('partner6Title'), desc:t('partner6Desc') },
              ].map(b => (
                <div key={b.title} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:'22px 20px' }}>
                  <div style={{ fontSize:28, marginBottom:12 }}>{b.emoji}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#fff', marginBottom:6 }}>{b.title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.65)', lineHeight:1.65 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY BAND */}
        <section className="hp-section">
          <div className="hp-feature-band" style={{ background:`linear-gradient(135deg,#fef9c3 0%,#fffbeb 100%)`, border:'1px solid #fde68a', borderRadius:24, padding:'36px 40px', display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:F.sun, marginBottom:8 }}>{t('communityLabel')}</div>
              <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:-0.3, margin:'0 0 8px', color:F.ink }}>{t('communityTitle')}</h2>
              <p style={{ fontSize:14, color:F.inkSoft, margin:'0 0 20px', maxWidth:460, lineHeight:1.6 }}>{t('communityDesc')}</p>
              <button className="hp-btn-pink" style={{ background:F.sun, color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,166,58,.3)', display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/community')}>
                {t('communityCta')} <Icon.ArrowRight />
              </button>
            </div>
            <div className="hp-feature-band-img float-anim" style={{ fontSize:96 }}>👥</div>
          </div>
        </section>

        {/* PARTNER CTA */}
        <section style={{ padding:'48px 0 0' }}>
          <div className="hp-feature-band" style={{ background:F.ink, color:'#fff', borderRadius:24, padding:'40px 44px', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-80, bottom:-80, width:280, height:280, background:'radial-gradient(circle,rgba(232,70,119,.25) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div>
              <div style={{ fontSize:11, color:F.pink, letterSpacing:2, marginBottom:10, fontWeight:700 }}>{t('partnerCtaLabel')}</div>
              <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.3, margin:'0 0 6px' }}>{t('partnerCtaTitle')}</h2>
              <p style={{ fontSize:13, color:'#bdb0a2', margin:'0 0 24px' }}>{t('partnerCtaDesc')}</p>
              <div className="hp-feature-band-btns" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button className="hp-btn-pink" style={{ background:F.pink, color:'#fff', padding:'13px 24px', borderRadius:14, fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(232,70,119,.35)', position:'relative', zIndex:2, display:'inline-flex', alignItems:'center', gap:8 }} onClick={() => router.push('/partner')}>
                  {t('partnerCtaCta1')} <Icon.ArrowRight />
                </button>
                <button className="hp-btn-outline" style={{ background:'transparent', color:'#e5e7eb', padding:'13px 24px', borderRadius:14, fontWeight:600, fontSize:14, border:'1px solid rgba(255,255,255,.2)', cursor:'pointer', position:'relative', zIndex:2 }} onClick={() => router.push('/about')}>
                  {t('partnerCtaCta2')}
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
