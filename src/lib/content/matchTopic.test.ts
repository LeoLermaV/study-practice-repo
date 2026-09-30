import { describe, it, expect } from 'vitest'
import { matchTopic } from './matchTopic'

describe('matchTopic', () => {
  it('matches everything for an empty query', () => {
    expect(matchTopic('Anything', [], '  ')).toBe(1)
  })

  it('ranks word-start title hits above mid-word and tag hits', () => {
    const start = matchTopic('Leaderless Replication', [], 'leaderless')
    const mid = matchTopic('Multi-leaderless Setups', [], 'eaderless')
    const tag = matchTopic('Dynamo', ['leaderless'], 'leaderless')
    expect(start).toBe(1)
    expect(mid).toBeLessThan(start)
    expect(tag).toBeLessThan(mid)
    expect(tag).toBeGreaterThan(0)
  })

  it('requires every word, in any order', () => {
    expect(matchTopic('Consistent Hashing', [], 'hashing consistent')).toBe(1)
    expect(matchTopic('Consistent Hashing', [], 'consistent trees')).toBe(0)
  })

  it('does not match scattered letters', () => {
    expect(matchTopic('Design Amazon Sales Ranking', ['design'], 'leaderless')).toBe(0)
  })

  it('is case-insensitive and treats punctuation as a word boundary', () => {
    expect(matchTopic('Command and Query Responsibility Segregation (CQRS)', [], 'cqrs')).toBe(1)
  })
})
