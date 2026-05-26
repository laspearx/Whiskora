"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Paw: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Cat: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>,
  Palette: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>,
  Calendar: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Drop: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Cross: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>,
  Shield: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Verified: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#E84677"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

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
  const [base64Verified, setBase64Verified] = useState<string | null>(null);
  const [base64Paw, setBase64Paw] = useState<string | null>(null);

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
        setBase64Verified(await fetchImageAsBase64('/verified.png'));
        setBase64Paw(await fetchImageAsBase64('/paw.png'));

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
  }, [loading, pet, profile, farm, base64Qr, base64Avatar, base64Logo, base64Verified, base64Paw]);

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

  const extractThai = (text: string | null) => text ? text.split('(')[0].trim() : '-';
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
  const expireDate = new Date(); expireDate.setFullYear(expireDate.getFullYear() + 2);

  const rows = [
    { icon: <Icon.Paw />, label: 'ชื่อ', val: pet.name ? pet.name.toUpperCase() : '-', isName: true },
    { icon: <Icon.Cat />, label: 'สายพันธุ์', val: extractBoth(pet.breed) },
    { icon: <Icon.Palette />, label: 'สี', val: extractBoth(pet.color) },
    { icon: <Icon.Calendar />, label: 'วันเกิด', val: fmtDate(pet.birth_date) },
    { icon: <Icon.Clock />, label: 'อายุ', val: calcAge(pet.birth_date) },
    { icon: <Icon.Drop />, label: 'กรุ๊ปเลือด', val: pet.blood_type || '-' },
    { icon: <Icon.Cross />, label: 'ทำหมัน', val: pet.is_neutered ? 'ทำหมันแล้ว ✓' : 'ไม่ทำหมัน' },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .idc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .idc-body { max-width: 1000px; margin: 0 auto; padding: 24px 20px 80px; }
        .idc-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .idc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .idc-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .idc-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; }
        .idc-sub { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 3px; }
        .idc-display { display: flex; flex-direction: column; align-items: center; gap: 20px; position: relative; min-height: 400px; }
        .idc-rendered { width: 100%; max-width: 760px; border-radius: 16px; box-shadow: 0 20px 50px rgba(232,70,119,0.15); }
        .idc-loading { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; }
        .idc-spinner { width: 36px; height: 36px; border: 4px solid ${F.pinkBorder}; border-top-color: ${F.pink}; border-radius: 50%; animation: idcspin 0.8s linear infinite; }
        @keyframes idcspin { to { transform: rotate(360deg); } }
        .idc-actions { display: flex; gap: 12px; width: 100%; max-width: 760px; }
        .idc-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .18s ease; font-family: inherit; }
        .idc-btn-primary { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .idc-btn-primary:hover { background: #D63F6A; }
        .idc-btn-ghost { background: white; color: ${F.ink}; border: 1px solid ${F.lineMid}; }
        .idc-btn-ghost:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .idc-hint { font-size: 11px; font-weight: 600; color: ${F.muted}; text-align: center; background: ${F.pinkSoft}; padding: 10px; border-radius: 12px; border: 1px solid ${F.pinkBorder}; max-width: 760px; width: 100%; }

        /* ═══ ตัวบัตร ═══ */
        .idc-card { width: 760px; background: linear-gradient(135deg, #FEF1F6 0%, #FFFFFF 55%, #FEF1F6 100%); border-radius: 20px; overflow: hidden; position: relative; border: 5px solid #FCE0EC; font-family: inherit; }
        .idc-card-pattern { position: absolute; inset: 0; opacity: 0.45; pointer-events: none; background-image: radial-gradient(circle at 5% 90%, rgba(251,207,232,0.3) 0%, transparent 30%), radial-gradient(circle at 95% 10%, rgba(251,207,232,0.2) 0%, transparent 25%); }

        /* Header แถบด้านบน */
        .idc-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px 14px; border-bottom: 1.5px solid #FCE0EC; position: relative; z-index: 1; }
        .idc-brand { display: flex; align-items: center; gap: 10px; }
        .idc-brand-logo { height: 32px; width: auto; object-fit: contain; }
        .idc-brand-logo-fallback { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.pink}; letter-spacing: -1px; }
        .idc-brand-titles { line-height: 1.25; }
        .idc-brand-en { font-size: 11px; font-weight: 700; color: ${F.ink}; letter-spacing: 0.07em; }
        .idc-brand-th { font-size: 10px; font-weight: 600; color: ${F.inkSoft}; }
        .idc-verified-stamp { width: 58px; height: 58px; flex-shrink: 0; }
        .idc-verified-stamp img { width: 100%; height: 100%; object-fit: contain; }
        .idc-verified-fallback { width: 58px; height: 58px; border-radius: 50%; border: 2.5px dashed ${F.pink}; display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${F.pink}; gap: 2px; }
        .idc-verified-fallback-text { font-size: 6.5px; font-weight: 800; letter-spacing: 0.1em; color: ${F.pink}; text-transform: uppercase; }

        /* Body: 3 คอลัมน์ */
        .idc-body-grid { display: grid; grid-template-columns: 195px 1fr 130px; gap: 0; padding: 18px 22px 16px; position: relative; z-index: 1; align-items: stretch; }

        /* คอลัมน์ซ้าย: รูป + ID */
        .idc-col-left { padding-right: 18px; border-right: 1.5px solid #FCE0EC; }
        .idc-photo { width: 100%; aspect-ratio: 1; border-radius: 14px; overflow: hidden; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 48px; }
        .idc-photo img { width: 100%; height: 100%; object-fit: cover; }
        .idc-petid-box { margin-top: 10px; background: rgba(253,242,245,0.8); border-radius: 10px; padding: 10px 12px; border: 1px solid #FCE0EC; }
        .idc-petid-label { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 800; color: ${F.pink}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
        .idc-petid-num { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; letter-spacing: 0.5px; word-break: break-all; line-height: 1.2; }
        .idc-petid-issue { font-size: 8.5px; color: ${F.muted}; margin-top: 4px; line-height: 1.4; }

        /* คอลัมน์กลาง: แถวข้อมูล */
        .idc-col-mid { padding: 2px 16px; }
        .idc-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px dashed rgba(252,224,236,0.8); }
        .idc-row:last-child { border-bottom: none; }
        .idc-icon-circle { width: 26px; height: 26px; border-radius: 50%; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; display: flex; align-items: center; justify-content: center; color: ${F.pink}; flex-shrink: 0; }
        .idc-row-label { font-size: 10.5px; font-weight: 600; color: ${F.muted}; min-width: 56px; flex-shrink: 0; }
        .idc-row-val { font-family: inherit; font-size: 13px; font-weight: 700; color: ${F.ink}; line-height: 1.3; flex: 1; min-width: 0; }
        .idc-row-val.is-name { font-size: 15px; font-weight: 800; color: ${F.ink}; letter-spacing: 0.5px; }
        .idc-gender { font-size: 15px; margin-left: 3px; }
        .idc-gender-m { color: #2563EB; }
        .idc-gender-f { color: #DB2777; }

        /* คอลัมน์ขวา: QR */
        .idc-col-right { padding-left: 16px; border-left: 1.5px solid #FCE0EC; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
        .idc-qr-wrap { position: relative; width: 110px; height: 110px; background: white; border-radius: 10px; padding: 4px; border: 1.5px solid #FCE0EC; }
        .idc-qr-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .idc-qr-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid ${F.pink}; display: flex; align-items: center; justify-content: center; color: ${F.pink}; }
        .idc-qr-label { font-size: 9px; font-weight: 700; color: ${F.inkSoft}; text-align: center; line-height: 1.4; }
        .idc-qr-sub { font-size: 8px; font-weight: 600; color: ${F.muted}; text-align: center; }

        /* Footer */
        .idc-footer { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-top: 1.5px solid #FCE0EC; position: relative; z-index: 1; background: rgba(255,255,255,0.5); flex-wrap: wrap; }
        .idc-foot-text { font-size: 11px; font-weight: 600; color: ${F.inkSoft}; }
        .idc-foot-text b { color: ${F.pink}; font-family: inherit; font-weight: 700; }
        .idc-foot-sep { color: ${F.muted}; font-size: 11px; }

        @media (max-width: 768px) {
          .idc-body { padding: 16px 12px 60px; }
          .idc-rendered, .idc-actions, .idc-hint { max-width: 100%; }
          .idc-actions { flex-direction: column; }
        }
      `}</style>

      <div className="idc-page">
        <div className="idc-body">
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
              className="idc-card"
              style={{ position: cardImageUrl ? 'absolute' : 'relative', opacity: cardImageUrl ? 0 : 1, zIndex: cardImageUrl ? -1 : 0, pointerEvents: 'none' }}
            >
              <div className="idc-card-pattern" />

              {/* Header: โลโก้ซ้าย + VERIFIED ขวา */}
              <div className="idc-header">
                <div className="idc-brand">
                  {base64Logo && !base64Logo.startsWith('/')
                    ? <img src={base64Logo} alt="Whiskora" className="idc-brand-logo" />
                    : <span className="idc-brand-logo-fallback">whiskora</span>}
                  <div className="idc-brand-titles">
                    <div className="idc-brand-en">PET IDENTIFICATION CARD</div>
                    <div className="idc-brand-th">บัตรประจำตัวสัตว์เลี้ยง</div>
                  </div>
                </div>
                <div className="idc-verified-stamp">
                  {base64Verified && !base64Verified.startsWith('/') ? (
                    <img src={base64Verified} alt="Verified" />
                  ) : (
                    <div className="idc-verified-fallback">
                      <Icon.Shield />
                      <span className="idc-verified-fallback-text">VERIFIED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Body: 3 คอลัมน์ */}
              <div className="idc-body-grid">
                {/* ซ้าย: รูป + Pet ID */}
                <div className="idc-col-left">
                  <div className="idc-photo">
                    {base64Avatar ? <img src={base64Avatar} alt={pet.name} /> : '🐾'}
                  </div>
                  <div className="idc-petid-box">
                    <div className="idc-petid-label">
                      <Icon.Paw /> PET ID
                    </div>
                    <div className="idc-petid-num">{petCode}</div>
                    <div className="idc-petid-issue">
                      ออกให้เมื่อ {fmtThaiDate(issueDate)}<br />
                      หมดอายุ {fmtThaiDate(expireDate)}
                    </div>
                  </div>
                </div>

                {/* กลาง: แถวข้อมูล */}
                <div className="idc-col-mid">
                  {rows.map((r, i) => (
                    <div key={i} className="idc-row">
                      <div className="idc-icon-circle">{r.icon}</div>
                      <div className="idc-row-label">{r.label}</div>
                      <div className={`idc-row-val${r.isName ? ' is-name' : ''}`}>
                        {r.val}
                        {r.isName && (
                          <span className={`idc-gender ${isMale ? 'idc-gender-m' : 'idc-gender-f'}`}>
                            {isMale ? '♂' : '♀'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ขวา: QR code */}
                <div className="idc-col-right">
                  <div className="idc-qr-wrap">
                    {base64Qr
                      ? <img src={base64Qr} alt="QR Code" />
                      : <div style={{ width: '100%', height: '100%', background: F.line, borderRadius: 6 }} />}
                    <div className="idc-qr-center"><Icon.Paw /></div>
                  </div>
                  <div className="idc-qr-label">สแกนดูโปรไฟล์</div>
                  <div className="idc-qr-sub">Scan to view profile</div>
                </div>
              </div>

              {/* Footer */}
              <div className="idc-footer">
                <span style={{ color: F.pink, display: 'flex' }}><Icon.Shield /></span>
                <span className="idc-foot-text">รับรองโดย Whiskora</span>
                <Icon.Verified />
                <span className="idc-foot-sep">·</span>
                <span className="idc-foot-text">ใบรับรองเลขที่ <b>{petCode}</b></span>
                {farm && (
                  <>
                    <span className="idc-foot-sep">·</span>
                    <span className="idc-foot-text">ฟาร์ม <b>{farm.farm_name}</b></span>
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
