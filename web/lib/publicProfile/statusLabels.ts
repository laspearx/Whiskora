// ─── Central status/CTA vocabulary for public pet & farm profiles ────────────
// Single source of truth so /p/[id] and /farm/[id] don't each re-derive their
// own Thai-string comparisons and CTA rules. Keyed off the real PET_STATUS
// enum values (web/lib/constants.ts), not new raw strings.

import { PET_STATUS } from '@/lib/constants';

export type Locale = 'th' | 'en';

export interface StatusLabel {
  th: string;
  en: string;
  tone: 'success' | 'warning' | 'neutral' | 'muted';
}

const STATUS_LABELS: Record<string, StatusLabel> = {
  [PET_STATUS.OPEN_RESERVE]: { th: 'เปิดรับจอง', en: 'Open for reservation', tone: 'success' },
  [PET_STATUS.AVAILABLE]: { th: 'พร้อมย้ายบ้าน', en: 'Ready to go home', tone: 'success' },
  [PET_STATUS.RESERVED]: { th: 'มีผู้จองแล้ว', en: 'Reserved', tone: 'warning' },
  [PET_STATUS.BREEDER]: { th: 'พ่อพันธุ์ / แม่พันธุ์', en: 'Breeding parent', tone: 'neutral' },
  [PET_STATUS.KEEP]: { th: 'อยู่ระหว่างดูแล', en: "In the farm's care", tone: 'neutral' },
  [PET_STATUS.RETIRED]: { th: 'ปลดระวาง', en: 'Retired', tone: 'muted' },
  [PET_STATUS.NOT_OPEN]: { th: 'ยังไม่เปิดจอง', en: 'Not open yet', tone: 'muted' },
  [PET_STATUS.KID]: { th: 'ลูกสัตว์', en: 'Young', tone: 'neutral' },
};

const PERSONAL_PET_LABEL: StatusLabel = { th: 'มีเจ้าของแล้ว', en: 'Has an owner', tone: 'muted' };
const DEFAULT_LABEL: StatusLabel = { th: 'ไม่ระบุสถานะ', en: 'Status not specified', tone: 'muted' };

/** isFarmPet: farm_id set and not 'PERSONAL' — a personal pet is never "for sale" regardless of its status value. */
export function getStatusLabel(status: string | null | undefined, isFarmPet: boolean): StatusLabel {
  if (!isFarmPet) return PERSONAL_PET_LABEL;
  if (!status) return DEFAULT_LABEL;
  return STATUS_LABELS[status] ?? DEFAULT_LABEL;
}

export function isForSale(status: string | null | undefined, isFarmPet: boolean): boolean {
  return isFarmPet && (status === PET_STATUS.OPEN_RESERVE || status === PET_STATUS.AVAILABLE);
}

export type PetCtaKind =
  | 'reserve'
  | 'login_to_reserve'
  | 'reserved_pending'
  | 'reserved_confirmed'
  | 'contact'
  | 'view_farm'
  | 'share'
  | 'none';

export interface PetCtaPlan {
  primary: PetCtaKind;
  secondary: PetCtaKind;
}

/** One rule set for both pages, matching the brief's per-status CTA table exactly. */
export function getPetCtaPlan(opts: {
  status: string | null | undefined;
  isFarmPet: boolean;
  isLoggedIn: boolean;
  isOwnPet: boolean;
  hasContact: boolean;
  myReservationStatus: 'pending' | 'confirmed' | null;
}): PetCtaPlan {
  const { status, isFarmPet, isLoggedIn, isOwnPet, hasContact, myReservationStatus } = opts;

  if (isOwnPet) return { primary: 'share', secondary: 'none' };

  if (isForSale(status, isFarmPet)) {
    if (myReservationStatus === 'confirmed') return { primary: 'reserved_confirmed', secondary: hasContact ? 'contact' : 'none' };
    if (myReservationStatus === 'pending') return { primary: 'reserved_pending', secondary: hasContact ? 'contact' : 'none' };
    if (!isLoggedIn) return { primary: 'login_to_reserve', secondary: hasContact ? 'contact' : 'none' };
    return { primary: 'reserve', secondary: hasContact ? 'contact' : 'none' };
  }

  // Reserved-by-someone-else, breeder, kept, retired, or a personal (non-farm) pet — none of these are "buy now" states.
  return { primary: hasContact ? 'contact' : 'share', secondary: isFarmPet ? 'view_farm' : 'none' };
}

const CTA_LABELS: Record<PetCtaKind, StatusLabel> = {
  reserve: { th: 'ส่งคำขอจอง', en: 'Request to reserve', tone: 'success' },
  login_to_reserve: { th: 'เข้าสู่ระบบเพื่อจองตัวนี้', en: 'Log in to reserve', tone: 'neutral' },
  reserved_pending: { th: 'รอฟาร์มยืนยันการจอง', en: 'Waiting for farm confirmation', tone: 'warning' },
  reserved_confirmed: { th: 'ยืนยันการจองแล้ว', en: 'Reservation confirmed', tone: 'success' },
  contact: { th: 'ติดต่อฟาร์ม', en: 'Contact the farm', tone: 'neutral' },
  view_farm: { th: 'ดูโปรไฟล์ฟาร์ม', en: 'View farm profile', tone: 'neutral' },
  share: { th: 'แชร์โปรไฟล์', en: 'Share profile', tone: 'neutral' },
  none: { th: '', en: '', tone: 'muted' },
};

export function ctaLabel(kind: PetCtaKind, locale: Locale): string {
  return CTA_LABELS[kind][locale];
}

export function statusText(label: StatusLabel, locale: Locale): string {
  return label[locale];
}

/** Neutral, non-accusatory copy for tier-gated sections the viewer can't currently see. */
export const LOCKED_SECTION_COPY: Record<'anonymous' | 'insufficient_tier', StatusLabel> = {
  anonymous: {
    th: 'เข้าสู่ระบบเพื่อตรวจสอบสิทธิ์การเข้าถึงข้อมูลส่วนนี้',
    en: 'Log in to check your access to this section',
    tone: 'neutral',
  },
  insufficient_tier: {
    th: 'ข้อมูลส่วนนี้เปิดให้ผู้ที่มีสิทธิ์ตามการตั้งค่าของฟาร์ม',
    en: "This section is visible to viewers the farm has granted access to",
    tone: 'neutral',
  },
};
