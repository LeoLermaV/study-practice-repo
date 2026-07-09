import { get, set, keys as idbKeys } from 'idb-keyval'
import type { ProgressEntry } from '../content/types'
import { mergeEntry, mergeStudyLog, normalizeEntry } from './merge'

const GIST_FILENAME = 'faang-study-progress.json'
const GIST_DESCRIPTION = 'FAANG Study — progress sync'
const GIST_ID_KEY = 'gist-sync-id'
const TOKEN_KEY = 'gist-sync-token'
const LAST_SYNC_KEY = 'gist-sync-last'
const LAST_ERROR_KEY = 'gist-sync-error'

const PROGRESS_PREFIX = 'progress:'
const STUDY_LOG_KEY = 'study-log'

const PUSH_DEBOUNCE_MS = 2000

export interface SyncPayload {
  version: 1
  updatedAt: number
  entries: Record<string, ProgressEntry>
  studyLog: string[]
}

export interface SyncStatus {
  lastSync: number | null
  lastError: string | null
}

function token(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function gistId(): string | null {
  try { return localStorage.getItem(GIST_ID_KEY) } catch { return null }
}

function setGistId(id: string) {
  try { localStorage.setItem(GIST_ID_KEY, id) } catch {}
}

export function getToken(): string | null {
  return token()
}

export function setToken(t: string) {
  try { localStorage.setItem(TOKEN_KEY, t) } catch {}
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
  try { localStorage.removeItem(GIST_ID_KEY) } catch {}
  try { localStorage.removeItem(LAST_SYNC_KEY) } catch {}
  try { localStorage.removeItem(LAST_ERROR_KEY) } catch {}
}

export function getLastSync(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY)
    return raw ? parseInt(raw, 10) : null
  } catch { return null }
}

function setLastSync(ts: number) {
  try { localStorage.setItem(LAST_SYNC_KEY, String(ts)) } catch {}
}

function setSyncError(message: string | null) {
  try {
    if (message) localStorage.setItem(LAST_ERROR_KEY, message)
    else localStorage.removeItem(LAST_ERROR_KEY)
  } catch {}
}

export function getSyncStatus(): SyncStatus {
  let lastError: string | null = null
  try { lastError = localStorage.getItem(LAST_ERROR_KEY) } catch {}
  return { lastSync: getLastSync(), lastError }
}

async function apiGet(url: string, tok: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`)
  return res.json()
}

async function apiPost(url: string, tok: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`)
  return res.json()
}

async function apiPatch(url: string, tok: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`)
  return res.json()
}

async function findExistingGist(tok: string): Promise<string | null> {
  const matches: { id: string; updatedAt: string }[] = []
  let page = 1
  while (page <= 5) {
    const gists = await apiGet(`https://api.github.com/gists?per_page=100&page=${page}`, tok) as unknown[]
    for (const g of gists) {
      const gist = g as Record<string, unknown>
      if (gist.description === GIST_DESCRIPTION && gist.files && (gist.files as Record<string, unknown>)[GIST_FILENAME]) {
        matches.push({ id: gist.id as string, updatedAt: gist.updated_at as string })
      }
    }
    if (gists.length < 100) break
    page++
  }

  if (matches.length === 0) return null

  matches.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  for (const match of matches) {
    try {
      const gist = await apiGet(`https://api.github.com/gists/${match.id}`, tok) as Record<string, unknown>
      const files = gist.files as Record<string, { content: string }>
      const file = files[GIST_FILENAME]
      if (!file) continue
      const payload = JSON.parse(file.content) as SyncPayload
      if (Object.keys(payload.entries).length > 0) return match.id
    } catch {}
  }

  return matches[0].id
}

export async function pullProgress(tok: string): Promise<SyncPayload | null> {
  let id = gistId()
  if (!id) {
    id = await findExistingGist(tok)
    if (!id) return null
    setGistId(id)
  }

  const gist = await apiGet(`https://api.github.com/gists/${id}`, tok) as Record<string, unknown>
  const files = gist.files as Record<string, { content: string }>
  const file = files[GIST_FILENAME]
  if (!file) throw new Error('Gist missing progress file')

  return JSON.parse(file.content) as SyncPayload
}

function isEmpty(payload: SyncPayload): boolean {
  return Object.keys(payload.entries).length === 0 && payload.studyLog.length === 0
}

function mergePayload(a: SyncPayload, b: SyncPayload): SyncPayload {
  const entries: Record<string, ProgressEntry> = {}
  for (const [slug, entry] of Object.entries(a.entries)) {
    entries[slug] = normalizeEntry(entry)
  }
  for (const [slug, entry] of Object.entries(b.entries)) {
    const existing = entries[slug]
    entries[slug] = existing ? mergeEntry(existing, entry) : normalizeEntry(entry)
  }
  return {
    version: 1,
    updatedAt: Date.now(),
    entries,
    studyLog: mergeStudyLog(a.studyLog, b.studyLog),
  }
}

async function writeGist(tok: string, payload: SyncPayload): Promise<void> {
  const content = JSON.stringify(payload, null, 2)
  let id = gistId()

  if (id) {
    try {
      await apiPatch(`https://api.github.com/gists/${id}`, tok, {
        description: GIST_DESCRIPTION,
        files: { [GIST_FILENAME]: { content } },
      })
      return
    } catch (e) {
      const msg = (e as Error).message
      if (!msg.includes('404')) throw e
      id = null
      setGistId('')
    }
  }

  const created = await apiPost('https://api.github.com/gists', tok, {
    description: GIST_DESCRIPTION,
    public: false,
    files: { [GIST_FILENAME]: { content } },
  }) as Record<string, unknown>
  setGistId(created.id as string)
}

let inFlight: Promise<unknown> = Promise.resolve()

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = inFlight.then(fn, fn)
  inFlight = run.catch(() => {})
  return run
}

/**
 * Read-modify-write: a device that never pulled cannot clobber the gist, because
 * remote state is merged in before the file is replaced.
 */
export async function pushProgress(tok: string): Promise<number> {
  return serialize(async () => {
    const local = await exportProgress()

    let remote: SyncPayload | null = null
    try {
      remote = await pullProgress(tok)
    } catch (e) {
      if (!(e as Error).message.includes('404')) throw e
      setGistId('')
    }

    const merged = remote ? mergePayload(local, remote) : local
    if (isEmpty(merged)) throw new Error('Nothing to sync — study some topics first')

    await applyPayload(merged)
    await writeGist(tok, merged)

    setLastSync(Date.now())
    setSyncError(null)
    return Object.keys(merged.entries).length
  })
}

export async function exportProgress(): Promise<SyncPayload> {
  const allKeys = await idbKeys()
  const progressKeys = allKeys.filter((k) => (k as string).startsWith(PROGRESS_PREFIX))

  const entries: Record<string, ProgressEntry> = {}
  for (const k of progressKeys) {
    const raw = await get(k as string)
    if (!raw) continue
    const e = raw as ProgressEntry
    if (e.slug) entries[e.slug] = normalizeEntry(e)
  }

  const studyLog: string[] = await get(STUDY_LOG_KEY) ?? []

  return { version: 1, updatedAt: Date.now(), entries, studyLog }
}

async function applyPayload(payload: SyncPayload): Promise<void> {
  for (const [slug, entry] of Object.entries(payload.entries)) {
    const key = `${PROGRESS_PREFIX}${slug}`
    const existing = await get(key) as ProgressEntry | undefined
    await set(key, existing ? mergeEntry(existing, entry) : normalizeEntry(entry))
  }

  if (payload.studyLog?.length) {
    const existing: string[] = await get(STUDY_LOG_KEY) ?? []
    await set(STUDY_LOG_KEY, mergeStudyLog(existing, payload.studyLog))
  }
}

export async function importProgress(payload: SyncPayload): Promise<void> {
  await serialize(async () => {
    await applyPayload(payload)
    setLastSync(Date.now())
    setSyncError(null)
  })
}

const AUTO_SYNC_KEY = 'gist-sync-auto'

export function isAutoSync(): boolean {
  try { return localStorage.getItem(AUTO_SYNC_KEY) === 'true' } catch { return false }
}

export function setAutoSync(on: boolean) {
  try { localStorage.setItem(AUTO_SYNC_KEY, String(on)) } catch {}
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
let pushPending = false

async function runPush(): Promise<void> {
  if (!pushPending) return
  pushPending = false
  const t = token()
  if (!t) return
  try {
    const local = await exportProgress()
    if (isEmpty(local)) return
    await pushProgress(t)
  } catch (e) {
    setSyncError((e as Error).message)
  }
}

/** Debounced: a Read → Studied → Practiced click-through coalesces into one gist write. */
export function autoPush(): void {
  if (!isAutoSync()) return
  if (!token()) return
  pushPending = true
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void runPush()
  }, PUSH_DEBOUNCE_MS)
}

export async function flushPush(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  await runPush()
}

export async function autoPull(): Promise<void> {
  if (!isAutoSync()) return
  const t = token()
  if (!t) return
  try {
    const payload = await pullProgress(t)
    if (!payload) return
    await importProgress(payload)
  } catch (e) {
    setSyncError((e as Error).message)
  }
}
