"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

// ─── Icons (เส้น minimal โทนชมพู) ───
const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Paw: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Cat: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>,
  Palette: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Weight: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  Drop: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Cross: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>,
  Chip: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M16 11h1a2 2 0 0 1 0 4h-1"/><path d="M8 11H7a2 2 0 0 0 0 4h1"/><path d="M11 16v1a2 2 0 0 0 4 0v-1"/><path d="M11 8V7a2 2 0 0 1 4 0v1"/></svg>,
  Pin: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Home: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Doc: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Verified: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#E84677"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

// แปลงรูปเป็น Base64 (กัน CORS ตอน html-to-image จับภาพ)
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
        if (!session) return router.push('/login');

        const { data: petData, error: petError } = await supabase.from('pets').select('*').eq('id', petId).single();
        if (petError) throw petError;
        setPet(petData);

        const { data: profileData } = await supabase.from('profiles').select('username, full_name, address').eq('id', petData.user_id).maybeSingle();
        if (profileData) setProfile(profileData);

        if (petData.farm_id && petData.farm_id !== 'PERSONAL') {
          const { data: farmData } = await supabase.from('farms').select('farm_name').eq('id', petData.farm_id).maybeSingle();
          if (farmData) setFarm(farmData);
        }

        // โลโก้ + ตรารับรอง (จริงจาก /public)
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

  // สร้างรูปบัตรเมื่อข้อมูลพร้อม
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

  // อุ้งเท้า: ใช้รูปจริง /paw.png ถ้าโหลดได้, ไม่งั้น fallback เป็น SVG
  const pawImg = (size: number, tint?: string) =>
    base64Paw && !base64Paw.startsWith('/')
      ? <img src={base64Paw} alt="paw" style={{ width: size, height: size, objectFit: 'contain' }} />
      : <span style={{ display: 'flex', color: tint || F.pink }}><Icon.Paw /></span>;

  // แถวข้อมูลในตาราง
  const rows = [
    { icon: <Icon.Paw />, th: 'ชื่อ', en: 'Name', val: pet.name, isName: true },
    { icon: <Icon.Cat />, th: 'สายพันธุ์', en: 'Breed', val: extractThai(pet.breed) },
    { icon: <Icon.Palette />, th: 'สี', en: 'Color', val: extractThai(pet.color) },
    { icon: <Icon.Calendar />, th: 'วันเกิด', en: 'DOB', val: fmtDate(pet.birth_date) },
    { icon: <Icon.Pin />, th: 'เจ้าของ', en: 'Owner', val: profile?.full_name || profile?.username || 'Whiskora User' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .idc-page { font-family: 'Sarabun', sans-serif; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .idc-body { max-width: 1000px; margin: 0 auto; padding: 24px 20px 80px; }
        .idc-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .idc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .idc-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .idc-title { font-family: 'Prompt', sans-serif; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; }
        .idc-sub { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 3px; }
        /* แสดงรูปบัตรที่ render แล้ว */
        .idc-display { display: flex; flex-direction: column; align-items: center; gap: 20px; position: relative; min-height: 400px; }
        .idc-rendered { width: 100%; max-width: 760px; border-radius: 16px; box-shadow: 0 20px 50px rgba(232,70,119,0.15); }
        .idc-loading { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; }
        .idc-spinner { width: 36px; height: 36px; border: 4px solid ${F.pinkBorder}; border-top-color: ${F.pink}; border-radius: 50%; animation: idcspin 0.8s linear infinite; }
        @keyframes idcspin { to { transform: rotate(360deg); } }
        .idc-actions { display: flex; gap: 12px; width: 100%; max-width: 920px; }
        .idc-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .18s ease; font-family: inherit; }
        .idc-btn-primary { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .idc-btn-primary:hover { background: #D63F6A; }
        .idc-btn-ghost { background: white; color: ${F.ink}; border: 1px solid ${F.lineMid}; }
        .idc-btn-ghost:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .idc-hint { font-size: 11px; font-weight: 600; color: ${F.muted}; text-align: center; background: ${F.pinkSoft}; padding: 10px; border-radius: 12px; border: 1px solid ${F.pinkBorder}; max-width: 760px; width: 100%; }

        /* ═══ ตัวบัตร (แนวนอน — สัดส่วนใกล้บัตรประชาชน) ═══ */
        .idc-card { width: 760px; background: linear-gradient(135deg, #FFF8FB 0%, #FFFFFF 50%, #FFF0F6 100%); border-radius: 16px; overflow: hidden; position: relative; border: 1px solid ${F.pinkBorder}; }
        .idc-card-pattern { position: absolute; inset: 0; opacity: 0.4; pointer-events: none; background-image: radial-gradient(circle at 92% 12%, rgba(251,207,232,0.4) 0%, transparent 38%), radial-gradient(circle at 8% 88%, rgba(251,207,232,0.3) 0%, transparent 32%); }
        .idc-brand { display: flex; align-items: center; gap: 9px; padding: 14px 22px 0; position: relative; z-index: 1; }
        .idc-brand-logo { height: 26px; width: auto; object-fit: contain; }
        .idc-brand-logo-fallback { font-family: 'Prompt', sans-serif; font-size: 19px; font-weight: 700; color: ${F.pink}; letter-spacing: -0.5px; }
        .idc-brand-sub { font-size: 8px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.12em; border-left: 1px solid ${F.pinkBorder}; padding-left: 9px; }
        .idc-main { display: grid; grid-template-columns: 175px 1fr 150px; gap: 18px; padding: 12px 22px 18px; position: relative; z-index: 1; }
        .idc-photo { width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 42px; border: 1px solid ${F.pinkBorder}; }
        .idc-photo img { width: 100%; height: 100%; object-fit: cover; }
        .idc-petid-box { margin-top: 10px; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; border-radius: 11px; padding: 10px 12px; }
        .idc-petid-label { display: flex; align-items: center; gap: 5px; font-size: 9px; font-weight: 700; color: ${F.pink}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .idc-petid-num { font-family: 'Prompt', monospace; font-size: 16px; font-weight: 700; color: ${F.ink}; letter-spacing: 0.2px; white-space: nowrap; }
        .idc-petid-issue { font-size: 8px; color: ${F.muted}; margin-top: 2px; }
        .idc-mid-header { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1.5px dashed ${F.pinkBorder}; }
        .idc-cert-shield { width: 32px; height: 32px; border-radius: 9px; background: ${F.pink}; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .idc-cert-title { display: flex; align-items: center; gap: 5px; font-family: 'Prompt', sans-serif; font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .idc-cert-no { font-size: 9px; color: ${F.inkSoft}; margin-top: 1px; }
        .idc-cert-no b { color: ${F.pink}; font-family: 'Prompt', monospace; font-weight: 700; }
        .idc-rows { display: flex; flex-direction: column; }
        .idc-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px dotted ${F.lineMid}; }
        .idc-row:last-child { border-bottom: none; }
        .idc-row-icon { color: ${F.pink}; flex-shrink: 0; display: flex; }
        .idc-row-label { font-size: 12px; font-weight: 600; color: ${F.inkSoft}; white-space: nowrap; flex-shrink: 0; }
        .idc-row-label .en { font-size: 9px; color: ${F.muted}; font-weight: 500; }
        .idc-row-val { margin-left: auto; font-size: 13px; font-weight: 700; color: ${F.ink}; text-align: right; font-family: 'Prompt', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 12px; }
        .idc-row-val .gender { color: ${isMale ? '#2563EB' : '#DB2777'}; margin-left: 4px; }
        .idc-right { display: flex; flex-direction: column; align-items: center; gap: 10px; justify-content: center; }
        .idc-verified { width: 56px; height: 56px; }
        .idc-verified img { width: 100%; height: 100%; object-fit: contain; }
        .idc-verified-fallback { width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid ${F.pink}; display: flex; flex-direction: column; align-items: center; justify-content: center; color: ${F.pink}; }
        .idc-qr-section { background: white; border: 1px solid ${F.pinkBorder}; border-radius: 12px; padding: 11px; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; }
        .idc-qr-title { font-size: 9px; font-weight: 700; color: ${F.inkSoft}; text-align: center; line-height: 1.4; }
        .idc-qr-img { width: 88px; height: 88px; position: relative; }
        .idc-qr-img img { width: 100%; height: 100%; object-fit: contain; }
        .idc-qr-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid ${F.pink}; display: flex; align-items: center; justify-content: center; color: ${F.pink}; }
        .idc-qr-hint { font-size: 8px; color: ${F.muted}; text-align: center; }
        .idc-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${F.pinkBorder}; border-top: 1px solid ${F.pinkBorder}; position: relative; z-index: 1; }
        .idc-foot-cell { background: linear-gradient(135deg, #FFF8FB, #FFFFFF); padding: 9px 14px; display: flex; align-items: center; gap: 7px; }
        .idc-foot-icon { color: ${F.pink}; flex-shrink: 0; }
        .idc-foot-label { font-size: 8px; font-weight: 700; color: ${F.muted}; }
        .idc-foot-val { font-size: 11px; font-weight: 700; color: ${F.ink}; font-family: 'Prompt', sans-serif; white-space: nowrap; }
        .idc-bottombar { background: ${F.pink}; color: white; text-align: center; padding: 6px; font-size: 9px; font-weight: 600; position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }
        @media (max-width: 768px) {
          .idc-body { padding: 16px 12px 60px; }
          .idc-rendered, .idc-actions, .idc-hint { max-width: 100%; }
          .idc-actions { flex-direction: column; }
        }
      `}</style>

      <div className="idc-page">
        <div className="idc-body">
          {/* Topbar */}
          <div className="idc-topbar">
            <button onClick={() => router.back()} className="idc-back" aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="idc-title">บัตรประจำตัวสัตว์เลี้ยง</h1>
              <p className="idc-sub">Whiskora Pet Identification Card</p>
            </div>
          </div>

          <div className="idc-display">
            {/* Loading */}
            {(isGeneratingImage || !cardImageUrl) && (
              <div className="idc-loading"><div className="idc-spinner" /></div>
            )}

            {/* รูปบัตรที่ render แล้ว (ให้กดเซฟ) */}
            {cardImageUrl && <img src={cardImageUrl} alt="Pet ID Card" className="idc-rendered" />}

            {/* ── ตัวบัตรจริง (ซ่อนไว้ให้ html-to-image จับภาพ) ── */}
            <div
              ref={cardRef}
              className="idc-card"
              style={{ position: cardImageUrl ? 'absolute' : 'relative', opacity: cardImageUrl ? 0 : 1, zIndex: cardImageUrl ? -1 : 0, pointerEvents: 'none' }}
            >
              <div className="idc-card-pattern" />
              {/* โลโก้มุมซ้ายบน */}
              <div className="idc-brand">
                {base64Logo && !base64Logo.startsWith('/')
                  ? <img src={base64Logo} alt="Whiskora" className="idc-brand-logo" />
                  : <span className="idc-brand-logo-fallback">whiskora</span>}
                <span className="idc-brand-sub">Pet Identification Card · บัตรประจำตัวสัตว์เลี้ยง</span>
              </div>
              <div className="idc-main">
                {/* ซ้าย: รูป + Pet ID */}
                <div>
                  <div className="idc-photo">{base64Avatar ? <img src={base64Avatar} alt={pet.name} /> : '🐾'}</div>
                  <div className="idc-petid-box">
                    <div className="idc-petid-label">{pawImg(13)} PET ID</div>
                    <div className="idc-petid-num">{petCode}</div>
                    <div className="idc-petid-issue">ออกให้เมื่อ {fmtThaiDate(issueDate)}</div>
                  </div>
                </div>

                {/* กลาง: header + ตาราง */}
                <div>
                  <div className="idc-mid-header">
                    <div className="idc-cert-shield">{pawImg(18, 'white')}</div>
                    <div>
                      <div className="idc-cert-title">รับรองโดย Whiskora <Icon.Verified /></div>
                      <div className="idc-cert-no">ใบรับรองเลขที่ <b>{petCode}</b></div>
                    </div>
                  </div>
                  <div className="idc-rows">
                    {rows.map((r, i) => (
                      <div key={i} className="idc-row">
                        <span className="idc-row-icon">{r.icon}</span>
                        <span className="idc-row-label">{r.th} <span className="en">({r.en})</span></span>
                        <span className="idc-row-val">
                          {r.val}
                          {r.isName && <span className="gender">{isMale ? '♂' : '♀'}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ขวา: ตรารับรอง + QR */}
                <div className="idc-right">
                  <div className="idc-verified">
                    {base64Verified && !base64Verified.startsWith('/') ? (
                      <img src={base64Verified} alt="Verified" />
                    ) : (
                      <div className="idc-verified-fallback">
                        {pawImg(20)}
                        <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.1em', marginTop: '2px' }}>VERIFIED</span>
                      </div>
                    )}
                  </div>
                  <div className="idc-qr-section">
                    <div className="idc-qr-title">สแกนเพื่อดูข้อมูลสัตว์เลี้ยง</div>
                    <div className="idc-qr-img">
                      {base64Qr ? <img src={base64Qr} alt="QR" /> : <div style={{ width: '100%', height: '100%', background: F.line, borderRadius: 8 }} />}
                      <div className="idc-qr-center">{pawImg(14)}</div>
                    </div>
                    <div className="idc-qr-hint">หรือสแกนด้วยกล้องทั่วไป</div>
                  </div>
                </div>
              </div>

              {/* แถบล่าง (3 ช่อง — ตัดลายเซ็นออก) */}
              <div className="idc-footer">
                <div className="idc-foot-cell">
                  <span className="idc-foot-icon"><Icon.Calendar /></span>
                  <div><div className="idc-foot-label">วันที่ออกบัตร</div><div className="idc-foot-val">{fmtThaiDate(issueDate)}</div></div>
                </div>
                <div className="idc-foot-cell">
                  <span className="idc-foot-icon"><Icon.Shield /></span>
                  <div><div className="idc-foot-label">บัตรหมดอายุ</div><div className="idc-foot-val">{fmtThaiDate(expireDate)}</div></div>
                </div>
                <div className="idc-foot-cell">
                  <span className="idc-foot-icon"><Icon.Doc /></span>
                  <div><div className="idc-foot-label">ออกโดย</div><div className="idc-foot-val">Whiskora System</div></div>
                </div>
              </div>
              <div className="idc-bottombar">{pawImg(13, 'white')} ตรวจสอบข้อมูลได้ที่ whiskora.pet/verify หรือสแกน QR Code</div>
            </div>

            {/* Actions */}
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