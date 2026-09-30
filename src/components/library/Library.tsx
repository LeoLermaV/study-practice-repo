'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/lib/content/types'
import type { LibraryData } from '@/lib/content/library'
import { categoryColor, categoryOrder } from '@/lib/content/sections'
import { cn } from '@/lib/utils'
import { useProgress, useTopicIndex, type ProgressState } from '@/lib/progress/useProgress'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { CategoryView } from './CategoryView'
import { ContinueLink, DueBanner, DuePanel } from './DuePanel'
import { countStudied } from './utils'

const LAST_CATEGORY_KEY = 'library:last-category'

function isCategory(value: string | null): value is Category {
  return value !== null && (categoryOrder as string[]).includes(value)
}

/**
 * The main screen. Category pages pass their category; "/" passes null and
 * reopens whichever category was visited last.
 */
export function Library({ data, category: routeCategory }: { data: LibraryData; category: Category | null }) {
  const [stored, setStored] = useLocalStorage(LAST_CATEGORY_KEY)
  const progress = useProgress()
  const index = useTopicIndex(data)

  useEffect(() => {
    if (routeCategory) setStored(routeCategory)
  }, [routeCategory, setStored])

  // null while hydrating on "/" (storage unreadable on the server): show the skeleton.
  const category: Category | null = routeCategory ?? (stored === null ? null : isCategory(stored) ? stored : categoryOrder[0])

  const current = category ? data.categories.find((c) => c.id === category) : undefined

  return (
    <div className="grid gap-10 lg:grid-cols-[196px_minmax(0,1fr)] xl:grid-cols-[196px_minmax(0,1fr)_272px]">
      <CategoryRail data={data} current={category} progress={progress} />
      <div className="min-w-0">
        <DueBanner progress={progress} index={index} />
        <ContinueLink index={index} />
        <CategoryChips data={data} current={category} />
        {current ? <CategoryView key={current.id} category={current} progress={progress} /> : <LibrarySkeleton />}
      </div>
      <DuePanel progress={progress} index={index} />
    </div>
  )
}

function CategoryRail({ data, current, progress }: { data: LibraryData; current: Category | null; progress: ProgressState }) {
  return (
    <nav aria-label="Categories" className="hidden lg:block">
      <div className="sticky top-[88px] flex flex-col gap-0.5">
        <p className="mb-2 px-2.5 text-xs text-ink-faint">Library</p>
        {data.categories.map((c) => {
          const studied = countStudied(c, progress)
          const active = c.id === current
          return (
            <Link
              key={c.id}
              href={`/${c.id}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'bg-card font-medium text-foreground shadow-[0_0_0_1px_var(--border)]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(c.id) }} aria-hidden />
              <span className="truncate">{c.title}</span>
              <span className="font-mono text-[11.5px] text-ink-faint tabular-nums">
                {progress.loaded ? `${studied}/${c.total}` : c.total}
              </span>
              <span className="col-start-2 col-end-4 block h-0.5 overflow-hidden rounded bg-border" aria-hidden>
                <span
                  className="block h-full"
                  style={{ width: `${c.total ? (studied / c.total) * 100 : 0}%`, backgroundColor: categoryColor(c.id) }}
                />
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function CategoryChips({ data, current }: { data: LibraryData; current: Category | null }) {
  return (
    <nav aria-label="Categories" className="mb-5 flex flex-wrap gap-1.5 lg:hidden">
      {data.categories.map((c) => {
        const active = c.id === current
        return (
          <Link
            key={c.id}
            href={`/${c.id}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center gap-2 rounded-full border bg-card px-3 text-[13.5px] transition-colors',
              active ? 'border-foreground font-medium text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(c.id) }} aria-hidden />
            {c.title}
            <span className="font-mono text-[11.5px] text-ink-faint tabular-nums">{c.total}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function LibrarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading library">
      <div className="mb-2 h-7 w-56 animate-pulse rounded-lg bg-secondary" />
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-secondary" />
      <div className="mb-4 h-9 animate-pulse rounded-lg bg-secondary" />
      <div className="space-y-2">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-secondary/70" />
        ))}
      </div>
    </div>
  )
}
