"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import type { Pet, Vaccine, Activity, UserProfile } from '@/lib/types';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Tag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Home: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Female: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm-1 2v3H9v2h2v2h2v-2h2v-2h-2v-3h-2z"/></svg>,
  Male: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2a7 7 0 1 0 5.29 11.71L17 16.41V20h3v-3h3v-3h-4.41l-2.7-2.7A7 7 0 0 0 9 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 9 4z"/></svg>,
  Verified: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#E84677"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Calendar: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Weight: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  Brush: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.4 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>,
  Chip: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M16 11h1a2 2 0 0 1 0 4h-1"/><path d="M8 11H7a2 2 0 0 0 0 4h1"/><path d="M11 16v1a2 2 0 0 0 4 0v-1"/><path d="M11 8V7a2 2 0 0 1 4 0v1"/></svg>,
  HeartCheck: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  Syringe: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  Dna: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.598 3.597-1.198 5.397 0"/><path d="M9 2c1.798 1.598 3.597 1.198 5.397 0"/><path d="M2 9c6.667 6 13.333 0 20 6"/></svg>,
  Image: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Timeline: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.29a2 2 0 0 1 1.95-2.18h3.06a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.42-.54a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></svg>,
  Expand: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Message: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

const TABS = [
  { id: 'overview', label: 'ภาพรวม', icon: <Icon.Paw /> },
  { id: 'pedigree', label: 'แผนผังสายเลือด', icon: <Icon.Dna /> },
  { id: 'health', label: 'สุขภาพ', icon: <Icon.HeartCheck /> },
  { id: 'vaccine', label: 'วัคซีน', icon: <Icon.Syringe /> },
  { id: 'timeline', label: 'ไทม์ไลน์', icon: <Icon.Timeline /> },
];

const MAX_GENERATIONS = 5;

type PedigreeNode = {
  id: string | null;
  name: string | null;
  image_url?: string | null;
  breed?: string | null;
  gender?: string | null;
  isMissing: boolean;
  position: number;
};

export default function PublicPetProfilePage() {
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [pedigreeGens, setPedigreeGens] = useState<PedigreeNode[][]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [farm, setFarm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPedigreeModal, setShowPedigreeModal] = useState(false);
  const [pedigreeZoom, setPedigreeZoom] = useState(1);
  const pedStageRef = useRef<HTMLDivElement>(null);
  const pedScalerRef = useRef<HTMLDivElement>(null);

  const isFarmPet = pet?.farm_id && pet.farm_id !== 'PERSONAL';

  const displayVal = (val: string | number | null | undefined, suffix = '') =>
    val != null && val !== '' ? `${val}${suffix}` : '-';

  const parseGallery = (urls: string): string[] => {
    if (!urls) return [];
    try { const p = JSON.parse(urls); return Array.isArray(p) ? p : [urls]; }
    catch { return urls.split(',').map(s => s.trim()).filter(Boolean); }
  };

  useEffect(() => { if (petId) fetchPublicData(); }, [petId]);

  // fit-to-screen เมื่อเปิด modal ผังเต็ม
  useEffect(() => {
    if (!showPedigreeModal) return;
    const t = setTimeout(() => {
      const stage = pedStageRef.current;
      const scaler = pedScalerRef.current;
      if (!stage || !scaler) return;
      const tree = scaler.firstElementChild as HTMLElement | null;
      if (!tree) return;
      const prev = scaler.style.transform;
      scaler.style.transform = 'scale(1)';
      const treeW = tree.offsetWidth;
      const treeH = tree.offsetHeight;
      scaler.style.transform = prev;
      if (!treeW || !treeH) return;
      const padding = 48;
      const availW = stage.clientWidth - padding;
      const availH = stage.clientHeight - padding;
      const fit = Math.min(availW / treeW, availH / treeH);
      setPedigreeZoom(Math.max(0.5, Math.min(2.5, +fit.toFixed(2))));
    }, 60);
    return () => clearTimeout(t);
  }, [showPedigreeModal, pedigreeGens]);

  // ─── สร้างผังสายเลือด (ไล่ตาม sire_id/dam_id) — เหมือนหน้าเจ้าของ ───
  const buildPedigreeTree = async (rootPet: Pet): Promise<PedigreeNode[][]> => {
    const gens: PedigreeNode[][] = [];
    gens.push([{
      id: rootPet.id, name: rootPet.name, image_url: rootPet.image_url,
      breed: rootPet.breed, gender: rootPet.gender, isMissing: false, position: 0,
    }]);

    for (let depth = 1; depth < MAX_GENERATIONS; depth++) {
      const prevGen = gens[depth - 1];
      const parentIdsToFetch = new Set<string>();
      for (const node of prevGen) if (!node.isMissing && node.id) parentIdsToFetch.add(node.id);

      let parentLinks: Record<string, { sire_id: string | null; dam_id: string | null }> = {};
      if (parentIdsToFetch.size > 0) {
        const { data } = await supabase.from('pets').select('id, sire_id, dam_id').in('id', Array.from(parentIdsToFetch));
        if (data) for (const row of data) parentLinks[String(row.id)] = { sire_id: row.sire_id, dam_id: row.dam_id };
      }

      const grandIdsToFetch = new Set<string>();
      const nextLinks: { sireId: string | null; damId: string | null }[] = [];
      for (const node of prevGen) {
        if (node.isMissing || !node.id) { nextLinks.push({ sireId: null, damId: null }); }
        else {
          const link = parentLinks[node.id] || { sire_id: null, dam_id: null };
          nextLinks.push({ sireId: link.sire_id, damId: link.dam_id });
          if (link.sire_id) grandIdsToFetch.add(link.sire_id);
          if (link.dam_id) grandIdsToFetch.add(link.dam_id);
        }
      }

      let fullData: Record<string, Pet> = {};
      if (grandIdsToFetch.size > 0) {
        const { data } = await supabase.from('pets').select('id, name, image_url, breed, gender').in('id', Array.from(grandIdsToFetch));
        if (data) for (const row of data) fullData[String(row.id)] = row as Pet;
      }

      const newGen: PedigreeNode[] = [];
      let pos = 0;
      let hasAnyData = false;
      for (const link of nextLinks) {
        if (link.sireId && fullData[link.sireId]) {
          const p = fullData[link.sireId];
          newGen.push({ id: p.id, name: p.name, image_url: p.image_url, breed: p.breed, gender: p.gender, isMissing: false, position: pos++ });
          hasAnyData = true;
        } else newGen.push({ id: null, name: null, isMissing: true, position: pos++ });
        if (link.damId && fullData[link.damId]) {
          const p = fullData[link.damId];
          newGen.push({ id: p.id, name: p.name, image_url: p.image_url, breed: p.breed, gender: p.gender, isMissing: false, position: pos++ });
          hasAnyData = true;
        } else newGen.push({ id: null, name: null, isMissing: true, position: pos++ });
      }

      gens.push(newGen);
      if (!hasAnyData && depth > 1) { gens.pop(); break; }
    }

    while (gens.length > 2 && gens[gens.length - 1].every(n => n.isMissing)) gens.pop();
    return gens.reverse();
  };

  const fetchPublicData = async () => {
    try {
      setIsLoading(true);
      // ไม่เช็ค session / ไม่ redirect — ใครก็ดูได้
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (petError) throw petError;
      setPet(petData as Pet);
      if (petData.image_url) setSelectedImage(petData.image_url);

      buildPedigreeTree(petData as Pet).then(setPedigreeGens).catch(() => setPedigreeGens([]));

      // ฟาร์ม (ถ้ามี) — สำหรับปุ่มติดต่อ
      if (petData.farm_id && petData.farm_id !== 'PERSONAL') {
        const { data: farmData } = await supabase
          .from('farms')
          .select('id, farm_name, phone, facebook_link, line_id')
          .eq('id', petData.farm_id)
          .maybeSingle();
        if (farmData) setFarm(farmData);
      }

      // เจ้าของ (แสดงชื่อ + ฟาร์ม แต่ไม่โชว์เบอร์/อีเมลส่วนตัวในมุมมองสาธารณะ)
      if (petData.user_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, location')
          .eq('id', petData.user_id)
          .maybeSingle();
        if (ownerData) setOwner(ownerData as UserProfile);
      }

      const { data: vaccineData } = await supabase.from('vaccines').select('*').eq('pet_id', petId).order('date_given', { ascending: false });
      if (vaccineData) setVaccines(vaccineData as Vaccine[]);

      const { data: activityData } = await supabase.from('pet_activities').select('*').eq('pet_id', petId).order('activity_date', { ascending: false });
      if (activityData) setActivities(activityData as Activity[]);

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── ติดต่อฟาร์ม: log lead ก่อนเด้งออกช่องทางภายนอก ───
  const logLeadAndOpen = async (channel: "phone" | "line" | "facebook", url: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("contact_leads").insert({
        pet_id: pet?.id ?? null,
        farm_id: farm?.id ?? null,
        viewer_id: session?.user?.id ?? null,
        channel,
        pet_status: pet?.status ?? null,
      });
    } catch (err) { console.error("log lead failed:", err); }
    setShowContactModal(false);
    if (url) window.open(url, "_blank");
  };

  const calculateAge = (birthDate?: string | null) => {
    if (!birthDate) return '-';
    const dob = new Date(birthDate); const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years === 0 && months === 0) return 'เพิ่งเกิด';
    return `${years > 0 ? years + ' ปี ' : ''}${months > 0 ? months + ' เดือน' : ''}`;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const generateCombinedTimeline = () => {
    const timeline: { id: string; date: string; title: string; description: string; color: string }[] = [];
    if (pet?.birth_date) timeline.push({ id: 'birth', date: pet.birth_date, title: 'เกิด / เข้าระบบ Whiskora', description: '', color: '#E84677' });
    vaccines.forEach(v => timeline.push({ id: `vac-${v.id}`, date: v.date_given, title: `วัคซีน ${v.vaccine_name}`, description: v.notes || '', color: '#0D9488' }));
    activities.forEach(a => timeline.push({ id: `act-${a.id}`, date: a.activity_date, title: a.title, description: a.description || '', color: '#F59E0B' }));
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ─── Pedigree renderer (read-only: การ์ดไม่ลิงก์ออกไปไหน) ───
  const renderPedigree = () => {
    if (pedigreeGens.length === 0) {
      return <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px' }}>กำลังโหลดผังสายเลือด...</div>;
    }
    const totalGens = pedigreeGens.length;
    const ROLE_NAMES = ['ตัวเอง (Current)', 'พ่อแม่ (Parents)', 'ปู่ย่าตายาย (Grandparents)', 'ทวด (Great-Grandparents)', 'เทียด (Great-Great)'];
    const firstRealGen = pedigreeGens.findIndex(gen => gen.some(n => !n.isMissing));
    const genNumberOf = (gi: number): number | null => (gi < firstRealGen ? null : gi - firstRealGen + 1);
    const roleNameOf = (gi: number): string => ROLE_NAMES[(totalGens - 1) - gi] || `รุ่นที่ ${gi + 1}`;
    const columns = pedigreeGens.map((gen, gi) => ({ gen, gi })).reverse();

    return (
      <div className="pedigree-tree">
        {columns.map(({ gen, gi }, colIdx) => {
          const isSelfCol = gi === totalGens - 1;
          const genNum = genNumberOf(gi);
          const hasConnector = colIdx > 0;
          const hasParentRight = colIdx < columns.length - 1;
          return (
            <div key={gi} className={`pedigree-col ${isSelfCol ? 'pedigree-col-self' : ''} ${hasConnector ? 'has-connector' : ''} ${hasParentRight ? 'has-parent-right' : ''}`}>
              <div className="pedigree-col-head">
                {genNum !== null && <span className="pedigree-gen-num">เจน {genNum}</span>}
                <span className="pedigree-gen-role">{roleNameOf(gi)}</span>
              </div>
              <div className="pedigree-col-cards" style={{ '--ped-n': gen.length } as React.CSSProperties}>
                {gen.map((node, ni) => {
                  const isSireSide = ni % 2 === 0;
                  return (
                    <div key={ni} className="ped-card-slot">
                      <div className="ped-card-link">
                        <div className={`ped-card ${isSelfCol ? 'ped-card-self' : ''} ${node.isMissing ? 'ped-card-missing' : ''} ${isSireSide ? 'ped-sire' : 'ped-dam'}`}>
                          <div className="ped-card-img">
                            {node.image_url ? <img src={node.image_url} alt={node.name || ''} /> : (node.isMissing ? <Icon.Paw /> : (isSireSide ? <Icon.Male /> : <Icon.Female />))}
                          </div>
                          <div className="ped-card-info">
                            <div className="ped-card-name">{node.isMissing ? 'ไม่มีข้อมูล' : (node.name || 'ไม่ระบุ')}</div>
                            {node.breed && !node.isMissing && <div className="ped-card-breed">{node.breed}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-400 tracking-widest">LOADING...</p>
      </div>
    </div>
  );

  if (!pet) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-bold text-gray-400">ไม่พบข้อมูลสัตว์เลี้ยง 😢</p>
    </div>
  );

  const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
  const galleryImages = parseGallery(pet.gallery_urls || '');
  const allImages = [pet.image_url, ...galleryImages].filter(Boolean) as string[];
  const combinedTimeline = generateCombinedTimeline();
  const hasContact = farm && (farm.phone || farm.line_id || farm.facebook_link);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .whiskora-page { font-family: 'Sarabun', sans-serif; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .public-banner { background: linear-gradient(135deg, #FFF0F4, #FDF2F5); border-bottom: 1px solid ${F.pinkBorder}; padding: 8px 16px; text-align: center; font-size: 12px; font-weight: 600; color: ${F.pink}; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .page-body { max-width: 1100px; margin: 0 auto; padding: 28px 20px 60px; }
        .hero-section { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 24px; }
        .gallery-strip { display: flex; flex-direction: column; gap: 6px; width: 64px; flex-shrink: 0; }
        .gallery-thumb { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color .15s; flex-shrink: 0; }
        .gallery-thumb.active { border-color: ${F.pink}; }
        .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-thumb-more { width: 64px; height: 64px; border-radius: 10px; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; cursor: pointer; position: relative; overflow: hidden; flex-shrink: 0; }
        .gallery-thumb-more img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .45; }
        .gallery-thumb-more span { position: relative; z-index: 1; }
        .hero-main-image { flex-shrink: 0; width: 280px; height: 280px; border-radius: 20px; overflow: hidden; border: 1px solid ${F.pinkBorder}; box-shadow: 0 4px 24px rgba(232,70,119,.08); cursor: zoom-in; }
        .hero-main-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
        .hero-main-image:hover img { transform: scale(1.04); }
        .hero-info { flex: 1; min-width: 0; }
        .verified-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: ${F.pink}; margin-bottom: 6px; }
        .pet-name { font-family: 'Prompt', sans-serif; font-size: 32px; font-weight: 700; color: #111827; line-height: 1.1; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .gender-chip { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: ${isMale ? '#DBEAFE' : '#FCE7F3'}; color: ${isMale ? '#2563EB' : '#DB2777'}; flex-shrink: 0; }
        .breed-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .breed-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #FDF2F5; color: ${F.pink}; border: 1px solid #FBCFE8; }
        .breed-tag-white { background: white; color: #6B7280; border: 1px solid ${F.lineMid}; }
        .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: ${F.line}; border: 1px solid ${F.line}; border-radius: 14px; overflow: hidden; margin-bottom: 16px; }
        .stat-cell { background: white; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .stat-label { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.04em; }
        .stat-value { font-size: 13px; font-weight: 700; color: ${F.ink}; overflow: hidden; text-overflow: ellipsis; }
        .stat-sub { font-size: 10px; color: ${F.muted}; font-weight: 500; }
        .pet-id-card { background: linear-gradient(135deg, #FFF5F8 0%, white 100%); border: 1px solid ${F.pinkBorder}; border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
        .pet-id-left { min-width: 0; }
        .pet-id-label { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: ${F.pink}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .pet-id-number { font-family: 'Prompt', monospace; font-size: 22px; font-weight: 700; color: #111827; letter-spacing: 0.5px; margin-bottom: 4px; word-break: break-all; }
        .pet-id-reg { font-size: 10px; color: ${F.muted}; }
        .contact-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px; border-radius: 24px; background: ${F.pink}; color: white; font-size: 14px; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: all .18s ease; }
        .contact-btn:hover { background: #D63F6A; box-shadow: 0 6px 20px rgba(232,70,119,0.4); transform: translateY(-1px); }
        .contact-btn:active { transform: scale(0.97); }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .price-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; font-family: 'Prompt', sans-serif; background: #FFF7ED; color: #C2410C; border: 1px solid #FED7AA; }
        .farm-link-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px; border-radius: 24px; background: white; color: ${F.pink}; font-size: 14px; font-weight: 700; border: 1px solid ${F.pinkBorder}; cursor: pointer; text-decoration: none; transition: all .18s ease; }
        .farm-link-btn:hover { background: ${F.pinkSoft}; border-color: ${F.pink}; transform: translateY(-1px); }
        .farm-link-btn:active { transform: scale(0.97); }
        .tabs-wrapper { border-bottom: 1px solid ${F.lineMid}; margin-bottom: 24px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .tabs-wrapper::-webkit-scrollbar { display: none; }
        .tabs-inner { display: flex; gap: 0; min-width: max-content; }
        .tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: 13px; font-weight: 600; color: ${F.muted}; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; transition: all .15s; white-space: nowrap; }
        .tab-btn:hover { color: ${F.pink}; }
        .tab-btn.active { color: ${F.pink}; border-bottom-color: ${F.pink}; }
        .tab-icon { opacity: 0.7; display: inline-flex; }
        .tab-btn.active .tab-icon { opacity: 1; }
        .content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .content-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .content-side { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .card { background: white; border: 1px solid ${F.line}; border-radius: 16px; overflow: hidden; }
        .card-header { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${F.line}; gap: 10px; flex-wrap: wrap; }
        .card-header .card-title { flex: 1 1 auto; min-width: 0; }
        .card-title { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: ${F.ink}; min-width: 0; }
        .card-title-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .card-body { padding: 20px; }
        .btn-view-full { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; border: 1px dashed ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; white-space: nowrap; flex-shrink: 0; }
        .btn-view-full:hover { background: #FDE7EF; border-color: ${F.pink}; }
        /* ─── Pedigree (horizontal, read-only) ─── */
        .pedigree-tree { display: flex; flex-direction: row; align-items: stretch; gap: 0; padding: 24px 20px; background: #FAFAFA; border-radius: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .pedigree-col { display: flex; flex-direction: column; position: relative; flex-shrink: 0; padding-right: 32px; }
        .pedigree-col:last-child { padding-right: 0; }
        .pedigree-col-head { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; margin-bottom: 12px; min-height: 38px; }
        .pedigree-gen-num { display: inline-block; font-size: 10px; font-weight: 800; color: ${F.pink}; background: ${F.pinkSoft}; padding: 3px 12px; border-radius: 10px; text-transform: uppercase; letter-spacing: .04em; }
        .pedigree-gen-role { font-size: 11px; font-weight: 600; color: ${F.muted}; }
        .pedigree-col-cards { display: flex; flex-direction: column; justify-content: space-around; flex: 1; width: 180px; }
        .ped-card-slot { display: flex; align-items: center; position: relative; flex: 1; width: 180px; padding: 10px 0; min-height: 80px; }
        .ped-card-link { text-decoration: none; flex-shrink: 0; position: relative; width: 180px; }
        .ped-card { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; padding: 8px 12px; width: 180px; transition: all .2s; }
        .ped-card-self { background: linear-gradient(135deg, #FFF5F8, white); border: 2px solid ${F.pinkBorder}; }
        .ped-card-missing { border-style: dashed; border-color: #E5E7EB; background: #FAFAFA; opacity: .75; }
        .ped-card-img { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #F3F4F6; }
        .ped-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .ped-sire .ped-card-img { background: #DBEAFE; color: #2563EB; }
        .ped-dam .ped-card-img { background: #FCE7F3; color: #DB2777; }
        .ped-card-missing .ped-card-img { background: #F3F4F6; color: #D1D5DB; }
        .ped-card-info { min-width: 0; flex: 1; }
        .ped-card-name { font-size: 12px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ped-card-missing .ped-card-name { color: ${F.muted}; font-weight: 600; font-style: italic; }
        .ped-card-breed { font-size: 9px; color: ${F.muted}; line-height: 1.35; margin-top: 1px; word-break: break-word; }
        .ped-card-self .ped-card-name { color: ${F.pink}; font-size: 13px; }
        .pedigree-col.has-connector .ped-card-slot::before { content: ''; position: absolute; top: 50%; right: 100%; transform: translateY(-50%); width: 16px; height: 2px; background: ${F.pinkBorder}; }
        .pedigree-col.has-parent-right .ped-card-slot::after { content: ''; position: absolute; top: 50%; left: 100%; transform: translateY(-50%); width: 16px; height: 2px; background: ${F.pinkBorder}; }
        .pedigree-col.has-connector .pedigree-col-cards::before { content: ''; position: absolute; left: -16px; width: 2px; background: ${F.pinkBorder}; border-radius: 2px; top: calc(50% / var(--ped-n)); bottom: calc(50% / var(--ped-n)); }
        .pedigree-col.has-connector .pedigree-col-cards { position: relative; }
        .health-check-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid ${F.line}; gap: 10px; }
        .health-check-item:last-child { border-bottom: none; }
        .health-check-left { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #374151; min-width: 0; }
        .check-icon { width: 22px; height: 22px; border-radius: 50%; background: #D1FAE5; display: flex; align-items: center; justify-content: center; color: #059669; flex-shrink: 0; }
        .health-check-val { font-size: 12px; font-weight: 600; color: ${F.muted}; flex-shrink: 0; text-align: right; }
        .vaccine-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${F.line}; }
        .vaccine-row:last-child { border-bottom: none; }
        .vaccine-icon { width: 36px; height: 36px; border-radius: 10px; background: #F0FDFA; display: flex; align-items: center; justify-content: center; color: #0D9488; flex-shrink: 0; }
        .vaccine-info { flex: 1; min-width: 0; }
        .vaccine-name { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .vaccine-sub { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .vaccine-date { font-size: 11px; font-weight: 600; color: ${F.teal}; white-space: nowrap; flex-shrink: 0; }
        .owner-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .owner-avatar { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; flex-shrink: 0; border: 2px solid ${F.pinkBorder}; }
        .owner-name-wrap { min-width: 0; }
        .owner-name { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .owner-cattery { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: ${F.pink}; }
        .owner-info-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12px; color: #4B5563; border-bottom: 1px solid ${F.line}; word-break: break-word; }
        .owner-info-row:last-child { border-bottom: none; }
        .owner-info-icon { color: ${F.muted}; flex-shrink: 0; }
        .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .gallery-item { aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: ${F.line}; position: relative; cursor: zoom-in; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .gallery-item:hover img { transform: scale(1.08); }
        .timeline-list { position: relative; padding-left: 24px; border-left: 2px solid ${F.line}; display: flex; flex-direction: column; gap: 20px; }
        .timeline-item { position: relative; }
        .timeline-dot { position: absolute; left: -31px; top: 3px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px ${F.lineMid}; }
        .timeline-date { font-size: 10px; font-weight: 700; color: ${F.muted}; margin-bottom: 3px; }
        .timeline-title { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .timeline-desc { font-size: 11px; color: #6B7280; margin-top: 3px; line-height: 1.5; }
        .empty-hint { text-align: center; padding: 28px 0; color: ${F.muted}; font-size: 13px; }
        /* ─── Modals ─── */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); padding: 16px; }
        .contact-modal { background: white; width: 100%; max-width: 420px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); padding: 24px; }
        .contact-modal-title { font-family: 'Prompt', sans-serif; font-size: 18px; font-weight: 700; color: ${F.ink}; text-align: center; }
        .contact-modal-sub { font-size: 12px; color: ${F.muted}; text-align: center; margin-top: 2px; margin-bottom: 18px; }
        .contact-channel { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 10px; transition: all .15s; }
        .contact-channel:active { transform: scale(0.97); }
        .contact-phone { background: #EFF6FF; color: #2563EB; }
        .contact-phone:hover { background: #DBEAFE; }
        .contact-line { background: #F0FDF4; color: #16A34A; }
        .contact-line:hover { background: #DCFCE7; }
        .contact-fb { background: #EEF2FF; color: #4F46E5; }
        .contact-fb:hover { background: #E0E7FF; }
        .contact-close { width: 100%; padding: 12px; color: ${F.muted}; font-weight: 700; font-size: 14px; background: none; border: none; cursor: pointer; }
        .ped-modal-card { background: white; width: 95vw; max-width: 1400px; height: 90vh; max-height: 90vh; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); display: flex; flex-direction: column; }
        .ped-modal-head { padding: 18px 24px; border-bottom: 1px solid ${F.line}; }
        .ped-modal-title { display: flex; align-items: center; gap: 8px; font-family: 'Prompt', sans-serif; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .ped-modal-stage { flex: 1; overflow: auto; -webkit-overflow-scrolling: touch; padding: 24px; background: #FAFAFA; display: flex; align-items: center; justify-content: center; min-height: 200px; }
        .ped-modal-scaler { transform-origin: center center; transition: transform .15s ease; }
        .ped-modal-scaler .pedigree-tree { background: white; }
        .ped-modal-foot { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 24px; border-top: 1px solid ${F.line}; }
        .ped-modal-zoombtn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid ${F.lineMid}; background: white; color: ${F.inkSoft}; font-size: 20px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .ped-modal-zoombtn:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .ped-modal-zoomval { font-size: 13px; font-weight: 700; color: ${F.muted}; min-width: 50px; text-align: center; }
        .ped-modal-close { margin-left: 8px; padding: 11px 28px; border-radius: 12px; border: none; background: ${F.pink}; color: white; font-size: 14px; font-weight: 700; cursor: pointer; }
        .ped-modal-close:hover { background: #D63F6A; }
        .lightbox { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; padding: 24px; cursor: zoom-out; }
        .lightbox img { max-width: 100%; max-height: 100%; border-radius: 12px; object-fit: contain; }
        .lightbox-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr 260px; } .hero-main-image { width: 240px; height: 240px; } }
        @media (max-width: 768px) {
          .page-body { padding: 16px 16px 40px; }
          .ped-modal-card { width: 95vw; height: 92vh; max-height: 92vh; }
          .ped-modal-stage { padding: 14px; }
          .hero-section { flex-direction: column; gap: 16px; }
          .gallery-strip { order: 2; flex-direction: row; width: 100%; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
          .gallery-strip::-webkit-scrollbar { display: none; }
          .gallery-thumb, .gallery-thumb-more { width: 56px; height: 56px; }
          .hero-main-image { order: 1; width: 100%; height: auto; aspect-ratio: 1 / 1; max-height: 360px; }
          .hero-info { order: 3; width: 100%; }
          .pet-name { font-size: 26px; flex-wrap: wrap; }
          .quick-stats { grid-template-columns: repeat(2, 1fr); }
          .tabs-wrapper { margin-left: -16px; margin-right: -16px; padding: 0 16px; }
          .content-grid { grid-template-columns: 1fr; gap: 16px; }
          .card-header { padding: 14px 16px; }
          .card-body { padding: 16px; }
          .pedigree-tree { padding: 16px 12px; }
          .ped-card, .pedigree-col-cards, .ped-card-slot, .ped-card-link { width: 150px; }
          .pedigree-col { padding-right: 32px; }
        }
        @media (max-width: 400px) {
          .page-body { padding: 12px 12px 36px; }
          .pet-name { font-size: 22px; }
          .quick-stats { grid-template-columns: 1fr 1fr; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .ped-card, .pedigree-col-cards, .ped-card-slot, .ped-card-link { width: 140px; }
        }
      `}</style>

      <div className="whiskora-page">

        <div className="page-body">
          {/* ─── Hero ─── */}
          <div className="hero-section">
            {allImages.length > 1 && (
              <div className="gallery-strip">
                {allImages.slice(0, 4).map((img, i) => (
                  <div key={i} className={`gallery-thumb ${selectedImage === img ? 'active' : ''}`} onClick={() => setSelectedImage(img)}><img src={img} alt="" /></div>
                ))}
                {allImages.length > 4 && (
                  <div className="gallery-thumb-more" onClick={() => setActiveTab('overview')}><img src={allImages[4]} alt="" /><span>+{allImages.length - 4}</span></div>
                )}
              </div>
            )}
            <div className="hero-main-image" onClick={() => setLightboxImage(selectedImage || pet.image_url || null)}>
              <img src={selectedImage || pet.image_url || '/placeholder-pet.jpg'} alt={pet.name} />
            </div>
            <div className="hero-info">
              <div className="verified-badge"><Icon.Verified /> Verified by Whiskora</div>
              <div className="pet-name">{pet.name}<div className="gender-chip">{isMale ? <Icon.Male /> : <Icon.Female />}</div></div>
              <div className="breed-tags">
                {pet.breed && <span className="breed-tag"><Icon.Paw /> {pet.breed}</span>}
                {pet.color && <span className="breed-tag breed-tag-white">{pet.color}</span>}
                {pet.pattern && <span className="breed-tag breed-tag-white">{pet.pattern}</span>}
              </div>
              <div className="quick-stats">
                <div className="stat-cell"><div className="stat-label"><Icon.Calendar /> วันเกิด</div><div className="stat-value">{formatDate(pet.birth_date)}</div><div className="stat-sub">อายุ {calculateAge(pet.birth_date)}</div></div>
                <div className="stat-cell"><div className="stat-label"><Icon.Weight /> น้ำหนัก</div><div className="stat-value">{pet.weight ? `${pet.weight} กก.` : '-'}</div></div>
                <div className="stat-cell"><div className="stat-label"><Icon.Brush /> สี</div><div className="stat-value">{pet.color || '-'}</div><div className="stat-sub">{pet.coat || ''}</div></div>
                <div className="stat-cell"><div className="stat-label"><Icon.Chip /> ไมโครชิพ</div><div className="stat-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{pet.microchip_number || '-'}</div></div>
              </div>
              <div className="pet-id-card">
                <div className="pet-id-left">
                  <div className="pet-id-label"><Icon.Paw /> PET ID</div>
                  <div className="pet-id-number">{pet.pet_code || `WSK-${String(pet.id).padStart(5, '0')}`}</div>
                  <div className="pet-id-reg">ลงทะเบียนกับ Whiskora</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {pet.status && (
                  <span className="status-pill" style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>● {pet.status}</span>
                )}
                {pet.status === 'พร้อมย้ายบ้าน' && pet.price != null && Number(pet.price) > 0 && (
                  <span className="price-pill"><Icon.Tag /> ฿{Number(pet.price).toLocaleString()}</span>
                )}
                {hasContact && (
                  <button className="contact-btn" onClick={() => setShowContactModal(true)}>
                    <Icon.Message /> ติดต่อ{isFarmPet ? 'ฟาร์ม' : 'เจ้าของ'}
                  </button>
                )}
                {isFarmPet && farm && (
                  <a href={`/farm/${farm.id}`} className="farm-link-btn">
                    <Icon.Home /> ดูโปรไฟล์ฟาร์ม
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="tabs-wrapper"><div className="tabs-inner">
            {TABS.map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <span className="tab-icon">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div></div>

          {/* ─── Overview ─── */}
          {activeTab === 'overview' && (
            <div className="content-grid">
              <div className="content-main">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><div className="card-title-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Icon.Dna /></div>แผนผังสายเลือด (Pedigree)</div>
                    <button className="btn-view-full" onClick={() => setShowPedigreeModal(true)}><Icon.Expand /> ดูแบบเต็ม</button>
                  </div>
                  <div className="card-body" style={{ padding: '16px' }}>{renderPedigree()}</div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: F.pinkSoft, color: F.pink }}><Icon.Paw /></div>ข้อมูลพื้นฐาน</div></div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                      {[
                        { label: 'ชื่อ', val: pet.name }, { label: 'วันเกิด', val: formatDate(pet.birth_date) },
                        { label: 'เพศ', val: isMale ? 'Male' : 'Female' }, { label: 'อายุ', val: calculateAge(pet.birth_date) },
                        { label: 'สายพันธุ์', val: pet.breed || pet.species || '-' }, { label: 'น้ำหนัก', val: displayVal(pet.weight, ' กก.') },
                        { label: 'สี', val: displayVal(pet.color) }, { label: 'สถานะ', val: pet.status ? <span style={{ color: '#059669', fontWeight: 700 }}>● {pet.status}</span> : '-' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${F.line}`, gap: 10 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: F.muted, flexShrink: 0 }}>{item.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: F.ink, textAlign: 'right' }}>{item.val as React.ReactNode}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {allImages.length > 0 && (
                  <div className="card">
                    <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#F3E8FF', color: '#7C3AED' }}><Icon.Image /></div>แกลลอรี่</div></div>
                    <div className="card-body">
                      <div className="gallery-grid">
                        {allImages.map((img, i) => (
                          <div key={i} className="gallery-item"><img src={img} alt="" onClick={() => setLightboxImage(img)} /></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {vaccines.length > 0 && (
                  <div className="card">
                    <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#CCFBF1', color: '#0D9488' }}><Icon.Syringe /></div>ประวัติการฉีดวัคซีน</div></div>
                    <div className="card-body">
                      {vaccines.slice(0, 5).map(v => (
                        <div key={v.id} className="vaccine-row"><div className="vaccine-icon"><Icon.Syringe /></div>
                          <div className="vaccine-info"><div className="vaccine-name">{v.vaccine_name}</div><div className="vaccine-sub">{v.notes || 'รับวัคซีนเรียบร้อย'}</div></div>
                          <div className="vaccine-date">{formatDate(v.date_given)}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Side */}
              <div className="content-side">
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FFE4E6', color: '#E11D48' }}>♥</div>ข้อมูลสุขภาพ</div></div>
                  <div className="card-body">
                    {[
                      { label: 'กรุ๊ปเลือด', val: pet.blood_type || '-' },
                      { label: 'ทำหมันแล้ว', val: pet.is_neutered ? '✓' : '-' },
                      { label: 'โรคประจำตัว', val: pet.chronic_diseases || 'ไม่มี' },
                    ].map((item, i) => (
                      <div key={i} className="health-check-item"><div className="health-check-left"><div className="check-icon"><Icon.Check /></div>{item.label}</div><div className="health-check-val">{item.val}</div></div>
                    ))}
                    {pet.allergies && (
                      <div style={{ marginTop: '12px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#E11D48', textTransform: 'uppercase', marginBottom: '4px' }}>⚠ สิ่งที่แพ้</div>
                        <div style={{ fontSize: '12px', color: '#9F1239', fontWeight: 600 }}>{pet.allergies}</div>
                      </div>
                    )}
                  </div>
                </div>

                {owner && (
                  <div className="card">
                    <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#F3F4F6', color: '#6B7280' }}>👤</div>{isFarmPet ? 'ฟาร์ม' : 'เจ้าของ'}</div></div>
                    <div className="card-body">
                      <div className="owner-card-header">
                        <div className="owner-avatar">
                          {owner.avatar_url ? <img src={owner.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: F.pinkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.pink, fontWeight: 700 }}>{(farm?.farm_name || owner.full_name)?.[0] || '?'}</div>}
                        </div>
                        <div className="owner-name-wrap">
                          <div className="owner-name">{farm?.farm_name || owner.full_name || 'ไม่ระบุชื่อ'}</div>
                          {farm?.farm_name && <div className="owner-cattery"><Icon.Verified /> ฟาร์มที่ยืนยันแล้ว</div>}
                        </div>
                      </div>
                      {owner.location && <div className="owner-info-row"><span className="owner-info-icon"><Icon.Calendar /></span>{owner.location}</div>}
                      {hasContact && (
                        <button className="contact-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }} onClick={() => setShowContactModal(true)}>
                          <Icon.Message /> ติดต่อสอบถาม
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Pedigree tab ─── */}
          {activeTab === 'pedigree' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Icon.Dna /></div>แผนผังสายเลือด (Pedigree)</div>
                <button className="btn-view-full" onClick={() => setShowPedigreeModal(true)}><Icon.Expand /> ดูแบบเต็ม</button>
              </div>
              <div className="card-body">{renderPedigree()}</div>
            </div>
          )}

          {/* ─── Health tab ─── */}
          {activeTab === 'health' && (
            <div className="content-grid">
              <div className="content-main">
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FFE4E6', color: '#E11D48' }}>♥</div>ข้อมูลสุขภาพ</div></div>
                  <div className="card-body">
                    {[
                      { label: 'กรุ๊ปเลือด', val: pet.blood_type || '-' },
                      { label: 'สถานะทำหมัน', val: pet.is_neutered ? 'ทำแล้ว ✓' : 'ยังไม่ทำ' },
                      { label: 'โรคประจำตัว', val: pet.chronic_diseases || 'ไม่มี' },
                    ].map((item, i) => (
                      <div key={i} className="health-check-item"><div className="health-check-left"><div className="check-icon"><Icon.Check /></div>{item.label}</div><div className="health-check-val">{item.val}</div></div>
                    ))}
                    {pet.allergies && (
                      <div style={{ marginTop: '14px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#E11D48', textTransform: 'uppercase', marginBottom: '6px' }}>⚠ สิ่งที่แพ้</div>
                        <p style={{ fontSize: '13px', color: '#9F1239', fontWeight: 600 }}>{pet.allergies}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="content-side"></div>
            </div>
          )}

          {/* ─── Vaccine tab ─── */}
          {activeTab === 'vaccine' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#CCFBF1', color: '#0D9488' }}><Icon.Syringe /></div>ประวัติการฉีดวัคซีน</div></div>
              <div className="card-body">
                {vaccines.length === 0 ? <div className="empty-hint">ยังไม่มีประวัติวัคซีน</div> : vaccines.map(v => (
                  <div key={v.id} className="vaccine-row"><div className="vaccine-icon"><Icon.Syringe /></div>
                    <div className="vaccine-info"><div className="vaccine-name">{v.vaccine_name}</div><div className="vaccine-sub">{v.notes || '-'}</div></div>
                    <div className="vaccine-date">{formatDate(v.date_given)}</div></div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Timeline tab ─── */}
          {activeTab === 'timeline' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Icon.Timeline /></div>ไทม์ไลน์</div></div>
              <div className="card-body">
                {combinedTimeline.length === 0 ? <div className="empty-hint">ยังไม่มีกิจกรรม</div> : (
                  <div className="timeline-list">
                    {combinedTimeline.map(item => (
                      <div key={item.id} className="timeline-item"><div className="timeline-dot" style={{ background: item.color }} />
                        <div className="timeline-date">{formatDate(item.date)}</div>
                        <div className="timeline-title">{item.title}</div>
                        {item.description && <div className="timeline-desc">{item.description}</div>}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Contact Modal ─── */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-title">ติดต่อ{isFarmPet ? `ฟาร์ม ${farm?.farm_name || ''}` : 'เจ้าของ'}</div>
            <div className="contact-modal-sub">เลือกช่องทางที่สะดวก แล้วทักได้เลย 🐾</div>
            {farm?.phone && (
              <button className="contact-channel contact-phone" onClick={() => logLeadAndOpen("phone", `tel:${farm.phone}`)}>
                <span style={{ fontSize: '20px' }}>📞</span><span>โทรหา <span style={{ opacity: .7, fontWeight: 500 }}>{farm.phone}</span></span>
              </button>
            )}
            {farm?.line_id && (
              <button className="contact-channel contact-line" onClick={() => logLeadAndOpen("line", `https://line.me/ti/p/~${farm.line_id}`)}>
                <span style={{ fontSize: '20px' }}>💬</span><span>แชทผ่าน LINE</span>
              </button>
            )}
            {farm?.facebook_link && (
              <button className="contact-channel contact-fb" onClick={() => logLeadAndOpen("facebook", farm.facebook_link)}>
                <span style={{ fontSize: '20px' }}>📘</span><span>ติดต่อผ่าน Facebook</span>
              </button>
            )}
            <button className="contact-close" onClick={() => setShowContactModal(false)}>ปิด</button>
          </div>
        </div>
      )}

      {/* ─── Pedigree Modal ─── */}
      {showPedigreeModal && (
        <div className="modal-overlay" onClick={() => { setShowPedigreeModal(false); setPedigreeZoom(1); }}>
          <div className="ped-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ped-modal-head"><div className="ped-modal-title"><Icon.Dna /> แผนผังสายเลือด {pet.name}</div></div>
            <div className="ped-modal-stage" ref={pedStageRef}>
              <div className="ped-modal-scaler" ref={pedScalerRef} style={{ transform: `scale(${pedigreeZoom})` }}>
                {renderPedigree()}
              </div>
            </div>
            <div className="ped-modal-foot">
              <button className="ped-modal-zoombtn" onClick={() => setPedigreeZoom(z => Math.max(0.5, +(z - 0.15).toFixed(2)))}>−</button>
              <span className="ped-modal-zoomval">{Math.round(pedigreeZoom * 100)}%</span>
              <button className="ped-modal-zoombtn" onClick={() => setPedigreeZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)))}>+</button>
              <button className="ped-modal-close" onClick={() => { setShowPedigreeModal(false); setPedigreeZoom(1); }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lightbox ─── */}
      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}><Icon.Close /></button>
          <img src={lightboxImage} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}