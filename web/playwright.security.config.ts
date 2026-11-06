import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const runDir = resolve(process.env.SECURITY_EVIDENCE_DIR || 'test-results/security',
  new Date().toISOString().replace(/[:.]/g, '-'));

export default defineConfig({
  testDir: './e2e', testMatch: 'security-patch.spec.ts',
  timeout: 45_000, expect: { timeout: 15_000 }, workers: 1, retries: 0,
  reporter: [['list'], ['json', { outputFile: resolve(runDir, 'browser.json') }]],
  outputDir: resolve(runDir, 'artifacts'),
  use: { baseURL: 'http://127.0.0.1:3291', serviceWorkers: 'block', trace: 'retain-on-failure',
    launchOptions: { args: ['--disable-dev-shm-usage'] } },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/security-mock-server.mjs',
    url: 'http://127.0.0.1:3291/th/login', reuseExistingServer: false,
    timeout: 120_000, gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
});
