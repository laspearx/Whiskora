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

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ShieldCheck: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
};

const RI = {
  Paw: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Cat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>,
  Palette: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>,
  Calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Drop: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Cross: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>,
};

const PawSmall = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>;

const VerifiedStamp = () => (
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  const [pet, setPet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");

  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [base64Avatar, setBase64Avatar] = useState<string | null>(null);
  const [base64Qr, setBase64Qr] = useState<string | null>(null);
  const [base64Logo, setBase64Logo] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setBaseUrl(window.location.origin);

    const fetchPetData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);

        const { data: petData, error: petError } = await supabase.from('pets').select('*').eq('id', petId).single();
        if (petError) throw petError;
        setPet(petData);

        const { data: profileData } = await supabase.from('profiles').select('username, full_name, address').eq('id', petData.user_id).maybeSingle();
        if (profileData) setProfile(profileData);

        if (petData.farm_id && petData.farm_id !== 'PERSONAL') {
          const { data: farmData } = await supabase.from('farms').select('farm_name').eq('id', petData.farm_id).maybeSingle();
          if (farmData) setFarm(farmData);
        }

        setBase64Logo(await fetchImageAsBase64('/logo.png'));

        if (petData.image_url) setBase64Avatar(await fetchImageAsBase64(petData.image_url));

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
    if (loading || !pet) return;
    const generateImage = async () => {
      setIsGeneratingImage(true);
      try {
        await new Promise(r => setTimeout(r, 800));
        if (!cardRef.current) return;
        const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 3, skipFonts: true });
        setCardImageUrl(dataUrl);
      } catch (error) {
        console.error('Error generating card:', error);
      } finally {
        setIsGeneratingImage(false);
      }
    };
    generateImage();
  }, [loading, pet, profile, farm, base64Qr, base64Avatar, base64Logo]);

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

  const extractBoth = (text: string | null) => text ? text.trim() : '-';
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
  const fmtDate = (d?: string | null) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtThaiDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">Loading ID Card...</div>;
  if (!pet) return null;

  const petCode = pet.pet_code || `WSK-${String(pet.id).padStart(5, '0')}`;
  const issueDate = new Date();

  const rows = [
    { icon: <RI.Paw />, labelTh: 'ชื่อ', labelEn: 'Name', val: pet.name ? pet.name.toUpperCase() : '-', isName: true },
    { icon: <RI.Cat />, labelTh: 'สายพันธุ์', labelEn: 'Breed', val: extractBoth(pet.breed) },
    { icon: <RI.Palette />, labelTh: 'สี', labelEn: 'Color', val: extractBoth(pet.color) },
    { icon: <RI.Calendar />, labelTh: 'วันเกิด', labelEn: 'Date of Birth', val: fmtDate(pet.birth_date) },
    { icon: <RI.Clock />, labelTh: 'อายุ', labelEn: 'Age', val: calcAge(pet.birth_date) },
    { icon: <RI.Drop />, labelTh: 'กรุ๊ปเลือด', labelEn: 'Blood Type', val: pet.blood_type || '-' },
    { icon: <RI.Cross />, labelTh: 'ทำหมัน', labelEn: 'Spayed / Neutered', val: pet.is_neutered ? 'ทำหมันแล้ว ✓' : 'ยังไม่ทำหมัน' },
  ];

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

        .idc-display { display: flex; flex-direction: column; align-items: center; gap: 20px; position: relative; }
        .idc-rendered { width: 100%; max-width: 400px; border-radius: 24px; box-shadow: 0 20px 60px rgba(232,70,119,0.2); }
        .idc-loading { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; min-height: 500px; }
        .idc-spinner { width: 36px; height: 36px; border: 4px solid ${F.pinkBorder}; border-top-color: ${F.pink}; border-radius: 50%; animation: idcspin 0.8s linear infinite; }
        @keyframes idcspin { to { transform: rotate(360deg); } }
        .idc-actions { display: flex; gap: 12px; width: 100%; max-width: 400px; }
        .idc-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .18s ease; font-family: inherit; }
        .idc-btn-primary { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .idc-btn-primary:hover { background: #D63F6A; }
        .idc-btn-ghost { background: white; color: ${F.ink}; border: 1px solid ${F.lineMid}; }
        .idc-btn-ghost:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .idc-hint { font-size: 11px; font-weight: 600; color: ${F.muted}; text-align: center; background: ${F.pinkSoft}; padding: 10px; border-radius: 12px; border: 1px solid ${F.pinkBorder}; max-width: 400px; width: 100%; }

        /* ═══ CARD (portrait) ═══ */
        .card { width: 400px; background: linear-gradient(160deg, #FDEEF4 0%, #FFFFFF 40%, #FEF3F7 100%); border-radius: 24px; overflow: hidden; position: relative; border: 3px solid #FBCFE8; font-family: inherit; display: flex; flex-direction: column; }

        /* dot pattern bg */
        .card::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(232,70,119,0.12) 1.5px, transparent 1.5px); background-size: 16px 16px; pointer-events: none; z-index: 0; }

        /* Header */
        .card-hd { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; padding: 18px 20px 12px; gap: 4px; }
        .card-hd-sparkle { font-size: 11px; font-weight: 800; color: ${F.pinkLight}; letter-spacing: 0.18em; }
        .card-hd-logo { height: 28px; width: auto; object-fit: contain; }
        .card-hd-logo-text { font-size: 22px; font-weight: 900; color: ${F.pink}; letter-spacing: -1px; line-height: 1; }
        .card-hd-rule { width: 100%; display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .card-hd-rule-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #FBCFE8, transparent); }
        .card-hd-rule-text { font-size: 8px; font-weight: 800; letter-spacing: 0.2em; color: ${F.pink}; white-space: nowrap; }
        .card-hd-sub { font-size: 9px; font-weight: 600; color: ${F.inkSoft}; letter-spacing: 0.1em; margin-top: 2px; }

        /* Media section */
        .card-media { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 20px 20px; }
        .card-photo-wrap { position: relative; }
        .card-photo { width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 42px; border: 2px solid #FBCFE8; }
        .card-photo img { width: 100%; height: 100%; object-fit: cover; }
        .card-photo-badge { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: ${F.pink}; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; box-shadow: 0 2px 6px rgba(232,70,119,0.4); }
        .card-qr-wrap { position: relative; background: white; border-radius: 16px; padding: 8px; border: 2px solid #FBCFE8; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
        .card-qr-img-wrap { position: relative; width: 100%; aspect-ratio: 1; }
        .card-qr-img-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .card-qr-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid ${F.pink}; display: flex; align-items: center; justify-content: center; color: ${F.pink}; }
        .card-qr-label { font-size: 8px; font-weight: 700; color: ${F.inkSoft}; text-align: center; line-height: 1.4; }
        .card-qr-sub { font-size: 7px; font-weight: 600; color: ${F.muted}; text-align: center; }

        /* Stamp centered between media and info */
        .card-stamp { position: relative; z-index: 2; display: flex; justify-content: center; margin-top: -20px; margin-bottom: -20px; }

        /* Info rows */
        .card-info { position: relative; z-index: 1; padding: 28px 20px 16px; display: flex; flex-direction: column; gap: 0; }
        .card-info-row { display: flex; align-items: center; gap: 0; padding: 9px 0; }
        .card-row-divider { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(251,207,232,0.7) 20%, rgba(251,207,232,0.7) 80%, transparent); }
        .card-icon-sq { width: 32px; height: 32px; border-radius: 9px; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; color: ${F.pink}; flex-shrink: 0; }
        .card-label-col { display: flex; flex-direction: column; margin-left: 10px; min-width: 80px; flex-shrink: 0; }
        .card-lbl-th { font-size: 11px; font-weight: 700; color: ${F.ink}; line-height: 1.2; }
        .card-lbl-en { font-size: 9px; font-weight: 600; color: ${F.muted}; line-height: 1.2; }
        .card-divider-v { width: 1.5px; height: 28px; background: ${F.pink}; opacity: 0.3; margin: 0 12px; flex-shrink: 0; }
        .card-val { font-family: inherit; font-size: 12px; font-weight: 700; color: ${F.ink}; flex: 1; line-height: 1.3; }
        .card-val.is-name { font-size: 15px; font-weight: 900; color: ${F.ink}; letter-spacing: 0.5px; }
        .card-gender { font-size: 15px; margin-left: 4px; }
        .card-gender-m { color: #2563EB; }
        .card-gender-f { color: #DB2777; }

        /* Pet ID box */
        .card-petid { position: relative; z-index: 1; margin: 4px 20px 16px; background: linear-gradient(135deg, #E84677 0%, #F472B6 100%); border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; }
        .card-petid-left { display: flex; flex-direction: column; gap: 2px; }
        .card-petid-paw-label { display: flex; align-items: center; gap: 5px; }
        .card-petid-label { font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.85); letter-spacing: 0.18em; text-transform: uppercase; }
        .card-petid-num { font-family: inherit; font-size: 18px; font-weight: 900; color: white; letter-spacing: 1px; line-height: 1.1; }
        .card-petid-issue { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.75); margin-top: 3px; }
        .card-petid-shield { color: rgba(255,255,255,0.6); }

        /* Footer */
        .card-footer { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 18px; border-top: 1.5px solid #FBCFE8; background: rgba(255,255,255,0.6); flex-wrap: wrap; }
        .card-footer-text { font-size: 9px; font-weight: 700; color: ${F.inkSoft}; letter-spacing: 0.05em; }
        .card-footer-text b { color: ${F.pink}; }
        .card-footer-sep { color: ${F.muted}; font-size: 9px; }
        .card-footer-icon { color: ${F.pink}; display: flex; }

        @media (max-width: 480px) {
          .idc-wrap { padding: 16px 12px 60px; }
          .idc-rendered, .idc-actions, .idc-hint { max-width: 100%; }
          .idc-actions { flex-direction: column; }
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
            {(isGeneratingImage || !cardImageUrl) && (
              <div className="idc-loading"><div className="idc-spinner" /></div>
            )}

            {cardImageUrl && <img src={cardImageUrl} alt="Pet ID Card" className="idc-rendered" />}

            {/* ── ตัวบัตรจริง (ซ่อนไว้ให้ html-to-image จับภาพ) ── */}
            <div
              ref={cardRef}
              className="card"
              style={{ position: cardImageUrl ? 'absolute' : 'relative', opacity: cardImageUrl ? 0 : 1, zIndex: cardImageUrl ? -1 : 0, pointerEvents: 'none' }}
            >
              {/* Header */}
              <div className="card-hd">
                <div className="card-hd-sparkle">✦ &nbsp; ✦ &nbsp; ✦</div>
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
                    {base64Avatar ? <img src={base64Avatar} alt={pet.name} /> : '🐾'}
                  </div>
                  <div className="card-photo-badge">♡</div>
                </div>
                <div className="card-qr-wrap">
                  <div className="card-qr-img-wrap">
                    {base64Qr
                      ? <img src={base64Qr} alt="QR Code" />
                      : <div style={{ width: '100%', height: '100%', background: F.line, borderRadius: 8 }} />}
                    <div className="card-qr-center"><PawSmall /></div>
                  </div>
                  <div className="card-qr-label">สแกนดูโปรไฟล์</div>
                  <div className="card-qr-sub">Scan to view profile</div>
                </div>
              </div>

              {/* Verified stamp */}
              <div className="card-stamp">
                <VerifiedStamp />
              </div>

              {/* Info rows */}
              <div className="card-info">
                {rows.map((r, i) => (
                  <React.Fragment key={i}>
                    <div className="card-info-row">
                      <div className="card-icon-sq">{r.icon}</div>
                      <div className="card-label-col">
                        <span className="card-lbl-th">{r.labelTh}</span>
                        <span className="card-lbl-en">{r.labelEn}</span>
                      </div>
                      <div className="card-divider-v" />
                      <div className={`card-val${r.isName ? ' is-name' : ''}`}>
                        {r.val}
                        {r.isName && (
                          <span className={`card-gender ${isMale ? 'card-gender-m' : 'card-gender-f'}`}>
                            {isMale ? '♂' : '♀'}
                          </span>
                        )}
                      </div>
                    </div>
                    {i < rows.length - 1 && <div className="card-row-divider" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Pet ID box */}
              <div className="card-petid">
                <div className="card-petid-left">
                  <div className="card-petid-paw-label">
                    <PawSmall />
                    <span className="card-petid-label">PET ID</span>
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
                <span className="card-footer-sep">·</span>
                <span className="card-footer-text">ใบรับรองเลขที่ <b>{petCode}</b></span>
                {farm && (
                  <>
                    <span className="card-footer-sep">·</span>
                    <span className="card-footer-text">ฟาร์ม <b>{farm.farm_name}</b></span>
                  </>
                )}
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
