'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { categoryOrder } from '@/lib/content/sections'
import { loadTopicLookup } from '@/lib/content/topicLookup'
import { getAllProgress } from '@/lib/progress/db'
import { useDailyLimit } from '@/lib/progress/dailyLimit'
import { onProgressChanged } from '@/lib/progress/events'
import { todaysQueue } from '@/lib/progress/status'

export type NavKey = 'library' | 'review' | 'flashcards' | 'progress' | 'settings'

export const NAV_ITEMS: { key: Exclude<NavKey, 'settings'>; href: string; label: string }[] = [
  { key: 'library', href: '/', label: 'Library' },
  { key: 'review', href: '/review', label: 'Review' },
  { key: 'flashcards', href: '/flashcards', label: 'Flashcards' },
  { key: 'progress', href: '/progress', label: 'Progress' },
]

/** Topic and category pages belong to the library. */
export function activeNav(pathname: string): NavKey | null {
  if (pathname === '/' || categoryOrder.some((c) => pathname === `/${c}` || pathname.startsWith(`/${c}/`))) {
    return 'library'
  }
  for (const key of ['review', 'flashcards', 'progress', 'settings'] as const) {
    if (pathname === `/${key}` || pathname.startsWith(`/${key}/`)) return key
  }
  return null
}

export function useActiveNav(): NavKey | null {
  return activeNav(usePathname())
}

/**
 * Topics left to re-read today, matching the Review page: known topics only,
 * capped by the daily limit. Refreshes on navigation and progress changes.
 */
export function useDueCount(): number {
  const pathname = usePathname()
  const [limit] = useDailyLimit()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const [progress, lookup] = await Promise.all([getAllProgress(), loadTopicLookup().catch(() => null)])
        const known = lookup ? progress.filter((e) => lookup.has(e.slug)) : progress
        if (!cancelled) setCount(todaysQueue(known, Date.now(), limit).entries.length)
      } catch {
        if (!cancelled) setCount(0)
      }
    }
    refresh()
    const off = onProgressChanged(refresh)
    return () => { cancelled = true; off() }
  }, [pathname, limit])

  return count
}
