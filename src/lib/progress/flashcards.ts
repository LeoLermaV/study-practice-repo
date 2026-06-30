import type { TopicMeta, ProgressEntry } from '../content/types'

const difficultyRank = { beginner: 0, intermediate: 1, advanced: 2 }

export interface FlashcardItem {
  topic: TopicMeta
}

export function buildFlashcardQueue(
  topics: TopicMeta[],
  progress: ProgressEntry[],
  maxNew = 5
): FlashcardItem[] {
  const now = Date.now()
  const pmap = new Map(progress.map((p) => [p.slug, p]))
  const queue: FlashcardItem[] = []

  const due: TopicMeta[] = []
  const studiedOnly: TopicMeta[] = []
  const readOnly: TopicMeta[] = []
  const fresh: TopicMeta[] = []

  for (const t of topics) {
    const p = pmap.get(t.slug)
    if (!p) {
      fresh.push(t)
      continue
    }
    if (p.practicedAt && p.nextReviewDue <= now) {
      due.push(t)
    } else if (p.practicedAt) {
      // already practiced, not due — skip
    } else if (p.studiedAt) {
      studiedOnly.push(t)
    } else if (p.readAt) {
      readOnly.push(t)
    } else {
      fresh.push(t)
    }
  }

  const sort = (a: TopicMeta, b: TopicMeta) =>
    (difficultyRank[a.difficulty] ?? 0) - (difficultyRank[b.difficulty] ?? 0)

  due.sort(sort)
  studiedOnly.sort(sort)
  readOnly.sort(sort)
  fresh.sort(sort).slice(0, maxNew)

  queue.push(...due.map((t) => ({ topic: t })))
  queue.push(...studiedOnly.map((t) => ({ topic: t })))
  queue.push(...readOnly.map((t) => ({ topic: t })))
  queue.push(...fresh.slice(0, maxNew).map((t) => ({ topic: t })))

  return queue
}

const intervals = [1, 3, 7, 14, 30, 60]

export function nextReviewDue(reviewCount: number, ease: 'again' | 'hard' | 'good' | 'easy'): number {
  const idx = Math.min(reviewCount, intervals.length - 1)
  const base = intervals[idx]
  const multipliers = { again: 0, hard: 0.5, good: 1, easy: 2 }
  const days = base * (multipliers[ease] ?? 1)
  return Date.now() + Math.max(days, ease === 'again' ? 0.01 : 0.5) * 86400000
}
