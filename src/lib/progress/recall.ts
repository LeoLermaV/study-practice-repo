import type { ProgressEntry } from '../content/types'
import { nextSchedule, type Rating } from './scheduler'

export type RecallRating = Extract<Rating, 'hard' | 'good' | 'easy'>

/**
 * The three answers shown after re-reading a topic. "again" is deliberately
 * absent: it resets the topic and re-shows it in ten minutes, which suits a
 * flashcard session but not re-reading an article. Flashcards keep all four.
 */
export const RECALL_OPTIONS: { rating: RecallRating; label: string }[] = [
  { rating: 'hard', label: 'Fuzzy' },
  { rating: 'good', label: 'Mostly' },
  { rating: 'easy', label: 'Solid' },
]

/** Days until the topic would come back for each answer. */
export function previewIntervals(entry: ProgressEntry, now: number): Record<RecallRating, number> {
  const out = {} as Record<RecallRating, number>
  for (const { rating } of RECALL_OPTIONS) {
    out[rating] = nextSchedule(entry, rating, now).intervalDays
  }
  return out
}

export function formatInterval(days: number): string {
  if (days <= 1) return '1 day'
  if (days < 14) return `${days} days`
  if (days < 28) return `${Math.round(days / 7)} weeks`
  const months = Math.round(days / 30)
  return months === 1 ? '1 month' : `${months} months`
}

/** "tomorrow", "in 6 days", "in 3 weeks" — for a future due date. */
export function formatDueIn(dueAt: number, now: number): string {
  const days = Math.max(1, Math.round((dueAt - now) / 86_400_000))
  if (days === 1) return 'tomorrow'
  return `in ${formatInterval(days)}`
}
