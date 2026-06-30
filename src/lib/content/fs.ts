import fs from 'fs'
import path from 'path'

const contentDir = path.join(process.cwd(), 'src', 'content')

const metaCache = new Map<string, unknown>()
const mdxCache = new Map<string, string>()

function cacheKey(category: string, slug: string): string {
  return `${category}/${slug}`
}

export interface TopicFile {
  slug: string
  category: string
}

export function getTopicFiles(category: string): TopicFile[] {
  const dir = path.join(contentDir, category)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({
      slug: f.replace(/\.mdx$/, ''),
      category,
    }))
}

export function getAllTopicFiles(): TopicFile[] {
  if (!fs.existsSync(contentDir)) return []
  return fs.readdirSync(contentDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => getTopicFiles(e.name))
}

export function readTopicMdx(category: string, slug: string): string {
  const key = cacheKey(category, slug)
  const cached = mdxCache.get(key)
  if (cached !== undefined) return cached

  const filePath = path.join(contentDir, category, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    mdxCache.set(key, '')
    return ''
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  mdxCache.set(key, content)
  return content
}

export function readTopicMeta<T = Record<string, unknown>>(category: string, slug: string): T | null {
  const key = cacheKey(category, slug)
  if (metaCache.has(key)) return metaCache.get(key) as T | null

  const filePath = path.join(contentDir, category, `${slug}.json`)
  if (!fs.existsSync(filePath)) {
    metaCache.set(key, null)
    return null
  }
  const result = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  metaCache.set(key, result)
  return result
}
