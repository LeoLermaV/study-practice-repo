import type { ProgressEntry, PracticeNote } from '../content/types'
import { DEFAULT_EASE } from './scheduler'

export function normalizeEntry(entry: ProgressEntry): ProgressEntry {
  return {
    ...entry,
    practiceNotes: entry.practiceNotes ?? [],
    deletedNotes: entry.deletedNotes ?? [],
    rotationRemovedAt: entry.rotationRemovedAt ?? null,
    ease: entry.ease ?? DEFAULT_EASE,
    intervalDays: entry.intervalDays ?? 0,
    reps: entry.reps ?? 0,
  }
}

/**
 * The scheduling fields form one unit — mixing another device's ease with this
 * device's interval yields a schedule neither ever computed. Picks a winner by
 * a total order so the choice is symmetric in its arguments.
 */
function pickSchedule(l: ProgressEntry, r: ProgressEntry): ProgressEntry {
  const lp = l.practicedAt ?? 0
  const rp = r.practicedAt ?? 0
  if (lp !== rp) return lp > rp ? l : r
  if (l.nextReviewDue !== r.nextReviewDue) return l.nextReviewDue > r.nextReviewDue ? l : r
  // Fully tied: prefer the more conservative schedule so a lapse is never lost.
  if (l.ease !== r.ease) return l.ease < r.ease ? l : r
  if (l.intervalDays !== r.intervalDays) return l.intervalDays < r.intervalDays ? l : r
  return l.reps <= r.reps ? l : r
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

  // The schedule belongs to whichever side practiced most recently.
  const schedule = pickSchedule(left, right)

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
    // studiedAt and rotationRemovedAt are both last-write-wins: they race each
    // other to decide rotation membership, so the most recent action must win.
    studiedAt: latest(left.studiedAt, right.studiedAt),
    rotationRemovedAt: latest(left.rotationRemovedAt, right.rotationRemovedAt),
    practicedAt: latest(left.practicedAt, right.practicedAt),
    practiceNotes: [...surviving.values()].sort((x, y) => x.timestamp - y.timestamp),
    reviewCount: Math.max(left.reviewCount, right.reviewCount),
    nextReviewDue: schedule.nextReviewDue,
    deletedNotes,
    ease: schedule.ease,
    intervalDays: schedule.intervalDays,
    reps: schedule.reps,
  }
}

export function mergeStudyLog(a: string[], b: string[]): string[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])]
}
