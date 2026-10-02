import { get, set, keys } from 'idb-keyval'
import type { ProgressEntry, PracticeNote, StudyStats } from '../content/types'
import { autoPush } from './sync'
import { notifyProgressChanged } from './events'
import { streakFromDates } from './streak'
import { normalizeEntry } from './merge'
import { isInRotation } from './queue'
import { staggeredFirstReviews } from './status'
import { DEFAULT_EASE, backfillSchedule, initialSchedule, nextSchedule, type Rating } from './scheduler'

const PROGRESS_PREFIX = 'progress:'
const STUDY_LOG_KEY = 'study-log'

const DAY_MS = 86_400_000

function migrateEntry(raw: unknown): ProgressEntry | undefined {
  if (!raw) return undefined
  const entry = raw as Record<string, unknown>
  if (entry.status !== undefined) {
    const now = (entry.lastStudied as number) ?? Date.now()
    const s = entry.status as string
    const reviewCount = (entry.reviewCount as number) ?? 0
    return {
      slug: entry.slug as string,
      readAt: s !== 'not-started' ? now : null,
      studiedAt: ['understood', 'reviewed', 'mastered'].includes(s) ? now : null,
      rotationRemovedAt: null,
      practicedAt: ['reviewed', 'mastered'].includes(s) ? now : null,
      practiceNotes: [],
      reviewCount,
      nextReviewDue: (entry.nextReviewDue as number) ?? (now + DAY_MS),
      deletedNotes: [],
      ease: DEFAULT_EASE,
      intervalDays: 0,
      reps: reviewCount,
    }
  }
  if (entry.readAt === undefined) return undefined
  return normalizeEntry(backfillSchedule(entry as unknown as ProgressEntry))
}

export async function getProgress(slug: string): Promise<ProgressEntry | undefined> {
  return migrateEntry(await get(`${PROGRESS_PREFIX}${slug}`))
}

export async function setProgress(slug: string, entry: ProgressEntry): Promise<void> {
  await set(`${PROGRESS_PREFIX}${slug}`, entry)
}

export async function getAllProgress(): Promise<ProgressEntry[]> {
  const allKeys = await keys()
  const progressKeys = allKeys.filter((k) => (k as string).startsWith(PROGRESS_PREFIX))
  const allEntries = await Promise.all(
    progressKeys.map((k) => get(k as string) as Promise<unknown>)
  )
  return allEntries.map(migrateEntry).filter((e): e is ProgressEntry => e !== undefined)
}

async function logStudyDay(timestamp: number) {
  const dates: string[] = await get(STUDY_LOG_KEY) ?? []
  const today = new Date(timestamp).toDateString()
  if (!dates.includes(today)) {
    dates.push(today)
    await set(STUDY_LOG_KEY, dates)
  }
}

function freshEntry(slug: string, now: number): ProgressEntry {
  const { ease, intervalDays, reps } = initialSchedule(now)
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
    ease,
    intervalDays,
    reps,
  }
}

export async function markRead(slug: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  if (existing?.readAt) return existing
  const entry: ProgressEntry = { ...(existing ?? freshEntry(slug, now)), slug, readAt: now }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  notifyProgressChanged()
  return entry
}

/** Adds the topic to the review rotation. First review lands tomorrow. */
export async function markStudied(slug: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  if (isInRotation(existing)) return existing!
  const base = existing ?? freshEntry(slug, now)
  const entry: ProgressEntry = {
    ...base,
    slug,
    readAt: base.readAt ?? now,
    studiedAt: now,
    nextReviewDue: now + DAY_MS,
    intervalDays: 1,
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  notifyProgressChanged()
  return entry
}

/**
 * Adds several topics to the rotation at once (e.g. a whole library section),
 * spreading first re-reads `perDay` per day. Topics already in the rotation
 * are left alone. Returns the entries that were added.
 */
export async function markManyStudied(slugs: string[], perDay = 3): Promise<ProgressEntry[]> {
  const now = Date.now()
  const pending: { slug: string; base: ProgressEntry }[] = []
  for (const slug of new Set(slugs)) {
    const existing = await getProgress(slug)
    if (!isInRotation(existing)) pending.push({ slug, base: existing ?? freshEntry(slug, now) })
  }
  const offsets = staggeredFirstReviews(pending.length, perDay)
  const added: ProgressEntry[] = []
  for (const [i, { slug, base }] of pending.entries()) {
    const entry: ProgressEntry = {
      ...base,
      slug,
      readAt: base.readAt ?? now,
      studiedAt: now,
      nextReviewDue: now + offsets[i] * DAY_MS,
      intervalDays: offsets[i],
    }
    await setProgress(slug, entry)
    added.push(entry)
  }
  if (added.length > 0) {
    await logStudyDay(now)
    autoPush()
    notifyProgressChanged()
  }
  return added
}

/**
 * Undo for a mistaken "Add to review". Tombstoned rather than cleared, so a
 * device that still has the topic in rotation cannot resurrect it on sync.
 * Reading history and notes are kept; only rotation membership changes.
 */
export async function removeFromRotation(slug: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  const base = existing ?? freshEntry(slug, now)
  const entry: ProgressEntry = { ...base, slug, rotationRemovedAt: now }
  await setProgress(slug, entry)
  autoPush()
  notifyProgressChanged()
  return entry
}

/**
 * Records a recall rating and reschedules via SM-2. Safe to call on a topic
 * that was never explicitly added to the rotation — it joins on first rating.
 */
export async function rateReview(slug: string, rating: Rating): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  const base = existing ?? freshEntry(slug, now)
  const schedule = nextSchedule(base, rating, now)
  const entry: ProgressEntry = {
    ...base,
    slug,
    readAt: base.readAt ?? now,
    studiedAt: base.studiedAt ?? now,
    practicedAt: now,
    reviewCount: base.reviewCount + (rating === 'again' ? 0 : 1),
    nextReviewDue: schedule.dueAt,
    ease: schedule.ease,
    intervalDays: schedule.intervalDays,
    reps: schedule.reps,
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  notifyProgressChanged()
  return entry
}

export async function markPracticed(slug: string): Promise<ProgressEntry> {
  return rateReview(slug, 'good')
}

/** Notes are annotations only — they no longer disturb the review schedule. */
export async function addPracticeNote(slug: string, text: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  const base = existing ?? freshEntry(slug, now)
  const note: PracticeNote = { text, timestamp: now }
  const entry: ProgressEntry = {
    ...base,
    slug,
    readAt: base.readAt ?? now,
    studiedAt: base.studiedAt ?? now,
    practiceNotes: [...base.practiceNotes, note],
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  notifyProgressChanged()
  return entry
}

export async function removePracticeNote(slug: string, timestamp: number): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  if (!existing) throw new Error('No progress entry')
  // Tombstone, not just a filter: notes union-merge across devices, so without
  // this the deleted note reappears on the next pull.
  const entry: ProgressEntry = {
    ...existing,
    practiceNotes: existing.practiceNotes.filter((n) => n.timestamp !== timestamp),
    deletedNotes: [...new Set([...existing.deletedNotes, timestamp])].sort((a, b) => a - b),
  }
  await setProgress(slug, entry)
  autoPush()
  notifyProgressChanged()
  return entry
}

export async function getDueTopics(): Promise<ProgressEntry[]> {
  const all = await getAllProgress()
  const now = Date.now()
  return all.filter((e) => isInRotation(e) && e.nextReviewDue <= now)
}

export async function getStudyStats(): Promise<StudyStats> {
  const all = await getAllProgress()
  const now = Date.now()
  const weekAgo = now - 7 * 86400000

  let totalRead = 0
  let totalStudied = 0
  let totalPracticed = 0

  const touched: { slug: string; lastTouched: number }[] = []

  for (const e of all) {
    if (e.readAt) totalRead++
    if (isInRotation(e)) totalStudied++
    if (e.practicedAt) totalPracticed++

    const timestamps = [
      e.readAt ? { slug: e.slug, t: e.readAt } : null,
      e.studiedAt ? { slug: e.slug, t: e.studiedAt } : null,
      e.practicedAt ? { slug: e.slug, t: e.practicedAt } : null,
    ].filter((x): x is { slug: string; t: number } => x !== null)

    for (const { slug, t } of timestamps) {
      if (t >= weekAgo) {
        touched.push({ slug, lastTouched: t })
      }
    }
  }

  touched.sort((a, b) => b.lastTouched - a.lastTouched)

  const streak = await calculateStreak()

  return {
    currentStreak: streak,
    longestStreak: streak,
    totalRead,
    totalStudied,
    totalPracticed,
    topicsDueForReview: all.filter((e) => isInRotation(e) && e.nextReviewDue <= now).length,
    recentlyStudied: touched.slice(0, 10),
  }
}

async function calculateStreak(): Promise<number> {
  const dates: string[] = await get(STUDY_LOG_KEY) ?? []
  return streakFromDates(dates, Date.now())
}
