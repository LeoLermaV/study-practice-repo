import type { Category } from '@/lib/content/types'
import type { LibraryCategory, LibrarySection, LibraryTopic } from '@/lib/content/library'
import { topicStatus } from '@/lib/progress/status'
import type { ProgressState } from '@/lib/progress/useProgress'

export function sectionTopics(section: LibrarySection): LibraryTopic[] {
  return [...section.topics, ...(section.variant?.topics ?? [])]
}

export function countStudied(category: LibraryCategory, progress: ProgressState): number {
  let n = 0
  for (const s of category.sections) {
    for (const t of sectionTopics(s)) if (topicStatus(progress.bySlug.get(t.slug)) === 'studied') n++
  }
  return n
}

export function topicHref(t: { category: Category; slug: string }): string {
  return `/${t.category}/${t.slug}`
}
