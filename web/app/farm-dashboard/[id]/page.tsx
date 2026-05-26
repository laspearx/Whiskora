"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

// สีโดนัทชาร์ตหมวดค่าใช้จ่าย (วนใช้)
const CHART_COLORS = ['#7C3AED', '#E84677', '#0D9488', '#F59E0B', '#2563EB', '#EC4899', '#10B981', '#6366F1'];

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Filter: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Male: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Users: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Paw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Wallet: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  Verified: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#E84677"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  TrendingUp: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Layers: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
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
  const [filterBreed, setFilterBreed] = useState("");

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

  // ─── KPI + แยกเพศ ───
  const breeders = allPets.filter(p => p.status === "พ่อพันธุ์ / แม่พันธุ์");
  const readyMove = allPets.filter(p => p.status === "พร้อมย้ายบ้าน" || p.status === "เด็ก");
  const neutered = allPets.filter(p => p.status === "ทำหมัน / ปลดระวาง");
  const genderCount = (arr: any[]) => ({ m: arr.filter(p => isMaleFn(p.gender)).length, f: arr.filter(p => isFemaleFn(p.gender)).length });
  const breedersG = genderCount(breeders);
  const readyG = genderCount(readyMove);
  const neuteredG = genderCount(neutered);
  const allG = genderCount(allPets);

  // ─── การเงิน ───
  const income = transactions.filter(t => t.transaction_type === "income").reduce((a, b) => a + Number(b.amount), 0);
  const expense = transactions.filter(t => t.transaction_type === "expense").reduce((a, b) => a + Number(b.amount), 0);
  const netProfit = income - expense;

  // ค่าใช้จ่ายเดือนปัจจุบัน
  const now = new Date();
  const thisMonthExpenses = transactions.filter(t => {
    if (t.transaction_type !== "expense" || !t.transaction_date) return false;
    const d = new Date(t.transaction_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthExpenseTotal = thisMonthExpenses.reduce((a, b) => a + Number(b.amount), 0);

  // หมวดหมู่ค่าใช้จ่าย (รวมทั้งหมด) → โดนัทชาร์ต
  const categoryMap: Record<string, number> = {};
  transactions.filter(t => t.transaction_type === "expense").forEach(t => {
    const cat = t.category || "อื่นๆ";
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
  });
  const categoryList = Object.entries(categoryMap)
    .map(([name, amount], i) => ({ name, amount, color: CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.amount - a.amount);
  const categoryTotal = categoryList.reduce((a, b) => a + b.amount, 0);

  // สร้าง conic-gradient สำหรับโดนัท
  let acc = 0;
  const conicSegments = categoryList.map(c => {
    const start = categoryTotal > 0 ? (acc / categoryTotal) * 100 : 0;
    acc += c.amount;
    const end = categoryTotal > 0 ? (acc / categoryTotal) * 100 : 0;
    return `${c.color} ${start}% ${end}%`;
  }).join(', ');

  // ─── บรีด ───
  const activeLitters = allLitters.filter(l => l.status === "รอคลอด");
  const bornLitters = allLitters.filter(l => l.status === "คลอดแล้ว");

  // ─── Directory filters ───
  const filteredPets = allPets.filter(pet => {
    return (!filterStatus || pet.status === filterStatus) &&
           (!filterGender || (filterGender === 'male' ? isMaleFn(pet.gender) : isFemaleFn(pet.gender))) &&
           (!filterBreed || (pet.breed && pet.breed.includes(filterBreed)));
  });
  const uniqueBreeds = Array.from(new Set(allPets.map(p => p.breed ? p.breed.split('(')[0].trim() : "ไม่ระบุ").filter(b => b !== "ไม่ระบุ")));

  // ─── กิจกรรมล่าสุด (รวม transactions + litters) ───
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

  // ─── Helpers ───
  const calculatePregnancyProgress = (matingDate: string, expectedDate: string) => {
    const start = new Date(matingDate).getTime();
    const end = new Date(expectedDate).getTime();
    const today = new Date().getTime();
    if (today >= end) return 100;
    if (today <= start) return 0;
    return Math.round(((today - start) / (end - start)) * 100);
  };
  const calculateDaysLeft = (expectedDate: string) => {
    const diffDays = Math.ceil((new Date(expectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} วัน` : "ครบกำหนด!";
  };
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-400 tracking-widest">LOADING FARM DATA...</p>
      </div>
    </div>
  );
  if (!farm) return null;

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .fd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .fd-body { max-width: 1100px; margin: 0 auto; padding: 24px 20px 80px; display: flex; flex-direction: column; gap: 20px; }
        /* ── Farm identity header ── */
        .fd-id-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .fd-id-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
        .fd-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .fd-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .fd-farm-avatar { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid ${F.pinkBorder}; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .fd-farm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fd-farm-name { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; display: flex; align-items: center; gap: 6px; }
        .fd-farm-meta { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 4px; }
        .fd-id-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .fd-btn-add { display: inline-flex; align-items: center; gap: 6px; padding: 11px 18px; border-radius: 24px; background: ${F.pink}; color: white; font-size: 13px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: all .18s ease; }
        .fd-btn-add:hover { background: #D63F6A; box-shadow: 0 6px 20px rgba(232,70,119,0.4); transform: translateY(-1px); }
        .fd-btn-add.ghost { background: white; color: ${F.pink}; border: 1px solid ${F.pinkBorder}; box-shadow: none; }
        .fd-btn-add.ghost:hover { background: ${F.pinkSoft}; }
        /* ── Finance row (expense card + donut) ── */
        .fd-finance-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px; }
        .fd-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; transition: all .2s; }
        .fd-expense-card { background: linear-gradient(135deg, #FFF0F5, #FDF2F5); border: 1px solid ${F.pinkBorder}; border-radius: 18px; padding: 22px; display: flex; flex-direction: column; justify-content: center; }
        .fd-expense-icon { width: 44px; height: 44px; border-radius: 14px; background: white; color: ${F.pink}; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(232,70,119,.12); }
        .fd-expense-label { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; }
        .fd-expense-sub { font-size: 11px; color: ${F.muted}; margin-top: 2px; }
        .fd-expense-amount { font-family: inherit; font-size: 32px; font-weight: 700; color: ${F.pink}; margin: 12px 0 4px; letter-spacing: -0.5px; }
        .fd-donut-card { padding: 22px; }
        .fd-donut-title { font-size: 13px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; }
        .fd-donut-wrap { display: flex; align-items: center; gap: 22px; }
        .fd-donut { width: 130px; height: 130px; border-radius: 50%; flex-shrink: 0; position: relative; }
        .fd-donut::after { content: ''; position: absolute; inset: 26px; background: white; border-radius: 50%; }
        .fd-donut-empty { width: 130px; height: 130px; border-radius: 50%; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; color: ${F.muted}; text-align: center; }
        .fd-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .fd-legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .fd-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .fd-legend-name { color: ${F.inkSoft}; font-weight: 600; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fd-legend-pct { color: ${F.muted}; font-weight: 700; flex-shrink: 0; }
        .fd-legend-amt { color: ${F.ink}; font-weight: 700; font-family: inherit; flex-shrink: 0; min-width: 56px; text-align: right; }
        /* ── KPI ── */
        .fd-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .fd-section-title { display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; }
        .fd-link-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; padding: 6px 14px; border-radius: 20px; text-decoration: none; transition: all .15s; cursor: pointer; }
        .fd-link-pill:hover { background: #FDE7EF; border-color: ${F.pink}; }
        .fd-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .fd-kpi { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 16px 18px; }
        .fd-kpi-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .fd-kpi-emoji { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .fd-kpi-label { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; }
        .fd-kpi-value { font-family: inherit; font-size: 30px; font-weight: 700; line-height: 1; margin-bottom: 8px; }
        .fd-kpi-gender { display: flex; gap: 10px; font-size: 11px; font-weight: 700; }
        .fd-kpi-gender .m { color: #2563EB; display: inline-flex; align-items: center; gap: 3px; }
        .fd-kpi-gender .f { color: #DB2777; display: inline-flex; align-items: center; gap: 3px; }
        .fd-kpi-gender .total { color: ${F.muted}; font-weight: 600; }
        /* ── Breeding tracker ── */
        .fd-litter-row { padding: 16px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
        .fd-litter-code { text-align: center; min-width: 52px; }
        .fd-litter-code-label { font-size: 9px; color: ${F.muted}; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
        .fd-litter-code-val { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .fd-parents { display: flex; align-items: center; gap: 8px; background: #FAFAFA; padding: 8px 12px; border-radius: 14px; border: 1px solid ${F.line}; }
        .fd-parent-img { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
        .fd-parent-img img { width: 100%; height: 100%; object-fit: cover; }
        .fd-parent-sire { background: #DBEAFE; color: #2563EB; }
        .fd-parent-dam { background: #FCE7F3; color: #DB2777; }
        .fd-progress-wrap { flex: 1; min-width: 180px; }
        .fd-progress-top { display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; font-weight: 700; margin-bottom: 6px; }
        .fd-progress-bar { width: 100%; height: 7px; background: ${F.line}; border-radius: 10px; overflow: hidden; }
        .fd-progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease; }
        .fd-litter-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .fd-btn-ghost { padding: 8px 16px; border-radius: 12px; background: #FAFAFA; color: ${F.inkSoft}; font-size: 11px; font-weight: 700; border: 1px solid ${F.lineMid}; text-decoration: none; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .fd-btn-ghost:hover { background: ${F.line}; }
        .fd-btn-birth { padding: 8px 18px; border-radius: 12px; color: white; font-size: 11px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all .15s; white-space: nowrap; }
        /* ── Summary + Activity row ── */
        .fd-mid-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 16px; align-items: start; }
        .fd-summary-card { padding: 20px; }
        .fd-summary-icon { width: 40px; height: 40px; border-radius: 12px; background: ${F.pinkSoft}; color: ${F.pink}; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .fd-summary-big { font-family: inherit; font-size: 28px; font-weight: 700; color: ${F.ink}; }
        .fd-summary-sub { font-size: 12px; color: ${F.inkSoft}; margin-top: 6px; line-height: 1.6; }
        .fd-summary-sub b { color: ${F.pink}; }
        .fd-activity-card { padding: 20px; }
        .fd-act-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid ${F.line}; }
        .fd-act-row:last-child { border-bottom: none; }
        .fd-act-dot { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; }
        .fd-act-info { flex: 1; min-width: 0; }
        .fd-act-title { font-size: 12px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fd-act-date { font-size: 10px; color: ${F.muted}; margin-top: 1px; }
        .fd-act-amt { font-size: 12px; font-weight: 700; font-family: inherit; flex-shrink: 0; }
        /* ── Litter history grid ── */
        .fd-litter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .fd-litter-card { display: flex; flex-direction: column; }
        .fd-litter-card-head { padding: 16px; border-bottom: 1px solid ${F.line}; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .fd-litter-parents-stack { display: flex; }
        .fd-litter-parents-stack > div:last-child { margin-left: -8px; }
        .fd-litter-card-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
        .fd-status-tag { font-size: 9px; font-weight: 700; padding: 3px 9px; border-radius: 8px; white-space: nowrap; }
        .fd-kitten-avatars { display: flex; flex-wrap: wrap; gap: 4px; }
        .fd-kitten-avatar { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; background: ${F.line}; border: 1px solid ${F.lineMid}; display: flex; align-items: center; justify-content: center; font-size: 10px; }
        .fd-kitten-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fd-roi-row { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid ${F.line}; }
        .fd-roi-items { display: flex; gap: 16px; }
        .fd-roi-label { font-size: 8px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; }
        .fd-roi-val { font-size: 12px; font-weight: 700; font-family: inherit; }
        .fd-roi-arrow { width: 30px; height: 30px; border-radius: 50%; background: #FAFAFA; color: ${F.muted}; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all .15s; flex-shrink: 0; }
        .fd-roi-arrow:hover { background: ${F.pink}; color: white; }
        /* ── Directory ── */
        .fd-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .fd-filter-icon { background: ${F.pinkSoft}; color: ${F.pink}; padding: 8px; border-radius: 10px; display: flex; }
        .fd-select { background: white; border: 1px solid ${F.lineMid}; font-size: 12px; font-weight: 600; color: ${F.inkSoft}; padding: 8px 12px; border-radius: 12px; outline: none; cursor: pointer; transition: all .15s; font-family: inherit; }
        .fd-select:focus { border-color: ${F.pinkBorder}; }
        .fd-dir-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .fd-pet-card { background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 14px; display: flex; align-items: center; gap: 12px; text-decoration: none; transition: all .2s; }
        .fd-pet-card:hover { border-color: ${F.pinkBorder}; box-shadow: 0 4px 16px rgba(232,70,119,.08); transform: translateY(-1px); }
        .fd-pet-img { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1px solid ${F.line}; background: #FAFAFA; display: flex; align-items: center; justify-content: center; font-size: 20px; }
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
        .fd-empty { background: white; border: 1px dashed ${F.lineMid}; border-radius: 16px; padding: 32px; text-align: center; color: ${F.muted}; font-size: 13px; font-weight: 600; }
        @media (max-width: 900px) {
          .fd-finance-grid { grid-template-columns: 1fr; }
          .fd-mid-grid { grid-template-columns: 1fr; }
          .fd-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .fd-litter-grid { grid-template-columns: repeat(2, 1fr); }
          .fd-dir-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .fd-body { padding: 16px 16px 60px; gap: 18px; }
          .fd-farm-name { font-size: 21px; }
          .fd-id-actions { width: 100%; }
          .fd-id-actions .fd-btn-add { flex: 1; justify-content: center; }
          .fd-litter-grid { grid-template-columns: 1fr; }
          .fd-dir-grid { grid-template-columns: 1fr; }
          .fd-litter-row { gap: 12px; }
          .fd-litter-actions { width: 100%; justify-content: flex-end; }
          .fd-donut-wrap { flex-direction: column; }
        }
        @media (max-width: 400px) {
          .fd-kpi-grid { grid-template-columns: 1fr 1fr; }
          .fd-kpi-value { font-size: 26px; }
        }
      `}</style>

      <div className="fd-page">
        <div className="fd-body">
          {/* ── Farm Identity Header ── */}
          <div className="fd-id-card">
            <div className="fd-id-left">
              <button onClick={handleBackToParent} className="fd-back" aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div className="fd-farm-avatar">{farm.image_url ? <img src={farm.image_url} alt={farm.farm_name} /> : '🏠'}</div>
              <div style={{ minWidth: 0 }}>
                <h1 className="fd-farm-name">{farm.farm_name} <Icon.Verified /></h1>
                <p className="fd-farm-meta">{farm.bio || `ฟาร์ม${speciesTh(farm.species) || 'สัตว์เลี้ยง'}`} · {allPets.length} ตัว</p>
              </div>
            </div>
            <div className="fd-id-actions">
              <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} className="fd-btn-add ghost"><Icon.Plus /> เพิ่มทีละตัว</Link>
              <Link href={`/farm-dashboard/${farmId}/pets/bulk-create?from=${fromPage}`} className="fd-btn-add"><Icon.Plus /> เพิ่มหลายตัว</Link>
            </div>
          </div>

          {/* ── Finance: expense card + donut ── */}
          <section>
            <div className="fd-section-head"><h2 className="fd-section-title"><Icon.Wallet /> สรุปภาพรวมการเงิน</h2></div>
            <div className="fd-finance-grid">
              <div className="fd-expense-card">
                <div className="fd-expense-icon"><Icon.Wallet /></div>
                <div className="fd-expense-label">ค่าใช้จ่ายเดือนนี้</div>
                <div className="fd-expense-sub">{monthLabel}</div>
                <div className="fd-expense-amount">฿{monthExpenseTotal.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: F.muted }}>รายจ่ายสะสมทั้งหมด ฿{expense.toLocaleString()}</div>
              </div>
              <div className="fd-card fd-donut-card">
                <div className="fd-donut-title">หมวดหมู่ค่าใช้จ่าย</div>
                {categoryList.length === 0 ? (
                  <div className="fd-donut-wrap">
                    <div className="fd-donut-empty">ยังไม่มี<br/>ข้อมูล</div>
                    <div className="fd-legend"><span style={{ fontSize: '12px', color: F.muted }}>เริ่มบันทึกรายจ่ายเพื่อดูสัดส่วนหมวดหมู่</span></div>
                  </div>
                ) : (
                  <div className="fd-donut-wrap">
                    <div className="fd-donut" style={{ background: `conic-gradient(${conicSegments})` }} />
                    <div className="fd-legend">
                      {categoryList.map((c, i) => (
                        <div key={i} className="fd-legend-row">
                          <span className="fd-legend-dot" style={{ background: c.color }} />
                          <span className="fd-legend-name">{c.name}</span>
                          <span className="fd-legend-pct">{categoryTotal > 0 ? Math.round((c.amount / categoryTotal) * 100) : 0}%</span>
                          <span className="fd-legend-amt">{c.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── KPI with gender breakdown ── */}
          <section>
            <div className="fd-section-head"><h2 className="fd-section-title"><Icon.Paw /> จำนวนสัตว์เลี้ยงทั้งหมด</h2></div>
            <div className="fd-kpi-grid">
              <div className="fd-kpi">
                <div className="fd-kpi-top"><div className="fd-kpi-emoji" style={{ background: '#F3E8FF' }}>🐱</div><div className="fd-kpi-label">พ่อแม่พันธุ์</div></div>
                <div className="fd-kpi-value" style={{ color: '#7C3AED' }}>{breeders.length}</div>
                <div className="fd-kpi-gender"><span className="f"><Icon.Female /> {breedersG.f}</span><span className="m"><Icon.Male /> {breedersG.m}</span></div>
              </div>
              <div className="fd-kpi">
                <div className="fd-kpi-top"><div className="fd-kpi-emoji" style={{ background: '#DCFCE7' }}>🏠</div><div className="fd-kpi-label">พร้อมย้ายบ้าน</div></div>
                <div className="fd-kpi-value" style={{ color: '#16A34A' }}>{readyMove.length}</div>
                <div className="fd-kpi-gender"><span className="m"><Icon.Male /> {readyG.m}</span><span className="f"><Icon.Female /> {readyG.f}</span></div>
              </div>
              <div className="fd-kpi">
                <div className="fd-kpi-top"><div className="fd-kpi-emoji" style={{ background: '#FEF3C7' }}>✂️</div><div className="fd-kpi-label">ทำหมันแล้ว</div></div>
                <div className="fd-kpi-value" style={{ color: '#D97706' }}>{neutered.length}</div>
                <div className="fd-kpi-gender"><span className="m"><Icon.Male /> {neuteredG.m}</span><span className="f"><Icon.Female /> {neuteredG.f}</span></div>
              </div>
              <div className="fd-kpi">
                <div className="fd-kpi-top"><div className="fd-kpi-emoji" style={{ background: F.pinkSoft }}>🐾</div><div className="fd-kpi-label">รวมทั้งหมด</div></div>
                <div className="fd-kpi-value" style={{ color: F.pink }}>{allPets.length}</div>
                <div className="fd-kpi-gender"><span className="total">{speciesTh(farm.species) || 'สัตว์'}ทั้งหมด</span></div>
              </div>
            </div>
          </section>

          {/* ── Breeding tracker ── */}
          <section>
            <div className="fd-section-head">
              <h2 className="fd-section-title"><span>💕</span> ติดตามสถานะการจับคู่บรีด</h2>
              <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="fd-link-pill"><Icon.Plus /> บันทึกผสมพันธุ์</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeLitters.length === 0 ? (
                <div className="fd-empty">ยังไม่มีครอกที่รอคลอด</div>
              ) : activeLitters.map((litter) => {
                const progress = calculatePregnancyProgress(litter.mating_date, litter.expected_birth_date);
                const isDue = progress >= 100;
                const daysLeft = calculateDaysLeft(litter.expected_birth_date);
                return (
                  <div key={litter.id} className="fd-card fd-litter-row">
                    <div className="fd-litter-code">
                      <div className="fd-litter-code-label">Litter</div>
                      <div className="fd-litter-code-val">{litter.litter_code || 'TBA'}</div>
                    </div>
                    <div className="fd-parents">
                      <div className="fd-parent-img fd-parent-sire">{litter.sire?.image_url ? <img src={litter.sire.image_url} /> : 'พ่อ'}</div>
                      <span style={{ fontSize: '11px' }}>❤️</span>
                      <div className="fd-parent-img fd-parent-dam">{litter.dam?.image_url ? <img src={litter.dam.image_url} /> : 'แม่'}</div>
                    </div>
                    <div className="fd-progress-wrap">
                      <div className="fd-progress-top">
                        <span style={{ color: F.muted }}>คาดคลอด: <span style={{ color: F.inkSoft }}>{fmtDate(litter.expected_birth_date)}</span></span>
                        <span style={{ color: isDue ? '#EF4444' : F.ink }}>{daysLeft} <span style={{ color: F.muted, fontWeight: 500 }}>({progress}%)</span></span>
                      </div>
                      <div className="fd-progress-bar"><div className="fd-progress-fill" style={{ width: `${progress}%`, background: isDue ? '#EF4444' : F.pink }} /></div>
                    </div>
                    <div className="fd-litter-actions">
                      <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-btn-ghost">รายละเอียด</Link>
                      <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}/birth?from=${fromPage}`} className="fd-btn-birth" style={{ background: isDue ? '#EF4444' : F.pink }}>{isDue ? '🔥 บันทึกคลอด!' : 'บันทึกคลอด'}</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Summary + Recent Activity ── */}
          <section>
            <div className="fd-mid-grid">
              <div className="fd-card fd-summary-card">
                <div className="fd-summary-icon"><Icon.Layers /></div>
                <div className="fd-summary-big">{allLitters.length} ครอก</div>
                <div className="fd-summary-sub">
                  คลอดแล้ว <b>{bornLitters.length}</b> ครอก · กำลังตั้งท้อง <b>{activeLitters.length}</b> ครอก<br/>
                  กำไรสุทธิรวม <b style={{ color: netProfit >= 0 ? F.pink : '#DC2626' }}>{netProfit >= 0 ? '' : '-'}฿{Math.abs(netProfit).toLocaleString()}</b>
                </div>
              </div>
              <div className="fd-card fd-activity-card">
                <div className="fd-section-title" style={{ fontSize: '15px', marginBottom: '10px' }}><Icon.Activity /> กิจกรรมล่าสุดในฟาร์ม</div>
                {recentActivity.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: F.muted, fontSize: '12px' }}>ยังไม่มีกิจกรรม</div>
                ) : recentActivity.map(a => (
                  <div key={a.id} className="fd-act-row">
                    <div className="fd-act-dot" style={{ background: a.type === 'litter' ? F.pinkSoft : a.type === 'income' ? '#DCFCE7' : '#FEE2E2', color: a.type === 'litter' ? F.pink : a.type === 'income' ? '#16A34A' : '#DC2626' }}>
                      {a.type === 'litter' ? '🍼' : a.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div className="fd-act-info">
                      <div className="fd-act-title">{a.title}</div>
                      <div className="fd-act-date">{fmtDate(a.date)}</div>
                    </div>
                    {a.amount !== null && <div className="fd-act-amt" style={{ color: a.amount >= 0 ? '#16A34A' : '#DC2626' }}>{a.amount >= 0 ? '+' : ''}{a.amount.toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Litter history & ROI ── */}
          <section>
            <div className="fd-section-head"><h2 className="fd-section-title"><span>📈</span> ประวัติครอก & ผลประกอบการ</h2></div>
            <div className="fd-litter-grid">
              {allLitters.length === 0 ? (
                <div className="fd-empty" style={{ gridColumn: '1 / -1' }}>ยังไม่มีประวัติการบรีด 🐾</div>
              ) : allLitters.map(litter => {
                const litterKittens = allPets.filter(p => p.litter_id === litter.id);
                const litterTxs = transactions.filter(t => t.litter_id === litter.id);
                const litterIncome = litterTxs.filter(t => t.transaction_type === 'income').reduce((a, b) => a + Number(b.amount), 0);
                const litterExpense = litterTxs.filter(t => t.transaction_type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
                const litterProfit = litterIncome - litterExpense;
                const isBorn = litter.status !== "รอคลอด";
                return (
                  <div key={litter.id} className="fd-card fd-litter-card">
                    <div className="fd-litter-card-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="fd-litter-parents-stack">
                          <div className="fd-parent-img fd-parent-sire" style={{ border: '2px solid white' }}>{litter.sire?.image_url ? <img src={litter.sire.image_url} /> : '♂'}</div>
                          <div className="fd-parent-img fd-parent-dam" style={{ border: '2px solid white' }}>{litter.dam?.image_url ? <img src={litter.dam.image_url} /> : '♀'}</div>
                        </div>
                        <div>
                          <p style={{ fontFamily: 'Prompt, sans-serif', fontSize: '14px', fontWeight: 700, color: F.ink }}>{litter.litter_code || 'N/A'}</p>
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
                            {litterKittens.map(k => (<div key={k.id} className="fd-kitten-avatar" title={k.name}>{k.image_url ? <img src={k.image_url} /> : '🐾'}</div>))}
                            {litterKittens.length === 0 && <span style={{ fontSize: '10px', color: '#D1D5DB' }}>ยังไม่มีข้อมูล</span>}
                          </div>
                        </div>
                      )}
                      <div className="fd-roi-row" style={{ marginTop: isBorn ? 0 : 'auto' }}>
                        <div className="fd-roi-items">
                          <div><div className="fd-roi-label">รายรับ</div><div className="fd-roi-val" style={{ color: '#16A34A' }}>{litterIncome.toLocaleString()}</div></div>
                          <div><div className="fd-roi-label">ต้นทุน</div><div className="fd-roi-val" style={{ color: '#EF4444' }}>{litterExpense.toLocaleString()}</div></div>
                          <div><div className="fd-roi-label">กำไรสุทธิ</div><div className="fd-roi-val" style={{ color: litterProfit >= 0 ? F.pink : F.muted }}>{litterProfit > 0 ? '+' : ''}{litterProfit.toLocaleString()}</div></div>
                        </div>
                        <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="fd-roi-arrow"><Icon.ChevronRight /></Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Farm Directory ── */}
          <section>
            <div className="fd-section-head">
              <div>
                <h2 className="fd-section-title"><Icon.Users /> Farm Directory</h2>
                <p style={{ fontSize: '11px', fontWeight: 600, color: F.muted, marginTop: '4px' }}>สมาชิกทั้งหมด ({filteredPets.length} ตัว)</p>
              </div>
              <div className="fd-filters">
                <div className="fd-filter-icon"><Icon.Filter /></div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="fd-select">
                  <option value="">ทุกสถานะ</option>
                  <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อแม่พันธุ์</option>
                  <option value="เด็ก">เด็กๆ (Baby)</option>
                  <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
                  <option value="ติดจอง">ติดจอง</option>
                  <option value="ทำหมัน / ปลดระวาง">ปลดระวาง</option>
                </select>
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="fd-select">
                  <option value="">ทุกเพศ</option>
                  <option value="male">ตัวผู้ (Male)</option>
                  <option value="female">ตัวเมีย (Female)</option>
                </select>
                <select value={filterBreed} onChange={(e) => setFilterBreed(e.target.value)} className="fd-select" style={{ maxWidth: '130px' }}>
                  <option value="">ทุกสายพันธุ์</option>
                  {uniqueBreeds.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {filteredPets.length === 0 ? (
              <div className="fd-empty">ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา</div>
            ) : (
              <div className="fd-dir-grid">
                {filteredPets.map(pet => {
                  const isMale = isMaleFn(pet.gender);
                  const breedName = pet.breed ? pet.breed.split('(')[0].trim() : "ไม่ระบุ";
                  return (
                    <Link key={pet.id} href={`/pets/${pet.id}`} className="fd-pet-card">
                      <div className="fd-pet-img">{pet.image_url ? <img src={pet.image_url} /> : '🐾'}</div>
                      <div className="fd-pet-info">
                        <div className="fd-pet-name">{pet.name}</div>
                        <div className="fd-pet-breed">{breedName}</div>
                        <div className="fd-pet-tags">
                          <span className={`fd-tag ${isMale ? 'fd-tag-male' : 'fd-tag-female'}`}>{isMale ? <Icon.Male /> : <Icon.Female />} {isMale ? 'M' : 'F'}</span>
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
        </div>
      </div>
    </>
  );
}

export default function FarmDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" /></div>}>
      <FarmDashboardContent />
    </Suspense>
  );
}