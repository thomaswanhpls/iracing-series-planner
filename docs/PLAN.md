# Plan: Bygg om iRacing Season Planner

## Kontext

Projektet har en minimal skeleton (Next.js 16 + React 19 + Tailwind 4) med en enkel dashboard-komponent och hårdkodad data för 2 serier. Målet är att bygga den fullständiga appen enligt docs/DESIGN.md, docs/DOMAIN.md, docs/IRACING_API.md och docs/PLAN.md — med mörkt tema, sidebar-layout, wizard, matris-dashboard, kostnadsanalys och persistence.

**Nyckelval:**
- **npm** (inte pnpm) — projektet har redan package-lock.json
- **Fallback-first** — bygger manuellt läge först, OAuth läggs till när iRacing godkänner registrering
- **Ingen Redis/Turso tidigt** — localStorage + URL-state först, databas i steg 10
- **Statisk data som databackend** — realistisk hårdkodad serie/ban-data tills API finns

---

## Steg 1: Design System Foundation

Applicera dark theme, fonter och tokens så allt ser rätt ut från start.

**Ändra:**
- `app/globals.css` — lägg till fullständigt `@theme`-block (alla färger, fonter från DESIGN.md)
- `app/layout.tsx` — importera JetBrains Mono (next/font/google) + Satoshi (next/font/local med WOFF2 i `public/fonts/`). Sätt `bg-bg-base text-text-primary` på `<body>`
- `lib/utils.ts` — byt cn() till `clsx` + `tailwind-merge`

**Installera:** `clsx`, `tailwind-merge`, `lucide-react`

**Verifiera:** `npm run dev` visar mörk sida med rätt bakgrundsfärg och fonter.

---

## Steg 2: Layout Shell (Sidebar + Topbar + Route Groups)

Etablera app-layouten så alla sidor hamnar i rätt container.

**Skapa:**
- `app/(app)/layout.tsx` — topbar (logo + season selector placeholder + avatar), sidebar (220px, kollapsbar till 56px med lucide-ikoner), `<main>` med flex-1 overflow-auto. `"use client"` för collapse-toggle.
- `app/(app)/dashboard/page.tsx` — flytta nuvarande dashboard hit
- `app/(app)/setup/page.tsx` — stub
- `app/(app)/dashboard/costs/page.tsx` — stub
- `app/(app)/tracks/page.tsx` — stub
- `app/(app)/settings/page.tsx` — stub
- `app/(auth)/callback/page.tsx` — stub
- `proxy.ts` — skeleton (tillåt allt för nu)

**Ändra:**
- `app/page.tsx` — minimal landing page med dark theme, app-namn, "Get Started" → dashboard

**Ta bort:** `app/dashboard/` (ersätts av route group)

**Installera:** `nuqs`

**Verifiera:** Alla routes renderar i sidebar-layouten. Sidebar kollapsar. Navigation fungerar.

---

## Steg 3: UI-komponenter

Styla om primitiver och skapa nya för dark theme.

**Ändra:**
- `components/ui/button.tsx` — varianter: primary (accent-primary), secondary (bg-elevated), ghost
- `components/ui/card.tsx` — bg-surface, border-border, optional accent left-border
- `components/ui/table.tsx` — dark theme med bg-surface header, border-subtle
- `components/ui/checkbox.tsx` — accent-primary checked, border för unchecked

**Skapa:**
- `components/ui/badge.tsx` — pill för license (D/C/B/A) och kategori (Road/Oval)
- `components/ui/tooltip.tsx` — CSS-tooltip, fade-in 100ms
- `components/ui/input.tsx` — textfält i dark theme
- `components/ui/skeleton.tsx` — loading placeholder

**Verifiera:** Alla komponenter ser korrekta ut med dark theme.

---

## Steg 4: Domäntyper + Statisk Data

Definiera TypeScript-modellen och ladda realistisk data utan iRacing API.

**Skapa:**
- `lib/iracing/types.ts` — Track, Car, Series, SeasonSchedule, WeekSchedule, OwnershipStatus, etc. per DOMAIN.md
- `lib/iracing/schemas.ts` — Zod-schemas som matchar typerna
- `lib/iracing/static-data.ts` — 5-8 populära serier med realistiska 12-veckors-scheman, fullständig banlista med free_with_subscription och priser
- `lib/iracing/data-provider.ts` — abstraktionslager: `getSeriesList()`, `getSeasonSchedule()`, `getTrackById()`, `getAllTracks()`. Läser från static-data nu, byter till API senare.

**Installera:** `zod`

**Verifiera:** data-provider returnerar korrekt typade serier och banor.

---

## Steg 5: Ownership State (parallellt med Steg 6)

Låt användare markera ägda banor, sparat i localStorage.

**Skapa:**
- `lib/ownership/store.ts` — `getOwnedTrackIds()`, `setTrackOwned()`, `bulkSetOwned()`, `getOwnershipStatus()`. localStorage med key `iracing-owned-tracks`. Använd `useSyncExternalStore` för reaktivitet.
- `lib/ownership/context.tsx` — React context provider, monteras i `(app)/layout.tsx`
- `lib/ownership/utils.ts` — givet schema + ownership: beräkna owned/missing/free count, 8/12 threshold

**Verifiera:** Toggla track ownership, bekräfta att det persisteras över sidladdning.

---

## Steg 6: Wizard (parallellt med Steg 5)

Setup-wizard för att välja säsong, kategorier och serier.

**Skapa:**
- `components/wizard/step-indicator.tsx` — 3-stegs progressbar
- `components/wizard/season-selector.tsx` — dropdown/knappar
- `components/wizard/category-filter.tsx` — multi-select chips (Road/Oval/Dirt Road/Dirt Oval)
- `components/wizard/series-selector.tsx` — kortgrid med sök, license badge, "X/12 owned" progressbar, checkbox
- `app/(app)/setup/page.tsx` — `"use client"`, komponerar wizard-steg. Sparar valda serier till URL via nuqs. Redirect till /dashboard.

**Verifiera:** Genomför wizard → anländer på dashboard med serier i URL.

---

## Steg 7: Dashboard Matrix (kärnfunktionen)

Track ownership-matrisen — appens centerpiece.

**Skapa:**
- `components/dashboard/matrix.tsx` — grid med serier som rader, W1-W12 som kolumner. Sticky första kolumn + header. Horisontell scroll. Läser serier från URL (nuqs).
- `components/dashboard/track-cell.tsx` — cell med bg-status-owned/missing/free (20% opacity), truncerad track name, ikon om banan finns i 2+ serier, tooltip on hover
- `components/dashboard/summary-cards.tsx` — 3-4 kort: owned/needed, estimated cost, 8/12 threshold count, "best value" track

**Ändra:**
- `app/(app)/dashboard/page.tsx` — komponera SummaryCards + Matrix

**Ta bort:** `components/series-calendar.tsx` (ersatt av matrix)

**Verifiera:** Välj serier i wizard → se matrisen med färgkodade celler. Toggla ownership → färger uppdateras. Sticky headers fungerar.

---

## Steg 8: Track Management (parallellt med Steg 9)

Dedikerad sida för att hantera banägande.

**Ändra:**
- `app/(app)/tracks/page.tsx` — alla banor grupperade per kategori, checkbox per bana, "Mark all free as owned", sök/filter. Använder ownership context.

**Verifiera:** Markera banor → navigera till dashboard → ägande reflekteras.

---

## Steg 9: Kostnadsanalys (parallellt med Steg 8)

Inköpsrekommendationer med greedy set cover.

**Skapa:**
- `lib/analysis/cost.ts` — `getUniqueMissingTracks()`, `applyVolumeDiscount()`, `calculateTotalCost()`, `rankByValue()` (sortera efter cross-series usage), `findMinimumPurchaseSet()` (greedy: välj track med flest serier tills 8/12)
- `lib/analysis/types.ts` — PurchaseRecommendation, CostSummary
- `components/dashboard/cost-table.tsx` — tabell med rekommendationer, checkboxar, löpande total med rabatt

**Ändra:**
- `app/(app)/dashboard/costs/page.tsx` — komponera cost-table + summary

**Verifiera:** Med missing tracks → se prioriterad inköpslista. Volume discount-beräkning korrekt.

---

## Steg 10: Databas (Drizzle + Turso)

Flytta från localStorage till server-side persistence.

**Förutsättning:** Skapa Turso-databas och sätt miljövariabler.

**Skapa:**
- `lib/db/schema.ts` — users, user_owned_tracks, user_selected_series
- `lib/db/index.ts` — Drizzle client för Turso
- `lib/db/queries.ts` — CRUD-funktioner
- `drizzle.config.ts`
- `.env.example`

**Installera:** `drizzle-orm`, `@libsql/client`, `drizzle-kit` (dev)

**Uppdatera:** ownership store och wizard att använda DB för inloggade användare.

---

## Steg 11: Auth Layer

Användaridentitet — anonymous sessions först, OAuth-skeleton redo.

**Skapa:**
- `lib/auth/session.ts` — encrypted cookies via `jose`. Auto-skapa anonym user vid första besök.
- `lib/auth/oauth.ts` — skeleton (kastar "OAuth not configured")
- `app/api/auth/login/route.ts`, `callback/route.ts`, `logout/route.ts`

**Ändra:**
- `proxy.ts` — riktig auth-check: redirect till `/` utan session
- `app/page.tsx` — "Get Started" → `/api/auth/login`

**Installera:** `jose`

**Verifiera:** Första besök på (app)-route → redirect till landing. "Get Started" skapar session → redirect till /setup.

---

## Steg 12: Polish & Deploy

- `app/not-found.tsx`, `app/error.tsx`, `app/(app)/loading.tsx` — felhantering och loading states
- Landing page med hero, features, CTA
- Metadata (title, description, OG-tags)
- `npm run build` + `npm run lint` utan fel

---

## Beroendeflöde

```
1 Design System
  └─ 2 Layout Shell
      └─ 3 UI Components
          └─ 4 Domain Types + Data
              ├─ 5 Ownership (parallellt)
              ├─ 6 Wizard (parallellt)
              │   └─ 7 Dashboard Matrix
              │       ├─ 8 Tracks Page (parallellt)
              │       ├─ 9 Cost Analysis (parallellt)
              │       │   └─ 10 Database
              │       │       └─ 11 Auth
              │       │           └─ 12 Polish
```

## Kritiska filer

| Fil | Varför |
|-----|--------|
| `app/globals.css` | Alla theme tokens — varje visuell komponent beror på dessa |
| `lib/iracing/types.ts` | Domäntyper som alla data-konsumerande komponenter importerar |
| `lib/iracing/static-data.ts` | Realistisk seed-data som gör appen funktionell utan API |
| `lib/iracing/data-provider.ts` | Abstraktion som gör det enkelt att byta från statisk data till API |
| `components/dashboard/matrix.tsx` | Kärnkomponenten — mest komplex UI |
| `app/(app)/layout.tsx` | Sidebar+topbar layout som wrappar alla autentiserade sidor |
