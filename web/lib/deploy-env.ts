// ค่าจาก next.config.ts (VERCEL_ENV ตอน build): Preview ใช้ Supabase staging และไม่มีค่าทดสอบของ LINE / Resend
// จึงปิดการส่งข้อความและ LINE login ไว้ ไม่ให้ส่งอะไรออกไปจริง
export const isPreviewDeploy = process.env.WHISKORA_DEPLOY_ENV === 'preview'
