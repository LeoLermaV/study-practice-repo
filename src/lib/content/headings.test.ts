import { describe, it, expect } from 'vitest'
import { extractHeadings } from './headings'

describe('extractHeadings', () => {
  it('collects levels 2 to 4 in order', () => {
    const md = ['# Title', '## Quorums', 'text', '### Read repair', '#### Sloppy quorums', '##### Too deep'].join('\n')
    expect(extractHeadings(md)).toEqual(['Quorums', 'Read repair', 'Sloppy quorums'])
  })

  it('ignores headings inside fenced code', () => {
    const md = ['## Real', '```python', '## not a heading', '```', '~~~', '### also not', '~~~', '## After'].join('\n')
    expect(extractHeadings(md)).toEqual(['Real', 'After'])
  })

  it('strips inline markdown, escapes and closing hashes', () => {
    const md = ['## Using `bisect` with [links](https://x.y) and **bold** ##', '## Braces \\{ok\\} &amp; &lt;tags&gt;'].join('\n')
    expect(extractHeadings(md)).toEqual(['Using bisect with links and bold', 'Braces {ok} & <tags>'])
  })

  it('needs a space after the hashes', () => {
    expect(extractHeadings('##NoSpace\n## Yes')).toEqual(['Yes'])
  })
})
