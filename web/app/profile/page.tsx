"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  pinkDeep: "#c4325f",
  leaf: "#5a9065",
};

const shortMonthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const CIRCUMFERENCE = 2 * Math.PI * 44;

type VaccineRow = { next_due: string | null; vaccine_name: string | null; pet_id: string | null };
type ActivityRow = { id: string; pet_id: string; activity_type: string | null; title: string; activity_date: string };
type BusinessLinkProps = { href: string; label: string; type: string; icon: ReactNode; verified?: boolean };

function formatMemberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return `${shortMonthNames[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function formatActivityDate(dateStr: string): string {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(dateStr));
}
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date);
}
function getVaccineIcon(name: string | null): string {
  if (!name) return "/icons/icon-calendar.png";
  const v = name.toLowerCase();
  if (v.includes("วัคซีน") || v.includes("ฉีด") || v.includes("vaccine")) return "/icons/icon-vaccine.png";
  return "/icons/icon-calendar.png";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [myFarms, setMyFarms] = useState<any[]>([]);
  const [myShops, setMyShops] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<VaccineRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [vaccinatedPetIds, setVaccinatedPetIds] = useState<Set<string>>(new Set());
  const [hasHealthActivities, setHasHealthActivities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login?redirect=/profile"); return; }
        setUser(session.user);
        const uid = session.user.id;

        const [profRes, farmRes, shopRes, svcRes, petsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("farms").select("*").eq("user_id", uid),
          supabase.from("shops").select("*").eq("user_id", uid),
          supabase.from("services").select("*").eq("user_id", uid),
          supabase.from("pets").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        ]);

        if (profRes.data) setProfile(profRes.data);
        if (farmRes.data) setMyFarms(farmRes.data);
        if (shopRes.data) setMyShops(shopRes.data);
        if (svcRes.data) setMyServices(svcRes.data);
        if (petsRes.data) setPets(petsRes.data);

        if (petsRes.data?.length) {
          const ids = petsRes.data.map((p: any) => p.id);
          const [vacRes, actRes] = await Promise.all([
            supabase.from("vaccines").select("next_due, vaccine_name, pet_id").in("pet_id", ids).not("next_due", "is", null),
            supabase.from("pet_activities").select("id, pet_id, activity_type, title, activity_date").in("pet_id", ids).order("activity_date", { ascending: false }).limit(5),
          ]);
          if (vacRes.data) {
            setAppointments(vacRes.data as VaccineRow[]);
            setVaccinatedPetIds(new Set((vacRes.data as VaccineRow[]).map((v) => v.pet_id!).filter(Boolean)));
          }
          if (actRes.data) {
            setActivities(actRes.data as ActivityRow[]);
            setHasHealthActivities(
              (actRes.data as ActivityRow[]).some((a) =>
                a.activity_type?.includes("สุขภาพ") || a.activity_type?.includes("health") || a.activity_type === "ตรวจสุขภาพ"
              )
            );
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const displayName = profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Whiskora User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const coverUrl = profile?.cover_url;
  const isPartner = myFarms.length > 0 || myShops.length > 0 || myServices.length > 0;

  const petCareChecks = useMemo(() => {
    if (!pets.length) return { vaccineOk: false, weightOk: false, healthOk: false, score: 0 };
    const vaccineOk = vaccinatedPetIds.size > 0;
    const weightOk = pets.some((p) => p.weight || p.current_weight || p.weight_kg);
    const healthOk = hasHealthActivities;
    const score = Math.round((vaccineOk ? 34 : 0) + (weightOk ? 33 : 0) + (healthOk ? 33 : 0));
    return { vaccineOk, weightOk, healthOk, score };
  }, [pets, vaccinatedPetIds, hasHealthActivities]);

  const tasksDue = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
    return appointments
      .filter((item) => item.next_due)
      .map((item) => ({
        ...item,
        dueDate: new Date(String(item.next_due).split("T")[0]),
        petName: pets.find((p) => p.id === item.pet_id)?.name || "สัตว์เลี้ยง",
      }))
      .filter((item) => item.dueDate >= today && item.dueDate < dayAfter)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [appointments, pets]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/profile.jpg`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, updated_at: new Date() });
      setProfile((p: any) => ({ ...p, avatar_url: url }));
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (avatarRef.current) avatarRef.current.value = ""; }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const path = `${user.id}/cover.jpg`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").upsert({ id: user.id, cover_url: url, updated_at: new Date() });
      setProfile((p: any) => ({ ...p, cover_url: url }));
    } catch (err) { console.error(err); }
    finally { setUploadingCover(false); if (coverRef.current) coverRef.current.value = ""; }
  };

  if (loading) return <PageLoader />;

  const { vaccineOk, weightOk, healthOk, score } = petCareChecks;
  const scoreOffset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <>
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }

        .pp { padding: 0 0 100px; margin-top: -16px; color: ${F.ink}; font-family: var(--font-ui), inherit; animation: rise .45s ease both; }

        /* ── Cover hero ── */
        .pp-cover-wrap { position: relative; height: 168px; margin: 0 -16px; overflow: hidden; background: linear-gradient(135deg, ${F.pink} 0%, #f06d98 55%, #f8a5c2 100%); }
        .pp-cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pp-cover-cam { position: absolute; bottom: 10px; right: 14px; width: 32px; height: 32px; border-radius: 999px; background: rgba(0,0,0,.38); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; transition: background .15s; }
        .pp-cover-cam:hover { background: rgba(0,0,0,.56); }
        .pp-cover-cam svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        .pp-hero-body { position: relative; display: flex; align-items: flex-end; gap: 14px; margin-top: -36px; padding: 0 0 16px; }

        .pp-avatar-wrap { position: relative; flex-shrink: 0; }
        .pp-avatar { width: 82px; height: 82px; border-radius: 999px; border: 3.5px solid white; background: ${F.pinkSoft}; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,.13); color: ${F.pink}; }
        .pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pp-avatar svg { width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .pp-avatar-cam { position: absolute; right: -1px; bottom: 1px; width: 26px; height: 26px; border-radius: 999px; background: white; border: 2px solid ${F.line}; color: ${F.pink}; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .pp-avatar-cam svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        .pp-hero-text { flex: 1; min-width: 0; padding-bottom: 2px; }
        .pp-name { margin: 0; font-size: 20px; font-weight: 750; color: ${F.ink}; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-subtitle { margin: 3px 0 0; font-size: 13px; color: ${F.muted}; }
        .pp-chip { display: inline-flex; margin-top: 6px; padding: 2px 10px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-size: 11px; font-weight: 500; }
        .pp-edit-btn { flex-shrink: 0; align-self: flex-end; padding: 7px 16px; border-radius: 10px; background: ${F.pink}; color: white; font-size: 13px; font-weight: 600; text-decoration: none; margin-bottom: 2px; }

        /* ── Sections ── */
        .pp-section { margin-bottom: 14px; }
        .pp-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .pp-section-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .pp-see-all { font-size: 13px; font-weight: 500; color: ${F.pink}; text-decoration: none; }

        /* ── Pet bubbles ── */
        .pp-pet-scroll { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .pp-pet-scroll::-webkit-scrollbar { display: none; }
        .pp-pet-bubble { display: flex; flex-direction: column; align-items: center; gap: 5px; text-decoration: none; flex-shrink: 0; }
        .pp-pet-circle { width: 58px; height: 58px; border-radius: 999px; border: 2.5px solid ${F.line}; background: ${F.pinkSoft}; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: border-color .15s, transform .15s; }
        .pp-pet-circle img { width: 100%; height: 100%; object-fit: cover; }
        .pp-pet-fallback { width: 28px; height: 28px; object-fit: contain; }
        .pp-pet-bubble:hover .pp-pet-circle { border-color: ${F.pink}; transform: translateY(-2px); }
        .pp-pet-add { border-style: dashed; color: ${F.muted}; font-size: 22px; font-weight: 300; }
        .pp-pet-name { font-size: 11px; font-weight: 600; color: ${F.inkSoft}; text-align: center; max-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Cards ── */
        .pp-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 16px; }
        .pp-card-title { font-size: 13px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; }

        /* ── Two col ── */
        .pp-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }

        /* ── Score ── */
        .pp-score-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .pp-score-svg { display: block; }
        .pp-check-list { width: 100%; display: grid; gap: 6px; }
        .pp-check { display: flex; align-items: center; gap: 7px; font-size: 12px; color: ${F.muted}; font-weight: 500; }
        .pp-check.ok { color: ${F.ink}; }
        .pp-check-icon { width: 18px; height: 18px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px; font-weight: 700; background: #f3f4f6; color: ${F.muted}; }
        .pp-check.ok .pp-check-icon { background: #dcfce7; color: #16a34a; }

        /* ── Tasks ── */
        .pp-tasks-empty { font-size: 12px; color: ${F.muted}; text-align: center; padding: 20px 0; line-height: 1.6; }
        .pp-task-list { display: grid; gap: 8px; }
        .pp-task { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid ${F.line}; border-radius: 12px; background: white; }
        .pp-task-icon { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
        .pp-task-text { flex: 1; min-width: 0; }
        .pp-task-text strong { display: block; font-size: 12px; font-weight: 650; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-task-text span { display: block; font-size: 11px; color: ${F.muted}; }
        .pp-task-badge { flex-shrink: 0; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; background: ${F.pinkSoft}; color: ${F.pinkDeep}; }
        .pp-task-badge.today { background: #fef3c7; color: #d97706; }

        /* ── Quick menu ── */
        .pp-quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .pp-quick-item { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 14px 8px 12px; border: 1px solid ${F.line}; border-radius: 14px; background: white; text-decoration: none; color: ${F.ink}; transition: transform .14s ease, border-color .14s ease, box-shadow .14s ease; }
        .pp-quick-item:hover { transform: translateY(-2px); border-color: #e0b8c8; box-shadow: 0 6px 18px rgba(232,70,119,.08); }
        .pp-quick-icon { width: 36px; height: 36px; object-fit: contain; }
        .pp-quick-label { font-size: 11px; font-weight: 600; text-align: center; line-height: 1.35; color: ${F.ink}; }

        /* ── Activities ── */
        .pp-act-list { border: 1px solid ${F.line}; border-radius: 14px; overflow: hidden; }
        .pp-act-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: white; border-bottom: 1px solid ${F.line}; }
        .pp-act-row:last-child { border-bottom: none; }
        .pp-act-dot { width: 7px; height: 7px; border-radius: 999px; background: ${F.pink}; flex-shrink: 0; }
        .pp-act-title { display: block; font-size: 13px; font-weight: 600; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-act-meta { display: block; font-size: 11px; color: ${F.muted}; }
        .pp-act-badge { flex-shrink: 0; padding: 2px 8px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-size: 10px; font-weight: 500; white-space: nowrap; }

        /* ── Pet ID Promo ── */
        .pp-id-promo { margin-bottom: 14px; border-radius: 18px; overflow: hidden; background: linear-gradient(135deg, ${F.pink} 0%, #b5305a 100%); padding: 20px; display: flex; align-items: center; gap: 16px; }
        .pp-id-promo-text { flex: 1; min-width: 0; }
        .pp-id-promo-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.7); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 4px; }
        .pp-id-promo-title { font-size: 18px; font-weight: 750; color: white; margin: 0 0 5px; }
        .pp-id-promo-desc { font-size: 12px; color: rgba(255,255,255,.78); line-height: 1.5; margin: 0; }
        .pp-id-promo-hint { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; padding: 5px 12px; border-radius: 999px; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.28); color: white; font-size: 12px; font-weight: 600; }
        .pp-id-promo-qr { flex-shrink: 0; opacity: .88; }

        /* ── Business ── */
        .pp-biz-list { display: grid; gap: 8px; }
        .pp-biz-link { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid ${F.line}; border-radius: 14px; background: white; text-decoration: none; color: ${F.ink}; transition: transform .14s ease, border-color .14s ease; }
        .pp-biz-link:hover { transform: translateY(-2px); border-color: #e0b8c8; }
        .pp-biz-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pp-biz-icon img { width: 48px; height: 48px; object-fit: contain; }
        .pp-biz-name { font-size: 15px; font-weight: 600; color: ${F.ink}; display: block; }
        .pp-biz-badges { display: flex; gap: 5px; margin-top: 3px; flex-wrap: wrap; }
        .pp-biz-type { padding: 2px 8px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-size: 10px; font-weight: 500; }
        .pp-biz-verified { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 500; }
        .pp-biz-verified img { width: 10px; height: 10px; object-fit: contain; }

        /* ── Admin ── */
        .pp-admin-card { border-color: #fca5a5; background: linear-gradient(135deg, #fff5f5, #fff); }
        .pp-admin-link { display: flex; align-items: center; gap: 14px; text-decoration: none; color: ${F.ink}; }
        .pp-admin-link svg { flex-shrink: 0; }
        .pp-admin-link strong { display: block; font-size: 15px; font-weight: 650; color: #dc2626; }
        .pp-admin-link span { display: block; font-size: 12px; color: ${F.muted}; margin-top: 2px; }
        .pp-admin-badge { margin-left: auto; padding: 3px 10px; border-radius: 999px; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 600; flex-shrink: 0; }

        /* ── Empty ── */
        .pp-empty-pets { border: 1px dashed ${F.line}; border-radius: 14px; padding: 24px; text-align: center; color: ${F.muted}; font-size: 13px; line-height: 1.6; }

        @media (max-width: 380px) {
          .pp-2col { grid-template-columns: 1fr; }
          .pp-quick-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <main className="pp">
        {/* Cover + Avatar */}
        <div className="pp-cover-wrap">
          {coverUrl
            ? <img src={coverUrl} className="pp-cover-img" alt="ภาพปก" />
            : null}
          <button
            className="pp-cover-cam"
            type="button"
            onClick={() => coverRef.current?.click()}
            disabled={uploadingCover}
            aria-label="เปลี่ยนรูปปก"
            style={uploadingCover ? { opacity: 0.5 } : undefined}
          >
            <svg viewBox="0 0 24 24"><path d="M9 6 10.4 4h3.2L15 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="13" r="3.2"/></svg>
          </button>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
        </div>

        <div className="pp-hero-body">
          <div className="pp-avatar-wrap">
            <div className="pp-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="รูปโปรไฟล์" />
                : <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            </div>
            <button
              className="pp-avatar-cam"
              type="button"
              onClick={() => avatarRef.current?.click()}
              disabled={uploading}
              aria-label="เปลี่ยนรูปโปรไฟล์"
              style={uploading ? { opacity: 0.5 } : undefined}
            >
              <svg viewBox="0 0 24 24"><path d="M9 6 10.4 4h3.2L15 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="13" r="3.2"/></svg>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </div>

          <div className="pp-hero-text">
            <h1 className="pp-name">{displayName}</h1>
            <p className="pp-subtitle">เจ้าของสัตว์เลี้ยง {pets.length} ตัว</p>
            {user?.created_at && (
              <span className="pp-chip">สมาชิกตั้งแต่ {formatMemberSince(user.created_at)}</span>
            )}
          </div>

          <Link href="/profile/edit" className="pp-edit-btn">แก้ไข</Link>
        </div>

        {/* Pet Bubbles */}
        <section className="pp-section">
          <div className="pp-section-head">
            <span className="pp-section-title">
              {pets.length > 0 ? `บ้านนี้มีสมาชิก ${pets.length} ตัว` : "สัตว์เลี้ยงของฉัน"}
            </span>
            {pets.length > 0 && <Link href="/my-pets" className="pp-see-all">ดูทั้งหมด ›</Link>}
          </div>

          {pets.length > 0 ? (
            <div className="pp-pet-scroll">
              {pets.slice(0, 8).map((pet) => (
                <Link key={pet.id} href={`/pets/${pet.id}`} className="pp-pet-bubble">
                  <div className="pp-pet-circle">
                    {pet.image_url
                      ? <img src={pet.image_url} alt={pet.name || "สัตว์เลี้ยง"} />
                      : <img src="/icons/icon-paw-circle-white.png" alt="" className="pp-pet-fallback" />}
                  </div>
                  <span className="pp-pet-name">{pet.name || "—"}</span>
                </Link>
              ))}
              <Link href="/pets/create" className="pp-pet-bubble">
                <div className="pp-pet-circle pp-pet-add">+</div>
                <span className="pp-pet-name">เพิ่ม</span>
              </Link>
            </div>
          ) : (
            <div className="pp-empty-pets">
              ยังไม่มีสัตว์เลี้ยงในบัญชี<br />
              <Link href="/pets/create" style={{ color: F.pink, fontWeight: 600 }}>+ เพิ่มสัตว์เลี้ยงตัวแรก</Link>
            </div>
          )}
        </section>

        {/* Pet Care Score + Tasks (only when pets exist) */}
        {pets.length > 0 && (
          <div className="pp-2col">
            <div className="pp-card">
              <div className="pp-card-title">Pet Care Score</div>
              <div className="pp-score-wrap">
                <svg className="pp-score-svg" width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="44" fill="none" stroke={F.line} strokeWidth="9" />
                  <circle
                    cx="55" cy="55" r="44"
                    fill="none"
                    stroke={score > 0 ? F.pink : F.line}
                    strokeWidth="9"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={scoreOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                    style={{ transition: "stroke-dashoffset .6s ease" }}
                  />
                  <text x="55" y="51" textAnchor="middle" fill={F.ink} fontSize="24" fontWeight="800" fontFamily="inherit">{score}</text>
                  <text x="55" y="66" textAnchor="middle" fill={F.muted} fontSize="11" fontFamily="inherit">/ 100</text>
                </svg>
                <div className="pp-check-list">
                  {[
                    { ok: vaccineOk, label: "วัคซีน" },
                    { ok: weightOk, label: "น้ำหนัก" },
                    { ok: healthOk, label: "ตรวจสุขภาพ" },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`pp-check${ok ? " ok" : ""}`}>
                      <span className="pp-check-icon">{ok ? "✓" : "✗"}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pp-card">
              <div className="pp-card-title">สิ่งที่ต้องทำ</div>
              {tasksDue.length === 0 ? (
                <div className="pp-tasks-empty">
                  ไม่มีกิจกรรม<br />วันนี้และพรุ่งนี้
                </div>
              ) : (
                <div className="pp-task-list">
                  {tasksDue.map((task, i) => {
                    const isToday = task.dueDate.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className="pp-task">
                        <img className="pp-task-icon" src={getVaccineIcon(task.vaccine_name)} alt="" />
                        <div className="pp-task-text">
                          <strong>{task.vaccine_name || "ดูแลสุขภาพ"}</strong>
                          <span>{task.petName}</span>
                        </div>
                        <span className={`pp-task-badge${isToday ? " today" : ""}`}>{isToday ? "วันนี้" : "พรุ่งนี้"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Menu */}
        <section className="pp-section">
          <div className="pp-section-head">
            <span className="pp-section-title">เมนูลัด</span>
          </div>
          <div className="pp-quick-grid">
            {[
              { href: "/my-pets", icon: "/icons/icon-my-pets.png", label: "สัตว์เลี้ยง\nของฉัน" },
              { href: "/pets/vaccines/bulk-add", icon: "/icons/icon-vaccine.png", label: "บันทึก\nวัคซีน" },
              { href: "/health", icon: "/icons/icon-health.png", label: "ประวัติ\nสุขภาพ" },
              { href: "/profile/calendar", icon: "/icons/icon-calendar.png", label: "ปฏิทิน" },
              { href: "/service-hub", icon: "/icons/icon-partner.png", label: "ร้านค้า\nบริการ" },
              { href: "/profile/finance", icon: "/icons/icon-wallet.png", label: "รายรับ\nรายจ่าย" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="pp-quick-item">
                <img src={item.icon} alt="" className="pp-quick-icon" />
                <span className="pp-quick-label" style={{ whiteSpace: "pre-line" }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activities */}
        {activities.length > 0 && (
          <section className="pp-section">
            <div className="pp-section-head">
              <span className="pp-section-title">กิจกรรมล่าสุด</span>
              <Link href="/pets" className="pp-see-all">ดูทั้งหมด ›</Link>
            </div>
            <div className="pp-act-list">
              {activities.map((act) => {
                const pet = pets.find((p) => p.id === act.pet_id);
                return (
                  <div key={act.id} className="pp-act-row">
                    <div className="pp-act-dot" aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="pp-act-title">{act.title}</span>
                      <span className="pp-act-meta">{pet?.name || "สัตว์เลี้ยง"} · {formatActivityDate(act.activity_date)}</span>
                    </div>
                    {act.activity_type && <span className="pp-act-badge">{act.activity_type}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Pet ID Card Promo */}
        <div className="pp-id-promo">
          <div className="pp-id-promo-text">
            <div className="pp-id-promo-label">Whiskora</div>
            <h2 className="pp-id-promo-title">Pet ID Card</h2>
            <p className="pp-id-promo-desc">แสดง QR Code ให้คนอื่นสแกนเพื่อดูข้อมูลสัตว์เลี้ยงของคุณ</p>
            <div className="pp-id-promo-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h3v3"/><path d="M17 21v-4h4"/>
              </svg>
              กดปุ่ม QR ที่แถบเมนูด้านล่าง
            </div>
          </div>
          <div className="pp-id-promo-qr">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h3v3"/><path d="M17 21v-4h4"/>
            </svg>
          </div>
        </div>

        {/* Business */}
        {isPartner && (
          <section className="pp-section">
            <div className="pp-section-head">
              <span className="pp-section-title">ธุรกิจที่ดูแล</span>
            </div>
            <div className="pp-biz-list">
              {myFarms.map((farm) => (
                <BizLink key={farm.id} href={`/farm-dashboard/${farm.id}`} label={farm.farm_name} type="ฟาร์ม" icon={<img src="/icons/icon-farm.png" alt="" />} verified={farm.is_verified} />
              ))}
              {myShops.map((shop) => (
                <BizLink key={shop.id} href={`/shop-dashboard/${shop.id}`} label={shop.shop_name} type="ร้านค้า" icon={<img src="/icons/icon-shop.png" alt="" />} verified={shop.is_verified} />
              ))}
              {myServices.map((svc) => (
                <BizLink key={svc.id} href={`/service-dashboard/${svc.id}`} label={svc.service_name} type="บริการ" icon={<img src="/icons/icon-service.png" alt="" />} verified={svc.is_verified} />
              ))}
            </div>
          </section>
        )}

        {/* Admin */}
        {profile?.role === "admin" && (
          <section className="pp-section">
            <div className="pp-section-head">
              <span className="pp-section-title" style={{ color: "#dc2626" }}>ผู้ดูแลระบบ</span>
            </div>
            <div className="pp-card pp-admin-card">
              <Link href="/admin/verifications" className="pp-admin-link">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <strong>คำขอยืนยันตัวตน</strong>
                  <span>จัดการ farm verifications</span>
                </div>
                <span className="pp-admin-badge">Admin</span>
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function BizLink({ href, label, type, icon, verified }: BusinessLinkProps) {
  return (
    <Link className="pp-biz-link" href={href}>
      <span className="pp-biz-icon">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="pp-biz-name">{label}</span>
        <div className="pp-biz-badges">
          <span className="pp-biz-type">{type}</span>
          {verified && (
            <span className="pp-biz-verified">
              <img src="/icons/icon-verified.png" alt="" />
              ยืนยันแล้ว
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
