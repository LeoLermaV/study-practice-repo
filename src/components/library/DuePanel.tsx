'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ProgressEntry } from '@/lib/content/types'
import { categoryColor } from '@/lib/content/sections'
import { getStudyStats } from '@/lib/progress/db'
import { isInRotation } from '@/lib/progress/queue'
import { formatDueIn } from '@/lib/progress/recall'
import { lateLabel, reviewLabel, todaysQueue, upcomingEntries } from '@/lib/progress/status'
import { useDailyLimit } from '@/lib/progress/dailyLimit'
import { useRecentTopics } from '@/lib/recent'
import type { IndexedTopic, ProgressState } from '@/lib/progress/useProgress'
import { StatusLegend } from './StatusIcon'
import { topicHref } from './utils'

export interface DueItem {
  entry: ProgressEntry
  topic: IndexedTopic
}

export interface DueList {
  items: DueItem[]
  /** Due but held back by the daily limit. */
  waiting: number
}

/**
 * Today's due topics that still exist in the content, most overdue first,
 * capped by the daily limit. Unknown slugs are dropped before the cap so they
 * cannot use up the allowance.
 */
export function dueItems(progress: ProgressState, index: Map<string, IndexedTopic>, limit: number | null): DueList {
  if (!progress.loaded) return { items: [], waiting: 0 }
  const known = progress.entries.filter((e) => index.has(e.slug))
  const { entries, waiting } = todaysQueue(known, progress.now, limit)
  return { items: entries.map((entry) => ({ entry, topic: index.get(entry.slug)! })), waiting }
}

/** "2nd review" when due today, otherwise how late it is. */
export function dueMeta(entry: ProgressEntry, now: number): string {
  const late = lateLabel(entry.nextReviewDue, now)
  return late === 'Due today' ? reviewLabel(entry) : late
}

/** Compact due summary for screens without the side panel. */
export function DueBanner({ progress, index }: { progress: ProgressState; index: Map<string, IndexedTopic> }) {
  const [limit] = useDailyLimit()
  const due = dueItems(progress, index, limit).items
  if (due.length === 0) return null
  const names = due.slice(0, 2).map((d) => d.topic.title).join(', ')
  const more = due.length - 2
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 xl:hidden">
      <Link href="/review" className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">
          {due.length} {due.length === 1 ? 'topic' : 'topics'} to re-read today
        </span>
        <span className="block truncate text-[12.5px] text-muted-foreground">
          {names}{more > 0 && ` and ${more} more`}
        </span>
      </Link>
      <Link
        href={topicHref(due[0].topic)}
        className="flex h-9 shrink-0 items-center rounded-lg bg-brand px-3.5 text-[13.5px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
      >
        Start
      </Link>
    </div>
  )
}

export function DuePanel({ progress, index }: { progress: ProgressState; index: Map<string, IndexedTopic> }) {
  const [limit] = useDailyLimit()
  const { items: due, waiting } = dueItems(progress, index, limit)
  const recent = useRecentTopics()
    .map((slug) => index.get(slug))
    .filter((t): t is IndexedTopic => t !== undefined)
    .slice(0, 5)
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    getStudyStats().then((s) => setStreak(s.currentStreak)).catch(() => setStreak(0))
  }, [progress.entries])

  const inReview = progress.entries.filter((e) => isInRotation(e)).length
  const minutes = due.reduce((sum, d) => sum + d.topic.minutes, 0)
  const next = progress.loaded
    ? upcomingEntries(progress.entries, progress.now, 3650).find((e) => index.has(e.slug))
    : undefined

  return (
    <aside className="hidden xl:block" aria-label="Re-read today">
      <div className="sticky top-[88px] flex flex-col gap-7">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[13px] font-medium">Re-read today</h2>
            {due.length > 0 && <span className="text-xs text-ink-faint">~{minutes} min</span>}
          </div>
          {!progress.loaded ? (
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-secondary" />)}
            </div>
          ) : due.length === 0 ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {waiting > 0 ? (
                <>Done for today. {waiting} more {waiting === 1 ? 'is' : 'are'} due and will come up over the next days.</>
              ) : next ? (
                <>Nothing due. Next up is <span className="text-foreground">{index.get(next.slug)?.title}</span>, {formatDueIn(next.nextReviewDue, progress.now)}.</>
              ) : (
                'Nothing due. Mark a topic as studied and it comes back here when it is time to re-read it.'
              )}
            </p>
          ) : (
            <>
              <p className="mb-2 mt-1 text-[12.5px] text-muted-foreground">Topics you studied that are due for a quick read.</p>
              <ul>
                {due.slice(0, 5).map(({ entry, topic }) => (
                  <li key={entry.slug} className="border-t border-border first:border-t-0">
                    <Link href={topicHref(topic)} className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 py-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(topic.category) }} aria-hidden />
                      <span className="truncate text-[13.5px] font-medium group-hover:text-brand">{topic.title}</span>
                      <span className="col-start-2 text-xs text-ink-faint">
                        {dueMeta(entry, progress.now)} · {topic.minutes} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {(due.length > 5 || waiting > 0) && (
                <Link href="/review" className="mt-1 block text-[12.5px] text-muted-foreground hover:text-foreground">
                  {due.length > 5 ? `View all ${due.length}` : 'Open review'}
                  {waiting > 0 && ` · ${waiting} more waiting`}
                </Link>
              )}
              <Link
                href={topicHref(due[0].topic)}
                className="mt-3 flex h-9 items-center justify-center rounded-lg bg-brand text-[13.5px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
              >
                Start re-reading
              </Link>
            </>
          )}
        </div>
        {recent.length > 0 && (
          <div className="px-1">
            <h2 className="mb-1.5 text-[13px] font-medium">Recently opened</h2>
            <ul>
              {recent.map((t) => (
                <li key={t.slug}>
                  <Link href={topicHref(t)} className="-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(t.category) }} aria-hidden />
                    <span className="truncate">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2.5 px-1">
          <Stat value={streak ?? '–'} label="day streak" />
          <Stat value={progress.loaded ? inReview : '–'} label="in review" />
          <Stat value={progress.loaded ? due.length : '–'} label="due" />
        </div>
        <div className="px-1">
          <StatusLegend />
        </div>
      </div>
    </aside>
  )
}

export function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <b className="block font-mono text-xl font-semibold tracking-[-0.02em] tabular-nums">{value}</b>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/** One-line "Continue" link for screens without the side panel. */
export function ContinueLink({ index }: { index: Map<string, IndexedTopic> }) {
  const last = useRecentTopics().map((slug) => index.get(slug)).find((t): t is IndexedTopic => t !== undefined)
  if (!last) return null
  return (
    <Link href={topicHref(last)} className="mb-4 flex max-w-full items-center gap-2 text-[13.5px] xl:hidden">
      <span className="shrink-0 text-muted-foreground">Continue:</span>
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(last.category) }} aria-hidden />
      <span className="truncate font-medium text-foreground hover:underline">{last.title}</span>
    </Link>
  )
}
