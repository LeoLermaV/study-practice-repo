import { describe, it, expect } from 'vitest'
import type { ProgressEntry } from './content/types'
import { offlineCandidates } from './offline'

const NOW = 1_000_000_000_000
const DAY = 86_400_000
const e = (slug: string, over: Partial<ProgressEntry>): ProgressEntry => ({
  slug, readAt: 1, studiedAt: 1, rotationRemovedAt: null, practicedAt: null, practiceNotes: [], reviewCount: 0,
  nextReviewDue: NOW, deletedNotes: [], ease: 2.5, intervalDays: 1, reps: 0, ...over,
})

describe('offlineCandidates', () => {
  it('keeps due and soon-due re-reads, soonest first, then recent topics', () => {
    const progress = [
      e('in-2-days', { nextReviewDue: NOW + 2 * DAY }),
      e('overdue', { nextReviewDue: NOW - DAY }),
      e('in-5-days', { nextReviewDue: NOW + 5 * DAY }),
      e('removed', { nextReviewDue: NOW, rotationRemovedAt: 2 }),
    ]
    expect(offlineCandidates(progress, ['recent', 'overdue'], NOW)).toEqual(['overdue', 'in-2-days', 'recent'])
  })

  it('caps the list', () => {
    expect(offlineCandidates([], ['a', 'b', 'c'], NOW, 2, 2)).toEqual(['a', 'b'])
  })
})
