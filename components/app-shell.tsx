'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Compass,
  MapPin,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trophy,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OwnershipProvider } from '@/lib/ownership/context'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/setup', label: 'Setup', icon: Compass },
  { href: '/tracks', label: 'Banor', icon: MapPin },
  { href: '/dashboard/costs', label: 'Kostnader', icon: DollarSign },
  { href: '/settings', label: 'Inställningar', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
  userId: string
  initialOwnedTrackIds: number[]
}

export function AppShell({ children, userId, initialOwnedTrackIds }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

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
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    active ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated/50 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-status-owned animate-glow-pulse" />
                <span className="font-display text-xs font-medium text-text-secondary">
                  2026 S1
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
