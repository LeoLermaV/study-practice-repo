import { describe, it, expect } from 'vitest'
import type { ProgressEntry } from '../content/types'
import { topicStatus, isDue, dueEntries, upcomingEntries, reviewLabel, lateLabel, todaysQueue } from './status'
import { RECALL_OPTIONS, previewIntervals, formatInterval, formatDueIn } from './recall'

const NOW = new Date(2026, 8, 30, 12, 0, 0).getTime()
const DAY = 86_400_000

function entry(slug: string, over: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    slug,
    readAt: null,
    studiedAt: null,
    rotationRemovedAt: null,
    practicedAt: null,
    practiceNotes: [],
    reviewCount: 0,
    nextReviewDue: 0,
    deletedNotes: [],
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    ...over,
  }
}

describe('topicStatus', () => {
  it('is new without an entry or a read date', () => {
    expect(topicStatus(undefined)).toBe('new')
    expect(topicStatus(entry('a'))).toBe('new')
  })

  it('is studied while in the rotation', () => {
    expect(topicStatus(entry('a', { readAt: NOW, studiedAt: NOW }))).toBe('studied')
  })

  it('falls back to read after removal from the rotation', () => {
    expect(topicStatus(entry('a', { readAt: NOW - DAY, studiedAt: NOW - DAY, rotationRemovedAt: NOW }))).toBe('read')
  })
})

describe('isDue and dueEntries', () => {
  it('only counts topics in the rotation whose date has passed', () => {
    expect(isDue(entry('a', { studiedAt: NOW - DAY, nextReviewDue: NOW - 1 }), NOW)).toBe(true)
    expect(isDue(entry('a', { studiedAt: NOW - DAY, nextReviewDue: NOW + 1 }), NOW)).toBe(false)
    expect(isDue(entry('a', { readAt: NOW - DAY, nextReviewDue: NOW - 1 }), NOW)).toBe(false)
    expect(isDue(undefined, NOW)).toBe(false)
  })

  it('sorts the most overdue first', () => {
    const progress = [
      entry('recent', { studiedAt: 1, nextReviewDue: NOW - DAY }),
      entry('oldest', { studiedAt: 1, nextReviewDue: NOW - 5 * DAY }),
      entry('future', { studiedAt: 1, nextReviewDue: NOW + DAY }),
    ]
    expect(dueEntries(progress, NOW).map((e) => e.slug)).toEqual(['oldest', 'recent'])
  })
})

describe('upcomingEntries', () => {
  it('returns rotation topics due after now within the horizon', () => {
    const progress = [
      entry('due-now', { studiedAt: 1, nextReviewDue: NOW }),
      entry('in-2', { studiedAt: 1, nextReviewDue: NOW + 2 * DAY }),
      entry('in-9', { studiedAt: 1, nextReviewDue: NOW + 9 * DAY }),
      entry('in-1', { studiedAt: 1, nextReviewDue: NOW + DAY }),
    ]
    expect(upcomingEntries(progress, NOW, 7).map((e) => e.slug)).toEqual(['in-1', 'in-2'])
  })
})

describe('labels', () => {
  it('numbers reviews from the first', () => {
    expect(reviewLabel(entry('a', { reps: 0 }))).toBe('1st review')
    expect(reviewLabel(entry('a', { reps: 1 }))).toBe('2nd review')
    expect(reviewLabel(entry('a', { reps: 2 }))).toBe('3rd review')
    expect(reviewLabel(entry('a', { reps: 10 }))).toBe('11th review')
    expect(reviewLabel(entry('a', { reps: 21 }))).toBe('22nd review')
  })

  it('counts lateness in calendar days', () => {
    expect(lateLabel(NOW - 60_000, NOW)).toBe('Due today')
    expect(lateLabel(NOW - DAY, NOW)).toBe('1 day late')
    expect(lateLabel(NOW - 3 * DAY, NOW)).toBe('3 days late')
  })
})

describe('recall', () => {
  it('offers three answers mapped to hard, good and easy', () => {
    expect(RECALL_OPTIONS.map((o) => [o.label, o.rating])).toEqual([
      ['Fuzzy', 'hard'],
      ['Mostly', 'good'],
      ['Solid', 'easy'],
    ])
  })

  it('previews the scheduler intervals without writing anything', () => {
    const first = entry('a', { studiedAt: NOW - DAY, intervalDays: 1, reps: 0 })
    expect(previewIntervals(first, NOW)).toEqual({ hard: 1, good: 1, easy: 4 })

    const mature = entry('a', { studiedAt: NOW - DAY, intervalDays: 6, reps: 2, ease: 2.5 })
    const p = previewIntervals(mature, NOW)
    expect(p.hard).toBeLessThan(p.good)
    expect(p.good).toBeLessThan(p.easy)
  })

  it('formats intervals and due dates in plain words', () => {
    expect(formatInterval(1)).toBe('1 day')
    expect(formatInterval(6)).toBe('6 days')
    expect(formatInterval(21)).toBe('3 weeks')
    expect(formatInterval(30)).toBe('1 month')
    expect(formatInterval(95)).toBe('3 months')
    expect(formatDueIn(NOW + DAY, NOW)).toBe('tomorrow')
    expect(formatDueIn(NOW + 6 * DAY, NOW)).toBe('in 6 days')
  })
})

describe('todaysQueue', () => {
  const due = (slug: string, daysLate: number) => entry(slug, { studiedAt: 1, nextReviewDue: NOW - daysLate * DAY })
  const progress = [due('a', 5), due('b', 4), due('c', 3), due('d', 2), due('e', 1)]

  it('shows everything due without a limit', () => {
    expect(todaysQueue(progress, NOW, null)).toEqual({ entries: progress, waiting: 0, ratedToday: 0 })
  })

  it('caps the list at the limit, most overdue first', () => {
    const q = todaysQueue(progress, NOW, 2)
    expect(q.entries.map((e) => e.slug)).toEqual(['a', 'b'])
    expect(q.waiting).toBe(3)
  })

  it('counts ratings given today against the limit', () => {
    const rated = entry('done', { studiedAt: 1, practicedAt: NOW - 60_000, nextReviewDue: NOW + 6 * DAY })
    const q = todaysQueue([...progress, rated], NOW, 2)
    expect(q.ratedToday).toBe(1)
    expect(q.entries.map((e) => e.slug)).toEqual(['a'])
    expect(q.waiting).toBe(4)
  })

  it('shows nothing once the allowance is used, and ignores ratings from other days', () => {
    const today = [1, 2].map((i) => entry(`t${i}`, { studiedAt: 1, practicedAt: NOW - i * 60_000, nextReviewDue: NOW + DAY }))
    const yesterday = entry('y', { studiedAt: 1, practicedAt: NOW - DAY, nextReviewDue: NOW + DAY })
    const q = todaysQueue([...progress, ...today, yesterday], NOW, 2)
    expect(q).toMatchObject({ entries: [], waiting: 5, ratedToday: 2 })
  })
})
