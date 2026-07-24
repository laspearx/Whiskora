// ── ตรวจจับ in-app browser (WebView ของแอปแชท/โซเชียล) ──────────────────────
// "line" ถูกตัดออกจากลิสต์นี้โดยตั้งใจ: ทดสอบแล้ว (2026-07-24) ว่า LINE Login
// (access.line.me/oauth2/v2.1/authorize) ไม่มีการบล็อกตาม User-Agent เหมือน Google
// (เทียบ response ของ LINE-UA / Facebook-UA / เบราว์เซอร์ปกติ ได้ผลลัพธ์เหมือนกันทุกกรณี)
// และ LINE เองก็ออกแบบ LINE Login ให้ทำงานในเว็บวิวของแอป LINE เองอยู่แล้ว (LIFF)
// ปัญหาจริงมีแค่ตอนกด "เข้าสู่ระบบด้วย Google" ภายในเว็บวิวของแอปอื่น
export const IN_APP_BROWSER_RULES = [
  "fban", "fbav", "fb_iab", "fbios", "messenger",
  "instagram", "tiktok", "musical_ly", "bytedance",
  "twitter", "wechat", "micromessenger", "snapchat",
  "kakaotalk", "naver", "whatsapp", "gsa",
];

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();
  return IN_APP_BROWSER_RULES.some((k) => ua.includes(k));
}

export function detectMobileOS(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}
