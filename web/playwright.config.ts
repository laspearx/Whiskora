import { defineConfig, devices } from '@playwright/test';

// E2E smoke tests for the main flows.
// E2E_BASE_URL: point at a staging deploy; defaults to a local `next start` on :3123.
// The local server uses whatever Supabase project .env.production points to — public
// (anonymous) specs only read public pages; signed-in specs need staging test accounts.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3123';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list']],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npx next start -p 3123',
    url: 'http://localhost:3123/th',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
