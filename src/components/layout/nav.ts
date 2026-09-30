'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { categoryOrder } from '@/lib/content/sections'
import { getDueTopics } from '@/lib/progress/db'
import { onProgressChanged } from '@/lib/progress/events'

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

/** Number of topics due for re-reading; refreshes on navigation and progress changes. */
export function useDueCount(): number {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      getDueTopics()
        .then((due) => { if (!cancelled) setCount(due.length) })
        .catch(() => { if (!cancelled) setCount(0) })
    }
    refresh()
    const off = onProgressChanged(refresh)
    return () => { cancelled = true; off() }
  }, [pathname])

  return count
}
