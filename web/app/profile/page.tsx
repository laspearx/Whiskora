"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  cream: "#fffafc",
  paper: "#fdf0f3",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  pinkDeep: "#c4325f",
  sky: "#5b8dc7",
  leaf: "#5a9065",
  sun: "#e8a63a",
};

const Icon = {
  User: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21v-2.2a4.8 4.8 0 0 0-4.8-4.8H8.8A4.8 4.8 0 0 0 4 18.8V21" />
      <circle cx="12" cy="7.5" r="4" />
    </svg>
  ),
  Paw: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="7.5" cy="9" r="2.2" />
      <circle cx="12" cy="6.8" r="2.2" />
      <circle cx="16.5" cy="9" r="2.2" />
      <path d="M6.5 16.4c0-2.5 2.4-4.6 5.5-4.6s5.5 2.1 5.5 4.6c0 1.6-1 2.8-2.6 2.8-1.1 0-1.7-.5-2.9-.5s-1.8.5-2.9.5c-1.6 0-2.6-1.2-2.6-2.8Z" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6 10.4 4h3.2L15 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  ),
  Health: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7-4.2-7-10a4.2 4.2 0 0 1 7-3.1A4.2 4.2 0 0 1 19 11c0 5.8-7 10-7 10Z" />
      <path d="M8 12h2.2l1.1-2.3 1.8 4.6 1.2-2.3H16" />
    </svg>
  ),
  Wallet: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" />
      <path d="M6 6V5a2 2 0 0 1 2-2h9" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </svg>
  ),
  Store: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9 7 3h10l2 6" />
      <path d="M4 9h16v11H4z" />
      <path d="M9 13h6" />
    </svg>
  ),
  Farm: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10 12 3l9 7" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8.8 12.2 2.1 2.1 4.5-4.8" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
};

type VaccineAppointment = {
  next_due: string | null;
  vaccine_name: string | null;
  pet_id: string | null;
};

type BusinessLinkProps = {
  href: string;
  label: string;
  type: string;
  icon: ReactNode;
};

const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const weekDays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [myFarms, setMyFarms] = useState<any[]>([]);
  const [myShops, setMyShops] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<VaccineAppointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login?redirect=/profile");
          return;
        }

        setUser(session.user);
        const uid = session.user.id;

        const [profileRes, farmRes, shopRes, serviceRes, petsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("farms").select("*").eq("user_id", uid),
          supabase.from("shops").select("*").eq("user_id", uid),
          supabase.from("services").select("*").eq("user_id", uid),
          supabase.from("pets").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (farmRes.data) setMyFarms(farmRes.data);
        if (shopRes.data) setMyShops(shopRes.data);
        if (serviceRes.data) setMyServices(serviceRes.data);
        if (petsRes.data) setPets(petsRes.data);

        if (petsRes.data && petsRes.data.length > 0) {
          const petIds = petsRes.data.map((pet: any) => pet.id);
          const { data: vaccineData } = await supabase
            .from("vaccines")
            .select("next_due, vaccine_name, pet_id")
            .in("pet_id", petIds)
            .not("next_due", "is", null);

          if (vaccineData) setAppointments(vaccineData as VaccineAppointment[]);
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  let firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isPartner = myFarms.length > 0 || myShops.length > 0 || myServices.length > 0;
  const businessCount = myFarms.length + myShops.length + myServices.length;
  const displayName = profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Whiskora User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const email = user?.email || "-";
  const profileCompletion = Math.min(
    100,
    45 + (avatarUrl ? 15 : 0) + (pets.length > 0 ? 20 : 0) + (appointments.length > 0 ? 10 : 0) + (isPartner ? 10 : 0)
  );

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments
      .filter((item) => item.next_due)
      .map((item) => ({
        ...item,
        dueDate: new Date(String(item.next_due).split("T")[0]),
        petName: pets.find((pet) => pet.id === item.pet_id)?.name || "สัตว์เลี้ยง",
      }))
      .filter((item) => item.dueDate >= today)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 4);
  }, [appointments, pets]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  if (loading) {
    return (
      <div className="profile-loading">
        <style>{`
          .profile-loading {
            min-height: 62vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${F.muted};
            font-family: var(--font-ui), inherit;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
        `}</style>
        Loading Profile
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes profile-rise {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes profile-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .profile-page {
          min-height: 100vh;
          padding: 32px 0 84px;
          color: ${F.ink};
          font-family: var(--font-ui), inherit;
        }

        .profile-page svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex: 0 0 auto;
        }

        .profile-shell {
          display: grid;
          gap: 12px;
        }

        .profile-hero {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 20px;
          color: white;
          background: linear-gradient(135deg, ${F.pink} 0%, #f06d98 58%, #f8a5c2 100%);
          box-shadow: 0 12px 28px rgba(232, 70, 119, .14);
          animation: profile-rise .55s ease both;
        }

        .profile-hero::before,
        .profile-hero::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          background: radial-gradient(circle, rgba(255,255,255,.2), transparent 68%);
          animation: profile-float 8s ease-in-out infinite;
        }

        .profile-hero::before {
          width: 280px;
          height: 280px;
          top: -110px;
          right: -90px;
        }

        .profile-hero::after {
          width: 190px;
          height: 190px;
          left: -62px;
          bottom: -72px;
          animation-delay: 1.2s;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 16px;
          align-items: center;
        }

        .avatar-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          flex: 0 0 auto;
        }

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          overflow: hidden;
          border: 3px solid rgba(255,255,255,.88);
          background: linear-gradient(135deg, #fff1f6, #fff);
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(140, 36, 78, .18);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar svg {
          width: 32px;
          height: 32px;
        }

        .avatar-camera {
          position: absolute;
          right: -2px;
          bottom: -2px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: white;
          color: ${F.pink};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(232,70,119,.14);
          box-shadow: 0 4px 10px rgba(140, 36, 78, .14);
        }

        .avatar-camera svg {
          width: 13px;
          height: 13px;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 24px;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.32);
          background: rgba(255,255,255,.18);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hero-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hero-title {
          margin: 0;
          color: white;
          font-size: clamp(20px, 3.5vw, 28px);
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .verified-badge {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: rgba(255,255,255,.18);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.26);
        }

        .verified-badge svg {
          width: 14px;
          height: 14px;
        }

        .hero-email {
          margin: 5px 0 0;
          color: rgba(255,255,255,.78);
          font-size: 13px;
          line-height: 1.5;
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        .hero-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .button-primary,
        .button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          border-radius: 10px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .button-primary {
          background: white;
          color: ${F.pink};
          box-shadow: 0 10px 24px rgba(31,26,28,.12);
        }

        .button-secondary {
          border: 1px solid rgba(255,255,255,.28);
          background: rgba(255,255,255,.14);
          color: white;
        }

        .button-primary:hover,
        .button-secondary:hover,
        .profile-card:hover,
        .quick-card:hover,
        .pet-row:hover,
        .business-link:hover {
          transform: translateY(-2px);
        }

        .hero-meta {
          position: relative;
          z-index: 1;
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .meta-pill {
          border-radius: 12px;
          padding: 10px 12px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18);
          backdrop-filter: blur(8px);
        }

        .meta-pill strong {
          display: block;
          color: white;
          font-size: 18px;
          line-height: 1;
          font-weight: 700;
        }

        .meta-pill span {
          display: block;
          color: rgba(255,255,255,.72);
          font-size: 12px;
          line-height: 1.4;
          margin-top: 4px;
          font-weight: 400;
        }

        .profile-progress {
          margin-top: 12px;
          max-width: 480px;
        }

        .progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
          color: rgba(255,255,255,.82);
          font-size: 11px;
          font-weight: 500;
        }

        .progress-track {
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,.22);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: white;
          transition: width .5s ease;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          animation: profile-rise .58s ease .08s both;
        }

        .quick-card,
        .profile-card {
          border: 1px solid ${F.line};
          background: rgba(255,255,255,.92);
          box-shadow: 0 4px 14px rgba(31,26,28,.045);
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .quick-card {
          min-height: 106px;
          border-radius: 14px;
          padding: 13px;
          color: ${F.ink};
          text-decoration: none;
          display: grid;
          align-content: space-between;
          gap: 10px;
        }

        .quick-card:hover,
        .profile-card:hover {
          border-color: #edc7d3;
          box-shadow: 0 8px 22px rgba(31,26,28,.07);
        }

        .quick-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          box-shadow: 0 2px 8px rgba(31,26,28,.08);
          overflow: hidden;
          flex: 0 0 auto;
        }

        .quick-icon img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .quick-card strong {
          display: block;
          color: ${F.ink};
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .quick-card span {
          display: block;
          color: ${F.muted};
          font-size: 12px;
          line-height: 1.5;
          font-weight: 400;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(290px, .92fr);
          gap: 12px;
          align-items: start;
        }

        .profile-card {
          border-radius: 16px;
          padding: 14px;
          animation: profile-rise .58s ease both;
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .card-title-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 8px rgba(31,26,28,.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          overflow: hidden;
        }

        .card-title-icon img {
          width: 26px;
          height: 26px;
          object-fit: contain;
        }

        .card-title-icon svg {
          width: 15px;
          height: 15px;
          color: ${F.pink};
        }

        .card-head h2 {
          margin: 0;
          color: ${F.ink};
          font-size: 16px;
          line-height: 1.35;
          font-weight: 650;
          letter-spacing: 0;
        }

        .card-link {
          color: ${F.pink};
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .card-link svg {
          width: 14px;
          height: 14px;
        }

        .calendar-layout {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(230px, 1fr);
          gap: 12px;
        }

        .calendar-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .icon-button {
          width: 28px;
          height: 28px;
          border: 1px solid ${F.line};
          border-radius: 999px;
          background: white;
          color: ${F.ink};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .icon-button svg {
          width: 14px;
          height: 14px;
        }

        .calendar-month {
          color: ${F.ink};
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 3px;
          border: 1px solid ${F.line};
          border-radius: 12px;
          padding: 8px;
          background: #fff;
        }

        .weekday,
        .day-cell {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .weekday {
          color: ${F.muted};
          font-size: 10px;
          font-weight: 500;
          min-height: 20px;
        }

        .weekday:first-child {
          color: ${F.pink};
        }

        .day-cell {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          color: ${F.inkSoft};
          text-decoration: none;
          font-size: 12px;
          font-weight: 400;
          background: ${F.cream};
        }

        .day-cell.has-event {
          background: ${F.pinkSoft};
          color: ${F.pinkDeep};
        }

        .day-cell.is-today {
          background: ${F.pink};
          color: white;
          box-shadow: 0 8px 18px rgba(232,70,119,.18);
        }

        .event-dots {
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
        }

        .event-dots i {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: currentColor;
        }

        .appointment-list,
        .pet-list,
        .business-list {
          display: grid;
          gap: 6px;
        }

        .appointment-item,
        .pet-row,
        .business-link {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid ${F.line};
          border-radius: 12px;
          padding: 9px 10px;
          background: white;
          color: ${F.ink};
          text-decoration: none;
          transition: transform .16s ease, border-color .16s ease;
        }

        .appointment-avatar,
        .pet-avatar,
        .business-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          overflow: hidden;
          background: ${F.pinkSoft};
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .business-icon {
          background: white;
          box-shadow: 0 2px 8px rgba(31,26,28,.08);
        }

        .business-icon img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .appointment-avatar svg,
        .pet-avatar svg {
          width: 18px;
          height: 18px;
        }

        .appointment-avatar img,
        .pet-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .appointment-item strong,
        .pet-row strong,
        .business-link strong {
          display: block;
          color: ${F.ink};
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
        }

        .appointment-item span,
        .pet-row span,
        .business-link small {
          color: ${F.muted};
          font-size: 12px;
          font-weight: 400;
          line-height: 1.5;
        }

        .status-pill {
          margin-left: auto;
          border-radius: 999px;
          padding: 3px 8px;
          background: ${F.pinkSoft};
          color: ${F.pinkDeep};
          font-size: 10px;
          font-weight: 500;
          white-space: nowrap;
        }

        .finance-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          text-decoration: none;
          color: inherit;
          border-color: #dcefe4;
          background: linear-gradient(135deg, #f6fff9, #fff);
        }

        .finance-card .card-title-icon {
          background: white;
        }

        .finance-card strong {
          display: block;
          color: ${F.leaf};
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .empty-box {
          border: 1px dashed ${F.line};
          border-radius: 10px;
          background: rgba(255,255,255,.64);
          padding: 12px;
          color: ${F.muted};
          font-size: 12px;
          line-height: 1.65;
          font-weight: 400;
        }

        @media (max-width: 900px) {
          .profile-page {
            padding-top: 16px;
          }

          .hero-content,
          .profile-grid,
          .calendar-layout {
            grid-template-columns: 1fr;
          }

          .quick-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .profile-page {
            padding-top: 10px;
          }

          .profile-hero {
            border-radius: 16px;
            padding: 16px;
          }

          .hero-content {
            justify-items: center;
            text-align: center;
          }

          .hero-title-row,
          .hero-actions {
            justify-content: center;
          }

          .avatar-wrap {
            width: 70px;
            height: 70px;
          }

          .hero-meta {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }

          .meta-pill {
            padding: 8px;
            text-align: center;
          }

          .meta-pill strong {
            font-size: 15px;
          }

          .meta-pill span {
            font-size: 10px;
          }

          .quick-grid {
            gap: 7px;
          }

          .quick-card {
            min-height: 96px;
            padding: 11px;
          }

          .quick-icon {
            width: 30px;
            height: 30px;
          }

          .quick-card strong {
            font-size: 12px;
          }

          .quick-card span {
            font-size: 10px;
          }

          .profile-card {
            border-radius: 14px;
            padding: 12px;
          }

          .card-head {
            align-items: flex-start;
          }

          .calendar-grid {
            padding: 7px;
            gap: 3px;
          }

          .appointment-item {
            align-items: flex-start;
          }

          .status-pill {
            display: none;
          }

          .finance-card {
            grid-template-columns: auto minmax(0, 1fr);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .profile-hero,
          .quick-grid,
          .profile-card,
          .profile-hero::before,
          .profile-hero::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <main className="profile-page">
        <div className="profile-shell">
          <section className="profile-hero" aria-labelledby="profile-title">
            <div className="hero-content">
              <div className="avatar-wrap">
                <div className="avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="โปรไฟล์ผู้ใช้งาน" /> : <Icon.User />}
                </div>
                <Link className="avatar-camera" href="/profile/edit" aria-label="เปลี่ยนรูปโปรไฟล์">
                  <Icon.Camera />
                </Link>
              </div>

              <div>
                <div className="hero-kicker">
                  <Icon.Paw />
                  User Profile
                </div>
                <div className="hero-title-row">
                  <h1 className="hero-title" id="profile-title">
                    {displayName}
                  </h1>
                  <span className="verified-badge" aria-label="ยืนยันแล้ว">
                    <Icon.Check />
                  </span>
                </div>
                <p className="hero-email">{email}</p>

                <div className="profile-progress" aria-label={`โปรไฟล์สมบูรณ์ ${profileCompletion}%`}>
                  <div className="progress-label">
                    <span>โปรไฟล์สมบูรณ์</span>
                    <strong>{profileCompletion}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${profileCompletion}%` }} />
                  </div>
                </div>

                <div className="hero-actions">
                  <Link className="button-primary" href="/profile/edit">
                    <Icon.Edit />
                    แก้ไขข้อมูล
                  </Link>
                  <Link className="button-secondary" href="/pets/create">
                    <Icon.Paw />
                    เพิ่มสัตว์เลี้ยง
                  </Link>
                </div>
              </div>
            </div>

            <div className="hero-meta" aria-label="สรุปบัญชี">
              <div className="meta-pill">
                <strong>{pets.length}</strong>
                <span>สัตว์เลี้ยง</span>
              </div>
              <div className="meta-pill">
                <strong>{appointments.length}</strong>
                <span>นัดสุขภาพ</span>
              </div>
              <div className="meta-pill">
                <strong>{businessCount}</strong>
                <span>ธุรกิจ</span>
              </div>
            </div>
          </section>

          <section className="quick-grid" aria-label="ทางลัดโปรไฟล์">
            <QuickCard href="/profile/pets" icon={<img src="/icons/icon-pets.png" alt="" />} title="สัตว์เลี้ยงทั้งหมด" desc="จัดการโปรไฟล์และ Pet ID" />
            <QuickCard href="/pets/vaccines/bulk-add" icon={<img src="/icons/icon-vaccine.png" alt="" />} title="สุขภาพและวัคซีน" desc="เพิ่มประวัติแบบเร็ว" disabled={pets.length === 0} />
            <QuickCard href="/profile/finance" icon={<img src="/icons/icon-wallet.png" alt="" />} title="รายรับรายจ่าย" desc="บันทึกค่าใช้จ่าย" />
            <QuickCard href="/partner" icon={<img src="/icons/icon-partner.png" alt="" />} title="พาร์ทเนอร์" desc={businessCount > 0 ? `${businessCount} ธุรกิจที่ดูแล` : "ฟาร์ม ร้านค้า บริการ"} />
          </section>

          <div className="profile-grid">
            <section className="profile-card" aria-labelledby="calendar-title">
              <div className="card-head">
                <div className="card-title">
                  <span className="card-title-icon"><img src="/icons/icon-calendar.png" alt="" /></span>
                  <h2 id="calendar-title">ปฏิทินวันนัด</h2>
                </div>
                <Link className="card-link" href="/pets/vaccines/all">
                  ดูทั้งหมด <Icon.ArrowRight />
                </Link>
              </div>

              <div className="calendar-layout">
                <div>
                  <div className="calendar-toolbar">
                    <button className="icon-button" type="button" onClick={handlePrevMonth} aria-label="เดือนก่อนหน้า">
                      <Icon.ChevronLeft />
                    </button>
                    <div className="calendar-month">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                    </div>
                    <button className="icon-button" type="button" onClick={handleNextMonth} aria-label="เดือนถัดไป">
                      <Icon.ChevronRight />
                    </button>
                  </div>

                  <div className="calendar-grid">
                    {weekDays.map((day) => (
                      <div className="weekday" key={day}>
                        {day}
                      </div>
                    ))}
                    {[...Array(firstDayOfMonth)].map((_, index) => (
                      <div className="day-cell" aria-hidden="true" key={`empty-${index}`} />
                    ))}
                    {[...Array(daysInMonth)].map((_, index) => {
                      const day = index + 1;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const cellDate = new Date(dateStr);
                      cellDate.setHours(0, 0, 0, 0);

                      const dayAppointments = appointments.filter((item) => item.next_due && item.next_due.split("T")[0] === dateStr);
                      const hasEvent = dayAppointments.length > 0;
                      const isToday = cellDate.getTime() === today.getTime();

                      const dayClassName = `day-cell ${hasEvent ? "has-event" : ""} ${isToday ? "is-today" : ""}`;
                      const dayContent = (
                        <>
                          {day}
                          {hasEvent && (
                            <span className="event-dots" aria-hidden="true">
                              {dayAppointments.slice(0, 3).map((_, dotIndex) => (
                                <i key={dotIndex} />
                              ))}
                            </span>
                          )}
                        </>
                      );

                      return hasEvent ? (
                        <Link className={dayClassName} href={`/pets/vaccines/all?date=${dateStr}`} key={day} aria-label={`${day} ${monthNames[currentDate.getMonth()]} มีนัด ${dayAppointments.length} รายการ`}>
                          {dayContent}
                        </Link>
                      ) : (
                        <span className={dayClassName} key={day}>
                          {dayContent}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  {upcomingAppointments.length > 0 ? (
                    <div className="appointment-list">
                      {upcomingAppointments.map((item, index) => {
                        const pet = pets.find((entry) => entry.id === item.pet_id);
                        const diffDays = Math.ceil((item.dueDate.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
                        return (
                          <div className="appointment-item" key={`${item.pet_id}-${item.next_due}-${index}`}>
                            <span className="appointment-avatar">
                              {pet?.image_url ? <img src={pet.image_url} alt={item.petName} /> : <Icon.Paw />}
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <strong>{item.vaccine_name || "กำหนดดูแลสุขภาพ"}</strong>
                              <span>{item.petName} · {formatDate(item.dueDate)}</span>
                            </span>
                            <span className="status-pill">{diffDays <= 7 ? "ใกล้ถึง" : "รออยู่"}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-box">
                      ยังไม่มีนัดหมายที่กำลังจะมาถึง เมื่อเพิ่มข้อมูลวัคซีนหรือกำหนดดูแล ระบบจะแสดงบนปฏิทินนี้
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div style={{ display: "grid", gap: 18 }}>
              <section className="profile-card" aria-labelledby="pets-title">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon"><img src="/icons/icon-my-pets.png" alt="" /></span>
                    <h2 id="pets-title">สัตว์เลี้ยงของฉัน</h2>
                  </div>
                  <Link className="card-link" href="/profile/pets">
                    ทั้งหมด <Icon.ArrowRight />
                  </Link>
                </div>

                {pets.length > 0 ? (
                  <div className="pet-list">
                    {pets.slice(0, 4).map((pet) => (
                      <Link className="pet-row" href={`/pets/${pet.id}`} key={pet.id}>
                        <span className="pet-avatar">
                          {pet.image_url ? <img src={pet.image_url} alt={pet.name || "สัตว์เลี้ยง"} /> : <Icon.Paw />}
                        </span>
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <strong>{pet.name || "ยังไม่มีชื่อ"}</strong>
                          <span>{[pet.species, pet.breed].filter(Boolean).join(" · ") || "ยังไม่ได้ระบุชนิด"}</span>
                        </span>
                        <Icon.ArrowRight />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="empty-box">
                    ยังไม่มีสัตว์เลี้ยงในบัญชี เริ่มจากการเพิ่มโปรไฟล์สัตว์เลี้ยงเพื่อสร้าง Pet ID และเก็บประวัติสุขภาพ
                  </div>
                )}
              </section>

              <Link className="profile-card finance-card" href="/profile/finance">
                <span className="card-title-icon"><img src="/icons/icon-wallet.png" alt="" /></span>
                <span style={{ minWidth: 0 }}>
                  <strong>{pets.length}</strong>
                  <span style={{ display: "block", color: F.muted, fontSize: 12, fontWeight: 650, marginTop: 5 }}>
                    โปรไฟล์สำหรับบันทึกค่าใช้จ่าย
                  </span>
                </span>
                <Icon.ArrowRight />
              </Link>
            </div>
          </div>

          {isPartner && (
            <section className="profile-card" aria-labelledby="business-title">
              <div className="card-head">
                <div className="card-title">
                  <span className="card-title-icon"><img src="/icons/icon-farm.png" alt="" /></span>
                  <h2 id="business-title">ธุรกิจที่ดูแล</h2>
                </div>
              </div>
              <div className="business-list">
                {myFarms.map((farm) => (
                  <BusinessLink key={farm.id} href={`/farm-dashboard/${farm.id}?from=profile`} label={farm.farm_name} type="ฟาร์ม" icon={<img src="/icons/icon-farm.png" alt="" />} />
                ))}
                {myShops.map((shop) => (
                  <BusinessLink key={shop.id} href={`/shop-dashboard/${shop.id}?from=profile`} label={shop.shop_name} type="ร้านค้า" icon={<img src="/icons/icon-shop.png" alt="" />} />
                ))}
                {myServices.map((service) => (
                  <BusinessLink key={service.id} href={`/service-dashboard/${service.id}?from=profile`} label={service.service_name} type="บริการ" icon={<img src="/icons/icon-service.png" alt="" />} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function QuickCard({ href, icon, title, desc, disabled = false }: { href: string; icon: ReactNode; title: string; desc: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="quick-card" aria-disabled="true" style={{ opacity: 0.58 }}>
        <div className="quick-icon">{icon}</div>
        <div>
          <strong>{title}</strong>
          <span>{desc}</span>
        </div>
      </div>
    );
  }

  return (
    <Link className="quick-card" href={href}>
      <div className="quick-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
    </Link>
  );
}

function BusinessLink({ href, label, type, icon }: BusinessLinkProps) {
  return (
    <Link className="business-link" href={href}>
      <span className="business-icon">{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <small>{type}</small>
        <strong>{label}</strong>
      </span>
      <Icon.ArrowRight />
    </Link>
  );
}
