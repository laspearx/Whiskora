import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import base from './playwright.i18n.config';

const label = process.env.I18N_RUN_LABEL || 'findings';
const evidence = resolve(process.env.I18N_EVIDENCE_DIR || '../local-evidence/i18n-phase2-findings-20261104');
const bundleOnly = process.env.I18N_BUNDLE_ONLY === '1';
export default defineConfig({
  ...base,
  testMatch: bundleOnly ? 'bundle.spec.ts' : ['language.spec.ts', 'foundation.spec.ts', 'phase2.spec.ts', 'findings.spec.ts'],
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [['list'], ['json', { outputFile: resolve(evidence, `${label}-playwright.json`) }]],
  outputDir: resolve(evidence, `${label}-browser-artifacts`),
  projects: bundleOnly ? base.projects?.filter(p => p.name === 'desktop') : base.projects,
  use: {
    ...base.use,
    serviceWorkers: 'block',
    channel: 'chromium',
    launchOptions: { args: ['--disable-dev-shm-usage', '--disable-gpu'] },
  },
  webServer: {
    command: 'node scripts/i18n-local-server.mjs',
    url: 'http://localhost:3132/en/terms',
    reuseExistingServer: false,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    env: { I18N_PRODUCTION: process.env.I18N_PRODUCTION || '0' },
  },
});
