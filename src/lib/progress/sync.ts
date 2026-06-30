import { get, set, keys as idbKeys } from 'idb-keyval'
import type { ProgressEntry } from '../content/types'

const GIST_FILENAME = 'faang-study-progress.json'
const GIST_DESCRIPTION = 'FAANG Study — progress sync'
const GIST_ID_KEY = 'gist-sync-id'
const TOKEN_KEY = 'gist-sync-token'
const LAST_SYNC_KEY = 'gist-sync-last'

const PROGRESS_PREFIX = 'progress:'
const STUDY_LOG_KEY = 'study-log'

interface SyncPayload {
  version: 1
  updatedAt: number
  entries: Record<string, ProgressEntry>
  studyLog: string[]
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
  let page = 1
  while (page <= 5) {
    const gists = await apiGet(`https://api.github.com/gists?per_page=100&page=${page}`, tok) as unknown[]
    for (const g of gists) {
      const gist = g as Record<string, unknown>
      if (gist.description === GIST_DESCRIPTION && gist.files && (gist.files as Record<string, unknown>)[GIST_FILENAME]) {
        return gist.id as string
      }
    }
    if (gists.length < 100) break
    page++
  }
  return null
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

  const payload = JSON.parse(file.content) as SyncPayload
  return payload
}

export async function pushProgress(tok: string, payload: SyncPayload): Promise<void> {
  let id = gistId()
  if (id) {
    try {
      await apiPatch(`https://api.github.com/gists/${id}`, tok, {
        description: GIST_DESCRIPTION,
        files: { [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) } },
      })
      setLastSync(Date.now())
      return
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes('404')) {
        id = null
        setGistId('')
      } else {
        throw e
      }
    }
  }

  if (!id) {
    const created = await apiPost('https://api.github.com/gists', tok, {
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) } },
    }) as Record<string, unknown>
    setGistId(created.id as string)
    setLastSync(Date.now())
  }
}

export async function exportProgress(): Promise<SyncPayload> {
  const allKeys = await idbKeys()
  const progressKeys = allKeys.filter((k) => (k as string).startsWith(PROGRESS_PREFIX))

  const entries: Record<string, ProgressEntry> = {}
  for (const k of progressKeys) {
    const raw = await get(k as string)
    if (!raw) continue
    const e = raw as unknown as ProgressEntry
    if (e.slug) {
      entries[e.slug] = e
    }
  }

  const studyLog: string[] = await get(STUDY_LOG_KEY) ?? []

  return {
    version: 1,
    updatedAt: Date.now(),
    entries,
    studyLog,
  }
}

export async function importProgress(payload: SyncPayload): Promise<void> {
  for (const [slug, entry] of Object.entries(payload.entries)) {
    const key = `${PROGRESS_PREFIX}${slug}`
    const existing = await get(key) as ProgressEntry | undefined

    if (!existing || (entry.practicedAt ?? 0) >= (existing.practicedAt ?? 0)) {
      await set(key, entry)
    }
  }

  if (payload.studyLog && payload.studyLog.length > 0) {
    const existing: string[] = await get(STUDY_LOG_KEY) ?? []
    const merged = [...new Set([...existing, ...payload.studyLog])]
    await set(STUDY_LOG_KEY, merged)
  }

  setLastSync(Date.now())
}
