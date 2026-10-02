'use client'

import { useEffect } from 'react'
import { loadTopicLookup } from '@/lib/content/topicLookup'
import { getAllProgress } from '@/lib/progress/db'
import { onProgressChanged } from '@/lib/progress/events'
import { offlineCandidates } from '@/lib/offline'
import { parseRecent } from '@/lib/recent'
import { readLocalStorage } from '@/lib/useLocalStorage'

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

async function pagesToSave(): Promise<string[]> {
  const [progress, lookup] = await Promise.all([getAllProgress(), loadTopicLookup()])
  const slugs = offlineCandidates(progress, parseRecent(readLocalStorage('library:recent')), Date.now())
  return slugs.flatMap((slug) => {
    const t = lookup.get(slug)
    return t ? [`${base}/${t.category}/${t.slug}`] : []
  })
}

/**
 * Registers the service worker (published builds only) and tells it which
 * topics to keep for offline reading: upcoming re-reads and recent topics,
 * plus the build files this page already loaded. Renders nothing.
 */
export function OfflineSupport() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    let cancelled = false

    const sync = async () => {
      const registration = await navigator.serviceWorker.ready
      const worker = registration.active
      if (!worker || cancelled) return
      const assets = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => name.startsWith(`${location.origin}${base}/_next/static/`))
      worker.postMessage({ type: 'save-assets', urls: assets })
      worker.postMessage({ type: 'save-pages', urls: await pagesToSave() })
    }

    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .then(() => sync())
      .catch(() => {
        // Offline reading is an extra; the app works the same without it.
      })
    const off = onProgressChanged(() => { sync().catch(() => {}) })
    return () => { cancelled = true; off() }
  }, [])

  return null
}
