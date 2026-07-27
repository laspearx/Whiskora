"use client";

import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { trackEvent } from "@/lib/analytics/trackEvent";

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

interface QuickActionsBarProps {
  farmId: string;
  pendingReservations: number;
}

/** A single normal summary card — was an 8-item horizontal icon-pill strip, trimmed down to just
 * "ดูคำขอจอง" (the one action that actually needs daily attention) and restyled to match every
 * other section's plain .fd-sec card instead of the scroll-strip pattern. */
export default function QuickActionsBar({ farmId, pendingReservations }: QuickActionsBarProps) {
  return (
    <Link
      href={`/farm-dashboard/${farmId}/reservations`}
      className="fd-sec fd-qa-card"
      onClick={() => trackEvent({ eventName: "quick_action_clicked", entityType: "quick_action", entityId: "view_reservations", farmId: Number(farmId) })}
    >
      <style>{`
        .fd-qa-card { display:flex; align-items:center; justify-content:space-between; gap:12px; text-decoration:none; transition:all .15s; }
        .fd-qa-card:hover { border-color:${F.pinkBorder}; }
        .fd-qa-left { display:flex; align-items:center; gap:10px; }
        .fd-qa-icon-wrap { width:38px; height:38px; border-radius:10px; background:${F.pinkSoft}; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .fd-qa-icon-wrap img { width:22px; height:22px; object-fit:contain; }
        .fd-qa-title { font-size:14px; font-weight:600; color:${F.ink}; }
        .fd-qa-sub { font-size:11px; color:${F.muted}; margin-top:2px; }
        .fd-qa-chevron { color:${F.muted}; flex-shrink:0; }
      `}</style>
      <div className="fd-qa-left">
        <div className="fd-qa-icon-wrap"><img src="/icons/icon-calendar.png" alt="" /></div>
        <div>
          <div className="fd-qa-title">ดูคำขอจอง</div>
          <div className="fd-qa-sub">
            {pendingReservations > 0 ? `มีคำขอรอดำเนินการ ${pendingReservations} รายการ` : "ยังไม่มีคำขอรอดำเนินการ"}
          </div>
        </div>
      </div>
      <span className="fd-qa-chevron"><ChevronRight /></span>
    </Link>
  );
}
