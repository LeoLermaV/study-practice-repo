import { get, set, del, keys } from 'idb-keyval'
import type { ProgressEntry, PracticeNote, StudyStats } from '../content/types'
import { autoPush } from './sync'

const PROGRESS_PREFIX = 'progress:'
const STUDY_LOG_KEY = 'study-log'

const intervals = [1, 3, 7, 14, 30, 60]

function migrateEntry(raw: unknown): ProgressEntry | undefined {
  if (!raw) return undefined
  const entry = raw as Record<string, unknown>
  if (entry.status !== undefined) {
    const now = (entry.lastStudied as number) ?? Date.now()
    const s = entry.status as string
    return {
      slug: entry.slug as string,
      readAt: s !== 'not-started' ? now : null,
      studiedAt: ['understood', 'reviewed', 'mastered'].includes(s) ? now : null,
      practicedAt: ['reviewed', 'mastered'].includes(s) ? now : null,
      practiceNotes: [],
      reviewCount: (entry.reviewCount as number) ?? 0,
      nextReviewDue: (entry.nextReviewDue as number) ?? (now + 86400000),
    }
  }
  if (entry.readAt === undefined) return undefined
  return entry as unknown as ProgressEntry
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

function nextDue(reviewCount: number): number {
  const idx = Math.min(reviewCount, intervals.length - 1)
  return Date.now() + intervals[idx] * 86400000
}

export async function markRead(slug: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  if (existing?.readAt) return existing
  const entry: ProgressEntry = {
    slug,
    readAt: now,
    studiedAt: existing?.studiedAt ?? null,
    practicedAt: existing?.practicedAt ?? null,
    practiceNotes: existing?.practiceNotes ?? [],
    reviewCount: existing?.reviewCount ?? 0,
    nextReviewDue: existing?.nextReviewDue ?? (now + 86400000),
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  return entry
}
export async function markStudied(slug: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  if (existing?.studiedAt) return existing
  const entry: ProgressEntry = {
    slug,
    readAt: existing?.readAt ?? now,
    studiedAt: now,
    practicedAt: existing?.practicedAt ?? null,
    practiceNotes: existing?.practiceNotes ?? [],
    reviewCount: existing?.reviewCount ?? 0,
    nextReviewDue: existing?.nextReviewDue ?? (now + 86400000),
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  return entry
}
export async function markPracticed(slug: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  const rc = (existing?.reviewCount ?? 0) + 1
  const entry: ProgressEntry = {
    slug,
    readAt: existing?.readAt ?? now,
    studiedAt: existing?.studiedAt ?? now,
    practicedAt: now,
    practiceNotes: existing?.practiceNotes ?? [],
    reviewCount: rc,
    nextReviewDue: nextDue(rc),
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  return entry
}
export async function addPracticeNote(slug: string, text: string): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  const now = Date.now()
  const note: PracticeNote = { text, timestamp: now }
  const rc = (existing?.reviewCount ?? 0) + 1
  const entry: ProgressEntry = {
    slug,
    readAt: existing?.readAt ?? now,
    studiedAt: existing?.studiedAt ?? now,
    practicedAt: existing?.practicedAt ?? now,
    practiceNotes: [...(existing?.practiceNotes ?? []), note],
    reviewCount: rc,
    nextReviewDue: nextDue(rc),
  }
  await setProgress(slug, entry)
  await logStudyDay(now)
  autoPush()
  return entry
}
export async function removePracticeNote(slug: string, timestamp: number): Promise<ProgressEntry> {
  const existing = await getProgress(slug)
  if (!existing) throw new Error('No progress entry')
  const entry: ProgressEntry = {
    ...existing,
    practiceNotes: existing.practiceNotes.filter((n) => n.timestamp !== timestamp),
  }
  await setProgress(slug, entry)
  return entry
}

export async function getDueTopics(): Promise<ProgressEntry[]> {
  const all = await getAllProgress()
  const now = Date.now()
  return all.filter((e) => e.nextReviewDue <= now && e.practicedAt !== null)
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
    if (e.studiedAt) totalStudied++
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
    topicsDueForReview: all.filter((e) => e.nextReviewDue <= now && e.practicedAt !== null).length,
    recentlyStudied: touched.slice(0, 10),
  }
}

async function calculateStreak(): Promise<number> {
  const dates: string[] = await get(STUDY_LOG_KEY) ?? []
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort().reverse()
  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    const curr = new Date(unique[i])
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000
    if (Math.round(diffDays) === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}
