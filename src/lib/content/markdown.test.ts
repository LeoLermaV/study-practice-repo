import { describe, it, expect } from 'vitest'
import { convertMkDocsAdmonitions, prepareMarkdown, usesInlineDollarMath } from './markdown'

describe('usesInlineDollarMath', () => {
  it('is on for hello-algo only', () => {
    expect(usesInlineDollarMath('hello-algo-sorting-radix-sort')).toBe(true)
    expect(usesInlineDollarMath('understanding-compensation')).toBe(false)
  })
})

describe('prepareMarkdown', () => {
  it('escapes braces in prose, once', () => {
    expect(prepareMarkdown('a {b} and \\{c\\}', false)).toBe('a \\{b\\} and \\{c\\}')
  })

  it('leaves fenced and inline code alone', () => {
    const md = 'Use `d = {}` then:\n```python\nx = {1: 2}\n```\nend {x}'
    expect(prepareMarkdown(md, false)).toBe('Use `d = {}` then:\n```python\nx = {1: 2}\n```\nend \\{x\\}')
  })

  it('leaves display maths alone everywhere', () => {
    const md = '$$\n\\begin{align*} x^{2} \\end{align*}\n$$ and {y}'
    expect(prepareMarkdown(md, false)).toBe('$$\n\\begin{align*} x^{2} \\end{align*}\n$$ and \\{y\\}')
  })

  it('leaves inline maths alone only where $ means maths', () => {
    expect(prepareMarkdown('cost $O(\\log{n})$ here {z}', true)).toBe('cost $O(\\log{n})$ here \\{z\\}')
    expect(prepareMarkdown('salary $100 {bonus} $20', false)).toBe('salary $100 \\{bonus\\} $20')
  })

  it('decodes HTML entities inside maths only', () => {
    expect(prepareMarkdown('if $n &gt; 1$ then a &gt; b', true)).toBe('if $n > 1$ then a &gt; b')
    expect(prepareMarkdown('$$\nx &lt; y &amp; z\n$$', false)).toBe('$$\nx < y & z\n$$')
  })
})

describe('convertMkDocsAdmonitions', () => {
  it('turns a titled admonition and its indented body into a blockquote', () => {
    const md = ['Intro', '', '!!! tip "What is the base of $O(\\log n)$?"', '', '    Line one.', '', '    $$', '    x = 1', '    $$', '', 'After'].join('\n')
    expect(convertMkDocsAdmonitions(md)).toBe(
      ['Intro', '', '> **What is the base of $O(\\log n)$?**', '>', '> Line one.', '>', '> $$', '> x = 1', '> $$', '', 'After'].join('\n')
    )
  })

  it('titles untitled admonitions by type and ends at the first unindented line', () => {
    expect(convertMkDocsAdmonitions('!!! note\n    Body\nNext')).toBe('> **Note**\n> Body\nNext')
  })

  it('leaves other text alone', () => {
    expect(convertMkDocsAdmonitions('plain\n    indented code')).toBe('plain\n    indented code')
  })
})
