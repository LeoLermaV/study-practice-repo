'use client'

import { useCallback, useSyncExternalStore } from 'react'

const CHANGE_EVENT = 'faang:local-storage'
// Fallback when storage is blocked (private windows), so the UI still responds.
const memory = new Map<string, string>()

function subscribe(listener: () => void): () => void {
  window.addEventListener('storage', listener)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(CHANGE_EVENT, listener)
  }
}

function read(key: string): string {
  try {
    const value = localStorage.getItem(key)
    if (value !== null) return value
  } catch {
    // fall through to the in-memory copy
  }
  return memory.get(key) ?? ''
}

/**
 * A localStorage string as React state, shared by every component using the
 * same key. `null` during the server render and hydration (storage is not
 * readable there), `''` when unset.
 */
export function useLocalStorage(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null)
  const set = useCallback((next: string) => {
    memory.set(key, next)
    try {
      localStorage.setItem(key, next)
    } catch {
      // kept in memory for this session
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [key])
  return [value, set]
}

/** Current value outside render, e.g. inside an effect that patches it. */
export function readLocalStorage(key: string): string {
  return read(key)
}

const noopSubscribe = () => () => {}

/** False during the server render and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}
