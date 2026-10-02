import type { ProgressEntry } from '../content/types'
import { isInRotation } from './queue'

export type TopicStatus = 'new' | 'read' | 'studied'

/**
 * Library status. "Studied" means in the re-reading rotation. "Read" covers
 * older entries marked read before the rotation existed, and topics taken
 * back out of the rotation (their reading history is kept).
 */
export function topicStatus(entry: ProgressEntry | undefined): TopicStatus {
  if (isInRotation(entry)) return 'studied'
  if (entry?.readAt) return 'read'
  return 'new'
}

export function isDue(entry: ProgressEntry | undefined, now: number): boolean {
  return isInRotation(entry) && entry!.nextReviewDue <= now
}

/** Topics due for re-reading, most overdue first so the list rotates. */
export function dueEntries(progress: ProgressEntry[], now: number): ProgressEntry[] {
  return progress
    .filter((e) => isDue(e, now))
    .sort((a, b) => a.nextReviewDue - b.nextReviewDue)
}

/** Topics in rotation that fall due within the next `days` days (excludes today). */
export function upcomingEntries(progress: ProgressEntry[], now: number, days: number): ProgressEntry[] {
  const horizon = now + days * 86_400_000
  return progress
    .filter((e) => isInRotation(e) && e.nextReviewDue > now && e.nextReviewDue <= horizon)
    .sort((a, b) => a.nextReviewDue - b.nextReviewDue)
}

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

/** "1st review" for a topic that has never been rated, and so on. */
export function reviewLabel(entry: ProgressEntry): string {
  return `${ordinal(entry.reps + 1)} review`
}

/** How late a due topic is, in whole local calendar days. */
export function lateLabel(dueAt: number, now: number): string {
  const startOfDay = (t: number) => {
    const d = new Date(t)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  const days = Math.round((startOfDay(now) - startOfDay(dueAt)) / 86_400_000)
  if (days <= 0) return 'Due today'
  if (days === 1) return '1 day late'
  return `${days} days late`
}

function sameLocalDay(a: number, b: number): boolean {
  const x = new Date(a)
  const y = new Date(b)
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
}

export interface TodayQueue {
  /** Due topics to re-read today, most overdue first. */
  entries: ProgressEntry[]
  /** Due topics held back by the daily limit; they surface on later days. */
  waiting: number
  /** Recall ratings already given today (they count against the limit). */
  ratedToday: number
}

/**
 * Today's re-reading list. With a daily limit, ratings given today use up the
 * allowance, so finishing five of five leaves nothing rather than the next
 * five. Anything held back stays due and, being most overdue, leads tomorrow.
 */
export function todaysQueue(progress: ProgressEntry[], now: number, limit: number | null): TodayQueue {
  const due = dueEntries(progress, now)
  const ratedToday = progress.filter((e) => e.practicedAt !== null && sameLocalDay(e.practicedAt, now)).length
  if (limit === null) return { entries: due, waiting: 0, ratedToday }
  const allowance = Math.max(0, limit - ratedToday)
  const entries = due.slice(0, allowance)
  return { entries, waiting: due.length - entries.length, ratedToday }
}

/**
 * Days until the first re-read for a batch of topics marked studied at once:
 * `perDay` topics tomorrow, the next `perDay` the day after, and so on, so a
 * whole section does not come due on the same morning.
 */
export function staggeredFirstReviews(count: number, perDay: number): number[] {
  const step = Math.max(1, Math.floor(perDay))
  return Array.from({ length: Math.max(0, count) }, (_, i) => 1 + Math.floor(i / step))
}
