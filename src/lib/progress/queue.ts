import type { TopicMeta, ProgressEntry } from '../content/types'

export type QueueReason = 'review' | 'study' | 'new'
export type QueueMode = 'daily' | 'review'

export interface QueueItem {
  topic: TopicMeta
  reason: QueueReason
}

export interface QueueOptions {
  mode?: QueueMode
  limit?: number
  now?: number
}

const difficultyRank = { beginner: 0, intermediate: 1, advanced: 2 }

/**
 * In the rotation if it was added and not subsequently removed. Comparing the
 * two timestamps (rather than clearing studiedAt) keeps add/remove/re-add
 * resolvable when two devices disagree.
 */
export function isInRotation(entry: ProgressEntry | undefined): boolean {
  if (!entry?.studiedAt) return false
  return entry.rotationRemovedAt === null || entry.studiedAt > entry.rotationRemovedAt
}

/**
 * Single source of truth for "what should I work on".
 *
 * `daily` (home page) reserves a slot for unrotated and new material so a large
 * review backlog cannot freeze the list. `review` returns every due topic.
 */
export function buildQueue(
  topics: TopicMeta[],
  progress: ProgressEntry[],
  options: QueueOptions = {}
): QueueItem[] {
  const { mode = 'daily', limit = 5, now = Date.now() } = options
  const pmap = new Map(progress.map((p) => [p.slug, p]))

  const due: { topic: TopicMeta; dueAt: number }[] = []
  const unrotated: { topic: TopicMeta; readAt: number }[] = []
  const fresh: TopicMeta[] = []

  for (const topic of topics) {
    const entry = pmap.get(topic.slug)
    if (!entry) {
      fresh.push(topic)
    } else if (isInRotation(entry)) {
      if (entry.nextReviewDue <= now) due.push({ topic, dueAt: entry.nextReviewDue })
    } else if (entry.readAt) {
      unrotated.push({ topic, readAt: entry.readAt })
    } else {
      fresh.push(topic)
    }
  }

  // Most overdue first: reviewing the head pushes it back, so the list rotates.
  due.sort((a, b) => a.dueAt - b.dueAt)
  unrotated.sort((a, b) => a.readAt - b.readAt)

  if (mode === 'review') {
    return due.map(({ topic }) => ({ topic, reason: 'review' }))
  }

  const reviewSlots = Math.max(1, limit - 1)
  const queue: QueueItem[] = due
    .slice(0, reviewSlots)
    .map(({ topic }) => ({ topic, reason: 'review' as const }))

  for (const { topic } of unrotated) {
    if (queue.length >= limit) break
    queue.push({ topic, reason: 'study' })
  }

  if (queue.length < limit) {
    const started = new Set(progress.filter((p) => p.readAt !== null).map((p) => p.slug))
    const ready = fresh
      .filter((t) => t.prerequisites.length === 0 || t.prerequisites.some((p) => started.has(p)))
      .sort((a, b) => (difficultyRank[a.difficulty] ?? 0) - (difficultyRank[b.difficulty] ?? 0))
    for (const topic of ready) {
      if (queue.length >= limit) break
      queue.push({ topic, reason: 'new' })
    }
  }

  // Nothing else to show: fall back to the rest of the review backlog.
  for (const { topic } of due.slice(reviewSlots)) {
    if (queue.length >= limit) break
    queue.push({ topic, reason: 'review' })
  }

  return queue.slice(0, limit)
}
