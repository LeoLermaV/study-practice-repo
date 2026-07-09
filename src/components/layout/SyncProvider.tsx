'use client'

import { useEffect } from 'react'
import { autoPull, flushPush } from '@/lib/progress/sync'

export function SyncProvider() {
  useEffect(() => {
    void autoPull()

    // A debounced push would otherwise be lost when the tab closes or backgrounds.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flushPush()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return null
}
