"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { getGestationConfig } from "@/lib/species";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';
import { useFarmAccess } from "@/app/farm-dashboard/[id]/layout";
import { useFarmOnboardingProgress } from "@/app/hooks/useFarmOnboardingProgress";
import { summarizeFarmSteps } from "@/lib/onboarding/farmSteps";
import { FARM_ONBOARDING_TH } from "@/app/components/onboarding/strings";
import { trackOnboardingEvent } from "@/app/components/onboarding/events";
import WelcomeOnboardingCard from "@/app/components/onboarding/WelcomeOnboardingCard";
import OnboardingChecklist, { type OnboardingPhase } from "@/app/components/onboarding/OnboardingChecklist";
import OnboardingSuccessCard from "@/app/components/onboarding/OnboardingSuccessCard";
import { deriveTasks } from "@/lib/farmDashboard/deriveTasks";
import { buildAttentionList } from "@/lib/farmDashboard/smartLists";
import { deriveInsights } from "@/lib/farmDashboard/insights";
import type { FarmDashboardSummary } from "@/lib/farmDashboard/types";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { PET_STATUS } from "@/lib/constants";
import TodaysTasks from "@/app/farm-dashboard/[id]/components/TodaysTasks";
import QuickActionsBar from "@/app/farm-dashboard/[id]/components/QuickActionsBar";
import BusinessOverview from "@/app/farm-dashboard/[id]/components/BusinessOverview";
import AttentionList from "@/app/farm-dashboard/[id]/components/AttentionList";
import BreedingOperations from "@/app/farm-dashboard/[id]/components/BreedingOperations";
import BusinessInsights from "@/app/farm-dashboard/[id]/components/BusinessInsights";
import NotificationRail from "@/app/farm-dashboard/[id]/components/NotificationRail";
import CoverIdentityHeader from "@/app/farm-dashboard/[id]/components/CoverIdentityHeader";
import ImageCropModal from "@/app/farm-dashboard/[id]/components/ImageCropModal";

const FARM_ONBOARDING_PHASES: OnboardingPhase[] = [
  { title: FARM_ONBOARDING_TH.phase1Title, keys: ["farm_info", "farm_image", "privacy"] },
  { title: FARM_ONBOARDING_TH.phase2Title, keys: ["first_farm_pet", "breeder_pet", "first_litter"] },
  { title: FARM_ONBOARDING_TH.phase3Title, keys: ["data_check", "ready_to_reserve", "view_share_farm"] },
];
const OWNER_MANAGER_ONLY_STEPS = ["farm_info", "farm_image", "privacy"];

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
  Male:         () => <img src="/icons/icon-men.png" alt="male" style={{width:18,height:18,objectFit:'contain'}} />,
  Female:       () => <img src="/icons/icon-women.png" alt="female" style={{width:18,height:18,objectFit:'contain'}} />,
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
  const [summary,      setSummary]      = useState<FarmDashboardSummary | null>(null);
  const [latestVerificationStatus, setLatestVerificationStatus] = useState<string | null>(null);
  const [latestVerificationNote, setLatestVerificationNote] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);

  const [uploadingCover,  setUploadingCover]  = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Crop state
  const [cropSrc,      setCropSrc]      = useState<string | null>(null);
  const [cropType,     setCropType]     = useState<"avatar" | "cover" | null>(null);
  const [cropUploading, setCropUploading] = useState(false);

  const { myRole } = useFarmAccess();
  const farmOnboarding = useFarmOnboardingProgress(farmId ? Number(farmId) : null);
  const farmSummary = useMemo(() => summarizeFarmSteps(farmOnboarding.steps), [farmOnboarding.steps]);
  const onboardingCtaDisabledKeys = useMemo(() => {
    if (myRole === "viewer") return farmOnboarding.steps.map((s) => s.key);
    if (myRole === "staff") return OWNER_MANAGER_ONLY_STEPS;
    return [];
  }, [myRole, farmOnboarding.steps]);

  useEffect(() => {
    if (!farmId) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: farmData } = await supabase
        .from('farms').select('*').eq('id', farmId).eq('user_id', session.user.id).single();
      if (!farmData) { router.push('/partner'); return; }
      setFarm(farmData);

      // farms.verification_status stays 'pending' even when the latest request has been marked
      // 'needs_more_info' by an admin (only farm_verifications.status changes) — fetch the real
      // latest status directly so the owner doesn't just see a generic "we're reviewing" badge
      // with no way back to /verify.
      // Runs in parallel with the dashboard summary RPC — both only depend on farmData, which is
      // already resolved above.
      const [verificationRes, summaryRes] = await Promise.all([
        !farmData.is_verified
          ? supabase
              .from('farm_verifications')
              .select('status, admin_note')
              .eq('farm_id', farmId)
              .eq('user_id', session.user.id)
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.rpc('get_farm_dashboard_summary', { p_farm_id: Number(farmId) }),
      ]);

      if (!farmData.is_verified) {
        setLatestVerificationStatus(verificationRes.data?.status ?? null);
        setLatestVerificationNote(verificationRes.data?.admin_note ?? null);
      }
      if (summaryRes.error) {
        console.error('get_farm_dashboard_summary error:', summaryRes.error);
      } else {
        setSummary(summaryRes.data as FarmDashboardSummary);
      }

      trackEvent({ eventName: 'dashboard_opened', entityType: 'farm', entityId: farmId, farmId: Number(farmId) });

      setLoading(false);
    };
    load();
  }, [farmId, router]);

  /* ── Derived ── */
  const pets = summary?.pets ?? [];
  const litters = summary?.litters ?? [];
  const activeLitters = litters
    .filter(l => l.status === 'รอคลอด')
    .sort((a, b) => {
      const sa = deriveLitterStatus(a, a.dam?.species || farm?.pet_type);
      const sb = deriveLitterStatus(b, b.dam?.species || farm?.pet_type);
      return STATUS_URGENCY[sa.status] - STATUS_URGENCY[sb.status];
    });

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

  /* ── All Tasks (unified, deduped) — derived from the RPC summary, see lib/farmDashboard/deriveTasks ── */
  const allTasks = useMemo(() => summary ? deriveTasks(summary, farmId) : [], [summary, farmId]);

  /* ── Farm Overview stats ── */
  const pregnantDamIds = new Set(activeLitters.map((l: any) => l.dam_id).filter(Boolean));
  const sires    = pets.filter(p => p.status === 'พ่อพันธุ์ / แม่พันธุ์' && (p.gender === 'male' || p.gender === 'ตัวผู้')).length;
  const dams     = pets.filter(p => p.status === 'พ่อพันธุ์ / แม่พันธุ์' && (p.gender === 'female' || p.gender === 'ตัวเมีย') && !pregnantDamIds.has(p.id)).length;
  const reserved = pets.filter(p => p.status === 'ติดจอง').length;
  const openReserve = pets.filter(p => p.status === PET_STATUS.OPEN_RESERVE).length;
  const available    = pets.filter(p => p.status === PET_STATUS.AVAILABLE).length;

  /* ── Animals Requiring Attention ── */
  const attentionItems = useMemo(
    () => summary ? buildAttentionList(summary.pets, summary.latest_weights) : [],
    [summary]
  );

  /* ── Business Insights ── */
  const insights = useMemo(
    () => summary ? deriveInsights(summary, { sires, dams, activeBreedingPairs: activeLitters.length }, farmId) : [],
    [summary, sires, dams, activeLitters.length, farmId]
  );

  /* ── Finance ── */
  /* ── Pregnancy progress ── */
  const calcPct = (mating: string, expected: string) => {
    const s = new Date(mating).getTime(), e = new Date(expected).getTime(), n = Date.now();
    if (n >= e) return 100; if (n <= s) return 0;
    return Math.round(((n - s) / (e - s)) * 100);
  };

  const onImageSelected = (dataUrl: string, type: "avatar" | "cover") => {
    setCropSrc(dataUrl);
    setCropType(type);
  };

  const cancelCrop = () => {
    setCropSrc(null); setCropType(null);
  };

  const confirmCrop = async (blob: Blob) => {
    if (!cropType) return;
    const isAvatar = cropType === "avatar";
    if (isAvatar) setUploadingAvatar(true); else setUploadingCover(true);
    setCropUploading(true);
    try {
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

  if (loading) return <PageLoader />;
  if (!farm)   return null;

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }

        .fd-page { font-family:inherit; min-height:100vh; color:${F.ink}; background:${F.bg}; padding-bottom:calc(68px + env(safe-area-inset-bottom,0px) + 24px); }

        /* ─── 1. Cover + Identity Header ─── */
        .fd-cover { position:relative; height:168px; margin:0 -16px; background:linear-gradient(135deg,${F.pink} 0%,#f06d98 55%,#f8a5c2 100%); overflow:hidden; z-index:0; }
        .fd-cover img.fd-cover-img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
        .fd-cover-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,.22),transparent 50%); }
.fd-cover-cam { position:absolute; bottom:10px; right:14px; z-index:2; width:34px; height:34px; border-radius:999px; background:rgba(0,0,0,.42); display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; color:white; }
        .fd-cover-spin { position:absolute; inset:0; background:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; z-index:3; font-size:13px; font-weight:600; color:${F.pink}; }

        .fd-identity { padding:0 0 14px; }
        .fd-id-row { position:relative; z-index:1; display:flex; align-items:center; gap:12px; margin-top:8px; padding-bottom:12px; }
        .fd-avatar-wrap { position:relative; flex-shrink:0; }
        .fd-avatar { width:86px; height:86px; border-radius:50%; border:3.5px solid white; overflow:hidden; background:${F.pinkSoft}; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,0,0,.13); cursor:pointer; position:relative; }
        .fd-avatar img { width:100%; height:100%; object-fit:cover; }
        .fd-avatar-edit { position:absolute; bottom:2px; right:0px; width:26px; height:26px; background:white; border-radius:999px; border:2px solid ${F.line}; color:${F.pink}; display:flex; align-items:center; justify-content:center; pointer-events:none; box-shadow:0 2px 8px rgba(0,0,0,.1); z-index:2; }
        .fd-avatar-spin { position:absolute; inset:0; background:rgba(255,255,255,.6); border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:1; }
        .fd-id-main { flex:1; min-width:0; display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
        .fd-id-text { flex:1; min-width:0; }
        .fd-name { font-size:20px; font-weight:700; color:${F.ink}; line-height:1.2; display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:0 0 2px; }
        .fd-name img { width:18px; height:18px; object-fit:contain; flex-shrink:0; }
        .fd-tagline { font-size:13px; color:${F.muted}; font-weight:400; }
        .fd-view-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:500; background:#F3F4F6; color:${F.inkSoft}; text-decoration:none; transition:background .15s; border:none; cursor:pointer; }
        .fd-view-btn:hover { background:#E5E7EB; }
        .fd-edit-icon { flex-shrink:0; display:flex; align-items:center; justify-content:center; text-decoration:none; opacity:1; transition:opacity .15s; }
        .fd-edit-icon:active { opacity:.6; }

        .fd-prog-bar { display:flex; align-items:center; gap:6px; margin-top:5px; }
        .fd-prog-track { flex:1; height:5px; background:${F.line}; border-radius:10px; overflow:hidden; }
        .fd-prog-fill  { height:100%; border-radius:10px; background:${F.pink}; transition:width 1s ease; }
        .fd-prog-text  { font-size:11px; font-weight:600; color:${F.pink}; white-space:nowrap; }

        .fd-verify-btn { display:flex; align-items:center; gap:8px; margin:12px 12px 0; padding:11px 14px; border-radius:12px; background:${F.pinkSoft}; border:1.5px dashed ${F.pinkBorder}; text-decoration:none; cursor:pointer; transition:all .15s; }
        .fd-verify-btn:hover { background:#fde7ef; border-color:${F.pink}; }
        .fd-verify-btn img { width:28px; height:28px; object-fit:contain; }
        .fd-verify-btn-text { flex:1; }
        .fd-verify-btn-title { font-size:13px; font-weight:600; color:${F.pink}; }
        .fd-verify-btn-sub { font-size:11px; color:${F.muted}; font-weight:400; }
        .fd-pending-badge { display:flex; align-items:center; gap:8px; margin:12px 12px 0; padding:10px 14px; border-radius:12px; background:#FFFBEB; border:1px solid #FDE68A; font-size:12px; font-weight:400; color:#92400E; }

        /* ─── Content wrapper ─── */
        .fd-body { padding:12px 12px 0; display:flex; flex-direction:column; gap:10px; max-width:640px; margin:0 auto; }
        @media (min-width:900px) { .fd-body { max-width:1100px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; padding:16px 16px 0; align-items:start; }
          .fd-full-width { grid-column:1/-1; } }

        /* ─── Section base ─── */
        .fd-sec { background:white; border:1px solid ${F.line}; border-radius:14px; padding:14px; }
        .fd-sec-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
        .fd-sec-title { display:flex; align-items:center; gap:7px; }
        .fd-sec-title img { width:26px; height:26px; object-fit:contain; }
        .fd-sec-h { margin:0; font-size:14px; font-weight:600; color:${F.ink}; }
        .fd-sec-badge { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; border-radius:8px; font-size:9px; font-weight:700; padding:0 4px; }
        .fd-link-sm { color:${F.pink}; font-size:11px; font-weight:500; text-decoration:none; display:inline-flex; align-items:center; gap:2px; }
        .fd-link-sm:hover { text-decoration:underline; }

        /* ─── 2. Today / Action Center ─── */
        .fd-task-row { display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:9px; margin-bottom:5px; }
        .fd-task-row:last-child { margin-bottom:0; }
        .fd-task-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-task-icon img { width:24px; height:24px; object-fit:contain; }
        .fd-task-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .fd-task-msg { flex:1; font-size:12px; font-weight:400; color:${F.ink}; line-height:1.4; min-width:0; }
        .fd-task-btn { font-size:10px; font-weight:600; padding:3px 9px; border-radius:7px; text-decoration:none; white-space:nowrap; flex-shrink:0; border:none; cursor:pointer; font-family:inherit; }
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
        .fd-today-empty { font-size:12px; color:${F.green}; font-weight:400; display:flex; align-items:center; gap:6px; }
        .fd-today-empty img { width:18px; height:18px; object-fit:contain; }
        .fd-show-more { margin-top:8px; font-size:11px; font-weight:500; color:${F.pink}; background:none; border:none; cursor:pointer; font-family:inherit; padding:4px 0; }

        /* ─── 3. Farm Overview ─── */
        .fd-ov-grid { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
        .fd-ov-stat { flex:0 0 calc((100% - 16px) / 3); }
        @media (max-width:360px) { .fd-ov-stat { flex-basis:calc((100% - 8px) / 2); } }
        @media (min-width:600px) { .fd-ov-stat { flex-basis:calc((100% - 32px) / 5); } }
        .fd-ov-stat { border-radius:10px; padding:12px 8px 10px; cursor:pointer; text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:3px; transition:all .15s; border:1.5px solid transparent; }
        .fd-ov-stat:hover { border-color:rgba(232,70,119,.2); transform:translateY(-1px); }
        .fd-ov-count { font-size:22px; font-weight:700; line-height:1; }
        .fd-ov-label { font-size:9px; font-weight:500; color:${F.inkSoft}; line-height:1.3; text-align:center; }
        .fd-ov-icon  { width:44px; height:44px; object-fit:contain; margin-bottom:4px; }

        /* ─── 4. Pregnancy Tracking Card ─── */
        .ptc { position:relative; border:1px solid ${F.line}; border-radius:14px; overflow:hidden; margin-bottom:10px; background:white; box-shadow:0 1px 4px rgba(31,26,28,.06); }
        .ptc:last-child { margin-bottom:0; }
        .ptc-accent { position:absolute; left:0; top:0; bottom:0; width:4px; border-radius:14px 0 0 14px; }
        .ptc-inner { padding:12px 13px 13px 17px; }
        .ptc-header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:9px; }
        .ptc-code { font-size:15px; font-weight:700; color:${F.ink}; flex-shrink:0; letter-spacing:-.01em; }
        .ptc-badge { font-size:9px; font-weight:600; padding:3px 9px; border-radius:20px; white-space:nowrap; letter-spacing:.02em; }
        .ptc-parents { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .ptc-avatars { display:flex; flex-shrink:0; }
        .ptc-av { width:28px; height:28px; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 0 1px ${F.line}; }
        .ptc-av + .ptc-av { margin-left:-8px; }
        .ptc-av img { width:100%; height:100%; object-fit:cover; }
        .ptc-av-sire { background:#DBEAFE; color:#2563EB; font-size:9px; }
        .ptc-av-dam  { background:#FCE7F3; color:#DB2777; font-size:9px; }
        .ptc-pair-name { font-size:11px; font-weight:400; color:${F.inkSoft}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
        .ptc-divider { height:1px; background:${F.line}; margin:0 0 10px; }
        .ptc-summary { margin-bottom:10px; }
        .ptc-main { font-size:14px; font-weight:600; color:${F.ink}; line-height:1.3; margin-bottom:2px; }
        .ptc-sub  { font-size:11px; font-weight:400; color:${F.muted}; line-height:1.4; margin-bottom:4px; }
        .ptc-dates { font-size:10px; color:${F.muted}; font-weight:400; }
        .ptc-timeline { display:flex; align-items:flex-start; gap:0; margin-bottom:12px; }
        .ptc-stage { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; }
        .ptc-stage-row { display:flex; align-items:center; width:100%; }
        .ptc-stage-dot { width:16px; height:16px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; border:2px solid currentColor; transition:all .2s; }
        .ptc-stage-line { flex:1; height:2px; background:currentColor; }
        .ptc-stage-label { font-size:8.5px; font-weight:500; margin-top:4px; text-align:center; line-height:1.3; width:100%; }
        .ptc-actions { display:flex; gap:8px; }
        .ptc-btn-ghost { flex:1; padding:8px 10px; border-radius:9px; background:#FAFAFA; color:${F.inkSoft}; font-size:11px; font-weight:500; border:1px solid ${F.lineMid}; text-decoration:none; text-align:center; cursor:pointer; transition:background .15s; display:block; }
        .ptc-btn-ghost:hover { background:#F3F4F6; }
        .ptc-btn-primary { flex:2; padding:8px 12px; border-radius:9px; color:white; font-size:11px; font-weight:600; text-decoration:none; text-align:center; cursor:pointer; border:none; display:block; transition:filter .15s; }
        .ptc-btn-primary:hover { filter:brightness(1.08); }
        .ptc-missing { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 0; }
        .ptc-missing-text { font-size:12px; color:${F.muted}; font-weight:400; }
        .ptc-missing-btn { font-size:11px; font-weight:500; color:${F.pink}; background:${F.pinkSoft}; border:1px solid ${F.pinkBorder}; padding:5px 12px; border-radius:8px; text-decoration:none; white-space:nowrap; }

        /* ─── 5. Finance ─── */

        /* ─── Misc ─── */
        .fd-empty-sm { font-size:11px; color:${F.muted}; font-weight:400; text-align:center; padding:8px 0; }
        .fd-link-pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:500; color:${F.pink}; background:${F.pinkSoft}; border:1px solid ${F.pinkBorder}; padding:5px 12px; border-radius:16px; text-decoration:none; transition:all .15s; }
        .fd-link-pill:hover { background:#fde7ef; }

        @media (max-width:600px) { .fd-body { padding:8px 8px 0; gap:8px; } }
        @media (prefers-reduced-motion:reduce) { .fd-hdr, .fd-sec { animation:none!important; transition:none!important; } }
      `}</style>

      {/* ── Crop modal ── */}
      {cropSrc && cropType && (
        <ImageCropModal
          cropSrc={cropSrc}
          cropType={cropType}
          uploading={cropUploading}
          onCancel={cancelCrop}
          onConfirm={confirmCrop}
        />
      )}

      <div className="fd-page">

        {/* ════════════════════════════════
            1. Cover + Identity Header
        ════════════════════════════════ */}
        <CoverIdentityHeader
          farm={farm}
          farmId={farmId}
          farmCompletion={farmCompletion}
          uploadingCover={uploadingCover}
          uploadingAvatar={uploadingAvatar}
          latestVerificationStatus={latestVerificationStatus}
          latestVerificationNote={latestVerificationNote}
          onImageSelected={onImageSelected}
        />

        <div className="fd-body">

          {/* ════════════════════════════════
              1.5 Farm Onboarding
          ════════════════════════════════ */}
          {!farmOnboarding.loading && farmOnboarding.steps.length > 0 && myRole !== "viewer" && (
            <section className="fd-sec" style={{ marginBottom: 14 }}>
              {!farmOnboarding.progressRow?.dismissed_welcome_at && !farmOnboarding.progressRow?.completed_at && (
                <div style={{ marginBottom: 14 }}>
                  <WelcomeOnboardingCard
                    title={FARM_ONBOARDING_TH.welcomeTitle}
                    body={FARM_ONBOARDING_TH.welcomeBody}
                    primaryLabel={FARM_ONBOARDING_TH.primaryCta}
                    secondaryLabel={FARM_ONBOARDING_TH.secondaryCta}
                    onPrimary={() => {
                      trackOnboardingEvent({ event: "onboarding_started", onboardingType: "farm", workspaceId: farmId });
                      farmOnboarding.dismissWelcome();
                      router.push(`/farm-dashboard/${farmId}/edit`);
                    }}
                    onSecondary={() => farmOnboarding.dismissWelcome()}
                    onDismiss={() => farmOnboarding.dismissWelcome()}
                  />
                </div>
              )}

              {farmSummary.allDone && (
                <div style={{ marginBottom: 14 }}>
                  <OnboardingSuccessCard message={FARM_ONBOARDING_TH.completeSuccess} />
                  {!farm.is_verified && (
                    <Link href={`/farm-dashboard/${farmId}/verify`} className="fd-verify-btn" style={{ marginTop: 10 }}>
                      <img src="/icons/icon-non-verified.png" alt="" />
                      <div className="fd-verify-btn-text">
                        <div className="fd-verify-btn-title">{FARM_ONBOARDING_TH.verifyNudgeTitle}</div>
                        <div className="fd-verify-btn-sub">{FARM_ONBOARDING_TH.verifyNudgeCta}</div>
                      </div>
                      <Icon.ChevronRight />
                    </Link>
                  )}
                </div>
              )}

              <OnboardingChecklist
                title={FARM_ONBOARDING_TH.checklistTitle}
                note={FARM_ONBOARDING_TH.checklistNote}
                steps={farmOnboarding.steps}
                done={farmSummary.done}
                total={farmSummary.total}
                collapsed={!!farmOnboarding.progressRow?.checklist_collapsed}
                onToggleCollapse={(c) => farmOnboarding.toggleCollapse(c)}
                phases={FARM_ONBOARDING_PHASES}
                ctaDisabledKeys={onboardingCtaDisabledKeys}
                onStepCta={(step) => {
                  trackOnboardingEvent({ event: "onboarding_step_clicked", onboardingType: "farm", step: step.key, workspaceId: farmId });
                  router.push(step.ctaHref);
                }}
                onStepSkip={(step) => farmOnboarding.skipStep(step.key)}
              />
            </section>
          )}

          {/* ════════════════════════════════
              2. Today — Action Center
          ════════════════════════════════ */}
          <TodaysTasks tasks={allTasks} farmId={farmId} />

          {/* ════════════════════════════════
              Notification Panel — sits top-right on the existing 2-col desktop grid,
              stacks as a card on mobile
          ════════════════════════════════ */}
          {summary && <NotificationRail summary={summary} farmId={farmId} />}

          {/* ════════════════════════════════
              Quick Actions
          ════════════════════════════════ */}
          <QuickActionsBar farmId={farmId} />

          {/* ════════════════════════════════
              3. Business Overview
          ════════════════════════════════ */}
          {pets.length === 0 ? (
            <section className="fd-sec">
              <div className="fd-sec-head">
                <div className="fd-sec-title">
                  <img src="/icons/icon-home.png" alt="" style={{ width: 32, height: 32 }} />
                  <h2 className="fd-sec-h">ภาพรวมธุรกิจ</h2>
                </div>
              </div>
              <div className="fd-empty-sm">
                ยังไม่มีสัตว์ในฟาร์ม —{' '}
                <Link href={`/farm-dashboard/${farmId}/pets/create`} style={{ color: F.pink, fontWeight: 700 }}>เพิ่มสัตว์</Link>
              </div>
            </section>
          ) : summary && (
            <BusinessOverview
              farmId={farmId}
              totalPets={pets.length}
              openReserve={openReserve}
              available={available}
              reserved={reserved}
              sires={sires}
              dams={dams}
              summary={summary}
            />
          )}

          {/* ════════════════════════════════
              4. Animals Requiring Attention
          ════════════════════════════════ */}
          <AttentionList items={attentionItems} farmId={farmId} />

          {/* ════════════════════════════════
              5. Breeding Operations
          ════════════════════════════════ */}
          {summary && (
            <BreedingOperations
              farmId={farmId}
              pets={summary.pets}
              litters={summary.litters}
              farmSpecies={farm?.pet_type}
              littersBorn90d={summary.litters_born_90d}
            />
          )}

          {/* ════════════════════════════════
              6. Business Insights
          ════════════════════════════════ */}
          <BusinessInsights insights={insights} farmId={farmId} />

        </div>{/* end fd-body */}
      </div>{/* end fd-page */}

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
