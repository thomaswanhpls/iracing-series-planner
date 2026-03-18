# Implementationsplan — GitHub Issues

## Issue #6 — Bug: TypeError null.trim() + 404 logout

### A. Logout 404 (snabb fix)
**Fil:** `components/app-shell.tsx`

Next.js `<Link>` försöker prefetcha `/api/auth/logout` som en RSC-route, vilket resulterar i `_rsc=...` query-param och 404. Fix: byt till vanlig `<a>`-tagg (full page navigation).

```diff
- <Link href="/api/auth/logout" ...>
+ <a href="/api/auth/logout" ...>
```

### B. Null-safety i series-filter
**Fil:** `components/wizard/series-selector.tsx`

Lägg till null-guards i filterfunktionen och rendering:
- `s.series_name?.toLowerCase()` istället för `s.series_name.toLowerCase()`
- Fallback på tomma strängar innan `.replace()`, `.toUpperCase()`, etc.
- Guard om `schedule` eller `analysis` är null innan `.map()`

---

## Issue #7 — UX: Series selector förbättringar

### A. Klickbar selektionsräknare (visa bara valda)
**Fil:** `components/wizard/series-selector.tsx`

Lägg till `showOnlySelected` boolean state. Knapp bredvid rubriken: `"Valda (N)"` — klick togglar filtret. När aktivt visas bara serier som finns i `selectedSeriesIds`.

### B. Sortering av serielistan
**Fil:** `components/wizard/series-selector.tsx`

Lägg till `sortBy` state ('name' | 'license' | 'owned'). Dropdown direkt ovanför kortgriddet (inte i header). Sorteringsalternativ:
- Namn (A–Ö)
- Licens (Rookie → Pro)
- Ägda banor (flest → minst)

### C. Bil-filter istället för saknat veckorsfilter
**Fil:** `lib/iracing/types.ts`, `lib/iracing/static-data.ts`, `components/wizard/series-selector.tsx`

Lägg till `car_name` på `Series`-typen. Populera i static-data. Lägg till ett bil-filter i series-selector (dropdown eller chips) som filtrerar på bil/klass.

---

## Issue #8 — Inkluerade banor och API för ägt innehåll

### A. Gratis-banor är redan hanterade ✓
Banor med `free_with_subscription: true` får automatiskt status `'free'` i `getOwnershipStatus()` och räknas med i tröskeln. Inget att implementera — kommunicera detta i UI med tydligare etikett (se Issue #9).

### B. iRacing API för ägt innehåll
**Förutsättning:** OAuth-flödet måste vara komplett (väntar på iRacing-godkännande).

**Fil:** `lib/iracing/api-client.ts` (ny), `app/api/iracing/[...]/route.ts` (ny)

När session innehåller `iracingCustomerId`:
1. Anropa `GET /data/member/garage` för att hämta ägda banor och bilar
2. Mappa garage-listan till `trackId[]` och spara i DB via `bulkSetTracksOwned()`
3. Lägg till "Synka med iRacing" knapp i Settings-sidan

---

## Issue #9 — UX: Terminologi, kontrast och navigation

### A. Klargör "Inkl." / gratis-status
**Filer:** `components/dashboard/track-cell.tsx`, `components/dashboard/summary-cards.tsx`

- I tooltip: byt "Gratis med prenumeration" → "Inkluderat i prenumeration (Inkl.)"
- Lägg till en legend/förklaring i dashboardens överkant: tre colored dots med etiketter "Äger", "Inkl.", "Saknas"

### B. Bättre färgkontrast: free vs owned
**Fil:** `app/globals.css`

`status-free` (grön) är för lik `status-owned` (också grön). Byt `status-free` till en distinkt färg — t.ex. blå/cyan (`#4FC3F7`) eller lila, så att:
- `status-owned` = grön (äger)
- `status-free` = blå (inkluderat)
- `status-missing` = röd (saknas)

### C. Tillbaka-knapp i dashboard
**Fil:** `components/dashboard/dashboard-content.tsx`

Befintlig "Ändra serier"-knapp är tillräcklig men inte tillräckligt framträdande. Lägg till en explicit `← Tillbaka till Setup`-länk i dashboardens header, synlig när serier är valda.

---

## Prioritering

| # | Issue | Komplexitet | Prioritet |
|---|-------|-------------|-----------|
| 6A | Logout 404 | Trivial | 1 — nu |
| 6B | Null-safety filter | Liten | 2 — nu |
| 9B | Färgkontrast | Liten | 3 — nu |
| 9A | Klargör "Inkl." | Liten | 4 — nu |
| 9C | Tillbaka-knapp | Liten | 5 — nu |
| 7A | Klickbar räknare | Medium | 6 |
| 7B | Sortering | Medium | 7 |
| 7C | Bil-filter | Medium | 8 |
| 8B | iRacing API sync | Stor | 9 — efter OAuth |
