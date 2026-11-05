import { defineConfig } from '@playwright/test';
import base from './playwright.vaccine-mock.config';
export default defineConfig({ ...base, testMatch: ['first-listing.spec.ts', 'first-listing-public.spec.ts'] });
