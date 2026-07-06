"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F9A8C9', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

type CardTheme = {
  id: string;
  name: string;
  caption: string;
  bg: string;
  accent: string;
  accent2: string;
  border: string;
  soft: string;
  divider: string;
  infoBg: string;
  petIdBg: string;
  preview: string;
  shadow: string;
};

type PetRecord = {
  id: string | number;
  pet_code?: string | null;
  name?: string | null;
  breed?: string | null;
  color?: string | null;
  birth_date?: string | null;
  blood_type?: string | null;
  is_neutered?: boolean | null;
  gender?: string | null;
  image_url?: string | null;
  user_id?: string | null;
  farm_id?: string | null;
};

type ProfileRecord = {
  username?: string | null;
  full_name?: string | null;
  address?: string | null;
};

type FarmRecord = {
  farm_name?: string | null;
};

type CardInfoRow = {
  icon: React.ReactNode;
  labelTh: string;
  labelEn: string;
  valTh: string;
  valEn?: string;
  isName?: boolean;
  isPill?: boolean;
  pillNeutered?: boolean;
};

const CARD_THEME_STORAGE_KEY = 'whiskora.pet-id-card-theme';

const CARD_THEMES: CardTheme[] = [
  {
    id: 'whiskora-pink',
    name: 'Whiskora Pink',
    caption: 'Official',
    bg: '/id-card/pet-id-card-bg-whiskora-pink-v1.png',
    accent: '#E84677',
    accent2: '#F472B6',
    border: '#FBCFE8',
    soft: '#FDF2F5',
    divider: 'rgba(232,70,119,0.25)',
    infoBg: 'linear-gradient(180deg, rgba(254,232,240,0.9) 0%, rgba(253,244,247,0.88) 100%)',
    petIdBg: 'linear-gradient(135deg, #E84677 0%, #F472B6 100%)',
    preview: 'linear-gradient(135deg, #fff8fb 0%, #fbcfe8 100%)',
    shadow: '0 20px 60px rgba(232,70,119,0.20)',
  },
  {
    id: 'soft-blue',
    name: 'Soft Blue',
    caption: 'Calm',
    bg: '/id-card/pet-id-card-bg-soft-blue-v1.png',
    accent: '#388BD6',
    accent2: '#77BDF2',
    border: '#BFDBFE',
    soft: '#EFF6FF',
    divider: 'rgba(56,139,214,0.24)',
    infoBg: 'linear-gradient(180deg, rgba(225,242,255,0.9) 0%, rgba(246,251,255,0.88) 100%)',
    petIdBg: 'linear-gradient(135deg, #388BD6 0%, #77BDF2 100%)',
    preview: 'linear-gradient(135deg, #f8fcff 0%, #bfdbfe 100%)',
    shadow: '0 20px 60px rgba(56,139,214,0.18)',
  },
  {
    id: 'mint-care',
    name: 'Mint Care',
    caption: 'Clean',
    bg: '/id-card/pet-id-card-bg-mint-care-v1.png',
    accent: '#149B85',
    accent2: '#5ED4BC',
    border: '#B7F0DF',
    soft: '#ECFDF8',
    divider: 'rgba(20,155,133,0.24)',
    infoBg: 'linear-gradient(180deg, rgba(221,249,240,0.9) 0%, rgba(246,255,251,0.88) 100%)',
    petIdBg: 'linear-gradient(135deg, #149B85 0%, #5ED4BC 100%)',
    preview: 'linear-gradient(135deg, #f8fffd 0%, #b7f0df 100%)',
    shadow: '0 20px 60px rgba(20,155,133,0.17)',
  },
  {
    id: 'lavender-premium',
    name: 'Lavender',
    caption: 'Premium',
    bg: '/id-card/pet-id-card-bg-lavender-premium-v1.png',
    accent: '#8E5FCD',
    accent2: '#C8A7F5',
    border: '#DDD6FE',
    soft: '#F5F0FF',
    divider: 'rgba(142,95,205,0.24)',
    infoBg: 'linear-gradient(180deg, rgba(239,231,255,0.9) 0%, rgba(251,248,255,0.88) 100%)',
    petIdBg: 'linear-gradient(135deg, #8E5FCD 0%, #C8A7F5 100%)',
    preview: 'linear-gradient(135deg, #fdfaff 0%, #ddd6fe 100%)',
    shadow: '0 20px 60px rgba(142,95,205,0.18)',
  },
  {
    id: 'cream-classic',
    name: 'Cream Classic',
    caption: 'Warm',
    bg: '/id-card/pet-id-card-bg-cream-classic-v1.png',
    accent: '#C2844B',
    accent2: '#E8B873',
    border: '#F3D8B8',
    soft: '#FFF8EF',
    divider: 'rgba(194,132,75,0.24)',
    infoBg: 'linear-gradient(180deg, rgba(255,243,225,0.9) 0%, rgba(255,251,246,0.88) 100%)',
    petIdBg: 'linear-gradient(135deg, #C2844B 0%, #E8B873 100%)',
    preview: 'linear-gradient(135deg, #fffdf8 0%, #f3d8b8 100%)',
    shadow: '0 20px 60px rgba(194,132,75,0.17)',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    caption: 'Verified',
    bg: '/id-card/pet-id-card-bg-rose-gold-v1.png',
    accent: '#CD7168',
    accent2: '#F0A39A',
    border: '#F8C9C3',
    soft: '#FFF2F0',
    divider: 'rgba(205,113,104,0.24)',
    infoBg: 'linear-gradient(180deg, rgba(255,232,229,0.9) 0%, rgba(255,248,247,0.88) 100%)',
    petIdBg: 'linear-gradient(135deg, #CD7168 0%, #F0A39A 100%)',
    preview: 'linear-gradient(135deg, #fffaf8 0%, #f8c9c3 100%)',
    shadow: '0 20px 60px rgba(205,113,104,0.18)',
  },
];

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ShieldCheck: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
};

const RI = {
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Cat: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>,
  Palette: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Drop: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Cross: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>,
};

const PawSmall = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>;

const VerifiedStamp = () => (
  <svg width="64" height="64" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <path id="topArc" d="M 14,48 A 34,34 0 0,1 82,48" />
      <path id="bottomArc" d="M 82,48 A 34,34 0 0,1 14,48" />
    </defs>
    <circle cx="48" cy="48" r="42" stroke="#E84677" strokeWidth="2" strokeDasharray="4 3" fill="rgba(253,242,245,0.9)" />
    <circle cx="48" cy="48" r="34" stroke="#E84677" strokeWidth="1.5" fill="none" opacity="0.4" />
    <text fontFamily="inherit" fontSize="8" fontWeight="800" fill="#E84677" letterSpacing="2">
      <textPath href="#topArc" startOffset="50%" textAnchor="middle">✦ WHISKORA ✦</textPath>
    </text>
    <text fontFamily="inherit" fontSize="8" fontWeight="800" fill="#E84677" letterSpacing="2">
      <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">✦ VERIFIED ✦</textPath>
    </text>
    <path d="M48 32 L50.5 40.5 L59.5 40.5 L52.5 45.5 L55 54 L48 49 L41 54 L43.5 45.5 L36.5 40.5 L45.5 40.5 Z" fill="#E84677" opacity="0.9" />
  </svg>
);

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return url; }
};

export default function PetIdCardPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<PetRecord | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [farm, setFarm] = useState<FarmRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [base64Avatar, setBase64Avatar] = useState<string | null>(null);
  const [base64Qr, setBase64Qr] = useState<string | null>(null);
  const [base64Logo, setBase64Logo] = useState<string | null>(null);
  const [base64Verified, setBase64Verified] = useState<string | null>(null);
  const [base64Paw, setBase64Paw] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    if (typeof window === 'undefined') return CARD_THEMES[0].id;
    const savedTheme = window.localStorage.getItem(CARD_THEME_STORAGE_KEY);
    return savedTheme && CARD_THEMES.some((theme) => theme.id === savedTheme) ? savedTheme : CARD_THEMES[0].id;
  });
  const [cardBackground, setCardBackground] = useState<{ themeId: string; dataUrl: string } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const selectedTheme = CARD_THEMES.find((theme) => theme.id === selectedThemeId) || CARD_THEMES[0];
  const activeCardBackground = cardBackground?.themeId === selectedTheme.id ? cardBackground.dataUrl : null;

  useEffect(() => {
    let active = true;

    const loadThemeBackground = async () => {
      const dataUrl = await fetchImageAsBase64(selectedTheme.bg);
      if (active) setCardBackground({ themeId: selectedTheme.id, dataUrl });
    };

    loadThemeBackground();
    return () => { active = false; };
  }, [selectedTheme.bg, selectedTheme.id]);

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);

        const { data: petData, error: petError } = await supabase.from('pets').select('*').eq('id', petId).single();
        if (petError) throw petError;
        const petRecord = petData as PetRecord;
        setPet(petRecord);

        const { data: profileData } = await supabase.from('profiles').select('username, full_name, address').eq('id', petRecord.user_id).maybeSingle();
        if (profileData) setProfile(profileData as ProfileRecord);

        if (petRecord.farm_id && petRecord.farm_id !== 'PERSONAL') {
          const { data: farmData } = await supabase.from('farms').select('farm_name').eq('id', petRecord.farm_id).maybeSingle();
          if (farmData) setFarm(farmData as FarmRecord);
        }

        setBase64Logo(await fetchImageAsBase64('/logo%20-%20id%20card.PNG'));
        setBase64Verified(await fetchImageAsBase64('/verified.png'));
        setBase64Paw(await fetchImageAsBase64('/paw.png'));

        if (petRecord.image_url) setBase64Avatar(await fetchImageAsBase64(petRecord.image_url));

        if (typeof window !== "undefined") {
          const publicProfileUrl = `${window.location.origin}/p/${petId}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicProfileUrl)}&margin=0`;
          try { setBase64Qr(await fetchImageAsBase64(qrUrl)); } catch { /* QR optional */ }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPetData();
  }, [petId, router]);

  useEffect(() => {
    if (loading || !pet || !activeCardBackground) return;
    let cancelled = false;

    const generateImage = async () => {
      setIsGeneratingImage(true);
      setCardImageUrl(null);
      try {
        await new Promise(r => setTimeout(r, 800));
        if (cancelled || !cardRef.current) return;
        const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 3, skipFonts: true });
        if (!cancelled) setCardImageUrl(dataUrl);
      } catch (error) {
        console.error('Error generating card:', error);
      } finally {
        if (!cancelled) setIsGeneratingImage(false);
      }
    };

    generateImage();
    return () => { cancelled = true; };
  }, [loading, pet, profile, farm, base64Qr, base64Avatar, base64Logo, base64Verified, base64Paw, activeCardBackground, selectedThemeId]);

  const publicUrl = `${baseUrl}/p/${petId}`;

  const handleShare = async () => {
    const shareData = { title: `${pet?.name} - Whiskora Pet ID 🐾`, text: `ดูโปรไฟล์ของ ${pet?.name}`, url: publicUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(publicUrl); alert("✅ คัดลอกลิงก์เรียบร้อยแล้ว"); }
    } catch { /* cancelled */ }
  };

  const handleDownload = () => {
    if (!cardImageUrl) return;
    const a = document.createElement('a');
    a.href = cardImageUrl;
    a.download = `whiskora-id-${pet?.pet_code || pet?.name || 'pet'}.png`;
    a.click();
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    setCardImageUrl(null);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CARD_THEME_STORAGE_KEY, themeId);
    }
  };

  const THAI_VALUE_MAP: Record<string, string> = {
    'scottish fold': 'สกอตติช โฟลด์',
    'cream tabby': 'ครีมแท็บบี้',
    male: 'ตัวผู้',
    female: 'ตัวเมีย',
  };

  const extractBoth = (text?: string | null) => text ? text.trim() : '-';
  const toThaiDisplay = (text?: string | null) => {
    const value = extractBoth(text);
    const mapped = THAI_VALUE_MAP[value.toLowerCase()];
    return mapped || value;
  };
  const isMale = pet?.gender === 'male' || pet?.gender === 'ตัวผู้';

  const calcAge = (b?: string | null) => {
    if (!b) return '-';
    const dob = new Date(b), now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    if (m < 0) { y--; m += 12; }
    if (y === 0 && m === 0) return 'เพิ่งเกิด';
    return `${y > 0 ? y + ' ปี ' : ''}${m > 0 ? m + ' เดือน' : ''}`.trim();
  };
  const calcAgeEn = (b?: string | null) => {
    if (!b) return '-';
    const dob = new Date(b), now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    if (m < 0) { y--; m += 12; }
    if (y === 0 && m === 0) return 'Newborn';
    return `${y > 0 ? y + 'y ' : ''}${m > 0 ? m + 'm' : ''}`.trim();
  };
  const fmtDate = (d?: string | null) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtThaiDateFromString = (d?: string | null) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const fmtThaiDate = (date: Date) => date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">Loading ID Card...</div>;
  if (!pet) return null;

  const petCode = pet.pet_code || `WSK-${String(pet.id).padStart(5, '0')}`;
  const issueDate = new Date();

  const rows: CardInfoRow[] = [
    { icon: <RI.Paw />, labelTh: 'ชื่อ', labelEn: 'Name', valTh: extractBoth(pet.name), valEn: pet.name ? pet.name.toUpperCase() : '-', isName: true },
    { icon: <RI.Cat />, labelTh: 'สายพันธุ์', labelEn: 'Breed', valTh: toThaiDisplay(pet.breed), valEn: extractBoth(pet.breed) },
    { icon: <RI.Palette />, labelTh: 'สี', labelEn: 'Color', valTh: toThaiDisplay(pet.color), valEn: extractBoth(pet.color) },
    { icon: <RI.Calendar />, labelTh: 'วันเกิด', labelEn: 'Date of Birth', valTh: fmtThaiDateFromString(pet.birth_date), valEn: fmtDate(pet.birth_date) },
    { icon: <RI.Clock />, labelTh: 'อายุ', labelEn: 'Age', valTh: calcAge(pet.birth_date), valEn: calcAgeEn(pet.birth_date) },
    { icon: <RI.Drop />, labelTh: 'กรุ๊ปเลือด', labelEn: 'Blood Type', valTh: pet.blood_type || '-', valEn: pet.blood_type ? `Type ${pet.blood_type}` : '-' },
    { icon: <RI.Cross />, labelTh: 'ทำหมัน', labelEn: 'Spayed / Neutered', valTh: pet.is_neutered ? 'ทำหมันแล้ว' : 'ยังไม่ทำหมัน', valEn: pet.is_neutered ? 'Neutered' : 'Not neutered', isPill: true, pillNeutered: !!pet.is_neutered },
  ];
  const detailRows = rows;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .idc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .idc-wrap { max-width: 600px; margin: 0 auto; padding: 24px 20px 80px; }
        .idc-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .idc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .idc-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .idc-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; }
        .idc-sub { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 3px; }

        .idc-display { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 100%; gap: 20px; }
        .idc-stage { width: min(100%, 400px); max-width: 100%; box-sizing: border-box; aspect-ratio: 2/3; position: relative; border-radius: 24px; overflow: hidden; background: #f3edf0; transition: box-shadow .35s ease; }
        .idc-stage img { width: 100%; height: 100%; display: block; object-fit: cover; border-radius: 24px; animation: idc-fadein .4s ease; }
        @keyframes idc-fadein { from { opacity: 0; } to { opacity: 1; } }
        .idc-loading { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(253,242,245,0.6); }
        .idc-spinner { width: 36px; height: 36px; border: 4px solid ${F.pinkBorder}; border-top-color: ${F.pink}; border-radius: 50%; animation: idcspin 0.8s linear infinite; }
        @keyframes idcspin { to { transform: rotate(360deg); } }
        .idc-actions { display: flex; gap: 12px; width: min(100%, 400px); max-width: 100%; box-sizing: border-box; }
        .idc-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .18s ease; font-family: inherit; }
        .idc-btn-primary { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .idc-btn-primary:hover { background: #D63F6A; }
        .idc-btn-ghost { background: white; color: ${F.ink}; border: 1px solid ${F.lineMid}; }
        .idc-btn-ghost:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .idc-hint { font-size: 11px; font-weight: 600; color: ${F.muted}; text-align: center; background: ${F.pinkSoft}; padding: 10px; border-radius: 12px; border: 1px solid ${F.pinkBorder}; width: min(100%, 400px); max-width: 100%; box-sizing: border-box; }
        .idc-theme-panel { width: min(100%, 400px); max-width: 100%; box-sizing: border-box; border: 1px solid ${F.lineMid}; border-radius: 18px; background: rgba(255,255,255,0.94); padding: 14px; box-shadow: 0 12px 32px rgba(17,24,39,0.06); }
        .idc-theme-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .idc-theme-title { font-size: 13px; font-weight: 800; color: ${F.ink}; line-height: 1.2; }
        .idc-theme-sub { font-size: 10px; font-weight: 700; color: ${F.muted}; letter-spacing: .08em; text-transform: uppercase; margin-top: 2px; }
        .idc-theme-active { font-size: 11px; font-weight: 800; color: ${selectedTheme.accent}; white-space: nowrap; }
        .idc-theme-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
        .idc-theme-choice { min-width: 0; appearance: none; border: 1px solid ${F.lineMid}; background: white; border-radius: 14px; padding: 8px; cursor: pointer; font-family: inherit; text-align: left; transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease, background .16s ease; }
        .idc-theme-choice:hover { transform: translateY(-1px); border-color: var(--theme-border); box-shadow: 0 8px 20px color-mix(in srgb, var(--theme-accent) 18%, transparent); }
        .idc-theme-choice.active { border-color: var(--theme-accent); background: color-mix(in srgb, var(--theme-accent) 8%, white); box-shadow: 0 8px 22px color-mix(in srgb, var(--theme-accent) 20%, transparent); }
        .idc-theme-swatch { height: 48px; border-radius: 10px; background: var(--theme-preview); border: 1px solid rgba(255,255,255,.82); box-shadow: inset 0 0 0 1px rgba(17,24,39,.04); position: relative; overflow: hidden; }
        .idc-theme-swatch::after { content: ''; position: absolute; right: -12px; top: -18px; width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.4); }
        .idc-theme-name { display: block; margin-top: 7px; font-size: 10px; font-weight: 800; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .idc-theme-caption { display: block; margin-top: 1px; font-size: 9px; font-weight: 700; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ═══ CARD (portrait 2:3 = 400×600px) ═══ */
        .card { width: 400px; height: 600px; background: linear-gradient(160deg, #FDEEF4 0%, #FFFFFF 40%, #FEF3F7 100%); border-radius: 24px; overflow: hidden; position: relative; border: 3px solid var(--card-border, #FBCFE8); font-family: inherit; display: flex; flex-direction: column; gap: 10px; padding: 16px; box-sizing: border-box; }


        /* Header */
        .card-hd { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 54px; gap: 1px; text-align: center; }
        .card-hd-logo { height: 34px; width: auto; object-fit: contain; }
        .card-hd-logo-text { font-size: 32px; font-weight: 900; color: var(--card-accent); letter-spacing: -1px; line-height: 1; }
        .card-hd-rule { width: 100%; display: flex; align-items: center; gap: 8px; margin-top: 3px; }
        .card-hd-rule-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--card-border), transparent); }
        .card-hd-rule-text { font-size: 7px; font-weight: 800; letter-spacing: 0.16em; color: var(--card-accent); white-space: nowrap; }
        .card-hd-sub { font-size: 8px; font-weight: 600; color: ${F.inkSoft}; letter-spacing: 0.02em; line-height: 1.1; margin-top: 1px; white-space: nowrap; }

        /* Media section — z-index:2 so stamp (child) paints above card-info (z-index:1) */
        .card-media { position: relative; z-index: 2; display: grid; grid-template-columns: 116px minmax(0, 1fr) 96px; align-items: stretch; gap: 10px; min-height: 132px; }
        .card-photo-wrap { position: relative; }
        .card-photo { width: 100%; height: 100%; border-radius: 18px; overflow: hidden; background: var(--card-soft); display: flex; align-items: center; justify-content: center; font-size: 34px; border: 2px solid var(--card-border); }
        .card-photo img { width: 100%; height: 100%; object-fit: cover; }
        /* stamp: direct child of card-media, centered on left column (col-center ≈ 106px from card edge) */
        .card-identity { display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 12px; border: 1px solid color-mix(in srgb, var(--card-border) 70%, white); border-radius: 18px; background: rgba(255,255,255,0.72); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.55); }
        .card-status { display: inline-flex; align-items: center; gap: 5px; width: fit-content; min-height: 22px; padding: 0 8px; border-radius: 999px; background: color-mix(in srgb, var(--card-accent) 10%, white); color: var(--card-accent); font-size: 7.5px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
        .card-name { margin-top: 8px; color: ${F.ink}; font-size: 22px; line-height: 1; font-weight: 900; letter-spacing: .02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-meta { margin-top: 5px; color: ${F.inkSoft}; font-size: 9.5px; line-height: 1.45; font-weight: 600; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-mini-row { display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap; }
        .card-mini { display: inline-flex; align-items: center; min-height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid var(--card-border); background: rgba(255,255,255,0.76); color: #504764; font-size: 8px; font-weight: 700; white-space: nowrap; }
        .card-stamp { position: absolute; left: 68%; bottom: -82px; transform: translateX(-50%); width: 158px; height: 158px; z-index: 10; pointer-events: none; }
        .card-stamp img { width: 100%; height: 100%; display: block; object-fit: contain; filter: drop-shadow(0 7px 14px rgba(232,70,119,0.14)); }
        .card-qr-wrap { position: relative; align-self: center; aspect-ratio: 1; background: white; border-radius: 18px; padding: 7px; border: 2px solid var(--card-border); display: flex; align-items: center; justify-content: center; }
        .card-qr-img-wrap { position: relative; width: 100%; aspect-ratio: 1; }
        .card-qr-img-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .card-qr-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 30px; height: 30px; border-radius: 50%; background: white; overflow: hidden; display: flex; align-items: center; justify-content: center; color: var(--card-accent); }

        /* Info rows */
        .card-info { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .card-info-row { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; gap: 8px; min-height: 54px; padding: 8px; border: 0; border-radius: 14px; background: rgba(255,255,255,0.7); box-shadow: none; }
        .card-row-divider { display: none; }
        .card-icon-sq { width: 24px; height: 24px; border-radius: 8px; background: rgba(255,255,255,0.85); border: 1px solid var(--card-border); display: flex; align-items: center; justify-content: center; color: var(--card-accent); flex-shrink: 0; }
        .card-label-col { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex-shrink: 1; }
        .card-line { display: flex; align-items: baseline; flex-wrap: nowrap; gap: 4px; min-width: 0; white-space: nowrap; }
        .card-line-th { color: ${F.ink}; }
        .card-line-en { color: ${F.muted}; }
        .card-lbl-th { display: inline-flex; flex: 0 0 auto; font-size: 10.6px; font-weight: 800; color: ${F.ink}; line-height: 1.15; }
        .card-lbl-en { display: inline-flex; flex: 0 0 auto; font-size: 7.4px; font-weight: 600; color: ${F.muted}; line-height: 1.15; letter-spacing: .02em; }
        .card-divider-v { display: none; }
        .card-val { min-width: 0; margin-top: 0; font-family: inherit; font-size: 12.2px; font-weight: 800; color: ${F.ink}; line-height: 1.08; white-space: nowrap; overflow: visible; text-overflow: clip; }
        .card-val.is-name { font-size: 12.2px; font-weight: 800; color: ${F.ink}; letter-spacing: 0; }
        .card-val-en { display: inline; min-width: 0; margin-top: 0; color: ${F.inkSoft}; font-size: 8px; line-height: 1.08; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-info-row.is-primary .card-val-en { font-size: 8px; letter-spacing: .08em; text-transform: uppercase; }
        .card-gender { font-size: 15px; margin-left: 4px; }
        .card-gender-m { color: #2563EB; }
        .card-gender-f { color: #DB2777; }
        .card-pill { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; min-height: 20px; padding: 0 9px; border-radius: 20px; font-size: 10.2px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-pill-green { background: #DCFCE7; color: #15803D; }
        .card-pill-gray { background: rgba(255,255,255,0.7); color: #6B7280; border: 1px solid #E5E7EB; }

        /* Pet ID box */
        .card-petid { position: relative; z-index: 1; min-height: 58px; background: var(--card-petid-bg); border-radius: 14px; padding: 9px 14px; display: flex; align-items: center; justify-content: space-between; }
        .card-petid-left { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 1px; }
        .card-petid-paw-label { display: flex; align-items: flex-start; gap: 6px; }
        .card-petid-label { display: flex; flex-direction: column; gap: 1px; font-size: 8px; font-weight: 800; color: rgba(255,255,255,0.85); letter-spacing: 0; text-transform: none; }
        .card-petid-label-th { font-size: 8px; line-height: 1; font-weight: 800; white-space: nowrap; }
        .card-petid-label-en { font-size: 6px; line-height: 1; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; opacity: .78; }
        .card-petid-num { font-family: inherit; font-size: 14px; font-weight: 900; color: white; letter-spacing: 0.01em; line-height: 1; white-space: nowrap; }
        .card-petid-issue { font-size: 8px; font-weight: 600; color: rgba(255,255,255,0.75); margin-top: 2px; }
        .card-petid-shield { color: rgba(255,255,255,0.6); }

        /* Footer */
        .card-footer { position: relative; z-index: 1; min-height: 24px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 10px 0; border-top: 1.5px solid var(--card-border); background: transparent; flex-wrap: nowrap; white-space: nowrap; }
        .card-footer-text { font-size: 8.5px; font-weight: 700; color: ${F.inkSoft}; letter-spacing: 0.04em; }
        .card-footer-text b { color: var(--card-accent); }
        .card-footer-sep { color: ${F.muted}; font-size: 8.5px; }
        .card-footer-icon { color: var(--card-accent); display: flex; }
        .card { border-width: 1px; border-radius: 30px; background-color: #FFFFFF; box-shadow: 0 26px 70px rgba(232,70,119,0.14), 0 12px 30px rgba(17,24,39,0.08); }
        .card::before { content: ""; position: absolute; inset: 0; z-index: 0; background: rgba(255,255,255,0.48); pointer-events: none; }
        .card > * { position: relative; z-index: 1; }
        .card { gap: 8px; padding: 18px 18px 17px; justify-content: space-between; }
        .card-hd { min-height: 60px; }
        .card-hd-logo { height: 42px; }
        .card-hd-rule { margin-top: 4px; }
        .card-hd-rule-text { color: color-mix(in srgb, var(--card-accent) 92%, #171331); }
        .card-hd-sub { color: rgba(23,19,49,0.64); }
        .card-media { grid-template-columns: minmax(0, 1fr) 116px; min-height: 136px; padding: 9px; border: 1px solid color-mix(in srgb, var(--card-border) 42%, white); border-radius: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.58)); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.56), 0 10px 26px rgba(17,24,39,0.045); }
        .card-photo { border: 0; border-radius: 21px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border) 42%, white); }
        .card-identity { display: none; padding: 4px 2px; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
        .card-status { min-height: 19px; padding: 0 7px; font-size: 6.8px; background: color-mix(in srgb, var(--card-accent) 8%, white); }
        .card-status svg { width: 12px; height: 12px; }
        .card-name { margin-top: 6px; font-size: 20px; }
        .card-meta { margin-top: 4px; font-size: 9px; }
        .card-mini-row { margin-top: 8px; }
        .card-mini { min-height: 20px; padding: 0 7px; font-size: 7.5px; }
        .card-qr-wrap { width: 100%; align-self: stretch; border: 0; border-radius: 18px; padding: 6px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border) 48%, white), 0 8px 18px rgba(17,24,39,0.05); }
        .card-qr-center { width: 24px; height: 24px; }
        .card-stamp { display: block; }
        .card-info { gap: 0; overflow: hidden; border: 1px solid color-mix(in srgb, var(--card-border) 40%, white); border-radius: 20px; background: rgba(255,255,255,0.68); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.52); }
        .card-info-row { grid-template-columns: minmax(0, 1fr); min-height: 44px; padding: 5px 10px; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
        .card-info-row:nth-child(odd) { border-right: 0; }
        .card-info-row:nth-child(even) { border-right: 0; }
        .card-info-row:nth-child(n+2) { border-top: 0; }
        .card-info-row.is-primary { grid-column: 1 / -1; min-height: 44px; border-right: 0; background: linear-gradient(90deg, rgba(255,255,255,0.62), color-mix(in srgb, var(--card-accent) 6%, white)); }
        .card-icon-sq { display: none; width: 21px; height: 21px; border-radius: 8px; border-color: color-mix(in srgb, var(--card-border) 46%, white); background: color-mix(in srgb, var(--card-accent) 6%, white); }
        .card-lbl-th { font-size: 10.6px; font-weight: 800; }
        .card-lbl-en { font-size: 7.4px; }
        .card-val { font-size: 12.2px; font-weight: 800; }
        .card-info-row.is-primary .card-val { color: ${F.ink}; font-size: 12.2px; line-height: 1.08; letter-spacing: 0; }
        .card-val-en { font-size: 8px; }
        .card-info-row.is-primary .card-val-en { font-size: 8px; }
        .card-petid { min-height: 56px; border-radius: 20px; box-shadow: 0 12px 24px color-mix(in srgb, var(--card-accent) 15%, transparent); }
        .card-footer { min-height: 24px; width: fit-content; max-width: 100%; margin: 0 auto; padding: 3px 12px; border: 0; border-radius: 999px; background: color-mix(in srgb, var(--card-accent) 7%, white); }
        .card-footer-text, .card-footer-sep { font-size: 8px; }
        .card-bottom { position: relative; z-index: 1; padding: 8px; border: 1px solid color-mix(in srgb, var(--card-border) 34%, white); border-radius: 24px; background: linear-gradient(180deg, color-mix(in srgb, var(--card-accent) 8%, white) 0%, rgba(255,255,255,0.58) 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5), 0 10px 24px rgba(17,24,39,0.035); }
        .card-bottom .card-petid { width: 100%; min-height: 62px; border-radius: 18px; padding: 10px 14px; }
        .card-bottom .card-footer { width: 100%; min-height: 22px; margin: 6px 0 0; padding: 0 6px; border-radius: 0; background: transparent; gap: 4px; }
        .card-bottom .card-footer-icon svg { width: 13px; height: 13px; }

        @media (max-width: 480px) {
          .idc-wrap { padding: 16px 12px 60px; }
          .idc-rendered, .idc-actions, .idc-hint { max-width: 100%; }
          .idc-actions { flex-direction: column; }
          .idc-theme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>

      <div className="idc-page">
        <div className="idc-wrap">
          <div className="idc-topbar">
            <button onClick={() => router.back()} className="idc-back" aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="idc-title">บัตรประจำตัวสัตว์เลี้ยง</h1>
              <p className="idc-sub">Whiskora Pet Identification Card</p>
            </div>
          </div>

          <div className="idc-display">
            <div className="idc-stage" style={{ boxShadow: selectedTheme.shadow }}>
              {(isGeneratingImage || !cardImageUrl) && (
                <div className="idc-loading"><div className="idc-spinner" /></div>
              )}
              {cardImageUrl && <img src={cardImageUrl} alt="Pet ID Card" />}
            </div>

            <section className="idc-theme-panel" aria-label="Pet ID card theme">
              <div className="idc-theme-head">
                <div>
                  <div className="idc-theme-title">Card theme</div>
                  <div className="idc-theme-sub">Choose a style</div>
                </div>
                <div className="idc-theme-active">{selectedTheme.name}</div>
              </div>
              <div className="idc-theme-grid">
                {CARD_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`idc-theme-choice${theme.id === selectedTheme.id ? ' active' : ''}`}
                    onClick={() => handleThemeSelect(theme.id)}
                    aria-pressed={theme.id === selectedTheme.id}
                    aria-label={`Use ${theme.name} theme`}
                    style={{
                      '--theme-accent': theme.accent,
                      '--theme-border': theme.border,
                      '--theme-preview': theme.preview,
                    } as React.CSSProperties & Record<string, string>}
                  >
                    <span className="idc-theme-swatch" aria-hidden="true" />
                    <span className="idc-theme-name">{theme.name}</span>
                    <span className="idc-theme-caption">{theme.caption}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* ── ตัวบัตรจริง (ซ่อนไว้ให้ html-to-image จับภาพ) ── */}
            <div
              ref={cardRef}
              className="card"
              style={{
                position: cardImageUrl && !isGeneratingImage ? 'absolute' : 'relative',
                opacity: cardImageUrl && !isGeneratingImage ? 0 : 1,
                zIndex: cardImageUrl && !isGeneratingImage ? -1 : 0,
                pointerEvents: 'none',
                backgroundImage: `${activeCardBackground ? `url("${activeCardBackground}")` : `url("${selectedTheme.bg}")`}, linear-gradient(160deg, #FDEEF4 0%, #FFFFFF 40%, #FEF3F7 100%)`,
                backgroundSize: 'cover, cover',
                backgroundPosition: 'center, center',
                '--card-accent': selectedTheme.accent,
                '--card-accent-2': selectedTheme.accent2,
                '--card-border': selectedTheme.border,
                '--card-soft': selectedTheme.soft,
                '--card-divider': selectedTheme.divider,
                '--card-info-bg': selectedTheme.infoBg,
                '--card-petid-bg': selectedTheme.petIdBg,
              } as React.CSSProperties & Record<string, string | number>}
            >
              {/* Header */}
              <div className="card-hd">
                {base64Logo && !base64Logo.startsWith('/')
                  ? <img src={base64Logo} alt="Whiskora" className="card-hd-logo" />
                  : <div className="card-hd-logo-text">whiskora</div>}
                <div className="card-hd-rule">
                  <div className="card-hd-rule-line" />
                  <div className="card-hd-rule-text">• PET IDENTIFICATION CARD •</div>
                  <div className="card-hd-rule-line" />
                </div>
                <div className="card-hd-sub">บัตรประจำตัวสัตว์เลี้ยง</div>
              </div>

              {/* Media: photo + QR */}
              <div className="card-media">
                <div className="card-photo-wrap">
                  <div className="card-photo">
                    {base64Avatar ? <img src={base64Avatar} alt={pet.name || 'Pet'} /> : '🐾'}
                  </div>
                  <div className="card-stamp">
                    {base64Verified && !base64Verified.startsWith('/')
                      ? <img src={base64Verified} alt="Verified" />
                      : <VerifiedStamp />}
                  </div>
                </div>
                <div className="card-identity">
                  <div className="card-status">
                    <Icon.ShieldCheck />
                    Verified
                  </div>
                  <div className="card-name">
                    {pet.name ? pet.name.toUpperCase() : '-'}
                    <span className={`card-gender ${isMale ? 'card-gender-m' : 'card-gender-f'}`}>
                      {isMale ? '♂' : '♀'}
                    </span>
                  </div>
                  <div className="card-meta">
                    {extractBoth(pet.breed)} • {extractBoth(pet.color)}
                  </div>
                  <div className="card-mini-row">
                    <span className="card-mini">{calcAge(pet.birth_date)}</span>
                    <span className="card-mini">{pet.blood_type || 'Blood -'}</span>
                  </div>
                </div>
                <div className="card-qr-wrap">
                  <div className="card-qr-img-wrap">
                    {base64Qr
                      ? <img src={base64Qr} alt="QR Code" />
                      : <div style={{ width: '100%', height: '100%', background: F.line, borderRadius: 8 }} />}
                    <div className="card-qr-center">
                      {base64Paw && !base64Paw.startsWith('/')
                        ? <img src={base64Paw} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
                        : <img src="/paw.png" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="card-info">
                {detailRows.map((r, i) => (
                  <div className={`card-info-row${r.isName ? ' is-primary' : ''}`} key={i}>
                    <div className="card-icon-sq">{r.icon}</div>
                    <div className="card-label-col">
                      <span className="card-line card-line-th">
                        <span className="card-lbl-th">{r.labelTh}</span>
                        {r.isPill ? (
                          <span className={`card-pill ${r.pillNeutered ? 'card-pill-green' : 'card-pill-gray'}`}>
                            {r.pillNeutered ? '✓ ' : ''}{r.valTh}
                          </span>
                        ) : (
                          <span className={`card-val${r.isName ? ' is-name' : ''}`}>{r.valTh}</span>
                        )}
                      </span>
                      {r.valEn ? (
                        <span className="card-line card-line-en">
                          <span className="card-lbl-en">{r.labelEn}</span>
                          <span className="card-val-en">{r.valEn}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-bottom">
                {/* Pet ID box */}
                <div className="card-petid">
                  <div className="card-petid-left">
                    <div className="card-petid-paw-label">
                      <PawSmall />
                      <span className="card-petid-label">
                        <span className="card-petid-label-th">เลขประจำตัวสัตว์เลี้ยง</span>
                        <span className="card-petid-label-en">Pet ID</span>
                      </span>
                    </div>
                    <div className="card-petid-num">{petCode}</div>
                    <div className="card-petid-issue">ออกให้เมื่อ {fmtThaiDate(issueDate)}</div>
                  </div>
                  <div className="card-petid-shield">
                    <Icon.ShieldCheck />
                  </div>
                </div>

                {/* Footer */}
                <div className="card-footer">
                  <div className="card-footer-icon"><Icon.ShieldCheck /></div>
                  <span className="card-footer-text">รับรองโดย <b>Whiskora</b></span>
                </div>
              </div>
            </div>

            <p className="idc-hint">📱 แตะค้างที่บัตรเพื่อบันทึกรูป หรือกดปุ่มดาวน์โหลดด้านล่าง</p>
            <div className="idc-actions">
              <button onClick={handleDownload} className="idc-btn idc-btn-ghost" disabled={!cardImageUrl}><Icon.Download /> ดาวน์โหลดบัตร</button>
              <button onClick={handleShare} className="idc-btn idc-btn-primary"><Icon.Share /> แชร์ลิงก์ให้สแกน</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
