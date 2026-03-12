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
  Trophy,
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
  group: 'primary' | 'secondary'
}

const navItems: NavItem[] = [
  { href: '/setup', label: 'Setup', icon: Compass, group: 'primary' },
  { href: '/tracks', label: 'Banor', icon: MapPin, group: 'primary' },
  { href: '/dashboard/costs', label: 'Kostnader', icon: DollarSign, group: 'primary' },
  { href: '/series', label: 'Seriescheman (valfri)', icon: CalendarDays, group: 'secondary' },
  { href: '/dashboard', label: 'Matris', icon: LayoutDashboard, group: 'secondary' },
  { href: '/settings', label: 'Inställningar', icon: Settings, group: 'secondary' },
]

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
    if (storedSeason) {
      setSeasonBadge(storedSeason)
    }
  }, [searchParams])

  return (
    <OwnershipProvider userId={userId} initialOwnedTrackIds={initialOwnedTrackIds}>
      <div className="flex h-screen overflow-hidden bg-bg-base">
        {/* Sidebar */}
        <aside
          className={cn(
            'relative flex flex-col border-r border-border/50 bg-bg-surface/60 backdrop-blur-xl transition-[width] duration-300 ease-out',
            collapsed ? 'w-14' : 'w-[220px]'
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-primary/[0.03] to-transparent" />

          {/* Logo */}
          <div className="relative flex h-14 items-center gap-2.5 border-b border-border/50 px-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
              <Trophy className="h-4 w-4 text-accent-primary" />
            </div>
            {!collapsed && (
              <span className="font-display text-sm font-bold tracking-tight bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                iRacing Planner
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="relative flex-1 space-y-1 p-2">
            {navItems.map(({ href, label, icon: Icon, group }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              const navHref =
                seriesParam && navShouldCarrySeries.has(href)
                  ? `${href}?series=${seriesParam}`
                  : href
              return (
                <Link
                  key={href}
                  href={navHref}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    active ? 'text-text-primary' : 'text-text-muted hover:text-text-primary',
                    focusModeActive && group === 'secondary' && 'opacity-60'
                  )}
                >
                  {active && (
                    <div className="absolute inset-0 rounded-lg bg-accent-primary/8 border border-accent-primary/15" />
                  )}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-accent-primary shadow-[0_0_8px_rgba(233,69,96,0.4)]" />
                  )}
                  <Icon
                    className={cn(
                      'relative h-4 w-4 shrink-0 transition-colors',
                      active
                        ? 'text-accent-primary'
                        : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  />
                  {!collapsed && <span className="relative">{label}</span>}
                </Link>
              )
            })}
            {focusModeActive && !collapsed && (
              <div className="rounded-md border border-border/60 bg-bg-elevated/30 px-3 py-2 text-[11px] text-text-muted">
                Fokusläge: valfria vyer är tillfälligt dolda.
              </div>
            )}
          </nav>

          {/* Logout */}
          <Link
            href="/api/auth/logout"
            className="relative flex h-10 items-center justify-center gap-2 border-t border-border/50 text-text-muted hover:text-text-primary transition-colors px-3"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs">Logga ut</span>}
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="relative flex h-10 items-center justify-center border-t border-border/50 text-text-muted hover:text-text-primary transition-colors"
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
          {/* Top bar */}
          <header className="relative flex h-14 items-center justify-between border-b border-border/50 bg-bg-surface/40 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated/50 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-status-owned animate-glow-pulse" />
                <span className="font-display text-xs font-medium text-text-secondary">
                  {seasonBadge}
                </span>
              </div>
              {flowStep && (
                <div className="hidden items-center gap-1 rounded-full border border-border bg-bg-elevated/40 px-2 py-1 md:flex">
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
                              ? 'bg-accent-primary/15 text-text-primary'
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
                  className="rounded-full border border-border bg-bg-elevated/40 px-3 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  {emphasizeFocusFlow ? 'Visa alla vyer lika tydligt' : 'Betona fokussteg'}
                </button>
              )}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-border" />
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </OwnershipProvider>
  )
}


