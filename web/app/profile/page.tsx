"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
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
};

const shortMonthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const thaiDayNames = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."];
const CIRCUMFERENCE = 2 * Math.PI * 44;

type VaccineRow = { next_due: string | null; vaccine_name: string | null; pet_id: string | null };
type ActivityRow = { id: string; pet_id: string; activity_type: string | null; title: string; activity_date: string };
type CropType = "avatar" | "cover";

function formatMemberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return `${shortMonthNames[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function formatActivityDate(dateStr: string): string {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(new Date(dateStr));
}
function getVaccineIcon(name: string | null): string {
  if (!name) return "/icons/icon-calendar.png";
  const v = name.toLowerCase();
  if (v.includes("วัคซีน") || v.includes("ฉีด") || v.includes("vaccine")) return "/icons/icon-vaccine.png";
  return "/icons/icon-calendar.png";
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, maxDim = 1200): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => { image.onload = () => resolve(); });
  const scale = Math.min(1, maxDim / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85));
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<VaccineRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [vaccinatedPetIds, setVaccinatedPetIds] = useState<Set<string>>(new Set());
  const [hasHealthActivities, setHasHealthActivities] = useState(false);
  const [hasWeightRecords, setHasWeightRecords] = useState(false);
  const [loading, setLoading] = useState(true);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<CropType | null>(null);
  const [cropPos, setCropPos] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [cropUploading, setCropUploading] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login?redirect=/profile"); return; }
        setUser(session.user);
        const uid = session.user.id;

        const [profRes, petsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("pets").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        ]);

        if (profRes.data) setProfile(profRes.data);
        if (petsRes.data) setPets(petsRes.data);

        if (petsRes.data?.length) {
          const ids = petsRes.data.map((p: any) => p.id);
          const [vacRes, actRes, weightRes] = await Promise.all([
            supabase.from("vaccines").select("next_due, vaccine_name, pet_id").in("pet_id", ids).not("next_due", "is", null),
            supabase.from("pet_activities").select("id, pet_id, activity_type, title, activity_date").in("pet_id", ids).order("activity_date", { ascending: false }).limit(5),
            supabase.from("pet_weights").select("id").in("pet_id", ids).limit(1),
          ]);
          if (vacRes.data) {
            setAppointments(vacRes.data as VaccineRow[]);
            setVaccinatedPetIds(new Set((vacRes.data as VaccineRow[]).map((v) => v.pet_id!).filter(Boolean)));
          }
          if (actRes.data) {
            setActivities(actRes.data as ActivityRow[]);
            setHasHealthActivities((actRes.data as ActivityRow[]).some((a) =>
              a.activity_type?.includes("สุขภาพ") || a.activity_type?.includes("health") || a.activity_type === "ตรวจสุขภาพ"
            ));
          }
          setHasWeightRecords(!!weightRes.data && weightRes.data.length > 0);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);


  // Crop helpers
  const openCrop = (file: File, type: CropType) => {
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
    setCropSrc(null);
    setCropType(null);
    if (avatarRef.current) avatarRef.current.value = "";
    if (coverRef.current) coverRef.current.value = "";
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  const confirmCrop = async () => {
    if (!cropSrc || !croppedPixels || !user) return;
    setCropUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedPixels, cropType === "avatar" ? 480 : 1200);
      const fileName = cropType === "cover" ? "cover.jpg" : "profile.jpg";
      const path = `${user.id}/${fileName}`;
      await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      const field = cropType === "cover" ? "cover_url" : "avatar_url";
      await supabase.from("profiles").upsert({ id: user.id, [field]: url, updated_at: new Date() });
      setProfile((p: any) => ({ ...p, [field]: url }));
      cancelCrop();
    } catch (err) {
      console.error("Crop upload error:", err);
    } finally {
      setCropUploading(false);
    }
  };

  const displayName = profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Whiskora User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const coverUrl = profile?.cover_url;

  const petCareChecks = useMemo(() => {
    if (!pets.length) return { vaccineOk: false, weightOk: false, healthOk: false, score: 0 };
    const vaccineOk = vaccinatedPetIds.size > 0;
    const weightOk = hasWeightRecords;
    const healthOk = hasHealthActivities;
    const score = (vaccineOk ? 34 : 0) + (weightOk ? 33 : 0) + (healthOk ? 33 : 0);
    return { vaccineOk, weightOk, healthOk, score };
  }, [pets, vaccinatedPetIds, hasHealthActivities, hasWeightRecords]);

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

  const calendarData = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split("T")[0];
    // Find Monday of the current week (Thai week Mon–Sun)
    const dow = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const events = appointments
        .filter((a) => a.next_due && String(a.next_due).split("T")[0] === key)
        .map((a) => ({ ...a, petName: pets.find((p) => p.id === a.pet_id)?.name || "สัตว์เลี้ยง" }));
      return { date: d, dateKey: key, dayName: thaiDayNames[d.getDay()], events };
    });
    return { todayKey, days };
  }, [appointments, pets]);

  const upcomingEvents = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today); limit.setDate(limit.getDate() + 30);
    return appointments
      .filter((a) => a.next_due)
      .map((a) => ({
        ...a,
        dueDate: new Date(String(a.next_due).split("T")[0]),
        petName: pets.find((p) => p.id === a.pet_id)?.name || "สัตว์เลี้ยง",
      }))
      .filter((a) => a.dueDate >= today && a.dueDate < limit)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 6);
  }, [appointments, pets]);

  if (loading) return <PageLoader />;

  const { vaccineOk, weightOk, healthOk, score } = petCareChecks;
  const scoreOffset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <>
      <style>{`
        @keyframes rise { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }

        .pp { padding: 0 0 100px; margin-top: -16px; color: ${F.ink}; font-family: var(--font-ui), inherit; animation: rise .45s ease both; }

        /* ── Crop modal ── */
        .crop-overlay { position: fixed; inset: 0; z-index: 500; display: flex; flex-direction: column; background: #000; }
        .crop-area { flex: 1; position: relative; min-height: 260px; }
        .crop-controls { padding: 16px 20px env(safe-area-inset-bottom, 24px); background: #111; display: flex; flex-direction: column; gap: 14px; }
        .crop-zoom-row { display: flex; align-items: center; gap: 10px; }
        .crop-zoom-label { font-size: 12px; color: rgba(255,255,255,.6); flex-shrink: 0; }
        .crop-zoom-input { flex: 1; accent-color: ${F.pink}; cursor: pointer; }
        .crop-actions { display: flex; gap: 12px; }
        .crop-cancel-btn { flex: 1; padding: 13px; border: 1.5px solid rgba(255,255,255,.25); border-radius: 14px; background: transparent; color: white; font-size: 15px; font-weight: 600; cursor: pointer; }
        .crop-confirm-btn { flex: 2; padding: 13px; border: none; border-radius: 14px; background: ${F.pink}; color: white; font-size: 15px; font-weight: 700; cursor: pointer; }
        .crop-confirm-btn:disabled { opacity: .6; cursor: not-allowed; }

        /* ── Cover hero ── */
        .pp-cover-wrap { position: relative; height: 168px; margin: 0 -16px; overflow: hidden; background: linear-gradient(135deg, ${F.pink} 0%, #f06d98 55%, #f8a5c2 100%); z-index: 0; }
        .pp-cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pp-cover-cam { position: absolute; bottom: 10px; right: 14px; width: 34px; height: 34px; border-radius: 999px; background: rgba(0,0,0,.42); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; }
        .pp-cover-cam svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        /* hero row: avatar floats up, name sits to the right at bottom */
        .pp-avatar-row { position: relative; z-index: 1; display: flex; align-items: center; gap: 14px; margin-top: 8px; padding-bottom: 14px; }

        .pp-avatar-wrap { position: relative; flex-shrink: 0; }
        .pp-avatar { width: 82px; height: 82px; border-radius: 999px; border: 3.5px solid white; background: ${F.pinkSoft}; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,.13); color: ${F.pink}; }
        .pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pp-avatar svg { width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .pp-avatar-cam { position: absolute; right: -1px; bottom: 1px; width: 26px; height: 26px; border-radius: 999px; background: white; border: 2px solid ${F.line}; color: ${F.pink}; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .pp-avatar-cam svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        .pp-hero-info { flex: 1; min-width: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .pp-hero-text { flex: 1; min-width: 0; }
        .pp-name { margin: 0; font-size: 20px; font-weight: 750; color: ${F.ink}; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-subtitle { margin: 3px 0 0; font-size: 13px; color: ${F.muted}; }
        .pp-chip { display: inline-flex; margin-top: 6px; padding: 2px 10px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-size: 11px; font-weight: 500; }
        .pp-edit-btn { flex-shrink: 0; display: flex; align-items: center; justify-content: center; text-decoration: none; opacity: 1; transition: opacity .15s; }
        .pp-edit-btn:active { opacity: .6; }

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
        .pp-pet-add { border-style: dashed; }
        .pp-pet-name { font-size: 11px; font-weight: 600; color: ${F.inkSoft}; text-align: center; max-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-empty-pets { border: 1px dashed ${F.line}; border-radius: 14px; padding: 24px; text-align: center; color: ${F.muted}; font-size: 13px; line-height: 1.6; }

        /* ── Cards ── */
        .pp-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 16px; }
        .pp-card-title { font-size: 12px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; }

        /* ── Two col ── */
        .pp-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }

        /* ── Score ── */
        .pp-score-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .pp-check-list { width: 100%; display: grid; gap: 6px; }
        .pp-check { display: flex; align-items: center; gap: 7px; font-size: 12px; color: ${F.muted}; font-weight: 500; }
        .pp-check.ok { color: ${F.ink}; }
        .pp-check-icon { width: 18px; height: 18px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; font-weight: 800; background: #f3f4f6; color: ${F.muted}; }
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

        /* ── Calendar strip ── */
        .pp-cal-strip { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 6px; scrollbar-width: none; }
        .pp-cal-strip::-webkit-scrollbar { display: none; }
        .pp-cal-day { flex-shrink: 0; width: 46px; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 4px 8px; border-radius: 14px; border: 1.5px solid ${F.line}; background: white; }
        .pp-cal-day.today { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .pp-cal-day-name { font-size: 10px; font-weight: 600; color: ${F.muted}; }
        .pp-cal-day.today .pp-cal-day-name { color: ${F.pinkDeep}; }
        .pp-cal-date { font-size: 17px; font-weight: 750; color: ${F.ink}; line-height: 1.1; }
        .pp-cal-day.today .pp-cal-date { color: ${F.pink}; }
        .pp-cal-icons { min-height: 16px; display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; }
        .pp-cal-icon { width: 14px; height: 14px; object-fit: contain; }

        /* ── Upcoming events ── */
        .pp-upcoming-list { display: grid; gap: 8px; margin-top: 12px; }
        .pp-upcoming-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: white; border: 1px solid ${F.line}; border-radius: 14px; }
        .pp-upcoming-date { flex-shrink: 0; text-align: center; width: 36px; }
        .pp-upcoming-date-num { display: block; font-size: 18px; font-weight: 750; color: ${F.pink}; line-height: 1; }
        .pp-upcoming-date-mon { display: block; font-size: 10px; font-weight: 600; color: ${F.muted}; }
        .pp-upcoming-divider { width: 1px; height: 30px; background: ${F.line}; flex-shrink: 0; }
        .pp-upcoming-icon { width: 26px; height: 26px; object-fit: contain; flex-shrink: 0; }
        .pp-upcoming-text { flex: 1; min-width: 0; }
        .pp-upcoming-title { display: block; font-size: 13px; font-weight: 650; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-upcoming-pet { display: block; font-size: 11px; color: ${F.muted}; }
        .pp-upcoming-badge { flex-shrink: 0; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        .pp-upcoming-badge.today { background: #fef3c7; color: #d97706; }
        .pp-upcoming-badge.soon { background: ${F.pinkSoft}; color: ${F.pinkDeep}; }
        .pp-cal-empty { text-align: center; color: ${F.muted}; font-size: 13px; padding: 16px 0; line-height: 1.6; }

        /* ── Activities ── */
        .pp-act-list { border: 1px solid ${F.line}; border-radius: 14px; overflow: hidden; }
        .pp-act-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: white; border-bottom: 1px solid ${F.line}; }
        .pp-act-row:last-child { border-bottom: none; }
        .pp-act-dot { width: 7px; height: 7px; border-radius: 999px; background: ${F.pink}; flex-shrink: 0; }
        .pp-act-title { display: block; font-size: 13px; font-weight: 600; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-act-meta { display: block; font-size: 11px; color: ${F.muted}; }
        .pp-act-badge { flex-shrink: 0; padding: 2px 8px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-size: 10px; font-weight: 500; white-space: nowrap; }

        /* ── Admin ── */
        .pp-admin-card { border-color: #fca5a5; background: linear-gradient(135deg, #fff5f5, #fff); }
        .pp-admin-link { display: flex; align-items: center; gap: 14px; text-decoration: none; color: ${F.ink}; }
        .pp-admin-link strong { display: block; font-size: 15px; font-weight: 650; color: #dc2626; }
        .pp-admin-link span { display: block; font-size: 12px; color: ${F.muted}; margin-top: 2px; }
        .pp-admin-badge { margin-left: auto; padding: 3px 10px; border-radius: 999px; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 600; flex-shrink: 0; }
      `}</style>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <div className="crop-overlay">
          <div className="crop-area">
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
          <div className="crop-controls">
            <div className="crop-zoom-row">
              <span className="crop-zoom-label">ย่อ/ขยาย</span>
              <input
                type="range"
                className="crop-zoom-input"
                min={1} max={3} step={0.01}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
              />
            </div>
            <div className="crop-actions">
              <button className="crop-cancel-btn" type="button" onClick={cancelCrop}>ยกเลิก</button>
              <button className="crop-confirm-btn" type="button" onClick={confirmCrop} disabled={cropUploading}>
                {cropUploading ? "กำลังบันทึก..." : "ตกลง"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pp">
        {/* Cover + Avatar */}
        <div className="pp-cover-wrap">
          {coverUrl ? <img src={coverUrl} className="pp-cover-img" alt="ภาพปก" /> : null}
          <button
            className="pp-cover-cam"
            type="button"
            onClick={() => coverRef.current?.click()}
            aria-label="เปลี่ยนรูปปก"
          >
            <svg viewBox="0 0 24 24"><path d="M9 6 10.4 4h3.2L15 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="13" r="3.2"/></svg>
          </button>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "cover"); if (coverRef.current) coverRef.current.value = ""; }} />
        </div>

        {/* Avatar (floats up) + name side-by-side in one row */}
        <div className="pp-avatar-row">
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
              aria-label="เปลี่ยนรูปโปรไฟล์"
            >
              <svg viewBox="0 0 24 24"><path d="M9 6 10.4 4h3.2L15 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="13" r="3.2"/></svg>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "avatar"); if (avatarRef.current) avatarRef.current.value = ""; }} />
          </div>
          <div className="pp-hero-info">
            <div className="pp-hero-text">
              <h1 className="pp-name">{displayName}</h1>
              <p className="pp-subtitle">เจ้าของสัตว์เลี้ยง {pets.length} ตัว</p>
              {user?.created_at && (
                <span className="pp-chip">สมาชิกตั้งแต่ {formatMemberSince(user.created_at)}</span>
              )}
            </div>
            <Link href="/profile/settings" className="pp-edit-btn" aria-label="ตั้งค่า">
              <img src="/icons/icon-setting.png" alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </Link>
          </div>
        </div>

        {/* Pet Bubbles */}
        <section className="pp-section">
          <div className="pp-section-head">
            <span className="pp-section-title">
              {pets.length > 0 ? `บ้านนี้มีสมาชิก ${pets.length} ตัว` : "สัตว์เลี้ยงของฉัน"}
            </span>
            {pets.length > 0 && <Link href="/profile/pets" className="pp-see-all">ดูทั้งหมด ›</Link>}
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
                <div className="pp-pet-circle pp-pet-add">
                  <img src="/icons/icon-nav-add.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                </div>
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

        {/* 7-Day Calendar + Upcoming Events */}
        {pets.length > 0 && (
          <section className="pp-section">
            <div className="pp-section-head">
              <span className="pp-section-title">ปฏิทินดูแลสัตว์เลี้ยง</span>
              <Link href="/profile/calendar" className="pp-see-all">ดูทั้งหมด ›</Link>
            </div>
            <div className="pp-card" style={{ padding: "12px 10px" }}>
              <div className="pp-cal-strip">
                {calendarData.days.map(({ date, dateKey, dayName, events }) => (
                  <div
                    key={dateKey}
                    className={`pp-cal-day${dateKey === calendarData.todayKey ? " today" : ""}`}
                  >
                    <span className="pp-cal-day-name">{dayName}</span>
                    <span className="pp-cal-date">{date.getDate()}</span>
                    <div className="pp-cal-icons">
                      {events.slice(0, 2).map((ev, i) => (
                        <img key={i} src={getVaccineIcon(ev.vaccine_name)} alt="" className="pp-cal-icon" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="pp-upcoming-list">
                {upcomingEvents.map((ev, i) => {
                  const isToday = ev.dueDate.toDateString() === new Date().toDateString();
                  const isTomorrow = ev.dueDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  return (
                    <div key={i} className="pp-upcoming-item">
                      <div className="pp-upcoming-date">
                        <span className="pp-upcoming-date-num">{ev.dueDate.getDate()}</span>
                        <span className="pp-upcoming-date-mon">{shortMonthNames[ev.dueDate.getMonth()]}</span>
                      </div>
                      <div className="pp-upcoming-divider" />
                      <img src={getVaccineIcon(ev.vaccine_name)} alt="" className="pp-upcoming-icon" />
                      <div className="pp-upcoming-text">
                        <span className="pp-upcoming-title">{ev.vaccine_name || "ดูแลสุขภาพ"}</span>
                        <span className="pp-upcoming-pet">{ev.petName}</span>
                      </div>
                      {(isToday || isTomorrow) && (
                        <span className={`pp-upcoming-badge ${isToday ? "today" : "soon"}`}>
                          {isToday ? "วันนี้" : "พรุ่งนี้"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pp-cal-empty">ไม่มีกำหนดการวัคซีนใน 30 วันข้างหน้า</div>
            )}
          </section>
        )}

        {/* Pet Care Score + Tasks */}
        {pets.length > 0 && (
          <div className="pp-2col">
            <div className="pp-card">
              <div className="pp-card-title">Pet Care Score</div>
              <div className="pp-score-wrap">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="44" fill="none" stroke={F.line} strokeWidth="9" />
                  <circle
                    cx="55" cy="55" r="44" fill="none"
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
                    { ok: healthOk, label: "สุขภาพ" },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`pp-check${ok ? " ok" : ""}`}>
                      <span className="pp-check-icon">{ok ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pp-card">
              <div className="pp-card-title">สิ่งที่ต้องทำ</div>
              {tasksDue.length === 0 ? (
                <div className="pp-tasks-empty">ไม่มีกิจกรรม<br />วันนี้และพรุ่งนี้</div>
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

        {/* Admin */}
        {profile?.role === "admin" && (
          <section className="pp-section">
            <div className="pp-section-head">
              <span className="pp-section-title" style={{ color: "#dc2626" }}>ผู้ดูแลระบบ</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 999, background: '#fee2e2', color: '#dc2626' }}>Admin</span>
            </div>
            <div className="pp-card pp-admin-card" style={{ marginBottom: 10 }}>
              <Link href="/admin/verifications" className="pp-admin-link">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <strong>คำขอยืนยันตัวตน</strong>
                  <span>ตรวจสอบและอนุมัติฟาร์ม</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
            <div className="pp-card pp-admin-card">
              <Link href="/admin/dashboard" className="pp-admin-link">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                <div>
                  <strong>แดชบอร์ดหลังบ้าน</strong>
                  <span>สถิติผู้ใช้ สัตว์ และพาร์ทเนอร์ทั้งหมด</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

