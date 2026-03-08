---
name: architecture
description: Server/client-gränser, state-mönster och arkitekturbeslut för iRacing Season Planner. Använd vid nya features, refaktorisering av state eller komponentstruktur.
---

# Architecture — Server/Client Boundaries & State

## Server vs Client Components

Next.js 16 App Router renderar **Server Components som standard**. Var medveten om gränsen.

### Server Components (standard)

Använd för:
- Layouts (`app/layout.tsx`, `app/(app)/layout.tsx`)
- Dashboard och datatunga sidor — hämta data server-side med `use cache`
- Sidor som renderar statisk struktur och delegerar interaktivitet till child-komponenter

Får **inte** använda: `useState`, `useEffect`, `useContext`, event handlers, browser-API:er.

### Client Components (`'use client'`)

Krävs för:
- Wizard/setup-flöden (formulärstate med `useActionState`)
- Interaktiva element (checkboxar, filter, sökning)
- URL-state via `nuqs` (search params)
- Browser-API:er (`localStorage`, `window`)

### Gränsdragning i praktiken

```
app/layout.tsx                    → Server (theme provider, fonts)
  └── app/(app)/layout.tsx        → Server (sidebar + auth guard)
      ├── dashboard/page.tsx      → Server (data fetch med use cache)
      │   ├── SummaryCards        → Server (beräknad data)
      │   └── Matrix              → Client ('use client' — hover, tooltips, scroll)
      │       └── TrackCell       → Client (onClick, tooltip)
      └── setup/page.tsx          → Server (wrapper)
          └── Wizard              → Client ('use client' — useActionState, steg-logik)
```

**Princip:** Skjut `'use client'`-gränsen så långt ner i trädet som möjligt. Data-hämtning sker i Server Components, interaktivitet i leaf-komponenter.

## Auth Guard

Next.js 16 ersätter `middleware.ts` med `proxy.ts`. Auth-guarden lever där och skyddar `(app)/`-route-gruppen.

## State-hantering

### Hierarki (välj lägsta nivån)

1. **URL search params** (`nuqs`) — filter, sortering, aktiv vy. Delbar och bokmärkbar.
2. **Server state** (`use cache`) — seriedata, scheman, baninfo. Cachelagras per-season.
3. **DB state** (Drizzle + Turso) — ägda banor, valda serier, användarinställningar.
4. **Lokal state** (`useState`) — formulär, wizard-steg, UI-toggle.

### Ingen Redux/Zustand

Server Components + URL state + DB täcker alla behov. Ingen global client-side store.

## Caching-strategi

| Data | Källa | Cache | TTL |
|------|-------|-------|-----|
| Banor, bilar, bilklasser | iRacing API | Redis + `use cache` | 24h+ |
| Säsongsscheman | iRacing API | Redis + `use cache` | 12h |
| Medlemsdata | iRacing API | Redis | 1h |
| Ägda banor | DB + API hybrid | Turso | Persistent |

## Komponentarkitektur

### Målstruktur

```
app/
  layout.tsx                  root layout, theme provider, fonts
  page.tsx                    landing/marketing page
  (auth)/callback/page.tsx    OAuth callback handler
  (app)/                      authenticated route group
    layout.tsx                sidebar + auth guard
    setup/page.tsx            season wizard
    dashboard/page.tsx        track matrix
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

### UI-primitiver (`components/ui/`)

Handskrivna komponenter. Redigera direkt vid behov.
