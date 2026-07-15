"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';

/* ── Design tokens ─────────────────────────────────────────── */
const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8', pinkDeep: '#c4325f',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  amber: '#D97706', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  red: '#EF4444', redSoft: '#FEF2F2', redBorder: '#FECACA',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  purple: '#7C3AED', purpleSoft: '#F3E8FF',
  line: '#f3dde3', lineMid: '#E5E7EB', paper: '#fdf0f3', bg: '#fffafc',
};

/* ── SVG Icons ──────────────────────────────────────────────── */
const Icon = {
  ArrowLeft:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ChevronDown:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Plus:         () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:         () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Eye:          () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Male:         () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female:       () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Heart:        () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Check:        () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertCircle:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

/* ── Types ──────────────────────────────────────────────────── */
interface Task {
  id: string;
  urgency: 'overdue' | 'today' | 'upcoming';
  label: string;
  action: string;
  href: string;
  icon: string;
}

interface ScheduleEvent {
  id: string;
  date: string;
  title: string;
  type: 'birth' | 'vaccine' | 'appointment';
  href: string;
  icon: string;
  color: string;
}

interface WatchlistItem {
  pet: any;
  reasons: string[];
  urgency: 'high' | 'medium' | 'low';
}

interface QualityIssue {
  id: string;
  label: string;
  count: number;
  href?: string;
  action: string;
}

/* ── Helpers ────────────────────────────────────────────────── */
const fmtDate = (d?: string | null, short = false) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('th-TH', short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtMoney = (n: number) => `฿${Math.abs(n).toLocaleString()}`;
const daysDiff = (dateStr: string) => {
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - t.getTime()) / 86400000);
};

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
function FarmDashboardContent() {
  const router      = useRouter();
  const params      = useParams();
  const searchParams = useSearchParams();
  const farmId  = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  /* ── Data state ── */
  const [farm,         setFarm]         = useState<any>(null);
  const [pets,         setPets]         = useState<any[]>([]);
  const [litters,      setLitters]      = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vaccines,     setVaccines]     = useState<any[]>([]);
  const [activities,   setActivities]   = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  /* ── UI state ── */
  const [showAddModal,       setShowAddModal]       = useState(false);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [taskFilter,         setTaskFilter]         = useState<'all'|'overdue'|'today'|'upcoming'>('all');

  /* ── Data fetch ──────────────────────────────────────────── */
  useEffect(() => {
    if (!farmId) return;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }

        const { data: farmData, error: farmErr } = await supabase
          .from('farms').select('*').eq('id', farmId).eq('user_id', session.user.id).single();
        if (farmErr || !farmData) { router.push('/partner'); return; }
        setFarm(farmData);

        const [petsRes, littersRes, txRes] = await Promise.all([
          supabase.from('pets').select('*').eq('farm_id', farmId),
          supabase.from('litters')
            .select('*, sire:pets!sire_id(id,name,image_url), dam:pets!dam_id(id,name,image_url)')
            .eq('farm_id', farmId).order('mating_date', { ascending: false }),
          supabase.from('farm_transactions').select('*').eq('farm_id', farmId)
            .order('transaction_date', { ascending: false }),
        ]);

        const loadedPets     = petsRes.data    || [];
        const loadedLitters  = littersRes.data || [];
        const loadedTx       = txRes.data      || [];
        setPets(loadedPets);
        setLitters(loadedLitters);
        setTransactions(loadedTx);

        const petIds = loadedPets.map((p: any) => p.id);
        if (petIds.length > 0) {
          const [vacRes, actRes] = await Promise.all([
            supabase.from('vaccines').select('id,pet_id,vaccine_name,next_due').in('pet_id', petIds).order('next_due'),
            supabase.from('pet_activities').select('id,pet_id,activity_date,activity_type,title').in('pet_id', petIds)
              .order('activity_date', { ascending: false }).limit(20),
          ]);
          setVaccines(vacRes.data || []);
          setActivities(actRes.data || []);
        }

        const apptRes = await supabase.from('appointments')
          .select('id,title,appt_date,appt_type,pet_id,is_done')
          .eq('farm_id', farmId).eq('is_done', false).order('appt_date');
        setAppointments(apptRes.data || []);

      } catch (e: any) {
        setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, router]);

  /* ── Derived data ────────────────────────────────────────── */
  const petMap = Object.fromEntries(pets.map(p => [p.id, p]));

  const activeLitters = litters.filter(l => l.status === 'รอคลอด');
  const bornLitters   = litters.filter(l => l.status !== 'รอคลอด');

  const today = new Date(); today.setHours(0,0,0,0);
  const sevenDaysLater = new Date(today); sevenDaysLater.setDate(today.getDate() + 7);

  /* ── Action Center tasks ── */
  const allTasks: Task[] = [];

  activeLitters.forEach(l => {
    if (!l.expected_birth_date) return;
    const diff = daysDiff(l.expected_birth_date);
    const code = l.litter_code || 'TBA';
    if (diff < 0) {
      allTasks.push({ id: `lb-${l.id}`, urgency: 'overdue', label: `ครอก ${code} เลยกำหนดคลอด ${Math.abs(diff)} วัน`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth?from=${fromPage}`, icon: '/icons/icon-breeding.png' });
    } else if (diff === 0) {
      allTasks.push({ id: `lb-${l.id}`, urgency: 'today', label: `ครอก ${code} คาดคลอดวันนี้`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth?from=${fromPage}`, icon: '/icons/icon-breeding.png' });
    } else if (diff <= 7) {
      allTasks.push({ id: `lb-${l.id}`, urgency: 'upcoming', label: `ครอก ${code} คาดคลอดใน ${diff} วัน`, action: 'ดูรายละเอียด', href: `/farm-dashboard/${farmId}/litters/${l.id}?from=${fromPage}`, icon: '/icons/icon-breeding.png' });
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

  bornLitters.forEach(l => {
    const kittensCount = pets.filter(p => p.litter_id === l.id).length;
    if (kittensCount === 0 && (!l.puppy_count || l.puppy_count === 0)) {
      allTasks.push({ id: `nk-${l.id}`, urgency: 'today', label: `ครอก ${l.litter_code || 'TBA'} คลอดแล้วแต่ยังไม่บันทึกลูกสัตว์`, action: 'บันทึก', href: `/farm-dashboard/${farmId}/litters/${l.id}?from=${fromPage}`, icon: '/icons/icon-feeding.png' });
    }
  });

  appointments.forEach(a => {
    if (!a.appt_date) return;
    const diff = daysDiff(a.appt_date);
    if (diff < 0) {
      allTasks.push({ id: `ap-${a.id}`, urgency: 'overdue', label: `นัดหมาย: ${a.title} เลยกำหนด ${Math.abs(diff)} วัน`, action: 'จัดการ', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    } else if (diff === 0) {
      allTasks.push({ id: `ap-${a.id}`, urgency: 'today', label: `นัดหมาย: ${a.title} — วันนี้`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    } else if (diff <= 7) {
      allTasks.push({ id: `ap-${a.id}`, urgency: 'upcoming', label: `นัดหมาย: ${a.title} — อีก ${diff} วัน`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    }
  });

  const unlinkedTxCount = transactions.filter(t => !t.litter_id).length;
  if (unlinkedTxCount >= 3) {
    allTasks.push({ id: 'unlinked-tx', urgency: 'upcoming', label: `มีรายการเงิน ${unlinkedTxCount} รายการที่ยังไม่ผูกกับครอก`, action: 'จัดหมวด', href: '/profile/finance', icon: '/icons/icon-wallet.png' });
  }

  const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 } as const;
  allTasks.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  const filteredTasks = taskFilter === 'all' ? allTasks : allTasks.filter(t => t.urgency === taskFilter);
  const taskCounts = {
    overdue:  allTasks.filter(t => t.urgency === 'overdue').length,
    today:    allTasks.filter(t => t.urgency === 'today').length,
    upcoming: allTasks.filter(t => t.urgency === 'upcoming').length,
  };

  /* ── 7-day schedule ── */
  const scheduleEvents: ScheduleEvent[] = [];
  activeLitters.forEach(l => {
    if (!l.expected_birth_date) return;
    const d = new Date(l.expected_birth_date); d.setHours(0,0,0,0);
    if (d >= today && d <= sevenDaysLater) {
      scheduleEvents.push({ id: `sch-l-${l.id}`, date: l.expected_birth_date, title: `คาดคลอด: ครอก ${l.litter_code || 'TBA'}`, type: 'birth', href: `/farm-dashboard/${farmId}/litters/${l.id}?from=${fromPage}`, icon: '/icons/icon-breeding.png', color: F.pink });
    }
  });
  vaccines.forEach(v => {
    if (!v.next_due) return;
    const d = new Date(v.next_due); d.setHours(0,0,0,0);
    if (d >= today && d <= sevenDaysLater) {
      scheduleEvents.push({ id: `sch-v-${v.id}`, date: v.next_due, title: `วัคซีน ${v.vaccine_name} — ${petMap[v.pet_id]?.name || ''}`, type: 'vaccine', href: `/pets/${v.pet_id}/vaccines`, icon: '/icons/icon-health.png', color: F.teal });
    }
  });
  appointments.forEach(a => {
    if (!a.appt_date) return;
    const d = new Date(a.appt_date); d.setHours(0,0,0,0);
    if (d >= today && d <= sevenDaysLater) {
      scheduleEvents.push({ id: `sch-a-${a.id}`, date: a.appt_date, title: a.title, type: 'appointment', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png', color: F.blue });
    }
  });
  scheduleEvents.sort((a, b) => a.date.localeCompare(b.date));

  /* ── Watchlist pets ── */
  const watchlist: WatchlistItem[] = [];
  pets.forEach(pet => {
    const reasons: string[] = [];
    let urgency: 'high'|'medium'|'low' = 'low';
    const overdueVax = vaccines.filter(v => v.pet_id === pet.id && v.next_due && daysDiff(v.next_due) < 0);
    if (overdueVax.length > 0) { reasons.push(`วัคซีนเลยกำหนด ${overdueVax.length} รายการ`); urgency = 'high'; }
    if (!pet.birth_date) { reasons.push('ไม่มีวันเกิด'); if (urgency === 'low') urgency = 'medium'; }
    if (!pet.image_url) reasons.push('ไม่มีรูปภาพ');
    if (!pet.pet_code)  reasons.push('ไม่มีรหัสสัตว์');
    if (reasons.length > 0) watchlist.push({ pet, reasons, urgency });
  });
  const urgWOrder = { high: 0, medium: 1, low: 2 } as const;
  watchlist.sort((a,b) => urgWOrder[a.urgency] - urgWOrder[b.urgency]);
  const topWatchlist = watchlist.slice(0, 5);

  /* ── Finance ── */
  const thisMonth = today.getMonth(), thisYear = today.getFullYear();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear  = thisMonth === 0 ? thisYear - 1 : thisYear;
  const inMonth = (d: string, m: number, y: number) => { const dt = new Date(d); return dt.getMonth() === m && dt.getFullYear() === y; };
  const sumIncome  = (txs: any[]) => txs.filter(t => t.transaction_type === 'income').reduce((s,t) => s + Number(t.amount), 0);
  const sumExpense = (txs: any[]) => txs.filter(t => t.transaction_type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
  const thisMonthTx = transactions.filter(t => t.transaction_date && inMonth(t.transaction_date, thisMonth, thisYear));
  const prevMonthTx = transactions.filter(t => t.transaction_date && inMonth(t.transaction_date, prevMonth, prevYear));
  const tmIncome  = sumIncome(thisMonthTx),  tmExpense  = sumExpense(thisMonthTx),  tmNet = tmIncome - tmExpense;
  const pmIncome  = sumIncome(prevMonthTx),  pmExpense  = sumExpense(prevMonthTx),  pmNet = pmIncome - pmExpense;
  const hasFinance = transactions.length > 0;
  const monthLabel = today.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const expByCat = thisMonthTx.filter(t => t.transaction_type === 'expense').reduce((acc: Record<string,number>, t) => { const c = t.category || 'อื่นๆ'; acc[c] = (acc[c]||0)+Number(t.amount); return acc; }, {});
  const topCat = Object.entries(expByCat).sort(([,a],[,b]) => (b as number)-(a as number))[0];

  /* ── Data quality ── */
  const qualityIssues: QualityIssue[] = [];
  const noBirth = pets.filter(p => !p.birth_date).length;
  if (noBirth > 0) qualityIssues.push({ id: 'no-birth', label: `สัตว์ ${noBirth} ตัวไม่มีวันเกิด`, count: noBirth, href: `/farm-dashboard/${farmId}/pets?from=${fromPage}`, action: 'แก้ไข' });
  const noImage = pets.filter(p => !p.image_url).length;
  if (noImage > 0) qualityIssues.push({ id: 'no-img', label: `สัตว์ ${noImage} ตัวไม่มีรูปภาพ`, count: noImage, href: `/farm-dashboard/${farmId}/pets?from=${fromPage}`, action: 'เพิ่มรูป' });
  const littersNoKittens = bornLitters.filter(l => pets.filter(p => p.litter_id === l.id).length === 0 && (!l.puppy_count || l.puppy_count === 0)).length;
  if (littersNoKittens > 0) qualityIssues.push({ id: 'no-kit', label: `ครอก ${littersNoKittens} ครอกยังไม่บันทึกลูกสัตว์`, count: littersNoKittens, action: 'บันทึก' });
  const littersNoTx = bornLitters.filter(l => transactions.filter(t => t.litter_id === l.id).length === 0).length;
  if (littersNoTx > 0) qualityIssues.push({ id: 'no-tx', label: `ครอก ${littersNoTx} ครอกไม่มีรายรับรายจ่าย`, count: littersNoTx, action: 'บันทึก' });

  /* ── Activity feed ── */
  const activityFeed = [
    ...transactions.slice(0, 10).map(t => ({
      id: `tx-${t.id}`, date: t.transaction_date || t.created_at,
      title: `${t.transaction_type === 'income' ? 'รายรับ' : 'รายจ่าย'}: ${t.category || t.description || 'รายการ'}`,
      amount: t.transaction_type === 'income' ? Number(t.amount) : -Number(t.amount),
      icon: '/icons/icon-wallet.png', dotBg: t.transaction_type === 'income' ? F.greenSoft : F.redSoft,
      href: '/profile/finance',
    })),
    ...litters.slice(0, 5).map(l => ({
      id: `lit-${l.id}`, date: l.actual_birth_date || l.mating_date || l.created_at,
      title: l.status === 'คลอดแล้ว' ? `คลอดแล้ว: ครอก ${l.litter_code||'TBA'}` : `ผสมพันธุ์: ครอก ${l.litter_code||'TBA'}`,
      amount: null as null, icon: '/icons/icon-breeding.png', dotBg: F.pinkSoft,
      href: `/farm-dashboard/${farmId}/litters/${l.id}?from=${fromPage}`,
    })),
    ...activities.slice(0, 5).map(a => ({
      id: `act-${a.id}`, date: a.activity_date,
      title: a.title, amount: null as null, icon: '/icons/icon-health.png', dotBg: F.tealSoft,
      href: `/pets/${a.pet_id}`,
    })),
  ].filter(a => a.date).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,5);

  /* ── Profile completion ── */
  const completionItems = [
    { key: 'image', label: 'รูปโปรไฟล์ฟาร์ม', done: !!farm?.image_url, points: 15, href: `/farm-dashboard/${farmId}/edit` },
    { key: 'bio',   label: 'คำอธิบายฟาร์ม',   done: !!farm?.bio,       points: 15, href: `/farm-dashboard/${farmId}/edit` },
    { key: 'phone', label: 'เบอร์โทรศัพท์',   done: !!farm?.phone,     points: 10, href: `/farm-dashboard/${farmId}/edit` },
    { key: 'fb',    label: 'Facebook',          done: !!farm?.facebook_link, points: 10, href: `/farm-dashboard/${farmId}/edit` },
    { key: 'species', label: 'ประเภทสัตว์',   done: !!farm?.species,   points: 10, href: `/farm-dashboard/${farmId}/edit` },
    { key: 'verified', label: 'ยืนยันตัวตน', done: !!farm?.is_verified, points: 20, href: undefined as string|undefined },
  ];
  const farmCompletion = Math.min(100, 20 + completionItems.reduce((s,i) => s+(i.done?i.points:0), 0));

  const handleBack = () => fromPage === 'partner' ? router.push('/partner') : router.push('/profile');

  /* ── Status KPI ── */
  const kpiCards = [
    { label: 'สัตว์ทั้งหมด', count: pets.length, icon: '/icons/icon-my-pets.png', color: F.pink, bg: F.pinkSoft, status: '' },
    { label: 'พ่อแม่พันธุ์', count: pets.filter(p => p.status === 'พ่อพันธุ์ / แม่พันธุ์').length, icon: '/icons/icon-breeding.png', color: F.purple, bg: F.purpleSoft, status: 'พ่อพันธุ์ / แม่พันธุ์' },
    { label: 'ลูกสัตว์', count: pets.filter(p => p.status === 'เด็ก').length, icon: '/icons/icon-feeding.png', color: F.amber, bg: F.amberSoft, status: 'เด็ก' },
    { label: 'พร้อมย้ายบ้าน', count: pets.filter(p => p.status === 'พร้อมย้ายบ้าน').length, icon: '/icons/icon-partner.png', color: F.green, bg: F.greenSoft, status: 'พร้อมย้ายบ้าน' },
    { label: 'ติดจอง', count: pets.filter(p => p.status === 'ติดจอง').length, icon: '/icons/icon-calendar.png', color: F.blue, bg: F.blueSoft, status: 'ติดจอง' },
    { label: 'ครอกเปิดอยู่', count: activeLitters.length, icon: '/icons/icon-farm.png', color: F.red, bg: F.redSoft, status: '__litters__' },
  ];

  /* ── Active litters (max 3) ── */
  const displayLitters = activeLitters.slice(0, 3);
  const calcPregnancyPct = (mating: string, expected: string) => {
    const s = new Date(mating).getTime(), e = new Date(expected).getTime(), n = Date.now();
    if (n >= e) return 100; if (n <= s) return 0;
    return Math.round(((n-s)/(e-s))*100);
  };

  if (loading) return <PageLoader />;
  if (!farm)   return null;

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        @keyframes fd-rise { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing:border-box; }

        .fd-page { font-family:inherit; min-height:100vh; color:${F.ink}; padding:0 0 96px; background:${F.bg}; }

        /* ── Layout ── */
        .fd-shell  { max-width:1120px; margin:0 auto; padding:0 0 4px; }
        .fd-layout { display:flex; flex-direction:column; gap:10px; padding:10px 12px; }
        @media (min-width:900px) {
          .fd-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; padding:14px 16px; align-items:start; }
          .fd-col-a, .fd-col-b { display:flex; flex-direction:column; gap:14px; }
        }

        /* ── Compact header ── */
        .fd-header {
          grid-column:1/-1;
          background:linear-gradient(135deg,${F.pink} 0%,#f06d98 60%,#f8a5c2 100%);
          padding:14px 16px 16px; color:white; animation:fd-rise .4s ease;
          position:relative; overflow:hidden;
        }
        .fd-header::before {
          content:""; position:absolute; width:220px; height:220px; border-radius:50%;
          background:radial-gradient(circle,rgba(255,255,255,.18),transparent 68%);
          top:-80px; right:-60px; pointer-events:none;
        }
        .fd-header-row1 { display:flex; align-items:center; gap:10px; position:relative; z-index:1; }
        .fd-back-btn {
          width:30px; height:30px; border-radius:50%; border:none; cursor:pointer; flex-shrink:0;
          background:rgba(255,255,255,.2); color:white; display:flex; align-items:center; justify-content:center;
          backdrop-filter:blur(8px); transition:background .15s;
        }
        .fd-back-btn:hover { background:rgba(255,255,255,.32); }
        .fd-avatar-sm {
          width:52px; height:52px; border-radius:50%; overflow:hidden; flex-shrink:0;
          border:2.5px solid rgba(255,255,255,.85); background:white;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 14px rgba(140,36,78,.18);
        }
        .fd-avatar-sm img { width:100%; height:100%; object-fit:cover; }
        .fd-header-info { flex:1; min-width:0; }
        .fd-header-name-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .fd-header-name { font-size:clamp(15px,3.5vw,20px); font-weight:700; color:white; line-height:1.2; }
        .fd-verified-icon { width:18px; height:18px; object-fit:contain; flex-shrink:0; }
        .fd-header-species { font-size:11px; color:rgba(255,255,255,.78); font-weight:600; margin-top:2px; display:block; }
        .fd-header-btns { display:flex; gap:6px; flex-shrink:0; }
        .fd-hbtn {
          display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:9px;
          font-size:12px; font-weight:700; cursor:pointer; border:none; text-decoration:none; transition:all .15s;
        }
        .fd-hbtn-primary { background:white; color:${F.pink}; box-shadow:0 4px 12px rgba(31,26,28,.1); }
        .fd-hbtn-ghost   { background:rgba(255,255,255,.15); color:white; border:1px solid rgba(255,255,255,.3); }
        .fd-hbtn-primary:hover { box-shadow:0 6px 18px rgba(31,26,28,.15); }
        .fd-hbtn-ghost:hover   { background:rgba(255,255,255,.25); }

        /* Progress bar in header */
        .fd-prog-btn {
          position:relative; z-index:1; margin-top:12px; width:100%; display:flex; align-items:center; gap:10px;
          background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.2); border-radius:10px;
          padding:8px 12px; cursor:pointer; transition:background .15s;
        }
        .fd-prog-btn:hover { background:rgba(255,255,255,.22); }
        .fd-prog-label { font-size:11px; font-weight:700; color:rgba(255,255,255,.9); white-space:nowrap; }
        .fd-prog-track { flex:1; height:5px; background:rgba(255,255,255,.22); border-radius:10px; overflow:hidden; }
        .fd-prog-fill  { height:100%; border-radius:10px; background:white; transition:width 1s ease; }
        .fd-prog-pct   { font-size:13px; font-weight:800; color:white; white-space:nowrap; }
        .fd-prog-toggle { color:rgba(255,255,255,.8); display:flex; align-items:center; transition:transform .2s; }
        .fd-prog-toggle.open { transform:rotate(180deg); }

        .fd-prog-detail {
          position:relative; z-index:1; margin-top:6px;
          background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.15); border-radius:10px;
          padding:10px 12px; display:flex; flex-direction:column; gap:6px;
        }
        .fd-prog-item { display:flex; align-items:center; gap:8px; }
        .fd-prog-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .fd-prog-dot.done { background:#86EFAC; }
        .fd-prog-dot.miss { background:rgba(255,255,255,.4); }
        .fd-prog-item-label { flex:1; font-size:11px; font-weight:600; color:rgba(255,255,255,.85); }
        .fd-prog-item-label.done { color:#86EFAC; }
        .fd-prog-fix { font-size:10px; font-weight:700; color:white; background:rgba(255,255,255,.2); border-radius:6px; padding:2px 8px; text-decoration:none; border:1px solid rgba(255,255,255,.3); }
        .fd-prog-ok  { font-size:10px; color:#86EFAC; font-weight:700; }

        /* ── Card base ── */
        .fd-card {
          background:rgba(255,255,255,.95); border:1px solid #f8edf1; border-radius:16px;
          padding:16px; box-shadow:0 2px 10px rgba(31,26,28,.03);
          animation:fd-rise .45s ease both;
        }
        .fd-card-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
        .fd-card-title { display:flex; align-items:center; gap:8px; }
        .fd-card-title-icon img { width:24px; height:24px; object-fit:contain; }
        .fd-card-h2 { margin:0; font-size:15px; font-weight:700; color:${F.ink}; }
        .fd-card-link { color:${F.pink}; font-size:11px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:3px; }
        .fd-card-link:hover { text-decoration:underline; }
        .fd-badge { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; border-radius:9px; font-size:10px; font-weight:800; padding:0 5px; }

        /* ── Empty / Error states ── */
        .fd-empty { padding:20px; text-align:center; color:${F.muted}; font-size:12px; font-weight:600; border:1px dashed ${F.lineMid}; border-radius:12px; }
        .fd-empty-green { background:${F.greenSoft}; border:1px solid ${F.greenBorder}; border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:${F.green}; }
        .fd-error { background:${F.redSoft}; border:1px solid ${F.redBorder}; border-radius:10px; padding:10px 14px; font-size:12px; color:${F.red}; font-weight:600; }

        /* ── Action center ── */
        .fd-task-filters { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
        .fd-task-filter {
          padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700;
          border:1px solid ${F.lineMid}; background:white; color:${F.inkSoft}; cursor:pointer; transition:all .15s;
        }
        .fd-task-filter.active { background:${F.pink}; color:white; border-color:${F.pink}; }
        .fd-task-row {
          display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:10px; margin-bottom:6px;
        }
        .fd-task-row:last-child { margin-bottom:0; }
        .fd-task-overdue  { background:${F.redSoft};   border:1px solid ${F.redBorder}; }
        .fd-task-today    { background:${F.amberSoft}; border:1px solid ${F.amberBorder}; }
        .fd-task-upcoming { background:${F.blueSoft};  border:1px solid ${F.blueBorder}; }
        .fd-task-icon { width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-task-icon img { width:16px; height:16px; object-fit:contain; }
        .fd-task-overdue  .fd-task-icon { background:${F.redSoft}; }
        .fd-task-today    .fd-task-icon { background:${F.amberSoft}; }
        .fd-task-upcoming .fd-task-icon { background:${F.blueSoft}; }
        .fd-task-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .fd-task-overdue  .fd-task-dot { background:${F.red}; }
        .fd-task-today    .fd-task-dot { background:${F.amber}; }
        .fd-task-upcoming .fd-task-dot { background:${F.blue}; }
        .fd-task-msg { flex:1; font-size:12px; font-weight:600; color:${F.ink}; line-height:1.4; min-width:0; }
        .fd-task-btn { font-size:10px; font-weight:700; padding:4px 10px; border-radius:7px; text-decoration:none; white-space:nowrap; flex-shrink:0; border:none; cursor:pointer; }
        .fd-task-overdue  .fd-task-btn { background:${F.red};   color:white; }
        .fd-task-today    .fd-task-btn { background:${F.amber}; color:white; }
        .fd-task-upcoming .fd-task-btn { background:${F.blue};  color:white; }

        /* ── Status KPI cards ── */
        .fd-kpi-scroll { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        @media (max-width:600px) { .fd-kpi-scroll { grid-template-columns:repeat(2,1fr); } }
        .fd-kpi {
          border-radius:12px; padding:12px 10px; cursor:pointer; text-decoration:none;
          display:flex; flex-direction:column; gap:4px; transition:all .15s; border:1.5px solid transparent;
        }
        .fd-kpi:hover { transform:translateY(-2px); box-shadow:0 4px 14px rgba(0,0,0,.07); }
        .fd-kpi-top { display:flex; align-items:center; justify-content:space-between; }
        .fd-kpi-icon { width:26px; height:26px; object-fit:contain; }
        .fd-kpi-count { font-size:24px; font-weight:800; line-height:1; }
        .fd-kpi-label { font-size:10px; font-weight:700; color:${F.inkSoft}; line-height:1.3; }

        /* ── Active litters ── */
        .fd-litter-card {
          background:white; border:1px solid ${F.line}; border-radius:14px; padding:14px;
          transition:border-color .15s;
        }
        .fd-litter-card:hover { border-color:${F.pinkBorder}; }
        .fd-litter-row1 { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .fd-litter-code { font-size:18px; font-weight:700; color:${F.ink}; }
        .fd-litter-code-sub { font-size:9px; color:${F.muted}; font-weight:700; text-transform:uppercase; }
        .fd-parents { display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:10px; background:#FAFAFA; border:1px solid ${F.lineMid}; }
        .fd-parent-img { width:30px; height:30px; border-radius:50%; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; }
        .fd-parent-img img { width:100%; height:100%; object-fit:cover; }
        .fd-parent-sire { background:#DBEAFE; color:${F.blue}; }
        .fd-parent-dam  { background:#FCE7F3; color:#DB2777; }
        .fd-days-chip { margin-left:auto; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:800; }
        .fd-prog-bar-wrap { height:6px; background:${F.line}; border-radius:10px; overflow:hidden; margin-bottom:10px; }
        .fd-prog-bar-fill { height:100%; border-radius:10px; transition:width .8s ease; }
        .fd-litter-actions { display:flex; gap:7px; flex-wrap:wrap; }
        .fd-btn-ghost { padding:7px 14px; border-radius:9px; background:#FAFAFA; color:${F.inkSoft}; font-size:11px; font-weight:700; border:1px solid ${F.lineMid}; text-decoration:none; cursor:pointer; transition:all .15s; }
        .fd-btn-ghost:hover { background:${F.line}; }
        .fd-btn-birth { padding:7px 16px; border-radius:9px; color:white; font-size:11px; font-weight:700; text-decoration:none; cursor:pointer; transition:all .15s; border:none; }

        /* ── 7-day schedule ── */
        .fd-sched-day { font-size:10px; font-weight:700; color:${F.muted}; text-transform:uppercase; letter-spacing:.05em; margin:10px 0 6px; }
        .fd-sched-event {
          display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:10px;
          background:white; border:1px solid ${F.lineMid}; margin-bottom:6px; text-decoration:none; transition:border-color .15s;
        }
        .fd-sched-event:hover { border-color:${F.pinkBorder}; }
        .fd-sched-dot { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-sched-dot img { width:16px; height:16px; object-fit:contain; }
        .fd-sched-title { flex:1; font-size:12px; font-weight:700; color:${F.ink}; min-width:0; }
        .fd-sched-date  { font-size:10px; color:${F.muted}; white-space:nowrap; }

        /* ── Watchlist pets ── */
        .fd-watchlist-item { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid ${F.line}; text-decoration:none; }
        .fd-watchlist-item:last-child { border-bottom:none; padding-bottom:0; }
        .fd-watchlist-avatar { width:40px; height:40px; border-radius:50%; overflow:hidden; flex-shrink:0; background:${F.pinkSoft}; border:1px solid ${F.line}; display:flex; align-items:center; justify-content:center; }
        .fd-watchlist-avatar img { width:100%; height:100%; object-fit:cover; }
        .fd-watchlist-info { flex:1; min-width:0; }
        .fd-watchlist-name { font-size:13px; font-weight:700; color:${F.ink}; }
        .fd-watchlist-reasons { display:flex; flex-wrap:wrap; gap:4px; margin-top:3px; }
        .fd-watchlist-reason { font-size:9px; font-weight:700; padding:2px 7px; border-radius:6px; }
        .fd-reason-high   { background:${F.redSoft};   color:${F.red}; }
        .fd-reason-medium { background:${F.amberSoft}; color:${F.amber}; }
        .fd-reason-low    { background:${F.blueSoft};  color:${F.blue}; }

        /* ── Finance ── */
        .fd-fin-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
        .fd-fin-stat { background:#FAFAFA; border:1px solid ${F.line}; border-radius:11px; padding:12px 10px; }
        .fd-fin-label { font-size:9px; font-weight:700; color:${F.muted}; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
        .fd-fin-val { font-size:18px; font-weight:800; color:${F.ink}; line-height:1; }
        .fd-fin-val.income  { color:${F.green}; }
        .fd-fin-val.expense { color:${F.red}; }
        .fd-fin-change { font-size:9px; font-weight:700; margin-top:3px; }
        .fd-fin-change.up   { color:${F.green}; }
        .fd-fin-change.down { color:${F.red}; }
        .fd-fin-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
        .fd-fin-meta-chip { font-size:10px; font-weight:700; padding:3px 10px; border-radius:7px; background:${F.line}; color:${F.inkSoft}; }
        .fd-fin-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .fd-link-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; color:${F.pink}; background:${F.pinkSoft}; border:1px solid ${F.pinkBorder}; padding:6px 13px; border-radius:20px; text-decoration:none; transition:all .15s; }
        .fd-link-pill:hover { background:#FDE7EF; }
        .fd-fin-empty { display:flex; gap:10px; flex-wrap:wrap; }
        .fd-fin-empty-btn { flex:1; min-width:130px; padding:14px; border-radius:12px; font-size:13px; font-weight:700; cursor:pointer; border:1.5px dashed ${F.lineMid}; background:white; color:${F.inkSoft}; text-decoration:none; text-align:center; display:block; transition:all .15s; }
        .fd-fin-empty-btn:hover { border-color:${F.pink}; color:${F.pink}; background:${F.pinkSoft}; }

        /* ── Data quality ── */
        .fd-qual-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid ${F.line}; }
        .fd-qual-item:last-child { border-bottom:none; }
        .fd-qual-icon { width:28px; height:28px; border-radius:8px; background:${F.amberSoft}; color:${F.amber}; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-qual-label { flex:1; font-size:12px; font-weight:600; color:${F.ink}; }
        .fd-qual-btn { font-size:10px; font-weight:700; color:${F.amber}; background:${F.amberSoft}; border:1px solid ${F.amberBorder}; padding:3px 10px; border-radius:7px; text-decoration:none; white-space:nowrap; }

        /* ── Litter performance ── */
        .fd-lperf-card { background:white; border:1px solid ${F.line}; border-radius:12px; padding:13px; display:flex; flex-direction:column; gap:10px; }
        .fd-lperf-head { display:flex; align-items:center; gap:10px; }
        .fd-lperf-parents { display:flex; }
        .fd-lperf-parents > div:last-child { margin-left:-7px; }
        .fd-lperf-name  { font-size:13px; font-weight:700; color:${F.ink}; }
        .fd-lperf-sub   { font-size:10px; color:${F.muted}; font-weight:600; }
        .fd-lperf-status { font-size:9px; font-weight:700; padding:2px 8px; border-radius:7px; margin-left:auto; white-space:nowrap; }
        .fd-lperf-roi { display:flex; align-items:center; gap:14px; padding-top:8px; border-top:1px solid ${F.line}; }
        .fd-roi-label { font-size:8px; font-weight:700; color:${F.muted}; text-transform:uppercase; }
        .fd-roi-val   { font-size:13px; font-weight:700; }
        .fd-roi-link  { margin-left:auto; width:28px; height:28px; border-radius:50%; background:#FAFAFA; display:flex; align-items:center; justify-content:center; text-decoration:none; color:${F.muted}; transition:all .15s; flex-shrink:0; }
        .fd-roi-link:hover { background:${F.pink}; color:white; }
        .fd-kitten-row { display:flex; gap:4px; flex-wrap:wrap; }
        .fd-kitten-av { width:24px; height:24px; border-radius:50%; overflow:hidden; background:${F.line}; border:1px solid ${F.lineMid}; display:flex; align-items:center; justify-content:center; }
        .fd-kitten-av img { width:100%; height:100%; object-fit:cover; }

        /* ── Activity feed ── */
        .fd-act-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid ${F.line}; text-decoration:none; }
        .fd-act-row:last-child { border-bottom:none; }
        .fd-act-dot { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-act-dot img { width:16px; height:16px; object-fit:contain; }
        .fd-act-info { flex:1; min-width:0; }
        .fd-act-title { font-size:12px; font-weight:700; color:${F.ink}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .fd-act-date  { font-size:10px; color:${F.muted}; margin-top:1px; }
        .fd-act-amt   { font-size:12px; font-weight:700; flex-shrink:0; }

        /* ── Add-pet modal ── */
        .fd-modal-overlay { position:fixed; inset:0; z-index:60; background:rgba(31,26,28,.45); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; }
        .fd-modal-sheet { background:white; border-radius:24px 24px 0 0; padding:20px 20px 36px; width:100%; max-width:480px; }
        @keyframes fd-sheet-up { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        .fd-modal-sheet { animation:fd-sheet-up .22s ease; }
        .fd-modal-handle { width:40px; height:4px; border-radius:2px; background:#E5E7EB; margin:0 auto 18px; }
        .fd-modal-title { font-size:16px; font-weight:700; color:${F.ink}; margin-bottom:16px; text-align:center; }
        .fd-modal-options { display:flex; gap:12px; }
        .fd-modal-option { flex:1; display:flex; flex-direction:column; align-items:center; gap:10px; padding:20px 12px; border-radius:18px; border:1.5px solid ${F.line}; background:white; text-decoration:none; cursor:pointer; transition:border-color .15s,background .15s; }
        .fd-modal-option:hover { border-color:${F.pinkBorder}; background:${F.pinkSoft}; }
        .fd-modal-option-img { width:56px; height:56px; object-fit:contain; }
        .fd-modal-option-label { font-size:13px; font-weight:700; color:${F.ink}; text-align:center; line-height:1.3; }
        .fd-modal-cancel { width:100%; margin-top:12px; padding:12px; border-radius:12px; border:none; background:#F3F4F6; color:${F.inkSoft}; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }

        /* ── Bottom tab bar ── */
        .fd-tab-bar { position:fixed; bottom:0; left:0; right:0; z-index:55; background:rgba(255,255,255,.92); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid rgba(232,70,119,.10); box-shadow:0 -4px 24px rgba(31,26,28,.08); padding-bottom:env(safe-area-inset-bottom,0px); }
        .fd-tab-inner { display:flex; align-items:stretch; height:68px; }
        .fd-tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; text-decoration:none; color:${F.inkSoft}; border:none; background:none; font-family:inherit; cursor:pointer; }
        .fd-tab-icon { width:72px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .fd-tab-icon:active { background:rgba(232,70,119,.09); }
        .fd-tab-label { font-size:10px; font-weight:600; line-height:1.2; }

        /* ── Responsive ── */
        @media (max-width:600px) {
          .fd-page { padding-bottom:80px; }
          .fd-layout { padding:8px; gap:8px; }
          .fd-card { padding:13px; border-radius:14px; }
          .fd-fin-grid { grid-template-columns:repeat(2,1fr); }
          .fd-litter-actions { flex-wrap:wrap; }
        }
        @media (max-width:380px) { .fd-fin-grid { grid-template-columns:1fr; } }
        @media (prefers-reduced-motion:reduce) { .fd-header,.fd-card { animation:none!important; transition:none!important; } }
      `}</style>

      <div className="fd-page">
        <div className="fd-shell">

          {/* ── 1. Farm Summary Header ─────────────────────── */}
          <header className="fd-header">
            <div className="fd-header-row1">
              <button className="fd-back-btn" onClick={handleBack} aria-label="ย้อนกลับ">
                <Icon.ArrowLeft />
              </button>
              <div className="fd-avatar-sm">
                {farm.image_url
                  ? <img src={farm.image_url} alt={farm.farm_name} />
                  : <img src="/icons/icon-farm.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />}
              </div>
              <div className="fd-header-info">
                <div className="fd-header-name-row">
                  <span className="fd-header-name">{farm.farm_name}</span>
                  {farm.is_verified && <img src="/icons/icon-verified.png" alt="ยืนยันแล้ว" className="fd-verified-icon" />}
                </div>
                <span className="fd-header-species">{speciesTh(farm.species) || 'ฟาร์มสัตว์เลี้ยง'}</span>
              </div>
              <div className="fd-header-btns">
                <Link href={`/farm-dashboard/${farmId}/edit`} className="fd-hbtn fd-hbtn-primary">
                  <Icon.Edit /> แก้ไข
                </Link>
                <Link href={`/farm/${farmId}`} className="fd-hbtn fd-hbtn-ghost">
                  <Icon.Eye />
                </Link>
              </div>
            </div>

            {/* Progress bar (clickable) */}
            <button className="fd-prog-btn" onClick={() => setShowProgressDetail(v => !v)} aria-expanded={showProgressDetail}>
              <span className="fd-prog-label">โปรไฟล์สมบูรณ์</span>
              <div className="fd-prog-track">
                <div className="fd-prog-fill" style={{ width: `${farmCompletion}%` }} />
              </div>
              <span className="fd-prog-pct">{farmCompletion}%</span>
              <span className={`fd-prog-toggle${showProgressDetail ? ' open' : ''}`}><Icon.ChevronDown /></span>
            </button>

            {showProgressDetail && (
              <div className="fd-prog-detail">
                {completionItems.map(item => (
                  <div key={item.key} className="fd-prog-item">
                    <div className={`fd-prog-dot ${item.done ? 'done' : 'miss'}`} />
                    <span className={`fd-prog-item-label${item.done ? ' done' : ''}`}>{item.label}</span>
                    {item.done
                      ? <span className="fd-prog-ok">✓ เรียบร้อย</span>
                      : item.href
                        ? <Link href={item.href} className="fd-prog-fix" onClick={() => setShowProgressDetail(false)}>แก้ไข</Link>
                        : <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>ติดต่อทีม</span>}
                  </div>
                ))}
              </div>
            )}
          </header>

          <div className="fd-layout">
            {/* ── Left column on desktop ── */}
            <div className="fd-col-a">

              {/* ── 2. Action Center ─────────────────────────── */}
              <div className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-calendar.png" alt="" /></div>
                    <h2 className="fd-card-h2">งานที่ต้องทำ</h2>
                    {allTasks.length > 0 && (
                      <span className="fd-badge" style={{ background: taskCounts.overdue > 0 ? F.redSoft : F.amberSoft, color: taskCounts.overdue > 0 ? F.red : F.amber }}>{allTasks.length}</span>
                    )}
                  </div>
                </div>

                {allTasks.length > 0 && (
                  <div className="fd-task-filters">
                    {(['all','overdue','today','upcoming'] as const).map(f => {
                      const labels = { all: 'ทั้งหมด', overdue: `ด่วน${taskCounts.overdue > 0 ? ` (${taskCounts.overdue})` : ''}`, today: `วันนี้${taskCounts.today > 0 ? ` (${taskCounts.today})` : ''}`, upcoming: `เร็วๆ นี้${taskCounts.upcoming > 0 ? ` (${taskCounts.upcoming})` : ''}` };
                      return (
                        <button key={f} className={`fd-task-filter${taskFilter === f ? ' active' : ''}`} onClick={() => setTaskFilter(f)}>{labels[f]}</button>
                      );
                    })}
                  </div>
                )}

                {filteredTasks.length === 0 ? (
                  <div className="fd-empty-green">
                    <img src="/icons/icon-verified.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    <span>ทุกอย่างเรียบร้อยดี ไม่มีงานค้าง</span>
                  </div>
                ) : filteredTasks.map(task => (
                  <div key={task.id} className={`fd-task-row fd-task-${task.urgency}`}>
                    <div className="fd-task-icon"><img src={task.icon} alt="" /></div>
                    <div className="fd-task-dot" />
                    <span className="fd-task-msg">{task.label}</span>
                    <Link href={task.href} className="fd-task-btn">{task.action}</Link>
                  </div>
                ))}
              </div>

              {/* ── 3. Status KPI Cards ───────────────────────── */}
              <div className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-my-pets.png" alt="" /></div>
                    <h2 className="fd-card-h2">สถานะสัตว์ในฟาร์ม</h2>
                  </div>
                  <Link href={`/farm-dashboard/${farmId}/pets?from=${fromPage}`} className="fd-card-link">ดูทั้งหมด <Icon.ChevronRight /></Link>
                </div>
                {pets.length === 0 ? (
                  <div className="fd-empty">
                    ยังไม่มีสัตว์ในฟาร์ม
                    <br />
                    <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} style={{ color: F.pink, fontWeight: 700, fontSize: 12, marginTop: 8, display: 'inline-block' }}>+ เพิ่มสัตว์ตัวแรก</Link>
                  </div>
                ) : (
                  <div className="fd-kpi-scroll">
                    {kpiCards.map(k => (
                      <Link
                        key={k.label}
                        href={k.status === '__litters__'
                          ? `#active-litters`
                          : k.status
                            ? `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent(k.status)}&from=${fromPage}`
                            : `/farm-dashboard/${farmId}/pets?from=${fromPage}`}
                        className="fd-kpi"
                        style={{ background: k.bg, borderColor: 'transparent' }}
                      >
                        <div className="fd-kpi-top">
                          <img className="fd-kpi-icon" src={k.icon} alt="" />
                        </div>
                        <div className="fd-kpi-count" style={{ color: k.color }}>{k.count}</div>
                        <div className="fd-kpi-label">{k.label}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 6. Watchlist Pets ─────────────────────────── */}
              <div className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-health.png" alt="" /></div>
                    <h2 className="fd-card-h2">สัตว์ที่ต้องติดตาม</h2>
                  </div>
                  <Link href={`/farm-dashboard/${farmId}/pets?from=${fromPage}`} className="fd-card-link">ดูทั้งหมด <Icon.ChevronRight /></Link>
                </div>
                {topWatchlist.length === 0 ? (
                  <div className="fd-empty-green">
                    <img src="/icons/icon-verified.png" alt="" style={{ width: 14, height: 14 }} />
                    <span>สัตว์ทุกตัวข้อมูลครบถ้วน</span>
                  </div>
                ) : topWatchlist.map(({ pet, reasons, urgency }) => (
                  <Link key={pet.id} href={`/pets/${pet.id}`} className="fd-watchlist-item">
                    <div className="fd-watchlist-avatar">
                      {pet.image_url
                        ? <img src={pet.image_url} alt={pet.name} />
                        : <img src="/paw.png" alt="" style={{ width: '55%', height: '55%', objectFit: 'contain' }} />}
                    </div>
                    <div className="fd-watchlist-info">
                      <div className="fd-watchlist-name">{pet.name || 'ไม่ระบุชื่อ'}</div>
                      <div className="fd-watchlist-reasons">
                        {reasons.slice(0, 2).map(r => (
                          <span key={r} className={`fd-watchlist-reason fd-reason-${urgency}`}>{r}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ color: F.lineMid, flexShrink: 0 }}><Icon.ChevronRight /></div>
                  </Link>
                ))}
              </div>

              {/* ── 7. Finance Summary ────────────────────────── */}
              <div className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-wallet.png" alt="" /></div>
                    <h2 className="fd-card-h2">การเงิน{hasFinance ? ' — ' + monthLabel : ''}</h2>
                  </div>
                  {hasFinance && <Link href="/profile/finance" className="fd-card-link">ดูทั้งหมด <Icon.ChevronRight /></Link>}
                </div>

                {!hasFinance ? (
                  <div>
                    <div className="fd-empty" style={{ marginBottom: 12 }}>ยังไม่มีรายการรายรับรายจ่าย<br /><span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>เริ่มบันทึกเพื่อติดตามผลกำไร</span></div>
                    <div className="fd-fin-empty">
                      <Link href={`/farm-dashboard/${farmId}/transactions/create?type=income&from=${fromPage}`} className="fd-fin-empty-btn">+ เพิ่มรายรับ</Link>
                      <Link href={`/farm-dashboard/${farmId}/transactions/create?type=expense&from=${fromPage}`} className="fd-fin-empty-btn">+ เพิ่มรายจ่าย</Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="fd-fin-grid">
                      <div className="fd-fin-stat">
                        <div className="fd-fin-label">รายรับ</div>
                        <div className="fd-fin-val income">{fmtMoney(tmIncome)}</div>
                        {pmIncome > 0 && <div className={`fd-fin-change ${tmIncome >= pmIncome ? 'up' : 'down'}`}>{tmIncome >= pmIncome ? '▲' : '▼'} vs เดือนก่อน</div>}
                      </div>
                      <div className="fd-fin-stat">
                        <div className="fd-fin-label">รายจ่าย</div>
                        <div className="fd-fin-val expense">{fmtMoney(tmExpense)}</div>
                        {pmExpense > 0 && <div className={`fd-fin-change ${tmExpense <= pmExpense ? 'up' : 'down'}`}>{tmExpense <= pmExpense ? '▼' : '▲'} vs เดือนก่อน</div>}
                      </div>
                      <div className="fd-fin-stat">
                        <div className="fd-fin-label">กำไรสุทธิ</div>
                        <div className="fd-fin-val" style={{ color: tmNet >= 0 ? F.green : F.red }}>{tmNet >= 0 ? '' : '-'}{fmtMoney(tmNet)}</div>
                        {pmNet !== 0 && <div className={`fd-fin-change ${tmNet >= pmNet ? 'up' : 'down'}`}>{tmNet >= pmNet ? '▲' : '▼'} vs เดือนก่อน</div>}
                      </div>
                    </div>
                    <div className="fd-fin-meta">
                      {topCat && <span className="fd-fin-meta-chip">รายจ่ายสูงสุด: {topCat[0]} ({fmtMoney(topCat[1] as number)})</span>}
                      {unlinkedTxCount > 0 && <span className="fd-fin-meta-chip" style={{ background: F.amberSoft, color: F.amber }}>{unlinkedTxCount} รายการไม่ผูกกับครอก</span>}
                    </div>
                    <div className="fd-fin-actions">
                      <Link href={`/farm-dashboard/${farmId}/transactions/create?from=${fromPage}`} className="fd-link-pill"><Icon.Plus /> เพิ่มรายการ</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 8. Data Quality Alerts (conditional) ─────── */}
              {qualityIssues.length > 0 && (
                <div className="fd-card">
                  <div className="fd-card-head">
                    <div className="fd-card-title">
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: F.amberSoft, color: F.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon.AlertCircle />
                      </div>
                      <h2 className="fd-card-h2">ข้อมูลไม่ครบ</h2>
                      <span className="fd-badge" style={{ background: F.amberSoft, color: F.amber }}>{qualityIssues.length}</span>
                    </div>
                  </div>
                  {qualityIssues.map(issue => (
                    <div key={issue.id} className="fd-qual-item">
                      <div className="fd-qual-icon"><Icon.AlertCircle /></div>
                      <span className="fd-qual-label">{issue.label}</span>
                      {issue.href
                        ? <Link href={issue.href} className="fd-qual-btn">{issue.action}</Link>
                        : <span className="fd-qual-btn" style={{ cursor: 'default' }}>{issue.action}</span>}
                    </div>
                  ))}
                </div>
              )}

            </div>{/* end fd-col-a */}

            {/* ── Right column on desktop ── */}
            <div className="fd-col-b">

              {/* ── 4. Active Litters ────────────────────────── */}
              <div id="active-litters" className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-breeding.png" alt="" /></div>
                    <h2 className="fd-card-h2">ครอกที่กำลังดำเนินการ</h2>
                    {activeLitters.length > 0 && <span className="fd-badge" style={{ background: F.pinkSoft, color: F.pink }}>{activeLitters.length}</span>}
                  </div>
                  <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="fd-link-pill"><Icon.Plus /> บันทึกผสม</Link>
                </div>

                {activeLitters.length === 0 ? (
                  <div className="fd-empty">ยังไม่มีครอกที่กำลังดำเนิน<br /><span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>กด "บันทึกผสม" เพื่อเริ่มต้น</span></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {displayLitters.map(litter => {
                      const pct  = litter.mating_date && litter.expected_birth_date ? calcPregnancyPct(litter.mating_date, litter.expected_birth_date) : 0;
                      const diff = litter.expected_birth_date ? daysDiff(litter.expected_birth_date) : 999;
                      const isDue  = pct >= 100;
                      const isNear = !isDue && diff <= 7;
                      const barColor = isDue ? F.red : isNear ? F.amber : F.pink;
                      const daysLabel = isDue ? 'ครบกำหนด!' : diff >= 0 ? `${diff} วัน` : 'เลยกำหนด';
                      return (
                        <div key={litter.id} className="fd-litter-card">
                          <div className="fd-litter-row1">
                            <div>
                              <div className="fd-litter-code-sub">ครอก</div>
                              <div className="fd-litter-code">{litter.litter_code || 'TBA'}</div>
                            </div>
                            <div className="fd-parents">
                              <div className="fd-parent-img fd-parent-sire">{litter.sire?.image_url ? <img src={litter.sire.image_url} alt="" /> : <Icon.Male />}</div>
                              <span style={{ color: F.pink, lineHeight: 1, display: 'flex', alignItems: 'center' }}><Icon.Heart /></span>
                              <div className="fd-parent-img fd-parent-dam">{litter.dam?.image_url ? <img src={litter.dam.image_url} alt="" /> : <Icon.Female />}</div>
                              <span style={{ fontSize: 10, color: F.muted, fontWeight: 600 }}>{litter.sire?.name || '?'} × {litter.dam?.name || '?'}</span>
                            </div>
                            <div className="fd-days-chip" style={{ background: isDue ? F.redSoft : isNear ? F.amberSoft : F.pinkSoft, color: barColor }}>
                              {daysLabel}
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: F.muted, fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                            <span>คาดคลอด: <span style={{ color: F.inkSoft }}>{fmtDate(litter.expected_birth_date)}</span></span>
                            <span style={{ color: barColor }}>{pct}%</span>
                          </div>
                          <div className="fd-prog-bar-wrap">
                            <div className="fd-prog-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <div className="fd-litter-actions">
                            <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-btn-ghost">รายละเอียด</Link>
                            <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}/birth?from=${fromPage}`} className="fd-btn-birth" style={{ background: barColor }}>{isDue ? 'ด่วน! บันทึกคลอด' : 'บันทึกคลอด'}</Link>
                          </div>
                        </div>
                      );
                    })}
                    {activeLitters.length > 3 && (
                      <Link href={`/farm-dashboard/${farmId}/litters?from=${fromPage}`} className="fd-card-link" style={{ textAlign: 'center', padding: '8px 0' }}>
                        ดูครอกทั้งหมด {activeLitters.length} ครอก <Icon.ChevronRight />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* ── 5. Upcoming 7 Days ───────────────────────── */}
              <div className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-calendar.png" alt="" /></div>
                    <h2 className="fd-card-h2">กำหนดการ 7 วันข้างหน้า</h2>
                  </div>
                  <Link href={`/farm-dashboard/${farmId}/appointments`} className="fd-card-link">+ นัดหมาย</Link>
                </div>

                {scheduleEvents.length === 0 ? (
                  <div className="fd-empty">ไม่มีกำหนดการใน 7 วันข้างหน้า<br /><span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>เพิ่มนัดหมายได้จากปุ่ม "+ นัดหมาย"</span></div>
                ) : (() => {
                  const grouped: Record<string, ScheduleEvent[]> = {};
                  scheduleEvents.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
                  return Object.entries(grouped).map(([date, events]) => (
                    <div key={date}>
                      <div className="fd-sched-day">{fmtDate(date)}</div>
                      {events.map(ev => (
                        <Link key={ev.id} href={ev.href} className="fd-sched-event">
                          <div className="fd-sched-dot" style={{ background: ev.color + '22' }}>
                            <img src={ev.icon} alt="" />
                          </div>
                          <span className="fd-sched-title">{ev.title}</span>
                          <span className="fd-sched-date">{fmtDate(ev.date, true)}</span>
                        </Link>
                      ))}
                    </div>
                  ));
                })()}
              </div>

              {/* ── 9. Litter Performance ────────────────────── */}
              {bornLitters.length > 0 && (
                <div className="fd-card">
                  <div className="fd-card-head">
                    <div className="fd-card-title">
                      <div className="fd-card-title-icon"><img src="/icons/icon-wallet.png" alt="" /></div>
                      <h2 className="fd-card-h2">ผลประกอบการครอก</h2>
                    </div>
                    <span style={{ fontSize: 11, color: F.muted, fontWeight: 600 }}>ปิดแล้ว {bornLitters.length} ครอก</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {bornLitters.slice(0, 5).map(litter => {
                      const kittens     = pets.filter(p => p.litter_id === litter.id);
                      const litTx       = transactions.filter(t => t.litter_id === litter.id);
                      const litIncome   = litTx.filter(t => t.transaction_type === 'income').reduce((s,t) => s+Number(t.amount), 0);
                      const litExpense  = litTx.filter(t => t.transaction_type === 'expense').reduce((s,t) => s+Number(t.amount), 0);
                      const litProfit   = litIncome - litExpense;
                      const noFinance   = litTx.length === 0;
                      return (
                        <div key={litter.id} className="fd-lperf-card">
                          <div className="fd-lperf-head">
                            <div className="fd-lperf-parents">
                              <div className="fd-parent-img fd-parent-sire" style={{ border: '2px solid white' }}>{litter.sire?.image_url ? <img src={litter.sire.image_url} alt="" /> : <Icon.Male />}</div>
                              <div className="fd-parent-img fd-parent-dam" style={{ border: '2px solid white' }}>{litter.dam?.image_url ? <img src={litter.dam.image_url} alt="" /> : <Icon.Female />}</div>
                            </div>
                            <div>
                              <div className="fd-lperf-name">{litter.litter_code || 'N/A'}</div>
                              <div className="fd-lperf-sub">{litter.sire?.name||'?'} × {litter.dam?.name||'?'} · {fmtDate(litter.actual_birth_date, true)}</div>
                            </div>
                            <span className="fd-lperf-status" style={{ background: F.greenSoft, color: F.green }}>{litter.status}</span>
                          </div>
                          {kittens.length > 0 && (
                            <div className="fd-kitten-row">
                              {kittens.map(k => (
                                <div key={k.id} className="fd-kitten-av" title={k.name}>
                                  {k.image_url ? <img src={k.image_url} alt={k.name} /> : <img src="/paw.png" alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />}
                                </div>
                              ))}
                              <span style={{ fontSize: 10, color: F.muted, fontWeight: 600, alignSelf: 'center', marginLeft: 4 }}>{kittens.length} ตัว</span>
                            </div>
                          )}
                          <div className="fd-lperf-roi">
                            {noFinance ? (
                              <span style={{ fontSize: 11, color: F.muted, fontWeight: 600 }}>ยังไม่มีรายรับรายจ่าย</span>
                            ) : (
                              <>
                                <div><div className="fd-roi-label">รายรับ</div><div className="fd-roi-val" style={{ color: F.green }}>{fmtMoney(litIncome)}</div></div>
                                <div><div className="fd-roi-label">ต้นทุน</div><div className="fd-roi-val" style={{ color: F.red }}>{fmtMoney(litExpense)}</div></div>
                                <div><div className="fd-roi-label">กำไร</div><div className="fd-roi-val" style={{ color: litProfit >= 0 ? F.pink : F.muted }}>{litProfit > 0 ? '+' : ''}{fmtMoney(litProfit)}</div></div>
                              </>
                            )}
                            <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-roi-link"><Icon.ChevronRight /></Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── 10. Activity Feed ────────────────────────── */}
              <div className="fd-card">
                <div className="fd-card-head">
                  <div className="fd-card-title">
                    <div className="fd-card-title-icon"><img src="/icons/icon-health.png" alt="" /></div>
                    <h2 className="fd-card-h2">กิจกรรมล่าสุด</h2>
                  </div>
                </div>
                {activityFeed.length === 0 ? (
                  <div className="fd-empty">ยังไม่มีกิจกรรม</div>
                ) : activityFeed.map(a => (
                  <Link key={a.id} href={a.href} className="fd-act-row">
                    <div className="fd-act-dot" style={{ background: a.dotBg }}>
                      <img src={a.icon} alt="" />
                    </div>
                    <div className="fd-act-info">
                      <div className="fd-act-title">{a.title}</div>
                      <div className="fd-act-date">{fmtDate(a.date)}</div>
                    </div>
                    {a.amount !== null && (
                      <div className="fd-act-amt" style={{ color: a.amount >= 0 ? F.green : F.red }}>
                        {a.amount >= 0 ? '+' : '-'}{fmtMoney(a.amount)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

            </div>{/* end fd-col-b */}
          </div>{/* end fd-layout */}
        </div>
      </div>

      {/* ── Add pet modal ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fd-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="fd-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="fd-modal-handle" />
            <div className="fd-modal-title">เพิ่มสัตว์ในฟาร์ม</div>
            <div className="fd-modal-options">
              <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} className="fd-modal-option" onClick={() => setShowAddModal(false)}>
                <img className="fd-modal-option-img" src="/icons/icon-tab-add.png" alt="" />
                <span className="fd-modal-option-label">เพิ่ม 1 ตัว</span>
              </Link>
              <Link href={`/farm-dashboard/${farmId}/pets/bulk-create?from=${fromPage}`} className="fd-modal-option" onClick={() => setShowAddModal(false)}>
                <img className="fd-modal-option-img" src="/icons/icon-my-pets.png" alt="" />
                <span className="fd-modal-option-label">เพิ่มหลายตัว</span>
              </Link>
            </div>
            <button className="fd-modal-cancel" onClick={() => setShowAddModal(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ── Bottom tab bar (unchanged) ────────────────────── */}
      <nav className="fd-tab-bar" aria-label="เมนูฟาร์ม">
        <div className="fd-tab-inner">
          <button className="fd-tab" onClick={() => setShowAddModal(true)}>
            <div className="fd-tab-icon"><img src="/icons/icon-tab-add.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">เพิ่มสัตว์</span>
          </button>
          <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="fd-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-my-pets.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">จับคู่บรีด</span>
          </Link>
          <Link href={`/farm-dashboard/${farmId}/litters?from=${fromPage}`} className="fd-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-feeding.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">ลูกแมว</span>
          </Link>
          <Link href="/profile/finance" className="fd-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-wallet.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">รายรับรายจ่าย</span>
          </Link>
          <Link href={`/farm-dashboard/${farmId}/appointments`} className="fd-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-calendar.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">นัดหมาย</span>
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
