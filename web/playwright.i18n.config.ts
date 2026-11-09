import { defineConfig, devices } from '@playwright/test';

// Language switching / i18n regression (local only). `next dev` with a DUMMY, unreachable Supabase URL; specs block
// every non-local request. usage (web/): npx playwright test -c playwright.i18n.config.ts
const PORT = 3132;
export default defineConfig({
  testDir: './e2e/i18n',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/th/terms`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'i18n-tests-no-key',
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
