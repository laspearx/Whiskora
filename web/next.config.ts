import { loadEnvConfig } from '@next/env';
import { assertDeployEnv } from './lib/deploy-env-guard.mjs';

// โหลด .env* (เช่น .env.local ในเครื่อง) ก่อนตรวจ เพื่อให้ตรวจค่าเดียวกับที่ next build จะใช้
loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development');
assertDeployEnv();

const nextConfig = {
  // ฝังตอน build: โค้ด runtime ใช้ปิด LINE / อีเมล / notify บน Preview (lib/deploy-env.ts)
  env: { WHISKORA_DEPLOY_ENV: process.env.VERCEL_ENV || 'local' },
};

export default nextConfig;
