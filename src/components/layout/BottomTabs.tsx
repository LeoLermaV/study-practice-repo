'use client'

import Link from 'next/link'
import { BarChart3, Layers, Library, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountBadge } from './TopBar'
import { NAV_ITEMS, useActiveNav, useDueCount } from './nav'

const ICONS = { library: Library, review: RotateCcw, flashcards: Layers, progress: BarChart3 } as const

/** Phone navigation. The desktop equivalent lives in the top bar. */
export function BottomTabs() {
  const active = useActiveNav()
  const due = useDueCount()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.key]
        const current = active === item.key
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] transition-colors',
              current ? 'font-medium text-foreground' : 'text-ink-faint'
            )}
          >
            <Icon className="size-5" strokeWidth={1.8} />
            {item.label}
            {item.key === 'review' && due > 0 && (
              <CountBadge count={due} className="absolute left-[calc(50%+4px)] top-1.5 min-w-4 px-1 text-[10px] leading-4" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
