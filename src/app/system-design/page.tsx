import { CategoryPageContent } from '@/components/layout/CategoryPage'
import { readTopicMeta, getTopicFiles } from '@/lib/content/fs'
import { utilitySlugs, hiddenSlugs } from '@/lib/content/sections'
import type { TopicMeta } from '@/lib/content/types'

export default function SystemDesignPage() {
  const files = getTopicFiles('system-design')
    .filter((f) => !utilitySlugs.has(f.slug) && !hiddenSlugs.has(f.slug))

  const topics = files
    .map((f) => {
      const meta = readTopicMeta<TopicMeta>(f.category, f.slug)
      return meta ? { ...meta, slug: f.slug } : null
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)

  return <CategoryPageContent category="system-design" topics={topics} />
}
