# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `web/` directory:

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm start        # Start production server
```

No test runner is configured.

## Architecture

**Whiskora** is a Thai-language pet care and breeding platform. The app lives entirely in `web/` as a Next.js App Router project.

### Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** — database (PostgreSQL), auth, and file storage
- **Tailwind CSS v4** (configured via `@tailwindcss/postcss`)
- `react-easy-crop` + `html-to-image` for pet ID card generation

### Key directories
- `web/app/` — all routes (file-based, App Router)
- `web/app/components/` — shared components: `Navbar`, `ScrollToTop`, `BrowserChecker`
- `web/lib/supabase.ts` — Supabase client (browser-side)
- `web/lib/cropImage.ts` — canvas-based image crop utility

### Route structure
| Path | Purpose |
|------|---------|
| `login/`, `register/`, `auth/callback/` | Auth flow (email + Google/Facebook OAuth) |
| `profile/` | User profile, finance, pet list |
| `pets/[id]/` | Pet detail, edit, ID card, vaccines |
| `farm/[id]/` | Public farm profile |
| `farm-dashboard/[id]/` | Private breeder dashboard (pets, litters, births) |
| `farm-hub/` | Pet marketplace browsing |
| `marketplace/` | Shop listings |
| `service-hub/` | Service directory (vet, grooming, etc.) |
| `service-dashboard/[id]/` | Service provider dashboard |
| `shop-dashboard/[id]/` | Shop owner dashboard |
| `partner/` | Partner registration (farm, shop, service) |
| `community/` | Community forum |
| `search/` | Global search |

### Data access pattern (post-refactor)
The project uses a **Service Layer** — all Supabase calls go through `web/services/`, never directly in pages/components.

- `web/types/index.ts` — TypeScript interfaces for all domain models (Pet, Farm, Vaccine, Litter, etc.)
- `web/services/pet.service.ts` — pet CRUD + vaccine queries + photo upload
- `web/services/farm.service.ts` — farm, litter, transactions + `calcFinanceStats`
- `web/services/auth.service.ts` — session/user helpers
- `web/hooks/useAuth.ts` — React hook for current user state
- `web/hooks/usePets.ts` — React hook for fetching user's pets
- `web/middleware.ts` — Next.js middleware that protects `/profile`, `/pets`, `/farm-dashboard`, `/service-dashboard`, `/shop-dashboard`, `/partner` routes via Supabase SSR — no manual redirect needed in those pages

See `web/docs/ARCHITECTURE.md` for the full guide and rules.

### Styling conventions
- Tailwind utility classes for layout and spacing
- Inline `style` objects for dynamic values and animations
- Primary color scheme: pink/rose
- All UI text is in Thai
