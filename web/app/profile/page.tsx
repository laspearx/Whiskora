"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const F = {
  ink: "#21192F",
  inkSoft: "#42394F",
  muted: "#70697D",
  pink: "#EF3E7B",
  pinkDeep: "#D83269",
  blush: "#FFF7FA",
  line: "#F1D9E2",
  paper: "#FFFFFF",
};

const Icon = {
  User: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21v-2.2a4.8 4.8 0 0 0-4.8-4.8H8.8A4.8 4.8 0 0 0 4 18.8V21" />
      <circle cx="12" cy="7.5" r="4" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
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
  Business: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  ),
  Farm: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10 12 3l9 7" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 11h6" />
    </svg>
  ),
  Shop: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9 7 3h10l2 6" />
      <path d="M4 9h16v11H4z" />
      <path d="M9 13h6" />
    </svg>
  ),
  Service: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4v6a4 4 0 0 0 8 0V4" />
      <path d="M12 14v7" />
      <path d="M8 21h8" />
      <circle cx="19" cy="8" r="2" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 20 6v5.6c0 4.8-3.2 7.8-8 9.4-4.8-1.6-8-4.6-8-9.4V6l8-3Z" />
      <path d="m8.8 12.2 2.1 2.1 4.4-4.7" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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
  const displayName = profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Whiskora User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const email = user?.email || "-";

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
        .profile-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 18% 0%, rgba(255, 231, 239, 0.9), transparent 34%),
            linear-gradient(180deg, #ffffff 0%, #fff8fb 42%, #ffffff 72%, #fff7fb 100%);
          color: ${F.ink};
          font-family: var(--font-ui), inherit;
          overflow-x: clip;
        }

        .profile-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 18px 0 88px;
        }

        .profile-hero {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .profile-panel,
        .profile-card {
          border: 1px solid ${F.line};
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 18px 44px rgba(59, 35, 70, 0.08);
          backdrop-filter: blur(10px);
        }

        .profile-panel {
          position: relative;
          overflow: hidden;
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .profile-panel::after {
          content: "";
          position: absolute;
          right: -54px;
          bottom: -62px;
          width: 180px;
          height: 180px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(239, 62, 123, 0.14), transparent 66%);
          pointer-events: none;
        }

        .avatar {
          width: 86px;
          height: 86px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #f2d4df;
          background: linear-gradient(135deg, #fff1f6, #ffffff);
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          box-shadow: 0 14px 28px rgba(239, 62, 123, 0.12);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-page svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex: 0 0 auto;
        }

        .avatar svg {
          width: 48px;
          height: 48px;
          stroke-width: 1.6;
        }

        .profile-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 32px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #fff1f6;
          color: ${F.pinkDeep};
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .profile-title {
          margin: 0;
          color: ${F.ink};
          font-size: clamp(30px, 8vw, 42px);
          line-height: 1.13;
          font-weight: 800;
          letter-spacing: 0;
        }

        .profile-email {
          margin: 8px 0 0;
          color: ${F.inkSoft};
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .profile-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        .button-primary,
        .button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
          border-radius: 16px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
        }

        .button-primary {
          background: ${F.pink};
          color: white;
          box-shadow: 0 12px 26px rgba(232, 70, 119, 0.22);
        }

        .button-secondary {
          border: 1px solid ${F.line};
          background: ${F.paper};
          color: ${F.ink};
        }

        .button-primary:hover,
        .button-secondary:hover {
          transform: translateY(-1px);
        }

        .profile-summary {
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
        }

        .summary-row {
          min-height: 86px;
          display: grid;
          align-content: center;
          justify-items: center;
          text-align: center;
          gap: 6px;
          border-right: 1px solid #f7dce6;
          padding: 8px;
        }

        .summary-row:last-child {
          border-right: 0;
          padding-bottom: 8px;
        }

        .summary-row span {
          color: ${F.muted};
          font-size: 11px;
          font-weight: 700;
          line-height: 1.35;
        }

        .summary-row strong {
          color: ${F.pink};
          font-size: 28px;
          line-height: 1;
          font-weight: 800;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          align-items: start;
        }

        .profile-card {
          padding: 18px;
        }

        .card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .card-head h2,
        .card-head h3 {
          margin: 0;
          color: ${F.ink};
          font-size: 20px;
          line-height: 1.35;
          font-weight: 800;
        }

        .card-head p {
          margin: 5px 0 0;
          color: ${F.muted};
          font-size: 13px;
          line-height: 1.65;
          font-weight: 500;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .quick-card {
          min-height: 116px;
          border: 1px solid #f2d4df;
          border-radius: 16px;
          background: ${F.paper};
          padding: 16px;
          color: ${F.ink};
          text-decoration: none;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 14px;
        }

        .quick-card:hover {
          transform: translateY(-2px);
          border-color: ${F.pink};
          box-shadow: 0 14px 30px rgba(232, 70, 119, 0.1);
        }

        .quick-icon {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff1f6;
          color: ${F.pink};
        }

        .quick-card strong {
          display: block;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .quick-card span {
          display: block;
          color: ${F.muted};
          font-size: 12px;
          line-height: 1.55;
          font-weight: 500;
        }

        .calendar-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-button {
          width: 40px;
          height: 40px;
          border: 1px solid ${F.line};
          border-radius: 999px;
          background: ${F.paper};
          color: ${F.ink};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .calendar-month {
          min-width: 132px;
          text-align: center;
          color: ${F.ink};
          font-size: 14px;
          font-weight: 800;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
        }

        .weekday,
        .day-cell {
          min-width: 0;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .weekday {
          color: ${F.muted};
          font-size: 11px;
          font-weight: 800;
          aspect-ratio: auto;
          min-height: 24px;
        }

        .day-cell {
          position: relative;
          border-radius: 12px;
          color: ${F.inkSoft};
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.82);
        }

        .day-cell.has-event {
          background: #fff1f6;
          color: ${F.pinkDeep};
          box-shadow: inset 0 0 0 1px #f5bfd2;
        }

        .day-cell.is-today {
          background: ${F.pink};
          color: white;
          box-shadow: 0 10px 24px rgba(232, 70, 119, 0.2);
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
          gap: 10px;
          margin-top: 16px;
        }

        .appointment-item {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #f2d4df;
          border-radius: 16px;
          padding: 12px;
          background: #fffafd;
        }

        .appointment-date {
          width: 58px;
          flex: 0 0 auto;
          text-align: center;
          color: ${F.pinkDeep};
          font-size: 11px;
          font-weight: 900;
        }

        .appointment-item strong {
          display: block;
          color: ${F.ink};
          font-size: 14px;
          line-height: 1.4;
        }

        .appointment-item span {
          color: ${F.muted};
          font-size: 12px;
          font-weight: 650;
        }

        .pet-preview {
          display: grid;
          gap: 10px;
        }

        .pet-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #f2d4df;
          border-radius: 16px;
          padding: 12px;
          color: ${F.ink};
          text-decoration: none;
          background: ${F.paper};
          box-shadow: 0 10px 26px rgba(59, 35, 70, 0.04);
        }

        .pet-avatar {
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

        .pet-row strong {
          display: block;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 800;
        }

        .pet-row span {
          color: ${F.muted};
          font-size: 12px;
          font-weight: 650;
        }

        .business-list {
          display: grid;
          gap: 10px;
        }

        .business-link {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #f2d4df;
          border-radius: 16px;
          padding: 12px;
          background: ${F.paper};
          color: ${F.ink};
          text-decoration: none;
        }

        .business-icon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: #fff1f6;
          color: ${F.pink};
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .business-link small {
          display: block;
          color: ${F.muted};
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 2px;
        }

        .business-link strong {
          display: block;
          color: ${F.ink};
          font-size: 14px;
          line-height: 1.35;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .empty-box {
          border: 1px dashed ${F.line};
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.68);
          padding: 18px;
          color: ${F.inkSoft};
          font-size: 13px;
          line-height: 1.7;
          font-weight: 600;
        }

        @media (min-width: 760px) {
          .profile-shell {
            width: 100%;
            max-width: 1180px;
            padding: 34px 0 96px;
          }

          .profile-hero {
            grid-template-columns: minmax(0, 1fr) 330px;
            gap: 18px;
            margin-bottom: 18px;
          }

          .profile-panel {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 20px;
            align-items: center;
            padding: 24px;
          }

          .avatar {
            width: 108px;
            height: 108px;
            border-radius: 28px;
          }

          .profile-title {
            font-size: clamp(36px, 4vw, 48px);
          }

          .profile-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .button-primary,
          .button-secondary {
            width: auto;
            min-height: 44px;
            border-radius: 999px;
          }

          .profile-summary {
            grid-template-columns: 1fr;
            padding: 18px;
            gap: 10px;
          }

          .summary-row {
            min-height: auto;
            display: flex;
            justify-content: space-between;
            text-align: left;
            justify-items: stretch;
            border-right: 0;
            border-bottom: 1px solid #f7dce6;
            padding: 0 0 10px;
          }

          .summary-row:last-child {
            border-bottom: 0;
            padding-bottom: 0;
          }

          .summary-row strong {
            font-size: 22px;
          }

          .quick-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .quick-card {
            display: block;
            min-height: 132px;
          }

          .quick-icon {
            margin-bottom: 12px;
          }

          .profile-grid {
            grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
            gap: 18px;
          }
        }

        @media (max-width: 420px) {
          .profile-shell {
            padding-top: 14px;
          }

          .profile-panel,
          .profile-card {
            border-radius: 16px;
          }

          .profile-panel {
            padding: 18px;
          }

          .profile-title {
            font-size: 32px;
          }

          .profile-card {
            padding: 16px;
          }

          .card-head {
            flex-direction: column;
            align-items: stretch;
          }

          .calendar-toolbar {
            justify-content: space-between;
          }

          .calendar-grid {
            gap: 4px;
          }

          .day-cell {
            border-radius: 10px;
            font-size: 12px;
          }
        }
      `}</style>

      <main className="profile-page">
        <div className="profile-shell">
          <section className="profile-hero" aria-labelledby="profile-title">
            <div className="profile-panel">
              <div className="avatar">
                {avatarUrl ? <img src={avatarUrl} alt="โปรไฟล์ผู้ใช้งาน" /> : <Icon.User />}
              </div>
              <div>
                <div className="profile-eyebrow">
                  <Icon.Shield />
                  Whiskora Owner Profile
                </div>
                <h1 className="profile-title" id="profile-title">
                  {displayName}
                </h1>
                <p className="profile-email">{email}</p>
                <div className="profile-actions">
                  <Link className="button-primary" href="/pets/create">
                    <Icon.Plus />
                    เพิ่มสัตว์เลี้ยง
                  </Link>
                  <Link className="button-secondary" href="/profile/edit">
                    <Icon.Edit />
                    แก้ไขโปรไฟล์
                  </Link>
                  <Link className="button-secondary" href="/profile/pets">
                    <Icon.Paw />
                    ดูสัตว์เลี้ยงทั้งหมด
                  </Link>
                </div>
              </div>
            </div>

            <aside className="profile-summary profile-card" aria-label="สรุปบัญชีผู้ใช้งาน">
              <div className="summary-row">
                <span>สัตว์เลี้ยงในบัญชี</span>
                <strong>{pets.length}</strong>
              </div>
              <div className="summary-row">
                <span>นัดวัคซีนที่บันทึกไว้</span>
                <strong>{appointments.length}</strong>
              </div>
              <div className="summary-row">
                <span>ธุรกิจที่ดูแล</span>
                <strong>{myFarms.length + myShops.length + myServices.length}</strong>
              </div>
            </aside>
          </section>

          <section className="profile-card" aria-labelledby="quick-actions-title">
            <div className="card-head">
              <div>
                <h2 id="quick-actions-title">จัดการข้อมูลสัตว์เลี้ยง</h2>
                <p>ทางลัดสำหรับงานที่เจ้าของใช้บ่อย ตั้งแต่ Pet ID ไปจนถึงประวัติสุขภาพและค่าใช้จ่าย</p>
              </div>
            </div>

            <div className="quick-grid">
              <QuickCard
                href="/profile/pets"
                icon={<Icon.Paw />}
                title="Pet Profiles"
                desc="ดูและจัดการโปรไฟล์สัตว์เลี้ยงทั้งหมด"
              />
              <QuickCard
                href="/pets/vaccines/bulk-add"
                icon={<Icon.Health />}
                title="Health Records"
                desc="เพิ่มวัคซีนและประวัติสุขภาพแบบกลุ่ม"
                disabled={pets.length === 0}
              />
              <QuickCard
                href="/profile/finance"
                icon={<Icon.Wallet />}
                title="Finance"
                desc="บันทึกค่าใช้จ่าย อาหาร คลินิก และบริการ"
              />
            </div>
          </section>

          <div className="profile-grid">
            <div className="profile-card">
              <div className="card-head">
                <div>
                  <h2>ปฏิทินสุขภาพ</h2>
                  <p>ดูวันนัดวัคซีนหรือกำหนดดูแลสุขภาพที่บันทึกไว้ของสัตว์เลี้ยง</p>
                </div>
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
                    <Link
                      className={dayClassName}
                      href={`/pets/vaccines/all?date=${dateStr}`}
                      key={day}
                      aria-label={`${day} ${monthNames[currentDate.getMonth()]} มีนัด ${dayAppointments.length} รายการ`}
                    >
                      {dayContent}
                    </Link>
                  ) : (
                    <span className={dayClassName} key={day}>
                      {dayContent}
                    </span>
                  );
                })}
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="appointment-list">
                  {upcomingAppointments.map((item, index) => (
                    <div className="appointment-item" key={`${item.pet_id}-${item.next_due}-${index}`}>
                      <div className="appointment-date">{formatDate(item.dueDate)}</div>
                      <div>
                        <strong>{item.vaccine_name || "กำหนดดูแลสุขภาพ"}</strong>
                        <span>{item.petName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-box" style={{ marginTop: 14 }}>
                  ยังไม่มีนัดสุขภาพที่กำลังจะมาถึง เมื่อเพิ่มข้อมูลวัคซีนหรือกำหนดดูแล ระบบจะแสดงบนปฏิทินนี้
                </div>
              )}
            </div>

            <div className="profile-card">
              <div className="card-head">
                <div>
                  <h2>สัตว์เลี้ยงของฉัน</h2>
                  <p>รายการล่าสุดจากโปรไฟล์สัตว์เลี้ยงในบัญชีนี้</p>
                </div>
                <Link className="button-secondary" href="/profile/pets">
                  ทั้งหมด
                  <Icon.ArrowRight />
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
            </div>
          </div>

          {isPartner && (
            <section className="profile-card" style={{ marginTop: 18 }} aria-labelledby="business-title">
              <div className="card-head">
                <div>
                  <h2 id="business-title">ธุรกิจและพาร์ทเนอร์</h2>
                  <p>จัดการฟาร์ม ร้านค้า หรือบริการที่ผูกกับบัญชีนี้</p>
                </div>
              </div>

              <div className="business-list">
                {myFarms.map((farm) => (
                  <BusinessLink
                    key={farm.id}
                    href={`/farm-dashboard/${farm.id}?from=profile`}
                    label={farm.farm_name}
                    type="ฟาร์ม"
                    icon={<Icon.Farm />}
                  />
                ))}
                {myShops.map((shop) => (
                  <BusinessLink
                    key={shop.id}
                    href={`/shop-dashboard/${shop.id}?from=profile`}
                    label={shop.shop_name}
                    type="ร้านค้า"
                    icon={<Icon.Shop />}
                  />
                ))}
                {myServices.map((service) => (
                  <BusinessLink
                    key={service.id}
                    href={`/service-dashboard/${service.id}?from=profile`}
                    label={service.service_name}
                    type="บริการ"
                    icon={<Icon.Service />}
                  />
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
