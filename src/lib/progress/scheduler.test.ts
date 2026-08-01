import { describe, it, expect } from 'vitest'
import { nextSchedule, initialSchedule, backfillSchedule, DEFAULT_EASE, MIN_EASE, MAX_EASE } from './scheduler'

const DAY_MS = 86_400_000
const NOW = 1_000_000

describe('initialSchedule', () => {
  it('starts at the default ease with nothing scheduled', () => {
    const s = initialSchedule(NOW)
    expect(s).toEqual({ ease: DEFAULT_EASE, intervalDays: 0, reps: 0, dueAt: NOW })
  })
})

describe('lapses', () => {
  it('resets reps and interval, and re-shows within the session', () => {
    const s = nextSchedule({ ease: 2.5, intervalDays: 60, reps: 6 }, 'again', NOW)
    expect(s.reps).toBe(0)
    expect(s.intervalDays).toBe(0)
    expect(s.dueAt).toBe(NOW + 10 * 60_000)
  })

  it('drives ease to the floor under repeated failure, and never below', () => {
    let s = { ease: DEFAULT_EASE, intervalDays: 10, reps: 3 }
    for (let i = 0; i < 20; i++) s = nextSchedule(s, 'again', NOW)
    expect(s.ease).toBe(MIN_EASE)
  })
})

describe('ease adjustment', () => {
  const from = { ease: 2.0, intervalDays: 10, reps: 3 }

  it('drops sharply on "again"', () => {
    expect(nextSchedule(from, 'again', NOW).ease).toBeCloseTo(1.68, 5)
  })

  it('drops slightly on "hard"', () => {
    expect(nextSchedule(from, 'hard', NOW).ease).toBeCloseTo(1.86, 5)
  })

  it('is unchanged on "good"', () => {
    expect(nextSchedule(from, 'good', NOW).ease).toBeCloseTo(2.0, 5)
  })

  it('rises on "easy" but is capped', () => {
    expect(nextSchedule(from, 'easy', NOW).ease).toBeCloseTo(2.1, 5)
    expect(nextSchedule({ ...from, ease: MAX_EASE }, 'easy', NOW).ease).toBe(MAX_EASE)
  })
})

describe('interval progression', () => {
  const fresh = { ease: DEFAULT_EASE, intervalDays: 0, reps: 0 }

  it('gives one day on the first successful review', () => {
    expect(nextSchedule(fresh, 'good', NOW).intervalDays).toBe(1)
  })

  it('gives four days when the first review is "easy"', () => {
    expect(nextSchedule(fresh, 'easy', NOW).intervalDays).toBe(4)
  })

  it('gives six days on the second review', () => {
    expect(nextSchedule({ ease: 2.5, intervalDays: 1, reps: 1 }, 'good', NOW).intervalDays).toBe(6)
  })

  it('multiplies by ease from the third review on', () => {
    expect(nextSchedule({ ease: 2.5, intervalDays: 6, reps: 2 }, 'good', NOW).intervalDays).toBe(15)
  })

  it('grows slowly on "hard", and always by at least a day', () => {
    expect(nextSchedule({ ease: 2.0, intervalDays: 10, reps: 4 }, 'hard', NOW).intervalDays).toBe(12)
    expect(nextSchedule({ ease: 2.0, intervalDays: 1, reps: 4 }, 'hard', NOW).intervalDays).toBe(2)
  })

  it('sets dueAt from the computed interval', () => {
    const s = nextSchedule({ ease: 2.5, intervalDays: 6, reps: 2 }, 'good', NOW)
    expect(s.dueAt).toBe(NOW + 15 * DAY_MS)
  })
})

describe('backfillSchedule (v1 → v2 migration)', () => {
  const DAY = 86_400_000

  it('reconstructs the interval that was actually in force', () => {
    const v1 = { readAt: NOW - 30 * DAY, studiedAt: NOW - 20 * DAY, practicedAt: NOW - 14 * DAY,
                 reviewCount: 3, nextReviewDue: NOW }
    const out = backfillSchedule(v1)
    expect(out.intervalDays).toBe(14)
    expect(out.reps).toBe(3)
    expect(out.ease).toBe(DEFAULT_EASE)
  })

  it('falls back to studiedAt, then readAt, for the anchor', () => {
    expect(backfillSchedule({ readAt: NOW - 7 * DAY, studiedAt: null, practicedAt: null,
                              reviewCount: 0, nextReviewDue: NOW }).intervalDays).toBe(7)
    expect(backfillSchedule({ readAt: NOW - 30 * DAY, studiedAt: NOW - 3 * DAY, practicedAt: null,
                              reviewCount: 0, nextReviewDue: NOW }).intervalDays).toBe(3)
  })

  it('yields a zero interval when no date can anchor it', () => {
    expect(backfillSchedule({ readAt: null, studiedAt: null, practicedAt: null,
                              reviewCount: 0, nextReviewDue: 0 }).intervalDays).toBe(0)
  })

  it('never re-migrates an entry that already has an ease', () => {
    const v2 = { readAt: NOW, studiedAt: NOW, practicedAt: NOW, reviewCount: 9,
                 nextReviewDue: NOW, ease: 1.7, intervalDays: 42, reps: 4 }
    expect(backfillSchedule(v2)).toEqual(v2)
  })

  it('preserves every other field untouched', () => {
    const v1 = { readAt: 111, studiedAt: 222, practicedAt: 333, reviewCount: 2,
                 nextReviewDue: 444, slug: 'x', practiceNotes: [{ text: 'n', timestamp: 1 }] }
    const out = backfillSchedule(v1)
    expect(out.slug).toBe('x')
    expect(out.practiceNotes).toEqual([{ text: 'n', timestamp: 1 }])
    expect([out.readAt, out.studiedAt, out.practicedAt, out.nextReviewDue]).toEqual([111, 222, 333, 444])
  })
})

describe('ease is what drives growth', () => {
  // The property the old table-based scheduler could not express: two topics at
  // the same review count and interval diverge because one is harder for you.
  it('shortens future intervals for a topic with lower ease', () => {
    const easy = nextSchedule({ ease: 2.5, intervalDays: 10, reps: 5 }, 'good', NOW)
    const hard = nextSchedule({ ease: 1.5, intervalDays: 10, reps: 5 }, 'good', NOW)
    expect(easy.intervalDays).toBe(25)
    expect(hard.intervalDays).toBe(15)
  })

  it('keeps a repeatedly-failed topic in a short cycle', () => {
    let s = { ease: DEFAULT_EASE, intervalDays: 0, reps: 0 }
    for (let i = 0; i < 5; i++) {
      s = nextSchedule(s, 'good', NOW)
      s = nextSchedule(s, 'again', NOW)
    }
    // Five lapses have pinned ease near the floor, so recovery restarts short.
    expect(s.ease).toBeCloseTo(MIN_EASE, 5)
    const recovered = nextSchedule(s, 'good', NOW)
    expect(recovered.intervalDays).toBe(1)
  })
})
