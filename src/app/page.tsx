import { getAllTopicFiles, readTopicMeta } from '@/lib/content/fs'
import type { TopicMeta } from '@/lib/content/types'
import { HomeClient } from './HomeClient'

export default function HomePage() {
  const topics = getAllTopicFiles()
    .map((f) => readTopicMeta<TopicMeta>(f.category, f.slug))
    .filter((t): t is TopicMeta => t !== null)

  return <HomeClient topics={topics} />
}
