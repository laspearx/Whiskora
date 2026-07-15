"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkLight: '#F472B6', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8', pinkDeep: '#c4325f',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#f3dde3', lineMid: '#E5E7EB', paper: '#fdf0f3', bg: '#fffafc',
};

const Icon = {
  ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Male: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Heart: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

function FarmDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [farm, setFarm] = useState<any>(null);
  const [allPets, setAllPets] = useState<any[]>([]);
  const [allLitters, setAllLitters] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const directoryRef = useRef<HTMLElement>(null);
  const breedingRef = useRef<HTMLElement>(null);

  const handleBackToParent = () => {
    if (fromPage === 'partner') router.push('/partner');
    else router.push('/profile');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data: farmData } = await supabase.from("farms").select("*").eq("id", farmId).eq("user_id", session.user.id).single();
        if (!farmData) return router.push("/partner");
        setFarm(farmData);

        const { data: petsData } = await supabase.from("pets").select("*").eq("farm_id", farmId);
        if (petsData) setAllPets(petsData);

        const { data: txData } = await supabase.from("farm_transactions").select("*").eq("farm_id", farmId).order("transaction_date", { ascending: false });
        if (txData) setTransactions(txData);

        const { data: littersData } = await supabase.from("litters")
          .select(`*, sire:pets!sire_id(name, image_url), dam:pets!dam_id(name, image_url)`)
          .eq("farm_id", farmId)
          .order("mating_date", { ascending: false });
        if (littersData) setAllLitters(littersData);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    if (farmId) fetchDashboardData();
  }, [farmId, router]);

  const isMaleFn = (g: string) => g === 'male' || g === 'ตัวผู้';
  const isFemaleFn = (g: string) => g === 'female' || g === 'ตัวเมีย';

  const breeders = allPets.filter(p => p.status === "พ่อพันธุ์ / แม่พันธุ์");
  const babies = allPets.filter(p => p.status === "เด็ก");
  const readyOnly = allPets.filter(p => p.status === "พร้อมย้ายบ้าน");

  const now = new Date();
  const thisMonthIncome = transactions.filter(t => {
    if (t.transaction_type !== "income" || !t.transaction_date) return false;
    const d = new Date(t.transaction_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((a, b) => a + Number(b.amount), 0);

  const thisMonthExpenses = transactions.filter(t => {
    if (t.transaction_type !== "expense" || !t.transaction_date) return false;
    const d = new Date(t.transaction_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthExpenseTotal = thisMonthExpenses.reduce((a, b) => a + Number(b.amount), 0);
  const thisMonthNet = thisMonthIncome - monthExpenseTotal;

  const income = transactions.filter(t => t.transaction_type === "income").reduce((a, b) => a + Number(b.amount), 0);
  const expense = transactions.filter(t => t.transaction_type === "expense").reduce((a, b) => a + Number(b.amount), 0);
  const netProfit = income - expense;

  const activeLitters = allLitters.filter(l => l.status === "รอคลอด");
  const bornLitters = allLitters.filter(l => l.status === "คลอดแล้ว");

  const filteredPets = allPets.filter(pet => {
    const matchStatus = !filterStatus || pet.status === filterStatus;
    const matchGender = !filterGender || (filterGender === 'male' ? isMaleFn(pet.gender) : isFemaleFn(pet.gender));
    const matchSearch = !searchQuery ||
      (pet.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pet.breed || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchGender && matchSearch;
  });

  const recentActivity = [
    ...transactions.map(t => ({
      id: `tx-${t.id}`,
      date: t.transaction_date || t.created_at,
      title: `${t.transaction_type === 'income' ? 'รายรับ' : 'รายจ่าย'}: ${t.category || t.description || 'รายการ'}`,
      amount: t.transaction_type === 'income' ? Number(t.amount) : -Number(t.amount),
      type: t.transaction_type,
    })),
    ...allLitters.map(l => ({
      id: `lit-${l.id}`,
      date: l.actual_birth_date || l.mating_date || l.created_at,
      title: `${l.status === 'คลอดแล้ว' ? 'คลอดแล้ว' : 'บันทึกผสมพันธุ์'}: ${l.sire?.name || '?'} × ${l.dam?.name || '?'}`,
      amount: null,
      type: 'litter',
    })),
  ].filter(a => a.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  const calculatePregnancyProgress = (matingDate: string, expectedDate: string) => {
    const start = new Date(matingDate).getTime();
    const end = new Date(expectedDate).getTime();
    const today = new Date().getTime();
    if (today >= end) return 100;
    if (today <= start) return 0;
    return Math.round(((today - start) / (end - start)) * 100);
  };

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  const farmCompletion = Math.min(100,
    20 +
    (farm?.image_url ? 20 : 0) +
    (farm?.bio ? 20 : 0) +
    (farm?.species ? 15 : 0) +
    (farm?.is_verified ? 25 : 0)
  );

  const urgentTasks: Array<{ icon: string; message: string; action: string; href?: string; urgency: 'high' | 'medium' | 'low' }> = [];
  activeLitters.forEach(l => {
    if (!l.mating_date || !l.expected_birth_date) return;
    const prog = calculatePregnancyProgress(l.mating_date, l.expected_birth_date);
    const dLeft = Math.ceil((new Date(l.expected_birth_date).getTime() - Date.now()) / 86400000);
    if (prog >= 100) {
      urgentTasks.push({ icon: '/icons/icon-farm.png', message: `ครอก ${l.litter_code || 'N/A'} — ครบกำหนดคลอดแล้ว`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth?from=${fromPage}`, urgency: 'high' });
    } else if (dLeft <= 3 && dLeft >= 0) {
      urgentTasks.push({ icon: '/icons/icon-farm.png', message: `ครอก ${l.litter_code || 'N/A'} — คาดคลอดใน ${dLeft} วัน`, action: 'ดูรายละเอียด', href: `/farm-dashboard/${farmId}/litters/${l.id}?from=${fromPage}`, urgency: 'medium' });
    }
  });
  const petsNoPhoto = allPets.filter(p => !p.image_url);
  if (petsNoPhoto.length > 0) {
    urgentTasks.push({ icon: '/icons/icon-my-pets.png', message: `สัตว์ ${petsNoPhoto.length} ตัวยังไม่มีรูปภาพ`, action: 'จัดการ', href: undefined, urgency: 'low' });
  }

  const handleKpiClick = (status: string) => {
    setFilterStatus(status);
    setSearchQuery("");
    setTimeout(() => directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const handleLittersKpiClick = () => {
    breedingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <PageLoader />;
  if (!farm) return null;

  return (
    <>
      <style>{`
        @keyframes fd-rise {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fd-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        * { box-sizing: border-box; }

        .fd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; padding: 16px 16px 88px; }
        /* ── Add pet modal ── */
        .fd-modal-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(31,26,28,0.45); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
        .fd-modal-sheet { background: white; border-radius: 24px 24px 0 0; padding: 20px 20px 36px; width: 100%; max-width: 480px; animation: fd-sheet-up .22s ease; }
        @keyframes fd-sheet-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .fd-modal-handle { width: 40px; height: 4px; border-radius: 2px; background: #E5E7EB; margin: 0 auto 18px; }
        .fd-modal-title { font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; text-align: center; }
        .fd-modal-options { display: flex; gap: 12px; }
        .fd-modal-option { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 12px; border-radius: 18px; border: 1.5px solid ${F.line}; background: white; text-decoration: none; cursor: pointer; transition: border-color .15s, background .15s; }
        .fd-modal-option:hover { border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; }
        .fd-modal-option-img { width: 56px; height: 56px; object-fit: contain; }
        .fd-modal-option-label { font-size: 13px; font-weight: 700; color: ${F.ink}; text-align: center; line-height: 1.3; }
        .fd-modal-cancel { width: 100%; margin-top: 12px; padding: 12px; border-radius: 12px; border: none; background: #F3F4F6; color: ${F.inkSoft}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }

        /* ── Farm owner bottom tab bar ── */
        .fd-tab-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 55; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-top: 1px solid rgba(232,70,119,0.10); box-shadow: 0 -4px 24px rgba(31,26,28,0.08); padding-bottom: env(safe-area-inset-bottom, 0px); }
        .fd-tab-inner { display: flex; align-items: stretch; height: 68px; }
        .fd-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; text-decoration: none; color: ${F.inkSoft}; border: none; background: none; font-family: inherit; cursor: pointer; }
        .fd-tab-icon { width: 72px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .fd-tab-icon:active { background: rgba(232,70,119,0.09); }
        .fd-tab-label { font-size: 10px; font-weight: 600; line-height: 1.2; }
        .fd-shell { max-width: 1100px; margin: 0 auto; display: grid; gap: 12px; }

        /* ── Hero ── */
        .fd-hero {
          position: relative; overflow: hidden; border-radius: 20px;
          padding: 20px; color: white;
          background: linear-gradient(135deg, ${F.pink} 0%, #f06d98 58%, #f8a5c2 100%);
          box-shadow: 0 12px 28px rgba(232,70,119,.14);
          animation: fd-rise .55s ease both;
        }
        .fd-hero::before, .fd-hero::after {
          content: ""; position: absolute; border-radius: 999px; pointer-events: none;
          background: radial-gradient(circle, rgba(255,255,255,.2), transparent 68%);
          animation: fd-float 8s ease-in-out infinite;
        }
        .fd-hero::before { width: 280px; height: 280px; top: -110px; right: -90px; }
        .fd-hero::after { width: 190px; height: 190px; left: -62px; bottom: -72px; animation-delay: 1.2s; }

        .fd-back-btn {
          position: absolute; top: 12px; left: 12px; z-index: 2;
          width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
          background: rgba(255,255,255,.22); color: white; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px); transition: background .15s;
        }
        .fd-back-btn:hover { background: rgba(255,255,255,.36); }

        .hero-content {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: auto minmax(0, 1fr);
          gap: 16px; align-items: center; padding-top: 4px;
        }
        .avatar-wrap { position: relative; width: 80px; height: 80px; flex: 0 0 auto; }
        .fd-avatar {
          width: 100%; height: 100%; border-radius: 999px; overflow: hidden;
          border: 3px solid rgba(255,255,255,.88);
          background: linear-gradient(135deg, #fff1f6, #fff);
          color: ${F.pink}; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 18px rgba(140,36,78,.18);
        }
        .fd-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .hero-kicker {
          display: inline-flex; align-items: center; gap: 6px; min-height: 24px;
          padding: 3px 10px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,.32); background: rgba(255,255,255,.18);
          backdrop-filter: blur(8px); color: white;
          font-size: 10px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
          margin-bottom: 8px;
        }
        .hero-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .hero-title { margin: 0; color: white; font-size: clamp(20px,3.5vw,28px); line-height: 1.2; font-weight: 700; letter-spacing: -0.01em; }
        .hero-subtitle { margin: 5px 0 0; color: rgba(255,255,255,.78); font-size: 13px; line-height: 1.5; }
        .hero-actions { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }

        .button-primary, .button-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          min-height: 36px; border-radius: 10px; padding: 7px 14px;
          font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; border: none;
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .button-primary { background: white; color: ${F.pink}; box-shadow: 0 10px 24px rgba(31,26,28,.12); }
        .button-secondary { border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.14); color: white; }
        .button-primary:hover, .button-secondary:hover { transform: translateY(-2px); }

        /* ── Completion bar ── */
        .fd-completion {
          position: relative; z-index: 1; margin-top: 16px;
          background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.18);
          border-radius: 12px; padding: 12px 14px; backdrop-filter: blur(8px);
        }
        .fd-completion-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .fd-completion-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,.9); }
        .fd-completion-pct { font-size: 13px; font-weight: 800; color: white; }
        .fd-completion-bar { width: 100%; height: 6px; background: rgba(255,255,255,.22); border-radius: 10px; overflow: hidden; }
        .fd-completion-fill { height: 100%; border-radius: 10px; background: white; transition: width 1s ease; }
        .fd-completion-hint { font-size: 10px; color: rgba(255,255,255,.68); margin-top: 6px; line-height: 1.5; }

        .hero-meta {
          position: relative; z-index: 1; margin-top: 12px;
          display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px;
        }
        .meta-pill {
          border-radius: 12px; background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(8px);
          display: flex; flex-direction: row; align-items: center; justify-content: center;
          gap: 8px; padding: 8px 12px;
        }
        .meta-pill-icon { width: 40px; height: 40px; object-fit: contain; flex: 0 0 auto; }
        .meta-pill-num { color: white; font-size: 20px; line-height: 1; font-weight: 800; }
        .meta-pill-label { color: rgba(255,255,255,.82); font-size: 13px; font-weight: 500; line-height: 1; }

        /* ── Urgent tasks ── */
        .fd-urgent-wrap { animation: fd-rise .56s ease .04s both; }
        .fd-urgent-card {
          border-radius: 16px; padding: 16px;
          background: rgba(255,255,255,.92); border: 1px solid #f8edf1;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .fd-urgent-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .fd-urgent-head-icon { width: 28px; height: 28px; border-radius: 8px; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fd-urgent-head-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .fd-task-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
        }
        .fd-task-row:last-child { margin-bottom: 0; }
        .fd-task-high { background: #FEF2F2; border: 1px solid #FECACA; }
        .fd-task-medium { background: #FFFBEB; border: 1px solid #FDE68A; }
        .fd-task-low { background: #F0F9FF; border: 1px solid #BAE6FD; }
        .fd-task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .fd-task-high .fd-task-dot { background: #EF4444; }
        .fd-task-medium .fd-task-dot { background: #F59E0B; }
        .fd-task-low .fd-task-dot { background: #0EA5E9; }
        .fd-task-msg { flex: 1; font-size: 12px; font-weight: 600; color: ${F.ink}; line-height: 1.4; min-width: 0; }
        .fd-task-btn {
          font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 8px;
          text-decoration: none; flex-shrink: 0; white-space: nowrap; cursor: pointer;
        }
        .fd-task-high .fd-task-btn { background: #EF4444; color: white; }
        .fd-task-medium .fd-task-btn { background: #F59E0B; color: white; }
        .fd-task-low .fd-task-btn { background: #0EA5E9; color: white; }
        .fd-no-tasks {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px;
          font-size: 12px; font-weight: 600; color: #16A34A;
        }

        /* ── KPI ── */
        .fd-kpi-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; }
        .fd-kpi {
          background: white; border: 2px solid ${F.line}; border-radius: 14px; padding: 14px;
          cursor: pointer; transition: all .18s ease; user-select: none;
        }
        .fd-kpi:hover { border-color: ${F.pinkBorder}; box-shadow: 0 4px 14px rgba(232,70,119,.08); transform: translateY(-2px); }
        .fd-kpi.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .fd-kpi-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .fd-kpi-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fd-kpi-label { font-size: 11px; font-weight: 700; color: ${F.inkSoft}; line-height: 1.3; }
        .fd-kpi-value { font-family: inherit; font-size: 26px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
        .fd-kpi-sub { font-size: 10px; font-weight: 600; color: ${F.muted}; }

        /* ── Cards ── */
        .profile-card {
          border: 1px solid #f8edf1; background: rgba(255,255,255,.92);
          box-shadow: 0 4px 14px rgba(31,26,28,.03); border-radius: 16px; padding: 18px;
          animation: fd-rise .58s ease both;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }
        .profile-card:hover { border-color: #edc7d3; box-shadow: 0 8px 22px rgba(31,26,28,.07); }
        .card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .card-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .card-title-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
        .card-title-icon img { width: 28px; height: 28px; object-fit: contain; }
        .card-title-icon svg { color: ${F.pink}; }
        .card-head h2 { margin: 0; color: ${F.ink}; font-size: 16px; line-height: 1.35; font-weight: 650; letter-spacing: 0; }
        .card-link { color: ${F.pink}; font-size: 12px; font-weight: 500; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; white-space: nowrap; }

        /* ── Finance compact ── */
        .fd-fin-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 14px; }
        .fd-fin-stat { background: #FAFAFA; border: 1px solid ${F.line}; border-radius: 12px; padding: 14px; }
        .fd-fin-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
        .fd-fin-val { font-family: inherit; font-size: 20px; font-weight: 700; color: ${F.ink}; line-height: 1; }
        .fd-fin-val.income { color: #16A34A; }
        .fd-fin-val.expense { color: #EF4444; }
        .fd-fin-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Breeding ── */
        .fd-link-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all .15s; cursor: pointer; }
        .fd-link-pill:hover { background: #FDE7EF; border-color: ${F.pink}; }
        .fd-link-pill-ghost { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: ${F.inkSoft}; background: white; border: 1px solid ${F.lineMid}; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all .15s; }
        .fd-link-pill-ghost:hover { background: #F9FAFB; border-color: #D1D5DB; }
        .fd-litter-row { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
        .fd-litter-code { text-align: center; min-width: 52px; }
        .fd-litter-code-label { font-size: 9px; color: ${F.muted}; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
        .fd-litter-code-val { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .fd-parents { display: flex; align-items: center; gap: 8px; background: #FAFAFA; padding: 8px 12px; border-radius: 12px; border: 1px solid ${F.line}; }
        .fd-parent-img { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
        .fd-parent-img img { width: 100%; height: 100%; object-fit: cover; }
        .fd-parent-sire { background: #DBEAFE; color: #2563EB; }
        .fd-parent-dam { background: #FCE7F3; color: #DB2777; }
        .fd-progress-wrap { flex: 1; min-width: 180px; }
        .fd-progress-top { display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; font-weight: 700; margin-bottom: 6px; }
        .fd-progress-bar { width: 100%; height: 7px; background: ${F.line}; border-radius: 10px; overflow: hidden; }
        .fd-progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease; }
        .fd-litter-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .fd-btn-ghost { padding: 8px 16px; border-radius: 10px; background: #FAFAFA; color: ${F.inkSoft}; font-size: 11px; font-weight: 700; border: 1px solid ${F.lineMid}; text-decoration: none; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .fd-btn-ghost:hover { background: ${F.line}; }
        .fd-btn-birth { padding: 8px 18px; border-radius: 10px; color: white; font-size: 11px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all .15s; white-space: nowrap; border: none; }

        /* ── Activity ── */
        .fd-act-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid ${F.line}; }
        .fd-act-row:last-child { border-bottom: none; }
        .fd-act-dot { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fd-act-dot img { width: 18px; height: 18px; object-fit: contain; }
        .fd-act-info { flex: 1; min-width: 0; }
        .fd-act-title { font-size: 12px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fd-act-date { font-size: 10px; color: ${F.muted}; margin-top: 1px; }
        .fd-act-amt { font-size: 12px; font-weight: 700; font-family: inherit; flex-shrink: 0; }

        /* ── Litter history ── */
        .fd-litter-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .fd-litter-card { background: white; border: 1px solid ${F.line}; border-radius: 14px; display: flex; flex-direction: column; }
        .fd-litter-card-head { padding: 14px; border-bottom: 1px solid ${F.line}; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .fd-litter-parents-stack { display: flex; }
        .fd-litter-parents-stack > div:last-child { margin-left: -8px; }
        .fd-litter-card-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .fd-status-tag { font-size: 9px; font-weight: 700; padding: 3px 9px; border-radius: 8px; white-space: nowrap; }
        .fd-kitten-avatars { display: flex; flex-wrap: wrap; gap: 4px; }
        .fd-kitten-avatar { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; background: ${F.line}; border: 1px solid ${F.lineMid}; display: flex; align-items: center; justify-content: center; }
        .fd-kitten-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fd-roi-row { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid ${F.line}; }
        .fd-roi-items { display: flex; gap: 14px; }
        .fd-roi-label { font-size: 8px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; }
        .fd-roi-val { font-size: 12px; font-weight: 700; font-family: inherit; }
        .fd-roi-arrow { width: 30px; height: 30px; border-radius: 50%; background: #FAFAFA; color: ${F.muted}; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all .15s; flex-shrink: 0; }
        .fd-roi-arrow:hover { background: ${F.pink}; color: white; }
        .fd-pending-roi { background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 8px 10px; font-size: 10px; color: ${F.muted}; font-weight: 600; text-align: center; margin-top: 4px; }

        /* ── Directory ── */
        .fd-dir-search-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .fd-search-wrap { position: relative; flex: 1; min-width: 140px; }
        .fd-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: ${F.muted}; pointer-events: none; }
        .fd-search-input {
          width: 100%; background: white; border: 1px solid ${F.lineMid}; font-size: 13px;
          font-weight: 500; color: ${F.ink}; padding: 9px 12px 9px 34px; border-radius: 10px;
          outline: none; font-family: inherit; transition: border-color .15s;
        }
        .fd-search-input::placeholder { color: ${F.muted}; }
        .fd-search-input:focus { border-color: ${F.pinkBorder}; }
        .fd-select { background: white; border: 1px solid ${F.lineMid}; font-size: 12px; font-weight: 600; color: ${F.inkSoft}; padding: 8px 12px; border-radius: 10px; outline: none; cursor: pointer; transition: all .15s; font-family: inherit; }
        .fd-select:focus { border-color: ${F.pinkBorder}; }
        .fd-dir-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .fd-pet-card { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; text-decoration: none; transition: all .18s; }
        .fd-pet-card:hover { border-color: ${F.pinkBorder}; box-shadow: 0 4px 16px rgba(232,70,119,.08); transform: translateY(-1px); }
        .fd-pet-img { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1px solid ${F.line}; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; }
        .fd-pet-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
        .fd-pet-card:hover .fd-pet-img img { transform: scale(1.1); }
        .fd-pet-info { flex: 1; min-width: 0; }
        .fd-pet-name { font-family: inherit; font-size: 14px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fd-pet-breed { font-size: 10px; font-weight: 600; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px; }
        .fd-pet-tags { display: flex; gap: 5px; flex-wrap: wrap; }
        .fd-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 8px; font-size: 9px; font-weight: 700; }
        .fd-tag-male { background: #DBEAFE; color: #2563EB; }
        .fd-tag-female { background: #FCE7F3; color: #DB2777; }
        .fd-tag-status { background: ${F.line}; color: ${F.inkSoft}; }
        .fd-empty { background: white; border: 1px dashed ${F.lineMid}; border-radius: 14px; padding: 28px; text-align: center; color: ${F.muted}; font-size: 13px; font-weight: 600; }

        @media (max-width: 900px) {
          .fd-kpi-grid { grid-template-columns: repeat(3,1fr); }
          .fd-litter-grid { grid-template-columns: repeat(2,1fr); }
          .fd-dir-grid { grid-template-columns: repeat(2,1fr); }
          .fd-fin-row { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 600px) {
          .fd-page { padding: 10px 12px 68px; }
          .fd-hero { border-radius: 16px; padding: 16px; }
          .hero-content { grid-template-columns: 1fr; justify-items: center; text-align: center; padding-top: 24px; }
          .hero-title-row, .hero-actions { justify-content: center; }
          .avatar-wrap { width: 70px; height: 70px; }
          .hero-meta { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px; }
          .meta-pill { padding: 7px 10px; gap: 6px; }
          .meta-pill-icon { width: 34px; height: 34px; }
          .meta-pill-num { font-size: 17px; }
          .fd-kpi-grid { grid-template-columns: repeat(3,1fr); gap: 8px; }
          .fd-kpi { padding: 10px; }
          .fd-kpi-value { font-size: 22px; }
          .fd-litter-grid, .fd-dir-grid { grid-template-columns: 1fr; }
          .fd-litter-row { gap: 12px; }
          .fd-litter-actions { width: 100%; justify-content: flex-end; }
          .fd-fin-row { grid-template-columns: repeat(3,1fr); }
          .profile-card { border-radius: 14px; padding: 14px; }
        }
        @media (max-width: 420px) {
          .fd-kpi-grid { grid-template-columns: repeat(2,1fr); }
          .fd-fin-row { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fd-hero, .profile-card, .fd-hero::before, .fd-hero::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      <main className="fd-page">
        <div className="fd-shell">

          {/* ── 1. Hero ── */}
          <section className="fd-hero">
            <button onClick={handleBackToParent} className="fd-back-btn" aria-label="ย้อนกลับ">
              <Icon.ArrowLeft />
            </button>
            <div className="hero-content">
              <div className="avatar-wrap">
                <div className="fd-avatar">
                  {farm.image_url ? <img src={farm.image_url} alt={farm.farm_name} /> : <img src="/icons/icon-farm.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />}
                </div>
              </div>
              <div>
                <div className="hero-kicker">
                  <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                  แดชบอร์ดฟาร์ม
                </div>
                <div className="hero-title-row">
                  <h1 className="hero-title">{farm.farm_name}</h1>
                  {farm.is_verified && <img src="/icons/icon-verified.png" alt="ยืนยันแล้ว" style={{ width: 26, height: 26, objectFit: 'contain' }} />}
                </div>
                <p className="hero-subtitle">{farm.bio || `ฟาร์ม${speciesTh(farm.species) || 'สัตว์เลี้ยง'}`}</p>
                <div className="hero-actions">
                  <Link href={`/partner`} className="button-primary"><Icon.Edit /> แก้ไขข้อมูลฟาร์ม</Link>
                  <Link href={`/farm/${farmId}`} className="button-secondary"><Icon.Eye /> ดูหน้าฟาร์มที่ลูกค้าเห็น</Link>
                </div>
              </div>
            </div>

            <div className="fd-completion">
              <div className="fd-completion-top">
                <span className="fd-completion-label">โปรไฟล์ฟาร์มสมบูรณ์</span>
                <span className="fd-completion-pct">{farmCompletion}%</span>
              </div>
              <div className="fd-completion-bar">
                <div className="fd-completion-fill" style={{ width: `${farmCompletion}%` }} />
              </div>
              {farmCompletion < 100 && (
                <p className="fd-completion-hint">
                  {!farm.image_url && 'เพิ่มรูปฟาร์ม · '}
                  {!farm.bio && 'เพิ่มคำอธิบายฟาร์ม · '}
                  {!farm.is_verified && 'ยืนยันตัวตนฟาร์ม'}
                  {' '}เพื่อให้ลูกค้าไว้วางใจมากขึ้น
                </p>
              )}
            </div>

            <div className="hero-meta">
              <div className="meta-pill">
                <img className="meta-pill-icon" src="/icons/icon-my-pets.png" alt="" />
                <strong className="meta-pill-num">{allPets.length}</strong>
                <span className="meta-pill-label">สัตว์ทั้งหมด</span>
              </div>
              <div className="meta-pill">
                <img className="meta-pill-icon" src="/icons/icon-farm.png" alt="" />
                <strong className="meta-pill-num">{activeLitters.length}</strong>
                <span className="meta-pill-label">ครอกที่เปิดอยู่</span>
              </div>
            </div>
          </section>

          {/* ── 2. วันนี้ต้องทำอะไร ── */}
          <div className="fd-urgent-wrap">
            <div className="fd-urgent-card">
              <div className="fd-urgent-head">
                <div className="fd-urgent-head-icon"><img src="/icons/icon-calendar.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /></div>
                <span className="fd-urgent-head-title">วันนี้ต้องทำอะไร</span>
              </div>
              {urgentTasks.length === 0 ? (
                <div className="fd-no-tasks">
                  <img src="/icons/icon-verified.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                  <span>วันนี้ยังไม่มีงานด่วน ทุกอย่างเรียบร้อยดี</span>
                </div>
              ) : urgentTasks.map((task, i) => (
                <div key={i} className={`fd-task-row fd-task-${task.urgency}`}>
                  <div className="fd-task-dot" />
                  <span className="fd-task-msg">{task.message}</span>
                  {task.href
                    ? <Link href={task.href} className="fd-task-btn">{task.action}</Link>
                    : <button className="fd-task-btn" style={{ border: 'none', cursor: 'pointer' }}>{task.action}</button>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. KPI (tappable) ── */}
          <section className="profile-card">
            <div className="card-head">
              <div className="card-title">
                <span className="card-title-icon"><img src="/icons/icon-my-pets.png" alt="" /></span>
                <h2>สถานะสัตว์ในฟาร์ม</h2>
              </div>
              {filterStatus && (
                <button onClick={() => setFilterStatus("")} style={{ fontSize: '11px', fontWeight: 700, color: F.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                  ล้างตัวกรอง ×
                </button>
              )}
            </div>
            <div className="fd-kpi-grid">
              <div className={`fd-kpi${filterStatus === '' ? ' active' : ''}`} onClick={() => handleKpiClick('')}>
                <div className="fd-kpi-top">
                  <div className="fd-kpi-icon" style={{ background: F.pinkSoft }}><img src="/icons/icon-my-pets.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>
                </div>
                <div className="fd-kpi-value" style={{ color: F.pink }}>{allPets.length}</div>
                <div className="fd-kpi-label">ทั้งหมด</div>
                <div className="fd-kpi-sub">{speciesTh(farm.species) || 'สัตว์'}</div>
              </div>
              <div className={`fd-kpi${filterStatus === 'พ่อพันธุ์ / แม่พันธุ์' ? ' active' : ''}`} onClick={() => handleKpiClick('พ่อพันธุ์ / แม่พันธุ์')}>
                <div className="fd-kpi-top">
                  <div className="fd-kpi-icon" style={{ background: '#F3E8FF' }}><img src="/icons/icon-breeding.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>
                </div>
                <div className="fd-kpi-value" style={{ color: '#7C3AED' }}>{breeders.length}</div>
                <div className="fd-kpi-label">พ่อแม่พันธุ์</div>
                <div className="fd-kpi-sub">กดเพื่อกรอง</div>
              </div>
              <div className={`fd-kpi${filterStatus === 'เด็ก' ? ' active' : ''}`} onClick={() => handleKpiClick('เด็ก')}>
                <div className="fd-kpi-top">
                  <div className="fd-kpi-icon" style={{ background: '#FEF9C3' }}><img src="/icons/icon-feeding.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>
                </div>
                <div className="fd-kpi-value" style={{ color: '#CA8A04' }}>{babies.length}</div>
                <div className="fd-kpi-label">ลูกสัตว์</div>
                <div className="fd-kpi-sub">กดเพื่อกรอง</div>
              </div>
              <div className={`fd-kpi${filterStatus === 'พร้อมย้ายบ้าน' ? ' active' : ''}`} onClick={() => handleKpiClick('พร้อมย้ายบ้าน')}>
                <div className="fd-kpi-top">
                  <div className="fd-kpi-icon" style={{ background: '#DCFCE7' }}><img src="/icons/icon-partner.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>
                </div>
                <div className="fd-kpi-value" style={{ color: '#16A34A' }}>{readyOnly.length}</div>
                <div className="fd-kpi-label">พร้อมย้ายบ้าน</div>
                <div className="fd-kpi-sub">กดเพื่อกรอง</div>
              </div>
              <div className="fd-kpi" onClick={handleLittersKpiClick}>
                <div className="fd-kpi-top">
                  <div className="fd-kpi-icon" style={{ background: '#FEE2E2' }}><img src="/icons/icon-farm.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /></div>
                </div>
                <div className="fd-kpi-value" style={{ color: '#EF4444' }}>{activeLitters.length}</div>
                <div className="fd-kpi-label">ครอกที่เปิดอยู่</div>
                <div className="fd-kpi-sub">กดดูครอก</div>
              </div>
            </div>
          </section>

          {/* ── 5. ครอกและการผสมพันธุ์ ── */}
          <section className="profile-card" ref={breedingRef as React.RefObject<HTMLDivElement>}>
            <div className="card-head">
              <div className="card-title">
                <span className="card-title-icon"><img src="/icons/icon-breeding.png" alt="" /></span>
                <h2>ครอกและการผสมพันธุ์</h2>
              </div>
              <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="fd-link-pill"><Icon.Plus /> บันทึกการผสมพันธุ์</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeLitters.length === 0 ? (
                <div className="fd-empty">ยังไม่มีครอกที่เปิดอยู่ — กด "บันทึกการผสมพันธุ์" เพื่อเริ่มต้น</div>
              ) : activeLitters.map((litter) => {
                const progress = litter.mating_date && litter.expected_birth_date
                  ? calculatePregnancyProgress(litter.mating_date, litter.expected_birth_date)
                  : 0;
                const daysLeftNum = litter.expected_birth_date
                  ? Math.ceil((new Date(litter.expected_birth_date).getTime() - Date.now()) / 86400000)
                  : 999;
                const isDue = progress >= 100;
                const isNear = !isDue && daysLeftNum <= 7;
                const progressColor = isDue ? '#EF4444' : isNear ? '#F59E0B' : F.pink;
                const daysLabel = isDue ? 'ครบกำหนด!' : daysLeftNum >= 0 ? `${daysLeftNum} วัน` : 'ครบกำหนด!';
                return (
                  <div key={litter.id} className="fd-litter-row">
                    <div className="fd-litter-code">
                      <div className="fd-litter-code-label">ครอก</div>
                      <div className="fd-litter-code-val">{litter.litter_code || 'TBA'}</div>
                    </div>
                    <div className="fd-parents">
                      <div className="fd-parent-img fd-parent-sire">{litter.sire?.image_url ? <img src={litter.sire.image_url} alt="" /> : <Icon.Male />}</div>
                      <span style={{ color: F.pink, display: 'flex', alignItems: 'center' }}><Icon.Heart /></span>
                      <div className="fd-parent-img fd-parent-dam">{litter.dam?.image_url ? <img src={litter.dam.image_url} alt="" /> : <Icon.Female />}</div>
                    </div>
                    <div className="fd-progress-wrap">
                      <div className="fd-progress-top">
                        <span style={{ color: F.muted }}>คาดคลอด: <span style={{ color: F.inkSoft }}>{fmtDate(litter.expected_birth_date)}</span></span>
                        <span style={{ color: progressColor, fontWeight: 800 }}>{daysLabel}</span>
                      </div>
                      <div className="fd-progress-bar">
                        <div className="fd-progress-fill" style={{ width: `${progress}%`, background: progressColor }} />
                      </div>
                    </div>
                    <div className="fd-litter-actions">
                      <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-btn-ghost">รายละเอียด</Link>
                      <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}/birth?from=${fromPage}`} className="fd-btn-birth" style={{ background: progressColor }}>{isDue ? 'ด่วน! บันทึกคลอด' : 'บันทึกคลอด'}</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 6. การเงินเดือนนี้แบบย่อ ── */}
          <section className="profile-card">
            <div className="card-head">
              <div className="card-title">
                <span className="card-title-icon"><img src="/icons/icon-wallet.png" alt="" /></span>
                <h2>การเงินเดือนนี้แบบย่อ</h2>
              </div>
              <span style={{ fontSize: '11px', color: F.muted, fontWeight: 600 }}>{monthLabel}</span>
            </div>
            <div className="fd-fin-row">
              <div className="fd-fin-stat">
                <div className="fd-fin-label">รายรับเดือนนี้</div>
                <div className="fd-fin-val income">฿{thisMonthIncome.toLocaleString()}</div>
              </div>
              <div className="fd-fin-stat">
                <div className="fd-fin-label">รายจ่ายเดือนนี้</div>
                <div className="fd-fin-val expense">฿{monthExpenseTotal.toLocaleString()}</div>
              </div>
              <div className="fd-fin-stat">
                <div className="fd-fin-label">กำไรสุทธิ</div>
                <div className="fd-fin-val" style={{ color: thisMonthNet >= 0 ? '#16A34A' : '#EF4444' }}>
                  {thisMonthNet >= 0 ? '' : '-'}฿{Math.abs(thisMonthNet).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="fd-fin-actions">
              <Link href={`/farm-dashboard/${farmId}/transactions/create?from=${fromPage}`} className="fd-link-pill"><Icon.Plus /> เพิ่มรายรับ/รายจ่าย</Link>
            </div>
          </section>

          {/* ── 7. กิจกรรมล่าสุด ── */}
          <section className="profile-card">
            <div className="card-head">
              <div className="card-title">
                <span className="card-title-icon"><img src="/icons/icon-health.png" alt="" /></span>
                <h2>กิจกรรมล่าสุดในฟาร์ม</h2>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: F.muted, fontSize: '12px' }}>ยังไม่มีกิจกรรม</div>
            ) : recentActivity.map(a => (
              <div key={a.id} className="fd-act-row">
                <div className="fd-act-dot" style={{ background: a.type === 'litter' ? F.pinkSoft : a.type === 'income' ? '#DCFCE7' : '#FEE2E2' }}>
                  <img src={a.type === 'litter' ? '/icons/icon-farm.png' : '/icons/icon-wallet.png'} alt="" />
                </div>
                <div className="fd-act-info">
                  <div className="fd-act-title">{a.title}</div>
                  <div className="fd-act-date">{fmtDate(a.date)}</div>
                </div>
                {a.amount !== null && <div className="fd-act-amt" style={{ color: a.amount >= 0 ? '#16A34A' : '#DC2626' }}>{a.amount >= 0 ? '+' : ''}{a.amount.toLocaleString()}</div>}
              </div>
            ))}
          </section>

          {/* ── 8. สัตว์ในฟาร์ม ── */}
          <section className="profile-card" ref={directoryRef as React.RefObject<HTMLDivElement>}>
            <div className="card-head">
              <div className="card-title">
                <span className="card-title-icon"><img src="/icons/icon-my-pets.png" alt="" /></span>
                <h2>สัตว์ในฟาร์ม</h2>
              </div>
              <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} className="fd-link-pill"><Icon.Plus /> เพิ่มสัตว์</Link>
            </div>

            <div className="fd-dir-search-row">
              <div className="fd-search-wrap">
                <span className="fd-search-icon"><Icon.Search /></span>
                <input
                  type="text"
                  className="fd-search-input"
                  placeholder="ค้นหาชื่อหรือสายพันธุ์..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="fd-select">
                <option value="">ทุกเพศ</option>
                <option value="male">ตัวผู้</option>
                <option value="female">ตัวเมีย</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="fd-select">
                <option value="">ทุกสถานะ</option>
                <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อแม่พันธุ์</option>
                <option value="เด็ก">ลูกสัตว์</option>
                <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
                <option value="ติดจอง">ติดจอง</option>
                <option value="ทำหมัน / ปลดระวาง">ปลดระวาง</option>
              </select>
            </div>

            <p style={{ fontSize: '11px', fontWeight: 600, color: F.muted, marginBottom: '12px' }}>แสดงผล {filteredPets.length} จาก {allPets.length} ตัว</p>

            {filteredPets.length === 0 ? (
              <div className="fd-empty">ไม่พบสัตว์ที่ตรงกับเงื่อนไขการค้นหา</div>
            ) : (
              <div className="fd-dir-grid">
                {filteredPets.map(pet => {
                  const isMale = isMaleFn(pet.gender);
                  const breedName = pet.breed ? pet.breed.split('(')[0].trim() : 'ไม่ระบุสายพันธุ์';
                  return (
                    <Link key={pet.id} href={`/pets/${pet.id}`} className="fd-pet-card">
                      <div className="fd-pet-img">
                        {pet.image_url
                          ? <img src={pet.image_url} alt={pet.name} />
                          : <img src="/paw.png" alt="" style={{ width: '65%', height: '65%', objectFit: 'contain' }} />}
                      </div>
                      <div className="fd-pet-info">
                        <div className="fd-pet-name">{pet.name}</div>
                        <div className="fd-pet-breed">{breedName}</div>
                        <div className="fd-pet-tags">
                          <span className={`fd-tag ${isMale ? 'fd-tag-male' : 'fd-tag-female'}`}>{isMale ? <Icon.Male /> : <Icon.Female />} {isMale ? 'ผู้' : 'เมีย'}</span>
                          <span className="fd-tag fd-tag-status">{pet.status || 'N/A'}</span>
                        </div>
                      </div>
                      <div style={{ color: '#D1D5DB', flexShrink: 0 }}><Icon.ChevronRight /></div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── 9. ประวัติครอก & ผลประกอบการ ── */}
          <section className="profile-card">
            <div className="card-head">
              <div className="card-title">
                <span className="card-title-icon"><img src="/icons/icon-wallet.png" alt="" /></span>
                <h2>ประวัติครอก &amp; ผลประกอบการ</h2>
              </div>
              <span style={{ fontSize: '11px', color: F.muted, fontWeight: 600 }}>รวม {allLitters.length} ครอก · คลอดแล้ว {bornLitters.length}</span>
            </div>
            <div className="fd-litter-grid">
              {allLitters.length === 0 ? (
                <div className="fd-empty" style={{ gridColumn: '1 / -1' }}>ยังไม่มีประวัติการบรีด</div>
              ) : allLitters.map(litter => {
                const litterKittens = allPets.filter(p => p.litter_id === litter.id);
                const litterTxs = transactions.filter(t => t.litter_id === litter.id);
                const litterIncome = litterTxs.filter(t => t.transaction_type === 'income').reduce((a, b) => a + Number(b.amount), 0);
                const litterExpense = litterTxs.filter(t => t.transaction_type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
                const litterProfit = litterIncome - litterExpense;
                const isBorn = litter.status !== 'รอคลอด';
                return (
                  <div key={litter.id} className="fd-litter-card">
                    <div className="fd-litter-card-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="fd-litter-parents-stack">
                          <div className="fd-parent-img fd-parent-sire" style={{ border: '2px solid white' }}>{litter.sire?.image_url ? <img src={litter.sire.image_url} alt="" /> : <Icon.Male />}</div>
                          <div className="fd-parent-img fd-parent-dam" style={{ border: '2px solid white' }}>{litter.dam?.image_url ? <img src={litter.dam.image_url} alt="" /> : <Icon.Female />}</div>
                        </div>
                        <div>
                          <p style={{ fontFamily: 'inherit', fontSize: '14px', fontWeight: 700, color: F.ink }}>{litter.litter_code || 'N/A'}</p>
                          <p style={{ fontSize: '10px', fontWeight: 600, color: F.muted }}>{litter.sire?.name || '?'} × {litter.dam?.name || '?'}</p>
                        </div>
                      </div>
                      <span className="fd-status-tag" style={{ background: isBorn ? '#DCFCE7' : F.pinkSoft, color: isBorn ? '#16A34A' : F.pink }}>{litter.status}</span>
                    </div>
                    <div className="fd-litter-card-body">
                      {isBorn && (
                        <div>
                          <p style={{ fontSize: '9px', fontWeight: 700, color: F.muted, marginBottom: '6px' }}>ผลผลิต ({litterKittens.length} ตัว)</p>
                          <div className="fd-kitten-avatars">
                            {litterKittens.map(k => (
                              <div key={k.id} className="fd-kitten-avatar" title={k.name}>
                                {k.image_url
                                  ? <img src={k.image_url} alt={k.name} />
                                  : <img src="/paw.png" alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />}
                              </div>
                            ))}
                            {litterKittens.length === 0 && <span style={{ fontSize: '10px', color: '#D1D5DB' }}>ยังไม่มีข้อมูล</span>}
                          </div>
                        </div>
                      )}
                      {isBorn ? (
                        <div className="fd-roi-row" style={{ marginTop: 0 }}>
                          <div className="fd-roi-items">
                            <div><div className="fd-roi-label">รายรับ</div><div className="fd-roi-val" style={{ color: '#16A34A' }}>{litterIncome.toLocaleString()}</div></div>
                            <div><div className="fd-roi-label">ต้นทุน</div><div className="fd-roi-val" style={{ color: '#EF4444' }}>{litterExpense.toLocaleString()}</div></div>
                            <div><div className="fd-roi-label">กำไรสุทธิ</div><div className="fd-roi-val" style={{ color: litterProfit >= 0 ? F.pink : F.muted }}>{litterProfit > 0 ? '+' : ''}{litterProfit.toLocaleString()}</div></div>
                          </div>
                          <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-roi-arrow"><Icon.ChevronRight /></Link>
                        </div>
                      ) : (
                        <div>
                          <div className="fd-roi-row" style={{ marginTop: 'auto' }}>
                            <div className="fd-roi-items">
                              <div><div className="fd-roi-label">ต้นทุนสะสม</div><div className="fd-roi-val" style={{ color: '#EF4444' }}>{litterExpense.toLocaleString()}</div></div>
                              <div><div className="fd-roi-label">รายรับที่บันทึก</div><div className="fd-roi-val" style={{ color: '#16A34A' }}>{litterIncome.toLocaleString()}</div></div>
                            </div>
                            <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-roi-arrow"><Icon.ChevronRight /></Link>
                          </div>
                          <div className="fd-pending-roi">รอปิดครอก — กำไรจะแสดงหลังบันทึกคลอด</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* ── Add pet modal ── */}
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

      {/* ── Farm owner bottom tab bar ── */}
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
          <Link href={`/profile/finance`} className="fd-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-wallet.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">รายรับรายจ่าย</span>
          </Link>
          <Link href={`/farm-dashboard/${farmId}/appointments?from=${fromPage}`} className="fd-tab">
            <div className="fd-tab-icon"><img src="/icons/icon-calendar.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} /></div>
            <span className="fd-tab-label">เพิ่มนัดหมาย</span>
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
