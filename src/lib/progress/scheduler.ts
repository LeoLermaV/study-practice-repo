export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface Schedule {
  /** SM-2 ease factor. Persisted per topic: how hard this material is for you. */
  ease: number
  intervalDays: number
  /** Consecutive non-lapsed reviews. Reset to 0 by 'again'. */
  reps: number
  dueAt: number
}

export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3
export const MAX_EASE = 2.5

const DAY_MS = 86_400_000
const LAPSE_MS = 10 * 60_000

const QUALITY: Record<Rating, number> = { again: 2, hard: 3, good: 4, easy: 5 }

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi)
}

export function initialSchedule(now: number = Date.now()): Schedule {
  return { ease: DEFAULT_EASE, intervalDays: 0, reps: 0, dueAt: now }
}

/**
 * Reconstructs a v1 entry's scheduling fields. The interval actually in force is
 * recoverable from the stored dates, so an existing schedule survives the upgrade
 * instead of every topic resetting to a default.
 */
export function backfillSchedule<
  T extends {
    readAt: number | null
    studiedAt: number | null
    practicedAt: number | null
    reviewCount: number
    nextReviewDue: number
    ease?: number
    intervalDays?: number
    reps?: number
  }
>(entry: T): T & Pick<Schedule, 'ease' | 'intervalDays' | 'reps'> {
  if (entry.ease !== undefined) {
    return entry as T & Pick<Schedule, 'ease' | 'intervalDays' | 'reps'>
  }
  const anchor = entry.practicedAt ?? entry.studiedAt ?? entry.readAt
  const intervalDays =
    anchor !== null && entry.nextReviewDue > anchor
      ? Math.max(0, Math.round((entry.nextReviewDue - anchor) / DAY_MS))
      : 0
  return { ...entry, ease: DEFAULT_EASE, intervalDays, reps: entry.reviewCount ?? 0 }
}

/**
 * SM-2 with Anki-style handling of 'hard' and 'easy'.
 *
 * The interval grows by the topic's own ease factor rather than a shared table,
 * so material you keep forgetting stays in a short cycle instead of inheriting
 * a long interval from how many times you happen to have seen it.
 */
export function nextSchedule(
  prev: Pick<Schedule, 'ease' | 'intervalDays' | 'reps'>,
  rating: Rating,
  now: number = Date.now()
): Schedule {
  const q = QUALITY[rating]
  const ease = clamp(prev.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), MIN_EASE, MAX_EASE)

  // A lapse resets progress and re-shows the topic in the same session.
  if (rating === 'again') {
    return { ease, intervalDays: 0, reps: 0, dueAt: now + LAPSE_MS }
  }

  const reps = prev.reps + 1

  let intervalDays: number
  if (reps === 1) {
    intervalDays = rating === 'easy' ? 4 : 1
  } else if (reps === 2) {
    intervalDays = 6
  } else if (rating === 'hard') {
    intervalDays = Math.max(prev.intervalDays * 1.2, prev.intervalDays + 1)
  } else if (rating === 'easy') {
    intervalDays = prev.intervalDays * ease * 1.3
  } else {
    intervalDays = prev.intervalDays * ease
  }

  intervalDays = Math.round(intervalDays)
  return { ease, intervalDays, reps, dueAt: now + intervalDays * DAY_MS }
}
