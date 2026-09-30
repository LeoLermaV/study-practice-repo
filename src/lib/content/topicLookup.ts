'use client'

import { useEffect, useState } from 'react'
import type { Category, TopicMeta } from './types'
import { assetPath } from '../utils'

export type LookupTopic = Pick<TopicMeta, 'slug' | 'title' | 'category' | 'tags' | 'difficulty'> & {
  estimatedReadingTime?: number
}

let pending: Promise<Map<string, LookupTopic>> | null = null

/**
 * Every topic (listed or not) by slug, from the search index's stored fields.
 * Fetched once per page load and shared: the command palette, topic pages and
 * the nav all read it.
 */
export function loadTopicLookup(): Promise<Map<string, LookupTopic>> {
  if (!pending) {
    pending = fetch(assetPath('/search-index.json'))
      .then((r) => {
        if (!r.ok) throw new Error(`search index: HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        const stored = data?.storedFields ? (Object.values(data.storedFields) as LookupTopic[]) : []
        return new Map(stored.filter((t) => t.slug).map((t) => [t.slug, t]))
      })
      .catch((e) => {
        pending = null // allow a retry on the next call
        throw e
      })
  }
  return pending
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
