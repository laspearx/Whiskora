import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// Keep each attempt's traces/results instead of overwriting the previous failure.
const runDir = resolve('test-results/vaccine-mock', `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`);

// Dedicated local-only run: never inherits E2E_BASE_URL, accounts or storage state.
export default defineConfig({
  testDir: './e2e/local',
  testMatch: 'vaccine-ux.spec.ts',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: resolve(runDir, 'results.json') }],
    ['./e2e/local/vaccine-mock-reporter.ts', { outputFile: resolve(runDir, 'case-events.jsonl') }],
  ],
  outputDir: resolve(runDir, 'artifacts'),
  use: {
    baseURL: 'http://127.0.0.1:3217', serviceWorkers: 'block',
    trace: { mode: 'retain-on-failure', snapshots: false, screenshots: false },
    channel: 'chromium',
    launchOptions: { args: ['--disable-dev-shm-usage', '--disable-gpu'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/vaccine-mock-server.mjs',
    env: { VACCINE_MOCK_SERVER_LOG: resolve(runDir, 'server-events.jsonl'), UX_PRODUCTION: process.env.UX_PRODUCTION || '0' },
    url: 'http://127.0.0.1:3217/th/pets/990001',
    reuseExistingServer: false,
    stdout: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    timeout: 240_000,
  },
});
