"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8',
  cream: '#fffafc', paper: '#fdf0f3', line: '#f3dde3', lineMid: '#E5E7EB',
};

type CardTheme = {
  id: string; name: string; caption: string;
  bg: string; accent: string; accent2: string;
  border: string; soft: string; petIdBg: string;
  preview: string; shadow: string;
};

type PetRecord = {
  id: string | number; pet_code?: string | null; name?: string | null;
  breed?: string | null; color?: string | null; birth_date?: string | null;
  blood_type?: string | null; is_neutered?: boolean | null;
  gender?: string | null; image_url?: string | null;
  user_id?: string | null; farm_id?: string | null;
};

const CARD_THEME_STORAGE_KEY = 'whiskora.pet-id-card-theme';

const CARD_THEMES: CardTheme[] = [
  { id: 'whiskora-pink', name: 'Whiskora Pink', caption: 'Official',
    bg: '/id-card/pet-id-card-bg-whiskora-pink-v1.png',
    accent: '#E84677', accent2: '#F472B6', border: '#FBCFE8', soft: '#FDF2F5',
    petIdBg: 'linear-gradient(135deg, #E84677 0%, #F472B6 100%)',
    preview: 'linear-gradient(135deg, #fff8fb 0%, #fbcfe8 100%)',
    shadow: '0 24px 64px rgba(232,70,119,0.22)' },
  { id: 'soft-blue', name: 'Soft Blue', caption: 'Calm',
    bg: '/id-card/pet-id-card-bg-soft-blue-v1.png',
    accent: '#388BD6', accent2: '#77BDF2', border: '#BFDBFE', soft: '#EFF6FF',
    petIdBg: 'linear-gradient(135deg, #388BD6 0%, #77BDF2 100%)',
    preview: 'linear-gradient(135deg, #f8fcff 0%, #bfdbfe 100%)',
    shadow: '0 24px 64px rgba(56,139,214,0.20)' },
  { id: 'mint-care', name: 'Mint Care', caption: 'Clean',
    bg: '/id-card/pet-id-card-bg-mint-care-v1.png',
    accent: '#149B85', accent2: '#5ED4BC', border: '#B7F0DF', soft: '#ECFDF8',
    petIdBg: 'linear-gradient(135deg, #149B85 0%, #5ED4BC 100%)',
    preview: 'linear-gradient(135deg, #f8fffd 0%, #b7f0df 100%)',
    shadow: '0 24px 64px rgba(20,155,133,0.19)' },
  { id: 'lavender-premium', name: 'Lavender', caption: 'Premium',
    bg: '/id-card/pet-id-card-bg-lavender-premium-v1.png',
    accent: '#8E5FCD', accent2: '#C8A7F5', border: '#DDD6FE', soft: '#F5F0FF',
    petIdBg: 'linear-gradient(135deg, #8E5FCD 0%, #C8A7F5 100%)',
    preview: 'linear-gradient(135deg, #fdfaff 0%, #ddd6fe 100%)',
    shadow: '0 24px 64px rgba(142,95,205,0.20)' },
  { id: 'cream-classic', name: 'Cream Classic', caption: 'Warm',
    bg: '/id-card/pet-id-card-bg-cream-classic-v1.png',
    accent: '#C2844B', accent2: '#E8B873', border: '#F3D8B8', soft: '#FFF8EF',
    petIdBg: 'linear-gradient(135deg, #C2844B 0%, #E8B873 100%)',
    preview: 'linear-gradient(135deg, #fffdf8 0%, #f3d8b8 100%)',
    shadow: '0 24px 64px rgba(194,132,75,0.19)' },
  { id: 'rose-gold', name: 'Rose Gold', caption: 'Verified',
    bg: '/id-card/pet-id-card-bg-rose-gold-v1.png',
    accent: '#CD7168', accent2: '#F0A39A', border: '#F8C9C3', soft: '#FFF2F0',
    petIdBg: 'linear-gradient(135deg, #CD7168 0%, #F0A39A 100%)',
    preview: 'linear-gradient(135deg, #fffaf8 0%, #f8c9c3 100%)',
    shadow: '0 24px 64px rgba(205,113,104,0.20)' },
];

const VerifiedStamp = ({ accent }: { accent: string }) => (
  <svg width="72" height="72" viewBox="0 0 96 96" fill="none">
    <defs>
      <path id="topArc2" d="M 14,48 A 34,34 0 0,1 82,48" />
      <path id="bottomArc2" d="M 82,48 A 34,34 0 0,1 14,48" />
    </defs>
    <circle cx="48" cy="48" r="42" stroke={accent} strokeWidth="2" strokeDasharray="4 3" fill="rgba(255,255,255,0.7)" />
    <circle cx="48" cy="48" r="34" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.4" />
    <text fontFamily="inherit" fontSize="8" fontWeight="800" fill={accent} letterSpacing="2">
      <textPath href="#topArc2" startOffset="50%" textAnchor="middle">✦ WHISKORA ✦</textPath>
    </text>
    <text fontFamily="inherit" fontSize="8" fontWeight="800" fill={accent} letterSpacing="2">
      <textPath href="#bottomArc2" startOffset="50%" textAnchor="middle">✦ VERIFIED ✦</textPath>
    </text>
    <path d="M48 32 L50.5 40.5 L59.5 40.5 L52.5 45.5 L55 54 L48 49 L41 54 L43.5 45.5 L36.5 40.5 L45.5 40.5 Z" fill={accent} opacity="0.9" />
  </svg>
);

export default function PetIdCardPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<PetRecord | null>(null);
  const [farm, setFarm] = useState<{ farm_name?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardScale, setCardScale] = useState(1);
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    if (typeof window === 'undefined') return CARD_THEMES[0].id;
    const saved = window.localStorage.getItem(CARD_THEME_STORAGE_KEY);
    return saved && CARD_THEMES.some(t => t.id === saved) ? saved : CARD_THEMES[0].id;
  });

  const selectedTheme = CARD_THEMES.find(t => t.id === selectedThemeId) || CARD_THEMES[0];

  // Responsive scale
  useEffect(() => {
    const calc = () => {
      const avail = Math.min(window.innerWidth - 40, 380);
      setCardScale(avail / 380);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Fetch pet
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
      const { data: petData } = await supabase.from('pets').select('*').eq('id', petId).single();
      if (!petData) { router.push('/'); return; }
      setPet(petData as PetRecord);
      if (petData.farm_id && petData.farm_id !== 'PERSONAL') {
        const { data: farmData } = await supabase.from('farms').select('farm_name').eq('id', petData.farm_id).maybeSingle();
        if (farmData) setFarm(farmData);
      }
      setLoading(false);
    };
    load();
  }, [petId, router]);

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${petId}`;
    try {
      if (navigator.share) await navigator.share({ title: `${pet?.name} - Whiskora Pet ID`, url });
      else { await navigator.clipboard.writeText(url); alert('คัดลอกลิงก์เรียบร้อยแล้ว'); }
    } catch { /* cancelled */ }
  };

  const handleThemeSelect = (id: string) => {
    setSelectedThemeId(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(CARD_THEME_STORAGE_KEY, id);
  };

  // Helpers
  const isMale = pet?.gender === 'male' || pet?.gender === 'ตัวผู้';
  const petCode = pet ? (pet.pet_code || `WSK-${String(pet.id).padStart(5, '0')}`) : '';
  const qrUrl = typeof window !== 'undefined'
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin + '/p/' + petId)}&margin=0&color=1f1a1c`
    : '';

  const fmtDate = (d?: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const calcAge = (b?: string | null) => {
    if (!b) return '-';
    const dob = new Date(b); const now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    if (m < 0) { y--; m += 12; }
    if (y === 0 && m === 0) return 'เพิ่งเกิด';
    return `${y > 0 ? y + ' ปี ' : ''}${m > 0 ? m + ' เดือน' : ''}`.trim();
  };

  const infoRows = pet ? [
    { label: 'สายพันธุ์', val: pet.breed || '-', icon: '/icons/icon-my-pets.png' },
    { label: 'สี / ลาย',  val: pet.color || '-',  icon: '/icons/icon-breeding.png' },
    { label: 'วันเกิด',   val: fmtDate(pet.birth_date), icon: '/icons/icon-calendar.png' },
    { label: 'อายุ',      val: calcAge(pet.birth_date), icon: '/icons/icon-pet-records.png' },
    { label: 'กรุ๊ปเลือด', val: pet.blood_type || '-',  icon: '/icons/icon-health.png' },
    { label: 'ทำหมัน',   val: pet.is_neutered ? 'ทำหมันแล้ว' : 'ยังไม่ทำหมัน', icon: '/icons/icon-vaccine.png', isPill: true, pillOk: !!pet.is_neutered },
  ] : [];

  if (loading) return <PageLoader />;
  if (!pet) return null;

  const T = selectedTheme;

  return (
    <>
      <style>{`
        @keyframes page-rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes card-in   { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }

        .idc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .idc-wrap { max-width: 560px; margin: 0 auto; padding: 24px 20px 80px; animation: page-rise .4s ease both; }

        /* ── topbar ── */
        .idc-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .idc-back { width: 38px; height: 38px; border-radius: 12px; border: 1px solid ${F.line}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.ink}; transition: transform .15s, background .15s; flex-shrink: 0; }
        .idc-back:hover { background: ${F.paper}; transform: translateY(-1px); }
        .idc-topbar-text h1 { margin: 0; font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .idc-topbar-text p { margin: 3px 0 0; font-size: 13px; color: ${F.muted}; }

        /* ── card stage ── */
        .idc-stage { display: flex; justify-content: center; margin-bottom: 20px; }
        .idc-card-scaler { position: relative; }

        /* ── CARD (380×570 px at scale 1) ── */
        .pet-card {
          width: 380px; height: 570px;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          display: flex; flex-direction: column;
          font-family: inherit;
          border: 1.5px solid ${T.border};
          background-image: url("${T.bg}"), linear-gradient(160deg, ${T.soft} 0%, #ffffff 60%);
          background-size: cover, cover;
          background-position: center, center;
          box-shadow: ${T.shadow};
          transition: border-color .35s ease, box-shadow .35s ease;
          animation: card-in .45s ease both;
        }
        /* glass overlay */
        .pet-card::before { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.38); pointer-events:none; z-index:0; }
        .pet-card > * { position:relative; z-index:1; }

        /* header */
        .pc-header { padding: 18px 18px 10px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; }
        .pc-logo-row { display: flex; align-items: center; gap: 7px; }
        .pc-logo-img { height: 22px; width: auto; object-fit: contain; }
        .pc-logo-text { font-size: 18px; font-weight: 900; color: ${T.accent}; letter-spacing: -0.5px; }
        .pc-rule { width: 100%; display: flex; align-items: center; gap: 8px; }
        .pc-rule-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, ${T.border}, transparent); }
        .pc-rule-text { font-size: 7px; font-weight: 800; letter-spacing: 0.18em; color: ${T.accent}; white-space: nowrap; }

        /* media row: photo + identity + qr */
        .pc-media { display: grid; grid-template-columns: 110px 1fr 88px; gap: 10px; padding: 8px 14px; align-items: stretch; min-height: 130px; }
        .pc-photo-wrap { position: relative; }
        .pc-photo { width: 110px; height: 110px; border-radius: 18px; overflow: hidden; background: ${T.soft}; border: 2px solid ${T.border}; flex-shrink: 0; }
        .pc-photo img { width: 100%; height: 100%; object-fit: cover; }
        .pc-photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .pc-photo-placeholder img { width: 48px; height: 48px; object-fit: contain; opacity: .4; }
        .pc-stamp { position: absolute; right: -22px; bottom: -24px; pointer-events: none; }

        /* identity (center col) */
        .pc-identity { display: flex; flex-direction: column; justify-content: center; padding: 4px 2px; min-width: 0; }
        .pc-verified-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 7px; font-weight: 800; color: ${T.accent}; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 7px; }
        .pc-name { font-size: 20px; font-weight: 900; color: ${F.ink}; line-height: 1.05; letter-spacing: -.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-gender-row { display: flex; align-items: center; gap: 5px; margin-top: 5px; }
        .pc-gender-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; font-size: 8px; font-weight: 700; border: 1px solid ${T.border}; background: rgba(255,255,255,.6); color: ${T.accent}; }
        .pc-mini-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
        .pc-mini-tag { font-size: 7.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,.6); border: 1px solid ${T.border}; color: ${F.inkSoft}; white-space: nowrap; }

        /* QR */
        .pc-qr { background: rgba(255,255,255,.82); border-radius: 14px; padding: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1.5px solid ${T.border}; }
        .pc-qr-img-wrap { position: relative; width: 100%; aspect-ratio: 1; }
        .pc-qr-img { width: 100%; height: 100%; object-fit: contain; border-radius: 6px; }
        .pc-qr-paw { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:20px; height:20px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .pc-qr-paw img { width:14px; height:14px; object-fit:contain; }
        .pc-qr-label { font-size: 7px; font-weight: 700; color: ${F.muted}; margin-top: 4px; text-align: center; letter-spacing: .06em; }

        /* info table */
        .pc-info { margin: 4px 14px 0; border: 1px solid ${T.border}; border-radius: 18px; overflow: hidden; background: rgba(255,255,255,.62); flex: 1; }
        .pc-row { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 1px solid rgba(255,255,255,.8); }
        .pc-row:last-child { border-bottom: none; }
        .pc-row-icon { width: 18px; height: 18px; flex-shrink: 0; opacity: .7; }
        .pc-row-label { font-size: 9.5px; font-weight: 700; color: ${F.muted}; width: 58px; flex-shrink: 0; }
        .pc-row-val { font-size: 11px; font-weight: 800; color: ${F.ink}; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-pill { display: inline-flex; align-items: center; gap: 3px; padding: 1px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
        .pc-pill-ok { background: #DCFCE7; color: #15803D; }
        .pc-pill-no { background: rgba(255,255,255,.7); color: ${F.muted}; border: 1px solid ${T.border}; }

        /* pet ID bar */
        .pc-id-bar { margin: 6px 14px 0; background: ${T.petIdBg}; border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; }
        .pc-id-left { display: flex; flex-direction: column; gap: 1px; }
        .pc-id-paw { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
        .pc-id-paw img { width: 11px; height: 11px; object-fit: contain; }
        .pc-id-label { font-size: 7.5px; font-weight: 700; color: rgba(255,255,255,.8); letter-spacing: .04em; }
        .pc-id-code { font-size: 15px; font-weight: 900; color: white; letter-spacing: .01em; }
        .pc-id-date { font-size: 7.5px; color: rgba(255,255,255,.7); margin-top: 1px; }
        .pc-id-shield { opacity: .6; }
        .pc-id-shield img { width: 22px; height: 22px; object-fit: contain; filter: brightness(0) invert(1); }

        /* footer */
        .pc-footer { margin: 6px 14px 14px; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .pc-footer-txt { font-size: 8px; font-weight: 700; color: ${T.accent}; letter-spacing: .06em; }
        .pc-footer-icon img { width: 12px; height: 12px; object-fit: contain; }

        /* ── theme panel ── */
        .idc-theme-panel { border: 1px solid ${F.line}; border-radius: 20px; background: rgba(255,255,255,.94); padding: 16px; box-shadow: 0 4px 14px rgba(31,26,28,.04); margin-bottom: 16px; }
        .idc-theme-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .idc-theme-head-left { display: flex; align-items: center; gap: 10px; }
        .idc-theme-head-left img { width: 32px; height: 32px; object-fit: contain; }
        .idc-theme-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .idc-theme-sub { font-size: 12px; color: ${F.muted}; margin-top: 1px; }
        .idc-theme-active { font-size: 12px; font-weight: 700; color: ${T.accent}; white-space: nowrap; transition: color .3s; }
        .idc-theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
        .idc-theme-btn { appearance: none; border: 1.5px solid ${F.lineMid}; background: white; border-radius: 14px; padding: 8px; cursor: pointer; font-family: inherit; text-align: left; transition: all .2s ease; }
        .idc-theme-btn:hover { transform: translateY(-1px); }
        .idc-theme-btn.active { border-color: var(--tb-accent); background: color-mix(in srgb, var(--tb-accent) 7%, white); box-shadow: 0 6px 18px color-mix(in srgb, var(--tb-accent) 18%, transparent); }
        .idc-theme-swatch { height: 44px; border-radius: 9px; background: var(--tb-preview); border: 1px solid rgba(255,255,255,.7); }
        .idc-theme-name { display: block; margin-top: 6px; font-size: 10px; font-weight: 800; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .idc-theme-caption { display: block; margin-top: 1px; font-size: 9px; color: ${F.muted}; }

        /* ── action buttons ── */
        .idc-actions { display: flex; gap: 12px; }
        .idc-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: all .15s; }
        .idc-btn-primary { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.28); }
        .idc-btn-primary:hover { background: #c4325f; }

        @media (max-width: 480px) {
          .idc-wrap { padding: 16px 16px 80px; }
        }
      `}</style>

      <div className="idc-page">
        <div className="idc-wrap">

          {/* Topbar */}
          <div className="idc-topbar">
            <button className="idc-back" onClick={() => router.back()} aria-label="ย้อนกลับ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <img src="/icons/icon-pet-id-card.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
            <div className="idc-topbar-text">
              <h1>บัตรประจำตัวสัตว์เลี้ยง</h1>
              <p>เลือกธีม แล้วแชร์ลิงก์ให้สแกน QR ได้เลย</p>
            </div>
          </div>

          {/* Card */}
          <div className="idc-stage">
            <div
              className="idc-card-scaler"
              style={{ width: 380 * cardScale, height: 570 * cardScale }}
            >
              <div
                className="pet-card"
                style={{ transform: `scale(${cardScale})`, transformOrigin: 'top left' }}
              >
                {/* Header */}
                <div className="pc-header">
                  <div className="pc-logo-row">
                    <img src="/mini-logo.png" alt="" className="pc-logo-img" style={{ filter: `brightness(0) saturate(100%) invert(31%) sepia(70%) saturate(700%) hue-rotate(300deg) brightness(95%)` }} />
                    <span className="pc-logo-text">whiskora</span>
                  </div>
                  <div className="pc-rule">
                    <div className="pc-rule-line" />
                    <div className="pc-rule-text">• PET IDENTIFICATION CARD •</div>
                    <div className="pc-rule-line" />
                  </div>
                </div>

                {/* Media */}
                <div className="pc-media">
                  {/* Photo */}
                  <div className="pc-photo-wrap">
                    <div className="pc-photo">
                      {pet.image_url
                        ? <img src={pet.image_url} alt={pet.name || ''} />
                        : <div className="pc-photo-placeholder"><img src="/icons/icon-my-pets.png" alt="" /></div>
                      }
                    </div>
                    <div className="pc-stamp">
                      <VerifiedStamp accent={T.accent} />
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="pc-identity">
                    <div className="pc-verified-badge">
                      <img src="/icons/icon-verified.png" alt="" style={{ width: 10, height: 10, objectFit: 'contain' }} />
                      Verified
                    </div>
                    <div className="pc-name">{pet.name || '-'}</div>
                    <div className="pc-gender-row">
                      <span className="pc-gender-badge">
                        <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 9, height: 9, objectFit: 'contain' }} />
                        {isMale ? 'ตัวผู้' : 'ตัวเมีย'}
                      </span>
                    </div>
                    <div className="pc-mini-tags">
                      {calcAge(pet.birth_date) !== '-' && <span className="pc-mini-tag">{calcAge(pet.birth_date)}</span>}
                      {pet.blood_type && <span className="pc-mini-tag">Blood {pet.blood_type}</span>}
                      {farm?.farm_name && <span className="pc-mini-tag">{farm.farm_name}</span>}
                    </div>
                  </div>

                  {/* QR */}
                  <div className="pc-qr">
                    <div className="pc-qr-img-wrap">
                      {qrUrl && <img src={qrUrl} alt="QR" className="pc-qr-img" />}
                      <div className="pc-qr-paw">
                        <img src="/icons/paw.png" alt="" />
                      </div>
                    </div>
                    <div className="pc-qr-label">SCAN ME</div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="pc-info">
                  {infoRows.map((row, i) => (
                    <div key={i} className="pc-row">
                      <img src={row.icon} alt="" className="pc-row-icon" />
                      <span className="pc-row-label">{row.label}</span>
                      {row.isPill
                        ? <span className={`pc-pill ${row.pillOk ? 'pc-pill-ok' : 'pc-pill-no'}`}>{row.val}</span>
                        : <span className="pc-row-val">{row.val}</span>
                      }
                    </div>
                  ))}
                </div>

                {/* Pet ID bar */}
                <div className="pc-id-bar">
                  <div className="pc-id-left">
                    <div className="pc-id-paw">
                      <img src="/icons/icon-paw-circle-white.png" alt="" />
                      <span className="pc-id-label">เลขประจำตัวสัตว์เลี้ยง · Pet ID</span>
                    </div>
                    <div className="pc-id-code">{petCode}</div>
                    <div className="pc-id-date">ออกให้เมื่อ {fmtDate(new Date().toISOString())}</div>
                  </div>
                  <div className="pc-id-shield">
                    <img src="/icons/icon-verified-badge.png" alt="" />
                  </div>
                </div>

                {/* Footer */}
                <div className="pc-footer">
                  <div className="pc-footer-icon"><img src="/icons/icon-verified.png" alt="" /></div>
                  <span className="pc-footer-txt">รับรองโดย Whiskora</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme panel */}
          <div className="idc-theme-panel">
            <div className="idc-theme-head">
              <div className="idc-theme-head-left">
                <img src="/icons/icon-pet-id-card.png" alt="" />
                <div>
                  <div className="idc-theme-title">ธีมบัตร</div>
                  <div className="idc-theme-sub">เลือกสไตล์ที่ชอบ</div>
                </div>
              </div>
              <div className="idc-theme-active" style={{ color: T.accent }}>{T.name}</div>
            </div>
            <div className="idc-theme-grid">
              {CARD_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`idc-theme-btn${theme.id === selectedThemeId ? ' active' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                  style={{ '--tb-accent': theme.accent, '--tb-preview': theme.preview } as React.CSSProperties & Record<string, string>}
                >
                  <div className="idc-theme-swatch" />
                  <span className="idc-theme-name">{theme.name}</span>
                  <span className="idc-theme-caption">{theme.caption}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="idc-actions">
            <button className="idc-btn idc-btn-primary" onClick={handleShare}>
              <img src="/icons/icon-share.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              แชร์ลิงก์ให้สแกน QR
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
