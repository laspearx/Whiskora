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
}

// ── รายการสัตว์ทั้งหมด (เรียงให้ แมว/หมา ขึ้นก่อน) ──
export const SPECIES_LIST: SpeciesDef[] = [
  { id: 'cat',      th: 'แมว',          en: 'Cat',       emoji: '🐱' },
  { id: 'dog',      th: 'หมา',          en: 'Dog',       emoji: '🐶' },
  { id: 'rabbit',   th: 'กระต่าย',       en: 'Rabbit',    emoji: '🐰' },
  { id: 'hamster',  th: 'หนูแฮมสเตอร์',  en: 'Hamster',   emoji: '🐹' },
  { id: 'bird',     th: 'นก',           en: 'Bird',      emoji: '🦜' },
  { id: 'squirrel', th: 'กระรอก',        en: 'Squirrel',  emoji: '🐿️' },
  { id: 'hedgehog', th: 'เม่นแคระ',      en: 'Hedgehog',  emoji: '🦔' },
  { id: 'fish',     th: 'ปลา',          en: 'Fish',      emoji: '🐟' },
  { id: 'turtle',   th: 'เต่า',          en: 'Turtle',    emoji: '🐢' },
  { id: 'frog',     th: 'กบ',           en: 'Frog',      emoji: '🐸' },
  { id: 'lizard',   th: 'กิ้งก่า',        en: 'Lizard',    emoji: '🦎' },
  { id: 'snake',    th: 'งู',           en: 'Snake',     emoji: '🐍' },
  { id: 'raccoon',  th: 'แร็กคูน',       en: 'Raccoon',   emoji: '🦝' },
  { id: 'other',    th: 'สัตว์อื่นๆ',     en: 'Other',     emoji: '🐾' },
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