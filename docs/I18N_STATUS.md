# English (/en) status — 2026-10-30

**Routing** (separate from translation): every page has a `[locale]` route; middleware keeps the last locale in cookie `NEXT_LOCALE`; auth callbacks and email login keep it. Covered by `web/e2e/public.spec.ts`.

**Translated through `messages/{th,en}.json`** (system text only — user data such as pet names, breeds and `pets.status` values stays as entered; status is translated at display on `/p/[id]`):

| Area | File | Namespace |
|---|---|---|
| Sign in (live page) | `app/[locale]/login/page.tsx` | `login` |
| Sign up | `app/register/page.tsx` | `register` |
| Public pet profile / QR page | `app/p/[id]/page.tsx` | `pet` |
| Transfer inbox (accept/decline) | `app/profile/transfers/page.tsx` | `transfers` |
| Farm reservations | `app/farm-dashboard/[id]/reservations/page.tsx` | `reservations` |
| Footer | `app/components/Footer.tsx` | `footer` |
| Header nav, mobile menu, bottom tab bar (2026-11-03, branch `audit/ui-i18n-consistency`) | `app/components/Navbar.tsx` | `nav` |
| 404 page (local TH/EN copy) | `app/not-found.tsx` | — |
| Homepage, farm-hub, search + site / page metadata (Phase 1, branch `fix/i18n-foundation-phase1`) | `app/[locale]/page.tsx`, `app/farm-hub/page.tsx`, `app/search/page.tsx`, `app/[locale]/layout.tsx` | `landing`, `farmHub`, `search`, `common`, `meta` |
| Formatting helpers (dates TH Buddhist / EN Gregorian, prices, ages) | `lib/format.ts` | — |
| Marketplace, clinics & services, community, about (Phase 2, branch `fix/i18n-phase2`) | `app/marketplace`, `app/service-hub`, `app/community`, `app/about` | `marketplace`, `serviceHub`, `community`, `about` |

**How a page gets its messages (since Phase 2):** the `[locale]` layout sends only `nav`, `footer`, `common` (+ `login` until PR #37); a translated page adds its namespaces with `<ScopedMessages ns={[…]}>` in its `app/[locale]/…/page.tsx`. `tests/i18n-namespaces.test.mjs` fails if one is missing.

Phase 2 review fixes (2026-11-04, local): `RootChrome` now receives fallback globals from the server instead of importing the entire Thai catalogue into client JavaScript. `ScopedMessages` is server-only. Marketplace/service-hub loads ignore stale results and unmounted requests; invented service ratings are removed. See [I18N_PHASE2_FINDINGS.md](I18N_PHASE2_FINDINGS.md). Translation coverage below is unchanged.
| Terms, Contact | `app/terms`, `app/contact` | local TH/EN copy |

**Still Thai-only under /en** (65 routes after Phase 2 — per-route status in `docs/I18N_PHASE2.md`; was 69 after Phase 1 — full list and priorities in `docs/UI_I18N_CONSISTENCY_AUDIT.md`): owner pet pages (`/pets/[id]`, edit, vaccines, weight, ID card incl. the transfer/co-owner modal), farm/shop/service dashboards, partner registration, profile area, admin, knowledge articles, pet tools, privacy policy. `messages/en.json` → `home` has 113 keys from an older homepage that the current homepage does not use.

**Not to be machine-written:** knowledge articles (`pet-knowledge/articles.ts`) and the privacy policy need a human translation/review; until then they stay Thai and should be marked as Thai-only if linked from English pages.

Next suggested order (navbar and homepage done): pet create / edit / vaccine / weight forms → profile area → partner registration → dashboards; owner pet profile + transfer modal after PR #33.
