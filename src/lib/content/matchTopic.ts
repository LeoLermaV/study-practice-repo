/**
 * Scores a topic for a search-palette query. Every word must appear in the
 * title or a tag. Title hits rank above tag-only hits, and hits at the start
 * of a word rank highest, so "leaderless" puts "Leaderless Replication" first.
 * Returns 0 for no match, otherwise a score in (0, 1].
 */
export function matchTopic(title: string, tags: string[], search: string): number {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  const t = title.toLowerCase()
  const k = tags.join(' ').toLowerCase()
  let score = 0
  for (const w of words) {
    const at = t.indexOf(w)
    if (at === 0 || (at > 0 && /[^a-z0-9]/.test(t[at - 1]))) score += 1
    else if (at > 0) score += 0.7
    else if (k.includes(w)) score += 0.3
    else return 0
  }
  return score / words.length
}
