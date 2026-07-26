// ─── Onboarding copy (Thai, hardcoded to match the rest of the app) ───────────
// Centralized here (rather than scattered inline) so lifting into messages/*.json
// later is a find-and-replace, not a rewrite.

export const OWNER_ONBOARDING_TH = {
  welcomeTitle: "ยินดีต้อนรับสู่ Whiskora",
  welcomeBody:
    "เริ่มสร้างพื้นที่สำหรับสัตว์เลี้ยงของคุณ เก็บข้อมูลสุขภาพ ประวัติ และเรื่องสำคัญไว้ในที่เดียว",
  primaryCta: "เริ่มเพิ่มสัตว์เลี้ยง",
  secondaryCta: "สำรวจ Whiskora ก่อน",
  checklistTitle: "เริ่มต้นใช้งาน",
  checklistNote: "ทำทีละนิดได้ ข้อมูลทั้งหมดกลับมาเติมภายหลังได้เสมอ",
  interimSuccess: "โปรไฟล์สัตว์เลี้ยงของคุณพร้อมใช้งานแล้ว",
  completeBadge: "เริ่มต้นใช้งานเรียบร้อย",
  emptyPetsTitle: "ยังไม่มีสัตว์เลี้ยงในบัญชีของคุณ",
  emptyPetsBody: "เริ่มสร้างโปรไฟล์ตัวแรกเพื่อเก็บข้อมูลสำคัญไว้ในที่เดียว",
  intentPrompt: "คุณกำลังใช้ Whiskora แบบไหน?",
  intentOptions: [
    { value: "owner" as const, label: "ฉันเป็นเจ้าของสัตว์เลี้ยง" },
    { value: "buyer" as const, label: "ฉันกำลังมองหาสัตว์เลี้ยง" },
    { value: "family" as const, label: "ฉันดูแลสัตว์ร่วมกับคนในครอบครัว" },
  ],
  buyerGuideTitle: "กำลังมองหาสัตว์เลี้ยงอยู่ใช่ไหม?",
  buyerGuideSteps: [
    { label: "สำรวจ Marketplace", href: "/marketplace" },
    { label: "เลือกดูฟาร์มและสัตว์ที่สนใจ", href: "/farm-hub" },
  ],
  buyerGuideNote:
    "เมื่อเจอสัตว์ที่ถูกใจ กดจองได้จากหน้าโปรไฟล์สัตว์ตัวนั้น ฟาร์มจะติดต่อกลับเพื่อยืนยันการจองอีกครั้ง",
  reopenLabel: "ดูขั้นตอนเริ่มต้น",
};

export const FARM_ONBOARDING_TH = {
  welcomeTitle: "เริ่มต้นจัดการฟาร์มของคุณบน Whiskora",
  welcomeBody:
    "จัดเก็บข้อมูลสัตว์ ครอก สายเลือด และการจองให้เป็นระบบ พร้อมสร้างโปรไฟล์ที่แชร์ให้ลูกค้าได้",
  primaryCta: "เริ่มตั้งค่าฟาร์ม",
  secondaryCta: "ดูภาพรวมก่อน",
  checklistTitle: "เริ่มต้นใช้งานฟาร์ม",
  checklistNote: "ทำทีละนิดได้ ข้อมูลทั้งหมดกลับมาเติมภายหลังได้เสมอ",
  completeSuccess: "ฟาร์มของคุณพร้อมเริ่มใช้งาน Whiskora แล้ว",
  completeBadge: "เริ่มต้นใช้งานเรียบร้อย",
  laterLabel: "ไว้ภายหลัง",
  verifyNudgeTitle: "เพิ่มความน่าเชื่อถือด้วยการยืนยันข้อมูลฟาร์ม",
  verifyNudgeCta: "ยืนยันข้อมูลฟาร์ม",
  phase1Title: "ตั้งค่าพื้นฐาน",
  phase2Title: "เพิ่มข้อมูลสัตว์และการเพาะพันธุ์",
  phase3Title: "เตรียมโปรไฟล์สำหรับลูกค้า",
  reopenLabel: "ดูขั้นตอนเริ่มต้น",
};
