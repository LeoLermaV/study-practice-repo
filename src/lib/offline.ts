import type { ProgressEntry } from './content/types'
import { isInRotation } from './progress/queue'

const DAY_MS = 86_400_000

/**
 * Topics worth keeping offline: re-reads due now or within `days`, soonest
 * first, then recently opened ones. Unique, capped at `max`.
 */
export function offlineCandidates(progress: ProgressEntry[], recent: string[], now: number, days = 2, max = 40): string[] {
  const soon = progress
    .filter((e) => isInRotation(e) && e.nextReviewDue <= now + days * DAY_MS)
    .sort((a, b) => a.nextReviewDue - b.nextReviewDue)
    .map((e) => e.slug)
  return [...new Set([...soon, ...recent])].slice(0, max)
}

export const OFFLINE_CACHE_PREFIX = 'faang-'
export const OFFLINE_PAGES_PREFIX = 'faang-pages-'
