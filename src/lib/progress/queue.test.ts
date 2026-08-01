import { describe, it, expect } from 'vitest'
import type { TopicMeta, ProgressEntry, Difficulty } from '../content/types'
import { buildQueue, isInRotation } from './queue'

const NOW = 1_000_000_000
const DAY = 86_400_000

function topic(slug: string, over: Partial<TopicMeta> = {}): TopicMeta {
  return {
    slug,
    title: slug,
    category: 'system-design',
    difficulty: 'beginner' as Difficulty,
    estimatedReadingTime: 5,
    tags: [],
    prerequisites: [],
    relatedTopics: [],
    sourceRepos: [],
    ...over,
  }
}

function entry(slug: string, over: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    slug,
    readAt: NOW - 10 * DAY,
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

const slugs = (items: { topic: TopicMeta }[]) => items.map((i) => i.topic.slug)

describe('isInRotation', () => {
  it('is true once a topic has been added', () => {
    expect(isInRotation(entry('a', { studiedAt: NOW }))).toBe(true)
    expect(isInRotation(entry('a'))).toBe(false)
    expect(isInRotation(undefined)).toBe(false)
  })

  it('is false after removal, and true again after a re-add', () => {
    expect(isInRotation(entry('a', { studiedAt: NOW, rotationRemovedAt: NOW + 1 }))).toBe(false)
    expect(isInRotation(entry('a', { studiedAt: NOW + 2, rotationRemovedAt: NOW + 1 }))).toBe(true)
  })
})

describe('removed topics', () => {
  it('drops out of the review queue but stays available as unrotated material', () => {
    const topics = [topic('a')]
    const removed = entry('a', {
      studiedAt: NOW - 5 * DAY,
      rotationRemovedAt: NOW - DAY,
      nextReviewDue: NOW - 2 * DAY,
      readAt: NOW - 6 * DAY,
    })
    expect(buildQueue(topics, [removed], { mode: 'review', now: NOW })).toHaveLength(0)
    expect(buildQueue(topics, [removed], { mode: 'daily', now: NOW })[0].reason).toBe('study')
  })
})

describe('review ordering', () => {
  it('puts the most overdue topic first', () => {
    const topics = [topic('a'), topic('b'), topic('c')]
    const progress = [
      entry('a', { studiedAt: NOW, nextReviewDue: NOW - 1 * DAY }),
      entry('b', { studiedAt: NOW, nextReviewDue: NOW - 9 * DAY }),
      entry('c', { studiedAt: NOW, nextReviewDue: NOW - 5 * DAY }),
    ]
    expect(slugs(buildQueue(topics, progress, { now: NOW }))).toEqual(['b', 'c', 'a'])
  })

  it('excludes rotated topics that are not due yet', () => {
    const topics = [topic('a'), topic('b')]
    const progress = [
      entry('a', { studiedAt: NOW, nextReviewDue: NOW + 3 * DAY }),
      entry('b', { studiedAt: NOW, nextReviewDue: NOW - 1 * DAY }),
    ]
    expect(slugs(buildQueue(topics, progress, { now: NOW }))).toEqual(['b'])
  })
})

describe('daily mode reserves room for new material', () => {
  // Regression: 16 due topics used to fill every slot, so reading anything new
  // had no visible effect on the home page.
  it('still surfaces unrotated material behind a large review backlog', () => {
    const backlog = Array.from({ length: 16 }, (_, i) => topic(`due-${i}`))
    const justRead = topic('just-read')
    const progress = [
      ...backlog.map((t, i) => entry(t.slug, { studiedAt: NOW, nextReviewDue: NOW - (i + 1) * DAY })),
      entry('just-read', { readAt: NOW - 1000 }),
    ]

    const q = buildQueue([...backlog, justRead], progress, { now: NOW, limit: 5 })
    expect(q).toHaveLength(5)
    expect(slugs(q)).toContain('just-read')
    expect(q.filter((i) => i.reason === 'review')).toHaveLength(4)
  })

  it('fills the reserved slot with review backlog when nothing else is waiting', () => {
    const backlog = Array.from({ length: 8 }, (_, i) => topic(`due-${i}`))
    const progress = backlog.map((t, i) =>
      entry(t.slug, { studiedAt: NOW, nextReviewDue: NOW - (i + 1) * DAY })
    )
    const q = buildQueue(backlog, progress, { now: NOW, limit: 5 })
    expect(q).toHaveLength(5)
    expect(q.every((i) => i.reason === 'review')).toBe(true)
  })

  it('rotates as the head topic is reviewed', () => {
    const topics = [topic('a'), topic('b'), topic('c')]
    const overdue = (slug: string, days: number) =>
      entry(slug, { studiedAt: NOW, nextReviewDue: NOW - days * DAY })

    const before = buildQueue(topics, [overdue('a', 9), overdue('b', 5), overdue('c', 2)], { now: NOW })
    expect(slugs(before)[0]).toBe('a')

    // 'a' reviewed: its next due date moves into the future.
    const after = buildQueue(
      topics,
      [entry('a', { studiedAt: NOW, nextReviewDue: NOW + 6 * DAY }), overdue('b', 5), overdue('c', 2)],
      { now: NOW }
    )
    expect(slugs(after)).toEqual(['b', 'c'])
  })
})

describe('review mode', () => {
  it('returns every due topic and never new material', () => {
    const topics = [topic('a'), topic('b'), topic('unseen')]
    const progress = [
      entry('a', { studiedAt: NOW, nextReviewDue: NOW - DAY }),
      entry('b', { studiedAt: NOW, nextReviewDue: NOW - 2 * DAY }),
    ]
    const q = buildQueue(topics, progress, { mode: 'review', now: NOW })
    expect(slugs(q)).toEqual(['b', 'a'])
    expect(q.every((i) => i.reason === 'review')).toBe(true)
  })

  it('ignores the limit', () => {
    const many = Array.from({ length: 20 }, (_, i) => topic(`t-${i}`))
    const progress = many.map((t, i) => entry(t.slug, { studiedAt: NOW, nextReviewDue: NOW - (i + 1) * DAY }))
    expect(buildQueue(many, progress, { mode: 'review', now: NOW, limit: 5 })).toHaveLength(20)
  })
})

describe('new material', () => {
  it('gates on prerequisites being started', () => {
    const topics = [
      topic('basics'),
      topic('advanced', { prerequisites: ['basics'] }),
      topic('unreachable', { prerequisites: ['never-touched'] }),
    ]
    const q = buildQueue(topics, [entry('basics', { readAt: NOW - DAY })], { now: NOW })
    expect(slugs(q)).toContain('advanced')
    expect(slugs(q)).not.toContain('unreachable')
  })

  it('offers easier topics first', () => {
    const topics = [
      topic('hard', { difficulty: 'advanced' }),
      topic('easy', { difficulty: 'beginner' }),
    ]
    expect(slugs(buildQueue(topics, [], { now: NOW }))).toEqual(['easy', 'hard'])
  })
})
