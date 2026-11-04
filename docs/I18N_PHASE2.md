# i18n improvement — Phase 2

Date 2026-11-03 · branch `fix/i18n-phase2` (from `fix/i18n-foundation-phase1` `c2277cc`) · local only: not pushed,
not deployed. Previous: `docs/I18N_PHASE1.md`, `docs/UI_I18N_CONSISTENCY_AUDIT.md`.

**2026-11-04 review fixes:** all four requested findings are resolved locally on
`fix/i18n-phase2-review-findings`. See [I18N_PHASE2_FINDINGS.md](I18N_PHASE2_FINDINGS.md)
for full clean-build, JavaScript (not HTML-only), race, namespace and browser evidence.
The historical payload measurements below concern HTML. They did not detect the
full Thai catalogue that RootChrome still imported into client JavaScript; that
separate issue is corrected and measured in the review fixes.

## 1. Foundation impact review (Phase 1 root layout reading the locale header)

Three local production builds, same dummy env, measured on the same machine (`next start`, 40 sequential requests
per path after 5 warm-ups, gzip): **baseline** `bd4005f` (before Phase 1) · **P1** `c2277cc` · **P2** this branch.

### Measured

| | baseline | P1 | P2 |
|---|---|---|---|
| Build: static / dynamic entries | 42 / 122 | 2 / 162 | 2 / 162 |
| User-facing `/[locale]/*` routes | dynamic | dynamic | dynamic (unchanged) |
| `/farm-hub` (no locale) | 307 → `/th/farm-hub` | same | same |
| `Cache-Control` of locale pages | `private, no-cache, no-store` | same | same |
| `Cache-Control` of `/_next/static/*` / `/logo.png` | `immutable` / `max-age=0` | same | same |
| `.next/static` size | 3.6 MB, 103 chunks | 3.6 MB, 104 | — |
| `<html lang>` in server HTML | **missing** | `th` / `en` | `th` / `en` |
| Titles on /en | Thai | English | English |

HTML size (gzip, bytes) and median response time (ms):

| Path | baseline | P1 | P2 | median ms baseline / P1 / P2 |
|---|---|---|---|---|
| `/th` | 25,999 | 28,996 | **22,231** | 23.2 / 20.0 / 26.0 |
| `/en` | 24,480 | 26,449 | **20,282** | 14.0 / 21.7 / 14.6 |
| `/en/farm-hub` | 16,071 | 18,805 | **10,475** | 12.6 / 19.5 / 12.2 |
| `/en/terms` | 14,903 | 17,498 | **8,947** | 10.0 / 13.7 / 10.0 |
| `/th/about` | 19,507 | 22,534 | **14,326** | 11.1 / 12.8 / 10.3 |
| `/en/marketplace` | 16,151 | 18,752 | **10,524** | 11.8 / 11.0 / 10.6 |
| `/th/login` | 17,740 | 20,758 | **10,991** | — |
| `/th/does-not-exist` (404) | 3,482 | 4,963 | 4,962 | 6.0 / 11.6 / 5.9 |
| `/farm-hub` (redirect) | — | — | — | 2.4 / 1.8 / 2.0 |

Finding: P1's cost was **not** the header — it was that the `[locale]` layout sent the **entire messages file** to
every page, and Phase 1 made that file 42 % bigger (TH 38.7 → 54.8 KB). Projected over the remaining 2,087 Thai
source lines, every page would have carried ~300 KB (raw) of messages.

Options compared: (A) keep everything in the layout — measured P1 above; (B) layout picks namespaces by URL —
**rejected**: the `[locale]` layout is not re-rendered on client-side navigation, so the next page would miss its
messages (raw keys); (C) **chosen**: layout sends only `nav`, `footer`, `common` (+ `login` until PR #37 lands); each
translated page adds its own namespaces with `<ScopedMessages ns={[…]}>` in its `app/[locale]/…` route file
(server component → nested provider, merged on top of the layout's). Prototype first (layout with globals only,
not committed): `/en/terms` 17,498 → 8,901 B; the committed version gives the P2 column — **every page smaller than
before i18n started**, response times back to baseline.

### Assessed, not measured

- **SEO**: better — server `lang`, per-language titles / descriptions, canonical + hreflang on pages with metadata;
  JSON-LD in the page language. The 39 non-locale paths only ever answer 307, so their static → dynamic switch is
  invisible to crawlers.
- **Hydration**: no page errors in any crawl (P1 168 loads, P2 168 loads) or browser test; texts depend only on the
  URL locale; formatters pin locale + time zone.
- **Hosting CDN**: locale pages were already uncached (`no-store`); a hosting-level cache of the 404 page was not
  measured (local `next start` only).
- Numbers are single-machine, localhost; treat sub-10 ms differences as noise.

## 2. Pages translated in Phase 2 (4)

Chosen from the public routes that are not owned by PR #33 / PR #37 / Explore, sit next to home / farm-hub / search
in the navigation (Explore menu, footer), carry the most untranslated text among those, and have no
authentication or data-writing logic:

| Route | What changed | Notes |
|---|---|---|
| `/marketplace` | heading, subtitle, search label, category tabs (labels translated, **stored Thai values still sent to the API** — checked in the browser test), species pills, loading (`aria-busy`), **error state + retry**, empty states, prices via `formatPrice`, sale badge, own metadata | product names / shop names = data |
| `/service-hub` | same pattern; the stored Thai category is shown with its translated label (unknown values shown as stored); "View details"; own metadata | Hard-coded rating removed in the 2026-11-04 review fixes; no replacement review system |
| `/community` | badge, title, copy, quote, back button, own metadata | |
| `/about` | heading, tagline, 4 missions, 6 features, note, back label, own metadata | old unused `about` keys (audit UI-21) replaced in place |

Shared keys moved to `common` (`otherPets`, `backHome`, `viewDetails`, `browseFarms`); farm-hub now uses
`common.otherPets`. Glossary checks in `tests/i18n-format.test.mjs` (e.g. "Clinics & services" = nav label = page
title).

## 3. Route status (79 routes)

**Complete 13 · Partial 1 · Pending 65.** Navigation and 404 are TH / EN on every route.

| Route | Status | Since | Page metadata | Access | Owned by another branch |
|---|---|---|---|---|---|
| `/` | Complete | Phase 1 | layout (site) | public |  |
| `/about` | Complete | Phase 2 | own | public |  |
| `/admin/dashboard` | Pending |  | site title (layout) | sign-in |  |
| `/admin/farms` | Pending |  | site title (layout) | sign-in |  |
| `/admin/pets` | Pending |  | site title (layout) | sign-in |  |
| `/admin/services` | Pending |  | site title (layout) | sign-in |  |
| `/admin/shops` | Pending |  | site title (layout) | sign-in |  |
| `/admin/users` | Pending |  | site title (layout) | sign-in |  |
| `/admin/verifications` | Pending |  | site title (layout) | sign-in |  |
| `/community` | Complete | Phase 2 | own | public |  |
| `/contact` | Complete | before | site title (layout) | public |  |
| `/farm-dashboard/[id]` | Pending |  | site title (layout) | sign-in | PR #37 |
| `/farm-dashboard/[id]/activities/create` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/appointments` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/appointments/create` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/babies` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/data-check` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/edit` | Pending |  | site title (layout) | sign-in | PR #37 |
| `/farm-dashboard/[id]/litters/[litter-id]` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/litters/[litter-id]/add-baby` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/litters/[litter-id]/birth` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/litters/[litter-id]/edit` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/litters/[litter-id]/weights` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/litters/create` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/members` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/pets` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/pets/bulk-create` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/pets/create` | Pending |  | site title (layout) | sign-in | PR #37 |
| `/farm-dashboard/[id]/privacy` | Pending |  | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/reservations` | Complete | before | site title (layout) | sign-in |  |
| `/farm-dashboard/[id]/verify` | Pending |  | site title (layout) | sign-in | PR #37 |
| `/farm-dashboard/[id]/weights` | Pending |  | site title (layout) | sign-in |  |
| `/farm-hub` | Complete | Phase 1 | own | public |  |
| `/farm/[id]` | Pending |  | site title (layout) | public | PR #37 |
| `/login` | Partial | heading TH (PR #37) | site title (layout) | public | PR #37 |
| `/marketplace` | Complete | Phase 2 | own | public |  |
| `/p/[id]` | Complete | before | site title (layout) | public | PR #37 |
| `/partner` | Pending |  | site title (layout) | public | PR #37 |
| `/partner/register-farm` | Pending |  | site title (layout) | public |  |
| `/partner/register-service` | Pending |  | site title (layout) | sign-in |  |
| `/partner/register-shop` | Pending |  | site title (layout) | sign-in |  |
| `/pet-id-card` | Pending |  | site title (layout) | public |  |
| `/pet-id-card-preview` | Pending |  | site title (layout) | public |  |
| `/pet-knowledge` | Pending |  | site title (layout) | public |  |
| `/pet-tools` | Pending |  | site title (layout) | public |  |
| `/pets/[id]` | Pending |  | site title (layout) | sign-in | PR #33 / PR #37 |
| `/pets/[id]/activities/create` | Pending |  | site title (layout) | public |  |
| `/pets/[id]/edit` | Pending |  | site title (layout) | sign-in |  |
| `/pets/[id]/id-card` | Pending |  | site title (layout) | sign-in |  |
| `/pets/[id]/vaccines` | Pending |  | site title (layout) | sign-in |  |
| `/pets/[id]/vaccines/create` | Pending |  | site title (layout) | sign-in |  |
| `/pets/[id]/weight` | Pending |  | site title (layout) | sign-in |  |
| `/pets/create` | Pending |  | site title (layout) | public |  |
| `/pets/vaccines/all` | Pending |  | site title (layout) | sign-in |  |
| `/pets/vaccines/bulk-add` | Pending |  | site title (layout) | sign-in |  |
| `/privacy` | Pending |  | site title (layout) | public |  |
| `/profile` | Pending |  | site title (layout) | sign-in |  |
| `/profile/calendar` | Pending |  | site title (layout) | sign-in |  |
| `/profile/connections` | Pending |  | site title (layout) | sign-in | PR #37 |
| `/profile/edit` | Pending |  | site title (layout) | sign-in |  |
| `/profile/finance` | Pending |  | site title (layout) | sign-in |  |
| `/profile/invitations` | Pending |  | site title (layout) | sign-in |  |
| `/profile/pets` | Pending |  | site title (layout) | sign-in |  |
| `/profile/settings` | Pending |  | site title (layout) | sign-in | PR #37 |
| `/profile/transfers` | Complete | before | site title (layout) | sign-in |  |
| `/register` | Complete | before | site title (layout) | public | PR #37 (page) — shim here |
| `/search` | Complete | Phase 1 | own | public |  |
| `/service-dashboard/[id]` | Pending |  | site title (layout) | sign-in |  |
| `/service-dashboard/[id]/manage-services` | Pending |  | site title (layout) | sign-in |  |
| `/service-dashboard/[id]/members` | Pending |  | site title (layout) | sign-in |  |
| `/service-dashboard/[id]/settings` | Pending |  | site title (layout) | sign-in |  |
| `/service-hub` | Complete | Phase 2 | own | public |  |
| `/services/[id]` | Pending |  | site title (layout) | public |  |
| `/shop-dashboard/[id]` | Pending |  | site title (layout) | sign-in |  |
| `/shop-dashboard/[id]/edit` | Pending |  | site title (layout) | sign-in |  |
| `/shop-dashboard/[id]/members` | Pending |  | site title (layout) | sign-in |  |
| `/shops/[id]` | Pending |  | site title (layout) | public |  |
| `/terms` | Complete | before | site title (layout) | public |  |
| `/weigh-in` | Pending |  | site title (layout) | sign-in |  |

Totals: Complete 13, Partial 1, Pending 65 (of 79).

## 4. Tests

| Test | Result |
|---|---|
| TypeScript | ✅ |
| ESLint, changed files vs `c2277cc` | ✅ no new problem (community 2 → 0, `[locale]/layout` 1 → 0); new files clean |
| Unit: `i18n-consistency` 6, `i18n-format` 13, `i18n-namespaces` 5 | ✅ 24 / 24; namespace test fails if a page's `ns` is removed (mutation-checked) and flags the Explore merge (§6) |
| Playwright `language` 18 + `foundation` 20 + `phase2` 16 (desktop 1440 + mobile 390; synthetic Supabase rows; client-side navigation between translated pages; payload scoping; API still gets stored Thai categories; error / empty states; switch keeps path + query + hash with refresh / back / forward; 4 widths × TH / EN overflow + hydration + no Thai on /en) | see the commit message for the final run |
| Production crawl (20 public routes + 404 × TH / EN × 1440 / 768 / 390 / 360 = 168 loads) | ✅ 0 overflow, 0 page errors, 0 raw keys, `lang` correct; all 11 complete public routes: 0 Thai characters on /en at every width |
| `next build` | ✅ |

Environment note: running two Playwright workers against `next dev` made Chromium crash ("Page crashed") on this
machine; the suites run with `--workers=1`. Failures seen during development were either crashes or test bugs
(e.g. the baht sign `฿` is in the Thai Unicode block — tests now exclude U+0E3F).

## 5. Findings kept for later

| Item | Status / acceptance criteria |
|---|---|
| **farm-hub pet cards link to `/pets/[id]`** (owner page — anonymous visitors are sent to sign-in) instead of the public `/p/[id]` | Not changed (routing; `/pets/[id]` is PR #33 / #37 territory). **Acceptance criteria for the fix**: (1) an anonymous visitor clicking a card lands on `/{locale}/p/{id}` with no sign-in prompt; (2) only fields allowed by the visibility tiers are shown (the page already uses `get_my_pet_access` / `get_pet_health`) — no new data access; (3) owners / farm team still reach management from `/p/{id}` or their dashboard; (4) the locale prefix is kept; (5) e2e: anonymous click → `/p/`, signed-in owner → manage link works; (6) lands after PR #33 and PR #37 (both touch these pages) |
| service-hub hard-coded rating "4.9 (120)" on every card | **Resolved 2026-11-04:** rating and star removed; action aligned to the right; TH/EN Desktop/Mobile layout verified |
| PR #33 pages (`/pets/[id]`, vaccine UI) | translate after PR #33 lands |
| Login / auth flow (PR #37): `/login` heading Thai, register password toggles, `/p/[id]` error vs not-found | after PR #37; then move `login` from `LAYOUT_EXTRA_NAMESPACES` to a `ScopedMessages` in the login route |
| Global CSS vs Tailwind (UI-12) | unchanged; Phase 1 evidence (56 / 80 screenshots change) — Design System phase |
| Explore translation coverage | Explore is complete TH / EN on its own branch; **merge needs one change** (§6) |
| Metadata of untranslated routes | they get the English / Thai site title from the layout; own titles + canonical with each translation. `pet-knowledge` title still doubles "\| Whiskora" (its own metadata, Pending route) |
| 27 `toLocale*String` call sites | switch to `lib/format.ts` with each page |

## 6. Compatibility with other branches

- **Explore (`feat/explore-discovery`)**: `messages/*.json` auto-merge (simulated; 20 namespaces, `explore` kept).
  Because pages now get only their namespaces, `app/[locale]/explore/page.tsx` must wrap the page:
  `<ScopedMessages locale={locale} ns={['explore']}>` — `tests/i18n-namespaces.test.mjs` fails on the merged tree until
  it does (checked on a simulated merge), so it cannot slip through.
- **PR #37**: its `[locale]/login` page keeps working (namespace `login` stays global, browser-tested); its `register`
  and `p/[id]` page files are untouched — only their `[locale]` route files (re-export shims) gained a
  `ScopedMessages` wrapper. If PR #37 also edits those shim files, the wrapper must be kept.
- **PR #33 / Codex**: no shared file.
- **H2, R1/R4**: no shared file.
- `WHISKORA_PLATFORM_OVERVIEW.md`: doc-line conflict with every branch, resolve at merge time.
