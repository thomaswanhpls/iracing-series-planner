# Wizard UX Redesign — Setup-sidan

**Datum:** 2026-03-15
**Status:** Godkänd

## Sammanfattning

Ersätt den nuvarande 4-stegs wizard-flödet (`/setup`) med en allt-i-ett single-page serieväljare. Wizard-konceptet (StepIndicator, separata steg för säsong/kategorier/klasser/serier) tas bort helt. Filtren läggs som toolbar ovanför serielistan och uppdaterar listan i realtid.

## Problem

- **Förvirrande stegindelning** — fyra separata steg (Säsong → Kategorier → Klasser → Serier) känns otydligt och spretigt
- **Onödiga val** — säsongsväljaren visar bara ett alternativ (2026 S2), ändå krävs ett klick för att gå vidare
- **Ingen tydlig fokus** — summary-panel, steg-indikator och knapprader tar plats utan att ge värde
- **Spretig design** — för många visuella element konkurrerar om uppmärksamheten

## Design

### Layout

Hela `/setup` blir en enda vy med tre vertikala zoner:

1. **Header** — titel, säsongsbeskrivning, antal valda + CTA-knapp
2. **Filterbar** — kategori-chips, klass-pills, sökfält
3. **Serielista** — virtualiserad lista med klickbara rader

### Header

- Rubrik: "Välj dina serier" (JetBrains Mono, 18px, bold)
- Undertext: "2026 Season 2 · Markera serier du vill köra, sen fortsätt till banval."
- Säsongen visas som info-text, inte som eget val (auto-väljs när bara en finns)
- Höger sida: "X valda" badge + "Fortsätt till Banor →" CTA-knapp
- CTA disabled om 0 serier valda

### Filterbar

Kategori-chips och klass-pills i en kompakt filtersektion, separerad med en subtil border-bottom.

**Kategori-chips:**
- Rektangulära chips (border-radius: 8px)
- Aktiv: `bg: rgba(255,106,61,0.1)`, `border: rgba(255,106,61,0.25)`, `color: #ff6a3d`
- Inaktiv: `bg: rgba(22,34,56,0.6)`, `border: rgba(38,53,83,0.8)`, `color: #7d8aa6`
- Alla kategorier aktiva som default
- Klick togglar av/på

**Klass-pills:**
- Runda pills (border-radius: 16px), mindre än kategori-chips
- Samma aktiv/inaktiv-stil som kategorier men mindre
- Filtreras dynamiskt — visar bara klasser som finns i aktiva kategorier
- Ingen klass vald = alla klasser visas (som idag)

**Sökfält:**
- Integrerat i filterraden efter klass-pills, separerat med vertikal divider
- Placeholder: "Sök serie, bil eller bana..."
- Söker i serienamn, klassnamn, bilnamn och bannamn (som idag)

### Serielista

**Räknare och bulk-actions:**
- Vänster: "X serier matchar"
- Höger: "Välj alla" / "Rensa" textlänkar

**Rader:**
- Hela raden klickbar (togglar val)
- Virtualiserad rendering (behåller nuvarande implementering)
- Layout per rad: `[Checkbox] [Serienamn + klass/veckor] [Licens-badge] [Kategori-badge]`

**Vald rad:**
- Checkbox fylld med accent-primary (#ff6a3d)
- `bg: rgba(255,106,61,0.04)`, `border: rgba(255,106,61,0.12)`
- Serienamn i text-primary (#f4f7ff)

**Ovald rad:**
- Tom checkbox med border-color
- `bg: rgba(13,21,35,0.4)`, `border: rgba(38,53,83,0.4)`
- Serienamn i text-secondary (#b5c1d7)

**Kategori-badge (per rad):**
- Neutral för alla kategorier: `bg: rgba(27,51,84,0.5)`, `border: rgba(38,53,83,0.6)`
- Text: #b5c1d7 (vald) / #7d8aa6 (ovald)

### Licensfärger

Eget färgsystem inspirerat av iRacing, mjukat för mörkt tema. Oberoende av appens tema-tokens.

| Licens | Färg | Bakgrund (12%) | Border (22%) |
|--------|------|----------------|--------------|
| R (Rookie) | #d45555 | rgba(200,60,60,0.12) | rgba(200,60,60,0.22) |
| D | #d9a040 | rgba(220,150,40,0.12) | rgba(220,150,40,0.22) |
| C | #d4c645 | rgba(210,190,50,0.12) | rgba(210,190,50,0.22) |
| B | #5cc97a | rgba(60,170,90,0.12) | rgba(60,170,90,0.22) |
| A | #68b0e8 | rgba(70,130,210,0.12) | rgba(70,130,210,0.22) |
| P (Pro) | #a0a0b0 | rgba(180,180,200,0.08) | rgba(180,180,200,0.15) |

Licens-badge visas som compact pill: `padding: 3px 8px`, `border-radius: 4px`, `font-size: 10px`, `font-weight: 600`.

## Vad som tas bort

- `components/wizard/step-indicator.tsx` — steg-indikatorn
- `components/wizard/season-selector.tsx` — säsongsväljaren
- `components/wizard/category-filter.tsx` — separat kategorifilter-steg
- `components/wizard/class-filter.tsx` — separat klassfilter-steg
- `components/wizard/setup-wizard.tsx` — wizard-orkestratorn (ersätts av ny komponent)
- Wizard-stegen i `wizardSteps` array
- `PersistedSetupState.step` — steg-state behövs inte längre
- Summary-panelen (4-kolumns grid med säsong/kategorier/klasser/serier)

## Vad som behålls

- `components/wizard/series-selector.tsx` — serielistan (refaktoreras)
- Virtualiserad rendering (ROW_HEIGHT, VIEWPORT_HEIGHT, OVERSCAN_ROWS)
- URL-params sync (nuqs-mönstret med search, sort, dir)
- localStorage-persistering av valda serier, kategorier, klasser
- Sökfunktionalitet (söker i titel, klass, bilar, banor)
- Sortering (namn, kategori, klass, veckor)
- Bulk-actions (välj alla matchande, rensa matchande, rensa alla)
- Navigation till `/tracks` med query params vid CTA-klick

## Komponentstruktur

### Ny komponent: `SeriesSetup`

Fil: `components/wizard/series-setup.tsx`

```tsx
interface SeriesSetupProps {
  data: SeasonScheduleData
}

export function SeriesSetup({ data }: SeriesSetupProps) { ... }
```

`app/(app)/setup/page.tsx` uppdateras att importera `SeriesSetup` istället för `SetupWizard`.

### State-ägande

`SeriesSetup` äger all state (samma mönster som nuvarande `SetupWizard`):
- `selectedCategoryIds: string[]` — aktiva kategorier
- `selectedClassNames: string[]` — aktiva klasser
- `selectedSeriesIds: string[]` — valda serier
- `search: string` — sökterm
- `sortKey: SortKey` — sorteringsnykel
- `sortAscending: boolean` — sorteringsriktning

Filtrerar `data.series` baserat på kategorier + klasser och skickar filtrerade serier till den interna serielistan. Serielistan renderas direkt i `SeriesSetup` — ingen separat `SeriesSelector`-komponent behövs längre. All logik samlas i en fil.

### Sorteringskontroller

Sorterings-dropdown och riktningsknapp flyttas in i filterbar-sektionen, efter sökfältet. Behåller nuvarande funktionalitet (sortera på namn, kategori, klass, veckor).

### Bulk-actions

"Välj alla" och "Rensa" renderas som `Button variant="ghost"` med `text-xs` — samma mönster som befintliga ghost-knappar i appen.

### Serieradens innehåll

Varje rad visar:
- Serienamn (JetBrains Mono, 13px, bold)
- Under serienamn: klass + antal veckor som inline-text (11px, text-muted)
- Licens-badge med iRacing-färg (höger)
- Kategori-badge neutral (höger)

### Tom-state

När inga serier matchar filtren visas: "Ingen serie matchade filtret." i en `rounded-lg border border-border p-4 text-sm text-text-secondary` container (samma som idag).

## localStorage-migrering

Ny storage key: `series-setup-state-v1`. Den gamla nyckeln `setup-wizard-state-v1` ignoreras — befintlig data degraderar gracefully (nya komponenten läser bara sin egen nyckel). Gammal nyckel rensas inte aktivt.

Ny shape:
```tsx
interface PersistedSetupState {
  season: string
  selectedCategoryIds: string[]
  selectedClassNames: string[]
  selectedSeriesIds: string[]
}
```

Fältet `step` tas bort.

## Vad som ändras

- `setup-wizard.tsx` → ny `series-setup.tsx` komponent utan steg-logik
- `series-selector.tsx` — absorberas in i `series-setup.tsx`, filen kan tas bort
- `app/(app)/setup/page.tsx` — uppdaterad import
- Kategori + klass-filter blir inline i serievyn istället för separata steg
- Säsong auto-väljs och visas som text
- Summary-panel ersätts av compact header med "X valda" + CTA
- Licensbadge läggs till på varje serierad med iRacing-färger

## Filterbar-layout

Horisontell flex-row med `flex-wrap`. Kategori-chips på första raden, klass-pills + sök + sort på andra raden. Minimum viewport 1024px (desktop-first per DESIGN.md).

## Scope

- **In scope:** Setup-sidans UX-redesign
- **Out of scope:** Startsidans design, övriga sidor, nya funktionalitet
