'use client'

import { useCallback } from 'react'
import { useLocalStorage } from '../useLocalStorage'

const DAILY_LIMIT_KEY = 'review:daily-limit'

/** Choices offered in Settings; null means no limit. */
export const DAILY_LIMIT_OPTIONS: (number | null)[] = [null, 5, 10, 20]

export function parseDailyLimit(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** Per-device daily re-reading limit (localStorage; not synced). */
export function useDailyLimit(): [number | null, (limit: number | null) => void] {
  const [raw, setRaw] = useLocalStorage(DAILY_LIMIT_KEY)
  const set = useCallback((limit: number | null) => setRaw(limit === null ? '' : String(limit)), [setRaw])
  return [parseDailyLimit(raw), set]
}
