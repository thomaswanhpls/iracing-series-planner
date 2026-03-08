---
name: conventions
description: Kodstil, clean code och best practices för iRacing Season Planner. Använd vid kodgranskning, refaktorisering eller när ny kod skrivs.
---

# Conventions — Kodstil & Clean Code

## Allmänna principer

- **Enkelhet först.** Skriv den enklaste lösningen som löser problemet. Abstrahera först när ett mönster upprepas tre gånger.
- **Läsbarhet framför cleverness.** Koden ska kunna förstås av någon som ser den för första gången.
- **Små funktioner, ett ansvar.** Varje funktion gör en sak.
- **Namngivning är dokumentation.** Undvik förkortningar utom vedertagna (`id`, `url`, `ref`).
- **Inga magiska värden.** Extrahera konstanter med beskrivande namn (`const WEEKS_PER_SEASON = 12`).

## TypeScript

- Strikt mode — inga `any`, `as`-casts enbart vid välmotiverade undantag
- Föredra `interface` för objekt som utökas, `type` för unions och mappade typer
- Colocate typer med sin modul i `types.ts`-filer
- Zod schemas för all API-responsvalidering
- Använd `satisfies` för att typkontrollera utan att tappa literal-typer

## Exports

- **Named exports** överallt — inga default exports (undantag: `page.tsx`, `layout.tsx` som Next.js kräver)

## React-komponenter

- Funktionella komponenter
- Props-interface definieras direkt ovanför komponenten, namnges `<Komponent>Props`
- Destructura props i funktionssignaturen
- Undvik `useEffect` för saker som kan beräknas under renderering
- Event handlers: `handle<Event>` (t.ex. `handleClick`, `handleSeriesSelect`)
- Callback-props: `on<Event>` (t.ex. `onSelect`, `onChange`)
- Formulär: `useActionState` (React 19) istället för `useState` + `onSubmit`

## Styling

- Tailwind CSS 4 med `@theme`-tokens definierade i `globals.css`
- Klasser via `cn()` från `lib/utils.ts` — aldrig inline `style` eller separata CSS-filer
- Gruppera klasser logiskt: layout → spacing → visuellt → interaktivt
- Använd design tokens (`bg-bg-surface`, `text-accent-primary`) — inte hårdkodade färger
- Desktop-first (min 1024px viewport för MVP)

## Filstruktur & organisation

- En komponent per fil — filnamn i kebab-case (`track-cell.tsx`)
- Feature-mappar under `components/` (`dashboard/`, `wizard/`)
- UI-primitiver i `components/ui/`
- Utility-funktioner i `lib/` — hålls rena (inga sidoeffekter)
- Sidor i `app/` importerar från `components/` men innehåller minimal logik

## Import-ordning

1. React / Next.js
2. Tredjepartsbibliotek
3. `@/components/`
4. `@/lib/`
5. Relativa importer (undvik om möjligt — föredra `@/`-alias)

## Kommentarer

- Skriv inte kommentarer som beskriver *vad* koden gör — det ska framgå av koden
- Skriv kommentarer som förklarar *varför* — affärslogik, icke-uppenbara val, workarounds
- TODO-kommentarer med kontext: `// TODO(feature): beskrivning`
