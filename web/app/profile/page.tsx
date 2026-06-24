"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const F = {
  ink: "#21192F",
  inkSoft: "#51485D",
  muted: "#8B8294",
  pink: "#EF3E7B",
  pinkDeep: "#D83269",
  blush: "#FFF7FA",
  line: "#F1D9E2",
  green: "#35A86E",
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
  Bell: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.2 9 9 0 0 1-3.8-.8L3 21l1.7-5a8 8 0 0 1-.7-3.4A8.4 8.4 0 0 1 12.5 4 8.4 8.4 0 0 1 21 11.5Z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </svg>
  ),
  CheckBadge: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8 14.6 5l3.4.2.7 3.3 2.2 2.5-1.4 3.1.5 3.4-3.2 1.3-1.8 2.9-3-1.7-3 1.7-1.8-2.9L4 17.5l.5-3.4L3.1 11l2.2-2.5L6 5.2 9.4 5 12 2.8Z" />
      <path d="m8.8 12.2 2.1 2.1 4.5-4.8" />
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
            font-weight: 800;
            letter-spacing: 0.08em;
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
          from { opacity: 0; transform: translateY(18px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes profile-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes profile-shine {
          from { transform: translateX(-120%) rotate(16deg); }
          to { transform: translateX(160%) rotate(16deg); }
        }

        .profile-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 8%, rgba(255, 226, 238, .82), transparent 28%),
            radial-gradient(circle at 92% 2%, rgba(244, 222, 255, .72), transparent 30%),
            linear-gradient(180deg, #fffefe 0%, #fff8fb 45%, #ffffff 72%, #fff7fb 100%);
          color: ${F.ink};
          font-family: var(--font-ui), inherit;
          overflow-x: clip;
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
          width: 100%;
          max-width: 1040px;
          margin: 0 auto;
          padding: 18px 0 88px;
        }

        .profile-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 6px 0 22px;
          animation: profile-rise .5s ease both;
        }

        .profile-brand {
          color: ${F.pink};
          font-size: clamp(30px, 8vw, 46px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .profile-brand span {
          display: inline-grid;
          place-items: center;
          width: .82em;
          height: .82em;
          margin: 0 .02em;
          border-radius: 999px;
          background: ${F.pink};
          color: white;
          font-size: .52em;
          vertical-align: .08em;
        }

        .topbar-actions {
          display: flex;
          gap: 10px;
        }

        .topbar-button {
          position: relative;
          width: 42px;
          height: 42px;
          border: 1px solid #f3dce5;
          border-radius: 16px;
          background: rgba(255, 255, 255, .86);
          color: ${F.ink};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 26px rgba(59, 35, 70, .06);
          cursor: pointer;
        }

        .topbar-button.has-dot::after {
          content: "";
          position: absolute;
          top: 9px;
          right: 10px;
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: ${F.pink};
          border: 2px solid white;
        }

        .profile-page-heading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin: 0 0 22px;
          text-align: center;
          animation: profile-rise .55s ease .05s both;
        }

        .profile-page-heading h1 {
          margin: 0;
          color: ${F.ink};
          font-size: clamp(28px, 7vw, 40px);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }

        .heading-paw {
          color: #ffd2e2;
          animation: profile-float 4.8s ease-in-out infinite;
        }

        .profile-card,
        .profile-panel {
          border: 1px solid ${F.line};
          border-radius: 28px;
          background: rgba(255, 255, 255, .9);
          box-shadow: 0 18px 38px rgba(59, 35, 70, .08);
          backdrop-filter: blur(14px);
        }

        .profile-hero {
          animation: profile-rise .62s ease .1s both;
        }

        .profile-panel {
          position: relative;
          overflow: hidden;
          padding: 24px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 24px;
          align-items: center;
        }

        .profile-panel::before {
          content: "";
          position: absolute;
          inset: -40% auto auto -50%;
          width: 48%;
          height: 190%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .42), transparent);
          animation: profile-shine 8s ease-in-out infinite;
          pointer-events: none;
        }

        .avatar-wrap {
          position: relative;
          width: 154px;
          height: 154px;
        }

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 999px;
          overflow: hidden;
          border: 7px solid #fff;
          outline: 4px solid #ffe0eb;
          background: linear-gradient(135deg, #fff1f6, #ffffff);
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 18px 32px rgba(239, 62, 123, .15);
        }

        .avatar svg {
          width: 58px;
          height: 58px;
          stroke-width: 1.7;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-camera {
          position: absolute;
          right: -4px;
          bottom: 10px;
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: ${F.pink};
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 4px solid white;
          box-shadow: 0 12px 24px rgba(239, 62, 123, .28);
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .profile-title {
          margin: 0;
          color: ${F.ink};
          font-size: clamp(28px, 6vw, 38px);
          line-height: 1.13;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .verified-badge {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: ${F.pink};
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 24px rgba(239, 62, 123, .22);
        }

        .profile-email {
          margin: 8px 0 0;
          color: ${F.inkSoft};
          font-size: 14px;
          line-height: 1.5;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .owner-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid #ffd7e5;
          background: #fff7fa;
          color: ${F.pinkDeep};
          font-size: 13px;
          font-weight: 900;
          margin-top: 12px;
        }

        .profile-progress {
          margin-top: 16px;
          max-width: 430px;
        }

        .progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          color: ${F.inkSoft};
          font-size: 13px;
          font-weight: 800;
        }

        .progress-track {
          height: 10px;
          border-radius: 999px;
          background: #f5e5eb;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, ${F.pinkDeep}, #ff5b99);
          box-shadow: 0 8px 18px rgba(239, 62, 123, .24);
          transition: width .5s ease;
        }

        .profile-actions {
          margin-top: 22px;
        }

        .button-primary,
        .button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
          border-radius: 18px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .button-primary {
          width: min(100%, 420px);
          background: linear-gradient(135deg, ${F.pinkDeep}, #ff4f93);
          color: white;
          box-shadow: 0 12px 26px rgba(232, 70, 119, .24);
        }

        .button-secondary {
          border: 1px solid ${F.line};
          background: #fff;
          color: ${F.ink};
        }

        .button-primary:hover,
        .button-secondary:hover,
        .quick-card:hover,
        .pet-row:hover,
        .business-link:hover {
          transform: translateY(-2px);
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
          animation: profile-rise .66s ease .16s both;
        }

        .quick-card {
          min-height: 132px;
          border: 1px solid #f2d4df;
          border-radius: 24px;
          background: linear-gradient(135deg, #fff8fb, #ffffff);
          padding: 16px;
          color: ${F.ink};
          text-decoration: none;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          box-shadow: 0 12px 28px rgba(59, 35, 70, .055);
        }

        .quick-card:hover {
          border-color: ${F.pink};
          box-shadow: 0 16px 32px rgba(232, 70, 119, .1);
        }

        .quick-icon {
          width: 72px;
          height: 72px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ffd3e3, #fff1f7);
          color: ${F.pink};
        }

        .quick-card:nth-child(2) .quick-icon {
          background: linear-gradient(135deg, #eadbff, #fff7ff);
          color: #a767ee;
        }

        .quick-card:nth-child(3) {
          grid-column: 1 / -1;
        }

        .quick-card:nth-child(3) .quick-icon {
          background: linear-gradient(135deg, #d9f7e9, #f4fffa);
          color: #39a86f;
        }

        .quick-card strong {
          display: block;
          font-size: 16px;
          line-height: 1.35;
          font-weight: 900;
          margin-bottom: 5px;
        }

        .quick-card span {
          display: block;
          color: ${F.muted};
          font-size: 12px;
          line-height: 1.55;
          font-weight: 650;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
          gap: 18px;
          align-items: start;
          margin-top: 18px;
        }

        .profile-card {
          padding: 20px;
          animation: profile-rise .62s ease both;
        }

        .card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .card-title-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #fff1f6;
          color: ${F.pink};
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .card-head h2,
        .card-head h3 {
          margin: 0;
          color: ${F.ink};
          font-size: 21px;
          line-height: 1.35;
          font-weight: 900;
        }

        .card-link {
          color: ${F.pink};
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .calendar-area {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(280px, 1fr);
          gap: 18px;
        }

        .calendar-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .icon-button {
          width: 38px;
          height: 38px;
          border: 1px solid ${F.line};
          border-radius: 999px;
          background: #fff;
          color: ${F.ink};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .calendar-month {
          text-align: center;
          color: ${F.ink};
          font-size: 15px;
          font-weight: 900;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
          border: 1px solid #f4d8e2;
          border-radius: 22px;
          padding: 14px;
          background: rgba(255, 255, 255, .78);
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
          font-size: 11px;
          font-weight: 900;
          min-height: 24px;
        }

        .weekday:first-child {
          color: ${F.pink};
        }

        .day-cell {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          color: ${F.inkSoft};
          text-decoration: none;
          font-size: 13px;
          font-weight: 750;
          background: rgba(255, 255, 255, .82);
        }

        .day-cell.has-event {
          background: #fff1f6;
          color: ${F.pinkDeep};
          box-shadow: inset 0 0 0 1px #f5bfd2;
        }

        .day-cell.is-today {
          background: ${F.pink};
          color: white;
          box-shadow: 0 10px 24px rgba(232, 70, 119, .2);
        }

        .day-cell.is-past.has-event {
          background: #f7f3f6;
          color: ${F.muted};
          box-shadow: inset 0 0 0 1px #eee3e8;
        }

        .event-dots {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
        }

        .event-dots i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
        }

        .appointment-list {
          display: grid;
          gap: 0;
        }

        .appointment-item {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #f3e6ec;
          padding: 12px 0;
        }

        .appointment-item:last-child {
          border-bottom: 0;
        }

        .appointment-avatar {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          overflow: hidden;
          background: #fff1f6;
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .appointment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .appointment-item strong {
          display: block;
          color: ${F.ink};
          font-size: 14px;
          line-height: 1.4;
          font-weight: 900;
        }

        .appointment-item span {
          color: ${F.muted};
          font-size: 12px;
          font-weight: 700;
        }

        .status-pill {
          border-radius: 999px;
          padding: 7px 10px;
          background: #fff1f6;
          color: ${F.pinkDeep};
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .status-pill.soon {
          background: #fff8e7;
          color: #b77b14;
        }

        .empty-box {
          border: 1px dashed ${F.line};
          border-radius: 18px;
          background: rgba(255, 255, 255, .68);
          padding: 18px;
          color: ${F.inkSoft};
          font-size: 13px;
          line-height: 1.7;
          font-weight: 650;
        }

        .finance-card {
          margin-top: 18px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          border-color: #cfeee0;
          background: linear-gradient(135deg, #f4fffa, #ffffff);
          text-decoration: none;
          color: inherit;
        }

        .finance-icon {
          width: 70px;
          height: 70px;
          border-radius: 999px;
          background: linear-gradient(135deg, #c9f2dc, #effff7);
          color: ${F.green};
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .finance-card h2 {
          margin: 0 0 4px;
          color: ${F.ink};
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .finance-card p {
          margin: 0;
          color: ${F.muted};
          font-size: 13px;
          line-height: 1.55;
          font-weight: 650;
        }

        .finance-balance {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-left: 18px;
          border-left: 1px solid #d7eee4;
        }

        .finance-balance small {
          display: block;
          color: ${F.muted};
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 2px;
        }

        .finance-balance strong {
          display: block;
          color: ${F.green};
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.03em;
          white-space: nowrap;
        }

        .pet-preview,
        .business-list {
          display: grid;
          gap: 10px;
        }

        .pet-row,
        .business-link {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #f2d4df;
          border-radius: 18px;
          padding: 12px;
          color: ${F.ink};
          text-decoration: none;
          background: #fff;
          box-shadow: 0 10px 26px rgba(59, 35, 70, .04);
          transition: transform .16s ease, border-color .16s ease;
        }

        .pet-avatar,
        .business-icon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          overflow: hidden;
          background: #fff1f6;
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .pet-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pet-row strong,
        .business-link strong {
          display: block;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 900;
        }

        .pet-row span,
        .business-link small {
          color: ${F.muted};
          font-size: 12px;
          font-weight: 700;
        }

        .below-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 18px;
        }

        @media (max-width: 860px) {
          .profile-panel,
          .calendar-area,
          .profile-grid,
          .below-grid {
            grid-template-columns: 1fr;
          }

          .profile-panel {
            justify-items: center;
            text-align: center;
          }

          .profile-name-row {
            justify-content: center;
          }

          .profile-progress {
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (max-width: 560px) {
          .profile-shell {
            padding-top: 10px;
          }

          .profile-topbar {
            margin-bottom: 18px;
          }

          .profile-panel,
          .profile-card {
            border-radius: 22px;
          }

          .profile-panel,
          .profile-card {
            padding: 16px;
          }

          .avatar-wrap {
            width: 136px;
            height: 136px;
          }

          .profile-title {
            font-size: 30px;
          }

          .quick-grid {
            grid-template-columns: 1fr 1fr;
          }

          .quick-card {
            min-height: 122px;
            grid-template-columns: 1fr auto;
            align-content: center;
            gap: 10px;
            padding: 14px;
          }

          .quick-icon {
            width: 58px;
            height: 58px;
            grid-column: 1 / -1;
          }

          .quick-card strong {
            font-size: 14px;
          }

          .quick-card span {
            font-size: 11px;
          }

          .quick-card:nth-child(3) {
            grid-column: 1 / -1;
          }

          .card-head {
            flex-direction: column;
            align-items: stretch;
          }

          .calendar-grid {
            gap: 4px;
            padding: 12px;
          }

          .day-cell {
            border-radius: 10px;
            font-size: 12px;
          }

          .appointment-item {
            grid-template-columns: 44px minmax(0, 1fr);
          }

          .status-pill {
            grid-column: 2;
            width: fit-content;
          }

          .finance-card {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .finance-balance {
            grid-column: 1 / -1;
            border-left: 0;
            border-top: 1px solid #d7eee4;
            padding: 14px 0 0;
            justify-content: space-between;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .profile-topbar,
          .profile-page-heading,
          .profile-hero,
          .profile-card,
          .quick-grid,
          .heading-paw,
          .profile-panel::before {
            animation: none !important;
          }
        }
      `}</style>

      <main className="profile-page">
        <div className="profile-shell">
          <div className="profile-topbar" aria-label="Whiskora profile header">
            <div className="profile-brand">whisk<span>🐾</span>ra</div>
            <div className="topbar-actions">
              <button className="topbar-button has-dot" type="button" aria-label="การแจ้งเตือน">
                <Icon.Bell />
              </button>
              <button className="topbar-button" type="button" aria-label="ข้อความ">
                <Icon.Chat />
              </button>
            </div>
          </div>

          <div className="profile-page-heading">
            <span className="heading-paw"><Icon.Paw /></span>
            <h1>โปรไฟล์ผู้ใช้งาน</h1>
            <span className="heading-paw" style={{ animationDelay: ".8s" }}><Icon.Paw /></span>
          </div>

          <section className="profile-hero" aria-labelledby="profile-title">
            <div className="profile-panel">
              <div className="avatar-wrap">
                <div className="avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="โปรไฟล์ผู้ใช้งาน" /> : <Icon.User />}
                </div>
                <Link className="avatar-camera" href="/profile/edit" aria-label="เปลี่ยนรูปโปรไฟล์">
                  <Icon.Camera />
                </Link>
              </div>

              <div>
                <div className="profile-name-row">
                  <h2 className="profile-title" id="profile-title">
                    {displayName}
                  </h2>
                  <span className="verified-badge" aria-label="ยืนยันแล้ว">
                    <Icon.CheckBadge />
                  </span>
                </div>
                <p className="profile-email">{email}</p>
                <div className="owner-chip">
                  <Icon.Paw />
                  {isPartner ? "เจ้าของสัตว์เลี้ยงและพาร์ทเนอร์" : "เจ้าของสัตว์เลี้ยง"}
                </div>
                <div className="profile-progress" aria-label={`โปรไฟล์สมบูรณ์ ${profileCompletion}%`}>
                  <div className="progress-label">
                    <span>โปรไฟล์สมบูรณ์</span>
                    <strong>{profileCompletion}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${profileCompletion}%` }} />
                  </div>
                </div>
                <div className="profile-actions">
                  <Link className="button-primary" href="/profile/edit">
                    <Icon.Edit />
                    แก้ไขข้อมูล
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              ทางลัดโปรไฟล์
            </h2>
            <div className="quick-grid">
              <QuickCard href="/profile/pets" icon={<Icon.Paw />} title="ดูสัตว์เลี้ยงทั้งหมด" desc={`${pets.length} โปรไฟล์ในบัญชี`} />
              {businessCount > 0 ? (
                <QuickCard
                  href={myFarms[0]?.id ? `/farm-dashboard/${myFarms[0].id}?from=profile` : myShops[0]?.id ? `/shop-dashboard/${myShops[0].id}?from=profile` : myServices[0]?.id ? `/service-dashboard/${myServices[0].id}?from=profile` : "/partner"}
                  icon={<Icon.Store />}
                  title="ดูพาร์ทเนอร์"
                  desc={`${businessCount} ธุรกิจที่ดูแล`}
                />
              ) : (
                <QuickCard href="/partner" icon={<Icon.Store />} title="ดูพาร์ทเนอร์" desc="ฟาร์ม ร้านค้า และบริการของ Whiskora" />
              )}
              <QuickCard href="/pets/vaccines/bulk-add" icon={<Icon.Health />} title="บันทึกสุขภาพ" desc="เพิ่มวัคซีนและนัดหมาย" disabled={pets.length === 0} />
            </div>
          </section>

          <div className="profile-grid">
            <section className="profile-card" aria-labelledby="calendar-title">
              <div className="card-head">
                <div className="card-title">
                  <span className="card-title-icon"><Icon.Calendar /></span>
                  <h2 id="calendar-title">ปฏิทินวันนัด</h2>
                </div>
                <Link className="card-link" href="/pets/vaccines/all">
                  ดูทั้งหมด <Icon.ArrowRight />
                </Link>
              </div>

              <div className="calendar-area">
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
                      const isPast = cellDate < today;
                      const isToday = cellDate.getTime() === today.getTime();

                      const dayClassName = `day-cell ${hasEvent ? "has-event" : ""} ${isPast ? "is-past" : ""} ${isToday ? "is-today" : ""}`;
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
                            <span className={`status-pill ${diffDays > 7 ? "soon" : ""}`}>{diffDays <= 7 ? "ใกล้ถึง" : "รออยู่"}</span>
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

            <section className="profile-card" aria-labelledby="pets-title">
              <div className="card-head">
                <div className="card-title">
                  <span className="card-title-icon"><Icon.Paw /></span>
                  <h2 id="pets-title">สัตว์เลี้ยงของฉัน</h2>
                </div>
                <Link className="card-link" href="/profile/pets">
                  ทั้งหมด <Icon.ArrowRight />
                </Link>
              </div>

              {pets.length > 0 ? (
                <div className="pet-preview">
                  {pets.slice(0, 5).map((pet) => (
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
                  ยังไม่มีสัตว์เลี้ยงในบัญชี เริ่มจากการเพิ่มโปรไฟล์สัตว์เลี้ยงเพื่อสร้าง Pet ID, QR Profile และเก็บประวัติสุขภาพ
                </div>
              )}
            </section>
          </div>

          <Link className="profile-card finance-card" href="/profile/finance">
            <span className="finance-icon"><Icon.Wallet /></span>
            <span>
              <h2>บันทึกรายรับรายจ่าย</h2>
              <p>จัดการค่าใช้จ่ายของน้อง ๆ อย่างเป็นระบบ</p>
            </span>
            <span className="finance-balance">
              <span>
                <small>จำนวนสัตว์เลี้ยงในบัญชี</small>
                <strong>{pets.length}</strong>
              </span>
              <Icon.ArrowRight />
            </span>
          </Link>

          {isPartner && (
            <section className="below-grid" aria-label="ธุรกิจและพาร์ทเนอร์">
              <div className="profile-card">
                <div className="card-head">
                  <div className="card-title">
                    <span className="card-title-icon"><Icon.Farm /></span>
                    <h2>ธุรกิจที่ดูแล</h2>
                  </div>
                </div>
                <div className="business-list">
                  {myFarms.map((farm) => (
                    <BusinessLink key={farm.id} href={`/farm-dashboard/${farm.id}?from=profile`} label={farm.farm_name} type="ฟาร์ม" icon={<Icon.Farm />} />
                  ))}
                  {myShops.map((shop) => (
                    <BusinessLink key={shop.id} href={`/shop-dashboard/${shop.id}?from=profile`} label={shop.shop_name} type="ร้านค้า" icon={<Icon.Store />} />
                  ))}
                  {myServices.map((service) => (
                    <BusinessLink key={service.id} href={`/service-dashboard/${service.id}?from=profile`} label={service.service_name} type="บริการ" icon={<Icon.Health />} />
                  ))}
                </div>
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
        <Icon.ArrowRight />
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
      <Icon.ArrowRight />
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
