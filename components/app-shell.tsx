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
  { href: '/setup',           label: 'Setup',         icon: Compass,         group: 'planering' },
  { href: '/series',          label: 'Seriescheman',  icon: CalendarDays,    group: 'planering' },
  { href: '/dashboard',       label: 'Matris',        icon: LayoutDashboard, group: 'planering' },
  { href: '/tracks',          label: 'Banor',         icon: MapPin,          group: 'analys' },
  { href: '/dashboard/costs', label: 'Kostnader',     icon: DollarSign,      group: 'analys' },
  { href: '/settings',        label: 'Inställningar', icon: Settings,        group: 'analys' },
]

const navGroups: { key: 'planering' | 'analys'; label: string }[] = [
  { key: 'planering', label: 'Planering' },
  { key: 'analys',    label: 'Analys' },
]

const pageMeta: Record<string, { breadcrumb: string; title: string }> = {
  '/setup':           { breadcrumb: 'Planering', title: 'Välj serier' },
  '/series':          { breadcrumb: 'Planering', title: 'Seriescheman' },
  '/dashboard':       { breadcrumb: 'Analys',    title: 'Matrisöversikt' },
  '/dashboard/costs': { breadcrumb: 'Analys',    title: 'Kostnader' },
  '/tracks':          { breadcrumb: 'Analys',    title: 'Banor' },
  '/settings':        { breadcrumb: 'Analys',    title: 'Inställningar' },
}

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

  const currentPage = Object.keys(pageMeta)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key))
  const { breadcrumb: pageBreadcrumb, title: pageTitle } = currentPage
    ? pageMeta[currentPage]
    : { breadcrumb: '', title: '' }

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
                  {seasonBadge} · Säsongsplanerare
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
                  {groupItems.map(({ href, label: itemLabel, icon: Icon, group }) => {
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
                            className="absolute left-0 top-[6px] bottom-[6px] w-0.5 rounded-r-[2px]"
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
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white/80 truncate">{userId}</div>
                  <div className="font-mono text-[10px] text-white/25 uppercase tracking-[0.04em] mt-0.5">iRacing Member</div>
                </div>
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
            <div className="flex items-baseline gap-2.5">
              {pageBreadcrumb && (
                <span className="font-mono text-[11px] text-white/25 uppercase tracking-[0.06em]">
                  {pageBreadcrumb} /
                </span>
              )}
              {pageTitle && (
                <span className="text-[16px] font-semibold text-white/90">{pageTitle}</span>
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
