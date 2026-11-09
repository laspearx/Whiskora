// TH / EN texts for LINE sign-in and linking (kept out of messages/*.json so the F4 hotfix does not conflict with the
// UI release). Unknown codes fall back to a generic message — upstream error text is never shown.
import { toUserErrorCode, type UserErrorCode } from '@/lib/lineAuth'

type Texts = Record<UserErrorCode, string> & {
  reviewTitle: string; reviewBody: string; reviewRef: string;
  relinkTitle: string; relinkBody: string; relinkCreate: string;
  confirmTitle: string; confirmBody: string; confirmYes: string; confirmNo: string;
  legacyBanner: string; linked: string; unlinkLineOnly: string; unlinkFailed: string; startFailed: string;
}

const th: Texts = {
  LINE_PROFILE_INVALID: 'ไม่สามารถอ่านข้อมูลบัญชี LINE ได้ กรุณาลองใหม่',
  LINE_ACCOUNT_CONFLICT: 'บัญชี LINE นี้ผูกกับบัญชี Whiskora มากกว่าหนึ่งบัญชี กรุณาติดต่อทีมงานเพื่อตรวจสอบ',
  LINE_ACCOUNT_REVIEW: 'บัญชี LINE นี้ผูกกับบัญชี Whiskora เดิมที่ต้องยืนยันตัวตนเพิ่มเติม',
  LINE_RELINK_SUGGESTED: 'บัญชี LINE นี้อาจเคยเชื่อมกับบัญชี Whiskora อื่น',
  LINE_LINKED_TO_OTHER: 'บัญชี LINE นี้เชื่อมต่อกับผู้ใช้ Whiskora อื่นอยู่แล้ว',
  LINE_LEGACY_ACCOUNT_EXISTS: 'บัญชี LINE นี้มีบัญชี Whiskora เดิมอยู่แล้ว กรุณาติดต่อทีมงานเพื่อรวมบัญชีอย่างปลอดภัย',
  LINE_LINK_UNAUTHORIZED: 'กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ LINE แล้วลองใหม่',
  LINK_PENDING_MISSING: 'ไม่พบคำขอเชื่อมต่อ LINE ที่รอยืนยัน กรุณาเริ่มใหม่',
  LINK_PENDING_EXPIRED: 'คำขอเชื่อมต่อ LINE หมดอายุแล้ว กรุณาเริ่มใหม่',
  LINK_PENDING_MISMATCH: 'คำขอเชื่อมต่อ LINE ไม่ตรงกับเบราว์เซอร์นี้ กรุณาเริ่มใหม่',
  LINE_TOKEN_FAILED: 'เชื่อมต่อกับ LINE ไม่สำเร็จ กรุณาลองใหม่',
  LINE_SESSION_FAILED: 'สร้างการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
  LINE_DISABLED_ON_PREVIEW: 'LINE ปิดใช้งานในเวอร์ชันทดสอบ',
  LINE_CONFIG_MISSING: 'ระบบ LINE ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง',
  state_mismatch: 'คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่',
  missing_code: 'การเข้าสู่ระบบไม่สมบูรณ์ กรุณาลองใหม่',
  access_denied: 'ยกเลิกการเข้าสู่ระบบด้วย LINE แล้ว',
  auth_failed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
  reviewTitle: 'ต้องยืนยันบัญชีเดิมก่อน',
  reviewBody: 'เพื่อความปลอดภัยของบัญชีเดิม ระบบจะไม่เข้าสู่ระบบให้อัตโนมัติ ข้อมูลเดิมของคุณยังอยู่ครบ ถ้าคุณยังเข้าสู่ระบบอยู่บนอุปกรณ์อื่น ให้เปิด โปรไฟล์ → การเชื่อมต่อ → เชื่อม LINE แล้วกดยืนยัน หรือติดต่อทีมงาน Whiskora พร้อมรหัสอ้างอิงนี้',
  reviewRef: 'รหัสอ้างอิง',
  relinkTitle: 'บัญชี LINE นี้อาจเคยเชื่อมกับบัญชี Whiskora เดิม',
  relinkBody: 'ถ้ามีบัญชีเดิม: เข้าสู่ระบบด้วยอีเมลหรือ Google แล้วไปที่ โปรไฟล์ → การเชื่อมต่อ → เชื่อม LINE (ข้อมูลเดิมอยู่ครบ) ถ้าไม่เคยมีบัญชี สร้างบัญชีใหม่ได้',
  relinkCreate: 'สร้างบัญชีใหม่ด้วย LINE',
  confirmTitle: 'ยืนยันการเชื่อมต่อ LINE',
  confirmBody: 'เชื่อมบัญชี LINE นี้กับบัญชี Whiskora ที่กำลังใช้งานอยู่หรือไม่',
  confirmYes: 'ยืนยันการเชื่อมต่อ',
  confirmNo: 'ยกเลิก',
  legacyBanner: 'เพื่อความปลอดภัย กรุณากด "เชื่อมต่อ" LINE อีกครั้งเพื่อยืนยันว่า LINE นี้เป็นของคุณ',
  linked: 'เชื่อมต่อ LINE สำเร็จแล้ว',
  unlinkLineOnly: 'ไม่สามารถยกเลิกได้ เนื่องจากเป็นช่องทางเข้าสู่ระบบเพียงช่องทางเดียว',
  unlinkFailed: 'ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ',
  startFailed: 'ไม่สามารถเริ่มการเชื่อมต่อได้ กรุณาลองใหม่',
}

const en: Texts = {
  LINE_PROFILE_INVALID: 'Could not read your LINE profile. Please try again.',
  LINE_ACCOUNT_CONFLICT: 'This LINE account is attached to more than one Whiskora account. Please contact us.',
  LINE_ACCOUNT_REVIEW: 'This LINE account belongs to an existing Whiskora account that needs extra verification.',
  LINE_RELINK_SUGGESTED: 'This LINE account may have been connected to another Whiskora account.',
  LINE_LINKED_TO_OTHER: 'This LINE account is already connected to another Whiskora user.',
  LINE_LEGACY_ACCOUNT_EXISTS: 'This LINE account already has a Whiskora account. Please contact us to merge safely.',
  LINE_LINK_UNAUTHORIZED: 'Please sign in before connecting LINE, then try again.',
  LINK_PENDING_MISSING: 'No LINE connection is waiting for confirmation. Please start again.',
  LINK_PENDING_EXPIRED: 'The LINE connection request expired. Please start again.',
  LINK_PENDING_MISMATCH: 'The LINE connection request does not match this browser. Please start again.',
  LINE_TOKEN_FAILED: 'Could not reach LINE. Please try again.',
  LINE_SESSION_FAILED: 'Could not sign you in. Please try again.',
  LINE_DISABLED_ON_PREVIEW: 'LINE is disabled on preview deployments.',
  LINE_CONFIG_MISSING: 'LINE sign-in is not available right now. Please try later.',
  state_mismatch: 'The sign-in request expired or is invalid. Please try again.',
  missing_code: 'Sign-in was not completed. Please try again.',
  access_denied: 'LINE sign-in was cancelled.',
  auth_failed: 'Sign-in failed. Please try again.',
  reviewTitle: 'Your existing account needs verification',
  reviewBody: 'To protect your existing account we will not sign you in automatically. Your data is safe. If you are still signed in on another device, open Profile → Connections → Connect LINE and confirm, or contact the Whiskora team with this reference.',
  reviewRef: 'Reference',
  relinkTitle: 'This LINE account may already belong to a Whiskora account',
  relinkBody: 'If you have an account: sign in with email or Google, then go to Profile → Connections → Connect LINE (your data stays). If you never had one, you can create a new account.',
  relinkCreate: 'Create a new account with LINE',
  confirmTitle: 'Confirm LINE connection',
  confirmBody: 'Connect this LINE account to the Whiskora account you are signed in to?',
  confirmYes: 'Confirm',
  confirmNo: 'Cancel',
  legacyBanner: 'For your security, please press "Connect" for LINE again to confirm this LINE account is yours.',
  linked: 'LINE connected.',
  unlinkLineOnly: 'You cannot disconnect your only sign-in method.',
  unlinkFailed: 'Could not disconnect LINE.',
  startFailed: 'Could not start connecting. Please try again.',
}

export function lineTexts(locale: string): Texts { return locale === 'en' ? en : th }
export function lineErrorText(locale: string, code: string | null | undefined): string { return lineTexts(locale)[toUserErrorCode(code)] }
