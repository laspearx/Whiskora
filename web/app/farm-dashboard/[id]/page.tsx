"use client";

import React, { useCallback, useEffect, useState, useRef, Suspense } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { supabase } from "@/lib/supabase";
import { speciesTh, getGestationConfig } from "@/lib/species";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';

/* ── Design tokens ── */
const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  amber: '#D97706', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  orange: '#F97316', orangeSoft: '#FFF7ED', orangeBorder: '#FED7AA',
  red: '#EF4444', redSoft: '#FEF2F2', redBorder: '#FECACA',
  purple: '#7C3AED', purpleSoft: '#F3E8FF',
  slate: '#64748B', slateSoft: '#F1F5F9', slateBorder: '#CBD5E1',
  line: '#f3dde3', lineMid: '#E5E7EB', bg: '#fffafc',
};

/* ── SVG Icons ── */
const Icon = {
  ArrowLeft:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:         () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Eye:          () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Male:         () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female:       () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Heart:        () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  X:            () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:        () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

/* ── Pregnancy status derivation ── */
type ActiveLitterStatus = 'waiting_confirmation' | 'pregnant' | 'near_due' | 'due_window' | 'overdue';
interface LitterStatusInfo {
  status: ActiveLitterStatus;
  daysPregnant: number;
  daysUntilWindowStart: number;
  daysOverdue: number;
  minDueDate: Date | null;
  maxDueDate: Date | null;
}

function deriveLitterStatus(litter: any, species: string | null | undefined): LitterStatusInfo {
  const cfg = getGestationConfig(species);
  if (!litter.mating_date) {
    return { status: 'waiting_confirmation', daysPregnant: 0, daysUntilWindowStart: cfg.gestationMin, daysOverdue: 0, minDueDate: null, maxDueDate: null };
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const mating = new Date(litter.mating_date); mating.setHours(0, 0, 0, 0);
  const daysPregnant = Math.round((today.getTime() - mating.getTime()) / 86400000);
  const minDueDate = new Date(mating.getTime() + cfg.gestationMin * 86400000);
  const maxDueDate = new Date(mating.getTime() + cfg.gestationMax * 86400000);
  const daysUntilWindowStart = cfg.gestationMin - daysPregnant;
  const daysUntilWindowEnd   = cfg.gestationMax - daysPregnant;
  const daysOverdue = daysUntilWindowEnd < 0 ? Math.abs(daysUntilWindowEnd) : 0;

  let status: ActiveLitterStatus;
  if (daysUntilWindowEnd < 0 && daysOverdue > cfg.overdueTolerance) {
    status = 'overdue';
  } else if (daysUntilWindowStart <= 0) {
    status = 'due_window';
  } else if (daysUntilWindowStart <= cfg.nearDueThreshold) {
    status = 'near_due';
  } else {
    status = 'pregnant';
  }
  return { status, daysPregnant, daysUntilWindowStart, daysOverdue, minDueDate, maxDueDate };
}

const STATUS_URGENCY: Record<ActiveLitterStatus, number> = {
  overdue: 0, due_window: 1, near_due: 2, pregnant: 3, waiting_confirmation: 4,
};

/* ── Helpers ── */
const fmtDate = (d?: string | null, short = false) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('th-TH', short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};
const daysDiff = (dateStr: string) => {
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const t = new Date();        t.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - t.getTime()) / 86400000);
};
const fmtMoney = (n: number) => `฿${Math.abs(n).toLocaleString()}`;

interface Task {
  id: string;
  urgency: 'overdue' | 'today' | 'upcoming' | 'info';
  label: string;
  action: string;
  href: string;
  icon: string;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, maxDim = 1200): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => { image.onload = () => resolve(); });
  const scale = Math.min(1, maxDim / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85));
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
function FarmDashboardContent() {
  const router      = useRouter();
  const params      = useParams();
  const searchParams = useSearchParams();
  const farmId  = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [farm,         setFarm]         = useState<any>(null);
  const [pets,         setPets]         = useState<any[]>([]);
  const [litters,      setLitters]      = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vaccines,     setVaccines]     = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAllTasks,    setShowAllTasks]    = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const coverInputRef  = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropSrc,      setCropSrc]      = useState<string | null>(null);
  const [cropType,     setCropType]     = useState<"avatar" | "cover" | null>(null);
  const [cropPos,      setCropPos]      = useState<Point>({ x: 0, y: 0 });
  const [cropZoom,     setCropZoom]     = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [cropUploading, setCropUploading] = useState(false);

  useEffect(() => {
    if (!farmId) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: farmData } = await supabase
        .from('farms').select('*').eq('id', farmId).eq('user_id', session.user.id).single();
      if (!farmData) { router.push('/partner'); return; }
      setFarm(farmData);

      const [petsRes, littersRes, txRes] = await Promise.all([
        supabase.from('pets').select('*').eq('farm_id', farmId),
        supabase.from('litters')
          .select('*, sire:pets!sire_id(id,name,image_url), dam:pets!dam_id(id,name,image_url,species)')
          .eq('farm_id', farmId).order('mating_date', { ascending: false }),
        supabase.from('farm_transactions').select('*').eq('farm_id', farmId)
          .order('transaction_date', { ascending: false }),
      ]);

      const loadedPets = petsRes.data || [];
      setPets(loadedPets);
      setLitters(littersRes.data || []);
      setTransactions(txRes.data || []);

      const petIds = loadedPets.map((p: any) => p.id);
      if (petIds.length > 0) {
        const vacRes = await supabase
          .from('vaccines').select('id,pet_id,vaccine_name,next_due')
          .in('pet_id', petIds).order('next_due');
        setVaccines(vacRes.data || []);
      }

      const apptRes = await supabase.from('appointments')
        .select('id,title,appt_date,appt_type').eq('farm_id', farmId)
        .eq('is_done', false).order('appt_date');
      setAppointments(apptRes.data || []);

      setLoading(false);
    };
    load();
  }, [farmId, router]);

  /* ── Derived ── */
  const petMap = Object.fromEntries(pets.map(p => [p.id, p]));
  const activeLitters = litters
    .filter(l => l.status === 'รอคลอด')
    .sort((a, b) => {
      const sa = deriveLitterStatus(a, a.dam?.species || farm?.pet_type);
      const sb = deriveLitterStatus(b, b.dam?.species || farm?.pet_type);
      return STATUS_URGENCY[sa.status] - STATUS_URGENCY[sb.status];
    });
  const bornLitters = litters.filter(l => l.status !== 'รอคลอด');

  /* Profile completion */
  const completionItems = [
    { key: 'image',   done: !!farm?.image_url,      pts: 15 },
    { key: 'bio',     done: !!farm?.bio,             pts: 15 },
    { key: 'phone',   done: !!farm?.phone,           pts: 10 },
    { key: 'fb',      done: !!farm?.facebook_link,   pts: 10 },
    { key: 'species', done: !!farm?.species,         pts: 10 },
    { key: 'verify',  done: !!farm?.is_verified,     pts: 20 },
  ];
  const farmCompletion = Math.min(100, 20 + completionItems.reduce((s, i) => s + (i.done ? i.pts : 0), 0));

  /* ── All Tasks (unified, deduped) ── */
  const allTasks: Task[] = [];

  activeLitters.forEach(l => {
    if (!l.expected_birth_date) return;
    const diff = daysDiff(l.expected_birth_date);
    const code = l.litter_code || 'TBA';
    if (diff < 0) {
      allTasks.push({ id: `lb-${l.id}`, urgency: 'overdue', label: `ครอก ${code} เลยกำหนดคลอด ${Math.abs(diff)} วัน`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth`, icon: '/icons/icon-breeding.png' });
    } else if (diff === 0) {
      allTasks.push({ id: `lb-${l.id}`, urgency: 'today', label: `ครอก ${code} — คาดคลอดวันนี้`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth`, icon: '/icons/icon-breeding.png' });
    } else if (diff <= 5) {
      allTasks.push({ id: `lb-${l.id}`, urgency: 'upcoming', label: `ครอก ${code} — คาดคลอดใน ${diff} วัน`, action: 'ดู', href: `/farm-dashboard/${farmId}/litters/${l.id}`, icon: '/icons/icon-breeding.png' });
    }
  });

  vaccines.forEach(v => {
    if (!v.next_due) return;
    const diff = daysDiff(v.next_due);
    const pn   = petMap[v.pet_id]?.name || 'สัตว์';
    if (diff < 0) {
      allTasks.push({ id: `vax-${v.id}`, urgency: 'overdue', label: `${pn} — วัคซีน ${v.vaccine_name} เลยกำหนด ${Math.abs(diff)} วัน`, action: 'จัดการ', href: `/pets/${v.pet_id}/vaccines`, icon: '/icons/icon-health.png' });
    } else if (diff === 0) {
      allTasks.push({ id: `vax-${v.id}`, urgency: 'today', label: `${pn} — วัคซีน ${v.vaccine_name} ครบกำหนดวันนี้`, action: 'บันทึก', href: `/pets/${v.pet_id}/vaccines/create`, icon: '/icons/icon-health.png' });
    } else if (diff <= 7) {
      allTasks.push({ id: `vax-${v.id}`, urgency: 'upcoming', label: `${pn} — วัคซีน ${v.vaccine_name} อีก ${diff} วัน`, action: 'ดู', href: `/pets/${v.pet_id}/vaccines`, icon: '/icons/icon-health.png' });
    }
  });

  appointments.forEach(a => {
    if (!a.appt_date) return;
    const diff = daysDiff(a.appt_date);
    if (diff < 0) {
      allTasks.push({ id: `ap-${a.id}`, urgency: 'overdue', label: `นัดหมาย: ${a.title} (เลยกำหนด ${Math.abs(diff)} วัน)`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    } else if (diff === 0) {
      allTasks.push({ id: `ap-${a.id}`, urgency: 'today', label: `นัดหมาย: ${a.title} — วันนี้`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    } else if (diff <= 7) {
      allTasks.push({ id: `ap-${a.id}`, urgency: 'upcoming', label: `นัดหมาย: ${a.title} — ${fmtDate(a.appt_date, true)}`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    }
  });

  bornLitters.forEach(l => {
    const kittens = pets.filter(p => p.litter_id === l.id);
    if (kittens.length === 0 && (!l.puppy_count || l.puppy_count === 0)) {
      allTasks.push({ id: `nk-${l.id}`, urgency: 'today', label: `ครอก ${l.litter_code || 'TBA'} คลอดแล้วแต่ยังไม่บันทึกลูกสัตว์`, action: 'บันทึก', href: `/farm-dashboard/${farmId}/litters/${l.id}`, icon: '/icons/icon-feeding.png' });
    }
  });

  const noBirth = pets.filter(p => !p.birth_date).length;
  if (noBirth > 0) {
    allTasks.push({ id: 'no-birth', urgency: 'info', label: `สัตว์ ${noBirth} ตัวยังไม่มีวันเกิด`, action: 'แก้ไข', href: `/farm-dashboard/${farmId}/pets`, icon: '/icons/icon-my-pets.png' });
  }
  const noImage = pets.filter(p => !p.image_url).length;
  if (noImage > 0) {
    allTasks.push({ id: 'no-img', urgency: 'info', label: `สัตว์ ${noImage} ตัวยังไม่มีรูปภาพ`, action: 'เพิ่มรูป', href: `/farm-dashboard/${farmId}/pets`, icon: '/icons/icon-my-pets.png' });
  }

  const urgOrd = { overdue: 0, today: 1, upcoming: 2, info: 3 } as const;
  allTasks.sort((a, b) => urgOrd[a.urgency] - urgOrd[b.urgency]);
  const TASK_LIMIT = 4;
  const visibleTasks = showAllTasks ? allTasks : allTasks.slice(0, TASK_LIMIT);

  /* ── Farm Overview stats ── */
  const breeders      = pets.filter(p => ['พ่อพันธุ์ / แม่พันธุ์', 'พ่อพันธุ์', 'แม่พันธุ์'].includes(p.status)).length;
  const pregnant      = activeLitters.filter(l => l.dam_id).length;
  const babies        = pets.filter(p => p.status === 'เด็ก').length;
  const readyToMove   = pets.filter(p => p.status === 'พร้อมย้ายบ้าน').length;

  /* ── Finance ── */
  const today = new Date();
  const thisMonth = today.getMonth(), thisYear = today.getFullYear();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear  = thisMonth === 0 ? thisYear - 1 : thisYear;
  const inMonth = (d: string, m: number, y: number) => { const dt = new Date(d); return dt.getMonth() === m && dt.getFullYear() === y; };
  const thisMonthTx = transactions.filter(t => t.transaction_date && inMonth(t.transaction_date, thisMonth, thisYear));
  const prevMonthTx = transactions.filter(t => t.transaction_date && inMonth(t.transaction_date, prevMonth, prevYear));
  const sumI = (txs: any[]) => txs.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const sumE = (txs: any[]) => txs.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const tmI = sumI(thisMonthTx), tmE = sumE(thisMonthTx), tmNet = tmI - tmE;
  const pmNet = sumI(prevMonthTx) - sumE(prevMonthTx);
  const closedWithTx = bornLitters.filter(l => transactions.some(t => t.litter_id === l.id)).length;
  const monthLabel = today.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const hasFinance = transactions.length > 0;

  /* ── Pregnancy progress ── */
  const calcPct = (mating: string, expected: string) => {
    const s = new Date(mating).getTime(), e = new Date(expected).getTime(), n = Date.now();
    if (n >= e) return 100; if (n <= s) return 0;
    return Math.round(((n - s) / (e - s)) * 100);
  };

  const openCrop = (file: File, type: "avatar" | "cover") => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropType(type);
      setCropPos({ x: 0, y: 0 });
      setCropZoom(1);
      setCroppedPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const cancelCrop = () => {
    setCropSrc(null); setCropType(null);
    if (coverInputRef.current)  coverInputRef.current.value  = "";
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  const confirmCrop = async () => {
    if (!cropSrc || !croppedPixels) return;
    const isAvatar = cropType === "avatar";
    if (isAvatar) setUploadingAvatar(true); else setUploadingCover(true);
    setCropUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedPixels, isAvatar ? 480 : 1200);
      const path = `${farmId}/${isAvatar ? 'avatar' : 'cover'}_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from('farm-assets').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) { alert('อัพโหลดรูปไม่สำเร็จ: ' + error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('farm-assets').getPublicUrl(data.path);
      const url = `${publicUrl}?t=${Date.now()}`;
      const field = isAvatar ? 'image_url' : 'cover_url';
      await supabase.from('farms').update({ [field]: url, updated_at: new Date().toISOString() }).eq('id', farmId);
      setFarm((f: any) => ({ ...f, [field]: url }));
      cancelCrop();
    } catch (err) {
      console.error('Crop upload error:', err);
    } finally {
      setCropUploading(false);
      setUploadingAvatar(false);
      setUploadingCover(false);
    }
  };

  const handleBack = () => fromPage === 'partner' ? router.push('/partner') : router.push('/profile');

  /* ── FAB actions ── */
  const fabActions = [
    { label: 'เพิ่มสัตว์',       href: `/farm-dashboard/${farmId}/pets/create`,       icon: '/icons/icon-tab-add.png' },
    { label: 'บันทึกการผสม',     href: `/farm-dashboard/${farmId}/litters/create`,    icon: '/icons/icon-breeding.png' },
    { label: 'บันทึกคลอด',      href: activeLitters.length === 1 ? `/farm-dashboard/${farmId}/litters/${activeLitters[0]?.id}/birth` : `/farm-dashboard/${farmId}/litters`, icon: '/icons/icon-feeding.png' },
    { label: 'เพิ่มลูกสัตว์',   href: `/farm-dashboard/${farmId}/pets/bulk-create`,  icon: '/icons/icon-my-pets.png' },
    { label: 'เพิ่มรายรับ',      href: `/farm-dashboard/${farmId}/transactions/create?type=income`,  icon: '/icons/icon-wallet.png' },
    { label: 'เพิ่มรายจ่าย',     href: `/farm-dashboard/${farmId}/transactions/create?type=expense`, icon: '/icons/icon-wallet.png' },
    { label: 'เพิ่มนัดหมาย',    href: `/farm-dashboard/${farmId}/appointments`,      icon: '/icons/icon-calendar.png' },
  ];

  if (loading) return <PageLoader />;
  if (!farm)   return null;

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }

        /* ─── Crop modal ─── */
        .fd-crop-overlay { position:fixed; inset:0; z-index:500; display:flex; flex-direction:column; background:#000; }
        .fd-crop-area { flex:1; position:relative; min-height:260px; }
        .fd-crop-controls { padding:16px 20px env(safe-area-inset-bottom,24px); background:#111; display:flex; flex-direction:column; gap:14px; }
        .fd-crop-zoom-row { display:flex; align-items:center; gap:10px; }
        .fd-crop-zoom-label { font-size:12px; color:rgba(255,255,255,.6); flex-shrink:0; }
        .fd-crop-zoom-input { flex:1; accent-color:${F.pink}; cursor:pointer; }
        .fd-crop-actions { display:flex; gap:12px; }
        .fd-crop-cancel { flex:1; padding:13px; border:1.5px solid rgba(255,255,255,.25); border-radius:14px; background:transparent; color:white; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }
        .fd-crop-confirm { flex:2; padding:13px; border:none; border-radius:14px; background:${F.pink}; color:white; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
        .fd-crop-confirm:disabled { opacity:.6; cursor:not-allowed; }

        .fd-page { font-family:inherit; min-height:100vh; color:${F.ink}; background:${F.bg}; padding-bottom:calc(68px + env(safe-area-inset-bottom,0px) + 16px); }

        /* ─── 1. Cover + Identity Header ─── */
        .fd-cover { position:relative; height:168px; margin:0 -16px; background:linear-gradient(135deg,${F.pink} 0%,#f06d98 55%,#f8a5c2 100%); overflow:hidden; z-index:0; }
        .fd-cover img.fd-cover-img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
        .fd-cover-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,.22),transparent 50%); }
        .fd-cover-top { position:absolute; top:14px; left:0; right:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; z-index:2; }
        .fd-cover-btn { width:36px; height:36px; border-radius:11px; background:rgba(255,255,255,.88); backdrop-filter:blur(8px); color:${F.ink}; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; box-shadow:0 2px 8px rgba(0,0,0,.12); transition:all .15s; text-decoration:none; }
        .fd-cover-btn:hover { background:white; }
        .fd-cover-cam { position:absolute; bottom:8px; right:12px; z-index:2; width:30px; height:30px; border-radius:8px; background:rgba(0,0,0,.32); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; }
        .fd-cover-spin { position:absolute; inset:0; background:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; z-index:3; font-size:13px; font-weight:700; color:${F.pink}; }

        .fd-identity { padding:0 0 14px; }
        .fd-id-row { position:relative; z-index:1; display:flex; align-items:center; gap:12px; margin-top:8px; padding-bottom:12px; }
        .fd-avatar { width:86px; height:86px; border-radius:50%; border:3.5px solid white; overflow:hidden; background:${F.pinkSoft}; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 16px rgba(0,0,0,.13); cursor:pointer; position:relative; }
        .fd-avatar img { width:100%; height:100%; object-fit:cover; }
        .fd-avatar-edit { position:absolute; bottom:3px; right:1px; width:22px; height:22px; background:${F.pink}; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; pointer-events:none; }
        .fd-avatar-spin { position:absolute; inset:0; background:rgba(255,255,255,.6); border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .fd-id-main { flex:1; min-width:0; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
        .fd-id-text { flex:1; min-width:0; }
        .fd-name { font-size:20px; font-weight:750; color:${F.ink}; line-height:1.2; display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:0 0 2px; }
        .fd-name img { width:18px; height:18px; object-fit:contain; flex-shrink:0; }
        .fd-tagline { font-size:13px; color:${F.muted}; font-weight:400; }
        .fd-view-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; background:#F3F4F6; color:${F.inkSoft}; text-decoration:none; transition:background .15s; border:none; cursor:pointer; }
        .fd-view-btn:hover { background:#E5E7EB; }
        .fd-edit-icon { flex-shrink:0; display:flex; align-items:center; justify-content:center; text-decoration:none; opacity:1; transition:opacity .15s; }
        .fd-edit-icon:active { opacity:.6; }

        .fd-prog-bar { display:flex; align-items:center; gap:6px; margin-top:5px; }
        .fd-prog-track { flex:1; height:5px; background:${F.line}; border-radius:10px; overflow:hidden; }
        .fd-prog-fill  { height:100%; border-radius:10px; background:${F.pink}; transition:width 1s ease; }
        .fd-prog-text  { font-size:11px; font-weight:700; color:${F.pink}; white-space:nowrap; }

        .fd-verify-btn { display:flex; align-items:center; gap:8px; margin-top:12px; padding:11px 14px; border-radius:12px; background:${F.pinkSoft}; border:1.5px dashed ${F.pinkBorder}; text-decoration:none; cursor:pointer; transition:all .15s; }
        .fd-verify-btn:hover { background:#fde7ef; border-color:${F.pink}; }
        .fd-verify-btn img { width:28px; height:28px; object-fit:contain; }
        .fd-verify-btn-text { flex:1; }
        .fd-verify-btn-title { font-size:13px; font-weight:700; color:${F.pink}; }
        .fd-verify-btn-sub { font-size:11px; color:${F.muted}; font-weight:400; }
        .fd-pending-badge { display:flex; align-items:center; gap:8px; margin-top:12px; padding:10px 14px; border-radius:12px; background:#FFFBEB; border:1px solid #FDE68A; font-size:12px; font-weight:600; color:#92400E; }

        /* ─── Content wrapper ─── */
        .fd-body { padding:12px 12px 0; display:flex; flex-direction:column; gap:10px; max-width:640px; margin:0 auto; }
        @media (min-width:900px) { .fd-body { max-width:1100px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; padding:16px 16px 0; align-items:start; }
          .fd-full-width { grid-column:1/-1; } }

        /* ─── Section base ─── */
        .fd-sec { background:white; border:1px solid ${F.line}; border-radius:14px; padding:14px; }
        .fd-sec-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
        .fd-sec-title { display:flex; align-items:center; gap:7px; }
        .fd-sec-title img { width:26px; height:26px; object-fit:contain; }
        .fd-sec-h { margin:0; font-size:14px; font-weight:700; color:${F.ink}; }
        .fd-sec-badge { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; border-radius:8px; font-size:9px; font-weight:800; padding:0 4px; }
        .fd-link-sm { color:${F.pink}; font-size:11px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:2px; }
        .fd-link-sm:hover { text-decoration:underline; }

        /* ─── 2. Today / Action Center ─── */
        .fd-task-row { display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:9px; margin-bottom:5px; }
        .fd-task-row:last-child { margin-bottom:0; }
        .fd-task-icon { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-task-icon img { width:18px; height:18px; object-fit:contain; }
        .fd-task-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .fd-task-msg { flex:1; font-size:12px; font-weight:600; color:${F.ink}; line-height:1.4; min-width:0; }
        .fd-task-btn { font-size:10px; font-weight:700; padding:3px 9px; border-radius:7px; text-decoration:none; white-space:nowrap; flex-shrink:0; border:none; cursor:pointer; font-family:inherit; }
        .fd-t-overdue  { background:${F.redSoft};   border:1px solid ${F.redBorder}; }
        .fd-t-today    { background:${F.amberSoft}; border:1px solid ${F.amberBorder}; }
        .fd-t-upcoming { background:rgba(37,99,235,.06); border:1px solid #BFDBFE; }
        .fd-t-info     { background:#F9FAFB; border:1px solid ${F.lineMid}; }
        .fd-t-overdue  .fd-task-dot { background:${F.red}; }
        .fd-t-today    .fd-task-dot { background:${F.amber}; }
        .fd-t-upcoming .fd-task-dot { background:#2563EB; }
        .fd-t-info     .fd-task-dot { background:${F.lineMid}; }
        .fd-t-overdue  .fd-task-btn { background:${F.red};   color:white; }
        .fd-t-today    .fd-task-btn { background:${F.amber}; color:white; }
        .fd-t-upcoming .fd-task-btn { background:#2563EB; color:white; }
        .fd-t-info     .fd-task-btn { background:${F.lineMid}; color:${F.inkSoft}; }
        .fd-today-empty { font-size:12px; color:${F.green}; font-weight:600; display:flex; align-items:center; gap:6px; }
        .fd-today-empty img { width:18px; height:18px; object-fit:contain; }
        .fd-show-more { margin-top:8px; font-size:11px; font-weight:700; color:${F.pink}; background:none; border:none; cursor:pointer; font-family:inherit; padding:4px 0; }

        /* ─── 3. Farm Overview ─── */
        .fd-ov-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        @media (max-width:360px) { .fd-ov-grid { grid-template-columns:repeat(2,1fr); } }
        .fd-ov-stat { border-radius:10px; padding:10px 8px; cursor:pointer; text-decoration:none; display:flex; flex-direction:column; gap:3px; transition:all .15s; border:1.5px solid transparent; }
        .fd-ov-stat:hover { border-color:rgba(232,70,119,.2); transform:translateY(-1px); }
        .fd-ov-count { font-size:22px; font-weight:800; line-height:1; }
        .fd-ov-label { font-size:9px; font-weight:700; color:${F.inkSoft}; line-height:1.3; }
        .fd-ov-icon  { width:28px; height:28px; object-fit:contain; margin-bottom:4px; }

        /* ─── 4. Pregnancy Tracking Card ─── */
        .ptc { position:relative; border:1px solid ${F.line}; border-radius:14px; overflow:hidden; margin-bottom:10px; background:white; box-shadow:0 1px 4px rgba(31,26,28,.06); }
        .ptc:last-child { margin-bottom:0; }
        .ptc-accent { position:absolute; left:0; top:0; bottom:0; width:4px; border-radius:14px 0 0 14px; }
        .ptc-inner { padding:12px 13px 13px 17px; }
        .ptc-header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:9px; }
        .ptc-code { font-size:15px; font-weight:800; color:${F.ink}; flex-shrink:0; letter-spacing:-.01em; }
        .ptc-badge { font-size:9px; font-weight:800; padding:3px 9px; border-radius:20px; white-space:nowrap; letter-spacing:.02em; }
        .ptc-parents { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .ptc-avatars { display:flex; flex-shrink:0; }
        .ptc-av { width:28px; height:28px; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 0 1px ${F.line}; }
        .ptc-av + .ptc-av { margin-left:-8px; }
        .ptc-av img { width:100%; height:100%; object-fit:cover; }
        .ptc-av-sire { background:#DBEAFE; color:#2563EB; font-size:9px; }
        .ptc-av-dam  { background:#FCE7F3; color:#DB2777; font-size:9px; }
        .ptc-pair-name { font-size:11px; font-weight:700; color:${F.inkSoft}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
        .ptc-divider { height:1px; background:${F.line}; margin:0 0 10px; }
        .ptc-summary { margin-bottom:10px; }
        .ptc-main { font-size:14px; font-weight:800; color:${F.ink}; line-height:1.3; margin-bottom:2px; }
        .ptc-sub  { font-size:11px; font-weight:600; color:${F.muted}; line-height:1.4; margin-bottom:4px; }
        .ptc-dates { font-size:10px; color:${F.muted}; font-weight:500; }
        .ptc-timeline { display:flex; align-items:flex-start; gap:0; margin-bottom:12px; }
        .ptc-stage { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; }
        .ptc-stage-row { display:flex; align-items:center; width:100%; }
        .ptc-stage-dot { width:16px; height:16px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; border:2px solid currentColor; transition:all .2s; }
        .ptc-stage-line { flex:1; height:2px; background:currentColor; }
        .ptc-stage-label { font-size:8.5px; font-weight:700; margin-top:4px; text-align:center; line-height:1.3; width:100%; }
        .ptc-actions { display:flex; gap:8px; }
        .ptc-btn-ghost { flex:1; padding:8px 10px; border-radius:9px; background:#FAFAFA; color:${F.inkSoft}; font-size:11px; font-weight:700; border:1px solid ${F.lineMid}; text-decoration:none; text-align:center; cursor:pointer; transition:background .15s; display:block; }
        .ptc-btn-ghost:hover { background:#F3F4F6; }
        .ptc-btn-primary { flex:2; padding:8px 12px; border-radius:9px; color:white; font-size:11px; font-weight:800; text-decoration:none; text-align:center; cursor:pointer; border:none; display:block; transition:filter .15s; }
        .ptc-btn-primary:hover { filter:brightness(1.08); }
        .ptc-missing { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 0; }
        .ptc-missing-text { font-size:12px; color:${F.muted}; font-weight:600; }
        .ptc-missing-btn { font-size:11px; font-weight:700; color:${F.pink}; background:${F.pinkSoft}; border:1px solid ${F.pinkBorder}; padding:5px 12px; border-radius:8px; text-decoration:none; white-space:nowrap; }

        /* ─── 5. Finance ─── */
        .fd-fin-row { display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; }
        .fd-fin-stat { flex:1; }
        .fd-fin-label { font-size:9px; font-weight:700; color:${F.muted}; text-transform:uppercase; letter-spacing:.04em; margin-bottom:3px; }
        .fd-fin-val { font-size:20px; font-weight:800; line-height:1; }
        .fd-fin-divider { width:1px; background:${F.line}; align-self:stretch; }
        .fd-fin-meta { font-size:10px; color:${F.muted}; font-weight:600; display:flex; flex-wrap:wrap; gap:4px 10px; }
        .fd-fin-empty-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
        .fd-fin-empty-btn { flex:1; min-width:120px; padding:10px; border-radius:10px; font-size:12px; font-weight:700; border:1.5px dashed ${F.lineMid}; background:white; color:${F.inkSoft}; text-decoration:none; text-align:center; cursor:pointer; transition:all .15s; display:block; }
        .fd-fin-empty-btn:hover { border-color:${F.pink}; color:${F.pink}; background:${F.pinkSoft}; }

        /* ─── FAB ─── */
        .fd-fab {
          position:fixed;
          bottom:calc(68px + env(safe-area-inset-bottom,0px) + 14px);
          right:20px; z-index:56;
          width:50px; height:50px; border-radius:50%;
          background:${F.pink}; color:white; border:none; cursor:pointer;
          box-shadow:0 4px 18px rgba(232,70,119,.45);
          display:flex; align-items:center; justify-content:center;
          transition:transform .15s, box-shadow .15s;
        }
        .fd-fab:hover { transform:scale(1.06); box-shadow:0 6px 22px rgba(232,70,119,.55); }
        .fd-fab:active { transform:scale(.94); }

        /* Action sheet */
        .fd-sheet-overlay { position:fixed; inset:0; z-index:60; background:rgba(31,26,28,.4); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; }
        .fd-sheet { background:white; border-radius:20px 20px 0 0; padding:18px 16px calc(env(safe-area-inset-bottom,0px)+20px); width:100%; max-width:480px; }
        @keyframes fd-sheet-up { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
        .fd-sheet { animation:fd-sheet-up .2s ease; }
        .fd-sheet-handle { width:36px; height:3px; border-radius:2px; background:#E5E7EB; margin:0 auto 14px; }
        .fd-sheet-title { font-size:13px; font-weight:700; color:${F.muted}; margin-bottom:12px; text-align:center; text-transform:uppercase; letter-spacing:.05em; }
        .fd-sheet-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .fd-sheet-action { display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 4px; border-radius:10px; border:1px solid ${F.line}; background:white; text-decoration:none; cursor:pointer; transition:all .15s; }
        .fd-sheet-action:hover { background:${F.pinkSoft}; border-color:${F.pinkBorder}; }
        .fd-sheet-action img { width:36px; height:36px; object-fit:contain; }
        .fd-sheet-action span { font-size:9px; font-weight:700; color:${F.ink}; text-align:center; line-height:1.3; }
        .fd-sheet-close { margin-top:12px; width:100%; padding:11px; border-radius:10px; border:none; background:#F3F4F6; color:${F.inkSoft}; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }

        /* ─── Bottom Nav ─── */
        .fd-nav { position:fixed; bottom:0; left:0; right:0; z-index:55; background:rgba(255,255,255,.92); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid rgba(232,70,119,.10); box-shadow:0 -4px 24px rgba(31,26,28,.07); padding-bottom:env(safe-area-inset-bottom,0px); }
        .fd-nav-inner { display:flex; align-items:stretch; height:68px; }
        .fd-nav-tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; text-decoration:none; color:${F.inkSoft}; border:none; background:none; font-family:inherit; cursor:pointer; }
        .fd-tab-icon { width:72px; height:40px; border-radius:14px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .fd-nav-tab:active .fd-tab-icon { background:rgba(232,70,119,.09); }
        .fd-tab-icon img { width:48px; height:48px; object-fit:contain; }
        .fd-nav-tab span { font-size:10px; font-weight:600; line-height:1.2; }

        /* ─── Misc ─── */
        .fd-empty-sm { font-size:11px; color:${F.muted}; font-weight:600; text-align:center; padding:8px 0; }
        .fd-link-pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:${F.pink}; background:${F.pinkSoft}; border:1px solid ${F.pinkBorder}; padding:5px 12px; border-radius:16px; text-decoration:none; transition:all .15s; }
        .fd-link-pill:hover { background:#fde7ef; }

        @media (max-width:600px) { .fd-body { padding:8px 8px 0; gap:8px; } }
        @media (prefers-reduced-motion:reduce) { .fd-hdr, .fd-sec, .fd-sheet { animation:none!important; transition:none!important; } }
      `}</style>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <div className="fd-crop-overlay">
          <div className="fd-crop-area">
            <Cropper
              image={cropSrc}
              crop={cropPos}
              zoom={cropZoom}
              aspect={cropType === "cover" ? 16 / 9 : 1}
              cropShape={cropType === "cover" ? "rect" : "round"}
              showGrid={false}
              onCropChange={setCropPos}
              onZoomChange={setCropZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="fd-crop-controls">
            <div className="fd-crop-zoom-row">
              <span className="fd-crop-zoom-label">ย่อ/ขยาย</span>
              <input type="range" className="fd-crop-zoom-input" min={1} max={3} step={0.01}
                value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} />
            </div>
            <div className="fd-crop-actions">
              <button className="fd-crop-cancel" type="button" onClick={cancelCrop}>ยกเลิก</button>
              <button className="fd-crop-confirm" type="button" onClick={confirmCrop} disabled={cropUploading}>
                {cropUploading ? "กำลังบันทึก..." : "ตกลง"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fd-page">

        {/* ════════════════════════════════
            1. Cover + Identity Header
        ════════════════════════════════ */}

        {/* Cover */}
        <div className="fd-cover">
          {farm.cover_url && (
            <img className="fd-cover-img" src={farm.cover_url} alt={farm.farm_name} />
          )}
          <div className="fd-cover-overlay" />
          <div className="fd-cover-top">
            <button className="fd-cover-btn" onClick={handleBack} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
          </div>
          <button className="fd-cover-cam" onClick={() => coverInputRef.current?.click()} aria-label="เปลี่ยนรูปปก">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          {uploadingCover && <div className="fd-cover-spin">กำลังอัพโหลด...</div>}
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "cover"); if (coverInputRef.current) coverInputRef.current.value = ""; }} />
        </div>

        {/* Identity */}
        <div className="fd-identity">
          <div className="fd-id-row">
            <div className="fd-avatar" onClick={() => avatarInputRef.current?.click()}>
              {farm.image_url
                ? <img src={farm.image_url} alt={farm.farm_name} />
                : <img src="/icons/icon-farm.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />}
              <div className="fd-avatar-edit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              {uploadingAvatar && <div className="fd-avatar-spin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "avatar"); if (avatarInputRef.current) avatarInputRef.current.value = ""; }} />
            </div>
            <div className="fd-id-main">
              <div className="fd-id-text">
                <h1 className="fd-name">
                  {farm.farm_name}
                  {farm.is_verified && <img src="/icons/icon-verified-badge.png" alt="ยืนยันแล้ว" />}
                </h1>
                <div className="fd-tagline">{speciesTh(farm.species) || 'ฟาร์มสัตว์เลี้ยง'}</div>
                {farmCompletion < 100 && (
                  <div className="fd-prog-bar">
                    <div className="fd-prog-track">
                      <div className="fd-prog-fill" style={{ width: `${farmCompletion}%` }} />
                    </div>
                    <span className="fd-prog-text">{farmCompletion}%</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
                <Link href={`/farm/${farmId}`} className="fd-view-btn">
                  <Icon.Eye /> ดูหน้าฟาร์ม
                </Link>
                <Link href={`/farm-dashboard/${farmId}/edit`} className="fd-edit-icon" aria-label="แก้ไขโปรไฟล์">
                  <img src="/icons/icon-setting.png" style={{ width: 36, height: 36 }} alt="ตั้งค่า" />
                </Link>
              </div>
            </div>
          </div>

          {!farm.is_verified && farm.verification_status !== 'pending' && (
            <Link href={`/farm-dashboard/${farmId}/verify`} className="fd-verify-btn">
              <img src="/icons/icon-non-verified.png" alt="" />
              <div className="fd-verify-btn-text">
                <div className="fd-verify-btn-title">ยืนยันตัวตนฟาร์ม</div>
                <div className="fd-verify-btn-sub">รับป้าย Verified เพื่อเพิ่มความน่าเชื่อถือ</div>
              </div>
              <Icon.ChevronRight />
            </Link>
          )}
          {farm.verification_status === 'pending' && (
            <div className="fd-pending-badge">
              <img src="/icons/icon-non-verified.png" alt="" style={{ width: 22, height: 22 }} />
              รอการตรวจสอบจากแอดมิน — เราจะแจ้งผลเร็วๆ นี้
            </div>
          )}
        </div>

        <div className="fd-body">

          {/* ════════════════════════════════
              2. Today — Action Center
          ════════════════════════════════ */}
          <section className="fd-sec">
            <div className="fd-sec-head">
              <div className="fd-sec-title">
                <img src="/icons/icon-calendar.png" alt="" />
                <h2 className="fd-sec-h">วันนี้</h2>
                {allTasks.length > 0 && (
                  <span className="fd-sec-badge" style={{ background: allTasks.some(t => t.urgency === 'overdue') ? F.redSoft : F.amberSoft, color: allTasks.some(t => t.urgency === 'overdue') ? F.red : F.amber }}>
                    {allTasks.length}
                  </span>
                )}
              </div>
              {allTasks.length > 0 && (
                <Link href={`/farm-dashboard/${farmId}/appointments`} className="fd-link-sm">
                  ดูนัดหมาย
                </Link>
              )}
            </div>

            {allTasks.length === 0 ? (
              <div className="fd-today-empty">
                <img src="/icons/icon-verified.png" alt="" />
                วันนี้ไม่มีงานเร่งด่วน ทุกอย่างเรียบร้อย
              </div>
            ) : (
              <>
                {visibleTasks.map(task => (
                  <div key={task.id} className={`fd-task-row fd-t-${task.urgency}`}>
                    <div className="fd-task-icon" style={{ background: task.urgency === 'overdue' ? F.redSoft : task.urgency === 'today' ? F.amberSoft : task.urgency === 'upcoming' ? '#EFF6FF' : '#F9FAFB' }}>
                      <img src={task.icon} alt="" />
                    </div>
                    <div className="fd-task-dot" />
                    <span className="fd-task-msg">{task.label}</span>
                    <Link href={task.href} className="fd-task-btn">{task.action}</Link>
                  </div>
                ))}
                {allTasks.length > TASK_LIMIT && (
                  <button className="fd-show-more" onClick={() => setShowAllTasks(v => !v)}>
                    {showAllTasks ? `ย่อ ▲` : `ดูทั้งหมด ${allTasks.length} รายการ ▼`}
                  </button>
                )}
              </>
            )}
          </section>

          {/* ════════════════════════════════
              3. Farm Overview
          ════════════════════════════════ */}
          <section className="fd-sec">
            <div className="fd-sec-head">
              <div className="fd-sec-title">
                <img src="/icons/icon-my-pets.png" alt="" />
                <h2 className="fd-sec-h">ภาพรวมฟาร์ม</h2>
              </div>
              <Link href={`/farm-dashboard/${farmId}/pets`} className="fd-link-sm">
                ดูทั้งหมด
              </Link>
            </div>

            {pets.length === 0 ? (
              <div className="fd-empty-sm">
                ยังไม่มีสัตว์ในฟาร์ม —{' '}
                <Link href={`/farm-dashboard/${farmId}/pets/create`} style={{ color: F.pink, fontWeight: 700 }}>เพิ่มสัตว์</Link>
              </div>
            ) : (
              <div className="fd-ov-grid">
                {[
                  { label: 'พ่อแม่พันธุ์', count: breeders, color: F.purple, bg: '#F3E8FF', icon: '/icons/icon-breeding.png', status: 'พ่อพันธุ์ / แม่พันธุ์' },
                  { label: 'กำลังตั้งท้อง', count: pregnant, color: F.pink, bg: F.pinkSoft, icon: '/icons/icon-feeding.png', status: null },
                  { label: 'ลูกสัตว์', count: babies, color: F.amber, bg: F.amberSoft, icon: '/icons/icon-my-pets.png', status: 'เด็ก' },
                  { label: 'รอส่งมอบ', count: readyToMove, color: F.green, bg: F.greenSoft, icon: '/icons/icon-partner.png', status: 'พร้อมย้ายบ้าน' },
                ].map(stat => (
                  <Link
                    key={stat.label}
                    href={stat.status ? `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent(stat.status)}` : `#active-litters`}
                    className="fd-ov-stat"
                    style={{ background: stat.bg }}
                  >
                    <img className="fd-ov-icon" src={stat.icon} alt="" />
                    <div className="fd-ov-count" style={{ color: stat.color }}>{stat.count}</div>
                    <div className="fd-ov-label">{stat.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ════════════════════════════════
              4. Active Litters (max 2)
          ════════════════════════════════ */}
          <section className="fd-sec" id="active-litters">
            <div className="fd-sec-head">
              <div className="fd-sec-title">
                <img src="/icons/icon-breeding.png" alt="" />
                <h2 className="fd-sec-h">ครอกที่กำลังดำเนินการ</h2>
                {activeLitters.length > 0 && <span className="fd-sec-badge" style={{ background: F.pinkSoft, color: F.pink }}>{activeLitters.length}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activeLitters.length > 2 && <Link href={`/farm-dashboard/${farmId}/litters`} className="fd-link-sm">ดูทั้งหมด</Link>}
                <Link href={`/farm-dashboard/${farmId}/litters/create`} className="fd-link-pill" style={{ fontSize: 10, padding: '3px 10px' }}>+ บันทึกการผสม</Link>
              </div>
            </div>

            {activeLitters.length === 0 ? (
              <div className="fd-empty-sm">ยังไม่มีครอกที่กำลังดำเนิน</div>
            ) : activeLitters.slice(0, 2).map(litter => {
              const species = litter.dam?.species || farm?.pet_type;
              const si = deriveLitterStatus(litter, species);
              const { status, daysPregnant, daysUntilWindowStart, daysOverdue, minDueDate, maxDueDate } = si;

              /* ── accent + badge colors ── */
              const accentColor = status === 'overdue' ? F.red
                : status === 'due_window' ? F.orange
                : status === 'near_due'   ? F.amber
                : status === 'pregnant'   ? F.pink
                : F.slate;
              const badgeBg = status === 'overdue' ? F.redSoft
                : status === 'due_window' ? F.orangeSoft
                : status === 'near_due'   ? F.amberSoft
                : status === 'pregnant'   ? F.pinkSoft
                : F.slateSoft;
              const badgeLabel = status === 'overdue' ? 'เลยกำหนด'
                : status === 'due_window' ? 'เฝ้าคลอด'
                : status === 'near_due'   ? 'ใกล้คลอด'
                : status === 'pregnant'   ? 'กำลังตั้งท้อง'
                : 'รอยืนยัน';

              /* ── summary text ── */
              const mainText = !litter.mating_date ? 'ยังไม่ระบุวันผสม'
                : `วันที่ ${daysPregnant} ของการตั้งท้อง`;
              const subText = status === 'waiting_confirmation' ? 'กรุณาระบุวันผสมเพื่อติดตาม'
                : status === 'pregnant'   ? `เหลืออีกประมาณ ${daysUntilWindowStart} วัน ถึงช่วงคาดคลอด`
                : status === 'near_due'   ? `อีก ${daysUntilWindowStart} วัน ถึงช่วงคาดคลอด`
                : status === 'due_window' ? 'อยู่ในช่วงเฝ้าคลอด'
                : daysOverdue > 0        ? `เลยช่วงคาดการณ์ ${daysOverdue} วัน — ควรตรวจสอบ`
                : 'เลยช่วงคาดการณ์';

              /* ── date range display ── */
              const datesText = litter.mating_date && minDueDate && maxDueDate
                ? `ผสม ${fmtDate(litter.mating_date, true)} · คาดคลอด ${fmtDate(minDueDate.toISOString(), true)}–${fmtDate(maxDueDate.toISOString(), true)}`
                : litter.mating_date
                ? `ผสม ${fmtDate(litter.mating_date, true)}`
                : null;

              /* ── stage timeline ── */
              const STAGES = ['ผสมแล้ว', 'ยืนยันตั้งท้อง', 'ใกล้คลอด', 'คลอดแล้ว'];
              const currentStage = status === 'waiting_confirmation' ? 0
                : status === 'pregnant' ? 1
                : 2; // near_due / due_window / overdue all at stage 2

              /* ── primary action ── */
              const primaryLabel = status === 'waiting_confirmation' ? 'บันทึกผลตรวจ'
                : (status === 'pregnant' || status === 'near_due') ? 'ดูการติดตาม'
                : 'บันทึกคลอด';
              const primaryHref = status === 'waiting_confirmation'
                ? `/farm-dashboard/${farmId}/litters/${litter.id}/edit`
                : (status === 'pregnant' || status === 'near_due')
                ? `/farm-dashboard/${farmId}/litters/${litter.id}`
                : `/farm-dashboard/${farmId}/litters/${litter.id}/birth`;

              return (
                <div key={litter.id} className="ptc">
                  <div className="ptc-accent" style={{ background: accentColor }} />
                  <div className="ptc-inner">

                    {/* Header */}
                    <div className="ptc-header">
                      <div className="ptc-code">ครอก {litter.litter_code || 'TBA'}</div>
                      <span className="ptc-badge" style={{ background: badgeBg, color: accentColor }}>{badgeLabel}</span>
                    </div>

                    {/* Parent pair */}
                    <div className="ptc-parents">
                      <div className="ptc-avatars">
                        <div className="ptc-av ptc-av-sire">
                          {litter.sire?.image_url ? <img src={litter.sire.image_url} alt="" /> : <Icon.Male />}
                        </div>
                        <div className="ptc-av ptc-av-dam">
                          {litter.dam?.image_url ? <img src={litter.dam.image_url} alt="" /> : <Icon.Female />}
                        </div>
                      </div>
                      <span className="ptc-pair-name">{litter.sire?.name || '?'} × {litter.dam?.name || '?'}</span>
                    </div>

                    <div className="ptc-divider" />

                    {/* Pregnancy summary */}
                    {status === 'waiting_confirmation' ? (
                      <div className="ptc-missing">
                        <span className="ptc-missing-text">ข้อมูลการผสมยังไม่ครบ</span>
                        <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}/edit`} className="ptc-missing-btn">แก้ไขข้อมูล</Link>
                      </div>
                    ) : (
                      <div className="ptc-summary">
                        <div className="ptc-main">{mainText}</div>
                        <div className="ptc-sub" style={{ color: status === 'overdue' ? F.red : status === 'due_window' ? F.orange : status === 'near_due' ? F.amber : F.muted }}>{subText}</div>
                        {datesText && <div className="ptc-dates">{datesText}</div>}
                      </div>
                    )}

                    {/* Stage timeline */}
                    <div className="ptc-timeline" style={{ marginBottom: 12 }}>
                      {STAGES.map((label, i) => {
                        const isDone    = i < currentStage;
                        const isCurrent = i === currentStage;
                        const dotColor  = isDone ? F.green : isCurrent ? accentColor : F.lineMid;
                        const lineColor = isDone ? F.green : F.lineMid;
                        const labelColor = isDone ? F.green : isCurrent ? accentColor : F.muted;
                        return (
                          <div key={label} className="ptc-stage">
                            <div className="ptc-stage-row">
                              <div className="ptc-stage-dot" style={{ borderColor: dotColor, background: isDone ? F.green : isCurrent ? accentColor : 'white', color: 'white' }}>
                                {isDone && <Icon.Check />}
                              </div>
                              {i < STAGES.length - 1 && <div className="ptc-stage-line" style={{ background: lineColor }} />}
                            </div>
                            <div className="ptc-stage-label" style={{ color: labelColor }}>{label}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="ptc-actions">
                      <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}`} className="ptc-btn-ghost">ดูรายละเอียด</Link>
                      <Link href={primaryHref} className="ptc-btn-primary" style={{ background: accentColor }}>{primaryLabel}</Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </section>

          {/* ════════════════════════════════
              5. Monthly Business Summary
          ════════════════════════════════ */}
          <section className="fd-sec">
            <div className="fd-sec-head">
              <div className="fd-sec-title">
                <img src="/icons/icon-wallet.png" alt="" />
                <h2 className="fd-sec-h">{monthLabel}</h2>
              </div>
              <Link href="/profile/finance" className="fd-link-sm">ดูการเงิน</Link>
            </div>

            {!hasFinance ? (
              <>
                <div className="fd-empty-sm" style={{ marginBottom: 8 }}>ยังไม่มีรายรับรายจ่าย — เริ่มบันทึกเพื่อติดตามผลกำไร</div>
                <div className="fd-fin-empty-row">
                  <Link href={`/farm-dashboard/${farmId}/transactions/create?type=income`} className="fd-fin-empty-btn">+ รายรับ</Link>
                  <Link href={`/farm-dashboard/${farmId}/transactions/create?type=expense`} className="fd-fin-empty-btn">+ รายจ่าย</Link>
                </div>
              </>
            ) : (
              <>
                <div className="fd-fin-row">
                  <div className="fd-fin-stat">
                    <div className="fd-fin-label">รายรับ</div>
                    <div className="fd-fin-val" style={{ color: F.green }}>{fmtMoney(tmI)}</div>
                  </div>
                  <div className="fd-fin-divider" />
                  <div className="fd-fin-stat">
                    <div className="fd-fin-label">รายจ่าย</div>
                    <div className="fd-fin-val" style={{ color: F.red }}>{fmtMoney(tmE)}</div>
                  </div>
                  <div className="fd-fin-divider" />
                  <div className="fd-fin-stat">
                    <div className="fd-fin-label">กำไรสุทธิ</div>
                    <div className="fd-fin-val" style={{ color: tmNet > 0 ? F.green : tmNet < 0 ? F.red : F.muted }}>
                      {tmNet > 0 ? '+' : tmNet < 0 ? '-' : ''}{fmtMoney(tmNet)}
                    </div>
                  </div>
                </div>
                <div className="fd-fin-meta">
                  {pmNet !== 0 && (
                    <span style={{ color: tmNet >= pmNet ? F.green : F.red }}>
                      {tmNet >= pmNet ? '▲' : '▼'} vs เดือนก่อน ({pmNet > 0 ? '+' : pmNet < 0 ? '-' : ''}{fmtMoney(pmNet)})
                    </span>
                  )}
                  {closedWithTx > 0 && <span>ครอกปิดบัญชีแล้ว {closedWithTx} ครอก</span>}
                  {thisMonthTx.length > 0 && <span>{thisMonthTx.length} รายการเดือนนี้</span>}
                </div>
              </>
            )}
          </section>

        </div>{/* end fd-body */}
      </div>{/* end fd-page */}

      {/* ════════════════════════════════
          FAB — Floating Action Button
      ════════════════════════════════ */}
      <button className="fd-fab" onClick={() => setShowActionSheet(true)} aria-label="เพิ่มรายการ">
        <Icon.Plus />
      </button>

      {showActionSheet && (
        <div className="fd-sheet-overlay" onClick={() => setShowActionSheet(false)}>
          <div className="fd-sheet" onClick={e => e.stopPropagation()}>
            <div className="fd-sheet-handle" />
            <div className="fd-sheet-title">เลือกรายการที่ต้องการ</div>
            <div className="fd-sheet-actions">
              {fabActions.map(a => (
                <Link key={a.label} href={a.href} className="fd-sheet-action" onClick={() => setShowActionSheet(false)}>
                  <img src={a.icon} alt="" />
                  <span>{a.label}</span>
                </Link>
              ))}
            </div>
            <button className="fd-sheet-close" onClick={() => setShowActionSheet(false)}>ปิด</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          Bottom Navigation (Page tabs)
      ════════════════════════════════ */}
      <nav className="fd-nav" aria-label="เมนูฟาร์ม">
        <div className="fd-nav-inner">
          <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} className="fd-nav-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-tab-add.png" alt="" /></div>
            <span>เพิ่มสัตว์</span>
          </Link>
          <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="fd-nav-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-my-pets.png" alt="" /></div>
            <span>จับคู่บรีด</span>
          </Link>
          <Link href={`/farm-dashboard/${farmId}/litters?from=${fromPage}`} className="fd-nav-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-feeding.png" alt="" /></div>
            <span>ลูกแมว</span>
          </Link>
          <Link href="/profile/finance" className="fd-nav-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-wallet.png" alt="" /></div>
            <span>รายรับรายจ่าย</span>
          </Link>
          <Link href={`/farm-dashboard/${farmId}/appointments?from=${fromPage}`} className="fd-nav-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-calendar.png" alt="" /></div>
            <span>ปฏิทิน</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

export default function FarmDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FarmDashboardContent />
    </Suspense>
  );
}
