import { loadEnvConfig } from '@next/env';
import { assertDeployEnv, previewLineUat } from './lib/deploy-env-guard.mjs';

// โหลด .env* (เช่น .env.local ในเครื่อง) ก่อนตรวจ เพื่อให้ตรวจค่าเดียวกับที่ next build จะใช้
loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development');
assertDeployEnv();

const nextConfig = {
  // ฝังตอน build: โค้ด runtime ใช้ปิด LINE / อีเมล / notify บน Preview (lib/deploy-env.ts)
  // WHISKORA_LINE_UAT: '1' only on the single allow-listed staging Preview (guard-checked: branch, flag, staging URL,
  // UAT site URL, pinned key / channel hashes) — turns the LINE routes on there; notifications stay off on every Preview
  env: { WHISKORA_DEPLOY_ENV: process.env.VERCEL_ENV || 'local', WHISKORA_LINE_UAT: previewLineUat() ? '1' : '0' },
};

export default nextConfig;
