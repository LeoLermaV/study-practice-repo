import { z } from 'zod'
import type { ProgressEntry } from '../content/types'
import { normalizeEntry } from './merge'
import type { SyncPayload } from './sync'

const noteSchema = z.object({ text: z.string(), timestamp: z.number() })

const entrySchema = z.object({
  slug: z.string().min(1),
  readAt: z.number().nullable(),
  studiedAt: z.number().nullable(),
  rotationRemovedAt: z.number().nullable().optional(),
  practicedAt: z.number().nullable(),
  practiceNotes: z.array(noteSchema).optional(),
  reviewCount: z.number(),
  nextReviewDue: z.number(),
  deletedNotes: z.array(z.number()).optional(),
  ease: z.number().optional(),
  intervalDays: z.number().optional(),
  reps: z.number().optional(),
})

const payloadSchema = z.object({
  version: z.literal(1),
  updatedAt: z.number(),
  entries: z.record(z.string(), entrySchema),
  studyLog: z.array(z.string()),
})

export class BackupError extends Error {}

/**
 * Validates a backup file (the same shape Gist sync uses) and fills fields
 * older exports may lack. Throws BackupError with a message fit for the UI.
 */
export function parseBackup(text: string): SyncPayload {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('This file is not valid JSON. Choose a file saved with "Export progress".')
  }
  const result = payloadSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    const where = issue.path.length ? ` (at ${issue.path.join('.')})` : ''
    throw new BackupError(`This does not look like a FAANG Study backup${where}.`)
  }
  const entries: Record<string, ProgressEntry> = {}
  for (const [key, entry] of Object.entries(result.data.entries)) {
    // The key is authoritative: it is what the entry is stored under.
    entries[key] = normalizeEntry({ ...entry, slug: key } as ProgressEntry)
  }
  return { ...result.data, entries }
}

/** "faang-study-progress-2026-09-30.json", in local time. */
export function backupFileName(now: number): string {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `faang-study-progress-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
}
