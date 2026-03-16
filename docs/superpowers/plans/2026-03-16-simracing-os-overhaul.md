# SimRacing OS Visual Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the orange/teal design system with the SimRacing OS aesthetic: void-dark backgrounds, neon cyan/magenta accents, glassmorphism — across the app shell, setup wizard, and all UI primitives.

**Architecture:** Foundation-first — tokens first, then primitives (badge → button → input → checkbox → card), then shell, then wizard. One focused commit per file. No automated tests (visual components only). Verify each task with `pnpm lint`, then spot-check in browser. Start dev server once after Task 9 for full visual review.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4 (CSS-first `@theme`), TypeScript strict, Space Grotesk (display) + JetBrains Mono (mono) fonts, Lucide icons.

---

## Chunk 1: Foundation

### Task 1: Font Remapping (`app/layout.tsx`)

**Files:**
- Modify: `app/layout.tsx`

Replace `JetBrains_Mono` as `--font-display` and `DM_Sans` as `--font-body` with `Space_Grotesk` → `--font-display` and `JetBrains_Mono` → `--font-mono`. Body class changes from `font-body` to `font-display`. Remove `--font-body` entirely.

Current state: `JetBrains_Mono` uses `variable: '--font-display'`, `DM_Sans` uses `variable: '--font-body'`, body uses `font-body`.

- [ ] **Step 1: Apply font remapping**

Replace the entire file with:

```ts
import './globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'iRacing Season Planner',
    template: '%s | iRacing Season Planner',
  },
  description: 'Planera din iRacing-säsong. Optimera inköp av banor och maximera ditt deltagande.',
  openGraph: {
    title: 'iRacing Season Planner',
    description: 'Planera din iRacing-säsong. Optimera inköp av banor och maximera ditt deltagande.',
    type: 'website',
    locale: 'sv_SE',
    siteName: 'iRacing Season Planner',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg-base font-display text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: remap fonts — Space Grotesk as display, JetBrains Mono as mono, drop DM Sans"
```

---

### Task 2: Token Replacement (`app/globals.css`)

**Files:**
- Modify: `app/globals.css`

Replace the entire `@theme` block with new SimRacing OS tokens. Simplify html/body backgrounds to flat `#050614`. Add `.shell` CSS class with the nebula radial gradient (applied to AppShell's root div in Task 9). Update scrollbar thumb to cyan. Preserve all `@keyframes` and `.stagger-children` utility.

- [ ] **Step 1: Replace globals.css**

Replace the entire file with:

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg-base: #050614;
  --color-bg-surface: #121332;
  --color-bg-elevated: rgba(26, 27, 59, 0.8);
  --color-bg-glass: rgba(24, 45, 52, 0.6);
  --color-bg-hover: rgba(0, 255, 255, 0.05);

  /* Accents — solid hex so Tailwind /opacity modifiers work */
  --color-accent-cyan: #00ffff;
  --color-accent-magenta: #ff00ff;
  --color-accent-orange: #ff8c00;
  --color-accent-blue: #0db9f2;

  /* Status */
  --color-status-owned: rgba(0, 255, 255, 0.15);
  --color-status-missing: rgba(255, 255, 255, 0.06);
  --color-status-free: rgba(255, 140, 0, 0.15);
  --color-status-alert: rgba(255, 0, 255, 0.15);

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.70);
  --color-text-muted: rgba(255, 255, 255, 0.35);

  /* Borders — solid hex for modifier compatibility */
  --color-border: #2d2e5a;
  --color-border-subtle: #0d294a;
  --color-border-focus: #00ffff;

  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Animations */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-slide-left: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-glow-pulse: glow-pulse 3s ease-in-out infinite;
  --animate-shimmer: shimmer 2s linear infinite;
  --animate-float: float 6s ease-in-out infinite;
}

:root {
  color-scheme: dark;
}

html {
  background: #050614;
}

body {
  background: #050614;
}

/* App shell root — nebula radial gradient background */
.shell {
  background:
    radial-gradient(ellipse at 15% 40%, rgba(13, 185, 242, 0.07) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 15%, rgba(255, 0, 255, 0.05) 0%, transparent 45%),
    #050614;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-left {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes grid-fade {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

/* Stagger animation for children */
.stagger-children > * {
  animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 60ms; }
.stagger-children > *:nth-child(3) { animation-delay: 120ms; }
.stagger-children > *:nth-child(4) { animation-delay: 180ms; }
.stagger-children > *:nth-child(5) { animation-delay: 240ms; }
.stagger-children > *:nth-child(6) { animation-delay: 300ms; }
.stagger-children > *:nth-child(7) { animation-delay: 360ms; }
.stagger-children > *:nth-child(8) { animation-delay: 420ms; }

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.4);
}

/* Selection */
::selection {
  background: rgba(0, 255, 255, 0.2);
  color: #ffffff;
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace design tokens with SimRacing OS palette and nebula shell gradient"
```

---

## Chunk 2: Primitives

### Task 3: Badge (`components/ui/badge.tsx`)

**Files:**
- Modify: `components/ui/badge.tsx`

Replace base shape (`rounded-full px-2.5 py-1`) with `font-mono rounded-sm px-2 py-0.5 border whitespace-nowrap`. All 11 variant styles switch from Tailwind color utilities to inline `style` prop for rgba backgrounds and border colors (rgba-defined tokens cannot use Tailwind's `/N` opacity modifier). Text color uses Tailwind arbitrary values.

- [ ] **Step 1: Rewrite badge.tsx**

Replace the entire file with:

```tsx
import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'road' | 'oval' | 'dirt-road' | 'dirt-oval' | 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

type VariantStyle = { textClass: string; bg: string; borderColor: string }

const variantStyles: Record<BadgeVariant, VariantStyle> = {
  default:     { textClass: 'text-text-muted',    bg: 'rgba(255,255,255,0.05)',  borderColor: '#2d2e5a' },
  road:        { textClass: 'text-[#0db9f2]',     bg: 'rgba(13,185,242,0.12)',  borderColor: 'rgba(13,185,242,0.25)' },
  oval:        { textClass: 'text-[#ff8c00]',     bg: 'rgba(255,140,0,0.12)',   borderColor: 'rgba(255,140,0,0.25)' },
  'dirt-road': { textClass: 'text-[#ff7020]',     bg: 'rgba(255,100,0,0.10)',   borderColor: 'rgba(255,100,0,0.20)' },
  'dirt-oval': { textClass: 'text-[#ff7020]',     bg: 'rgba(255,100,0,0.10)',   borderColor: 'rgba(255,100,0,0.20)' },
  rookie:      { textClass: 'text-[#ff5050]',     bg: 'rgba(255,60,60,0.12)',   borderColor: 'rgba(255,60,60,0.25)' },
  d:           { textClass: 'text-[#ff6020]',     bg: 'rgba(255,80,0,0.12)',    borderColor: 'rgba(255,80,0,0.25)' },
  c:           { textClass: 'text-[#e8a800]',     bg: 'rgba(255,180,0,0.12)',   borderColor: 'rgba(255,180,0,0.25)' },
  b:           { textClass: 'text-[#44cc44]',     bg: 'rgba(80,200,80,0.12)',   borderColor: 'rgba(80,200,80,0.25)' },
  a:           { textClass: 'text-[#0090ff]',     bg: 'rgba(0,160,255,0.12)',   borderColor: 'rgba(0,160,255,0.25)' },
  pro:         { textClass: 'text-[#cc44ff]',     bg: 'rgba(200,80,255,0.12)',  borderColor: 'rgba(200,80,255,0.25)' },
}

export function Badge({ className, variant = 'default', style, ...props }: BadgeProps) {
  const v = variantStyles[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[11px] font-medium rounded-sm px-2 py-0.5 border whitespace-nowrap',
        v.textClass,
        className
      )}
      style={{ background: v.bg, borderColor: v.borderColor, ...style }}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "feat: rewrite Badge — font-mono rounded-sm, 11 neon rgba variants"
```

---

### Task 4: Button (`components/ui/button.tsx`)

**Files:**
- Modify: `components/ui/button.tsx`

Replace orange gradient primary with flat cyan + neon glow. Secondary becomes transparent with `border-border`. Ghost is text-only. Base drops `rounded-lg` for `rounded-sm`. Remove `px-4 py-2 text-sm` from base — each variant carries its own sizing.

- [ ] **Step 1: Rewrite button.tsx**

Replace the entire file with:

```tsx
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-cyan text-bg-base font-display font-bold rounded-sm px-5 py-2.5 text-[13px] shadow-[0_0_18px_rgba(0,255,255,0.35)] hover:shadow-[0_0_24px_rgba(0,255,255,0.5)] active:scale-[0.98]',
  secondary:
    'border border-border text-text-secondary rounded-sm px-5 py-2.5 text-[13px] hover:bg-bg-hover hover:text-text-primary',
  ghost:
    'text-text-secondary text-[13px] hover:text-text-primary hover:bg-white/[0.03] rounded-sm',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-display transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat: rewrite Button — cyan primary with glow, transparent secondary, ghost"
```

---

### Task 5: Input (`components/ui/input.tsx`)

**Files:**
- Modify: `components/ui/input.tsx`

Replace dark gradient bg with glassmorphic `bg-white/[0.04]`. `rounded-md` → `rounded-sm`. Focus ring changes from teal to `border-border-focus` (cyan) with a `5px` glow. Padding increases to `px-4 py-[10px]` to match spec. Text size is explicit `text-[14px]`.

- [ ] **Step 1: Rewrite input.tsx**

Replace the entire file with:

```tsx
import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-sm border border-border bg-white/[0.04] px-4 py-[10px] font-display text-[14px] text-text-secondary placeholder:text-text-muted transition-[border-color,box-shadow] focus:border-border-focus focus:shadow-[0_0_5px_rgba(0,255,255,0.3)] focus:outline-none',
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/input.tsx
git commit -m "feat: rewrite Input — glassmorphic bg, cyan focus glow"
```

---

### Task 6: Checkbox (`components/ui/checkbox.tsx`)

**Files:**
- Modify: `components/ui/checkbox.tsx`

Replace native `<input type="checkbox">` with a custom `<button role="checkbox">`. Native inputs cannot produce `box-shadow` glow on check state. The new element uses a `Check` icon (Lucide) inside when checked. Preserves the prop API used by `series-setup.tsx`: `checked`, `readOnly`, `onClick`, `className`.

> **Prop API note:** `series-setup.tsx` calls `<Checkbox checked={selected} readOnly className="mt-1 shrink-0" onClick={(e) => e.stopPropagation()} />`. The new signature handles this exactly: `onClick` fires on the button, `readOnly` suppresses the internal `onChange` call.

- [ ] **Step 1: Rewrite checkbox.tsx**

Replace the entire file with:

```tsx
'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  readOnly?: boolean
  className?: string
}

export function Checkbox({ checked, onChange, onClick, readOnly, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        onClick?.(e)
        if (!readOnly) onChange?.(!checked)
      }}
      className={cn(
        'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-150',
        checked
          ? 'border-accent-cyan bg-accent-cyan shadow-[0_0_8px_rgba(0,255,255,0.45)]'
          : 'border-white/20 bg-transparent',
        className
      )}
    >
      {checked && <Check className="h-3 w-3 text-bg-base stroke-[3]" />}
    </button>
  )
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/checkbox.tsx
git commit -m "feat: rewrite Checkbox as custom button element for neon glow support"
```

---

### Task 7: Card (`components/ui/card.tsx`)

**Files:**
- Modify: `components/ui/card.tsx`

Replace gradient bg + `rounded-xl` with `bg-bg-glass backdrop-blur-md rounded-lg`. Add `before:` pseudo-element top accent line (cyan gradient, visible on hover + `data-selected`). Remove `accent` and `glow` props — not used by any in-scope component in phase 1. Add `relative` to base class (required for `before:absolute` positioning).

- [ ] **Step 1: Rewrite card.tsx**

Replace the entire file with:

```tsx
import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  'data-selected'?: boolean
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-bg-glass backdrop-blur-md border border-border-subtle rounded-lg overflow-hidden',
        'before:absolute before:top-0 before:inset-x-0 before:h-px before:content-[""]',
        'before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,255,0.5)_35%,rgba(13,185,242,0.2)_65%,transparent_100%)]',
        'before:opacity-0 before:transition-opacity hover:before:opacity-100',
        'data-[selected=true]:border-accent-cyan/30 data-[selected=true]:bg-accent-cyan/[0.07] data-[selected=true]:before:opacity-100',
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Remove accent/glow props from all callers**

The `accent` and `glow` props are removed from the Card interface. TypeScript strict mode will cause `pnpm lint` to fail if any file still passes these props to `<Card>`. Find all callers:

Run: `grep -r "accent=" components/ app/ --include="*.tsx" | grep -v "card.tsx"`

Expected callers (based on current codebase): `components/dashboard/summary-cards.tsx` and `components/dashboard/cost-table.tsx`. Remove the `accent` and `glow` props from those JSX call sites. Do not change any other logic — just delete the prop attributes. Example:

```tsx
// Before
<Card accent="owned" glow>

// After
<Card>
```

After removing props, re-run grep to confirm zero results, then proceed to lint.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/card.tsx components/dashboard/
git commit -m "feat: rewrite Card — glass bg, before: top accent line, remove accent/glow props from callers"
```

---

## Chunk 3: Shell + Wizard

### Task 8: Car Badges (`components/car-badges.tsx`)

**Files:**
- Modify: `components/car-badges.tsx`

Color token updates only — SVG structure and layout are preserved. Two targeted changes in `car-badges.tsx`: `CarBadge` container border and emblem circle border. (`CarIndicator` only exists in `series-setup.tsx`, not here — its tokens are updated in Task 10.)

- [ ] **Step 1: Update CarBadge container border**

Find and replace in `CarBadge` component, the container `<span>` className:

Old:
```
'inline-flex items-center gap-2 rounded-full border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
```
New:
```
'inline-flex items-center gap-2 rounded-full border border-border-subtle bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] text-text-primary hover:border-accent-cyan/30'
```

- [ ] **Step 2: Update CarBadge emblem circle border**

Find and replace in `CarBadge`, the emblem host `<span>` className:

Old:
```
'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-black/35'
```
New:
```
'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-black/35'
```

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/car-badges.tsx
git commit -m "feat: update car-badges token references to SimRacing OS palette"
```

---

### Task 9: App Shell (`components/app-shell.tsx`)

**Files:**
- Modify: `components/app-shell.tsx`

Full visual redesign preserving all logic. Key changes:
- Add `shell` class to root div (picks up nebula gradient from globals.css)
- Sidebar: `w-[220px]` → `w-[240px]`, dark fade gradient via inline style, `border-border`
- Logo: Trophy icon → "iRacing **SP**" wordmark with cyan "SP" + mono season tag (hidden when collapsed)
- Nav: regrouped into "Planering" (Setup, Seriescheman, Matris) and "Analys" (Banor, Kostnader, Inställningar); group labels as mono caps; `w-14` collapsed shows icon only; active item uses cyan bg tint + absolute span with gradient left indicator
- User footer: initials avatar from `userId` (no iRating this phase)
- Topbar: `h-14` → `h-16`; removes gradient circle avatar, retains season badge + flow stepper + focus mode toggle
- Preserved: `collapsed`, `emphasizeFocusFlow`, `seasonBadge`, `seriesParam` URL forwarding, `focusModeActive` opacity dimming

- [ ] **Step 1: Rewrite app-shell.tsx**

Replace the entire file with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Compass,
  MapPin,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OwnershipProvider } from '@/lib/ownership/context'

const planningSteps = [
  { key: 'setup', label: 'Setup', href: '/setup' },
  { key: 'tracks', label: 'Banor', href: '/tracks' },
  { key: 'costs', label: 'Kostnad', href: '/dashboard/costs' },
] as const

interface AppShellProps {
  children: React.ReactNode
  userId: string
  initialOwnedTrackIds: number[]
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: 'planering' | 'analys'
}

const navItems: NavItem[] = [
  { href: '/setup',           label: 'Setup',        icon: Compass,          group: 'planering' },
  { href: '/series',          label: 'Seriescheman', icon: CalendarDays,     group: 'planering' },
  { href: '/dashboard',       label: 'Matris',       icon: LayoutDashboard,  group: 'planering' },
  { href: '/tracks',          label: 'Banor',        icon: MapPin,           group: 'analys' },
  { href: '/dashboard/costs', label: 'Kostnader',    icon: DollarSign,       group: 'analys' },
  { href: '/settings',        label: 'Inställningar',icon: Settings,         group: 'analys' },
]

const navGroups: { key: 'planering' | 'analys'; label: string }[] = [
  { key: 'planering', label: 'Planering' },
  { key: 'analys',    label: 'Analys' },
]

function getInitials(userId: string): string {
  return userId.slice(0, 2).toUpperCase()
}

export function AppShell({ children, userId, initialOwnedTrackIds }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [emphasizeFocusFlow, setEmphasizeFocusFlow] = useState(true)
  const [seasonBadge, setSeasonBadge] = useState('2026 S2')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const seriesParam = searchParams.get('series')
  const navShouldCarrySeries = new Set(['/tracks', '/series', '/dashboard', '/dashboard/costs'])

  const flowStep = (() => {
    if (pathname.startsWith('/setup')) return 'setup'
    if (pathname.startsWith('/tracks')) return 'tracks'
    if (pathname.startsWith('/dashboard/costs')) return 'costs'
    return null
  })()
  const isPrimaryFlowRoute =
    pathname.startsWith('/setup') ||
    pathname.startsWith('/tracks') ||
    pathname.startsWith('/dashboard/costs')
  const hasReachedCostStep = pathname.startsWith('/dashboard/costs')
  const focusModeActive = isPrimaryFlowRoute && !hasReachedCostStep && emphasizeFocusFlow

  useEffect(() => {
    const querySeason = searchParams.get('season')
    if (querySeason) {
      const normalized = querySeason.replace('-', ' S').toUpperCase()
      setSeasonBadge(normalized)
      localStorage.setItem('planner-season', normalized)
      return
    }
    const storedSeason = localStorage.getItem('planner-season')
    if (storedSeason) setSeasonBadge(storedSeason)
  }, [searchParams])

  return (
    <OwnershipProvider userId={userId} initialOwnedTrackIds={initialOwnedTrackIds}>
      <div className="shell flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'relative flex flex-col border-r border-border transition-[width] duration-300 ease-out',
            collapsed ? 'w-14' : 'w-[240px]'
          )}
          style={{ background: 'linear-gradient(180deg, #1a1b3b 0%, #121332 100%)' }}
        >
          {/* Logo */}
          <div className={cn(
            'border-b border-white/[0.06]',
            collapsed ? 'flex items-center justify-center px-3 pt-5 pb-4' : 'px-6 pt-8 pb-6'
          )}>
            {collapsed ? (
              <span className="font-display text-[17px] font-bold text-accent-cyan">S</span>
            ) : (
              <>
                <div className="font-display text-[17px] font-bold text-text-primary">
                  iRacing <span className="text-accent-cyan">SP</span>
                </div>
                <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest mt-1.5">
                  {seasonBadge}
                </div>
              </>
            )}
          </div>

          {/* Nav groups */}
          <nav className="relative flex-1 overflow-y-auto py-2">
            {navGroups.map(({ key, label }) => {
              const groupItems = navItems.filter((item) => item.group === key)
              return (
                <div key={key}>
                  {!collapsed && (
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/20 px-6 pt-4 pb-2">
                      {label}
                    </div>
                  )}
                  {groupItems.map(({ href, label: itemLabel, group }) => {
                    const Icon = navItems.find((n) => n.href === href)!.icon
                    const active = pathname === href || pathname.startsWith(href + '/')
                    const navHref =
                      seriesParam && navShouldCarrySeries.has(href)
                        ? `${href}?series=${seriesParam}`
                        : href
                    const isAnalys = group === 'analys'
                    return (
                      <Link
                        key={href}
                        href={navHref}
                        className={cn(
                          'relative flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-colors duration-200',
                          active
                            ? 'text-white bg-accent-cyan/[0.06]'
                            : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03]',
                          focusModeActive && isAnalys && 'opacity-60'
                        )}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-0.5"
                            style={{
                              background:
                                'linear-gradient(180deg, transparent, #00ffff 40%, #00ffff 60%, transparent)',
                            }}
                          />
                        )}
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            active ? 'opacity-100 text-accent-cyan' : 'opacity-55'
                          )}
                        />
                        {!collapsed && <span>{itemLabel}</span>}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
            {focusModeActive && !collapsed && (
              <div className="mx-4 mt-2 rounded-md border border-border/60 bg-white/[0.02] px-3 py-2 text-[11px] text-text-muted">
                Fokusläge: valfria vyer är tillfälligt dolda.
              </div>
            )}
          </nav>

          {/* User footer */}
          <div className={cn(
            'border-t border-white/[0.06]',
            collapsed ? 'flex items-center justify-center px-3 py-4' : 'px-6 py-5'
          )}>
            {collapsed ? (
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-accent-cyan/20 bg-bg-elevated font-mono text-[11px] font-bold text-accent-cyan">
                {getInitials(userId)}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-accent-cyan/20 bg-bg-elevated font-mono text-[11px] font-bold text-accent-cyan">
                  {getInitials(userId)}
                </div>
                <span className="text-[13px] font-semibold text-white/80 truncate">{userId}</span>
              </div>
            )}
          </div>

          {/* Logout */}
          <Link
            href="/api/auth/logout"
            className="relative flex h-10 items-center justify-center gap-2 border-t border-white/[0.06] text-text-muted hover:text-text-primary transition-colors px-3"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs">Logga ut</span>}
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="relative flex h-10 items-center justify-center border-t border-white/[0.06] text-text-muted hover:text-text-primary transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="relative flex h-16 items-center justify-between border-b border-white/[0.06] px-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-border bg-[rgba(26,27,59,0.4)] px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-glow-pulse" />
                <span className="font-mono text-[11px] text-text-muted uppercase tracking-[0.06em]">
                  {seasonBadge}
                </span>
              </div>
              {flowStep && (
                <div className="hidden items-center gap-1 rounded-full border border-border bg-[rgba(26,27,59,0.32)] px-2 py-1 md:flex">
                  {planningSteps.map((step, index) => {
                    const active = flowStep === step.key
                    const href = seriesParam ? `${step.href}?series=${seriesParam}` : step.href
                    return (
                      <div key={step.key} className="flex items-center gap-1">
                        <Link
                          href={href}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                            active
                              ? 'bg-accent-cyan/15 text-text-primary'
                              : 'text-text-muted hover:text-text-primary'
                          )}
                        >
                          {step.label}
                        </Link>
                        {index < planningSteps.length - 1 && (
                          <span className="px-0.5 text-[10px] text-text-muted">→</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isPrimaryFlowRoute && !hasReachedCostStep && (
                <button
                  type="button"
                  onClick={() => setEmphasizeFocusFlow((value) => !value)}
                  className="rounded-full border border-border bg-[rgba(26,27,59,0.32)] px-3 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  {emphasizeFocusFlow ? 'Visa alla vyer lika tydligt' : 'Betona fokussteg'}
                </button>
              )}
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </OwnershipProvider>
  )
}
```

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/app-shell.tsx
git commit -m "feat: redesign AppShell — dark gradient sidebar, grouped nav, cyan indicators, user footer"
```

---

### Task 10: Setup Wizard (`components/wizard/series-setup.tsx`)

**Files:**
- Modify: `components/wizard/series-setup.tsx`

Token updates + `ROW_HEIGHT` synchronization. **Critical:** `ROW_HEIGHT` constant and `h-[100px]` on the series row `<button>` must be changed in the same edit — the constant drives `totalHeight`, `visibleStartIndex`, `visibleEndIndex`, and the `top` inline style. A mismatch causes rows to overlap or leave gaps.

All `accent-primary` token references are replaced with `accent-cyan`. All `accent-secondary` token references in class pills are replaced with `accent-cyan`.

- [ ] **Step 1: Update ROW_HEIGHT constant (line 30)**

Change:
```ts
const ROW_HEIGHT = 96
```
To:
```ts
const ROW_HEIGHT = 100
```

- [ ] **Step 2: Update series row height + padding + gap**

Change the series row `<button>` className (the `h-[88px] gap-3 p-3` portion):

Old className segment:
```
'absolute left-0 right-0 flex h-[88px] cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150'
```
New:
```
'absolute left-0 right-0 flex h-[100px] cursor-pointer items-start gap-[14px] rounded-lg border p-[14px_16px] text-left transition-all duration-150'
```

- [ ] **Step 3: Update row selected/unselected state colors**

Change:
```
selected
  ? 'border-accent-primary bg-accent-primary/10'
  : 'border-transparent hover:border-border hover:bg-bg-elevated/40'
```
To:
```
selected
  ? 'border-accent-cyan/30 bg-accent-cyan/[0.07]'
  : 'border-transparent hover:border-border hover:bg-white/[0.03]'
```

- [ ] **Step 4: Update series title text style**

Change:
```
'font-display text-sm font-semibold text-text-primary line-clamp-1'
```
To:
```
'font-display text-[15px] font-semibold text-text-primary tracking-[-0.01em] line-clamp-1'
```

- [ ] **Step 5: Update header count badge**

Change (in the header `<div>` at top of return):
```
'px-3 py-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-accent-primary text-xs font-display font-semibold'
```
To:
```
'px-3 py-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan text-xs font-display font-semibold'
```

- [ ] **Step 6: Update filter "Aktiva" indicator badge**

Change (inside the collapsible filter toggle button):
```
'rounded-full bg-accent-primary/15 border border-accent-primary/30 px-2 py-0.5 text-[10px] font-semibold text-accent-primary'
```
To:
```
'rounded-full bg-accent-cyan/15 border border-accent-cyan/30 px-2 py-0.5 text-[10px] font-semibold text-accent-cyan'
```

- [ ] **Step 7: Update "Alla" category pill active state**

Change (the `allCategoriesSelected` active branch):
```
'border-accent-primary bg-accent-primary/10 text-text-primary'
```
To:
```
'border-accent-cyan bg-accent-cyan/10 text-text-primary'
```

- [ ] **Step 8: Update individual category pill active state**

Change (the `active` branch for each category pill):
```
'border-accent-primary bg-accent-primary/10 text-text-primary'
```
To:
```
'border-accent-cyan bg-accent-cyan/10 text-text-primary'
```

- [ ] **Step 9: Update class pill active state**

Change (the `active` branch for class pills):
```
'border-accent-secondary/40 bg-accent-secondary/10 text-accent-secondary'
```
To:
```
'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
```

- [ ] **Step 10: Update select element focus border**

Change (the `<select>` element for sort key):
```
'focus:border-accent-primary focus:outline-none'
```
To:
```
'focus:border-border-focus focus:outline-none'
```

- [ ] **Step 11: Update CarIndicator extra count spacing**

Change the extra count `<span>`:
```
'ml-0.5 text-[10px] text-text-muted'
```
To:
```
'ml-1 text-[11px] text-text-muted'
```

- [ ] **Step 12: Update CarIndicator emblem circle border (local copy in series-setup.tsx)**

The `CarIndicator` component in `series-setup.tsx` has its own copy of the emblem circle (distinct from `car-badges.tsx`). Find and replace inside the `map` in `CarIndicator`:

Old:
```
'inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700/80 bg-black/35'
```
New:
```
'inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-white/15 bg-black/35'
```

- [ ] **Step 13: Update CarIndicator popover (local copy in series-setup.tsx)**

Find and replace the popover `<div>` className inside `CarIndicator` in `series-setup.tsx`:

Old:
```
'fixed z-[100] rounded-xl border border-border/70 bg-[linear-gradient(180deg,rgba(18,30,49,0.97),rgba(10,18,31,0.98))] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-md animate-in fade-in duration-100'
```
New:
```
'fixed z-[100] rounded-xl border border-border-subtle bg-bg-elevated backdrop-blur-md p-3 shadow-[0_16px_40px_rgba(0,0,0,0.4)] animate-in fade-in duration-100'
```

- [ ] **Step 14: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 15: Visual verify in browser**

Run: `pnpm dev`, navigate to `/setup`. Verify:
- Series rows are 100px tall, no gaps or overlaps when scrolling
- Selected row shows cyan border + tint
- Category/class pills show cyan active state
- Badges use mono styling with neon color variants
- Checkbox shows cyan glow when checked

- [ ] **Step 16: Commit**

```bash
git add components/wizard/series-setup.tsx
git commit -m "feat: update series-setup — ROW_HEIGHT 100, h-[100px], cyan tokens, spacing polish"
```

---

## Post-Implementation: Passive Impact Verification

After Task 10, verify these files visually in the browser — they inherit new tokens but were not targeted in this phase:

- `components/season-schedule-browser.tsx` — uses Button, Card, Badge, Input; check layout and readability
- `components/ui/table.tsx` — uses `border-border`, `bg-bg-elevated`; verify tokens resolve correctly

No code changes expected for these files in this phase. Visual regressions from token changes are addressed in future phases.
