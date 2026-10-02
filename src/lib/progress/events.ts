const PROGRESS_EVENT = 'faang:progress-changed'

/** Tells mounted views (library, nav badge, review list) that progress changed. */
export function notifyProgressChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROGRESS_EVENT))
}

export function onProgressChanged(listener: () => void): () => void {
  window.addEventListener(PROGRESS_EVENT, listener)
  return () => window.removeEventListener(PROGRESS_EVENT, listener)
}
