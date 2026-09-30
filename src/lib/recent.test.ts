import { describe, it, expect } from 'vitest'
import { parseRecent, pushRecent } from './recent'

describe('recent topics', () => {
  it('puts the latest visit first without duplicates', () => {
    expect(pushRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
    expect(pushRecent([], 'a')).toEqual(['a'])
  })

  it('caps the list', () => {
    expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b'])
  })

  it('tolerates missing or corrupt storage', () => {
    expect(parseRecent(null)).toEqual([])
    expect(parseRecent('{nope')).toEqual([])
    expect(parseRecent('{"a":1}')).toEqual([])
    expect(parseRecent('["a",2,"b"]')).toEqual(['a', 'b'])
  })
})
