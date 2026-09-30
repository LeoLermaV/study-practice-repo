/**
 * hello-algo writes inline maths as `$…$`. Everywhere else a lone `$` is
 * currency (the compensation tables have several per row), so only `$$…$$`
 * counts as maths there.
 */
export function usesInlineDollarMath(slug: string): boolean {
  return slug.startsWith('hello-algo-')
}

/** Adapters HTML-escape `<`, `>` and `&` for markdown; KaTeX needs the characters. */
function decodeEntities(tex: string): string {
  return tex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

/**
 * Prepares an adapter's markdown body for storage. Escapes `{` and `}` in
 * prose (a leftover from compiling as MDX, where they start expressions) and
 * leaves code verbatim: in a code span the backslash would show. Maths is
 * left unescaped too (in LaTeX `\{` is a literal brace), with HTML entities
 * decoded so KaTeX sees `n > 1`, not `n &gt; 1`.
 */
export function prepareMarkdown(body: string, inlineMath: boolean): string {
  const protectedSpans = [
    '```[\\s\\S]*?```', // fenced code
    '\\$\\$[\\s\\S]*?\\$\\$', // display maths
    '`[^`\\n]+`', // inline code
    ...(inlineMath ? ['\\$(?!\\$)[^$\\n]+?\\$'] : []), // inline maths
  ]
  const parts = body.split(new RegExp(`(${protectedSpans.join('|')})`))
  return parts
    .map((part, i) => {
      if (i % 2 === 0) return part.replace(/(?<!\\){/g, '\\{').replace(/(?<!\\)}/g, '\\}')
      return part.startsWith('$') ? decodeEntities(part) : part
    })
    .join('')
}

/**
 * MkDocs admonitions (`!!! tip "Title"` followed by a 4-space-indented body)
 * become blockquotes. Left indented, the body is later taken for a code block.
 */
export function convertMkDocsAdmonitions(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^!!!\s*(\w+)(?:\s+"?(.+?)"?)?\s*$/)
    if (!m) {
      out.push(lines[i])
      continue
    }
    const title = m[2] ?? m[1].charAt(0).toUpperCase() + m[1].slice(1)
    out.push(`> **${title}**`)
    let j = i + 1
    const body: string[] = []
    while (j < lines.length && (lines[j].trim() === '' || /^( {4}|\t)/.test(lines[j]))) {
      body.push(lines[j])
      j++
    }
    // Trailing blank lines belong to the document, not the callout.
    while (body.length > 0 && body[body.length - 1].trim() === '') {
      body.pop()
      j--
    }
    for (const line of body) out.push(line.trim() === '' ? '>' : `> ${line.replace(/^( {4}|\t)/, '')}`)
    i = j - 1
  }
  return out.join('\n')
}
