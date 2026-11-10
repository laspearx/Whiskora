import { defineConfig, devices } from '@playwright/test';
import base from './playwright.security.config';

// F4 UI suite: same local production server and mock Supabase origin as the security patch suite.
export default defineConfig({
  ...base,
  testMatch: 'f4-line-identity.spec.ts',
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
