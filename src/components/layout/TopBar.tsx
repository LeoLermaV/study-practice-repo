'use client'

import Link from 'next/link'
import { Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer'
import { openSearch } from '@/components/search/openSearch'
import { ThemeToggle } from './ThemeToggle'
import { NAV_ITEMS, useActiveNav, useDueCount } from './nav'

export function TopBar() {
  const active = useActiveNav()
  const due = useDueCount()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-[-0.01em] text-foreground">
          <span className="block size-2.5 rounded-[3px] bg-brand" aria-hidden />
          faang study
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                active === item.key
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {item.label}
              {item.key === 'review' && due > 0 && <CountBadge count={due} />}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search topics"
            className="flex h-9 items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-[13.5px] text-ink-faint transition-colors hover:border-border-strong max-md:w-9 max-md:justify-center max-md:border-transparent max-md:bg-transparent max-md:px-0 max-md:text-muted-foreground md:w-56"
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden md:inline">Search all topics</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 font-mono text-[11px] text-muted-foreground md:inline">⌘K</kbd>
          </button>
          <PomodoroTimer />
          <ThemeToggle className="hidden md:grid" />
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            aria-current={active === 'settings' ? 'page' : undefined}
            className={cn(
              'grid size-9 place-items-center rounded-lg transition-colors hover:bg-secondary hover:text-foreground',
              active === 'settings' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'min-w-[18px] rounded-full bg-brand px-1.5 text-center font-mono text-[11px] leading-[18px] text-brand-foreground tabular-nums',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
