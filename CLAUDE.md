# iRacing Season Planner

Plan your season. Save money. Race more.

## What

Web app that helps iRacing members plan which tracks to buy for upcoming seasons by comparing owned content against series schedules, with cost optimization recommendations.

## Stack

- Next.js 16 (App Router, Turbopack, `proxy.ts`)
- React 19.2 (Server Components default, Client Components for interactivity)
- Tailwind CSS 4 (CSS-first config with `@theme`)
- TypeScript
- next-intl (i18n with `[locale]` dynamic segment, EN + SV)
- Drizzle ORM + Turso (LibSQL) for persistence
- Zod for schema validation
- nuqs for URL search param state
- @vercel/analytics + @vercel/speed-insights
- vitest for testing

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — tsc --noEmit
- `pnpm test` — vitest run
- `pnpm db:push` — push schema to Turso
- `pnpm db:studio` — open Drizzle Studio

## Architecture

```
app/
  layout.tsx                          root layout, fonts, analytics
  [locale]/
    layout.tsx                        next-intl provider
    page.tsx                          landing/marketing page
    (auth)/callback/page.tsx          OAuth callback handler
    (app)/                            authenticated route group
      layout.tsx                      app-shell (sidebar + topbar + auth guard)
      setup/page.tsx                  season wizard (4-step, Client Component)
      dashboard/page.tsx              dashboard hub (4 widgets, Server Component)
      dashboard/costs/page.tsx        cost analysis detail
      dashboard/matrix/page.tsx       full track matrix detail
      series/page.tsx                 series browser with schedule viewer
      tracks/page.tsx                 track overview
      settings/page.tsx               user settings
messages/
  en.json                             English translations
  sv.json                             Swedish translations
proxy.ts                              auth guard + locale redirect
lib/
  iracing/                            types, static data, track/car prices, race conditions, season helpers
  auth/                               OAuth helpers (jose), session management
  analysis/                           cost calculator, recommendation engine, content cost analysis
  ownership/                          ownership store (localStorage + useSyncExternalStore), utilities
  db/                                 Drizzle schema, queries, server actions
  season-schedules/                   schedule types and markdown helpers
  series/                             series query utilities
  url.ts                              URL helper
  utils.ts                            cn() via clsx + tailwind-merge
components/
  app-shell.tsx                       sidebar + topbar + mobile drawer layout
  locale-switcher.tsx                 language toggle (EN/SV)
  car-badges.tsx                      car brand emblems and badges
  season-schedule-browser.tsx         two-panel series/schedule explorer
  dashboard/                          dashboard-hub, cost-widget, my-series-widget, matrix-widget, race-conditions-widget, profile-strip, summary-cards, etc.
  wizard/                             wizard-shell (4 steps), series-setup, tracks-step, cars-step, profile-step
  ui/                                 button, card, table, checkbox, input, badge, tooltip, skeleton
```

## Code Style

- Named exports only, no default exports (except page/layout)
- Colocate types with their module in a `types.ts` file
- Zod schemas for API response validation
- Server Components by default; only use `"use client"` when needed for interactivity
- URL search params for client-side filter state (use `nuqs` library)
- No Redux/Zustand — Server Components + URL state + localStorage covers needs

## Key Domain Concepts

Read `docs/DOMAIN.md` for iRacing-specific terminology and data model.

## iRacing API

Read `docs/IRACING_API.md` for endpoint details, auth flow, and known limitations. Note: OAuth integration is not yet active — the app currently uses static data with manual ownership marking.

## Design

Read `docs/DESIGN.md` for visual identity, color tokens, and component patterns.

## Implementation Plan

Read `docs/PLAN.md` for the original phased implementation roadmap (historical — steps 1-9 completed).

## Important

- NEVER expose iRacing OAuth client secret on the client side
- iRacing API integration is not yet active — app uses static season data and manual track/car ownership
- Track ownership data may be incomplete from API — hybrid approach with manual override planned
- Season schedules change only quarterly — cache aggressively when API is connected
- Free tracks (included with membership) must be correctly identified and excluded from cost calculations
