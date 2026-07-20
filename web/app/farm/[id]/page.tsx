"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { speciesTh } from '@/lib/species';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Verified: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="#E84677"><path d="M12 2l2.4 1.8 3 .2.9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.3 15l.9-2.9-.9-2.9 2.4-1.8.9-2.9 3-.2L12 2z"/><path d="M9.5 12.5l1.8 1.8 3.7-3.7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Pin: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  User: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Phone: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Shield: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Male: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Cat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/></svg>,
};

export default function PublicFarmProfile() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [litters, setLitters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const prev = document.documentElement.style.overflowX;
    document.documentElement.style.overflowX = 'clip';
    return () => { document.documentElement.style.overflowX = prev; };
  }, []);

  useEffect(() => {
    const fetchFarmProfile = async () => {
      try {
        const { data: farmData, error: farmError } = await supabase
          .from('farms').select('*').eq('id', farmId).single();
        if (farmError) throw farmError;
        setFarm(farmData);

        const { data: { session } } = await supabase.auth.getSession();
        if (session && farmData.user_id === session.user.id) setIsOwner(true);

        // เจ้าของฟาร์ม (ชื่อ/อีเมล/ที่อยู่)
        if (farmData.user_id) {
          const { data: ownerData } = await supabase
            .from('profiles').select('full_name, username, email, address')
            .eq('id', farmData.user_id).maybeSingle();
          if (ownerData) setOwner(ownerData);
        }

        const { data: petsData } = await supabase
          .from('pets').select('id, name, breed, image_url, gender, status, price, birth_date')
          .eq('farm_id', farmId);
        if (petsData) setPets(petsData);

        const { data: littersData } = await supabase
          .from('litters').select('id, status').eq('farm_id', farmId);
        if (littersData) setLitters(littersData);
      } catch (error) {
        console.error("Error fetching farm:", error);
        alert("ไม่พบข้อมูลฟาร์มนี้ครับ");
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    if (farmId) fetchFarmProfile();
  }, [farmId, router]);

  const isMale = (g: string) => g === 'male' || g === 'ตัวผู้';
  const isFemale = (g: string) => g === 'female' || g === 'ตัวเมีย';

  // ─── สถานะการยืนยัน: verified = ฟาร์มคุณภาพ / ไม่ verified = โฮมบรีด ───
  const isVerified = !!farm?.is_verified;

  // ─── สถิติ (คำนวณจากข้อมูลจริง) ───
  const stats = {
    total: pets.length,
    ready: pets.filter(p => p.status === 'พร้อมย้ายบ้าน').length,
    breeders: pets.filter(p => ['พ่อพันธุ์ / แม่พันธุ์', 'พ่อพันธุ์', 'แม่พันธุ์'].includes(p.status)).length,
    neutered: pets.filter(p => p.status === 'ทำหมัน / ปลดระวาง').length,
    litters: litters.length,
  };

  const readyPets = pets.filter(p => p.status === 'พร้อมย้ายบ้าน');

  const calcAge = (b?: string | null) => {
    if (!b) return '';
    const dob = new Date(b), now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    if (m < 0) { y--; m += 12; }
    if (y === 0 && m === 0) return 'เพิ่งเกิด';
    return `${y > 0 ? y + ' ปี ' : ''}${m > 0 ? m + ' เดือน' : ''}`.trim();
  };
  const extractThai = (t?: string | null) => t ? t.split('(')[0].trim() : '-';
  const speciesLabel = (s?: string) => speciesTh(s) || 'สัตว์เลี้ยง';
  const foundedDate = farm?.created_at ? new Date(farm.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: farm?.farm_name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  if (isLoading) return <PageLoader />;
  if (!farm) return null;

  const ownerName = farm?.owner_name || owner?.full_name || owner?.username || 'เจ้าของฟาร์ม';
  const farmLocation = farm?.address || owner?.address || null;
  const uniqueBreeds = [...new Set(pets.map(p => extractThai(p.breed)).filter(Boolean))].slice(0, 4);
  const bioText = farm.bio || `ฟาร์ม${speciesLabel(farm.species)}คุณภาพ ดูแลด้วยความใส่ใจ`;
  const bioIsLong = bioText.length > 120;

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .fp-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .fp-body { max-width: 1000px; margin: 0 auto; padding-bottom: 100px; }
        /* ── Cover ── */
        .fp-cover { position: relative; aspect-ratio: 3/1; min-height: 160px; background: linear-gradient(135deg, ${F.pinkSoft}, #FFE8F0); overflow: hidden; width: 100vw; left: 50%; transform: translateX(-50%); }
        .fp-cover img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
        .fp-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 40%); }
        .fp-cover-top { position: absolute; top: 16px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 2; }
        .fp-cover-btn { width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); color: ${F.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.12); transition: all .15s; }
        .fp-cover-btn:hover { background: white; transform: scale(1.05); }
        .fp-cover-verified { position: absolute; bottom: 16px; right: 20px; width: 84px; height: 84px; z-index: 2; }
        .fp-cover-verified img, .fp-cover-verified svg { width: 100%; height: 100%; filter: drop-shadow(0 4px 12px rgba(232,70,119,0.3)); }
        /* ── Identity ── */
        .fp-identity { background: white; border-radius: 24px 24px 0 0; margin-top: -24px; position: relative; z-index: 3; padding: 0 24px 24px; }
        .fp-id-row { display: flex; align-items: flex-end; gap: 18px; padding-top: 14px; flex-wrap: wrap; }
        .fp-avatar { width: 116px; height: 116px; border-radius: 50%; border: 4px solid white; margin-top: -72px; overflow: hidden; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 44px; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .fp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fp-id-main { flex: 1; min-width: 200px; }
        .fp-name { font-family: inherit; font-size: 28px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .fp-tagline { font-size: 13px; font-weight: 400; color: ${F.inkSoft}; margin-top: 4px; }
        .fp-meta-row { display: flex; align-items: center; gap: 14px; margin-top: 10px; flex-wrap: wrap; font-size: 12px; color: ${F.muted}; font-weight: 400; }
        .fp-meta-item { display: inline-flex; align-items: center; gap: 5px; }
        .fp-badge-type { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .fp-badge-verified { background: ${F.pinkSoft}; color: ${F.pink}; border: 1px solid ${F.pinkBorder}; }
        .fp-badge-home { background: #F3F4F6; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        /* ── Bio + quality card ── */
        .fp-bio-card { display: grid; grid-template-columns: 1fr auto; gap: 20px; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; border-radius: 18px; padding: 18px 20px; margin-top: 18px; }
        .fp-bio-text { font-size: 13px; font-weight: 400; color: ${F.inkSoft}; line-height: 1.65; }
        .fp-bio-toggle { color: ${F.pink}; font-size: 12px; font-weight: 500; cursor: pointer; background: none; border: none; padding: 4px 0 0; display: inline-flex; align-items: center; gap: 3px; }
        .fp-quality { display: flex; align-items: flex-start; gap: 10px; border-left: 1px solid ${F.pinkBorder}; padding-left: 20px; min-width: 180px; }
        .fp-quality-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fp-quality-title { font-family: inherit; font-size: 13px; font-weight: 600; color: ${F.ink}; }
        .fp-quality-sub { font-size: 11px; font-weight: 400; color: ${F.inkSoft}; line-height: 1.5; margin-top: 2px; }
        /* ── Stats ── */
        .fp-stats-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 22px; margin-top: 16px; }
        .fp-stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        .fp-stat { text-align: center; }
        .fp-stat-label { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; color: ${F.muted}; margin-bottom: 6px; }
        .fp-stat-num { font-family: inherit; font-size: 28px; font-weight: 700; line-height: 1; }
        .fp-stat-unit { font-size: 11px; color: ${F.muted}; font-weight: 400; margin-top: 3px; }
        /* ── Section ── */
        .fp-section { margin-top: 20px; padding: 0 24px; }
        .fp-section-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 22px; }
        .fp-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .fp-section-title { display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 16px; font-weight: 600; color: ${F.ink}; }
        /* ── Farm info ── */
        .fp-info-grid { display: flex; flex-direction: column; gap: 0; }
        .fp-info-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px dotted ${F.lineMid}; }
        .fp-info-row:last-child { border-bottom: none; }
        a.fp-info-row-link { text-decoration: none; cursor: pointer; border-radius: 10px; margin: 0 -8px; padding-left: 8px; padding-right: 8px; transition: background .15s; }
        a.fp-info-row-link:hover { background: ${F.pinkSoft}; }
        .fp-info-icon { color: ${F.pink}; flex-shrink: 0; display: flex; }
        .fp-info-label { font-size: 13px; color: ${F.muted}; font-weight: 400; min-width: 110px; }
        .fp-info-val { font-size: 13px; color: ${F.ink}; font-weight: 500; margin-left: auto; text-align: right; }
        .fp-info-val.verified { color: ${F.pink}; }
        /* ── Ready pets ── */
        .fp-pets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
        .fp-pet-card { background: white; border: 1px solid ${F.line}; border-radius: 16px; overflow: hidden; text-decoration: none; transition: all .2s; display: block; }
        .fp-pet-card:hover { border-color: ${F.pinkBorder}; box-shadow: 0 6px 20px rgba(232,70,119,.1); transform: translateY(-2px); }
        .fp-pet-img { width: 100%; aspect-ratio: 1; background: ${F.pinkSoft}; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 32px; position: relative; }
        .fp-pet-img img { width: 100%; height: 100%; object-fit: cover; }
        .fp-pet-ready-tag { position: absolute; top: 8px; left: 8px; background: ${F.pink}; color: white; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 10px; }
        .fp-pet-info { padding: 12px 14px; }
        .fp-pet-name { font-family: inherit; font-size: 14px; font-weight: 700; color: ${F.ink}; display: flex; align-items: center; gap: 5px; }
        .fp-pet-name .g-m { color: #2563EB; }
        .fp-pet-name .g-f { color: #DB2777; }
        .fp-pet-breed { font-size: 11px; color: ${F.muted}; font-weight: 400; margin-top: 2px; }
        .fp-pet-age { font-size: 10px; color: ${F.muted}; margin-top: 1px; }
        .fp-pet-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
        .fp-pet-price { font-family: inherit; font-size: 13px; font-weight: 800; color: #C2410C; }
        .fp-pet-pill { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 8px; background: ${F.pinkSoft}; color: ${F.pink}; }
        .fp-empty { text-align: center; padding: 32px; color: ${F.muted}; font-size: 13px; font-weight: 600; }
        /* ── Sticky bottom CTA ── */
        .fp-cta-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .fp-cta-inner { max-width: 1000px; margin: 0 auto; display: flex; gap: 12px; }
        .fp-cta-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 26px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s ease; font-family: inherit; text-decoration: none; }
        .fp-cta-primary { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .fp-cta-primary:hover { background: #D63F6A; }
        .fp-cta-ghost { background: white; color: ${F.pink}; border: 1px solid ${F.pinkBorder}; }
        .fp-cta-ghost:hover { background: ${F.pinkSoft}; }
        .fp-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: ${F.ink}; color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 60; }
        /* ── Add pet modal ── */
        .fp-modal-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(31,26,28,0.45); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
        .fp-modal-sheet { background: white; border-radius: 24px 24px 0 0; padding: 20px 20px 36px; width: 100%; max-width: 480px; animation: fp-sheet-up .22s ease; }
        @keyframes fp-sheet-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .fp-modal-handle { width: 40px; height: 4px; border-radius: 2px; background: #E5E7EB; margin: 0 auto 18px; }
        .fp-modal-title { font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; text-align: center; }
        .fp-modal-options { display: flex; gap: 12px; }
        .fp-modal-option { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 12px; border-radius: 18px; border: 1.5px solid ${F.line}; background: white; text-decoration: none; cursor: pointer; transition: border-color .15s, background .15s; }
        .fp-modal-option:hover { border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; }
        .fp-modal-option-img { width: 56px; height: 56px; object-fit: contain; }
        .fp-modal-option-label { font-size: 13px; font-weight: 700; color: ${F.ink}; text-align: center; line-height: 1.3; }
        .fp-modal-cancel { width: 100%; margin-top: 12px; padding: 12px; border-radius: 12px; border: none; background: #F3F4F6; color: ${F.inkSoft}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }

        /* ── Owner action tabs ── */
        .fp-owner-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 55; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-top: 1px solid rgba(232,70,119,0.10); box-shadow: 0 -4px 24px rgba(31,26,28,0.08); padding-bottom: env(safe-area-inset-bottom, 0px); }
        .fp-owner-inner { display: flex; align-items: stretch; height: 68px; }
        .fp-owner-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; text-decoration: none; color: ${F.inkSoft}; border: none; background: none; font-family: inherit; cursor: pointer; }
        .fp-owner-tab-icon { width: 72px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .fp-owner-tab-icon:active { background: rgba(232,70,119,0.09); }
        .fp-owner-tab-label { font-size: 10px; font-weight: 600; line-height: 1.2; }
        @media (max-width: 720px) {
          .fp-bio-card { grid-template-columns: 1fr; }
          .fp-quality { border-left: none; border-top: 1px solid ${F.pinkBorder}; padding-left: 0; padding-top: 14px; }
          .fp-stats-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .fp-identity, .fp-section { padding-left: 16px; padding-right: 16px; }
        }
        @media (max-width: 420px) {
          .fp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .fp-name { font-size: 22px; }
        }
      `}</style>

      <div className="fp-page">
        <div className="fp-body">
          {/* ── Cover ── */}
          <div className="fp-cover">
            {farm.cover_url || farm.image_url ? <img src={farm.cover_url || farm.image_url} alt={farm.farm_name} /> : null}
            <div className="fp-cover-overlay" />
            <div className="fp-cover-top">
              <button className="fp-cover-btn" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <button className="fp-cover-btn" onClick={handleShare} aria-label="แชร์"><Icon.Share /></button>
            </div>
            {isVerified && (
              <div className="fp-cover-verified" title="Whiskora Verified">
                <svg viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="46" fill="white" stroke={F.pinkBorder} strokeWidth="2"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke={F.pink} strokeWidth="1.5" strokeDasharray="3 3"/>
                  <g transform="translate(50,42)" fill={F.pink}><circle cx="-8" cy="-4" r="3.5"/><circle cx="8" cy="-4" r="3.5"/><circle cx="-14" cy="3" r="3"/><circle cx="14" cy="3" r="3"/><path d="M0 0c-5 0-9 4-11 8-1.5 3-.5 6 3 7 2.5.7 5 .3 8 .3s5.5.4 8-.3c3.5-1 4.5-4 3-7-2-4-6-8-11-8z"/></g>
                  <text x="50" y="72" textAnchor="middle" fontSize="9" fontWeight="700" fill={F.pink} fontFamily="sans-serif">VERIFIED</text>
                </svg>
              </div>
            )}
          </div>

          {/* ── Identity ── */}
          <div className="fp-identity">
            <div className="fp-id-row">
              <div className="fp-avatar">{farm.image_url ? <img src={farm.image_url} alt={farm.farm_name} /> : (farm.species === 'cat' ? '🐱' : farm.species === 'dog' ? '🐶' : '🏡')}</div>
              <div className="fp-id-main">
                <h1 className="fp-name">
                  {farm.farm_name}
                  {isVerified && <Icon.Verified />}
                </h1>
                <p className="fp-tagline">ฟาร์ม{speciesLabel(farm.species)}</p>
                <div className="fp-meta-row">
                  {uniqueBreeds.length > 0 && <span className="fp-meta-item">{uniqueBreeds.join(' · ')}</span>}
                  <span className="fp-meta-item"><Icon.Calendar /> เข้าร่วมเมื่อ {foundedDate}</span>
                </div>
              </div>
            </div>

            {/* Bio + quality */}
            <div className="fp-bio-card">
              <div>
                <p className="fp-bio-text">
                  {bioIsLong && !bioExpanded ? `${bioText.slice(0, 120)}...` : bioText}
                </p>
                {bioIsLong && (
                  <button className="fp-bio-toggle" onClick={() => setBioExpanded(!bioExpanded)}>
                    {bioExpanded ? 'ย่อ' : 'อ่านเพิ่มเติม'} <Icon.ChevronRight />
                  </button>
                )}
              </div>
              <div className="fp-quality">
                <div className="fp-quality-icon" style={{ background: 'transparent' }}>
                  <img src={isVerified ? '/icons/icon-verified-badge.png' : '/icons/icon-non-verified.png'} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                </div>
                <div>
                  <div className="fp-quality-title">{isVerified ? 'ฟาร์มคุณภาพ' : 'ฟาร์มโฮมบรีด'}</div>
                  <div className="fp-quality-sub">{isVerified ? 'ได้รับการยืนยันโดย Whiskora' : 'ฟาร์มทั่วไป ยังไม่ได้ยืนยันตัวตน'}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="fp-stats-card">
              <div className="fp-stats-grid">
                <div className="fp-stat">
                  <div className="fp-stat-label">ทั้งหมด</div>
                  <div className="fp-stat-num" style={{ color: F.pink }}>{stats.total}</div>
                  <div className="fp-stat-unit">ตัว</div>
                </div>
                <div className="fp-stat">
                  <div className="fp-stat-label">พร้อมย้ายบ้าน</div>
                  <div className="fp-stat-num" style={{ color: '#16A34A' }}>{stats.ready}</div>
                  <div className="fp-stat-unit">ตัว</div>
                </div>
                <div className="fp-stat">
                  <div className="fp-stat-label">พ่อแม่พันธุ์</div>
                  <div className="fp-stat-num" style={{ color: '#7C3AED' }}>{stats.breeders}</div>
                  <div className="fp-stat-unit">ตัว</div>
                </div>
                <div className="fp-stat">
                  <div className="fp-stat-label">ทำหมันแล้ว</div>
                  <div className="fp-stat-num" style={{ color: '#D97706' }}>{stats.neutered}</div>
                  <div className="fp-stat-unit">ตัว</div>
                </div>
                <div className="fp-stat">
                  <div className="fp-stat-label">ครอกทั้งหมด</div>
                  <div className="fp-stat-num" style={{ color: '#2563EB' }}>{stats.litters}</div>
                  <div className="fp-stat-unit">ครอก</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ข้อมูลฟาร์ม ── */}
          <div className="fp-section">
            <div className="fp-section-card">
              <div className="fp-section-head">
                <div className="fp-section-title">ข้อมูลฟาร์ม</div>
              </div>
              <div className="fp-info-grid">
                <div className="fp-info-row">
                  <span className="fp-info-icon"><img src="/icons/icon-nav-profile.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} /></span>
                  <span className="fp-info-label">เจ้าของฟาร์ม</span>
                  <span className="fp-info-val">{ownerName}</span>
                </div>
                {farm.phone && (
                  <a className="fp-info-row fp-info-row-link" href={`tel:${farm.phone}`}>
                    <span className="fp-info-icon"><img src="/icons/icon-phone.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} /></span>
                    <span className="fp-info-label">เบอร์โทรศัพท์</span>
                    <span className="fp-info-val" style={{ color: F.pink }}>{farm.phone}</span>
                  </a>
                )}
                {farmLocation && (
                  <a className="fp-info-row fp-info-row-link" href={`https://maps.google.com/?q=${farm?.lat && farm?.lng ? `${farm.lat},${farm.lng}` : encodeURIComponent(farmLocation)}`} target="_blank" rel="noopener noreferrer">
                    <span className="fp-info-icon"><img src="/icons/icon-location.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} /></span>
                    <span className="fp-info-label">ที่อยู่</span>
                    <span className="fp-info-val" style={{ color: F.pink }}>{farmLocation}</span>
                  </a>
                )}
                <div className="fp-info-row">
                  <span className="fp-info-icon"><img src="/icons/icon-calendar.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} /></span>
                  <span className="fp-info-label">วันที่ก่อตั้ง</span>
                  <span className="fp-info-val">{foundedDate}</span>
                </div>
                <div className="fp-info-row">
                  <span className="fp-info-icon"><img src="/icons/icon-insurance.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} /></span>
                  <span className="fp-info-label">มาตรฐานที่ได้รับ</span>
                  <span className={`fp-info-val ${isVerified ? 'verified' : ''}`}>{isVerified ? 'Whiskora Verified' : 'ฟาร์มโฮมบรีด (ยังไม่ยืนยัน)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── สัตว์พร้อมย้ายบ้าน ── */}
          <div className="fp-section">
            <div className="fp-section-card">
              <div className="fp-section-head">
                <div className="fp-section-title"><img src="/icons/icon-foster-home.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} /> สัตว์เลี้ยงพร้อมย้ายบ้าน</div>
              </div>
              {readyPets.length === 0 ? (
                <div className="fp-empty">ตอนนี้ยังไม่มี{speciesLabel(farm.species)}พร้อมย้ายบ้าน 🐾</div>
              ) : (
                <div className="fp-pets-grid">
                  {readyPets.map(pet => (
                    <Link key={pet.id} href={`/p/${pet.id}`} className="fp-pet-card">
                      <div className="fp-pet-img">
                        {pet.image_url ? <img src={pet.image_url} alt={pet.name} /> : '🐾'}
                        <span className="fp-pet-ready-tag">พร้อมย้าย</span>
                      </div>
                      <div className="fp-pet-info">
                        <div className="fp-pet-name">
                          {pet.name}
                          <img src={isMale(pet.gender) ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{width:14,height:14,objectFit:'contain',verticalAlign:'middle'}} />
                        </div>
                        <div className="fp-pet-breed">{extractThai(pet.breed)}</div>
                        {pet.birth_date && <div className="fp-pet-age">{calcAge(pet.birth_date)}</div>}
                        <div className="fp-pet-foot">
                          {pet.price != null && Number(pet.price) > 0
                            ? <span className="fp-pet-price">฿{Number(pet.price).toLocaleString()}</span>
                            : <span className="fp-pet-pill">สอบถามราคา</span>}
                          <Icon.ChevronRight />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sticky CTA / Owner Action Tabs ── */}
        {showAddModal && (
          <div className="fp-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="fp-modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="fp-modal-handle" />
              <div className="fp-modal-title">เพิ่มสัตว์ในฟาร์ม</div>
              <div className="fp-modal-options">
                <Link href={`/farm-dashboard/${farmId}/pets/create`} className="fp-modal-option" onClick={() => setShowAddModal(false)}>
                  <img className="fp-modal-option-img" src="/icons/icon-tab-add.png" alt="" />
                  <span className="fp-modal-option-label">เพิ่ม 1 ตัว</span>
                </Link>
                <Link href={`/farm-dashboard/${farmId}/pets/bulk-create`} className="fp-modal-option" onClick={() => setShowAddModal(false)}>
                  <img className="fp-modal-option-img" src="/icons/icon-my-pets.png" alt="" />
                  <span className="fp-modal-option-label">เพิ่มหลายตัว</span>
                </Link>
              </div>
              <button className="fp-modal-cancel" onClick={() => setShowAddModal(false)}>ยกเลิก</button>
            </div>
          </div>
        )}

        {isOwner && <style>{`nav[aria-label="เมนูหลัก"] { display: none !important; }`}</style>}

        {isOwner ? (
          <div className="fp-owner-bar">
            <div className="fp-owner-inner">
              <button className="fp-owner-tab" onClick={() => setShowAddModal(true)}>
                <div className="fp-owner-tab-icon"><img src="/icons/icon-tab-add.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
                <span className="fp-owner-tab-label">เพิ่มสัตว์</span>
              </button>
              <Link href={`/farm-dashboard/${farmId}/litters/create`} className="fp-owner-tab">
                <div className="fp-owner-tab-icon"><img src="/icons/icon-my-pets.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
                <span className="fp-owner-tab-label">จับคู่บรีด</span>
              </Link>
              <Link href={`/farm-dashboard/${farmId}/pets?status=${encodeURIComponent('เด็ก')}`} className="fp-owner-tab">
                <div className="fp-owner-tab-icon"><img src="/icons/icon-feeding.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
                <span className="fp-owner-tab-label">ลูกแมว</span>
              </Link>
              <Link href={`/profile/finance`} className="fp-owner-tab">
                <div className="fp-owner-tab-icon"><img src="/icons/icon-wallet.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
                <span className="fp-owner-tab-label">รายรับรายจ่าย</span>
              </Link>
              <Link href={`/farm-dashboard/${farmId}/appointments`} className="fp-owner-tab">
                <div className="fp-owner-tab-icon"><img src="/icons/icon-calendar.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
                <span className="fp-owner-tab-label">เพิ่มนัดหมาย</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="fp-cta-bar">
            <div className="fp-cta-inner">
              <button className="fp-cta-btn fp-cta-ghost" onClick={handleShare}><Icon.Share /> แชร์ฟาร์ม</button>
              {farm.phone && (
                <a className="fp-cta-btn fp-cta-primary" href={`tel:${farm.phone}`}><img src="/icons/icon-phone.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /> ติดต่อฟาร์ม</a>
              )}
            </div>
          </div>
        )}

        {copied && <div className="fp-toast">✅ คัดลอกลิงก์แล้ว</div>}
      </div>
    </>
  );
}