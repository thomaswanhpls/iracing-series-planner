# iRacing Season Planner

Plan your season. Save money. Race more.

## What

Web app that helps iRacing members plan which tracks to buy for upcoming seasons by comparing owned content against series schedules, with cost optimization recommendations.

## Stack

- Next.js 16 (App Router, Turbopack, Cache Components, `proxy.ts`)
- React 19.2 (Server Components default, Client Components for interactivity)
- Tailwind CSS 4 (CSS-first config with `@theme`)
- TypeScript strict mode
- Drizzle ORM + Turso (LibSQL) for persistence
- Upstash Redis for caching + rate limiting
- iRacing Data API via OAuth2 Authorization Code Flow

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — eslint + tsc --noEmit
- `pnpm db:push` — push schema to Turso
- `pnpm db:studio` — open Drizzle Studio

## Architecture

```
app/
  layout.tsx                  root layout, theme provider, fonts
  page.tsx                    landing/marketing page
  (auth)/callback/page.tsx    OAuth callback handler
  (app)/                      authenticated route group
    layout.tsx                sidebar + auth guard
    setup/page.tsx            season wizard (Client Component)
    dashboard/page.tsx        track matrix (Server Component)
    dashboard/costs/page.tsx  cost analysis
    tracks/page.tsx           track overview
    settings/page.tsx         user settings
  api/auth/[...]/route.ts     OAuth routes
  api/iracing/[...]/route.ts  iRacing API proxy
lib/
  iracing/                    API client, types, response schemas
  auth/                       OAuth helpers, session management
  analysis/                   cost calculator, recommendation engine
components/
  dashboard/                  Matrix, TrackCell, SummaryCard
  wizard/                     StepIndicator, SeriesSelector, CategoryFilter
  ui/                         shared primitives (Button, Card, Tooltip)
proxy.ts                      auth guard (replaces middleware.ts in Next 16)
```

## Code Style

- Named exports only, no default exports (except page/layout)
- Colocate types with their module in a `types.ts` file
- Zod schemas for all API response validation
- Server Components by default; only use `"use client"` when needed for interactivity
- `use cache` directive for data that changes per-season (tracks, series, schedules)
- URL search params for client-side filter state (use `nuqs` library)
- No Redux/Zustand — Server Components + URL state covers needs

## Key Domain Concepts

Read `docs/DOMAIN.md` for iRacing-specific terminology and data model.

## iRacing API

Read `docs/IRACING_API.md` for endpoint details, auth flow, and known limitations.

## Design

Read `docs/DESIGN.md` for visual identity, color tokens, and component patterns.

## Implementation Plan

Read `docs/PLAN.md` for phased implementation roadmap.

## Important

- NEVER expose iRacing OAuth client secret on the client side
- iRacing API is rate limited — always go through the cache layer in `lib/iracing/`
- Track ownership data may be incomplete from API — hybrid approach with manual override
- Season schedules change only quarterly — cache aggressively with `use cache`
- Free tracks (included with membership) must be correctly identified and excluded from cost calculations
