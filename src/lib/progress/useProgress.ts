'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category, ProgressEntry } from '../content/types'
import type { LibraryData, LibraryTopic } from '../content/library'
import { getAllProgress } from './db'
import { onProgressChanged } from './events'

export interface ProgressState {
  /** False until IndexedDB has been read once. */
  loaded: boolean
  entries: ProgressEntry[]
  bySlug: Map<string, ProgressEntry>
  /** Clock reading taken with the last load, so renders stay pure. */
  now: number
}

/** All progress entries, re-read whenever a mutation or sync pull lands. */
export function useProgress(): ProgressState {
  const [state, setState] = useState<ProgressState>({ loaded: false, entries: [], bySlug: new Map(), now: 0 })

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getAllProgress()
        .then((entries) => {
          if (cancelled) return
          setState({ loaded: true, entries, bySlug: new Map(entries.map((e) => [e.slug, e])), now: Date.now() })
        })
        .catch(() => {
          if (!cancelled) setState((s) => ({ ...s, loaded: true, now: Date.now() }))
        })
    }
    load()
    const off = onProgressChanged(load)
    return () => { cancelled = true; off() }
  }, [])

  return state
}

export interface IndexedTopic extends LibraryTopic {
  category: Category
}

/** slug → topic with its category, across the whole library. */
export function useTopicIndex(data: LibraryData): Map<string, IndexedTopic> {
  return useMemo(() => {
    const index = new Map<string, IndexedTopic>()
    for (const t of data.unlisted) index.set(t.slug, t)
    for (const cat of data.categories) {
      for (const section of cat.sections) {
        for (const t of [...section.topics, ...(section.variant?.topics ?? [])]) {
          index.set(t.slug, { ...t, category: cat.id })
        }
      }
    }
    return index
  }, [data])
}
