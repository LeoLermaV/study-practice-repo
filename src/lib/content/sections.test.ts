import { describe, it, expect } from 'vitest'
import type { GroupableTopic } from './sections'
import { groupTopics, orderedSlugs, isListedTopic } from './sections'

function topic(slug: string, over: Partial<GroupableTopic> = {}): GroupableTopic {
  return { slug, title: slug, difficulty: 'beginner', tags: [], ...over }
}

const labels = (category: string, topics: GroupableTopic[]) =>
  groupTopics(category, topics).sections.map((s) => s.label)

const slugsOf = (category: string, topics: GroupableTopic[], label: string) =>
  groupTopics(category, topics).sections.find((s) => s.label === label)?.topics.map((t) => t.slug)

describe('groupTopics', () => {
  it('keeps explicit sections in the order sections.ts lists them', () => {
    const topics = [topic('load-balancing'), topic('ip'), topic('osi-model')]
    expect(slugsOf('system-design', topics, 'Foundations')).toEqual(['ip', 'osi-model', 'load-balancing'])
  })

  it('omits sections with no topics', () => {
    expect(labels('system-design', [topic('ip')])).toEqual(['Foundations'])
  })

  it('orders prefix sections by sortOrder, then title', () => {
    const topics = [
      topic('hello-algo-b', { title: 'B', sortOrder: 2 }),
      topic('hello-algo-z', { title: 'Z', sortOrder: 1 }),
      topic('hello-algo-a', { title: 'A' }),
    ]
    expect(slugsOf('dsa', topics, 'hello-algo')).toEqual(['hello-algo-z', 'hello-algo-b', 'hello-algo-a'])
  })

  it('puts LeetCode pattern topics in Problem Lists', () => {
    const topics = [topic('array', { leetcodePatterns: { patterns: ['Array'], companies: [] } })]
    expect(slugsOf('dsa', topics, 'Problem Lists')).toEqual(['array'])
    expect(groupTopics('dsa', topics).leftovers).toEqual([])
  })

  it('orders the NeetCode roadmap by roadmap order and keeps Blind 75 as a variant', () => {
    const nc = (slug: string, order: number, isBlind75: boolean) =>
      topic(slug, { neetcodeRoadmap: { group: slug, order, isBlind75 } })
    const topics = [nc('trees', 2, false), nc('arrays-hashing', 1, false), nc('trees-blind75', 2, true), nc('arrays-hashing-blind75', 1, true)]
    const section = groupTopics('dsa', topics).sections.find((s) => s.label === 'NeetCode Roadmap')
    expect(section?.topics.map((t) => t.slug)).toEqual(['arrays-hashing', 'trees'])
    expect(section?.variant?.label).toBe('Blind 75')
    expect(section?.variant?.topics.map((t) => t.slug)).toEqual(['arrays-hashing-blind75', 'trees-blind75'])
    expect(groupTopics('dsa', topics).leftovers).toEqual([])
  })

  it('groups OO design questions into their own section', () => {
    expect(slugsOf('dsa', [topic('donnemartin-oo-parking_lot')], 'Object-Oriented Design')).toEqual(['donnemartin-oo-parking_lot'])
  })

  it('leads each DDIA chapter with its overview and keeps chapters 1 and 10 apart', () => {
    const topics = [
      topic('ddia-ch1-maintainability', { title: 'Maintainability', sortOrder: 8 }),
      topic('ddia-ch1-reliability', { title: 'Reliability', sortOrder: 2 }),
      topic('ddia-ch10', { title: 'Ch. 10: Batch Processing', sortOrder: 0 }),
      topic('ddia-ch1', { title: 'Ch. 1: Reliable Applications', sortOrder: 0 }),
    ]
    const { sections, leftovers } = groupTopics('ddia', topics)
    expect(sections[0].topics.map((t) => t.slug)).toEqual(['ddia-ch1', 'ddia-ch1-reliability', 'ddia-ch1-maintainability'])
    expect(sections[1].label).toMatch(/^Chapter 10 /)
    expect(sections[1].topics.map((t) => t.slug)).toEqual(['ddia-ch10'])
    expect(leftovers).toEqual([])
  })

  it('assigns a topic to the first section that claims it only', () => {
    const topics = [topic('ip'), topic('ip')]
    const all = groupTopics('system-design', topics).sections.flatMap((s) => s.topics)
    expect(all).toHaveLength(1)
  })

  it('returns unclaimed topics as leftovers, easiest first', () => {
    const topics = [topic('mystery-hard', { difficulty: 'advanced' }), topic('mystery-easy')]
    expect(groupTopics('system-design', topics).leftovers.map((t) => t.slug)).toEqual(['mystery-easy', 'mystery-hard'])
  })

  it('returns everything as leftovers for an unknown category', () => {
    expect(groupTopics('nope', [topic('x')])).toEqual({ sections: [], leftovers: [topic('x')] })
  })
})

describe('orderedSlugs', () => {
  it('follows section order and appends chapter summaries and leftovers', () => {
    const topics = [
      topic('hello-algo-summary', { sortOrder: 1, tags: ['chapter-summary'] }),
      topic('hello-algo-intro', { sortOrder: 0 }),
      topic('orphan'),
      topic('cheatsheet-array'),
    ]
    expect(orderedSlugs('dsa', topics)).toEqual(['hello-algo-intro', 'cheatsheet-array', 'orphan', 'hello-algo-summary'])
  })

  it('includes variant topics after the main list of their section', () => {
    const topics = [
      topic('trees-blind75', { neetcodeRoadmap: { group: 'Trees', order: 1, isBlind75: true } }),
      topic('trees', { neetcodeRoadmap: { group: 'Trees', order: 1, isBlind75: false } }),
    ]
    expect(orderedSlugs('dsa', topics)).toEqual(['trees', 'trees-blind75'])
  })
})

describe('isListedTopic', () => {
  it('hides utility and hidden theory topics', () => {
    expect(isListedTopic('references')).toBe(false)
    expect(isListedTopic('donnemartin-cache')).toBe(false)
    expect(isListedTopic('caching')).toBe(true)
  })
})
