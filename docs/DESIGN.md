# Design System: Simracing Telemetri — SimRacing OS v1.0
**Stitch Project ID:** `5173421882192220650`
**Design system:** Simracing Design System Guide, Racing Series Detailed Analytics
**Layout-underlag:** Season Dashboard (Updated), Series Explorer (Updated), Garage & Inventory (Updated), Purchase Optimizer (Updated)

---

## 1. Visual Theme & Atmosphere

Mörkt, cyberpunk-inspirerat och data-intensivt. Atmosfären är "racing-telemetriprogram möter futuristisk HUD" — tänk cockpit-display i ett Le Mans-prototyp-fordon eller en F1-teamvägg under ett nattlopp. Djup tomsvart bakgrund med neonaccenter som skvaller om systemliv och aktivitet.

- **Bakgrunden** är ett nästan svart kosmiskt djup — void-svart med blå undertone, inte varm kolsvart
- **Primäraccenten** är kall elektrisk cyan — snabb, precision, telemetri
- **Sekundäraccenten** är intensiv magenta — alert-tillstånd, höjdpunkter, kontrast
- **Tertiäraccenten** är bärnstensgul orange — varningar, kostnadsindikatorer
- **Djup** skapas via glassmorfism: frostat glas med `backdrop-blur` + halvtransparenta lager, inte platta ytor
- **Neonglöd** på kanter och text kommunicerar systemstatus — cyan = aktiv/positiv, magenta = fokus/alert
- **Känsla:** Futuristisk kommandocentral. Hög informationsdensitet med neonliv. Data rör sig, kanter glöder, glas reflekterar.

---

## 2. Color Palette & Roles

| Namn | Hex / Värde | Roll |
|------|-------------|------|
| **Void Svart** | `#050614` | Global canvas — djupaste bakgrundsfärg, kosmiskt mörk |
| **Cyber Indigo** | `#121332` | Yt-bakgrund — kort, paneler, sidebar |
| **Natt Indigo** | `#1a1b3b` | Förhöjd yta — modaler, hover-ytor, `rgba(26,27,59,0.8)` |
| **Cyber Kant** | `#2d2e5a` | Kantlinjer och separatorer |
| **Elektrisk Cyan** | `#00ffff` | Primär accent — aktiva tillstånd, positivt status, datahöjdpunkter |
| **Neon Magenta** | `#ff00ff` | Sekundär accent — fokus, alert, interaktiv kontrast |
| **Bärnstensorange** | `#ff8c00` | Tertiär accent — varningar, kostnader, att-uppmärksamma |
| **Cyber Blå** | `#0db9f2` | Informationsfärg — länktext, sekundär data, statusindikator |
| **Cyan glöd** | `rgba(0,255,255,0.3)` | Kantglöd på aktiva element — `box-shadow` neon-effekt |
| **Magenta glöd** | `rgba(255,0,255,0.3)` | Kantglöd på fokuserade element |
| **Glas-yta** | `rgba(24,45,52,0.6)` | Frostat glasskort — primär ytklass `.glass-card` |
| **Cyan tonat glas** | `rgba(0,255,255,0.05)` | Subtil cyan tint på aktiva ytor |
| **Magenta tonat glas** | `rgba(255,0,255,0.05)` | Subtil magenta tint på fokusytor |
| **Neutral yta** | `rgba(255,255,255,0.02)` | Absolut minimal separation, knappt synlig |

---

## 3. Typography Rules

**Typsnitt:**
- **Space Grotesk** — display-font för rubriker, UI-labels och navigering. Geometrisk grotesque med teknisk skärpa.
- **JetBrains Mono** — monospace för all datapresentation: tider, lap-data, kostnadstal, tabellvärden. Programmerarvänlig precision som skapar äkta telemetri-känsla.

**Vikthierarki:**
- Sidtitlar: Space Grotesk, 28–36px, weight 700, ofta med cyan `text-shadow` glow
- Sektionsrubriker: Space Grotesk, 18–22px, weight 600
- Dataetiketter / tabellhuvuden: Space Grotesk eller JetBrains Mono, 11–13px, weight 500, VERSALER + letter-spacing
- Datavärden: JetBrains Mono, 14–16px, weight 400 — alla numeriska värden och lap times
- Brödtext: Space Grotesk, 14px, weight 400
- Nedtonad hjälptext: Space Grotesk, 12px, weight 400, `rgba(255,255,255,0.5)`

**Glow-effekt på rubriker:**
```css
text-shadow: 0 0 10px rgba(13, 185, 242, 0.6);
```

---

## 4. Component Stylings

**Glasskort (`.glass-card`):**
- Bakgrund: `rgba(24, 45, 52, 0.6)` — frostat glas med tydlig halvtransparens
- `backdrop-filter: blur(12px)` — frostar innehållet bakom
- Kant: `1px solid rgba(13, 185, 242, 0.2)` — diskret cyan kantlinje
- Rundning: 4px — nästan kvadratisk, teknisk precision
- Ingen klassisk boxskugga — djup kommuniceras via glaslagret

**Neonkanter:**
- Cyan aktiv: `box-shadow: 0 0 10px rgba(0,255,255,0.3)` + `border: 1px solid rgba(0,255,255,0.5)`
- Magenta fokus: `box-shadow: 0 0 10px rgba(255,0,255,0.3)` + `border: 1px solid rgba(255,0,255,0.5)`
- Analytics djupglow: `inset 0 0 10px rgba(0,255,255,0.1), 0 0 5px rgba(0,255,255,0.1)`

**Glassrader (`.glass-row`):**
- Bakgrund transparent som standard
- Hover: `rgba(0,255,255,0.05)` cyan tint
- Kant-bottom: `1px solid #2d2e5a`
- Transition: `all 0.2s ease`

**Knappar:**
- Primär: cyan bakgrund (`#00ffff`) med void-svart text, 4px rundning, cyan neon-glow vid hover
- Sekundär: transparent bakgrund, cyan kant, cyan text
- Danger/Alert: magenta variant

**Inputs / Sök:**
- Bakgrund: `rgba(18,19,50,0.4)` — mörk halvtransparent
- Kant: `1px solid #2d2e5a`
- Focus: kant byter till cyan + `box-shadow: 0 0 5px rgba(0,255,255,0.3)`
- Platshållartext: `rgba(255,255,255,0.4)`

**Tabellhuvud:**
- Bakgrund: `rgba(18,19,50,0.5)` — mörkare än raderna
- Text: versaler, Space Grotesk, 11px, letter-spacing 0.05em, cyan färgton
- Kant-bottom: cyan linje

**Statusindikator (ägandeskap):**
- Ägd bana: cyan (`#00ffff`) med glöd
- Saknad bana: neutral grå / `rgba(255,255,255,0.2)`
- Gratis (inkluderad): bärnstensorange (`#ff8c00`)
- Alert / dyr: magenta (`#ff00ff`)

**Scrollbar:**
- Bredd: 6px
- Track: `rgba(0,255,255,0.05)` — nästan osynlig
- Thumb: `rgba(0,255,255,0.3)` — halvsynlig cyan

---

## 5. Layout Principles

### Sidstruktur — global shell

Alla vyer delar samma skal: **sticky toppmeny + scrollbart innehållsområde**. Ingen persistent sidebar.

```
┌─────────────────────────────────────────────────────────────┐
│  STICKY  │ Logo/titel  │ Nav-tabs (4–5 st)  │ Ikoner höger │
├──────────┴─────────────────────────────────────────────────┤
│  [sticky filter-/veckorad om relevant för vyn]             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   Scrollbart huvudinnehåll                                 │
│   (varierar per vy — se nedan)                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Footer: session-info / build-metadata / utility-länkar    │
└────────────────────────────────────────────────────────────┘
```

- **Toppmeny:** Horisontell flex, full bredd. Logo/titel vänster, utility-ikoner (varukorg, notis, konto) höger, nav-tabs centrerat eller vänsterjusterat.
- **Nav-tabs:** 4–5 primära destinationer (Dashboard, Series/Optimizer/Garage/Analytics). Aktiv tab markeras med accentfärg.
- **Sekundära tabs:** Vissa vyer har en extra tab-rad direkt under primärnavigationen (t.ex. "Nuvarande säsong | Nästa säsong | Arkiv" i Series Explorer).
- **Footer:** Minimal — bygg-info, serverplats, dokumentationslänkar. Låg visuell tyngd.

---

### Vy-specifika layoutmönster

#### Season Dashboard
```
┌─────────────────────────────────────────────────────┐
│  Sticky toppmeny                                    │
├─────────────────────────────────────────────────────┤
│  Sticky veckoselektor: [W1][W2][W3]...[W9]  flex   │
├──────────────┬──────────────────────────────────────┤
│  Stat-kort   │  Stat-kort                           │
│  (2-kolumn grid)                                    │
├─────────────────────────────────────────────────────┤
│  Race-kort: 2 × 3 grid (6 kort per sida)           │
│  Varje kort: ikon vänster + metadata höger (flex)   │
└─────────────────────────────────────────────────────┘
```
- Veckoselektor sticky under toppmenyn
- 2-kolumns statistikgrid för nyckeltal (totalt lopp / saknade banor)
- Lopp-kort i 2-kolumns grid, konsekvent ikon + title + metadata-struktur

#### Series Explorer
```
┌─────────────────────────────────────────────────────┐
│  Sticky toppmeny  [Dashboard | Series | My Season]  │
│  Sticky sekundärtabs [Nuv. säsong | Nästa | Arkiv]  │
├─────────────────────────────────────────────────────┤
│  Filterrad: "142 serier hittade" | Licens ▼ Kat. ▼ │
├─────────────────────────────────────────────────────┤
│  Seriekort (vertikal lista, enkels-kolumn)          │
│  Varje kort:                                        │
│    [Bild] → [Badge] → [Titel+Undertitel]            │
│    [Schema-ikon + text]  [Grupp-ikon + antal]       │
│    [Lägg till i säsong -knapp]                      │
├─────────────────────────────────────────────────────┤
│  [Ladda fler] -knapp                                │
└─────────────────────────────────────────────────────┘
```
- Enkels-kolumn kortlista med vertikal scrollning
- Filterrad sticky under sekundärtabs
- Varje kort: bild → kategori-badge → titel → metadata-rad → action

#### Garage & Inventory
```
┌─────────────────────────────────────────────────────┐
│  Sticky toppmeny  + sökfält höger                   │
│  3-tab navigator: [Garage][Inventory][Marketplace]  │
├─────────────────────────────────────────────────────┤
│  Åtgärdsrad: [Synka iRacing-data]                  │
├─────────────────────────────────────────────────────┤
│  Tabell (multi-kolumn):                             │
│  Bannamn | Variation | Pris | Senast körd | Status  │
│  (scrollbar lista av rader med ikon + text)         │
├─────────────────────────────────────────────────────┤
│  Sammanfattningspanel: statistik horisontell flex   │
│  [Exportera] -knapp                                 │
└─────────────────────────────────────────────────────┘
```
- Tabellayout (ingen kortgrid) — list-row-mönster med 5 kolumner
- Sökfält i header; synkknapp i åtgärdsrad
- Sammanfattningspanel som footed under tabellen

#### Purchase Optimizer
```
┌─────────────────────────────────────────────────────┐
│  Sticky toppmeny  [Dashboard|Optimizer|Garage|Anal] │
│  Utility-ikoner: varukorg + notiser + konto         │
├─────────────────────────────────────────────────────┤
│  Sidtitel + undertitel (full bredd)                 │
├─────────────────────────────────────────────────────┤
│  Varukorgspanel (enkels-kolumn):                    │
│  3 × produktkort vertikal                           │
│  [Ikon][Namn+ID][ROI-metric][Pris][Ta bort]        │
├─────────────────────────────────────────────────────┤
│  Rabattstatus: horisontell flex med nivåindikator   │
├─────────────────────────────────────────────────────┤
│  Prissammanfattning: delsumma / rabatt / totalt     │
├─────────────────────────────────────────────────────┤
│  Action-knappar: [Gå till iRacing Store][Räkna om] │
├─────────────────────────────────────────────────────┤
│  Utnyttjandematrix: databastabell (säsong-baserad)  │
└─────────────────────────────────────────────────────┘
```
- Vertikal flödes-layout utan grid
- Varukorg som vertikal lista av konsistenta produktkort
- Tydlig separation mellan: lista → rabatt → summering → actions → matrix

---

### App-specifika layoutmönster (bevara från befintlig implementation)

#### Seriewebbläsare — tvåkolumns splittad vy
```
┌─────────────────────────────────────────────────────────────────┐
│  Statistikrad: [Stat][Stat][Stat][Stat]  grid-cols-4            │
├────────────────────────────────────────┬────────────────────────┤
│  Vänster panel  360px  h-[70vh]        │  Höger panel  1fr      │
│  overflow-y-auto                       │  h-[70vh]              │
│                                        │  overflow-y-auto       │
│  Filterkort:                           │                        │
│  [Sök 1fr] [Klassfiltret 220px]        │  Seriedetaljer:        │
│  [Kategoripillar flex-wrap]            │  Badges flex-wrap      │
│                                        │                        │
│  Serielista:                           │  Bilvisu (se nedan)    │
│  Virtualiserade rader space-y-1        │                        │
│                                        │  Schematabell          │
│                                        │  (se nedan)            │
└────────────────────────────────────────┴────────────────────────┘
```
- Layout: `lg:grid-cols-[360px_1fr]`
- Båda paneler: fast höjd `h-[70vh]` med intern scroll
- Filterkort: `md:grid-cols-[1fr_220px]` + `flex flex-wrap gap-2` för kategori-pills

#### Virtualiserad serielista
- Rad-höjd: **96px fast** (`ROW_HEIGHT = 96`)
- Container: `relative` div med beräknat `height: totalHeight`
- Varje rad: `absolute left-0 right-0 flex h-[88px]` med `top` via inline style
- Intern rad-layout: `gap-3 items-start p-3`
  - Checkbox `mt-1 shrink-0` → Content `flex-1 min-w-0` → CarIndicator `shrink-0`
- Content-kolumn: badge-rad (`flex flex-wrap gap-1.5`) + titel (`line-clamp-1`)
- Overscan: 6 rader utanför viewport

#### Veckoobjekt i schemavy — BEVARA
```
┌──────────────────────────────────────┐
│  Veckorad i tabell:                  │
│  ┌──────────────────────────────┐    │
│  │  [W3]  [datum-badge]         │    │  ← inline-flex pill-badges
│  │  Bannamn (text-lg font-semi) │    │
│  │  [signal1][signal2][signal3] │    │  ← flex flex-wrap gap-2.5
│  └──────────────────────────────┘    │
│  [banlängd]  [referens-session]      │
└──────────────────────────────────────┘
```
- Veckokort inuti tabellcell: `rounded-lg border p-2.5` med gradient-bakgrund
- Veckonummerbadge: `inline-flex min-w-7 justify-center rounded-md` (boxformat)
- Datumbadge: `inline-flex items-center gap-1.5 rounded-md`
- Signalbadges: `inline-flex items-center gap-2 rounded-full border px-3 py-1.5` (pill)
- Signalrad: `flex flex-wrap gap-2.5` (horisontell flödeslayout)
- Tabell: `overflow-x-auto` för horisontell scroll

#### Bilmodellvisualisering — BEVARA

**CarBadge** (i seriedetaljpanel):
```
[○ brand-emblem] [Märke text-xs]
                 [Modellnamn truncate]
```
- Container: `inline-flex items-center gap-2 rounded-full border px-3 py-1.5`
- Emblem: `h-8 w-8 shrink-0 rounded-full border` (cirkulär SVG-badge med monogram)
- Text: `flex flex-col leading-none` — märke ovanför, modell under
- Bilgrid i detalj-panel: `flex flex-wrap gap-2` i ett `rounded-lg border bg-bg-elevated/30 p-3`

**CarIndicator** (i serielistarad — kompakt överlappande):
```
[○][○][○] +2
```
- Container: `relative inline-flex items-center gap-0.5`
- Överlappande emblem: `flex -space-x-1.5` (negativt margin skapar stackning)
- Varje emblem: `h-6 w-6 rounded-full border` (mindre än CarBadge)
- Räknare: `ml-0.5 text-[10px]` — t.ex. "+4"
- Popover vid hover: `max-width: 360px`, positioneras absolut under anchor
  - Popover-innehåll: `p-3` + `flex flex-wrap gap-2` med fullstora CarBadges

**BrandEmblem** (SVG, 32×32 viewBox):
- Gradientfylld cirkel + ringkant + centrerad textmonogram
- Renderas som `inline-flex h-5 w-5` (eller h-6/h-8 beroende på kontext)

#### Series Setup Wizard
```
┌─────────────────────────────────────────────────────┐
│  [Titel + undertitel]        [Antal markerade][CTA] │  ← justify-between
├─────────────────────────────────────────────────────┤
│  Kollapsbart filterkort:                            │
│  [Sök 1fr] [Sortering 160px] [Riktning auto]        │
│  [Kategoripillar flex-wrap]                         │
│  [Klasspillar flex-wrap] (villkorlig)               │
├─────────────────────────────────────────────────────┤
│  [X serier]          [Markera alla][Avmarkera alla] │  ← justify-between
├─────────────────────────────────────────────────────┤
│  Virtualiserad lista                                │
│  max-h-[calc(100vh-340px)] min-h-[400px]            │
│  (96px rader, se virtualisering ovan)               │
└─────────────────────────────────────────────────────┘
```
- Max-bredd: `max-w-6xl mx-auto`
- Filter-sökrad: `md:grid-cols-[1fr_160px_auto]`

---

### Gemensamma layoutprinciper

**8px rytm:** Alla spacing-värden är multiplar av 8px (8 / 16 / 24 / 32px). Tabellrader ~40px, kortpadding 16–24px, sektionsmellanrum 32px.

**Glassmorfism-hierarki:** Djup byggs i tre nivåer — void canvas → glas-yta (`backdrop-blur: 12px`) → förhöjt glas (`backdrop-blur: 8px`).

**Sticky-strategi:** Toppmeny alltid sticky. Kontextuella filter-/veckorader sticky per vy när scrollbeteende kräver det.

**Konsekvent kortstruktur:** Ikon/bild → titel + metadata → action. Upprepas i samtliga vyer oavsett om det är grid, lista eller tabellrad.

**Neonliv som tillstånd:** Glödeffekter kommunicerar — inte dekorerar. Cyan = aktiv/positiv, Magenta = fokus/alert, Orange = kostnad/åtgärd.

**Desktop-first:** Minimum 1280px bredd. Horisontell scroll i matrixvyer. Ingen mobilanpassning i MVP.

---

## 6. CSS-klasser och nyckelutility

```css
/* Glassmorfism-yta */
.glass-card {
  background: rgba(24, 45, 52, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(13, 185, 242, 0.2);
  border-radius: 4px;
}

/* Neon-kanter */
.neon-border-cyan {
  border: 1px solid rgba(0, 255, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}
.neon-border-magenta {
  border: 1px solid rgba(255, 0, 255, 0.5);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
}

/* Glödtext */
.glow-text-primary {
  text-shadow: 0 0 10px rgba(13, 185, 242, 0.6);
}

/* Glasrad */
.glass-row {
  border-bottom: 1px solid #2d2e5a;
  transition: all 0.2s ease;
}
.glass-row:hover {
  background: rgba(0, 255, 255, 0.05);
}
```

---

## 7. Tailwind 4 Theme Tokens

Definiera i `app/globals.css` med `@theme`:

```css
@theme {
  /* Bakgrund */
  --color-bg-base: #050614;
  --color-bg-surface: #121332;
  --color-bg-elevated: rgba(26, 27, 59, 0.8);
  --color-bg-glass: rgba(24, 45, 52, 0.6);
  --color-bg-hover: rgba(0, 255, 255, 0.05);

  /* Accenter */
  --color-accent-cyan: #00ffff;       /* Elektrisk Cyan — primär aktiv */
  --color-accent-magenta: #ff00ff;    /* Neon Magenta — fokus/alert */
  --color-accent-orange: #ff8c00;     /* Bärnstensorange — kostnad/varning */
  --color-accent-blue: #0db9f2;       /* Cyber Blå — info/sekundär */

  /* Status */
  --color-status-owned: #00ffff;
  --color-status-missing: rgba(255, 255, 255, 0.20);
  --color-status-free: #ff8c00;
  --color-status-alert: #ff00ff;

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.70);
  --color-text-muted: rgba(255, 255, 255, 0.40);
  --color-text-cyan: #00ffff;

  /* Kanter */
  --color-border: #2d2e5a;
  --color-border-cyan: rgba(13, 185, 242, 0.2);
  --color-border-focus: #00ffff;

  /* Glöd */
  --glow-cyan: 0 0 15px rgba(0, 255, 255, 0.4);
  --glow-magenta: 0 0 15px rgba(255, 0, 255, 0.4);
}

@theme {
  --font-display: 'Space Grotesk', sans-serif;   /* rubriker, UI, labels */
  --font-mono: 'JetBrains Mono', monospace;      /* all data, siffror, tider */
}
```
