// ค่าจาก next.config.ts (VERCEL_ENV ตอน build): Preview ใช้ Supabase staging และไม่มีค่าทดสอบของ LINE / Resend
// จึงปิดการส่งข้อความและ LINE login ไว้ ไม่ให้ส่งอะไรออกไปจริง
export const isPreviewDeploy = process.env.WHISKORA_DEPLOY_ENV === 'preview'
// F4 Phase D: the single guard-approved staging Preview (lib/line-uat.mjs) may run real LINE Login.
// Notifications (LINE push / email / web push) stay off on EVERY Preview, this one included.
export const isLineUatPreview = isPreviewDeploy && process.env.WHISKORA_LINE_UAT === '1'
export const lineRoutesDisabled = isPreviewDeploy && !isLineUatPreview
