/** Strips inline markdown so a heading reads as plain text. */
function plain(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, '$2')
    .replace(/\\([{}<>\\*_`[\]#])/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Section headings (levels 2–4) of a markdown body, in order, as plain text.
 * Lines inside fenced code blocks are skipped: a `## comment` in Python is
 * not a heading.
 */
export function extractHeadings(markdown: string): string[] {
  const out: string[] = []
  let fence: string | null = null
  for (const line of markdown.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker) {
      if (fence === null) fence = marker[1][0]
      else if (marker[1][0] === fence) fence = null
      continue
    }
    if (fence !== null) continue
    const m = line.match(/^#{2,4}\s+(.+?)\s*#*\s*$/)
    if (m) {
      const text = plain(m[1])
      if (text) out.push(text)
    }
  }
  return out
}
