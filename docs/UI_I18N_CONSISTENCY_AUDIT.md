# UI / i18n consistency audit — Whiskora web

Date 2026-11-03 · branch `audit/ui-i18n-consistency` (from `origin/main` `a86b35a`) · audit + fixes commit `76d1124` · local only: not pushed, not deployed.
Method: static analysis of the repository + a **local production build** (`next build && next start`) with an
**unreachable dummy Supabase URL** (no production / staging data, no accounts; every non-local request blocked) crawled
with Playwright at **1440 / 768 / 390 / 360 px** in **/th and /en**, plus a locally-invented mock session (never sent
anywhere reachable) for sign-in pages. Screenshots of the crawl stay outside the repository (synthetic pages only);
four "after" images are in `docs/audit-evidence/`.

Not audited here: Explore (`feat/explore-discovery` `9d21e18`, read-only reference — see §10), the pet profile /
vaccine work of PR #33 (files owned by Codex), and anything that needs real data (§1 "needs fixture").

## Summary

| | |
|---|---|
| Routes in the repository | **79** (+ the 404 page) — every one has its `[locale]` route (no missing shim) |
| Browser loads | 632 anonymous (79 × 2 languages × 4 widths) + 224 mock-session + 168 regression + 32 targeted |
| Public routes | 24 (incl. login / register): 20 render at their own URL; `/farm/[id]`, `/shops/[id]`, `/services/[id]`, `/pets/create` redirect without data (UI-08). 55 need sign-in (→ login) |
| Sign-in routes whose shell rendered with the mock session | 17; 38 (dashboards, admin, pet edit / ID card) redirect without real data → **Pending Verification** with a staging fixture |
| Fully TH / EN | **6** routes (`/terms`, `/contact`, `/register`, `/p/[id]`, `/profile/transfers`, `/farm-dashboard/[id]/reservations`); `/login` partial; **72 Thai-only on /en** |
| Navigation (header, mobile menu, bottom tab bar) | Thai-only on /en before → **TH / EN now** |
| Horizontal scrolling / element past the right edge | **none** at 360–1440 px on any rendered page |
| Raw translation keys shown / `/th/th` or `/en/en` / redirect loops | none / none (a typed `/en/en/x` is a 404) / none |
| messages/th.json vs en.json | same 429 keys (396 before + 33 `nav`), no empty values, placeholders match, no Thai in English values |
| Findings | **23** — P1 0 · P2 17 · P3 6 |
| Fixed in this branch (small, safe) | **6 findings** (11 changes) — §9 |
| Pending, other branch owns the file | 6 — §10 |
| Off-theme pages | 1 (default Next 404, fixed); 10 files mix Tailwind `pink-500/600` with the brand pink `#e84677` (P3, §2) |

## 1. Route inventory

"Thai lines in source" = source lines containing Thai outside comments (hard-coded UI text indicator).
| Route | Access | TH / EN | Thai lines in source | Browser (/th + /en) | Owned by another branch |
|---|---|---|---|---|---|
| `/` | public | ❌ TH only | 83 | ✓ 4 widths |  |
| `/about` | public | ❌ TH only | 28 | ✓ 4 widths |  |
| `/admin/dashboard` | sign-in | ❌ TH only | 9 | mock session → `/` (needs fixture) |  |
| `/admin/farms` | sign-in | ❌ TH only | 8 | mock session → `/` (needs fixture) |  |
| `/admin/pets` | sign-in | ❌ TH only | 8 | mock session → `/` (needs fixture) |  |
| `/admin/services` | sign-in | ❌ TH only | 7 | mock session → `/` (needs fixture) |  |
| `/admin/shops` | sign-in | ❌ TH only | 7 | mock session → `/` (needs fixture) |  |
| `/admin/users` | sign-in | ❌ TH only | 18 | mock session → `/` (needs fixture) |  |
| `/admin/verifications` | sign-in | ❌ TH only | 23 | mock session → `/` (needs fixture) |  |
| `/community` | public | ❌ TH only | 3 | ✓ 4 widths |  |
| `/contact` | public | ✅ TH/EN | 9 | ✓ 4 widths |  |
| `/farm-dashboard/[id]` | sign-in | ❌ TH only | 74 | mock session → `/partner` (needs fixture) | PR #33/#37 |
| `/farm-dashboard/[id]/activities/create` | sign-in | ❌ TH only | 33 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/appointments` | sign-in | ❌ TH only | 10 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/appointments/create` | sign-in | ❌ TH only | 30 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/babies` | sign-in | ❌ TH only | 23 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/data-check` | sign-in | ❌ TH only | 24 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/edit` | sign-in | ❌ TH only | 27 | mock session → `/partner` (needs fixture) | PR #33/#37 |
| `/farm-dashboard/[id]/litters/[litter-id]` | sign-in | ❌ TH only | 31 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/litters/[litter-id]/add-baby` | sign-in | ❌ TH only | 26 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/litters/[litter-id]/birth` | sign-in | ❌ TH only | 28 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/litters/[litter-id]/edit` | sign-in | ❌ TH only | 19 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/litters/[litter-id]/weights` | sign-in | ❌ TH only | 19 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/litters/create` | sign-in | ❌ TH only | 27 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/members` | sign-in | ❌ TH only | 0 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/pets` | sign-in | ❌ TH only | 30 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/pets/bulk-create` | sign-in | ❌ TH only | 86 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/pets/create` | sign-in | ❌ TH only | 83 | mock session → `/partner` (needs fixture) | PR #33/#37 |
| `/farm-dashboard/[id]/privacy` | sign-in | ❌ TH only | 17 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/reservations` | sign-in | ✅ TH/EN | 1 | mock session → `/partner` (needs fixture) |  |
| `/farm-dashboard/[id]/verify` | sign-in | ❌ TH only | 28 | mock session → `/partner` (needs fixture) | PR #33/#37 |
| `/farm-dashboard/[id]/weights` | sign-in | ❌ TH only | 25 | mock session → `/partner` (needs fixture) |  |
| `/farm-hub` | public | ❌ TH only | 31 | ✓ 4 widths |  |
| `/farm/[id]` | public | ❌ TH only | 38 | → `/` | PR #33/#37 |
| `/login` | public | ⚠️ heading TH | 1 | ✓ 4 widths | PR #33/#37 |
| `/marketplace` | public | ❌ TH only | 28 | ✓ 4 widths |  |
| `/p/[id]` | public | ✅ TH/EN | 4 | ✓ 4 widths | PR #33/#37 |
| `/partner` | public | ❌ TH only | 17 | ✓ 4 widths | PR #33/#37 |
| `/partner/register-farm` | public | ❌ TH only | 48 | ✓ 4 widths |  |
| `/partner/register-service` | sign-in | ❌ TH only | 50 | mock session: shell renders |  |
| `/partner/register-shop` | sign-in | ❌ TH only | 42 | mock session: shell renders |  |
| `/pet-id-card` | public | ❌ TH only | 19 | ✓ 4 widths |  |
| `/pet-id-card-preview` | public | ❌ TH only | 40 | ✓ 4 widths |  |
| `/pet-knowledge` | public | ❌ TH only | 10 | ✓ 4 widths |  |
| `/pet-tools` | public | ❌ TH only | 78 | ✓ 4 widths |  |
| `/pets/[id]` | sign-in | ❌ TH only | 177 | mock session: shell renders | PR #33/#37 |
| `/pets/[id]/activities/create` | public | ❌ TH only | 26 | ✓ 4 widths |  |
| `/pets/[id]/edit` | sign-in | ❌ TH only | 101 | mock session → `/profile` (needs fixture) |  |
| `/pets/[id]/id-card` | sign-in | ❌ TH only | 19 | mock session → `/` (needs fixture) |  |
| `/pets/[id]/vaccines` | sign-in | ❌ TH only | 12 | mock session → `/pets/1` (needs fixture) |  |
| `/pets/[id]/vaccines/create` | sign-in | ❌ TH only | 33 | mock session → `/profile` (needs fixture) |  |
| `/pets/[id]/weight` | sign-in | ❌ TH only | 21 | mock session: shell renders |  |
| `/pets/create` | public | ❌ TH only | 65 | → `/register` |  |
| `/pets/vaccines/all` | sign-in | ❌ TH only | 12 | mock session: shell renders |  |
| `/pets/vaccines/bulk-add` | sign-in | ❌ TH only | 27 | mock session: shell renders |  |
| `/privacy` | public | ❌ TH only | 50 | ✓ 4 widths |  |
| `/profile` | sign-in | ❌ TH only | 42 | mock session: shell renders |  |
| `/profile/calendar` | sign-in | ❌ TH only | 17 | mock session: shell renders |  |
| `/profile/connections` | sign-in | ❌ TH only | 18 | mock session: shell renders | PR #33/#37 |
| `/profile/edit` | sign-in | ❌ TH only | 19 | mock session: shell renders |  |
| `/profile/finance` | sign-in | ❌ TH only | 26 | mock session: shell renders |  |
| `/profile/invitations` | sign-in | ❌ TH only | 18 | mock session: shell renders |  |
| `/profile/pets` | sign-in | ❌ TH only | 13 | mock session: shell renders |  |
| `/profile/settings` | sign-in | ❌ TH only | 27 | mock session: shell renders | PR #33/#37 |
| `/profile/transfers` | sign-in | ✅ TH/EN | 0 | mock session: shell renders |  |
| `/register` | public | ✅ TH/EN | 0 | ✓ 4 widths | PR #33/#37 |
| `/search` | public | ❌ TH only | 6 | ✓ 4 widths |  |
| `/service-dashboard/[id]` | sign-in | ❌ TH only | 28 | mock session → `/partner` (needs fixture) |  |
| `/service-dashboard/[id]/manage-services` | sign-in | ❌ TH only | 28 | mock session → `/partner` (needs fixture) |  |
| `/service-dashboard/[id]/members` | sign-in | ❌ TH only | 0 | mock session → `/partner` (needs fixture) |  |
| `/service-dashboard/[id]/settings` | sign-in | ❌ TH only | 37 | mock session → `/partner` (needs fixture) |  |
| `/service-hub` | public | ❌ TH only | 28 | ✓ 4 widths |  |
| `/services/[id]` | public | ❌ TH only | 14 | → `/service-hub` |  |
| `/shop-dashboard/[id]` | sign-in | ❌ TH only | 27 | mock session → `/partner` (needs fixture) |  |
| `/shop-dashboard/[id]/edit` | sign-in | ❌ TH only | 29 | mock session → `/partner` (needs fixture) |  |
| `/shop-dashboard/[id]/members` | sign-in | ❌ TH only | 0 | mock session → `/partner` (needs fixture) |  |
| `/shops/[id]` | public | ❌ TH only | 9 | → `/` |  |
| `/terms` | public | ✅ TH/EN | 8 | ✓ 4 widths |  |
| `/weigh-in` | sign-in | ❌ TH only | 20 | mock session: shell renders |  |

## 2. Design system actually in use (reference standard)

| Element | What exists | Consistency |
|---|---|---|
| Tokens | `app/globals.css` `:root`: `--ink #1f1a1c`, `--muted #8e7e84`, `--pink #e84677`, `--pink-soft`, `--pink-deep #c4325f`, `--line`, `--radius-sm 12px / --radius 18px / --radius-lg 24px`, font Prompt | Used through `var(--…)` in **11** files only; **68** pages declare their own `const F = { … }` palette, **70** pages ship their own `<style>` block |
| Brand pink | `#e84677` in 80 files | 10 files use Tailwind `pink-500/600` instead (Navbar, Footer, BottomNavigation, login, register, terms, contact, marketplace, farm-hub) — visibly brighter pink on the same screen |
| Radius | tokens 12 / 18 / 24 | 9 values in use: 8, 10, 11, 12, 14, 16, 18, 20, 24 px (+ `rounded-xl/2xl/3xl`) |
| Containers | layout `max-w-7xl` | page bodies use ~15 widths (400–960 px, `max-w-6xl`, `max-w-md` …) — intentional for forms vs. lists, but not tokenised |
| Typography | `h1 26 / h2 22 / h3 17` in globals | 32 font sizes (6–56 px) inline; global `h1–h3` rules override Tailwind size classes (UI-12) |
| Buttons | no shared component | heights 40 / 42 / 44 / 46 / 48 / 52 / 56 px; primary = brand pink (most pages) or `gray-900` pill (browse pages: farm-hub, marketplace, explore — **intentional**: filter pills, not CTAs) |
| Cards | inline per page | white, 1 px line, radius 14–20, soft shadow — visually consistent |
| Loading | `app/components/PageLoader.tsx` | used by 60 pages ✓; skeletons on marketplace / explore |
| Empty / not-found / error | none shared | 4 different looks (UI-22); load failures shown as "empty" (UI-09) |
| Dialogs | none shared | 5 custom fixed overlays, 0 with `role="dialog"` (UI-14); 163 `alert()` + 9 `confirm()` (UI-11) |
| Navigation | `Navbar` (header + mobile menu + bottom tab bar), `FarmBottomNav`, `DefaultBottomNav` | farm / shop / service dashboards have their own bottom bar — **intentional** (workspace tools) |
| i18n | `i18n/context.tsx` (`useTranslations`, no interpolation), `i18n/navigation.tsx`, `messages/{th,en}.json`, cookie `NEXT_LOCALE` | 7 files use it (+ Navbar now); terms / contact use local TH/EN copy |

## 3. Findings (by priority)

Status: **Fixed** (this branch) · **Pending** (needs a bigger change / decision) · **Pending integration** (file owned by another branch, §10).

| ID | P | Finding | Evidence | Status |
|---|---|---|---|---|
| UI-01 | P2 | `<html>` has **no `lang` in the server HTML** on every route; `HtmlLang` sets it only after hydration (screen readers / SEO / Thai line-breaking see no language first) | `curl /en` → `<html>`; root layout `<html suppressHydrationWarning>` | Pending — root layout cannot see the locale; options: middleware header + `headers()` (makes pages dynamic) or move `<html>` into `[locale]/layout` |
| UI-02 | P2 | **Page titles are Thai on every /en page** (78 routes use the root default title, 1 route has its own metadata) | crawl: 78 × "Whiskora \| Pet ID, QR Profile และฟาร์ม…" | Pending — per-route `generateMetadata` with locale |
| UI-03 | P2 | Header nav, Explore menu, mobile menu, bottom tab bar, workspace switcher and their aria-labels **Thai-only on /en** although a `nav` namespace existed (13 keys, unused) | crawl: 36–51 Thai chars on every /en page from the nav | **Fixed** — Navbar uses `nav.*` (33 keys added); /en nav has 0 Thai chars (`e2e/i18n` test) |
| UI-04 | P2 | **Language switch drops the query string and hash** (`/th/search?q=x` → `/en/search`) | mutation test: old `i18n/navigation.tsx` fails `?q=corgi` | **Fixed** — keeps `search` + `hash`; locale prefix stripped only as a whole segment |
| UI-05 | P2 | **404 = default Next page**: English on /th, unbranded, no way back, no `lang`; plus **hydration error #418** (root chrome prerendered Thai navbar around it, the browser removed it) | `curl /th/x` → "This page could not be found."; React #418 on every 404 | **Fixed** — `app/not-found.tsx` (TH / EN from the URL, bilingual title, noindex) + `RootChrome` skips `/_not-found`; 0 page errors at 4 widths |
| UI-06 | P2 | **72 routes Thai-only on /en** (hard-coded text) — largest: `/pets/[id]` 177 lines, `/pets/[id]/edit` 101, farm pet create / bulk create 83–86, home 83, pet-tools 78, farm dashboard 74 | §1 | Pending — translation project; suggested order in §11 |
| UI-07 | P2 | `/en/login` heading "เข้าสู่ระบบ" Thai, rest English | screenshot | Pending integration (PR #37 owns `[locale]/login`) |
| UI-08 | P2 | **Missing entity handling differs and is silent**: `/farm/[id]` and `/shops/[id]` redirect to the home page, `/services/[id]` to service-hub, `/p/[id]` "Pet not found", `/pets/[id]` "ไม่พบข้อมูลสัตว์เลี้ยง" | crawl paths | Pending (farm / p in PR #37; shops / services: product decision) |
| UI-09 | P2 | **Load failure shown as an empty / not-found state** (farm-hub "ไม่พบฟาร์มในขณะนี้", `/p/[id]` "Pet not found") — no retry, misleading when the network fails | dummy backend run | Pending (needs an error state per page; `/p/[id]` in PR #37) |
| UI-10 | P2 | Dates forced to `th-TH` (Buddhist year) in 14 call sites and `฿` literals in 9 → wrong on /en | grep | Pending — locale-aware `formatDate` / `formatPrice` helpers |
| UI-11 | P2 | **163 `alert()` + 9 `confirm()`** in 37 files — Thai, browser-styled, cannot be translated or styled | grep | Pending — shared toast + confirm dialog |
| UI-12 | P2 | Global `a { color: inherit }` and `h1/h2/h3 { font-size … }` are **unlayered** → beat Tailwind v4 utilities: colour classes on 12 links (6 files) and size classes on 16 headings never apply (e.g. Navbar "Sign In" renders dark text, not `text-white`) | `globals.css` l.51–55; screenshots | Pending — move base element rules into `@layer base` after a visual review (changes colours / sizes where classes were ignored) |
| UI-13 | P2 | Navbar contrast below WCAG AA: helper text `gray-400`, active `pink-500` on `pink-50`, inactive TH/EN, hover pink, bottom-tab labels `#b0a0a8` / QR `#e84677` at 10 px | axe `color-contrast` | **Fixed** — `gray-500/600`, `pink-700`, `--pink-deep`, `#6f6066`; axe clean desktop + mobile |
| UI-14 | P2 | Overlays without dialog semantics (0 `role="dialog"`; PetQRSheet, BottomNavigation sheets, page modals): no focus trap / Esc | grep | Pending — shared `<dialog>` based component |
| UI-15 | P2 | farm-hub view switch: "ดูสัตว์เลี้ยง" **wraps to two lines at 1440 px**, inactive text 2.5:1, no `aria-pressed`; search box has no label | screenshot | **Fixed** (`white-space: nowrap`, `--ink-soft`, `aria-pressed`, `type="search"` + `aria-label`) |
| UI-16 | P2 | Icon-only buttons without a name: pet-tools back, register-farm avatar camera, pet activity back; register password toggles ×2 | crawl `btnsNoName` | **Fixed** ×3; register ×2 Pending integration (PR #37) |
| UI-17 | P2 | Primary CTA contrast: white on `#e84677` = 3.6:1, on Tailwind `pink-500` ≈ 3.4:1 (< 4.5:1 for normal text) | contrast calc | Pending — design decision (darker CTA `--pink-deep` 5.0:1, or ≥ 18.7 px bold labels) |
| UI-18 | P3 | Tokens bypassed (local `F` palettes, inline `<style>`, 9 radii, ~15 widths, 32 font sizes, 7 button heights) | §2 | Pending — §12 |
| UI-19 | P3 | Two pinks side by side (brand `#e84677` vs Tailwind `pink-500/600`) in header, footer, auth pages | §2 | Pending — map Tailwind `pink` to the brand scale in `@theme` |
| UI-20 | P3 | Tap targets < 32 px on mobile: 1–3 per page (footer links, "log in with email" links) | crawl `small` | Pending (login / register in PR #37) |
| UI-21 | P3 | Unused message keys: `home` 113, `about` 32, `register` 27, `pet` 12, `partner` 9 … | static | Pending — remove after the Explore / PR #37 merges (avoid conflicts now) |
| UI-22 | P3 | Empty / not-found states look different on every page (grey text, emoji, dashed card, plain centred text) | screenshots | Pending — shared `EmptyState` / `ErrorState` |
| UI-23 | P3 | English product words on Thai pages ("Pet Market" heading on farm-hub, "Marketplace") next to Thai menu labels ("ฟาร์มสัตว์เลี้ยง", "เพ็ทช็อป") | screenshots | Pending — product naming decision (may be intentional branding) |

No P1 was found on the pages that could be rendered. Sign-in pages with real data (dashboards, pet management,
admin) could not be exercised without a staging fixture → **Pending Verification**; P1s there cannot be ruled out.

## 4. Thai / English coverage

- Message files: `th` 429 keys = `en` 429 keys; 0 empty, 0 placeholder mismatches, 0 Thai characters in English values
  (`web/tests/i18n-consistency.test.mjs`). Every literal key passed to `t()` exists in both files.
- Pages using the message files: `[locale]/login`, `register`, `p/[id]`, `profile/transfers`,
  `farm-dashboard/[id]/reservations`, `Footer`, and now `Navbar`. Local TH/EN copy: `terms`, `contact`, 404.
- English wording follows platform tone ("Pet farms", "Clinics & services", "Ready for a new home", "Weigh-in"),
  not literal translation. User content (pet / farm / people names, breeds as entered, `pets.status` values,
  knowledge articles, the privacy policy) is **not** machine-translated — articles and the policy need a human
  translation (as already noted in `docs/I18N_STATUS.md`).

## 5. Missing translation keys

None in code that already uses `t()` (the only hit, `reservations.status_`, is a dynamic key prefix — values exist).
Missing are whole areas without keys (UI-06). 33 `nav` keys were added in this branch.

## 6. Hard-coded text

Thai hard-coded UI text: 72 routes (§1); shared components `WorkspaceMembersPanel` (52 lines), `BottomNavigation`
(20), `PetQRSheet` (18), `FarmBottomNav` (18), `DefaultBottomNav` (6), `WorkspaceInvitationsBanner` (2); 163 `alert()`
messages; root metadata. `Footer` and `PageLoader` are clean. English hard-coded in Thai pages: "Pet Market", "Marketplace",
"Pet ID" (brand), "Service" heading on service-hub (UI-23).

## 7. Desktop / mobile

- 0 horizontal overflow and 0 elements past the right edge at 1440 / 768 / 390 / 360 px, TH and EN (all rendered
  pages, before and after the fixes).
- Mobile: bottom tab bar never covers content on the audited pages (`pb-20` on `main`); the floating QR button
  overlaps only the bar itself (intentional).
- UI-15 (wrap at desktop) fixed; tap-target sizes UI-20.
- Long English labels: nav and Explore menu fit at 1440 and in the 390 mobile menu (evidence images).

## 8. Evidence

`docs/audit-evidence/`: `nav-en-desktop-explore-open.png`, `nav-en-mobile-menu-open.png`, `404-en-mobile.png`,
`farm-hub-tabs-desktop.png` (synthetic, no personal data; fonts fall back because Google Fonts is blocked in the
test run). The full crawl (JSON metrics per page × width × language, 175 screenshots) was kept outside the
repository.

## 9. Small fixes made (this branch)

| Finding | Change | Files |
|---|---|---|
| UI-03 | Navbar + mobile menu + bottom tab bar + workspace switcher from `nav.*`; TH/EN buttons get `aria-pressed`, `lang`, a spoken language name (visible "TH"/"EN" kept, WCAG 2.5.3) | `app/components/Navbar.tsx`, `messages/th.json`, `messages/en.json` (33 keys appended inside `nav` only) |
| UI-04 | Language switch keeps `?query` and `#hash`; locale prefix matched as a whole segment | `i18n/navigation.tsx` |
| UI-05 | Branded TH / EN 404 (URL language, bilingual title, noindex); no Thai chrome around the prerendered 404 → no hydration error | `app/not-found.tsx`, `app/_not-found-view/NotFoundView.tsx`, `app/components/RootChrome.tsx` (1 condition) |
| UI-13 | Navbar colours to AA contrast | `app/components/Navbar.tsx` |
| UI-15 | farm-hub view switch no wrap, contrast, `aria-pressed`; search `type="search"` + label | `app/farm-hub/page.tsx` |
| UI-16 | `aria-label` on 3 icon-only buttons | `app/pet-tools/page.tsx`, `app/partner/register-farm/page.tsx`, `app/pets/[id]/activities/create/page.tsx` |

No business logic, data access, auth, RLS or routing rule changed. Lint of every changed file is equal to (or better
than) its `origin/main` baseline (Navbar 14 → 13 problems; the rest unchanged); new files are lint-clean.

## 10. Pending fixes that touch other branches

| Item | Owner | What to do after it lands |
|---|---|---|
| `/en/login` heading Thai (UI-07), small links (UI-20) | PR #37 (`[locale]/login`) | move the heading to `login.*` |
| Register password toggles without name (UI-16) | PR #37 (`register`) | `aria-label` "แสดงรหัสผ่าน / Show password" via `register.*` |
| `/p/[id]` failure shown as "Pet not found" (UI-09), `/farm/[id]` silent redirect (UI-08) | PR #37 | separate error vs not-found states |
| `/pets/[id]` Thai-only (177 lines) + not-found look (UI-06 / UI-22) | PR #33 (Codex) | translate after PR #33 merges |
| Explore `h1` sizes (`text-3xl md:text-4xl`) are overridden by global `h1 { 26px }` (UI-12) | `feat/explore-discovery` | fixed for free by the `@layer base` change, or inline size |
| `messages/*.json` | Explore appends `explore`; this branch appends inside `nav` | **merge simulated** (`git merge-tree` of this branch's messages with `feat/explore-discovery`): clean, result keeps all keys (`nav` 46, `explore` 61, 12 namespaces) |

## 11. Tests

| Test | Result |
|---|---|
| TypeScript `tsc --noEmit` | ✅ 0 errors |
| ESLint, changed files vs `origin/main` baseline | ✅ no new problem (Navbar −1); new files clean |
| `web/tests/i18n-consistency.test.mjs` (key parity, empty values, placeholders, no Thai in EN, used keys exist, Navbar has no hard-coded Thai) | ✅ 6 / 6 |
| `web/e2e/i18n/language.spec.ts` desktop 1440 + mobile 390 (TH→EN→TH, refresh, back / forward, cookie for new tabs + unprefixed links, deep links, no `/en/en`, query kept, public profile language, no raw keys, axe WCAG 2.1 A/AA on the nav, 404) | ✅ 18 / 18; the query test fails on the old `i18n/navigation.tsx` (mutation check) |
| Crawl before / after (1440 / 768 / 390 / 360 × TH / EN) | ✅ after: 0 overflow, 0 raw keys, 0 page errors, `lang` correct after hydration, 36–199 fewer Thai characters per /en page |
| `next build` (dummy env) | ✅ |
| Sign-in pages with real data, visual regression against a reference | ⏳ Pending Verification (needs a staging fixture / approved baseline images) |

Run: `cd web && node --test tests/i18n-consistency.test.mjs` and `npx playwright test -c playwright.i18n.config.ts`.

## 12. Recommendations — one platform look

1. **Tokens first, not a new system**: extend the existing `globals.css` `@theme` with the brand scale
   (`--color-pink-*` mapped to `#e84677` / `--pink-deep`), radius (12 / 18 / 24) and spacing; replace per-page
   `const F` palettes as pages are touched. Move base element rules into `@layer base` (UI-12).
2. **Five shared components** cover most drift: `Button` (primary / secondary / ghost, 44 px), `Card`,
   `Dialog` (native `<dialog>`), `EmptyState` / `ErrorState` (with retry), `Toast` + `confirm` (replaces `alert()`).
3. **Page shell**: one header pattern (title 26/28 px, subtitle, actions) and three container widths (form 640,
   content 960, browse `max-w-6xl`).
4. **i18n**: per-route `generateMetadata`, server `lang` (UI-01), `formatDate` / `formatPrice` helpers, then translate
   in this order: owner pet profile + transfer (after PR #33), pet create / edit / vaccine / weight, profile area,
   home, partner registration, dashboards; articles and privacy policy by a human translator.
5. **CTA contrast**: use `--pink-deep` for filled buttons with small text (UI-17).
