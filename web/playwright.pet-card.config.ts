import { defineConfig } from '@playwright/test';
import base from './playwright.i18n-findings.config';

export default defineConfig({
  ...base,
  testMatch: process.env.CARD_BASELINE === '1' ? 'pet-card-baseline.spec.ts' : process.env.CARD_SHARE_ONLY === '1' ? 'pet-card-share.spec.ts' : ['pet-card.spec.ts', 'pet-card-share.spec.ts'],
  projects: base.projects?.filter(project => project.name === 'desktop'),
  timeout: 240_000,
});
