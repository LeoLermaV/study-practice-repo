import fs from 'fs'
import path from 'path'
import type { TopicMeta, TopicGraph, TopicGraphEdge } from './types'

const contentDir = path.join(process.cwd(), 'src', 'content')

export function getAllTopics(): TopicMeta[] {
  const dirs: string[] = []
  for (const entry of fs.readdirSync(contentDir, { withFileTypes: true })) {
    if (entry.isDirectory()) dirs.push(entry.name)
  }
  const topics: TopicMeta[] = []
  for (const dir of dirs) {
    const dirPath = path.join(contentDir, dir)
    for (const file of fs.readdirSync(dirPath)) {
      if (file.endsWith('.mdx') || file.endsWith('.md')) {
        const slug = file.replace(/\.(mdx|md)$/, '')
        const metaPath = path.join(dirPath, `${slug}.json`)
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as TopicMeta
          topics.push(meta)
        }
      }
    }
  }
  return topics
}

export function getTopicsByCategory(category: string): TopicMeta[] {
  return getAllTopics().filter((t) => t.category === category)
}

export function getTopic(slug: string): TopicMeta | undefined {
  return getAllTopics().find((t) => t.slug === slug)
}

export function buildTopicGraph(): TopicGraph {
  const topics = getAllTopics()
  const edges: TopicGraphEdge[] = []
  for (const topic of topics) {
    for (const prereq of topic.prerequisites) {
      edges.push({ source: prereq, target: topic.slug, type: 'prerequisite' })
    }
    for (const related of topic.relatedTopics) {
      edges.push({ source: topic.slug, target: related, type: 'related' })
    }
  }
  return { nodes: topics, edges }
}
