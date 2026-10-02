import { getAllTopicFiles, getTopicFiles, readTopicMeta } from './fs'
import type { Category, Difficulty, TopicMeta } from './types'
import { categoryOrder, categoryShortTitles, groupTopics, hiddenSlugs, isListedTopic, orderedSlugs } from './sections'

export interface LibraryTopic {
  slug: string
  title: string
  minutes: number
  difficulty: Difficulty
  /** hello-algo chapter summaries: shown with a "Recap" label. */
  recap: boolean
}

export interface LibrarySection {
  id: string
  label: string
  description: string
  topics: LibraryTopic[]
  variant?: { label: string; topics: LibraryTopic[] }
}

export interface LibraryCategory {
  id: Category
  title: string
  total: number
  sections: LibrarySection[]
}

export interface UnlistedTopic extends LibraryTopic {
  category: Category
}

/** Slim, serialisable view of all content, passed to client pages. */
export interface LibraryData {
  categories: LibraryCategory[]
  /**
   * Real topics kept out of listings (Quick Reference theory pages). They can
   * still be studied, so due lists need their titles.
   */
  unlisted: UnlistedTopic[]
}

function readCategory(category: string): TopicMeta[] {
  return getTopicFiles(category)
    .map((f) => {
      const meta = readTopicMeta<TopicMeta>(category, f.slug)
      return meta ? { ...meta, slug: f.slug } : null
    })
    .filter((t): t is TopicMeta => t !== null)
}

function slim(t: TopicMeta): LibraryTopic {
  return {
    slug: t.slug,
    title: t.title,
    minutes: t.estimatedReadingTime,
    difficulty: t.difficulty,
    recap: t.tags.includes('chapter-summary'),
  }
}

let libraryCache: LibraryData | null = null

export function getLibrary(): LibraryData {
  if (libraryCache) return libraryCache
  const unlisted: UnlistedTopic[] = []
  const categories = categoryOrder.map((id) => {
    const all = readCategory(id)
    for (const t of all) {
      if (hiddenSlugs.has(t.slug)) unlisted.push({ ...slim(t), category: id })
    }
    const topics = all.filter((t) => isListedTopic(t.slug))
    const { sections, leftovers } = groupTopics(id, topics)
    const out: LibrarySection[] = sections.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
      topics: s.topics.map(slim),
      ...(s.variant ? { variant: { label: s.variant.label, topics: s.variant.topics.map(slim) } } : {}),
    }))
    if (leftovers.length > 0) {
      out.push({ id: 'section-other-topics', label: 'Other topics', description: 'Topics not yet placed in a section.', topics: leftovers.map(slim) })
    }
    return { id, title: categoryShortTitles[id], total: topics.length, sections: out }
  })
  libraryCache = { categories, unlisted }
  return libraryCache
}

export interface TopicRef {
  slug: string
  category: Category
  title: string
  minutes: number
}

let indexCache: Map<string, TopicRef> | null = null

/**
 * Resolves any slug to its real category and title. Prerequisites and related
 * topics can point across categories (DDIA relates to System Design), so links
 * must not assume the current category.
 */
export function findTopic(slug: string): TopicRef | undefined {
  if (!indexCache) {
    indexCache = new Map()
    for (const f of getAllTopicFiles()) {
      const meta = readTopicMeta<TopicMeta>(f.category, f.slug)
      if (meta) {
        indexCache.set(f.slug, { slug: f.slug, category: f.category as Category, title: meta.title, minutes: meta.estimatedReadingTime })
      }
    }
  }
  return indexCache.get(slug)
}

export interface TopicPlacement {
  sectionLabel: string | null
  sectionId: string | null
  prev: TopicRef | null
  next: TopicRef | null
}

/** Where a topic sits in its category: breadcrumb section and prev/next. */
export function placeTopic(category: Category, slug: string): TopicPlacement {
  const topics = readCategory(category)
  const order = orderedSlugs(category, topics)
  const idx = order.indexOf(slug)
  const ref = (s: string | undefined) => (s ? findTopic(s) ?? null : null)

  const section = groupTopics(category, topics.filter((t) => isListedTopic(t.slug))).sections.find(
    (s) => s.topics.some((t) => t.slug === slug) || s.variant?.topics.some((t) => t.slug === slug)
  )

  return {
    sectionLabel: section?.label ?? null,
    sectionId: section?.id ?? null,
    prev: idx > 0 ? ref(order[idx - 1]) : null,
    next: idx >= 0 && idx < order.length - 1 ? ref(order[idx + 1]) : null,
  }
}
