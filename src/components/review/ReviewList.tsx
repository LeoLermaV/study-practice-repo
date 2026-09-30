'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LibraryData } from '@/lib/content/library'
import { categoryColor, categoryShortTitles } from '@/lib/content/sections'
import { isInRotation } from '@/lib/progress/queue'
import { formatDueIn } from '@/lib/progress/recall'
import { upcomingEntries } from '@/lib/progress/status'
import { useProgress, useTopicIndex } from '@/lib/progress/useProgress'
import { dueItems, dueMeta } from '@/components/library/DuePanel'
import { topicHref } from '@/components/library/utils'

const UPCOMING_DAYS = 7

function dayLabel(dueAt: number, now: number): string {
  const start = (t: number) => {
    const d = new Date(t)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const days = Math.round((start(dueAt) - start(now)) / 86_400_000)
  if (days <= 1) return 'Tomorrow'
  return new Date(dueAt).toLocaleDateString(undefined, { weekday: 'long' })
}

export function ReviewList({ data }: { data: LibraryData }) {
  const progress = useProgress()
  const index = useTopicIndex(data)

  if (!progress.loaded) {
    return (
      <div className="mx-auto max-w-[680px]" aria-busy="true">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-secondary" />
      </div>
    )
  }

  const due = dueItems(progress, index)
  const minutes = due.reduce((sum, d) => sum + d.topic.minutes, 0)
  const inReview = progress.entries.filter((e) => isInRotation(e)).length

  const upcoming = upcomingEntries(progress.entries, progress.now, UPCOMING_DAYS)
    .map((entry) => ({ entry, topic: index.get(entry.slug) }))
    .filter((u): u is { entry: typeof u.entry; topic: NonNullable<typeof u.topic> } => u.topic !== undefined)
  const byDay = new Map<string, typeof upcoming>()
  for (const u of upcoming) {
    const label = dayLabel(u.entry.nextReviewDue, progress.now)
    byDay.set(label, [...(byDay.get(label) ?? []), u])
  }
  const nextAfterWeek = upcomingEntries(progress.entries, progress.now, 3650).find(
    (e) => index.has(e.slug) && !upcoming.some((u) => u.entry.slug === e.slug)
  )

  return (
    <div className="mx-auto max-w-[680px] animate-fade-in">
      <p className="mb-2 text-[13px] text-muted-foreground">Review</p>
      {due.length > 0 ? (
        <>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-balance md:text-[30px]">
            <span className="text-brand">{due.length} {due.length === 1 ? 'topic' : 'topics'}</span> to re-read today
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            About {minutes} minutes. Read each one, then answer how much you still remembered at the end of the page.
          </p>

          <ul className="mt-7 border-t border-border">
            {due.map(({ entry, topic }) => (
              <li key={entry.slug} className="border-b border-border">
                <Link href={topicHref(topic)} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-1 py-3.5 transition-colors hover:bg-secondary">
                  <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(topic.category) }} aria-hidden />
                  <span className="truncate text-[15px] font-medium">{topic.title}</span>
                  <span className="text-right font-mono text-xs text-ink-faint tabular-nums">{topic.minutes} min</span>
                  <span className="col-start-2 col-end-4 text-[13px] text-muted-foreground">
                    {categoryShortTitles[topic.category]} · {dueMeta(entry, progress.now)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={topicHref(due[0].topic)}
            className="mt-6 inline-flex h-10 max-w-full items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            <span className="truncate">Start with {due[0].topic.title}</span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] md:text-[30px]">Nothing to re-read today</h1>
          <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-muted-foreground">
            {inReview === 0
              ? 'When you finish a topic, press "Mark as studied" at the end of its page. It comes back here when it is time for a quick re-read.'
              : `${inReview} ${inReview === 1 ? 'topic is' : 'topics are'} in your re-reading schedule. They appear here on the day they are due.`}
          </p>
          <Link href="/" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-border-strong">
            Browse the library
            <ArrowRight className="size-4" />
          </Link>
        </>
      )}

      {byDay.size > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">Coming up this week</h2>
          <div className="space-y-4">
            {[...byDay.entries()].map(([label, items]) => (
              <div key={label}>
                <p className="mb-1 text-[13px] font-medium">
                  {label} <span className="font-normal text-ink-faint">· {items.length} {items.length === 1 ? 'topic' : 'topics'}</span>
                </p>
                <ul>
                  {items.map(({ entry, topic }) => (
                    <li key={entry.slug}>
                      <Link href={topicHref(topic)} className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(topic.category) }} aria-hidden />
                        <span className="truncate">{topic.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {byDay.size === 0 && nextAfterWeek && (
        <p className="mt-10 text-[13px] text-muted-foreground">
          Next re-read: <span className="text-foreground">{index.get(nextAfterWeek.slug)?.title}</span>,{' '}
          {formatDueIn(nextAfterWeek.nextReviewDue, progress.now)}.
        </p>
      )}
    </div>
  )
}
