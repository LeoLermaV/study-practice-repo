import MiniSearch, { type Options } from 'minisearch'
import type { TopicMeta } from './types'

/** A topic as indexed: metadata plus its section headings joined into one field. */
export type SearchDocument = TopicMeta & { headings?: string }

/**
 * Shared by the build (createSearchIndex) and the browser (MiniSearch.loadJS):
 * a serialised index must be loaded with the options it was built with.
 * Headings are searchable but not stored, to keep the file small.
 */
export const searchIndexOptions: Options<SearchDocument> = {
  idField: 'slug',
  fields: ['title', 'tags', 'headings'],
  storeFields: ['slug', 'title', 'category', 'difficulty', 'tags', 'estimatedReadingTime'],
  searchOptions: {
    boost: { title: 2, tags: 1, headings: 0.5 },
    prefix: true,
    fuzzy: 0.2,
  },
}

export function createSearchIndex(topics: SearchDocument[]): MiniSearch<SearchDocument> {
  const search = new MiniSearch<SearchDocument>(searchIndexOptions)
  search.addAll(topics)
  return search
}
