import { scorePetCompleteness } from "@/lib/petDataCompleteness";
import type { BusinessInsight, FarmDashboardSummary } from "./types";

function pctTrend(value: number, previous: number): { pct: number; up: boolean } {
  const pct = Math.round(((value - previous) / previous) * 100);
  return { pct, up: pct >= 0 };
}

const DAY_MS = 86400000;

export interface InsightsExtra {
  sires: number;
  dams: number;
  activeBreedingPairs: number;
}

/**
 * Business Insights — every rule reads real aggregate/count data already fetched by
 * get_farm_dashboard_summary; nothing here is an AI guess. Rules with a period-over-period
 * comparison (1, 2, 4) render an honest "not enough data" state instead of a fabricated
 * percentage whenever the prior-period baseline is structurally empty, not just numerically
 * zero — matching the precedent already shipped on the Admin Platform Overview KPI grid.
 */
export function deriveInsights(summary: FarmDashboardSummary, extra: InsightsExtra, farmId: string): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // 1. Reservation velocity (30d vs prior 30d)
  if (summary.reservations_prior_30d > 0) {
    const { pct, up } = pctTrend(summary.reservations_30d, summary.reservations_prior_30d);
    insights.push({
      id: "reservation_velocity",
      text: `คำขอจองเดือนนี้${up ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(pct)}% เทียบช่วงก่อนหน้า (${summary.reservations_30d} รายการ)`,
      trend: pct === 0 ? "flat" : up ? "up" : "down",
      available: true,
      href: `/farm-dashboard/${farmId}/reservations`,
    });
  } else {
    insights.push({
      id: "reservation_velocity", text: "", trend: null, available: false,
      unavailableReason: "ยังไม่มีข้อมูลคำขอจองเพียงพอสำหรับเปรียบเทียบ",
    });
  }

  // 2. Contact-lead trend (30d vs prior 30d)
  if (summary.contact_leads_prior_30d > 0) {
    const { pct, up } = pctTrend(summary.contact_leads_30d, summary.contact_leads_prior_30d);
    insights.push({
      id: "contact_trend",
      text: `เดือนนี้มีคนกดติดต่อ${up ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(pct)}% (${summary.contact_leads_30d} ครั้ง)`,
      trend: pct === 0 ? "flat" : up ? "up" : "down",
      available: true,
    });
  } else {
    insights.push({
      id: "contact_trend", text: "", trend: null, available: false,
      unavailableReason: "ยังไม่มีข้อมูลการติดต่อเพียงพอสำหรับเปรียบเทียบ",
    });
  }

  // 3. Litters born in the last 90 days — plain count, no % (n too small platform-wide for a % claim)
  if (summary.litters_born_90d > 0) {
    insights.push({
      id: "litters_born",
      text: `มี ${summary.litters_born_90d} ครอกคลอดในช่วง 90 วันที่ผ่านมา`,
      trend: null, available: true,
      href: `/farm-dashboard/${farmId}/litters`,
    });
  } else {
    insights.push({
      id: "litters_born", text: "", trend: null, available: false,
      unavailableReason: "ยังไม่มีครอกคลอดในช่วง 90 วันที่ผ่านมา",
    });
  }

  // 4. Profile views trend — needs a full 60-day tracking history so the "prior 30d" bucket is
  // structurally real, not just coincidentally zero because tracking only just started.
  const trackingAgeDays = summary.analytics_since ? Math.floor((Date.now() - new Date(summary.analytics_since).getTime()) / DAY_MS) : 0;
  if (summary.analytics_since && trackingAgeDays >= 60 && summary.profile_views_prior_30d > 0) {
    const { pct, up } = pctTrend(summary.profile_views_30d, summary.profile_views_prior_30d);
    insights.push({
      id: "profile_views_trend",
      text: `เดือนนี้มีคนเปิดดูโปรไฟล์ฟาร์ม${up ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(pct)}% (${summary.profile_views_30d} ครั้ง)`,
      trend: pct === 0 ? "flat" : up ? "up" : "down",
      available: true,
      href: `/farm/${farmId}`,
    });
  } else {
    insights.push({
      id: "profile_views_trend", text: "", trend: null, available: false,
      unavailableReason: summary.analytics_since
        ? `เริ่มเก็บข้อมูลตั้งแต่ ${new Date(summary.analytics_since).toLocaleDateString('th-TH')} — ต้องรออีกสักระยะเพื่อเปรียบเทียบ`
        : "ยังไม่เริ่มเก็บข้อมูลผู้เข้าชมโปรไฟล์",
    });
  }

  // 5. Time-to-fill (list → reserved) — not derivable from current data: no timestamp exists for
  // "when a pet was listed for sale," and pet_reservations/pet_ownership_transfers are both
  // essentially empty platform-wide. Always shown as unavailable rather than guessed.
  insights.push({
    id: "time_to_fill", text: "", trend: null, available: false,
    unavailableReason: "ยังไม่มีข้อมูลการจองที่เพียงพอสำหรับคำนวณระยะเวลาในการหาบ้านให้สัตว์",
  });

  // 6. Breeding pair utilization — always computable from current-state data, no baseline needed
  const breeders = extra.sires + extra.dams;
  if (breeders > 0) {
    insights.push({
      id: "breeding_utilization",
      text: `มีพ่อพันธุ์/แม่พันธุ์ทั้งหมด ${breeders} ตัว กำลังผสมพันธุ์อยู่ ${extra.activeBreedingPairs} คู่`,
      trend: null, available: true,
      href: `/farm-dashboard/${farmId}/pets?status=${encodeURIComponent('พ่อพันธุ์ / แม่พันธุ์')}`,
    });
  } else {
    insights.push({
      id: "breeding_utilization", text: "", trend: null, available: false,
      unavailableReason: "ยังไม่มีพ่อพันธุ์หรือแม่พันธุ์ในฟาร์ม",
    });
  }

  // 7. Data completeness score
  if (summary.pets.length > 0) {
    const ratio = scorePetCompleteness(summary.pets).ratio;
    insights.push({
      id: "data_completeness",
      text: `ข้อมูลสัตว์ในฟาร์มครบถ้วน ${Math.round(ratio * 100)}%`,
      trend: null, available: true,
      href: `/farm-dashboard/${farmId}/data-check`,
    });
  } else {
    insights.push({
      id: "data_completeness", text: "", trend: null, available: false,
      unavailableReason: "ยังไม่มีสัตว์ในฟาร์ม",
    });
  }

  // 8. Team engagement — always available, informational only
  insights.push({
    id: "team_engagement",
    text: summary.member_count > 1
      ? `ทีมของคุณมี ${summary.member_count} คน`
      : "ตอนนี้ทำงานคนเดียว — ชวนทีมเข้ามาช่วยจัดการได้",
    trend: null, available: true,
    href: `/farm-dashboard/${farmId}/members`,
  });

  return insights;
}
