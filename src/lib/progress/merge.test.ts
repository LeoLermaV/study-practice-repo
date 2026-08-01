import { describe, it, expect } from 'vitest'
import type { ProgressEntry } from '../content/types'
import { mergeEntry, mergeStudyLog, normalizeEntry } from './merge'

function mk(over: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    slug: 'binary-search',
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

describe('mergeEntry field rules', () => {
  it('keeps the earliest readAt', () => {
    expect(mergeEntry(mk({ readAt: 100 }), mk({ readAt: 50 })).readAt).toBe(50)
  })

  // studiedAt was "earliest" while it meant first-seen. It now records when the
  // topic was last added to the rotation and races rotationRemovedAt, so the
  // most recent action has to win.
  it('keeps the latest studiedAt', () => {
    expect(mergeEntry(mk({ studiedAt: 900 }), mk({ studiedAt: 400 })).studiedAt).toBe(900)
  })

  it('keeps the latest practicedAt', () => {
    const merged = mergeEntry(mk({ practicedAt: 100 }), mk({ practicedAt: 300 }))
    expect(merged.practicedAt).toBe(300)
  })

  it('takes nextReviewDue from whichever side practiced most recently, even if smaller', () => {
    const stale = mk({ practicedAt: 100, nextReviewDue: 9999 })
    const fresh = mk({ practicedAt: 300, nextReviewDue: 400 })
    expect(mergeEntry(stale, fresh).nextReviewDue).toBe(400)
    expect(mergeEntry(fresh, stale).nextReviewDue).toBe(400)
  })

  it('breaks a practicedAt tie by taking the later nextReviewDue', () => {
    const merged = mergeEntry(
      mk({ practicedAt: 100, nextReviewDue: 500 }),
      mk({ practicedAt: 100, nextReviewDue: 800 })
    )
    expect(merged.nextReviewDue).toBe(800)
  })

  it('takes the max reviewCount', () => {
    expect(mergeEntry(mk({ reviewCount: 2 }), mk({ reviewCount: 7 })).reviewCount).toBe(7)
  })
})

describe('practice notes', () => {
  it('unions notes by timestamp, sorted', () => {
    const merged = mergeEntry(
      mk({ practiceNotes: [{ text: 'first', timestamp: 1 }] }),
      mk({ practiceNotes: [{ text: 'second', timestamp: 2 }] })
    )
    expect(merged.practiceNotes).toEqual([
      { text: 'first', timestamp: 1 },
      { text: 'second', timestamp: 2 },
    ])
  })

  it('resolves same-timestamp collisions deterministically, regardless of order', () => {
    const a = mk({ practiceNotes: [{ text: 'zebra', timestamp: 1 }] })
    const b = mk({ practiceNotes: [{ text: 'apple', timestamp: 1 }] })
    expect(mergeEntry(a, b).practiceNotes).toEqual([{ text: 'apple', timestamp: 1 }])
    expect(mergeEntry(b, a).practiceNotes).toEqual([{ text: 'apple', timestamp: 1 }])
  })

  it('keeps a tombstoned note deleted even when the other side still has it', () => {
    const withNote = mk({ practiceNotes: [{ text: 'gone', timestamp: 5 }] })
    const withTombstone = mk({ deletedNotes: [5] })
    const merged = mergeEntry(withNote, withTombstone)
    expect(merged.practiceNotes).toEqual([])
    expect(merged.deletedNotes).toEqual([5])
  })
})

describe('merge algebra', () => {
  const a = mk({ readAt: 10, practicedAt: 100, nextReviewDue: 500, reviewCount: 1,
                 practiceNotes: [{ text: 'a-note', timestamp: 3 }] })
  const b = mk({ readAt: 5, studiedAt: 20, practicedAt: 300, nextReviewDue: 700, reviewCount: 4,
                 practiceNotes: [{ text: 'b-note', timestamp: 8 }] })
  const c = mk({ studiedAt: 15, practicedAt: 200, nextReviewDue: 600, reviewCount: 2,
                 deletedNotes: [3] })

  it('is commutative', () => {
    expect(mergeEntry(a, b)).toEqual(mergeEntry(b, a))
    expect(mergeEntry(b, c)).toEqual(mergeEntry(c, b))
  })

  it('is associative', () => {
    expect(mergeEntry(mergeEntry(a, b), c)).toEqual(mergeEntry(a, mergeEntry(b, c)))
  })

  it('is idempotent', () => {
    expect(mergeEntry(a, a)).toEqual(normalizeEntry(a))
    expect(mergeEntry(mergeEntry(a, b), b)).toEqual(mergeEntry(a, b))
  })
})

describe('normalizeEntry', () => {
  it('fills missing note arrays left by older payloads', () => {
    const legacy = { slug: 's', readAt: 1, studiedAt: null, practicedAt: null,
                     reviewCount: 0, nextReviewDue: 0 } as unknown as ProgressEntry
    const norm = normalizeEntry(legacy)
    expect(norm.practiceNotes).toEqual([])
    expect(norm.deletedNotes).toEqual([])
  })

  it('backfills v2 scheduling fields on a v1 payload', () => {
    const v1 = { slug: 's', readAt: 1, studiedAt: null, practicedAt: null, practiceNotes: [],
                 reviewCount: 0, nextReviewDue: 0, deletedNotes: [] } as unknown as ProgressEntry
    const norm = normalizeEntry(v1)
    expect(norm.ease).toBe(2.5)
    expect(norm.intervalDays).toBe(0)
    expect(norm.reps).toBe(0)
  })
})

describe('v2 schedule merging', () => {
  it('takes ease, interval and reps from the same side as nextReviewDue', () => {
    const stale = mk({ practicedAt: 100, nextReviewDue: 9999, ease: 2.5, intervalDays: 60, reps: 6 })
    const fresh = mk({ practicedAt: 300, nextReviewDue: 400, ease: 1.7, intervalDays: 3, reps: 1 })
    for (const merged of [mergeEntry(stale, fresh), mergeEntry(fresh, stale)]) {
      expect(merged.nextReviewDue).toBe(400)
      expect(merged.ease).toBe(1.7)
      expect(merged.intervalDays).toBe(3)
      expect(merged.reps).toBe(1)
    }
  })

  it('stays commutative when only ease differs', () => {
    const a = mk({ practicedAt: 100, nextReviewDue: 500, ease: 2.5 })
    const b = mk({ practicedAt: 100, nextReviewDue: 500, ease: 1.9 })
    expect(mergeEntry(a, b)).toEqual(mergeEntry(b, a))
  })

  it('prefers the lower ease when schedules are otherwise identical, so a lapse is not lost', () => {
    const a = mk({ practicedAt: 100, nextReviewDue: 500, ease: 2.5 })
    const b = mk({ practicedAt: 100, nextReviewDue: 500, ease: 1.9 })
    expect(mergeEntry(a, b).ease).toBe(1.9)
  })

  it('never blends one side\'s ease with the other side\'s interval', () => {
    const a = mk({ practicedAt: 200, nextReviewDue: 800, ease: 2.5, intervalDays: 30, reps: 5 })
    const b = mk({ practicedAt: 100, nextReviewDue: 400, ease: 1.4, intervalDays: 2, reps: 1 })
    const m = mergeEntry(a, b)
    expect([m.ease, m.intervalDays, m.reps]).toEqual([2.5, 30, 5])
  })
})

describe('leaving the rotation survives a sync', () => {
  it('does not resurrect a removed topic from a device that still has it', () => {
    const stillHasIt = mk({ studiedAt: 100 })
    const removedIt = mk({ studiedAt: 100, rotationRemovedAt: 200 })
    for (const merged of [mergeEntry(stillHasIt, removedIt), mergeEntry(removedIt, stillHasIt)]) {
      expect(merged.studiedAt).toBe(100)
      expect(merged.rotationRemovedAt).toBe(200)
    }
  })

  it('lets a later re-add win over an earlier removal', () => {
    const merged = mergeEntry(
      mk({ studiedAt: 300, rotationRemovedAt: 200 }),
      mk({ studiedAt: 100, rotationRemovedAt: 200 })
    )
    expect(merged.studiedAt).toBe(300)
    expect(merged.rotationRemovedAt).toBe(200)
  })

  it('stays commutative and idempotent with tombstones present', () => {
    const a = mk({ studiedAt: 100, rotationRemovedAt: 400 })
    const b = mk({ studiedAt: 300, rotationRemovedAt: 200 })
    expect(mergeEntry(a, b)).toEqual(mergeEntry(b, a))
    expect(mergeEntry(mergeEntry(a, b), b)).toEqual(mergeEntry(a, b))
  })
})

describe('mergeStudyLog', () => {
  it('unions day strings without duplicates', () => {
    expect(mergeStudyLog(['Mon Jul 20 2026'], ['Mon Jul 20 2026', 'Tue Jul 21 2026']).sort())
      .toEqual(['Mon Jul 20 2026', 'Tue Jul 21 2026'])
  })

  it('tolerates undefined inputs', () => {
    expect(mergeStudyLog(undefined as unknown as string[], ['x'])).toEqual(['x'])
  })
})
