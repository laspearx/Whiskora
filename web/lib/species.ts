// ════════════════════════════════════════════════════════════════
// Whiskora — Species มาตรฐานกลางของทั้งระบบ
// เก็บใน DB เป็น "id ภาษาอังกฤษ" เสมอ (cat, dog, rabbit, ...)
// แล้วแปลงเป็นภาษาไทย / emoji ตอนแสดงผลด้วย helper ในไฟล์นี้
// ════════════════════════════════════════════════════════════════

export interface SpeciesDef {
  id: string;        // ค่าที่เก็บใน DB (ภาษาอังกฤษ)
  th: string;        // ชื่อไทยสำหรับแสดงผล
  en: string;        // ชื่ออังกฤษ
  emoji: string;
  icon: string;      // path ไอคอน PNG ใน /public/icons/
}

// ── รายการสัตว์ทั้งหมด (เรียงให้ แมว/หมา ขึ้นก่อน) ──
export const SPECIES_LIST: SpeciesDef[] = [
  { id: 'cat',      th: 'แมว',          en: 'Cat',       emoji: '🐱', icon: '/icons/icon-species-cat.png' },
  { id: 'dog',      th: 'หมา',          en: 'Dog',       emoji: '🐶', icon: '/icons/icon-species-dog.png' },
  { id: 'rabbit',   th: 'กระต่าย',       en: 'Rabbit',    emoji: '🐰', icon: '/icons/icon-species-rabbit.png' },
  { id: 'hamster',  th: 'หนูแฮมสเตอร์',  en: 'Hamster',   emoji: '🐹', icon: '/icons/icon-species-hamster.png' },
  { id: 'bird',     th: 'นก',           en: 'Bird',      emoji: '🦜', icon: '/icons/icon-species-bird.png' },
  { id: 'squirrel', th: 'กระรอก',        en: 'Squirrel',  emoji: '🐿️', icon: '/icons/icon-species-squirrel.png' },
  { id: 'hedgehog', th: 'เม่นแคระ',      en: 'Hedgehog',  emoji: '🦔', icon: '/icons/icon-species-hedgehog.png' },
  { id: 'fish',     th: 'ปลา',          en: 'Fish',      emoji: '🐟', icon: '/icons/icon-species-fish.png' },
  { id: 'turtle',   th: 'เต่า',          en: 'Turtle',    emoji: '🐢', icon: '/icons/icon-species-turtle.png' },
  { id: 'frog',     th: 'กบ',           en: 'Frog',      emoji: '🐸', icon: '/icons/icon-species-frog.png' },
  { id: 'lizard',   th: 'กิ้งก่า',        en: 'Lizard',    emoji: '🦎', icon: '/icons/icon-species-lizard.png' },
  { id: 'snake',    th: 'งู',           en: 'Snake',     emoji: '🐍', icon: '/icons/icon-species-snake.png' },
  { id: 'raccoon',  th: 'แร็กคูน',       en: 'Raccoon',   emoji: '🦝', icon: '/icons/icon-species-raccoon.png' },
  { id: 'other',    th: 'สัตว์อื่นๆ',     en: 'Other',     emoji: '🐾', icon: '/icons/icon-species-other.png' },
];

// ── lookup map (id → def) ──
const SPECIES_MAP: Record<string, SpeciesDef> = Object.fromEntries(
  SPECIES_LIST.map((s) => [s.id, s])
);

// ── รองรับข้อมูลเก่าที่เคยเก็บเป็นภาษาไทย → แปลงกลับเป็น id ──
const TH_TO_ID: Record<string, string> = Object.fromEntries(
  SPECIES_LIST.map((s) => [s.th, s.id])
);

/** แปลง species id (หรือค่าไทยเดิม) → ชื่อไทยสำหรับแสดงผล */
export function speciesTh(value?: string | null): string {
  if (!value) return '';
  if (SPECIES_MAP[value]) return SPECIES_MAP[value].th;   // เป็น id อยู่แล้ว
  if (TH_TO_ID[value]) return value;                       // เป็นไทยอยู่แล้ว
  return value;                                            // ค่าที่ผู้ใช้พิมพ์เอง (custom)
}

/** แปลง species id → emoji */
export function speciesEmoji(value?: string | null): string {
  if (!value) return '🐾';
  if (SPECIES_MAP[value]) return SPECIES_MAP[value].emoji;
  const id = TH_TO_ID[value];
  if (id && SPECIES_MAP[id]) return SPECIES_MAP[id].emoji;
  return '🐾';
}

/** แปลง species id → icon path (PNG) */
export function speciesIcon(value?: string | null): string {
  if (!value) return '/icons/icon-species-other.png';
  if (SPECIES_MAP[value]) return SPECIES_MAP[value].icon;
  const id = TH_TO_ID[value];
  if (id && SPECIES_MAP[id]) return SPECIES_MAP[id].icon;
  return '/icons/icon-species-other.png';
}

/** normalize ค่าใดๆ (ไทยเก่า/id) ให้เป็น id มาตรฐาน — ใช้ตอนอ่านข้อมูลเก่า */
export function speciesToId(value?: string | null): string {
  if (!value) return '';
  if (SPECIES_MAP[value]) return value;        // id อยู่แล้ว
  if (TH_TO_ID[value]) return TH_TO_ID[value]; // ไทย → id
  return value;                                 // custom (เก็บตามที่พิมพ์)
}

/** เช็คว่าเป็นชนิดมาตรฐานไหม (ไม่ใช่ค่าที่พิมพ์เอง) */
export function isKnownSpecies(value?: string | null): boolean {
  if (!value) return false;
  return !!SPECIES_MAP[value] || !!TH_TO_ID[value];
}

// ── ชนิด "อื่นๆ" (ไม่รวมแมว/หมา) สำหรับ sub-grid ตอนเลือก ──
export const OTHER_SPECIES: SpeciesDef[] = SPECIES_LIST.filter(
  (s) => s.id !== 'cat' && s.id !== 'dog'
);