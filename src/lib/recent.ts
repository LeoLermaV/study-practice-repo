'use client'

import { useEffect, useMemo } from 'react'
import { readLocalStorage, useLocalStorage } from './useLocalStorage'

const RECENT_KEY = 'library:recent'
export const RECENT_MAX = 8

export function parseRecent(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

/** Moves `slug` to the front, dropping duplicates and anything past `max`. */
export function pushRecent(list: string[], slug: string, max = RECENT_MAX): string[] {
  return [slug, ...list.filter((s) => s !== slug)].slice(0, max)
}

/** Recently opened topic slugs, newest first (this device only). */
export function useRecentTopics(): string[] {
  const [raw] = useLocalStorage(RECENT_KEY)
  return useMemo(() => parseRecent(raw), [raw])
}

/** Records a topic visit. Renders nothing. */
export function RecordVisit({ slug }: { slug: string }) {
  const [, setRaw] = useLocalStorage(RECENT_KEY)
  useEffect(() => {
    setRaw(JSON.stringify(pushRecent(parseRecent(readLocalStorage(RECENT_KEY)), slug)))
  }, [slug, setRaw])
  return null
}
