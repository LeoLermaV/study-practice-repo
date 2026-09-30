const OPEN_SEARCH_EVENT = 'faang:open-search'

/** Opens the command palette from any button (it also opens on ⌘K / Ctrl+K). */
export function openSearch(): void {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
}

export function onOpenSearch(listener: () => void): () => void {
  window.addEventListener(OPEN_SEARCH_EVENT, listener)
  return () => window.removeEventListener(OPEN_SEARCH_EVENT, listener)
}
