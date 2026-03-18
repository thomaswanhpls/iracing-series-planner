'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Compass,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OwnershipProvider } from '@/lib/ownership/context'
import { LocaleSwitcher } from '@/components/locale-switcher'


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
  { href: '/setup',     label: 'setup',     icon: Compass,         group: 'planering' },
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, group: 'planering' },
  { href: '/settings',  label: 'settings',  icon: Settings,        group: 'planering' },
]

const navGroups: { key: 'planering' | 'analys'; label: string }[] = [
  { key: 'planering', label: 'planGroup' },
]

const pageMeta: Record<string, { breadcrumb: string; titleKey: string }> = {
  '/setup':     { breadcrumb: 'planGroup', titleKey: 'setup' },
  '/dashboard': { breadcrumb: 'planGroup', titleKey: 'dashboard' },
  '/settings':  { breadcrumb: 'planGroup', titleKey: 'settings' },
}

function getInitials(userId: string): string {
  return userId.slice(0, 2).toUpperCase()
}

export function AppShell({ children, userId, initialOwnedTrackIds }: AppShellProps) {
  const t = useTranslations('nav')
  const [collapsed, setCollapsed] = useState(false)
  const [seasonBadge, setSeasonBadge] = useState('2026 S2')
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Object.keys(pageMeta)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key))
  const { breadcrumb: pageBreadcrumbKey, titleKey: pageTitleKey } = currentPage
    ? pageMeta[currentPage]
    : { breadcrumb: '', titleKey: '' }
  const pageBreadcrumb = pageBreadcrumbKey ? t(pageBreadcrumbKey as Parameters<typeof t>[0]) : ''
  const pageTitle = pageTitleKey ? t(pageTitleKey as Parameters<typeof t>[0]) : ''

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
                      {t(label as Parameters<typeof t>[0])}
                    </div>
                  )}
                  {groupItems.map(({ href, label: itemLabel, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    const navHref = href
                    return (
                      <Link
                        key={href}
                        href={navHref}
                        className={cn(
                          'relative flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-colors duration-200',
                          active
                            ? 'text-white bg-accent-cyan/[0.06]'
                            : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03]',
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
                        {!collapsed && <span>{t(itemLabel as Parameters<typeof t>[0])}</span>}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
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
          <a
            href="/api/auth/logout"
            className="relative flex h-10 items-center justify-center gap-2 border-t border-white/[0.06] text-text-muted hover:text-text-primary transition-colors px-3"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs">{t('logout')}</span>}
          </a>

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
              <LocaleSwitcher />
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </OwnershipProvider>
  )
}
