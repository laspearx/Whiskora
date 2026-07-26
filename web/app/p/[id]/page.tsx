"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { speciesTh } from '@/lib/species';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import type { Pet, Vaccine, Activity, UserProfile } from '@/lib/types';
import PageLoader from '@/app/components/PageLoader';
import { getOwnerProgress, patchOwnerProgress } from '@/lib/onboarding/client';
import { trackOnboardingEvent } from '@/app/components/onboarding/events';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Tag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Home: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Female: () => <img src="/icons/icon-women.png" alt="female" style={{width:20,height:20,objectFit:'contain'}} />,
  Male: () => <img src="/icons/icon-men.png" alt="male" style={{width:20,height:20,objectFit:'contain'}} />,
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
  Doc: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.29a2 2 0 0 1 1.95-2.18h3.06a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.42-.54a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></svg>,
  Expand: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Message: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

const TABS = [
  { id: 'overview', fieldGroupKey: 'overview', label: 'ภาพรวม', icon: <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> },
  { id: 'pedigree', fieldGroupKey: 'pedigree', label: 'แผนผังสายเลือด', icon: <Icon.Dna /> },
  { id: 'health', fieldGroupKey: 'health', label: 'สุขภาพ', icon: <Icon.HeartCheck /> },
  { id: 'vaccine', fieldGroupKey: 'vaccination', label: 'วัคซีน', icon: <Icon.Syringe /> },
  { id: 'weight', fieldGroupKey: 'weight', label: 'น้ำหนัก', icon: <Icon.Weight /> },
  { id: 'activities', fieldGroupKey: 'medical_notes', label: 'โน้ต & พฤติกรรม', icon: <Icon.Doc /> },
  { id: 'timeline', fieldGroupKey: 'timeline', label: 'ไทม์ไลน์', icon: <Icon.Timeline /> },
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
  const [pedigreeLoaded, setPedigreeLoaded] = useState(false);
  const [fieldAccess, setFieldAccess] = useState<Record<string, boolean> | null>(null);
  const [healthDetails, setHealthDetails] = useState<{
    blood_type: string | null; allergies: string | null; chronic_diseases: string | null;
    health_notes: string | null; traits: string | null;
  } | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeActivityFilter, setActiveActivityFilter] = useState('ทั้งหมด');
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [farm, setFarm] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<{ weight: number; recorded_date: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [myReservation, setMyReservation] = useState<{ id: number; status: string } | null>(null);
  const [reserving, setReserving] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPedigreeModal, setShowPedigreeModal] = useState(false);
  const [pedigreeZoom, setPedigreeZoom] = useState(1);
  const pedStageRef = useRef<HTMLDivElement>(null);
  const pedScalerRef = useRef<HTMLDivElement>(null);

  const isFarmPet = pet?.farm_id && pet.farm_id !== 'PERSONAL';

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

  // ─── สร้างผังสายเลือดผ่าน RPC get_pet_pedigree — เช็คสิทธิ์ที่ฝั่ง DB ก่อนคืนค่าเสมอ ───
  // (หน้านี้เป็นหน้าสาธารณะ ไม่ล็อกอินก็เข้าได้ ยิ่งต้องพึ่ง RLS/RPC ล้วนๆ ไม่ใช่ query ตรงๆ)
  type PedigreeRow = {
    node_id: number; child_id: number | null; name: string | null;
    image_url: string | null; breed: string | null; gender: string | null;
    relation: 'self' | 'sire' | 'dam'; generation: number;
  };

  const buildPedigreeTree = async (rootPet: Pet): Promise<PedigreeNode[][]> => {
    const { data, error } = await supabase.rpc('get_pet_pedigree', {
      p_pet_id: rootPet.id, p_max_gen: MAX_GENERATIONS - 1,
    });
    if (error || !data) return [];
    const rows = data as PedigreeRow[];
    const selfRow = rows.find(r => r.relation === 'self');
    if (!selfRow) return [];

    const byChild = new Map<number, { sire?: PedigreeRow; dam?: PedigreeRow }>();
    for (const r of rows) {
      if (r.relation === 'self' || r.child_id == null) continue;
      const entry = byChild.get(r.child_id) || {};
      if (r.relation === 'sire') entry.sire = r; else entry.dam = r;
      byChild.set(r.child_id, entry);
    }

    const gens: PedigreeNode[][] = [];
    gens.push([{
      id: String(selfRow.node_id), name: selfRow.name, image_url: selfRow.image_url,
      breed: selfRow.breed, gender: selfRow.gender, isMissing: false, position: 0,
    }]);

    for (let depth = 1; depth < MAX_GENERATIONS; depth++) {
      const prevGen = gens[depth - 1];
      const newGen: PedigreeNode[] = [];
      let pos = 0;
      let hasAnyData = false;

      for (const node of prevGen) {
        const childId = node.id ? Number(node.id) : null;
        const links = childId != null ? byChild.get(childId) : undefined;

        if (links?.sire) {
          const p = links.sire;
          newGen.push({ id: String(p.node_id), name: p.name, image_url: p.image_url, breed: p.breed, gender: p.gender, isMissing: false, position: pos++ });
          hasAnyData = true;
        } else newGen.push({ id: null, name: null, isMissing: true, position: pos++ });

        if (links?.dam) {
          const p = links.dam;
          newGen.push({ id: String(p.node_id), name: p.name, image_url: p.image_url, breed: p.breed, gender: p.gender, isMissing: false, position: pos++ });
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
      // หมายเหตุ: ตัดคอลัมน์สายเลือดและสุขภาพ (sire_id, dam_id, blood_type, ฯลฯ) ออกจาก select นี้
      // โดยตั้งใจ — หน้านี้เปิดให้ทุกคนเข้าถึงได้ ถ้า select('*') ไปเรื่อยๆ ใครก็เห็นค่าดิบๆ
      // ผ่าน network response ได้แม้ว่าแท็บนั้นจะถูกซ่อนแล้วก็ตาม ข้อมูลสายเลือดมาจาก
      // get_pet_pedigree() ส่วนข้อมูลสุขภาพมาจาก get_pet_health() ทั้งคู่เช็คสิทธิ์ที่ฝั่ง DB ก่อนคืนค่าเสมอ
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select(`
          id, created_at, name, breed, gender, color, pattern, birth_date, status,
          image_url, coat, ear, leg, eye_color, user_id, litter_id, vaccine_status,
          weight, species, farm_id, price, microchip_number,
          is_public, gallery_urls, is_neutered,
          cover_url, pet_code, note
        `)
        .eq('id', petId)
        .single();

      if (petError) throw petError;
      setPet(petData as unknown as Pet);
      if (petData.image_url) setSelectedImage(petData.image_url);

      buildPedigreeTree(petData as unknown as Pet)
        .then(setPedigreeGens)
        .catch(() => setPedigreeGens([]))
        .finally(() => setPedigreeLoaded(true));
      supabase.rpc('get_my_pet_access', { p_pet_id: petData.id }).then(({ data }) => {
        if (data) setFieldAccess(data as Record<string, boolean>);
      });
      supabase.rpc('get_pet_health', { p_pet_id: petData.id }).then(({ data }) => {
        if (data && data[0]) setHealthDetails(data[0]);
      });

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
          .select('id, full_name, avatar_url, address')
          .eq('id', petData.user_id)
          .maybeSingle();
        if (ownerData) setOwner(ownerData as UserProfile);
      }

      const { data: vaccineData } = await supabase.from('vaccines').select('*').eq('pet_id', petId).order('date_given', { ascending: false });
      if (vaccineData) setVaccines(vaccineData as Vaccine[]);

      const { data: activityData } = await supabase.from('pet_activities').select('*').eq('pet_id', petId).order('activity_date', { ascending: false });
      if (activityData) setActivities(activityData as Activity[]);

      const { data: weightData } = await supabase.from('pet_weights').select('weight, recorded_date').eq('pet_id', petId).order('recorded_date', { ascending: true });
      if (weightData) setWeightHistory(weightData as { weight: number; recorded_date: string }[]);

      // เช็ค session แบบไม่ redirect — หน้านี้เปิดให้ทุกคนดูได้ แต่การจองต้องล็อกอิน
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionUserId(session.user.id);
        const { data: resData } = await supabase
          .from('pet_reservations')
          .select('id, status')
          .eq('pet_id', petId)
          .eq('buyer_id', session.user.id)
          .in('status', ['pending', 'confirmed'])
          .maybeSingle();
        if (resData) setMyReservation(resData);

        // เจ้าของเปิดดูโปรไฟล์สาธารณะของตัวเอง — นับเป็นขั้นตอน onboarding "ดูหรือแชร์โปรไฟล์สัตว์"
        if (session.user.id === petData.user_id) {
          getOwnerProgress(session.user.id).then((row) => {
            if (!row?.metadata?.viewed_own_public_profile_at) {
              patchOwnerProgress(session.user.id, {
                metadata: { ...(row?.metadata ?? {}), viewed_own_public_profile_at: new Date().toISOString() },
              });
              trackOnboardingEvent({ event: 'public_profile_shared', onboardingType: 'owner', userId: session.user.id });
            }
          }).catch(() => {});
        }
      }

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

  // ─── จองสัตว์ตัวนี้: สร้าง pet_reservations แบบ pending รอฟาร์มยืนยัน ───
  const handleReserve = async () => {
    if (!pet || !sessionUserId || reserving) return;
    setReserving(true);
    try {
      const { data, error } = await supabase
        .from('pet_reservations')
        .insert({ pet_id: pet.id, buyer_id: sessionUserId, status: 'pending' })
        .select('id, status')
        .single();
      if (error) throw error;
      setMyReservation(data);
    } catch (err: any) {
      alert('จองไม่สำเร็จ: ' + (err.message || 'กรุณาลองใหม่'));
    } finally {
      setReserving(false);
    }
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
    const timeline: { id: string; date: string; title: string; description: string; color: string; tag?: string; image_url?: string | null }[] = [];
    if (pet?.birth_date) timeline.push({ id: 'birth', date: pet.birth_date, title: 'เกิด / เข้าระบบ Whiskora', description: '', color: '#E84677', tag: pet.microchip_number || '' });
    vaccines.forEach(v => timeline.push({ id: `vac-${v.id}`, date: v.date_given, title: `อัปเดตวัคซีน ${v.vaccine_name}`, description: v.notes || '', color: '#0D9488' }));
    activities.forEach(a => timeline.push({ id: `act-${a.id}`, date: a.activity_date, title: a.title, description: a.description || '', color: a.activity_type === 'ความสำเร็จ' ? '#D97706' : '#9CA3AF', image_url: a.image_url || null }));
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ─── Pedigree renderer (read-only: การ์ดไม่ลิงก์ออกไปไหน) ───
  const renderPedigree = () => {
    if (!pedigreeLoaded) {
      return <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px', letterSpacing: '0.05em' }}>Loading...</div>;
    }
    if (pedigreeGens.length === 0) {
      return <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px' }}>ไม่มีข้อมูลสายเลือดให้แสดง</div>;
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
                            {node.image_url ? <img src={node.image_url} alt={node.name || ''} /> : (node.isMissing ? <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: '60%', height: '60%', objectFit: 'contain' }} /> : (isSireSide ? <Icon.Male /> : <Icon.Female />))}
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

  if (isLoading) return <PageLoader />;

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
  const filteredActivities = activeActivityFilter === 'ทั้งหมด'
    ? activities
    : activities.filter(a => a.activity_type?.includes(activeActivityFilter));
  const latestWeight = weightHistory[weightHistory.length - 1]?.weight;
  const latestWeightDisplay = latestWeight
    ? latestWeight >= 1000 ? `${(latestWeight / 1000).toFixed(2)} กก.` : `${latestWeight} กรัม`
    : '-';

  function WeightSparkline({ data }: { data: { weight: number; recorded_date: string }[] }) {
    if (data.length < 2) return null;
    const W = 300, H = 72, pad = 10;
    const values = data.map(d => d.weight);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
    const rising = values[values.length - 1] >= values[values.length - 2];
    const color = rising ? '#16A34A' : '#EF4444';
    const pts = data.map((d, i) => `${x(i)},${y(d.weight)}`).join(' ');
    const first = data[0];
    const last = data[data.length - 1];
    return (
      <div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.weight)} r={i === data.length - 1 ? 5 : 3} fill={color} opacity={i === data.length - 1 ? 1 : 0.5} />
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: F.muted }}>{formatDate(first.recorded_date)} · {first.weight}g</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{rising ? '▲' : '▼'} {last.weight}g</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: F.muted }}>{formatDate(last.recorded_date)}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .whiskora-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
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
        .pet-name { font-family: inherit; font-size: 32px; font-weight: 700; color: #111827; line-height: 1.1; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .gender-chip { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; }
        .pet-info-table { width: 100%; margin-bottom: 16px; }
        .pet-info-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid ${F.line}; gap: 12px; }
        .pet-info-row:last-child { border-bottom: none; }
        .pet-info-label { font-size: 12px; font-weight: 500; color: ${F.muted}; flex-shrink: 0; }
        .pet-info-val { font-size: 13px; font-weight: 600; color: ${F.ink}; text-align: right; min-width: 0; word-break: break-word; }
        .pet-id-card { background: linear-gradient(135deg, #FFF5F8 0%, white 100%); border: 1px solid ${F.pinkBorder}; border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
        .pet-id-left { min-width: 0; }
        .pet-id-label { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: ${F.pink}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .pet-id-number { font-family: 'Prompt', monospace; font-size: 22px; font-weight: 700; color: #111827; letter-spacing: 0.5px; margin-bottom: 4px; word-break: break-all; }
        .pet-id-reg { font-size: 10px; color: ${F.muted}; }
        .contact-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 22px; border-radius: 24px; background: ${F.pink}; color: white; font-size: 14px; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: all .18s ease; }
        .contact-btn:hover { background: #D63F6A; box-shadow: 0 6px 20px rgba(232,70,119,0.4); transform: translateY(-1px); }
        .contact-btn:active { transform: scale(0.97); }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .price-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; font-family: inherit; background: #FFF7ED; color: #C2410C; border: 1px solid #FED7AA; }
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
        .card-footer { padding: 12px 20px; border-top: 1px solid ${F.line}; text-align: center; }
        .card-footer a, .card-footer button { font-size: 12px; font-weight: 600; color: ${F.pink}; text-decoration: none; cursor: pointer; background: none; border: none; }
        .card-footer a:hover, .card-footer button:hover { text-decoration: underline; }
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
        .health-tick-list { display: flex; flex-direction: column; gap: 0; }
        .health-tick-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${F.line}; }
        .health-tick-row:last-child { border-bottom: none; }
        .health-tick { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .health-tick.ok { background: #DCFCE7; color: #16A34A; }
        .health-tick.no { background: ${F.line}; color: ${F.muted}; }
        .health-tick-info { flex: 1; min-width: 0; }
        .health-tick-label { font-size: 13px; font-weight: 600; color: ${F.ink}; }
        .health-tick-detail { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .vaccine-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${F.line}; }
        .vaccine-row:last-child { border-bottom: none; }
        .vaccine-icon { width: 36px; height: 36px; border-radius: 10px; background: #F0FDFA; display: flex; align-items: center; justify-content: center; color: #0D9488; flex-shrink: 0; }
        .vaccine-info { flex: 1; min-width: 0; }
        .vaccine-name { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .vaccine-sub { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .vaccine-date { font-size: 11px; font-weight: 600; color: ${F.teal}; white-space: nowrap; flex-shrink: 0; }
        .owner-cattery { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: ${F.pink}; margin-top: 2px; }
        .owner-footer { background: linear-gradient(135deg, #FFF0F4, #FDF2F5); border: 1px solid ${F.pinkBorder}; border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
        .owner-footer-main { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .owner-footer-avatar { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; background: white; border: 2px solid ${F.pinkBorder}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: ${F.pink}; font-weight: 700; font-size: 20px; }
        .owner-footer-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .owner-footer-info { min-width: 0; }
        .owner-footer-label { font-size: 10px; font-weight: 700; color: ${F.pink}; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
        .owner-footer-name { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .owner-footer-address { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6B7280; margin-top: 4px; }
        .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .gallery-item { aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: ${F.line}; position: relative; cursor: zoom-in; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .gallery-item:hover img { transform: scale(1.08); }
        .timeline-list { position: relative; padding-left: 24px; border-left: 2px solid ${F.line}; display: flex; flex-direction: column; gap: 20px; }
        .timeline-item { position: relative; }
        .timeline-dot { position: absolute; left: -31px; top: 3px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px ${F.lineMid}; }
        .timeline-date { font-size: 10px; font-weight: 700; color: ${F.muted}; margin-bottom: 3px; }
        .timeline-desc { font-size: 11px; color: #6B7280; margin-top: 3px; line-height: 1.5; }
        .timeline-title { font-size: 13px; font-weight: 700; color: ${F.ink}; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .timeline-id-badge { font-size: 9px; font-weight: 700; background: #F3F4F6; color: ${F.muted}; padding: 2px 7px; border-radius: 6px; font-family: monospace; letter-spacing: 0.04em; }
        .timeline-img { margin-top: 7px; border-radius: 10px; overflow: hidden; max-width: 220px; aspect-ratio: 4/3; background: ${F.line}; }
        .timeline-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .activity-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        .activity-tab-btn { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid ${F.lineMid}; background: white; color: #6B7280; cursor: pointer; transition: all .15s; }
        .activity-tab-btn.active { background: ${F.ink}; border-color: ${F.ink}; color: white; }
        .activity-table { width: 100%; border-collapse: collapse; }
        .activity-table tr { border-bottom: 1px solid ${F.line}; }
        .activity-table tr:last-child { border-bottom: none; }
        .activity-table td { padding: 10px 8px; vertical-align: middle; font-size: 12px; }
        .activity-type-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .empty-hint { text-align: center; padding: 28px 0; color: ${F.muted}; font-size: 13px; }
        /* ─── Modals ─── */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); padding: 16px; }
        .contact-modal { background: white; width: 100%; max-width: 420px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); padding: 24px; }
        .contact-modal-title { font-family: inherit; font-size: 18px; font-weight: 700; color: ${F.ink}; text-align: center; }
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
        .ped-modal-title { display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
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
          .tabs-wrapper { margin-left: -16px; margin-right: -16px; padding: 0 16px; }
          .content-grid { grid-template-columns: 1fr; gap: 16px; }
          .card-header { padding: 14px 16px; }
          .card-body { padding: 16px; }
          .pedigree-tree { padding: 16px 12px; }
          .ped-card, .pedigree-col-cards, .ped-card-slot, .ped-card-link { width: 150px; }
          .pedigree-col { padding-right: 32px; }
          .owner-footer { flex-direction: column; text-align: center; padding: 16px; }
          .owner-footer-main { flex-direction: column; }
        }
        @media (max-width: 400px) {
          .page-body { padding: 12px 12px 36px; }
          .pet-name { font-size: 22px; }
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
              <div style={{ background: 'white', border: `1px solid ${F.line}`, borderRadius: 18, padding: '4px 16px 8px', marginBottom: 16 }}>
                <div className="pet-info-table" style={{ marginBottom: 0 }}>
                  {([
                    { label: 'วันเกิด', val: pet.birth_date ? `${formatDate(pet.birth_date)} (${calculateAge(pet.birth_date)})` : '-' },
                    { label: 'สายพันธุ์', val: pet.breed || speciesTh(pet.species) || '-' },
                    { label: 'น้ำหนัก', val: latestWeightDisplay },
                    { label: 'สี / ลาย', val: [pet.color, pet.pattern].filter(Boolean).join(' · ') || '-' },
                    { label: 'กรุ๊ปเลือด', val: healthDetails?.blood_type || '-' },
                    { label: 'ไมโครชิพ', val: pet.microchip_number || '-', mono: true },
                    { label: 'ทำหมัน', val: pet.is_neutered ? 'ทำแล้ว' : 'ยังไม่ทำ' },
                  ] as any[]).map((row: any, i: number) => (
                    <div key={i} className="pet-info-row">
                      <span className="pet-info-label">{row.label}</span>
                      <span className="pet-info-val" style={row.mono ? { fontFamily: 'monospace', fontSize: 11 } : undefined}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pet-id-card">
                <div className="pet-id-left">
                  <div className="pet-id-label"><img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> PET ID</div>
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
                {(pet.status === 'พร้อมย้ายบ้าน' || pet.status === 'เปิดจอง') && sessionUserId && sessionUserId !== pet.user_id && (
                  myReservation ? (
                    <span className="status-pill" style={{
                      background: myReservation.status === 'confirmed' ? '#D1FAE5' : '#FEF3C7',
                      color: myReservation.status === 'confirmed' ? '#065F46' : '#92400E',
                      border: `1px solid ${myReservation.status === 'confirmed' ? '#A7F3D0' : '#FDE68A'}`,
                    }}>
                      {myReservation.status === 'confirmed' ? '✓ ยืนยันการจองแล้ว' : '⏳ รอฟาร์มยืนยันการจอง'}
                    </span>
                  ) : (
                    <button className="contact-btn" style={{ background: '#16A34A' }} onClick={handleReserve} disabled={reserving}>
                      {reserving ? 'กำลังจอง...' : '📌 จองสัตว์ตัวนี้'}
                    </button>
                  )
                )}
                {(pet.status === 'พร้อมย้ายบ้าน' || pet.status === 'เปิดจอง') && !sessionUserId && (
                  <a href={`/login?redirect=${encodeURIComponent(`/p/${petId}`)}`} className="status-pill" style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', textDecoration: 'none' }}>
                    เข้าสู่ระบบเพื่อจองตัวนี้
                  </a>
                )}
                {hasContact && (
                  <button className="contact-btn" onClick={() => setShowContactModal(true)}>
                    <Icon.Message /> ติดต่อ{isFarmPet ? 'ฟาร์ม' : 'เจ้าของ'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="tabs-wrapper"><div className="tabs-inner">
            {TABS.filter(tab => fieldAccess === null || fieldAccess[tab.fieldGroupKey] !== false).map(tab => (
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
                      {vaccines.slice(0, 4).map(v => (
                        <div key={v.id} className="vaccine-row"><div className="vaccine-icon"><Icon.Syringe /></div>
                          <div className="vaccine-info"><div className="vaccine-name">{v.vaccine_name}</div><div className="vaccine-sub">{v.notes || 'รับวัคซีนเรียบร้อย'}</div></div>
                          <div className="vaccine-date">{formatDate(v.date_given)}</div></div>
                      ))}
                    </div>
                    {vaccines.length > 4 && <div className="card-footer"><button onClick={() => setActiveTab('vaccine')}>ดูประวัติทั้งหมด →</button></div>}
                  </div>
                )}

                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Icon.Timeline /></div>ไทม์ไลน์กิจกรรม</div></div>
                  <div className="card-body">
                    {combinedTimeline.length === 0 ? <div className="empty-hint">ยังไม่มีกิจกรรม</div> : (
                      <div className="timeline-list">
                        {combinedTimeline.slice(0, 5).map(item => (
                          <div key={item.id} className="timeline-item"><div className="timeline-dot" style={{ background: item.color }} />
                            <div className="timeline-date">{formatDate(item.date)}</div>
                            <div className="timeline-title">{item.title}{item.tag && <span className="timeline-id-badge">{item.tag}</span>}</div>
                            {item.description && <div className="timeline-desc">{item.description}</div>}
                            {item.image_url && <div className="timeline-img"><img src={item.image_url} alt="" /></div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {combinedTimeline.length > 5 && <div className="card-footer"><button onClick={() => setActiveTab('timeline')}>ดูไทม์ไลน์ทั้งหมด →</button></div>}
                </div>
              </div>

              {/* Side */}
              <div className="content-side">
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FFE4E6' }}><img src="/icons/icon-health.png" alt="" style={{width:18,height:18,objectFit:'contain'}} /></div>สถานะสุขภาพ</div></div>
                  <div className="card-body">
                    <div className="health-tick-list">
                      {(() => {
                        const today = new Date();
                        const hasFVRCP = vaccines.some(v => v.vaccine_name?.includes('FVRCP'));
                        const hasRabies = vaccines.some(v => v.vaccine_name?.includes('พิษสุนัขบ้า') || v.vaccine_name?.toLowerCase().includes('rabies'));
                        const hasOverdue = vaccines.some(v => (v as any).next_due && new Date((v as any).next_due) < today);
                        const checks = [
                          { label: 'วัคซีนรวม (FVRCP)', ok: hasFVRCP, detail: hasFVRCP ? `${vaccines.filter(v => v.vaccine_name?.includes('FVRCP')).length} เข็ม` : 'ยังไม่มีข้อมูล' },
                          { label: 'วัคซีนพิษสุนัขบ้า', ok: hasRabies, detail: hasRabies ? `${vaccines.filter(v => v.vaccine_name?.includes('พิษสุนัขบ้า') || v.vaccine_name?.toLowerCase().includes('rabies')).length} เข็ม` : 'ยังไม่มีข้อมูล' },
                          { label: 'วัคซีนไม่เกินกำหนด', ok: vaccines.length > 0 && !hasOverdue, detail: hasOverdue ? 'มีวัคซีนเกินกำหนด' : vaccines.length === 0 ? 'ยังไม่มีข้อมูล' : 'ครบถ้วนสม่ำเสมอ' },
                          { label: 'ทำหมัน', ok: !!pet.is_neutered, detail: pet.is_neutered ? 'ทำแล้ว' : 'ยังไม่ทำ' },
                        ];
                        return checks.map((c, i) => (
                          <div key={i} className="health-tick-row">
                            <div className={`health-tick ${c.ok ? 'ok' : 'no'}`}><Icon.Check /></div>
                            <div className="health-tick-info">
                              <div className="health-tick-label">{c.label}</div>
                              <div className="health-tick-detail">{c.detail}</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    {healthDetails?.allergies && (
                      <div style={{ marginTop: '12px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#E11D48', textTransform: 'uppercase', marginBottom: '4px', display:'flex', alignItems:'center', gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>สิ่งที่แพ้</div>
                        <div style={{ fontSize: '12px', color: '#9F1239', fontWeight: 600 }}>{healthDetails.allergies}</div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer"><button onClick={() => setActiveTab('health')}>ดูข้อมูลสุขภาพทั้งหมด →</button></div>
                </div>
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
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FFE4E6' }}><img src="/icons/icon-health.png" alt="" style={{width:18,height:18,objectFit:'contain'}} /></div>สถานะสุขภาพ</div></div>
                  <div className="card-body">
                    <div className="health-tick-list">
                      {(() => {
                        const today = new Date();
                        const hasFVRCP = vaccines.some(v => v.vaccine_name?.includes('FVRCP'));
                        const hasRabies = vaccines.some(v => v.vaccine_name?.includes('พิษสุนัขบ้า') || v.vaccine_name?.toLowerCase().includes('rabies'));
                        const hasOverdue = vaccines.some(v => (v as any).next_due && new Date((v as any).next_due) < today);
                        return [
                          { label: 'วัคซีนรวม (FVRCP)', ok: hasFVRCP, detail: hasFVRCP ? `${vaccines.filter(v => v.vaccine_name?.includes('FVRCP')).length} เข็ม` : 'ยังไม่มีข้อมูล' },
                          { label: 'วัคซีนพิษสุนัขบ้า', ok: hasRabies, detail: hasRabies ? `${vaccines.filter(v => v.vaccine_name?.includes('พิษสุนัขบ้า') || v.vaccine_name?.toLowerCase().includes('rabies')).length} เข็ม` : 'ยังไม่มีข้อมูล' },
                          { label: 'วัคซีนไม่เกินกำหนด', ok: vaccines.length > 0 && !hasOverdue, detail: hasOverdue ? 'มีวัคซีนเกินกำหนด' : vaccines.length === 0 ? 'ยังไม่มีข้อมูล' : 'ครบถ้วนสม่ำเสมอ' },
                          { label: 'ทำหมัน', ok: !!pet.is_neutered, detail: pet.is_neutered ? 'ทำแล้ว' : 'ยังไม่ทำ' },
                        ].map((c, i) => (
                          <div key={i} className="health-tick-row">
                            <div className={`health-tick ${c.ok ? 'ok' : 'no'}`}><Icon.Check /></div>
                            <div className="health-tick-info">
                              <div className="health-tick-label">{c.label}</div>
                              <div className="health-tick-detail">{c.detail}</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    {healthDetails?.chronic_diseases && (
                      <div style={{ marginTop: '14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', marginBottom: '6px' }}>โรคประจำตัว</div>
                        <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600 }}>{healthDetails.chronic_diseases}</p>
                      </div>
                    )}
                    {healthDetails?.allergies && (
                      <div style={{ marginTop: '12px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#E11D48', textTransform: 'uppercase', marginBottom: '6px', display:'flex', alignItems:'center', gap:4 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>สิ่งที่แพ้</div>
                        <p style={{ fontSize: '13px', color: '#9F1239', fontWeight: 600 }}>{healthDetails.allergies}</p>
                      </div>
                    )}
                    {(healthDetails?.traits || healthDetails?.health_notes) && (
                      <div style={{ marginTop: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', marginBottom: '6px' }}>หมายเหตุเพิ่มเติม</div>
                        <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, lineHeight: 1.6 }}>{[healthDetails?.traits, healthDetails?.health_notes].filter(Boolean).join(' ')}</p>
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

          {/* ─── Weight tab ─── */}
          {activeTab === 'weight' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: F.pinkSoft, color: F.pink }}><Icon.Weight /></div>ประวัติน้ำหนัก</div></div>
              <div className="card-body">
                {weightHistory.length >= 2 ? (
                  <div style={{ padding: '8px 4px 4px' }}>
                    <WeightSparkline data={weightHistory} />
                  </div>
                ) : weightHistory.length === 1 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: F.ink }}>{weightHistory[0].weight}g</div>
                    <div style={{ color: F.muted, fontSize: '12px', marginTop: '4px' }}>บันทึกเมื่อ {formatDate(weightHistory[0].recorded_date)} — ยังไม่มีข้อมูลพอที่จะแสดงกราฟ</div>
                  </div>
                ) : (
                  <div className="empty-hint">ยังไม่มีประวัติน้ำหนัก</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Activities tab ─── */}
          {activeTab === 'activities' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Icon.Doc /></div>โน้ต & พฤติกรรม</div></div>
              <div className="card-body">
                <div className="activity-tabs">
                  {['ทั้งหมด', 'นิสัย', 'อาหาร', 'หาหมอ', 'ทั่วไป'].map(t => (
                    <button key={t} className={`activity-tab-btn ${activeActivityFilter === t ? 'active' : ''}`} onClick={() => setActiveActivityFilter(t)}>{t}</button>
                  ))}
                </div>
                {filteredActivities.length === 0 ? <div className="empty-hint">ยังไม่มีโน้ตในหมวดนี้</div> : (
                  <table className="activity-table"><tbody>
                    {filteredActivities.map(a => (
                      <tr key={a.id}>
                        <td style={{ width: 36, paddingLeft: 0 }}>
                          <div className="activity-type-icon" style={{ background: a.activity_type?.includes('อาหาร') ? '#FEF9C3' : a.activity_type?.includes('หมอ') ? '#FEE2E2' : '#F0FDF4' }}>
                            <img src={a.activity_type?.includes('อาหาร') ? '/icons/icon-feeding.png' : a.activity_type?.includes('หมอ') ? '/icons/icon-vet-care.png' : a.activity_type?.includes('พยาธิ') ? '/icons/icon-vaccine.png' : '/icons/icon-documents.png'} alt="" style={{width:16,height:16,objectFit:'contain'}} />
                          </div>
                        </td>
                        <td><div style={{ fontSize: '12px', fontWeight: 600, color: F.ink }}>{a.title}</div><div style={{ fontSize: '11px', color: F.muted, marginTop: '2px' }}>{a.description}</div></td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: F.muted, fontSize: '11px' }}>{formatDate(a.activity_date)}</td>
                      </tr>
                    ))}
                  </tbody></table>
                )}
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
                        <div className="timeline-title">{item.title}{item.tag && <span className="timeline-id-badge">{item.tag}</span>}</div>
                        {item.description && <div className="timeline-desc">{item.description}</div>}
                        {item.image_url && <div className="timeline-img"><img src={item.image_url} alt="" /></div>}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Owner info ─── */}
          {owner && (
            <div className="owner-footer">
              <div className="owner-footer-main">
                <div className="owner-footer-avatar">
                  {owner.avatar_url
                    ? <img src={owner.avatar_url} alt="" />
                    : <span>{(farm?.farm_name || owner.full_name)?.[0] || '?'}</span>}
                </div>
                <div className="owner-footer-info">
                  <div className="owner-footer-label">ข้อมูลเบื้องต้นของ{isFarmPet ? 'ฟาร์ม' : 'เจ้าของ'}</div>
                  <div className="owner-footer-name">{farm?.farm_name || owner.full_name || 'ไม่ระบุชื่อ'}</div>
                  {farm?.farm_name && <div className="owner-cattery"><Icon.Verified /> ฟาร์มที่ยืนยันแล้ว</div>}
                  {owner.address && <div className="owner-footer-address"><Icon.Home /> {owner.address}</div>}
                </div>
              </div>
              {hasContact && (
                <button className="contact-btn" onClick={() => setShowContactModal(true)}>
                  <Icon.Message /> ติดต่อสอบถาม
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Contact Modal ─── */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-title">ติดต่อ{isFarmPet ? `ฟาร์ม ${farm?.farm_name || ''}` : 'เจ้าของ'}</div>
            <div className="contact-modal-sub">เลือกช่องทางที่สะดวก แล้วทักได้เลย</div>
            {farm?.phone && (
              <button className="contact-channel contact-phone" onClick={() => logLeadAndOpen("phone", `tel:${farm.phone}`)}>
                <img src="/icons/icon-phone.png" alt="" style={{width:22,height:22,objectFit:'contain'}} /><span>โทรหา <span style={{ opacity: .7, fontWeight: 500 }}>{farm.phone}</span></span>
              </button>
            )}
            {farm?.line_id && (
              <button className="contact-channel contact-line" onClick={() => logLeadAndOpen("line", `https://line.me/ti/p/~${farm.line_id}`)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>แชทผ่าน LINE</span>
              </button>
            )}
            {farm?.facebook_link && (
              <button className="contact-channel contact-fb" onClick={() => logLeadAndOpen("facebook", farm.facebook_link)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg><span>ติดต่อผ่าน Facebook</span>
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