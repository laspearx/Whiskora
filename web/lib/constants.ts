// ─── Whiskora shared constants ────────────────────────────────────────────────

export const PET_GENDER = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type PetGender = typeof PET_GENDER[keyof typeof PET_GENDER];

export const PET_STATUS = {
  UNSPECIFIED: '',
  KID: 'เด็ก',
  BREEDER: 'พ่อพันธุ์ / แม่พันธุ์',
  AVAILABLE: 'พร้อมย้ายบ้าน',
  OPEN_RESERVE: 'เปิดจอง',
  RESERVED: 'ติดจอง',
  RETIRED: 'ทำหมัน / ปลดระวาง',
} as const;

export type PetStatus = typeof PET_STATUS[keyof typeof PET_STATUS];
