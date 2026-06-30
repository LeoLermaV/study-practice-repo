import type { TopicMeta, ProgressEntry } from '../content/types'

export interface QueueItem {
  topic: TopicMeta
  reason: 'review' | 'practice' | 'study' | 'new'
}

const difficultyRank = { beginner: 0, intermediate: 1, advanced: 2 }

export function buildDailyQueue(
  topics: TopicMeta[],
  progress: ProgressEntry[],
  maxItems = 5
): QueueItem[] {
  const now = Date.now()
  const pmap = new Map(progress.map((p) => [p.slug, p]))
  const queue: QueueItem[] = []

  const unread: TopicMeta[] = []
  const readOnly: TopicMeta[] = []
  const studiedOnly: TopicMeta[] = []
  const practicedDue: TopicMeta[] = []

  for (const t of topics) {
    const p = pmap.get(t.slug)
    if (!p) {
      unread.push(t)
      continue
    }
    if (p.practicedAt && p.nextReviewDue <= now && p.readAt) {
      practicedDue.push(t)
    } else if (p.practicedAt) {
      // already practiced, not due — skip
    } else if (p.studiedAt) {
      studiedOnly.push(t)
    } else if (p.readAt) {
      readOnly.push(t)
    } else {
      unread.push(t)
    }
  }

  const sortByDifficulty = (a: TopicMeta, b: TopicMeta) =>
    (difficultyRank[a.difficulty] ?? 0) - (difficultyRank[b.difficulty] ?? 0)

  practicedDue.sort(sortByDifficulty)
  studiedOnly.sort(sortByDifficulty)
  readOnly.sort(sortByDifficulty)

  queue.push(...practicedDue.map((t) => ({ topic: t, reason: 'review' as const })))
  queue.push(...studiedOnly.map((t) => ({ topic: t, reason: 'practice' as const })))
  queue.push(...readOnly.map((t) => ({ topic: t, reason: 'study' as const })))

  if (queue.length < maxItems) {
    const completedSlugs = new Set(
      progress.filter((p) => p.readAt !== null).map((p) => p.slug)
    )
    const ready = unread
      .filter((t) => t.prerequisites.length === 0 || t.prerequisites.some((p) => completedSlugs.has(p)))
      .sort(sortByDifficulty)
    queue.push(...ready.map((t) => ({ topic: t, reason: 'new' as const })))
  }

  return queue.slice(0, maxItems)
}
