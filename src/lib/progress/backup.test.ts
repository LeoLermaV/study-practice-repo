import { describe, it, expect } from 'vitest'
import { parseBackup, backupFileName, BackupError } from './backup'

const entry = {
  slug: 'caching',
  readAt: 1,
  studiedAt: 2,
  rotationRemovedAt: null,
  practicedAt: null,
  practiceNotes: [{ text: 'LRU vs LFU', timestamp: 3 }],
  reviewCount: 0,
  nextReviewDue: 4,
  deletedNotes: [],
  ease: 2.5,
  intervalDays: 1,
  reps: 0,
}

const file = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ version: 1, updatedAt: 10, entries: { caching: entry }, studyLog: ['Wed Sep 30 2026'], ...over })

describe('parseBackup', () => {
  it('round-trips an export', () => {
    const p = parseBackup(file())
    expect(p.entries.caching).toEqual(entry)
    expect(p.studyLog).toEqual(['Wed Sep 30 2026'])
  })

  it('fills fields that older exports lack', () => {
    const { rotationRemovedAt, practiceNotes, deletedNotes, ease, intervalDays, reps, ...old } = entry
    void rotationRemovedAt; void practiceNotes; void deletedNotes; void ease; void intervalDays; void reps
    const p = parseBackup(file({ entries: { caching: old } }))
    expect(p.entries.caching).toMatchObject({ practiceNotes: [], deletedNotes: [], rotationRemovedAt: null, ease: 2.5, intervalDays: 0, reps: 0 })
  })

  it('uses the storage key as the slug', () => {
    const p = parseBackup(file({ entries: { proxy: { ...entry, slug: 'something-else' } } }))
    expect(p.entries.proxy.slug).toBe('proxy')
  })

  it('rejects files that are not JSON', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError)
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/)
  })

  it('rejects other JSON with a pointer to the problem', () => {
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow(/does not look like a FAANG Study backup/)
    expect(() => parseBackup(file({ version: 2 }))).toThrow(/at version/)
    expect(() => parseBackup(file({ entries: { caching: { ...entry, readAt: 'yesterday' } } }))).toThrow(/entries\.caching\.readAt/)
  })
})

describe('backupFileName', () => {
  it('uses the local date', () => {
    expect(backupFileName(new Date(2026, 0, 5, 23, 30).getTime())).toBe('faang-study-progress-2026-01-05.json')
  })
})
