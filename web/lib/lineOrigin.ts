// Where LINE OAuth starts / returns (pure, unit-tested in scripts/line-auth.test.mjs).
// Production: www.whiskora.pet (unchanged). The single UAT Preview (F4 Phase D): ONLY its own fixed URL — a staging
// sign-in can never be redirected to production, and production never trusts a Preview origin.
import { F4_LINE_UAT_SITE_URL, PRODUCTION_LINE_ORIGIN, PRODUCTION_LINE_ORIGINS } from './line-uat.mjs'

/** site URL used to build the LINE redirect_uri when starting OAuth */
export function lineAuthorizeSiteUrl(envSiteUrl: string | undefined, uat: boolean): string {
  if (uat) return F4_LINE_UAT_SITE_URL
  return (envSiteUrl || PRODUCTION_LINE_ORIGIN).replace(/\/$/, '')
}

/** origins the callback trusts from the line_origin cookie */
export function lineTrustedOrigins(uat: boolean): string[] {
  return uat ? [F4_LINE_UAT_SITE_URL] : [...PRODUCTION_LINE_ORIGINS]
}

/** site URL the callback uses for redirect_uri and for every redirect back to the app */
export function lineCallbackSiteUrl(cookieOrigin: string | undefined, uat: boolean): string {
  const raw = (cookieOrigin || '').replace(/\/$/, '')
  const trusted = lineTrustedOrigins(uat)
  return trusted.includes(raw) ? raw : trusted[0]
}
