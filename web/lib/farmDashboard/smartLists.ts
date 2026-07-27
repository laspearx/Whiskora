import { PET_STATUS, type PetStatus } from "@/lib/constants";
import { PET_COMPLETENESS_CHECKS } from "@/lib/petDataCompleteness";
import type { AttentionItem, DashboardLatestWeight, DashboardPet } from "./types";

const KNOWN_STATUSES: Set<string> = new Set(Object.values(PET_STATUS) as PetStatus[]);
const SALE_READY: Set<string> = new Set([PET_STATUS.OPEN_RESERVE, PET_STATUS.AVAILABLE]);
const WEIGHT_TRACKED_STATUSES: Set<string> = new Set([
  PET_STATUS.KID, PET_STATUS.BREEDER, PET_STATUS.OPEN_RESERVE, PET_STATUS.AVAILABLE,
]);
const WEIGHT_STALE_DAYS = 30;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/**
 * "Animals Requiring Attention" smart list — every rule here is a pure predicate over data that's
 * already fetched (no browser-side full-table scans, no guessed insights). Deworming/parasite
 * tracking is deliberately not included: there is no table for it anywhere in the schema, so a
 * rule for it would have to be fabricated rather than derived.
 */
export function buildAttentionList(pets: DashboardPet[], latestWeights: DashboardLatestWeight[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const weightByPet = Object.fromEntries(latestWeights.map((w) => [w.pet_id, w]));

  for (const p of pets) {
    const href = `/pets/${p.id}`;
    const petName = p.name || "สัตว์ไม่ระบุชื่อ";
    const petImage = p.image_url;
    const push = (suffix: string, reason: string) =>
      items.push({ id: `${p.id}-${suffix}`, petId: p.id, petName, petImage, reason, href });

    if (PET_COMPLETENESS_CHECKS.noPhoto(p)) push("photo", "ยังไม่มีรูปภาพ");
    if (PET_COMPLETENESS_CHECKS.noBirth(p)) push("birth", "ไม่มีวันเกิด");
    if (PET_COMPLETENESS_CHECKS.noStatus(p)) push("status", "ยังไม่ระบุสถานะ");
    else if (p.status && !KNOWN_STATUSES.has(p.status)) push("status-invalid", "สถานะไม่ถูกต้อง — ต้องอัปเดต");

    if (!p.gender) push("gender", "ยังไม่ระบุเพศ");
    if (!p.sire_id && !p.dam_id) push("pedigree", "ยังไม่มีข้อมูลสายเลือด");
    if (!p.health_notes) push("health", "ยังไม่มีข้อมูลสุขภาพ");
    if (p.status === PET_STATUS.AVAILABLE && !p.is_public) push("not-public", "พร้อมย้ายบ้านแต่ยังไม่เปิด Public Profile");

    if (WEIGHT_TRACKED_STATUSES.has(p.status || "")) {
      const w = weightByPet[p.id];
      if (!w) {
        push("no-weight", "ยังไม่มีประวัติน้ำหนัก");
      } else {
        const stale = daysSince(w.recorded_date);
        if (stale > WEIGHT_STALE_DAYS) push("stale-weight", `น้ำหนักไม่ได้อัปเดตมา ${stale} วัน`);
      }
    }

    if (SALE_READY.has(p.status || "") && !p.price) push("no-price", "เปิดขาย/พร้อมย้ายบ้านแต่ยังไม่ตั้งราคา");
  }

  return items;
}
