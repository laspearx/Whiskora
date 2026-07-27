"use client";

import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { trackEvent } from "@/lib/analytics/trackEvent";
import type { FarmDashboardSummary } from "@/lib/farmDashboard/types";

interface BusinessOverviewProps {
  farmId: string;
  totalPets: number;
  openReserve: number;
  available: number;
  reserved: number;
  sires: number;
  dams: number;
  summary: FarmDashboardSummary;
}

function Trend({ value, previous }: { value: number; previous: number }) {
  if (previous === 0) {
    if (value === 0) return <span className="fd-bo-trend" style={{ color: F.muted }}>ไม่มีการเปลี่ยนแปลง</span>;
    return <span className="fd-bo-trend" style={{ color: F.green }}>▲ ใหม่ทั้งหมด</span>;
  }
  const pct = Math.round(((value - previous) / previous) * 100);
  if (pct === 0) return <span className="fd-bo-trend" style={{ color: F.muted }}>▬ ไม่เปลี่ยนแปลง</span>;
  const up = pct > 0;
  return (
    <span className="fd-bo-trend" style={{ color: up ? F.green : F.red }}>
      {up ? "▲" : "▼"} {up ? "+" : ""}{pct}% ใน 30 วัน
    </span>
  );
}

interface CardDef {
  key: string;
  label: string;
  value: number;
  previous?: number;
  href: string;
}

export default function BusinessOverview({ farmId, totalPets, openReserve, available, reserved, sires, dams, summary }: BusinessOverviewProps) {
  const cards: CardDef[] = [
    { key: "total_pets", label: "จำนวนสัตว์", value: totalPets, href: `/farm-dashboard/${farmId}/pets` },
    { key: "open_reserve", label: "สัตว์เปิดจอง", value: openReserve, href: `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent("เปิดจอง")}` },
    { key: "available", label: "พร้อมย้ายบ้าน", value: available, href: `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent("พร้อมย้ายบ้าน")}` },
    { key: "reserved", label: "มีผู้จองแล้ว", value: reserved, href: `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent("ติดจอง")}` },
    { key: "sires", label: "พ่อพันธุ์", value: sires, href: `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent("พ่อพันธุ์ / แม่พันธุ์")}&gender=male` },
    { key: "dams", label: "แม่พันธุ์", value: dams, href: `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent("พ่อพันธุ์ / แม่พันธุ์")}&gender=female` },
    { key: "litters_total", label: "ครอกทั้งหมด", value: summary.litters.length, href: `/farm-dashboard/${farmId}/litters` },
    { key: "members", label: "สมาชิกฟาร์ม", value: summary.member_count, href: `/farm-dashboard/${farmId}/members` },
    { key: "reservations_30d", label: "จองใหม่ 30 วัน", value: summary.reservations_30d, previous: summary.reservations_prior_30d, href: `/farm-dashboard/${farmId}/reservations` },
    { key: "transfers_30d", label: "โอนเจ้าของ 30 วัน", value: summary.transfers_30d, previous: summary.transfers_prior_30d, href: `/profile/transfers` },
    { key: "profile_views_30d", label: "ผู้เข้าชมโปรไฟล์ 30 วัน", value: summary.profile_views_30d, previous: summary.profile_views_prior_30d, href: `/farm/${farmId}` },
    { key: "contact_leads_30d", label: "ผู้ติดต่อ 30 วัน", value: summary.contact_leads_30d, previous: summary.contact_leads_prior_30d, href: `/farm-dashboard/${farmId}/pets` },
  ];

  return (
    <section className="fd-sec">
      <style>{`
        .fd-bo-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; }
        @media (min-width:480px) { .fd-bo-grid { grid-template-columns:repeat(3, 1fr); } }
        .fd-bo-card { display:block; text-decoration:none; border:1px solid ${F.line}; border-radius:12px; padding:10px 12px; transition:all .15s; }
        .fd-bo-card:hover { border-color:${F.pinkBorder}; transform:translateY(-1px); }
        .fd-bo-label { font-size:10px; font-weight:500; color:${F.muted}; margin-bottom:3px; }
        .fd-bo-value { font-size:19px; font-weight:700; color:${F.ink}; line-height:1.1; }
        .fd-bo-trend { font-size:9.5px; font-weight:600; display:block; margin-top:3px; }
      `}</style>
      <div className="fd-sec-head">
        <div className="fd-sec-title">
          <img src="/icons/icon-home.png" alt="" style={{ width: 28, height: 28 }} />
          <h2 className="fd-sec-h">ภาพรวมธุรกิจ</h2>
        </div>
      </div>
      <div className="fd-bo-grid">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="fd-bo-card"
            onClick={() => trackEvent({ eventName: "business_card_clicked", entityType: "business_card", entityId: c.key, farmId: Number(farmId) })}
          >
            <div className="fd-bo-label">{c.label}</div>
            <div className="fd-bo-value">{c.value.toLocaleString("th-TH")}</div>
            {c.previous !== undefined && <Trend value={c.value} previous={c.previous} />}
          </Link>
        ))}
      </div>
    </section>
  );
}
