import type { TopicMeta } from '../../src/lib/content/types'

export interface SourceAdapter {
  name: string
  cloneUrl: string
  topics(): Promise<TopicMeta[]>
  content(slug: string): Promise<string>
}
