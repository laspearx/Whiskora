"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { speciesTh } from '@/lib/species';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import type { Pet, Vaccine, Activity, UserProfile, PetDocument } from '@/lib/types';
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
  Share: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
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
  Doc: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Phone: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.29a2 2 0 0 1 1.95-2.18h3.06a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.42-.54a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></svg>,
  Mail: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Location: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Plus: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Expand: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>,
  Refresh: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>,
};

// ─── TABS ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'ภาพรวม', icon: <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> },
  { id: 'pedigree', label: 'แผนผังสายเลือด', icon: <Icon.Dna /> },
  { id: 'health', label: 'สุขภาพ', icon: <Icon.HeartCheck /> },
  { id: 'vaccine', label: 'วัคซีน', icon: <Icon.Syringe /> },
  { id: 'weight', label: 'น้ำหนัก', icon: <Icon.Weight /> },
  { id: 'activities', label: 'โน้ต & พฤติกรรม', icon: <Icon.Doc /> },
  { id: 'docs', label: 'เอกสาร', icon: <Icon.Doc /> },
  { id: 'timeline', label: 'ไทม์ไลน์', icon: <Icon.Timeline /> },
];

const ACTIVITY_TYPES = ['หาหมอ', 'หยดเห็บหมัด', 'ถ่ายพยาธิ', 'อาหาร', 'นิสัย', 'ทั่วไป'];

// จำนวนเจนสูงสุดที่แสดง (รวมตัวเอง) — ตัวเอง + พ่อแม่ + ปู่ย่าตายาย + ทวด + เทียด
const MAX_GENERATIONS = 5;

// โหนดในผังสายเลือด: เก็บ pet จริง (ถ้ามีลิงก์) หรือ placeholder "ไม่มีข้อมูล"
type PedigreeNode = {
  id: string | null;          // null = ไม่มีข้อมูล (placeholder)
  name: string | null;
  image_url?: string | null;
  breed?: string | null;
  gender?: string | null;
  isMissing: boolean;         // true = ช่องว่างที่ยังไม่มีข้อมูล
  position: number;           // ตำแหน่งในเจน (0 = ซ้ายสุด) ใช้จัดเรียง
};

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [pedigreeGens, setPedigreeGens] = useState<PedigreeNode[][]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<PetDocument[]>([]);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeGalleryTab, setActiveGalleryTab] = useState('all');
  const [activeActivityFilter, setActiveActivityFilter] = useState('ทั้งหมด');

  // UI states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPedigreeModal, setShowPedigreeModal] = useState(false);
  const [pedigreeZoom, setPedigreeZoom] = useState(1);
  const pedStageRef = useRef<HTMLDivElement>(null);
  const pedScalerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Activity modal
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'ทั่วไป', title: '', description: '',
    activity_date: new Date().toISOString().split('T')[0],
  });

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${petId}` : '';

  const displayVal = (val: string | number | null | undefined, suffix = '') =>
    val != null && val !== '' ? `${val}${suffix}` : '-';

  const parseGallery = (urls: string): string[] => {
    if (!urls) return [];
    try { const p = JSON.parse(urls); return Array.isArray(p) ? p : [urls]; }
    catch { return urls.split(',').map(s => s.trim()).filter(Boolean); }
  };

  useEffect(() => { if (petId) fetchPetData(); }, [petId]);

  // สร้าง QR เมื่อรู้ url แล้ว
  useEffect(() => {
    if (shareUrl) QRCode.toDataURL(shareUrl, { width: 320, margin: 1, color: { dark: '#111827', light: '#FFFFFF' } })
      .then(setQrDataUrl).catch(() => {});
  }, [shareUrl]);

  // เมื่อเปิด modal ผังเต็ม → คำนวณ zoom ให้ผังพอดีกับพื้นที่ (fit-to-screen)
  useEffect(() => {
    if (!showPedigreeModal) return;
    // รอ DOM render เสร็จก่อนวัดขนาด
    const t = setTimeout(() => {
      const stage = pedStageRef.current;
      const scaler = pedScalerRef.current;
      if (!stage || !scaler) return;
      const tree = scaler.firstElementChild as HTMLElement | null;
      if (!tree) return;
      // วัดขนาดจริงโดย reset scale ชั่วคราว (กันค่าเพี้ยนข้ามเบราว์เซอร์)
      const prev = scaler.style.transform;
      scaler.style.transform = 'scale(1)';
      const treeW = tree.offsetWidth;
      const treeH = tree.offsetHeight;
      scaler.style.transform = prev;
      if (!treeW || !treeH) return;
      // พื้นที่ stage หัก padding
      const padding = 48;
      const availW = stage.clientWidth - padding;
      const availH = stage.clientHeight - padding;
      const fit = Math.min(availW / treeW, availH / treeH);
      // จำกัดไม่ให้เกิน 2.5 เท่า และไม่ต่ำกว่า 0.5
      const clamped = Math.max(0.5, Math.min(2.5, +fit.toFixed(2)));
      setPedigreeZoom(clamped);
    }, 60);
    return () => clearTimeout(t);
  }, [showPedigreeModal, pedigreeGens]);

  // ─── สร้างผังสายเลือดโดยไล่ตามลิงก์ sire_id/dam_id ขึ้นไป ───
  // คืนค่าเป็น array ของเจน เรียงจาก "รุ่นเก่าสุด (เจน 1)" → "ตัวเอง (เจนล่างสุด)"
  const buildPedigreeTree = async (rootPet: Pet): Promise<PedigreeNode[][]> => {
    // gens[0] = ตัวเอง, gens[1] = พ่อแม่, gens[2] = ปู่ย่าตายาย, ...
    const gens: PedigreeNode[][] = [];

    // เจน 0: ตัวเอง
    gens.push([{
      id: rootPet.id, name: rootPet.name, image_url: rootPet.image_url,
      breed: rootPet.breed, gender: rootPet.gender, isMissing: false, position: 0,
    }]);

    // ไล่ขึ้นไปทีละเจน จนถึง MAX_GENERATIONS หรือจนไม่มีบรรพบุรุษเหลือ
    for (let depth = 1; depth < MAX_GENERATIONS; depth++) {
      const prevGen = gens[depth - 1];

      // หา id ของพ่อแม่ทั้งหมดในเจนก่อนหน้าที่ต้องไปดึงต่อ
      const parentIdsToFetch = new Set<string>();
      // เก็บ map: ตำแหน่งลูก -> {sire_id, dam_id}
      const linkMap: { sireId: string | null; damId: string | null }[] = [];

      for (const node of prevGen) {
        if (node.isMissing || !node.id) {
          linkMap.push({ sireId: null, damId: null });
        } else {
          // ต้องดึง sire_id/dam_id ของ node นี้ — เก็บไว้ดึง batch
          linkMap.push({ sireId: '__pending__', damId: '__pending__' });
          parentIdsToFetch.add(node.id);
        }
      }

      // ดึงข้อมูล sire_id/dam_id ของ node ทั้งหมดในเจนก่อนหน้าทีเดียว
      let parentLinks: Record<string, { sire_id: string | null; dam_id: string | null }> = {};
      if (parentIdsToFetch.size > 0) {
        const { data } = await supabase
          .from('pets')
          .select('id, sire_id, dam_id')
          .in('id', Array.from(parentIdsToFetch));
        if (data) for (const row of data) parentLinks[String(row.id)] = { sire_id: row.sire_id, dam_id: row.dam_id };
      }

      // รวบรวม id ของพ่อแม่ที่ต้องดึงข้อมูลเต็ม (name, image ฯลฯ)
      const grandIdsToFetch = new Set<string>();
      const nextLinks: { sireId: string | null; damId: string | null }[] = [];
      for (const node of prevGen) {
        if (node.isMissing || !node.id) {
          nextLinks.push({ sireId: null, damId: null });
        } else {
          const link = parentLinks[node.id] || { sire_id: null, dam_id: null };
          nextLinks.push({ sireId: link.sire_id, damId: link.dam_id });
          if (link.sire_id) grandIdsToFetch.add(link.sire_id);
          if (link.dam_id) grandIdsToFetch.add(link.dam_id);
        }
      }

      // ดึงข้อมูลเต็มของพ่อแม่ทุกตัวในเจนนี้ทีเดียว
      let fullData: Record<string, Pet> = {};
      if (grandIdsToFetch.size > 0) {
        const { data } = await supabase
          .from('pets')
          .select('id, name, image_url, breed, gender')
          .in('id', Array.from(grandIdsToFetch));
        if (data) for (const row of data) fullData[String(row.id)] = row as Pet;
      }

      // สร้างเจนใหม่: แต่ละ node ในเจนก่อนหน้าแตกเป็น พ่อ + แม่
      const newGen: PedigreeNode[] = [];
      let pos = 0;
      let hasAnyData = false;
      for (const link of nextLinks) {
        // พ่อ
        if (link.sireId && fullData[link.sireId]) {
          const p = fullData[link.sireId];
          newGen.push({ id: p.id, name: p.name, image_url: p.image_url, breed: p.breed, gender: p.gender, isMissing: false, position: pos++ });
          hasAnyData = true;
        } else {
          newGen.push({ id: null, name: null, isMissing: true, position: pos++ });
        }
        // แม่
        if (link.damId && fullData[link.damId]) {
          const p = fullData[link.damId];
          newGen.push({ id: p.id, name: p.name, image_url: p.image_url, breed: p.breed, gender: p.gender, isMissing: false, position: pos++ });
          hasAnyData = true;
        } else {
          newGen.push({ id: null, name: null, isMissing: true, position: pos++ });
        }
      }

      gens.push(newGen);

      // ถ้าเจนนี้ไม่มีข้อมูลจริงเลย (ทุกช่องว่าง) แปลว่าไม่มีบรรพบุรุษต่อแล้ว → หยุด
      // ยกเว้นเจนพ่อแม่ (depth=1) ที่ต้องแสดงเสมอแม้ว่าจะ "ไม่มีข้อมูล"
      if (!hasAnyData && depth > 1) {
        gens.pop(); // เอาเจนว่างเปล่าออก
        break;
      }
    }

    // ตัดเจนบนสุดที่ว่างทั้งแถวออก (ยกเว้นต้องเหลืออย่างน้อยตัวเอง + พ่อแม่)
    while (gens.length > 2 && gens[gens.length - 1].every(n => n.isMissing)) {
      gens.pop();
    }

    // reverse ให้รุ่นเก่าสุด = เจน 1 (index 0) อยู่บนสุด
    return gens.reverse();
  };

  const fetchPetData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);

      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select(`
          *,
          sire:sire_id(id, name, image_url, breed),
          dam:dam_id(id, name, image_url, breed),
          farm:farm_id(farm_name)
        `)
        .eq('id', petId)
        .single();

      if (petError) throw petError;
      setPet(petData as Pet);
      if (petData.image_url) setSelectedImage(petData.image_url);

      // สร้างผังสายเลือดโดยไล่ตาม sire_id/dam_id ขึ้นไปสูงสุด 5 เจน
      buildPedigreeTree(petData as Pet).then(setPedigreeGens).catch(() => setPedigreeGens([]));

      // เจ้าของ: ดึงจาก profiles (มี full_name, avatar_url, phone, location)
      // ส่วน email ดึงจาก auth ของ session ถ้าเป็นเจ้าของเอง
      if (petData.user_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone, location')
          .eq('id', petData.user_id)
          .maybeSingle();
        if (ownerData) {
          const email = session.user.id === petData.user_id ? session.user.email : null;
          setOwner({ ...ownerData, email } as UserProfile);
        }
      }

      const { data: vaccineData } = await supabase.from('vaccines').select('*').eq('pet_id', petId).order('date_given', { ascending: false });
      if (vaccineData) setVaccines(vaccineData as Vaccine[]);

      const { data: activityData } = await supabase.from('pet_activities').select('*').eq('pet_id', petId).order('activity_date', { ascending: false });
      if (activityData) setActivities(activityData as Activity[]);

      const { data: docData } = await supabase.from('pet_documents').select('*').eq('pet_id', petId).order('created_at', { ascending: false });
      if (docData) setDocuments(docData as PetDocument[]);

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── ปุ่ม: แชร์ ───
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `โปรไฟล์ ${pet?.name}`, url: shareUrl }); return; }
      catch { /* ผู้ใช้ยกเลิก หรือไม่รองรับ → fallback copy */ }
    }
    handleCopyUrl();
  };

  // ─── ปุ่ม: คัดลอก URL ───
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { alert('คัดลอกไม่สำเร็จ'); }
  };

  // ─── ปุ่ม: ดาวน์โหลด QR ───
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `whiskora-${pet?.name || 'pet'}-qr.png`;
    a.click();
  };

  const resizeImage = (file: File, maxDim: number, quality: number): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality);
      };
      img.src = URL.createObjectURL(file);
    });

  // ─── ปุ่ม: อัปโหลดรูป/วิดีโอเข้าแกลลอรี่ ───
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !pet) return;
    const current = parseGallery(pet.gallery_urls || '');
    const mainCount = pet.image_url ? 1 : 0;
    const totalUsed = mainCount + current.length;
    const slots = 4 - totalUsed;
    if (slots <= 0) {
      alert('คุณอัปโหลดรูปสัตว์เลี้ยงได้สูงสุด 4 รูป');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }
    const filesToUpload = Array.from(files).slice(0, slots);
    if (filesToUpload.length < files.length) {
      alert(`เพิ่มได้อีก ${slots} รูป (สูงสุด 4 รูปต่อสัตว์เลี้ยง)`);
    }
    setUploadingGallery(true);
    try {
      const newUrls: string[] = [];
      for (const file of filesToUpload) {
        const isImage = file.type.startsWith('image/');
        let uploadFile: File | Blob = file;
        if (isImage) {
          uploadFile = await resizeImage(file, 1200, 0.85);
        }
        const path = `${pet.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, uploadFile, { contentType: 'image/jpeg' });
        if (upErr) { console.error(upErr); continue; }
        const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(path);
        newUrls.push(publicUrl);
      }
      const merged = [...current, ...newUrls];
      const { error: updErr } = await supabase.from('pets').update({ gallery_urls: JSON.stringify(merged) }).eq('id', pet.id);
      if (updErr) throw updErr;
      await fetchPetData();
    } catch (err) {
      console.error(err); alert('อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // ─── ปุ่ม: ลบรูปจากแกลลอรี่ ───
  const handleDeleteGalleryImage = async (url: string) => {
    if (!pet || !confirm('ลบรูปนี้?')) return;
    const remaining = parseGallery(pet.gallery_urls || '').filter(u => u !== url);
    await supabase.from('pets').update({ gallery_urls: JSON.stringify(remaining) }).eq('id', pet.id);
    await fetchPetData();
  };

  // ─── ปุ่ม: อัปโหลดเอกสาร ───
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !pet) return;
    setUploadingDoc(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${pet.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('pet-documents').upload(path, file);
        if (upErr) { console.error(upErr); continue; }
        const { data: { publicUrl } } = supabase.storage.from('pet-documents').getPublicUrl(path);
        await supabase.from('pet_documents').insert({
          pet_id: pet.id, name: file.name, file_url: publicUrl,
          doc_type: 'other', file_size: file.size,
        });
      }
      await fetchPetData();
    } catch (err) {
      console.error(err); alert('อัปโหลดเอกสารไม่สำเร็จ');
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // ─── ปุ่ม: ลบเอกสาร ───
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('ลบเอกสารนี้?')) return;
    await supabase.from('pet_documents').delete().eq('id', docId);
    await fetchPetData();
  };

  // ─── ปุ่ม: บันทึกโน้ต/กิจกรรม ───
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.title.trim()) return alert('กรุณากรอกหัวข้อ');
    setSavingActivity(true);
    const { error } = await supabase.from('pet_activities').insert({
      pet_id: petId,
      activity_type: activityForm.activity_type,
      title: activityForm.title.trim(),
      description: activityForm.description.trim() || null,
      activity_date: activityForm.activity_date,
    });
    if (error) { alert('บันทึกไม่สำเร็จ'); setSavingActivity(false); return; }
    setShowActivityModal(false);
    setActivityForm({ activity_type: 'ทั่วไป', title: '', description: '', activity_date: new Date().toISOString().split('T')[0] });
    setSavingActivity(false);
    await fetchPetData();
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

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const generateCombinedTimeline = () => {
    const timeline: { id: string; date: string; title: string; description: string; type: string; color: string; tag?: string }[] = [];
    if (pet?.birth_date) timeline.push({ id: 'birth', date: pet.birth_date, title: 'สมัครเข้าระบบ Whiskora', description: '', type: 'registration', color: '#E84677', tag: pet.microchip_number || '' });
    vaccines.forEach(v => timeline.push({ id: `vac-${v.id}`, date: v.date_given, title: `อัปเดตวัคซีน ${v.vaccine_name}`, description: v.notes || '', type: 'vaccine', color: '#0D9488' }));
    activities.forEach(a => timeline.push({ id: `act-${a.id}`, date: a.activity_date, title: a.title, description: a.description || '', type: a.activity_type || '', color: a.activity_type?.includes('หมอ') ? '#EF4444' : '#F59E0B' }));
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ─── Pedigree node renderer ───
  const renderPedigree = () => {
    if (pedigreeGens.length === 0) {
      return <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px', letterSpacing: '0.05em' }}>Loading...</div>;
    }

    const totalGens = pedigreeGens.length;
    const ROLE_NAMES = ['ตัวเอง (Current)', 'พ่อแม่ (Parents)', 'ปู่ย่าตายาย (Grandparents)', 'ทวด (Great-Grandparents)', 'เทียด (Great-Great)'];

    const firstRealGen = pedigreeGens.findIndex(gen => gen.some(n => !n.isMissing));
    const genNumberOf = (gi: number): number | null => {
      if (gi < firstRealGen) return null;
      return gi - firstRealGen + 1;
    };
    const roleNameOf = (gi: number): string => {
      const distanceFromSelf = (totalGens - 1) - gi;
      return ROLE_NAMES[distanceFromSelf] || `รุ่นที่ ${gi + 1}`;
    };

    // ตัวเอง(ซ้าย) → เก่าสุด(ขวา)
    const columns = pedigreeGens.map((gen, gi) => ({ gen, gi })).reverse();

    return (
      <div className="pedigree-tree">
        {columns.map(({ gen, gi }, colIdx) => {
          const isSelfCol = gi === totalGens - 1;
          const genNum = genNumberOf(gi);
          // คอลัมน์นี้เชื่อมกับคอลัมน์ทางซ้าย (รุ่นน้องกว่า) ไหม — ทุกคอลัมน์ยกเว้นซ้ายสุด
          const hasConnector = colIdx > 0;
          // คอลัมน์นี้มีรุ่นเก่ากว่าต่อทางขวาไหม — ทุกคอลัมน์ยกเว้นขวาสุด (ต้องมีขาขวายื่นไปเชื่อม)
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
                  const card = (
                    <div className={`ped-card ${isSelfCol ? 'ped-card-self' : ''} ${node.isMissing ? 'ped-card-missing' : ''} ${isSireSide ? 'ped-sire' : 'ped-dam'}`}>
                      <div className="ped-card-img">
                        {node.image_url
                          ? <img src={node.image_url} alt={node.name || ''} />
                          : (node.isMissing ? <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: '60%', height: '60%', objectFit: 'contain' }} /> : (isSireSide ? <Icon.Male /> : <Icon.Female />))}
                      </div>
                      <div className="ped-card-info">
                        <div className="ped-card-name">{node.isMissing ? 'ไม่มีข้อมูล' : (node.name || 'ไม่ระบุ')}</div>
                        {node.breed && !node.isMissing && <div className="ped-card-breed">{node.breed}</div>}
                      </div>
                    </div>
                  );
                  return (
                    <div key={ni} className="ped-card-slot">
                      {node.id && !isSelfCol
                        ? <Link href={`/pets/${node.id}`} className="ped-card-link">{card}</Link>
                        : <div className="ped-card-link">{card}</div>}
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
      <p className="font-bold text-gray-400">ไม่พบข้อมูลสัตว์เลี้ยง</p>
    </div>
  );

  const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
  const galleryImages = parseGallery(pet.gallery_urls || '');
  const allImages = [pet.image_url, ...galleryImages].filter(Boolean) as string[];
  const combinedTimeline = generateCombinedTimeline();
  const filteredActivities = activeActivityFilter === 'ทั้งหมด'
    ? activities
    : activities.filter(a => a.activity_type?.includes(activeActivityFilter));

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .whiskora-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .topbar { display: flex; align-items: center; gap: 14px; max-width: 1100px; margin: 0 auto; padding: 24px 20px 4px; }
        .topbar-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .topbar-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .topbar-back:active { transform: scale(0.94); }
        .topbar-titles { display: flex; flex-direction: column; min-width: 0; }
        .topbar-title { font-family: inherit; font-size: 19px; font-weight: 700; color: ${F.ink}; line-height: 1.15; letter-spacing: -0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-sub { font-size: 11px; font-weight: 600; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
        .btn-share { display: flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(251,207,232,0.7); background: white; font-size: 12px; font-weight: 600; color: #4B5563; cursor: pointer; box-shadow: 0 2px 8px rgba(232,70,119,0.08); transition: all .18s ease; }
        .btn-share:hover { border-color: ${F.pink}; color: ${F.pink}; box-shadow: 0 4px 14px rgba(232,70,119,0.18); }
        .btn-share:active { transform: scale(0.96); }
        .btn-edit-profile { display: flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 20px; background: ${F.pink}; font-size: 12px; font-weight: 700; color: white; cursor: pointer; text-decoration: none; box-shadow: 0 2px 10px rgba(232,70,119,0.28); transition: all .18s ease; border: none; }
        .btn-edit-profile:hover { background: #D63F6A; box-shadow: 0 4px 16px rgba(232,70,119,0.38); }
        .btn-edit-profile:active { transform: scale(0.96); }
        .page-body { max-width: 1100px; margin: 0 auto; padding: 16px 20px 60px; }
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
        .pet-id-qr-wrapper { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
        .pet-id-qr { width: 72px; height: 72px; background: white; border: 1px solid ${F.lineMid}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #374151; overflow: hidden; cursor: pointer; }
        .pet-id-qr img { width: 100%; height: 100%; object-fit: contain; }
        .btn-view-qr { padding: 5px 12px; border-radius: 20px; background: ${F.pink}; color: white; font-size: 10px; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; }
        .btn-id-card { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; padding: 7px 14px; border-radius: 20px; background: white; border: 1px solid ${F.pinkBorder}; color: ${F.pink}; font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all .15s; }
        .btn-id-card:hover { background: ${F.pink}; color: white; border-color: ${F.pink}; }
        .pet-id-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .btn-id-edit { border-color: ${F.lineMid}; color: ${F.inkSoft}; }
        .btn-id-edit:hover { background: ${F.ink}; border-color: ${F.ink}; color: white; }
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
        .card-footer { padding: 12px 20px; border-top: 1px solid ${F.line}; text-align: center; }
        .card-footer a, .card-footer button { font-size: 12px; font-weight: 600; color: ${F.pink}; text-decoration: none; cursor: pointer; background: none; border: none; }
        .card-footer a:hover, .card-footer button:hover { text-decoration: underline; }
        /* ─── Pedigree (horizontal columns: self left → oldest right) ─── */
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
        a.ped-card-link:hover .ped-card { border-color: ${F.pinkBorder}; box-shadow: 0 4px 16px rgba(232,70,119,.08); transform: translateX(-1px); }
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
        /* ─── เส้นโยง ───
           ขาแนวนอนซ้าย: ยื่นจากกึ่งกลางซ้ายของแต่ละ slot ไปทางซ้าย 16px (เข้าหาเส้นตั้ง) */
        .pedigree-col.has-connector .ped-card-slot::before {
          content: ''; position: absolute; top: 50%; right: 100%; transform: translateY(-50%);
          width: 16px; height: 2px; background: ${F.pinkBorder};
        }
        /* ขาแนวนอนขวา: ยื่นจากกึ่งกลางขวาของแต่ละ slot ไปทางขวา 16px
           (บรรจบเส้นตั้งของคอลัมน์รุ่นเก่ากว่าที่อยู่ถัดไป) */
        .pedigree-col.has-parent-right .ped-card-slot::after {
          content: ''; position: absolute; top: 50%; left: 100%; transform: translateY(-50%);
          width: 16px; height: 2px; background: ${F.pinkBorder};
        }
        /* เส้นแนวตั้ง: ทอดจากกึ่งกลาง slot แรก ถึง กึ่งกลาง slot สุดท้าย
           (slot แบ่งพื้นที่เท่ากันด้วย flex:1 → first slot center = 50%/n, last = 100%-50%/n) */
        .pedigree-col.has-connector .pedigree-col-cards::before {
          content: ''; position: absolute; left: -16px; width: 2px; background: ${F.pinkBorder}; border-radius: 2px;
          top: calc(50% / var(--ped-n)); bottom: calc(50% / var(--ped-n));
        }
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
        .companion-card-inner { display: flex; align-items: center; gap: 12px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px; }
        .companion-avatar { width: 48px; height: 48px; border-radius: 50%; background: #FEF3C7; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .companion-name { font-size: 14px; font-weight: 700; color: #92400E; }
        .companion-note { font-size: 11px; color: #B45309; margin-top: 2px; line-height: 1.4; }
        .gallery-tabs { display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; scrollbar-width: none; }
        .gallery-tabs::-webkit-scrollbar { display: none; }
        .gallery-tab-btn { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid ${F.lineMid}; background: white; color: #6B7280; cursor: pointer; white-space: nowrap; transition: all .15s; display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .gallery-tab-btn.active { background: ${F.pink}; border-color: ${F.pink}; color: white; }
        .gallery-tab-count { background: rgba(0,0,0,0.1); border-radius: 10px; padding: 0 5px; font-size: 9px; }
        .gallery-tab-btn.active .gallery-tab-count { background: rgba(255,255,255,0.25); color: white; }
        .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .gallery-item { aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: ${F.line}; position: relative; cursor: zoom-in; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .gallery-item:hover img { transform: scale(1.08); }
        .gallery-item-del { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,0.55); color: white; border: none; cursor: pointer; display: none; align-items: center; justify-content: center; z-index: 2; }
        .gallery-item:hover .gallery-item-del { display: flex; }
        .btn-add-gallery { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; border: 1px dashed ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; white-space: nowrap; flex-shrink: 0; }
        .btn-add-gallery:hover { background: #FDE7EF; border-color: ${F.pink}; }
        .btn-add-gallery:disabled { opacity: .6; cursor: wait; }
        .doc-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${F.line}; }
        .doc-row:last-child { border-bottom: none; }
        .doc-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .doc-info { flex: 1; min-width: 0; }
        .doc-name { font-size: 13px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .doc-sub { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .doc-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .doc-download { width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${F.lineMid}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; color: #6B7280; flex-shrink: 0; }
        .doc-download:hover { background: ${F.pinkSoft}; color: ${F.pink}; border-color: ${F.pinkBorder}; }
        .doc-download.del:hover { background: #FEF2F2; color: #EF4444; border-color: #FECACA; }
        .timeline-list { position: relative; padding-left: 24px; border-left: 2px solid ${F.line}; display: flex; flex-direction: column; gap: 20px; }
        .timeline-item { position: relative; }
        .timeline-dot { position: absolute; left: -31px; top: 3px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px ${F.lineMid}; }
        .timeline-date { font-size: 10px; font-weight: 700; color: ${F.muted}; margin-bottom: 3px; }
        .timeline-title { font-size: 13px; font-weight: 700; color: ${F.ink}; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .timeline-id-badge { font-size: 9px; font-weight: 700; background: #F3F4F6; color: ${F.muted}; padding: 2px 7px; border-radius: 6px; font-family: monospace; letter-spacing: 0.04em; }
        .timeline-desc { font-size: 11px; color: #6B7280; margin-top: 3px; line-height: 1.5; }
        .activity-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        .activity-tab-btn { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid ${F.lineMid}; background: white; color: #6B7280; cursor: pointer; transition: all .15s; }
        .activity-tab-btn.active { background: ${F.ink}; border-color: ${F.ink}; color: white; }
        .share-footer { background: linear-gradient(135deg, #FFF0F4, #FDF2F5); border: 1px solid ${F.pinkBorder}; border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 8px; }
        .share-footer-left { display: flex; align-items: center; gap: 14px; }
        .share-paw { width: 48px; height: 48px; border-radius: 50%; background: ${F.pink}; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; flex-shrink: 0; }
        .share-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .share-subtitle { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
        .share-url-box { display: flex; align-items: center; gap: 8px; }
        .share-url { font-size: 12px; color: #6B7280; background: white; border: 1px solid ${F.lineMid}; border-radius: 8px; padding: 6px 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
        .btn-copy-url { padding: 6px 10px; border-radius: 8px; background: white; border: 1px solid ${F.lineMid}; font-size: 11px; font-weight: 600; cursor: pointer; color: #4B5563; flex-shrink: 0; transition: all .15s; }
        .btn-copy-url:hover { border-color: ${F.pink}; color: ${F.pink}; }
        .btn-pink { padding: 8px 20px; border-radius: 20px; background: ${F.pink}; color: white; font-size: 13px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; flex-shrink: 0; text-decoration: none; }
        .btn-pink:hover { background: #D63F6A; }
        .activity-table { width: 100%; border-collapse: collapse; }
        .activity-table tr { border-bottom: 1px solid ${F.line}; }
        .activity-table tr:last-child { border-bottom: none; }
        .activity-table td { padding: 10px 8px; vertical-align: middle; font-size: 12px; }
        .activity-type-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); padding: 16px; }
        .modal-box { background: white; width: 100%; max-width: 440px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .modal-pad { padding: 24px; }
        .modal-title { font-family: inherit; font-size: 18px; font-weight: 700; color: ${F.ink}; }
        .modal-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; margin-bottom: 18px; }
        .field-label { display: block; font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px; }
        .field-input { width: 100%; padding: 12px 14px; border-radius: 12px; background: #F9FAFB; border: 1px solid ${F.lineMid}; outline: none; font-size: 14px; font-weight: 500; color: ${F.ink}; transition: all .15s; font-family: inherit; }
        .field-input:focus { border-color: ${F.pinkBorder}; background: white; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip-btn { padding: 8px 14px; border-radius: 12px; border: 1px solid ${F.lineMid}; background: white; color: #6B7280; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; }
        .chip-btn.active { background: ${F.ink}; color: white; border-color: ${F.ink}; }
        /* ─── Pedigree Modal (card style, controls at bottom) ─── */
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
        .ped-modal-close { margin-left: 8px; padding: 11px 28px; border-radius: 12px; border: none; background: ${F.pink}; color: white; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .15s; }
        .ped-modal-close:hover { background: #D63F6A; }
        .lightbox { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; padding: 24px; cursor: zoom-out; }
        .lightbox img { max-width: 100%; max-height: 100%; border-radius: 12px; object-fit: contain; }
        .lightbox-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .qr-modal-img { width: 240px; height: 240px; margin: 0 auto 16px; border: 1px solid ${F.lineMid}; border-radius: 16px; padding: 12px; background: white; }
        .qr-modal-img img { width: 100%; height: 100%; }
        .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: ${F.ink}; color: white; padding: 12px 22px; border-radius: 30px; font-size: 13px; font-weight: 600; z-index: 400; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr 260px; } .hero-main-image { width: 240px; height: 240px; } }
        @media (max-width: 768px) {
          .page-body { padding: 16px 16px 40px; }
          .topbar { padding: 16px 16px 4px; }
          /* มือถือ: การ์ด modal ผังเต็มจอ ปุ่มซูม/ปิดอยู่ล่าง */
          .ped-modal-card { width: 95vw; height: 92vh; max-height: 92vh; }
          .ped-modal-stage { padding: 14px; }
          .btn-share span, .btn-edit-profile span { display: none; }
          .btn-share, .btn-edit-profile { padding: 0; width: 36px; height: 36px; border-radius: 50%; justify-content: center; }
          .topbar-title { font-size: 17px; }
          .hero-section { flex-direction: column; gap: 16px; }
          .gallery-strip { order: 2; flex-direction: row; width: 100%; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
          .gallery-strip::-webkit-scrollbar { display: none; }
          .gallery-thumb, .gallery-thumb-more { width: 56px; height: 56px; }
          .hero-main-image { order: 1; width: 100%; height: auto; aspect-ratio: 1 / 1; max-height: 360px; }
          .hero-main-image img { aspect-ratio: 1 / 1; }
          .hero-info { order: 3; width: 100%; }
          .pet-name { font-size: 26px; flex-wrap: wrap; }
          .quick-stats { grid-template-columns: repeat(2, 1fr); }
          .pet-id-card { flex-direction: column; align-items: flex-start; gap: 16px; }
          .pet-id-qr-wrapper { flex-direction: row; align-self: stretch; align-items: center; justify-content: space-between; width: 100%; }
          .pet-id-number { font-size: 20px; }
          .tabs-wrapper { margin-left: -16px; margin-right: -16px; padding: 0 16px; }
          .tab-btn { padding: 10px 14px; }
          .content-grid { grid-template-columns: 1fr; gap: 16px; }
          .card-header { padding: 14px 16px; }
          .card-body { padding: 16px; }
          .card-footer { padding: 12px 16px; }
          .pedigree-tree { padding: 16px 12px; }
          .ped-card, .pedigree-col-cards, .ped-card-slot, .ped-card-link { width: 150px; }
          .pedigree-col { padding-right: 32px; }
          .card-header .btn-add-gallery { padding: 6px 12px; font-size: 11px; }
          .share-footer { flex-direction: column; text-align: center; gap: 16px; padding: 16px; }
          .share-footer-left { flex-direction: column; align-items: center; }
          .share-url-box { width: 100%; }
          .share-url { max-width: none; flex: 1; }
          .btn-pink { width: 100%; justify-content: center; }
        }
        @media (max-width: 400px) {
          .page-body { padding: 12px 12px 36px; }
          .pet-name { font-size: 22px; }
          .quick-stats { grid-template-columns: 1fr 1fr; }
          .stat-cell { padding: 9px 10px; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .ped-card, .pedigree-col-cards, .ped-card-slot, .ped-card-link { width: 140px; }
          .topbar-title { font-size: 16px; }
        }
      `}</style>

      <div className="whiskora-page">
        {/* hidden file inputs */}
        <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,image/*" multiple style={{ display: 'none' }} onChange={handleDocUpload} />

        {/* ─── Topbar ─── */}
        <div className="topbar">
          <button className="topbar-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
          <div className="topbar-titles">
            <div className="topbar-title">โปรไฟล์สัตว์เลี้ยง</div>
            <div className="topbar-sub">{pet.name}</div>
          </div>
        </div>

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
                {pet.breed && <span className="breed-tag"><img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} /> {pet.breed}</span>}
                {pet.color && <span className="breed-tag breed-tag-white">{pet.color}</span>}
                {pet.pattern && <span className="breed-tag breed-tag-white">{pet.pattern}</span>}
              </div>
              <div className="quick-stats">
                <div className="stat-cell"><div className="stat-label"><Icon.Calendar /> วันเกิด</div><div className="stat-value">{formatDate(pet.birth_date)}</div><div className="stat-sub">อายุ {calculateAge(pet.birth_date)}</div></div>
                <div className="stat-cell"><div className="stat-label"><Icon.Weight /> น้ำหนัก</div><div className="stat-value">{pet.weight ? `${pet.weight} กก.` : '-'}</div><Link href={`/pets/${pet.id}/weight`} style={{ fontSize: '10px', fontWeight: 700, color: F.pink, textDecoration: 'none', marginTop: '2px', display: 'block' }}>+ บันทึก</Link></div>
                <div className="stat-cell"><div className="stat-label"><Icon.Brush /> สี</div><div className="stat-value">{pet.color || '-'}</div><div className="stat-sub">{pet.coat || ''}</div></div>
                <div className="stat-cell"><div className="stat-label"><Icon.Chip /> ไมโครชิพ</div><div className="stat-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{pet.microchip_number || '-'}</div></div>
              </div>
              <div className="pet-id-card">
                <div className="pet-id-left">
                  <div className="pet-id-label"><img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> PET ID</div>
                  <div className="pet-id-number">{pet.pet_code || `WSK-${String(pet.id).padStart(5, '0')}`}</div>
                  <div className="pet-id-reg">สมัครเมื่อ {formatDate(pet.created_at || pet.birth_date)}</div>
                  <div className="pet-id-actions">
                    <Link href={`/pets/${pet.id}/edit`} className="btn-id-card btn-id-edit"><Icon.Edit /> แก้ไข</Link>
                    <Link href={`/pets/${pet.id}/id-card`} className="btn-id-card"><Icon.Doc /> สร้างบัตรประจำตัว</Link>
                  </div>
                </div>
                <div className="pet-id-qr-wrapper">
                  <div className="pet-id-qr" onClick={() => setShowQrModal(true)}>{qrDataUrl ? <img src={qrDataUrl} alt="QR" /> : null}</div>
                  <button className="btn-view-qr" onClick={() => setShowQrModal(true)}>ดู / ดาวน์โหลด QR</button>
                </div>
              </div>
              {pet.status && (
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '20px', background: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: '700', border: '1px solid #A7F3D0' }}>● {pet.status}</span>
              )}
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
                    <button className="btn-add-gallery" onClick={() => setShowPedigreeModal(true)}><Icon.Expand /> ดูแบบเต็ม</button>
                  </div>
                  <div className="card-body" style={{ padding: '16px' }}>{renderPedigree()}</div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: F.pinkSoft }}><img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>ข้อมูลพื้นฐาน</div></div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                      {[
                        { label: 'ชื่อ', val: pet.name }, { label: 'วันเกิด', val: formatDate(pet.birth_date) },
                        { label: 'เพศ', val: isMale ? 'Male' : 'Female' }, { label: 'อายุ', val: calculateAge(pet.birth_date) },
                        { label: 'สายพันธุ์', val: pet.breed || speciesTh(pet.species) || '-' }, { label: 'น้ำหนัก', val: displayVal(pet.weight, ' กก.') },
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
                    <div className="card-header">
                      <div className="card-title"><div className="card-title-icon" style={{ background: '#F3E8FF', color: '#7C3AED' }}><Icon.Image /></div>แกลลอรี่</div>
                      {allImages.length < 4 && <button className="btn-add-gallery" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}><Icon.Plus /> {uploadingGallery ? 'กำลังอัปโหลด...' : 'เพิ่มรูป/วิดีโอ'}</button>}
                    </div>
                    <div className="card-body">
                      <div className="gallery-grid">
                        {allImages.map((img, i) => (
                          <div key={i} className="gallery-item">
                            <img src={img} alt="" onClick={() => setLightboxImage(img)} />
                            {i > 0 && <button className="gallery-item-del" onClick={(e) => { e.stopPropagation(); handleDeleteGalleryImage(img); }}><Icon.Trash /></button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {vaccines.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title"><div className="card-title-icon" style={{ background: '#CCFBF1', color: '#0D9488' }}><Icon.Syringe /></div>ประวัติการฉีดวัคซีน</div>
                      <Link href={`/pets/${pet.id}/vaccines`} style={{ fontSize: '11px', color: F.pink, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>ดูทั้งหมด →</Link>
                    </div>
                    <div className="card-body">
                      {vaccines.slice(0, 4).map(v => (
                        <div key={v.id} className="vaccine-row"><div className="vaccine-icon"><Icon.Syringe /></div>
                          <div className="vaccine-info"><div className="vaccine-name">{v.vaccine_name}</div><div className="vaccine-sub">{v.notes || 'รับวัคซีนเรียบร้อย'}</div></div>
                          <div className="vaccine-date">{formatDate(v.date_given)}</div></div>
                      ))}
                    </div>
                    {vaccines.length > 4 && <div className="card-footer"><Link href={`/pets/${pet.id}/vaccines`}>ดูประวัติทั้งหมด →</Link></div>}
                  </div>
                )}

                {/* Documents */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><div className="card-title-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Icon.Doc /></div>เอกสารสำคัญ</div>
                    <button className="btn-add-gallery" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}><Icon.Plus /> {uploadingDoc ? 'กำลังอัปโหลด...' : 'เพิ่มเอกสาร'}</button>
                  </div>
                  <div className="card-body">
                    {documents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: F.muted, fontSize: '12px' }}>ยังไม่มีเอกสาร — กดเพิ่มเอกสารเพื่ออัปโหลด</div>
                    ) : documents.map(doc => (
                      <div key={doc.id} className="doc-row">
                        <div className="doc-icon" style={{ background: '#DBEAFE', fontSize: '18px' }}>📄</div>
                        <div className="doc-info"><div className="doc-name">{doc.name}</div><div className="doc-sub">อัปโหลด {formatDate(doc.created_at)} {doc.file_size ? `· ${formatFileSize(doc.file_size)}` : ''}</div></div>
                        <div className="doc-actions">
                          <a className="doc-download" href={doc.file_url} target="_blank" rel="noopener noreferrer" download><Icon.Download /></a>
                          <button className="doc-download del" onClick={() => handleDeleteDoc(doc.id)}><Icon.Trash /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline preview */}
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Icon.Timeline /></div>ไทม์ไลน์กิจกรรม</div>
                    <button className="btn-add-gallery" onClick={() => setShowActivityModal(true)}><Icon.Plus /> เพิ่มกิจกรรม</button>
                  </div>
                  <div className="card-body">
                    {combinedTimeline.length === 0 ? <div style={{ textAlign: 'center', padding: '24px 0', color: F.muted, fontSize: '12px' }}>ยังไม่มีกิจกรรม</div> : (
                      <div className="timeline-list">
                        {combinedTimeline.slice(0, 5).map(item => (
                          <div key={item.id} className="timeline-item"><div className="timeline-dot" style={{ background: item.color }} />
                            <div className="timeline-date">{formatDate(item.date)}</div>
                            <div className="timeline-title">{item.title}{item.tag && <span className="timeline-id-badge">{item.tag}</span>}</div>
                            {item.description && <div className="timeline-desc">{item.description}</div>}</div>
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
                  <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FFE4E6', color: '#E11D48' }}>♥</div>ข้อมูลสุขภาพ</div></div>
                  <div className="card-body">
                    {[
                      { label: 'วัคซีนรวม (FVRCP)', val: `${vaccines.filter(v => v.vaccine_name?.includes('FVRCP')).length} เข็ม` },
                      { label: 'วัคซีนพิษสุนัขบ้า', val: `${vaccines.filter(v => v.vaccine_name?.includes('พิษสุนัขบ้า')).length} เข็ม` },
                      { label: 'กรุ๊ปเลือด', val: pet.blood_type || '-' },
                      { label: 'ทำหมันแล้ว', val: pet.is_neutered ? '✓' : '-' },
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
                  <div className="card-footer"><Link href={`/pets/${pet.id}/vaccines`}>ดูประวัติสุขภาพทั้งหมด →</Link></div>
                </div>

                {owner && (
                  <div className="card">
                    <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#F3F4F6', color: '#6B7280' }}>👤</div>เจ้าของ</div></div>
                    <div className="card-body">
                      <div className="owner-card-header">
                        <div className="owner-avatar">
                          {owner.avatar_url ? <img src={owner.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: F.pinkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.pink, fontWeight: 700 }}>{owner.full_name?.[0] || '?'}</div>}
                        </div>
                        <div className="owner-name-wrap"><div className="owner-name">{owner.full_name || 'ไม่ระบุชื่อ'}</div>
                          {pet.farm && <div className="owner-cattery"><Icon.Verified /> {pet.farm.farm_name}</div>}
                        </div>
                      </div>
                      {owner.phone && <div className="owner-info-row"><span className="owner-info-icon"><Icon.Phone /></span>{owner.phone}</div>}
                      {owner.email && <div className="owner-info-row"><span className="owner-info-icon"><Icon.Mail /></span>{owner.email}</div>}
                      {owner.location && <div className="owner-info-row"><span className="owner-info-icon"><Icon.Location /></span>{owner.location}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Pedigree tab ─── */}
          {activeTab === 'pedigree' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Icon.Dna /></div>แผนผังสายเลือด (Pedigree)</div></div>
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
                    {(pet.traits || pet.health_notes) && (
                      <div style={{ marginTop: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', marginBottom: '6px' }}>📝 หมายเหตุ</div>
                        <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 500, lineHeight: 1.6 }}>{pet.traits} {pet.health_notes}</p>
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
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#CCFBF1', color: '#0D9488' }}><Icon.Syringe /></div>ประวัติการฉีดวัคซีน</div>
                <Link href={`/pets/${pet.id}/vaccines`} className="btn-pink" style={{ fontSize: '12px', padding: '6px 14px' }}><Icon.Plus /> เพิ่มวัคซีน</Link>
              </div>
              <div className="card-body">
                {vaccines.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px' }}>ยังไม่มีประวัติวัคซีน</div> : vaccines.map(v => (
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
              <div className="card-header">
                <div className="card-title"><div className="card-title-icon" style={{ background: F.pinkSoft, color: F.pink }}><Icon.Weight /></div>ประวัติน้ำหนัก</div>
                <Link href={`/pets/${pet.id}/weight`} className="btn-pink" style={{ fontSize: '12px', padding: '6px 14px' }}><Icon.Plus /> บันทึกน้ำหนัก</Link>
              </div>
              <div className="card-body" style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ color: F.muted, fontSize: '13px', marginBottom: '12px' }}>ดูและบันทึกประวัติน้ำหนักทั้งหมดได้ในหน้าถัดไป</div>
                <Link href={`/pets/${pet.id}/weight`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', background: F.pink, color: 'white', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                  <Icon.Weight /> ไปหน้าบันทึกน้ำหนัก
                </Link>
              </div>
            </div>
          )}

          {/* ─── Activities tab ─── */}
          {activeTab === 'activities' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Icon.Doc /></div>โน้ต & พฤติกรรม</div>
                <button className="btn-add-gallery" onClick={() => setShowActivityModal(true)}><Icon.Plus /> เพิ่มโน้ต</button>
              </div>
              <div className="card-body">
                <div className="activity-tabs">
                  {['ทั้งหมด', 'นิสัย', 'อาหาร', 'หาหมอ', 'ทั่วไป'].map(t => (
                    <button key={t} className={`activity-tab-btn ${activeActivityFilter === t ? 'active' : ''}`} onClick={() => setActiveActivityFilter(t)}>{t}</button>
                  ))}
                </div>
                {filteredActivities.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px' }}>ยังไม่มีโน้ตในหมวดนี้</div> : (
                  <table className="activity-table"><tbody>
                    {filteredActivities.map(a => (
                      <tr key={a.id}>
                        <td style={{ width: 36, paddingLeft: 0 }}>
                          <div className="activity-type-icon" style={{ background: a.activity_type?.includes('อาหาร') ? '#FEF9C3' : a.activity_type?.includes('หมอ') ? '#FEE2E2' : '#F0FDF4', fontSize: '14px' }}>
                            {a.activity_type?.includes('อาหาร') ? '🍗' : a.activity_type?.includes('หมอ') ? '🏥' : a.activity_type?.includes('พยาธิ') ? '💊' : '📝'}
                          </div>
                        </td>
                        <td><div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{a.title}</div><div style={{ fontSize: '11px', color: F.muted, marginTop: '2px' }}>{a.description}</div></td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: F.muted, fontSize: '11px' }}>{formatDate(a.activity_date)}</td>
                      </tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            </div>
          )}

          {/* ─── Docs tab ─── */}
          {activeTab === 'docs' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Icon.Doc /></div>เอกสารสำคัญ</div>
                <button className="btn-add-gallery" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}><Icon.Plus /> {uploadingDoc ? 'กำลังอัปโหลด...' : 'เพิ่มเอกสาร'}</button>
              </div>
              <div className="card-body">
                {documents.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px' }}>ยังไม่มีเอกสาร</div> : documents.map(doc => (
                  <div key={doc.id} className="doc-row">
                    <div className="doc-icon" style={{ background: '#DBEAFE', fontSize: '18px' }}>📄</div>
                    <div className="doc-info"><div className="doc-name">{doc.name}</div><div className="doc-sub">อัปโหลด {formatDate(doc.created_at)} {doc.file_size ? `· ${formatFileSize(doc.file_size)}` : ''}</div></div>
                    <div className="doc-actions">
                      <a className="doc-download" href={doc.file_url} target="_blank" rel="noopener noreferrer" download><Icon.Download /></a>
                      <button className="doc-download del" onClick={() => handleDeleteDoc(doc.id)}><Icon.Trash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Timeline tab ─── */}
          {activeTab === 'timeline' && (
            <div className="card">
              <div className="card-header"><div className="card-title"><div className="card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Icon.Timeline /></div>ไทม์ไลน์กิจกรรมทั้งหมด</div>
                <button className="btn-add-gallery" onClick={() => setShowActivityModal(true)}><Icon.Plus /> เพิ่มกิจกรรม</button>
              </div>
              <div className="card-body">
                {combinedTimeline.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: F.muted, fontSize: '13px' }}>ยังไม่มีกิจกรรม</div> : (
                  <div className="timeline-list">
                    {combinedTimeline.map(item => (
                      <div key={item.id} className="timeline-item"><div className="timeline-dot" style={{ background: item.color }} />
                        <div className="timeline-date">{formatDate(item.date)}</div>
                        <div className="timeline-title">{item.title}{item.tag && <span className="timeline-id-badge">{item.tag}</span>}</div>
                        {item.description && <div className="timeline-desc">{item.description}</div>}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Share Footer ─── */}
          <div className="share-footer" style={{ marginTop: '24px' }}>
            <div className="share-footer-left"><div className="share-paw"><img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} /></div>
              <div><div className="share-title">แชร์โปรไฟล์ {pet.name}</div><div className="share-subtitle">ให้เพื่อนหรือครอบครัวดูได้ง่าย ๆ</div></div>
            </div>
            <div className="share-url-box"><div className="share-url">{shareUrl}</div><button className="btn-copy-url" onClick={handleCopyUrl}>{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</button></div>
            <button className="btn-pink" onClick={handleShare}><Icon.Share /> แชร์</button>
          </div>
        </div>
      </div>

      {/* ─── Activity Modal ─── */}
      {showActivityModal && (
        <div className="modal-overlay" onClick={() => !savingActivity && setShowActivityModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-pad">
              <div className="modal-title">เพิ่มกิจกรรม</div>
              <div className="modal-sub">บันทึกเหตุการณ์ลงไทม์ไลน์ของ {pet.name}</div>
              <form onSubmit={handleSaveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div><label className="field-label">ประเภท</label><div className="chip-row">
                  {ACTIVITY_TYPES.map(t => <button key={t} type="button" className={`chip-btn ${activityForm.activity_type === t ? 'active' : ''}`} onClick={() => setActivityForm({ ...activityForm, activity_type: t })}>{t}</button>)}
                </div></div>
                <div><label className="field-label">หัวข้อ</label><input className="field-input" type="text" value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="เช่น พาไปตรวจสุขภาพประจำปี" required /></div>
                <div><label className="field-label">วันที่</label><input className="field-input" type="date" value={activityForm.activity_date} onChange={(e) => setActivityForm({ ...activityForm, activity_date: e.target.value })} required /></div>
                <div><label className="field-label">รายละเอียด (ถ้ามี)</label><textarea className="field-input" rows={3} value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="บันทึกเพิ่มเติม..." style={{ resize: 'none' }} /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowActivityModal(false)} disabled={savingActivity} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#F3F4F6', color: '#6B7280', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>ยกเลิก</button>
                  <button type="submit" disabled={savingActivity} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: F.pink, color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>{savingActivity ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── QR Modal ─── */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-pad" style={{ textAlign: 'center' }}>
              <div className="modal-title">QR โปรไฟล์ {pet.name}</div>
              <div className="modal-sub">สแกนเพื่อเปิดหน้าโปรไฟล์สาธารณะ</div>
              <div className="qr-modal-img">{qrDataUrl && <img src={qrDataUrl} alt="QR Code" />}</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowQrModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#F3F4F6', color: '#6B7280', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>ปิด</button>
                <button onClick={handleDownloadQr} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: F.pink, color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Icon.Download /> ดาวน์โหลด</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pedigree Modal (การ์ดกลางจอ ซูม/ปิดด้านล่างแบบ QR) ─── */}
      {showPedigreeModal && (
        <div className="modal-overlay" onClick={() => { setShowPedigreeModal(false); setPedigreeZoom(1); }}>
          <div className="ped-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ped-modal-head">
              <div className="ped-modal-title"><Icon.Dna /> แผนผังสายเลือด {pet.name}</div>
            </div>
            <div className="ped-modal-stage" ref={pedStageRef}>
              <div className="ped-modal-scaler" ref={pedScalerRef} style={{ transform: `scale(${pedigreeZoom})` }}>
                {renderPedigree()}
              </div>
            </div>
            <div className="ped-modal-foot">
              <button className="ped-modal-zoombtn" onClick={() => setPedigreeZoom(z => Math.max(0.5, +(z - 0.15).toFixed(2)))} aria-label="ซูมออก">−</button>
              <span className="ped-modal-zoomval">{Math.round(pedigreeZoom * 100)}%</span>
              <button className="ped-modal-zoombtn" onClick={() => setPedigreeZoom(z => Math.min(2.5, +(z + 0.15).toFixed(2)))} aria-label="ซูมเข้า">+</button>
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

      {/* ─── Toast ─── */}
      {copied && <div className="toast">คัดลอกลิงก์แล้ว ✓</div>}
    </>
  );
}