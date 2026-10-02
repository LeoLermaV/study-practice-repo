import { describe, it, expect } from 'vitest'
import { headingSlug, remarkOutline, type OutlineItem } from './outline'

const heading = (depth: number, ...children: object[]) => ({ type: 'heading', depth, children })
const text = (value: string) => ({ type: 'text', value })

type Tree = Parameters<ReturnType<ReturnType<typeof remarkOutline>>>[0]

function run(tree: { type: string; children: object[] }) {
  const out: OutlineItem[] = []
  remarkOutline(out)()(tree as Tree)
  return out
}

describe('headingSlug', () => {
  it('lowercases, drops punctuation and hyphenates', () => {
    expect(headingSlug('Why do we need this?')).toBe('why-do-we-need-this')
    expect(headingSlug('SQL vs. NoSQL — trade-offs')).toBe('sql-vs-nosql-trade-offs')
    expect(headingSlug('???')).toBe('section')
  })
})

describe('remarkOutline', () => {
  it('collects h2/h3 in order and sets ids on every heading', () => {
    const h1 = heading(1, text('Title'))
    const h2 = heading(2, text('Virtual nodes'))
    const h3 = heading(3, text('Using '), { type: 'inlineCode', value: 'bisect' })
    const h4 = heading(4, text('Aside'))
    const out = run({ type: 'root', children: [h1, h2, { type: 'paragraph', children: [text('x')] }, h3, h4] })
    expect(out).toEqual([
      { id: 'virtual-nodes', text: 'Virtual nodes', depth: 2 },
      { id: 'using-bisect', text: 'Using bisect', depth: 3 },
    ])
    expect((h1 as { data?: { hProperties?: { id?: string } } }).data?.hProperties?.id).toBe('title')
    expect((h4 as { data?: { hProperties?: { id?: string } } }).data?.hProperties?.id).toBe('aside')
  })

  it('keeps ids unique, including against suffixed headings', () => {
    const out = run({ type: 'root', children: [heading(2, text('Example')), heading(2, text('Example 1')), heading(2, text('Example')), heading(2, text('Example'))] })
    expect(out.map((o) => o.id)).toEqual(['example', 'example-1', 'example-2', 'example-3'])
  })

  it('finds headings nested in blockquotes or lists and skips empty ones', () => {
    const out = run({ type: 'root', children: [{ type: 'blockquote', children: [heading(2, text('Inside'))] }, heading(2)] })
    expect(out).toEqual([{ id: 'inside', text: 'Inside', depth: 2 }])
  })
})
