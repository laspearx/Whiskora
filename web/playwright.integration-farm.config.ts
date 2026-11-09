import { defineConfig } from '@playwright/test';
import base from './playwright.vaccine-mock.config';

export default defineConfig({ ...base, testMatch: 'integration-farm.spec.ts' });
