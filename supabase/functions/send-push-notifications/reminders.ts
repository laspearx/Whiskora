// Pure helpers for send-push-notifications (no Deno / network APIs, so they can be unit-tested with node).

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Bangkok = UTC+7, no DST

// วันที่ตามเวลาไทย (YYYY-MM-DD) ไม่พึ่ง timezone ของเครื่องที่รัน
export function bangkokDate(nowMs: number, offsetDays = 0): string {
  return new Date(nowMs + BANGKOK_OFFSET_MS + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// เทียบ secret แบบใช้เวลาคงที่ (ไม่รั่วความยาวส่วนที่ตรงกันผ่านเวลา)
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export type ReminderItem = { vaccineId: number; petId: number; petName: string; vaccineName: string; dueDate: string };

export function buildPayload(items: ReminderItem[], today: string): string {
  const dueToday = items.some((e) => e.dueDate === today);
  const title = dueToday ? "วันนี้มีกำหนดฉีดวัคซีน" : "พรุ่งนี้มีกำหนดฉีดวัคซีน";
  const petList = items
    .map((e) => `${e.petName} (${e.vaccineName}${e.dueDate === today ? " วันนี้" : " พรุ่งนี้"})`)
    .join(", ");
  const body = petList.length > 80 ? petList.slice(0, 77) + "..." : petList;
  // ตัวเดียว → เปิดหน้าวัคซีนของตัวนั้น, หลายตัว → หน้ารวมวัคซีน
  const petIds = [...new Set(items.map((e) => e.petId))];
  const url = petIds.length === 1 ? `/pets/${petIds[0]}/vaccines` : "/pets/vaccines/all";
  // tag ตามวันที่: ถ้ามีการแจ้งเตือนเพิ่มในวันเดียวกัน อุปกรณ์จะแทนที่อันเดิม ไม่ซ้อนหลายอัน
  return JSON.stringify({ title, body, icon: "/mini-logo.png", tag: `vaccine-reminder-${today}`, url });
}

// ผลจาก push service → ประเภท (ไม่เก็บ endpoint หรือข้อความตอบกลับ)
export function classifyPushError(err: unknown): { kind: "expired" | "failed"; status: number | "network" } {
  const status = (err as { statusCode?: number })?.statusCode;
  if (status === 404 || status === 410) return { kind: "expired", status };
  return { kind: "failed", status: typeof status === "number" ? status : "network" };
}
