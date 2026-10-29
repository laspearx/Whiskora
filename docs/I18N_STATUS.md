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
| Terms, Contact | `app/terms`, `app/contact` | local TH/EN copy |

**Still Thai-only under /en** (73 pages): homepage, navbar menus, owner pet pages (`/pets/[id]`, edit, vaccines, weight, ID card incl. the transfer/co-owner modal), farm/shop/service dashboards, partner registration, profile area, admin, knowledge articles, pet tools, privacy policy. `messages/en.json` → `home` has 113 keys from an older homepage that the current homepage does not use.

**Not to be machine-written:** knowledge articles (`pet-knowledge/articles.ts`) and the privacy policy need a human translation/review; until then they stay Thai and should be marked as Thai-only if linked from English pages.

Next suggested order: owner pet profile + transfer modal → pet create/edit/vaccine/weight forms → navbar → homepage.
