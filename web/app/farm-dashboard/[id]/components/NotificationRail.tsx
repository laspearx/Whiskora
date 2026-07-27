"use client";

import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { daysDiff, fmtDate } from "@/lib/farmDashboard/dateHelpers";
import EmptySection from "./EmptySection";
import type { FarmDashboardSummary } from "@/lib/farmDashboard/types";

interface NotificationItem {
  id: string;
  icon: string;
  text: string;
  meta: string;
  href: string;
}

/**
 * Pure live read of existing operational tables (reservations/transfers/vaccines/appointments) —
 * no notifications table exists in this codebase and none is added here. Placed right after
 * TodaysTasks in source order so the existing 2-col desktop grid naturally puts it in the right
 * column (Today's Tasks top-left, this top-right), without introducing a new grid breakpoint.
 */
export default function NotificationRail({ summary, farmId }: { summary: FarmDashboardSummary; farmId: string }) {
  const items: NotificationItem[] = [];

  summary.pending_reservations.forEach((r) => {
    const pet = summary.pets.find((p) => p.id === r.pet_id);
    items.push({
      id: `res-${r.id}`, icon: "/icons/icon-calendar.png",
      text: `คำขอจอง — ${pet?.name || "สัตว์"}`,
      meta: fmtDate(r.created_at, true),
      href: `/farm-dashboard/${farmId}/reservations`,
    });
  });

  summary.pending_transfers_out.forEach((t) => {
    const pet = summary.pets.find((p) => p.id === t.pet_id);
    items.push({
      id: `tr-${t.id}`, icon: "/icons/icon-calendar.png",
      text: `คำขอโอนเจ้าของ — ${pet?.name || "สัตว์"}`,
      meta: fmtDate(t.initiated_at, true),
      href: `/profile/transfers`,
    });
  });

  summary.vaccines_due
    .filter((v) => v.next_due && daysDiff(v.next_due) <= 7)
    .forEach((v) => {
      const pet = summary.pets.find((p) => p.id === v.pet_id);
      items.push({
        id: `vax-${v.id}`, icon: "/icons/icon-health.png",
        text: `วัคซีน ${v.vaccine_name} — ${pet?.name || "สัตว์"}`,
        meta: fmtDate(v.next_due, true),
        href: `/pets/${v.pet_id}/vaccines`,
      });
    });

  summary.open_appointments
    .filter((a) => a.appt_date && daysDiff(a.appt_date) <= 7)
    .forEach((a) => {
      items.push({
        id: `ap-${a.id}`, icon: "/icons/icon-calendar.png",
        text: a.title,
        meta: fmtDate(a.appt_date, true),
        href: `/farm-dashboard/${farmId}/appointments`,
      });
    });

  return (
    <section className="fd-sec">
      <style>{`
        .fd-notif-row { display:flex; align-items:center; gap:9px; padding:7px 4px; border-bottom:1px solid ${F.line}; text-decoration:none; }
        .fd-notif-row:last-child { border-bottom:none; }
        .fd-notif-icon { width:28px; height:28px; border-radius:8px; background:#F9FAFB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-notif-icon img { width:16px; height:16px; object-fit:contain; }
        .fd-notif-text { flex:1; min-width:0; font-size:12px; color:${F.ink}; }
        .fd-notif-meta { font-size:10px; color:${F.muted}; flex-shrink:0; }
      `}</style>
      <div className="fd-sec-head">
        <div className="fd-sec-title">
          <img src="/icons/icon-calendar.png" alt="" style={{ width: 26, height: 26 }} />
          <h2 className="fd-sec-h">การแจ้งเตือน</h2>
          {items.length > 0 && <span className="fd-sec-badge" style={{ background: F.pinkSoft, color: F.pink }}>{items.length}</span>}
        </div>
      </div>
      {items.length === 0 ? (
        <EmptySection text="ไม่มีการแจ้งเตือนใหม่ตอนนี้" />
      ) : (
        items.map((n) => (
          <Link key={n.id} href={n.href} className="fd-notif-row">
            <div className="fd-notif-icon"><img src={n.icon} alt="" /></div>
            <span className="fd-notif-text">{n.text}</span>
            <span className="fd-notif-meta">{n.meta}</span>
          </Link>
        ))
      )}
    </section>
  );
}
