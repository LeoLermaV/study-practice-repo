import MiniSearch from 'minisearch'
import type { TopicMeta } from './types'

let search: MiniSearch<TopicMeta> | null = null

export function createSearchIndex(topics: TopicMeta[]): MiniSearch<TopicMeta> {
  search = new MiniSearch<TopicMeta>({
    idField: 'slug',
    fields: ['title', 'tags'],
    storeFields: ['slug', 'title', 'category', 'difficulty', 'tags'],
    searchOptions: {
      boost: { title: 2, tags: 1 },
      prefix: true,
      fuzzy: 0.2,
    },
  })
  search.addAll(topics)
  return search
}

export function searchTopics(query: string, category?: string): TopicMeta[] {
  if (!search) return []
  const raw = search.search(query)
  let results = raw.map((r) => r as unknown as TopicMeta)
  if (category) {
    results = results.filter((r) => r.category === category)
  }
  return results
}
