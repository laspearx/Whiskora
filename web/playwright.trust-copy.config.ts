import { defineConfig } from '@playwright/test';
import base from './playwright.i18n-findings.config';

export default defineConfig({ ...base, testMatch: 'trust-copy.spec.ts' });
