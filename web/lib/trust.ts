// ─── Whiskora trust & public-listing rules ────────────────────────────────────
// One place for "what counts as a public listing" and "what does each badge
// certify", so cards, counts, and profile pages can never disagree again.

import { PET_STATUS } from './constants';

// สถานะที่นับเป็น "พร้อมขาย / เปิดให้ติดต่อ" บนหน้าสาธารณะ — ใช้ทั้งการนับและการแสดงรายการ
export const PUBLIC_LISTING_STATUSES: string[] = [PET_STATUS.AVAILABLE, PET_STATUS.OPEN_RESERVE];

export function isPublicListing(pet: { status?: string | null; is_public?: boolean | null }): boolean {
  return pet.is_public !== false && !!pet.status && PUBLIC_LISTING_STATUSES.includes(pet.status);
}

// ─── ตราแต่ละแบบรับรองอะไร ──────────────────────────────────────────────
// registered       = มี Pet ID ในระบบ (ไม่ได้รับรองอะไรเพิ่ม)
// farm_verified    = แอดมินอนุมัติเอกสารยืนยันตัวตนฟาร์มแล้ว (farms.is_verified)
// docs_reviewed    = ยังไม่มีขั้นตอนตรวจเอกสารสัตว์ในระบบ — ห้ามแสดงตรานี้จนกว่าจะมี
export const TRUST_COPY = {
  registered: {
    label: 'ลงทะเบียน Pet ID แล้ว',
    hint: 'มีโปรไฟล์ในระบบ Whiskora — ไม่ได้หมายถึงการตรวจสอบสุขภาพหรือเอกสาร',
  },
  farmVerified: {
    label: 'ฟาร์มยืนยันตัวตนแล้ว',
    hint: 'ทีม Whiskora ตรวจเอกสารยืนยันตัวตนของเจ้าของฟาร์มแล้ว — ไม่ได้รับรองสุขภาพหรือสายเลือดของสัตว์แต่ละตัว',
  },
  farmUnverified: {
    label: 'ฟาร์มยังไม่ยืนยันตัวตน',
    hint: 'ฟาร์มนี้ยังไม่ได้ส่งหรือยังไม่ผ่านการยืนยันตัวตนกับ Whiskora',
  },
} as const;

// ─── ค่าสุขภาพ: null = ยังไม่ได้ระบุ ห้ามแปลงเป็น "ไม่มี" ──────────────────
export const NOT_SPECIFIED = 'ยังไม่ได้ระบุ';

export function healthText(val: string | null | undefined): string {
  return val != null && val.trim() !== '' ? val : NOT_SPECIFIED;
}

export function neuteredText(val: boolean | null | undefined): string {
  if (val === true) return 'ทำหมันแล้ว';
  if (val === false) return 'ยังไม่ทำหมัน';
  return NOT_SPECIFIED;
}
