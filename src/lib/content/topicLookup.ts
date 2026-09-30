'use client'

import { useEffect, useState } from 'react'
import MiniSearch from 'minisearch'
import type { Category, TopicMeta } from './types'
import { assetPath } from '../utils'
import { searchIndexOptions, type SearchDocument } from './search'

export type LookupTopic = Pick<TopicMeta, 'slug' | 'title' | 'category' | 'tags' | 'difficulty'> & {
  estimatedReadingTime?: number
}

export interface SearchData {
  lookup: Map<string, LookupTopic>
  index: MiniSearch<SearchDocument>
}

let pending: Promise<SearchData> | null = null

/**
 * The search index, fetched once per page load and shared: `lookup` has every
 * topic (listed or not) by slug; `index` is the MiniSearch instance, which also
 * matches section headings.
 */
export function loadSearchData(): Promise<SearchData> {
  if (!pending) {
    pending = fetch(assetPath('/search-index.json'))
      .then((r) => {
        if (!r.ok) throw new Error(`search index: HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        const stored = data?.storedFields ? (Object.values(data.storedFields) as LookupTopic[]) : []
        return {
          lookup: new Map(stored.filter((t) => t.slug).map((t) => [t.slug, t])),
          index: MiniSearch.loadJS<SearchDocument>(data, searchIndexOptions),
        }
      })
      .catch((e) => {
        pending = null // allow a retry on the next call
        throw e
      })
  }
  return pending
}

export function loadTopicLookup(): Promise<Map<string, LookupTopic>> {
  return loadSearchData().then((d) => d.lookup)
}

export function useTopicLookup(): Map<string, LookupTopic> | null {
  const [lookup, setLookup] = useState<Map<string, LookupTopic> | null>(null)
  useEffect(() => {
    let cancelled = false
    loadTopicLookup()
      .then((m) => { if (!cancelled) setLookup(m) })
      .catch(() => { if (!cancelled) setLookup(new Map()) })
    return () => { cancelled = true }
  }, [])
  return lookup
}

export function lookupHref(t: { category: Category | string; slug: string }): string {
  return `/${t.category}/${t.slug}`
}
