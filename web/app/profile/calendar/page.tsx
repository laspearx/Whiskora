"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  cream: "#fffafc",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  pinkDeep: "#c4325f",
};

const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const shortMonthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const weekDays = ["จ","อ","พ","พฤ","ศ","ส","อา"];

type VaccineAppointment = {
  next_due: string | null;
  vaccine_name: string | null;
  pet_id: string | null;
};

type CalendarEvent = {
  type: "appointment" | "birthday";
  icon: string;
  label: string;
  petName?: string;
  dateStr: string;
};

function getAppointmentIcon(vaccineName: string | null): string {
  if (!vaccineName) return "/icons/icon-calendar.png";
  const v = vaccineName.toLowerCase();
  if (v.includes("วัคซีน") || v.includes("ฉีด") || v.includes("vaccine") || v.includes("inject")) return "/icons/icon-vaccine.png";
  return "/icons/icon-calendar.png";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function CalendarPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<VaccineAppointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login?redirect=/profile/calendar"); return; }
      const { data: petsData } = await supabase.from("pets").select("*").eq("user_id", session.user.id);
      if (petsData) {
        setPets(petsData);
        const petIds = petsData.map((p: any) => p.id);
        if (petIds.length > 0) {
          const { data: vaccines } = await supabase.from("vaccines").select("next_due, vaccine_name, pet_id").in("pet_id", petIds).not("next_due", "is", null);
          if (vaccines) setAppointments(vaccines as VaccineAppointment[]);
        }
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  let firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarEventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    appointments.forEach((item) => {
      if (!item.next_due) return;
      const dateStr = item.next_due.split("T")[0];
      const parts = dateStr.split("-");
      if (parseInt(parts[0]) === year && parseInt(parts[1]) - 1 === month) {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push({ type: "appointment", icon: getAppointmentIcon(item.vaccine_name), label: item.vaccine_name || "กำหนดดูแลสุขภาพ", petName: pets.find((p) => p.id === item.pet_id)?.name, dateStr });
      }
    });
    pets.forEach((pet) => {
      const bd: string | null = pet.birth_date || pet.birthdate || null;
      if (!bd) return;
      const bdParts = bd.split("-");
      const bdMonth = parseInt(bdParts[1]) - 1;
      const bdDay = parseInt(bdParts[2]);
      if (bdMonth === month) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(bdDay).padStart(2, "0")}`;
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push({ type: "birthday", icon: "/icons/icon-my-pets.png", label: `วันเกิด ${pet.name || "สัตว์เลี้ยง"}`, petName: pet.name, dateStr });
      }
    });
    return map;
  }, [appointments, pets, currentDate]);

  const monthEvents = useMemo(() => Object.values(calendarEventsByDate).flat().sort((a, b) => a.dateStr.localeCompare(b.dateStr)), [calendarEventsByDate]);

  const upcomingAppointments = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return appointments
      .filter((item) => item.next_due)
      .map((item) => ({ ...item, dueDate: new Date(String(item.next_due).split("T")[0]), petName: pets.find((p) => p.id === item.pet_id)?.name || "สัตว์เลี้ยง" }))
      .filter((item) => item.dueDate >= today)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 8);
  }, [appointments, pets]);

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        .cal-page { min-height: 100vh; padding: 16px 0 100px; color: ${F.ink}; font-family: var(--font-ui), inherit; }
        .cal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .cal-back { width: 36px; height: 36px; border: 1.5px solid ${F.line}; border-radius: 999px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; text-decoration: none; color: ${F.ink}; }
        .cal-back svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .cal-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .cal-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 18px; margin-bottom: 14px; }
        .cal-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .cal-month-label { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .cal-month-label img { width: 28px; height: 28px; object-fit: contain; opacity: .7; }
        .icon-btn { width: 32px; height: 32px; border: 1px solid ${F.line}; border-radius: 999px; background: white; color: ${F.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .icon-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .weekday { display: flex; align-items: center; justify-content: center; min-height: 22px; font-size: 11px; font-weight: 600; color: ${F.muted}; }
        .weekday:first-child { color: ${F.pink}; }
        .day-cell { position: relative; aspect-ratio: 1; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: ${F.cream}; text-decoration: none; overflow: hidden; }
        .day-num { position: relative; z-index: 2; font-size: 11px; font-weight: 600; color: ${F.inkSoft}; line-height: 1; text-shadow: 0 1px 3px rgba(255,255,255,.85); }
        .day-event-icon { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: .72; }
        .day-cell.has-event { background: ${F.pinkSoft}; }
        .day-cell.has-event .day-num { color: ${F.pinkDeep}; }
        .day-cell.is-today { background: ${F.pink}; box-shadow: 0 6px 16px rgba(232,70,119,.22); }
        .day-cell.is-today .day-num { color: white; }
        .events-section { margin-top: 20px; }
        .events-title { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
        .event-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid ${F.line}; border-radius: 12px; background: white; margin-bottom: 8px; }
        .event-date { display: flex; flex-direction: column; align-items: center; flex: 0 0 36px; }
        .event-day-num { font-size: 18px; font-weight: 800; color: ${F.pink}; line-height: 1; }
        .event-month { font-size: 10px; color: ${F.muted}; font-weight: 500; }
        .event-divider { width: 1px; height: 30px; background: ${F.line}; flex-shrink: 0; }
        .event-icon { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
        .event-text strong { display: block; font-size: 13px; font-weight: 600; color: ${F.ink}; }
        .event-text span { display: block; font-size: 12px; color: ${F.muted}; }
        .appt-list { display: grid; gap: 8px; }
        .appt-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid ${F.line}; border-radius: 14px; background: white; }
        .appt-icon { width: 44px; height: 44px; border-radius: 12px; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .appt-icon img { width: 28px; height: 28px; object-fit: contain; }
        .appt-name { font-size: 14px; font-weight: 600; color: ${F.ink}; display: block; }
        .appt-meta { font-size: 12px; color: ${F.muted}; display: block; margin-top: 2px; }
        .appt-badge { margin-left: auto; border-radius: 999px; padding: 3px 9px; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-size: 10px; font-weight: 600; white-space: nowrap; }
        .empty-box { border: 1px dashed ${F.line}; border-radius: 12px; padding: 20px; color: ${F.muted}; font-size: 13px; text-align: center; line-height: 1.6; }
      `}</style>

      <main className="cal-page">
        <div className="cal-header">
          <Link href="/profile" className="cal-back" aria-label="กลับ">
            <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1>ปฏิทินวันนัด</h1>
        </div>

        <div className="cal-card">
          <div className="cal-toolbar">
            <button className="icon-btn" type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} aria-label="เดือนก่อนหน้า">
              <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="cal-month-label">
              <img src="/icons/icon-calendar.png" alt="" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
            </div>
            <button className="icon-btn" type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} aria-label="เดือนถัดไป">
              <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <div className="cal-grid">
            {weekDays.map((d) => <div className="weekday" key={d}>{d}</div>)}
            {[...Array(firstDayOfMonth)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const cellDate = new Date(dateStr); cellDate.setHours(0, 0, 0, 0);
              const cellEvents = calendarEventsByDate[dateStr] || [];
              const hasEvent = cellEvents.length > 0;
              const isToday = cellDate.getTime() === today.getTime();
              const primaryEvent = cellEvents[0];
              const cls = `day-cell ${hasEvent ? "has-event" : ""} ${isToday ? "is-today" : ""}`;
              const content = (
                <>
                  <span className="day-num">{day}</span>
                  {primaryEvent && !isToday && <img className="day-event-icon" src={primaryEvent.icon} alt="" aria-hidden="true" />}
                </>
              );
              return hasEvent ? (
                <Link key={day} className={cls} href={`/pets/vaccines/all?date=${dateStr}`} aria-label={`${day} ${monthNames[currentDate.getMonth()]} มีกิจกรรม ${cellEvents.length} รายการ`}>{content}</Link>
              ) : (
                <span key={day} className={cls}>{content}</span>
              );
            })}
          </div>

          {monthEvents.length > 0 && (
            <div className="events-section">
              <div className="events-title">กิจกรรมเดือนนี้</div>
              {monthEvents.map((evt, i) => {
                const parts = evt.dateStr.split("-");
                return (
                  <div key={i} className="event-row">
                    <div className="event-date">
                      <span className="event-day-num">{parseInt(parts[2])}</span>
                      <span className="event-month">{shortMonthNames[parseInt(parts[1]) - 1]}</span>
                    </div>
                    <div className="event-divider" />
                    <img className="event-icon" src={evt.icon} alt="" />
                    <div className="event-text">
                      <strong>{evt.label}</strong>
                      {evt.petName && <span>{evt.petName}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="cal-card">
          <div className="events-title" style={{ marginBottom: 14 }}>นัดหมายที่กำลังจะมาถึง</div>
          {upcomingAppointments.length === 0 ? (
            <div className="empty-box">ยังไม่มีนัดหมายที่กำลังจะมาถึง</div>
          ) : (
            <div className="appt-list">
              {upcomingAppointments.map((item, i) => {
                const diffDays = Math.ceil((item.dueDate.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
                return (
                  <div key={i} className="appt-item">
                    <div className="appt-icon">
                      <img src={getAppointmentIcon(item.vaccine_name)} alt="" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="appt-name">{item.vaccine_name || "กำหนดดูแลสุขภาพ"}</span>
                      <span className="appt-meta">{item.petName} · {formatDate(item.dueDate)}</span>
                    </div>
                    <span className="appt-badge">{diffDays === 0 ? "วันนี้" : diffDays === 1 ? "พรุ่งนี้" : diffDays <= 7 ? "ใกล้ถึง" : "รออยู่"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
