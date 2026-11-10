// F4 Phase D — the ONE Preview allowed to run real LINE Login against Supabase staging (no dependencies: imported by
// the build guard and by app code). Changing these values is a reviewed code change, never an env setting.
export const F4_LINE_UAT_BRANCH = 'security/f4-line-identity'
export const F4_LINE_UAT_SITE_URL = 'https://whiskora-git-security-f4-line-identity-laspearxs-projects.vercel.app'
// production LINE origins (unchanged behaviour outside the UAT Preview)
export const PRODUCTION_LINE_ORIGIN = 'https://www.whiskora.pet'
export const PRODUCTION_LINE_ORIGINS = [PRODUCTION_LINE_ORIGIN, 'https://whiskora.pet']
