# i18n improvement — Phase 1 (foundation + first public pages)

Date 2026-11-03 · branch `fix/i18n-foundation-phase1` (from `audit/ui-i18n-consistency` `bd4005f`) · local only: not
pushed, not deployed. Follows `docs/UI_I18N_CONSISTENCY_AUDIT.md` (finding IDs UI-xx below).
Uses the existing i18n system (`i18n/context.tsx`, `messages/{th,en}.json`, `[locale]` routes, `NEXT_LOCALE`) —
no second translation system.

## 1. Foundation changes

| Area | Change | Files | Audit |
|---|---|---|---|
| Server `<html lang>` | `middleware.ts` passes the URL locale to the root layout in a request header (always set by the middleware, overriding anything sent by the browser); `app/layout.tsx` renders `<html lang="th|en">` (anything else → `th`). `HtmlLang` stays for client navigation. | `middleware.ts`, `app/layout.tsx` | UI-01 ✅ |
| Page metadata | `[locale]/layout.tsx` `generateMetadata`: site title / description / Open Graph locale in the URL language (`title.absolute`, so the root template no longer doubles "\| Whiskora"). Per page: `lib/metadata.ts` `localeMetadata(locale, path, …)` → title, description, **canonical**, **hreflang** (`th`, `en`, `x-default`), OG locale. The layout sets **no** canonical (it cannot know the path). | `app/[locale]/layout.tsx`, `lib/metadata.ts`, shims of farm-hub / search | UI-02 partly ✅ |
| Dates / numbers / prices / ages | `lib/format.ts`: `formatDate` (TH: Buddhist year "10 มี.ค. 2567", EN: "10 Mar 2024"), `formatDateTime` (24 h), `formatNumber`, `formatPrice` ("฿18,000", no decimals), `formatAge` ("1 ปี 2 เดือน" / "1 yr 2 mo"); fixed `Asia/Bangkok` time zone and explicit locale (no runtime default → no server / browser mismatch). | `lib/format.ts` | UI-10 partly ✅ |
| Species names | `speciesName(id, locale)` from the existing species list (custom values = user data, unchanged). | `lib/species.ts` | — |
| Messages API | `t(key, vars)` — nested keys (`problem.health.title`) and `{placeholders}`; missing keys still render the key (never crash) and are reported once in development (`[i18n] missing message …`). Backward compatible. | `i18n/context.tsx` | — |
| Language switch | (from the audit branch) keeps path, query string and hash. | `i18n/navigation.tsx` | UI-04 ✅ |
| Hydration | locale-dependent text only from the URL locale (same on server and client); formatters pin time zone + locale; farm-hub / search load data after mount. 0 page errors in the production crawl. | — | — |

New message namespaces (inserted after `nav`, away from the Explore branch's append at the end of the file):
`meta` 6, `common` 16, `landing` 83, `farmHub` 15, `search` 9 → **558 keys** in each language (429 before).
Glossary used: *Pet ID*, *QR profile*, *health records*, *farm*, *Verified farm*, *Ready for a new home*,
*Open for reservation*, *reservation*, *owner transfer*, *Price on request*. Breeds / names / provinces / districts
are user or geographic data and are not translated (farm-hub shows the English part of a stored
"English (ไทย)" breed on /en, the Thai part on /th).

## 2. Pages translated (3)

| Route | Before (audit) | Now | Notes |
|---|---|---|---|
| `/` home | 83 Thai source lines, Thai on /en | ✅ TH / EN — hero, sections, features, roadmap, FAQ, CTA, aria-labels, demo date, **JSON-LD in the page language** (FAQ, WebPage `inLanguage`, search action URL) | eyebrows ("WHY WHISKORA", …) and demo tabs stay English in both languages (design choice) |
| `/farm-hub` | Thai on /en, load failure shown as "no farms" | ✅ TH / EN — title, subtitle, search label / placeholder, view switch, species filter, empty states, **error state with retry** (UI-09), card status / price / age / sex / verified badge / Bangkok wording, own metadata | species pills now use the system list: Thai "สุนัข" → "หมา" (same word as everywhere else); unknown sex no longer shows the female icon |
| `/search` | Thai on /en, no state for "no query", failure shown as "not found" | ✅ TH / EN — title, query label, **no-query state**, empty state, **error state with retry**, fallback card text, back label, own metadata | the query is sent exactly as before |

Fully TH / EN now: `/`, `/farm-hub`, `/search`, `/terms`, `/contact`, `/register`, `/p/[id]`,
`/profile/transfers`, `/farm-dashboard/[id]/reservations` (**9**), `/login` partial (PR #37) — plus the navigation and
the 404 on every page. **Remaining: 69 routes** with Thai system text on /en.

## 3. Design system — `globals.css` vs Tailwind (UI-12): assessed, **not** changed

Experiment (reverted): base element rules (`input/select/textarea/button { font-size: inherit }`, `h1–h3`, `a`) moved
into `@layer base` (`docs/audit-evidence/i18n-phase1/css-layer-base.diff`). The file's own comment says Tailwind
classes were meant to override these rules — today they cannot.

Impact (production build, 20 public routes × TH / EN × 1440 / 390, pixel diff): **56 of 80 screenshots change**
(max 10.5 % of pixels, 8 change height). Every page with the navbar shifts slightly (TH/EN buttons and Sign-in
use their `text-xs` / `text-sm` sizes); headings with Tailwind sizes / colours change visibly (e.g. register heading
becomes pink and larger and wraps at 390 px; marketplace title larger, filter pills smaller). Evidence:
`docs/audit-evidence/i18n-phase1/css-layer-base-register-390-en-before-after.png`,
`…/css-layer-base-marketplace-1440-th-before-after.png`.

→ **Design System phase**: needs a design decision per heading / button (keep today's look by removing the
classes that never applied, or accept the intended look), then the one-file change + a full visual pass. Not part of
Phase 1.

## 4. Tests

| Test | Result |
|---|---|
| TypeScript | ✅ |
| ESLint, changed files vs `bd4005f` | ✅ no new problem (`search` 5 → 3); new files clean |
| `tests/i18n-consistency.test.mjs` (parity, empty, placeholders, no Thai in EN, literal keys exist, Navbar) | ✅ 6 / 6 |
| `tests/i18n-format.test.mjs` (dates TH / EN, Bangkok time zone, invalid input, numbers, prices, ages, dynamic home keys, metadata keys, glossary) | ✅ 9 / 9 |
| `e2e/i18n/language.spec.ts` (switch, refresh, back / forward, cookie, deep links, query, axe on nav, 404) | ✅ 18 / 18 |
| `e2e/i18n/foundation.spec.ts` desktop 1440 + mobile 390 (server `lang`, metadata / canonical / hreflang, home EN / TH + dates + JSON-LD, farm-hub cards with **synthetic** Supabase responses, error / empty states, search states, switch keeps path + query + hash with refresh / back / forward, overflow + hydration at 1440 / 768 / 390 / 360) | ✅ 20 / 20 |
| Production build + crawl (20 public routes + 404 × TH / EN × 4 widths = 168 loads) | ✅ 0 overflow, 0 page errors, 0 raw keys, `lang` = URL language everywhere; `/`, `/farm-hub`, `/search` on /en: **0 Thai characters** at every width |
| `messages/*.json` merge with `feat/explore-discovery` (simulated) | ✅ auto-merged, all keys kept (17 namespaces; `explore` 61). Only `WHISKORA_PLATFORM_OVERVIEW.md` conflicts (doc lines) |

No production / staging data, no accounts; the browser tests answer the dummy Supabase URL with synthetic rows.

## 5. Shared layout impact

- `app/layout.tsx` is now `async` and reads a request header → every route that used the root layout is dynamic.
  Before: all `/[locale]/*` pages were already dynamic; 40 static entries — 39 non-locale pages (redirected by the
  middleware, never served) and `/_not-found` — become dynamic; `robots.txt` / `sitemap.xml` stay static. No user-facing route
  lost static rendering.
- `[locale]/layout.tsx` adds `generateMetadata` (title / description / OG for every page).
- Navbar / Footer / RootChrome unchanged in this phase.

## 6. Pending

| Item | Why | Next step |
|---|---|---|
| 69 routes Thai-only on /en | scope | order: pet create / edit / vaccine / weight → profile area → partner registration → dashboards; `pets/[id]` after PR #33 |
| Per-page metadata for the other routes; `pet-knowledge` title doubles "\| Whiskora" | scope | `localeMetadata()` in each `[locale]` shim |
| 27 remaining `toLocale*String` call sites without a locale or with a fixed `th-TH` (23 files; 5 of them in files owned by PR #33 / #37) | scope | switch to `lib/format.ts` page by page |
| `farm-hub` pet cards link to `/pets/[id]` (owner page; anonymous users are sent to sign-in) instead of the public `/p/[id]` | routing behaviour, not i18n | product decision |
| UI-12 `@layer base` | broad visual impact (§3) | Design System phase |
| Login heading, register toggles, `/p/[id]` states | PR #37 | after PR #37 lands |
| `/pets/[id]` (177 Thai lines) | PR #33 (Codex) | after PR #33 lands |
| `WHISKORA_PLATFORM_OVERVIEW.md` | edited by every branch | resolve the doc conflict at merge time |
