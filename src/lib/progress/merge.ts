import type { ProgressEntry, PracticeNote } from '../content/types'

export function normalizeEntry(entry: ProgressEntry): ProgressEntry {
  return { ...entry, practiceNotes: entry.practiceNotes ?? [], deletedNotes: entry.deletedNotes ?? [] }
}

function earliest(a: number | null, b: number | null): number | null {
  if (a === null) return b
  if (b === null) return a
  return Math.min(a, b)
}

function latest(a: number | null, b: number | null): number | null {
  if (a === null) return b
  if (b === null) return a
  return Math.max(a, b)
}

/**
 * Commutative, associative and idempotent over normalized entries, so the order
 * in which devices push and pull cannot lose data.
 */
export function mergeEntry(a: ProgressEntry, b: ProgressEntry): ProgressEntry {
  const left = normalizeEntry(a)
  const right = normalizeEntry(b)

  // Lexicographic max over (practicedAt, nextReviewDue): the schedule belongs to
  // whichever side practiced most recently.
  const leftPracticed = left.practicedAt ?? 0
  const rightPracticed = right.practicedAt ?? 0
  const nextReviewDue =
    leftPracticed === rightPracticed
      ? Math.max(left.nextReviewDue, right.nextReviewDue)
      : leftPracticed > rightPracticed
        ? left.nextReviewDue
        : right.nextReviewDue

  const deletedNotes = [...new Set([...left.deletedNotes, ...right.deletedNotes])].sort((x, y) => x - y)
  const tombstoned = new Set(deletedNotes)

  const surviving = new Map<number, PracticeNote>()
  for (const note of [...left.practiceNotes, ...right.practiceNotes]) {
    if (tombstoned.has(note.timestamp)) continue
    const clash = surviving.get(note.timestamp)
    // Same-timestamp notes from different devices: pick deterministically so the
    // merge stays commutative.
    if (!clash || note.text < clash.text) surviving.set(note.timestamp, note)
  }

  return {
    slug: left.slug,
    readAt: earliest(left.readAt, right.readAt),
    studiedAt: earliest(left.studiedAt, right.studiedAt),
    practicedAt: latest(left.practicedAt, right.practicedAt),
    practiceNotes: [...surviving.values()].sort((x, y) => x.timestamp - y.timestamp),
    reviewCount: Math.max(left.reviewCount, right.reviewCount),
    nextReviewDue,
    deletedNotes,
  }
}

export function mergeStudyLog(a: string[], b: string[]): string[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])]
}
