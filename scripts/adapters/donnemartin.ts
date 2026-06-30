import fs from 'fs'
import path from 'path'
import type { TopicMeta, Difficulty } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')
const repoName = 'donnemartin-system-design-primer'
const repoDir = path.join(cacheDir, repoName)
const readmePath = path.join(repoDir, 'README.md')
const rawBase = 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master'

interface TopicDef {
  id: string
  title: string
  category: 'system-design' | 'dsa'
  difficulty: Difficulty
  tags: string[]
  prerequisites: string[]
  relatedTopics: string[]
}

const theoryTopics: TopicDef[] = [
  {
    id: 'system-design-topics-start-here',
    title: 'System Design Topics',
    category: 'system-design', difficulty: 'beginner',
    tags: ['system-design', 'scalability', 'introduction'],
    prerequisites: [], relatedTopics: ['donnemartin-performance-vs-scalability', 'donnemartin-latency-vs-throughput'],
  },
  {
    id: 'performance-vs-scalability',
    title: 'Performance vs Scalability',
    category: 'system-design', difficulty: 'beginner',
    tags: ['system-design', 'performance', 'scalability'],
    prerequisites: ['donnemartin-system-design-topics'],
    relatedTopics: ['donnemartin-latency-vs-throughput'],
  },
  {
    id: 'latency-vs-throughput',
    title: 'Latency vs Throughput',
    category: 'system-design', difficulty: 'beginner',
    tags: ['system-design', 'latency', 'throughput'],
    prerequisites: ['donnemartin-system-design-topics'],
    relatedTopics: ['donnemartin-performance-vs-scalability'],
  },
  {
    id: 'availability-vs-consistency',
    title: 'Availability vs Consistency (CAP Theorem)',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'cap-theorem', 'availability', 'consistency'],
    prerequisites: ['donnemartin-system-design-topics'],
    relatedTopics: ['donnemartin-consistency-patterns', 'donnemartin-availability-patterns', 'cap-theorem'],
  },
  {
    id: 'consistency-patterns',
    title: 'Consistency Patterns',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'consistency', 'patterns'],
    prerequisites: ['donnemartin-availability-vs-consistency'],
    relatedTopics: ['donnemartin-availability-patterns'],
  },
  {
    id: 'availability-patterns',
    title: 'Availability Patterns',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'availability', 'patterns', 'failover', 'replication'],
    prerequisites: ['donnemartin-availability-vs-consistency'],
    relatedTopics: ['donnemartin-consistency-patterns', 'availability'],
  },
  {
    id: 'domain-name-system',
    title: 'Domain Name System (DNS)',
    category: 'system-design', difficulty: 'beginner',
    tags: ['system-design', 'dns', 'networking'],
    prerequisites: ['donnemartin-system-design-topics'],
    relatedTopics: ['donnemartin-content-delivery-network', 'domain-name-system-dns'],
  },
  {
    id: 'content-delivery-network',
    title: 'Content Delivery Network (CDN)',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'cdn', 'performance'],
    prerequisites: ['donnemartin-system-design-topics'],
    relatedTopics: ['donnemartin-domain-name-system', 'donnemartin-cache', 'content-delivery-network-cdn'],
  },
  {
    id: 'load-balancer',
    title: 'Load Balancer',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'load-balancer', 'scalability'],
    prerequisites: ['donnemartin-performance-vs-scalability'],
    relatedTopics: ['donnemartin-reverse-proxy', 'donnemartin-application-layer', 'load-balancing'],
  },
  {
    id: 'reverse-proxy-web-server',
    title: 'Reverse Proxy (Web Server)',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'reverse-proxy', 'web-server'],
    prerequisites: ['donnemartin-load-balancer'],
    relatedTopics: ['donnemartin-load-balancer', 'donnemartin-application-layer', 'proxy'],
  },
  {
    id: 'application-layer',
    title: 'Application Layer',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'microservices', 'service-discovery'],
    prerequisites: ['donnemartin-reverse-proxy'],
    relatedTopics: ['donnemartin-database', 'monoliths-and-microservices'],
  },
  {
    id: 'database',
    title: 'Database Overview',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'database', 'rdbms', 'nosql'],
    prerequisites: ['donnemartin-application-layer'],
    relatedTopics: ['donnemartin-cache', 'donnemartin-asynchronism', 'sql-databases', 'nosql-databases', 'sql-vs-nosql-databases'],
  },
  {
    id: 'cache',
    title: 'Cache',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'cache', 'performance'],
    prerequisites: ['donnemartin-database'],
    relatedTopics: ['donnemartin-content-delivery-network', 'donnemartin-asynchronism', 'caching'],
  },
  {
    id: 'asynchronism',
    title: 'Asynchronism',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'async', 'message-queues', 'task-queues'],
    prerequisites: ['donnemartin-database'],
    relatedTopics: ['donnemartin-communication', 'message-queues'],
  },
  {
    id: 'communication',
    title: 'Communication (TCP/UDP/RPC/REST)',
    category: 'system-design', difficulty: 'intermediate',
    tags: ['system-design', 'communication', 'tcp', 'udp', 'rpc', 'rest'],
    prerequisites: ['donnemartin-load-balancer'],
    relatedTopics: ['donnemartin-asynchronism', 'rest-graphql-grpc', 'tcp-and-udp'],
  },
  {
    id: 'security',
    title: 'Security',
    category: 'system-design', difficulty: 'advanced',
    tags: ['system-design', 'security'],
    prerequisites: ['donnemartin-communication'],
    relatedTopics: [],
  },
]

interface SolutionDef {
  dir: string
  title: string
  difficulty: Difficulty
  tags: string[]
  prerequisites: string[]
  relatedTopics: string[]
}

const solutionTopics: SolutionDef[] = [
  {
    dir: 'pastebin', title: 'Design Pastebin.com (or Bit.ly)',
    difficulty: 'intermediate',
    tags: ['system-design', 'pastebin', 'url-shortener', 'interview'],
    prerequisites: ['donnemartin-database', 'donnemartin-cache'],
    relatedTopics: ['donnemartin-twitter', 'donnemartin-web-crawler'],
  },
  {
    dir: 'twitter', title: 'Design Twitter Timeline and Search',
    difficulty: 'advanced',
    tags: ['system-design', 'twitter', 'social-media', 'interview'],
    prerequisites: ['donnemartin-database', 'donnemartin-cache'],
    relatedTopics: ['donnemartin-pastebin', 'donnemartin-social-graph', 'twitter'],
  },
  {
    dir: 'web_crawler', title: 'Design a Web Crawler',
    difficulty: 'advanced',
    tags: ['system-design', 'web-crawler', 'interview'],
    prerequisites: ['donnemartin-database'],
    relatedTopics: ['donnemartin-twitter'],
  },
  {
    dir: 'mint', title: 'Design Mint.com',
    difficulty: 'advanced',
    tags: ['system-design', 'mint', 'finance', 'interview'],
    prerequisites: ['donnemartin-database', 'donnemartin-cache'],
    relatedTopics: [],
  },
  {
    dir: 'social_graph', title: 'Design Social Network Data Structures',
    difficulty: 'advanced',
    tags: ['system-design', 'social-graph', 'interview'],
    prerequisites: ['donnemartin-database'],
    relatedTopics: ['donnemartin-twitter', 'donnemartin-pastebin'],
  },
  {
    dir: 'query_cache', title: 'Design a Key-Value Store for Search',
    difficulty: 'advanced',
    tags: ['system-design', 'key-value', 'cache', 'interview'],
    prerequisites: ['donnemartin-cache', 'donnemartin-database'],
    relatedTopics: ['donnemartin-pastebin', 'donnemartin-sales-rank'],
  },
  {
    dir: 'sales_rank', title: 'Design Amazon Sales Ranking',
    difficulty: 'advanced',
    tags: ['system-design', 'sales-rank', 'ecommerce', 'interview'],
    prerequisites: ['donnemartin-database', 'donnemartin-cache'],
    relatedTopics: ['donnemartin-query-cache'],
  },
  {
    dir: 'scaling_aws', title: 'Scaling to Millions of Users on AWS',
    difficulty: 'intermediate',
    tags: ['system-design', 'aws', 'scalability', 'interview'],
    prerequisites: ['donnemartin-load-balancer', 'donnemartin-database', 'donnemartin-cache'],
    relatedTopics: ['donnemartin-performance-vs-scalability'],
  },
]

interface OODef {
  dir: string
  title: string
  difficulty: Difficulty
  tags: string[]
}

const ooTopics: OODef[] = [
  { dir: 'hash_table', title: 'Design a Hash Map', difficulty: 'intermediate', tags: ['oo-design', 'hash-map', 'interview'] },
  { dir: 'lru_cache', title: 'Design an LRU Cache', difficulty: 'intermediate', tags: ['oo-design', 'lru-cache', 'interview'] },
  { dir: 'call_center', title: 'Design a Call Center', difficulty: 'intermediate', tags: ['oo-design', 'call-center', 'interview'] },
  { dir: 'deck_of_cards', title: 'Design a Deck of Cards', difficulty: 'intermediate', tags: ['oo-design', 'cards', 'interview'] },
  { dir: 'parking_lot', title: 'Design a Parking Lot', difficulty: 'intermediate', tags: ['oo-design', 'parking-lot', 'interview'] },
  { dir: 'online_chat', title: 'Design a Chat Server', difficulty: 'advanced', tags: ['oo-design', 'chat', 'interview'] },
]

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-')
}

function extractSection(readme: string, headingId: string): string {
  const headingMatch = readme.match(new RegExp(`## ${escapeRegex(headingId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}`, 'i'))
  if (!headingMatch || headingMatch.index === undefined) {
    const altMatch = readme.match(new RegExp(`## [^\\n]*${escapeRegex(headingId.replace(/-/g, '[^a-z]*'))}[^\\n]*`, 'i'))
    if (!altMatch || altMatch.index === undefined) return ''
    const start = altMatch.index
    const afterHeading = readme.indexOf('\n', start) + 1
    const nextMatch = readme.slice(afterHeading).match(/\n## /)
    if (!nextMatch || nextMatch.index === undefined) return readme.slice(afterHeading).trim()
    return readme.slice(afterHeading, afterHeading + nextMatch.index).trim()
  }
  const start = headingMatch.index
  const afterHeading = readme.indexOf('\n', start) + 1
  const nextMatch = readme.slice(afterHeading).match(/\n## /)
  if (!nextMatch || nextMatch.index === undefined) return readme.slice(afterHeading).trim()
  return readme.slice(afterHeading, afterHeading + nextMatch.index).trim()
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function slugifyId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function processReadmeContent(content: string, prefix: string): string {
  if (!content) return ''

  let result = content

  result = result.replace(/<p\s+align="center">\s*\n?/g, '')
  result = result.replace(/<\/p>\s*\n?/g, '')
  result = result.replace(/<br\s*\/?>\s*\n?/g, '\n')

  result = result.replace(
    /<img\s+src="([^"]+)"\s*\/?>/g,
    (_match, src: string) => {
      const url = src.startsWith('http') ? src : `${rawBase}/${src}`
      return `![diagram](${url})`
    }
  )

  result = result.replace(
    /<i><a\s+href="?([^">\s]+)"?>[^<]*Source[^<]*<\/a><\/i>/g,
    (_match, href: string) => `*[Source](${href})*`
  )

  result = result.replace(
    /<i><a\s+href="?([^">\s]+)"?>([^<]+)<\/a><\/i>/g,
    (_match, href: string, text: string) => `*[${text}](${href})*`
  )

  result = result.replace(
    /!\[Imgur\]\(([^)]+)\)/g,
    (_match, src: string) => {
      const url = src.startsWith('http') ? src : `${rawBase}/${src}`
      return `![diagram](${url})`
    }
  )

  result = result.replace(
    /<sup><a\s+href="([^"]+)">([^<]+)<\/a><\/sup>/g,
    (_match, href: string, text: string) => `[${text}](${href})`
  )

  result = result.replace(/\[([^\]]+)\]\(#[^)]+\)/g, '$1')

  const tagPlaceholders: [RegExp, string][] = [
    [/<table>/gm, '\x00TABLE\x00'],
    [/<\/table>/gm, '\x00/TABLE\x00'],
    [/<tr>/gm, '\x00TR\x00'],
    [/<\/tr>/gm, '\x00/TR\x00'],
    [/<td>/gm, '\x00TD\x00'],
    [/<\/td>/gm, '\x00/TD\x00'],
    [/<th>/gm, '\x00TH\x00'],
    [/<\/th>/gm, '\x00/TH\x00'],
    [/<br\s*\/?>/gm, '\n'],
    [/<\/?strong>/gm, '**'],
    [/<\/?em>/gm, '*'],
    [/<\/?code>/gm, '`'],
  ]
  for (const [pattern, placeholder] of tagPlaceholders) {
    result = result.replace(pattern, placeholder)
  }

  result = result.replace(/</g, '&lt;')

  const restoreMap: [string, string][] = [
    ['\x00TABLE\x00', '<table>'],
    ['\x00/TABLE\x00', '</table>'],
    ['\x00TR\x00', '<tr>'],
    ['\x00/TR\x00', '</tr>'],
    ['\x00TD\x00', '<td>'],
    ['\x00/TD\x00', '</td>'],
    ['\x00TH\x00', '<th>'],
    ['\x00/TH\x00', '</th>'],
  ]
  for (const [placeholder, tag] of restoreMap) {
    result = result.replace(new RegExp(placeholder.replace(/\x00/g, '\\x00'), 'g'), tag)
  }

  result = result.replace(/\n{4,}/g, '\n\n').trim()

  return result
}

function readSolutionReadme(dir: string): string {
  const filePath = path.join(repoDir, 'solutions', 'system_design', dir, 'README.md')
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}

function parseIpynb(dir: string): string {
  const ipynbDir = path.join(repoDir, 'solutions', 'object_oriented_design', dir)
  const files = fs.readdirSync(ipynbDir)
  const nbFile = files.find((f) => f.endsWith('.ipynb'))
  if (!nbFile) {
    const pyFile = files.find((f) => f.endsWith('.py') && f !== '__init__.py')
    if (pyFile) {
      const code = fs.readFileSync(path.join(ipynbDir, pyFile), 'utf-8')
      return `## Solution\n\n\`\`\`python\n${code}\n\`\`\``
    }
    return ''
  }

  try {
    const raw = fs.readFileSync(path.join(ipynbDir, nbFile), 'utf-8')
    const nb = JSON.parse(raw)
    const cells: string[] = []
    for (const cell of (nb.cells || [])) {
      if (cell.cell_type === 'markdown') {
        cells.push((cell.source || []).join(''))
      } else if (cell.cell_type === 'code') {
        const code = (cell.source || []).join('')
        if (code.trim()) {
          cells.push(`\`\`\`python\n${code}\n\`\`\``)
        }
      }
    }
    return cells.join('\n\n')
  } catch {
    return ''
  }
}

export class DonnemartinAdapter implements SourceAdapter {
  name = 'donnemartin-system-design-primer'
  cloneUrl = 'https://github.com/donnemartin/system-design-primer.git'

  private _topics: TopicMeta[] | null = null
  private _topicBodies: Map<string, string> = new Map()

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    if (!fs.existsSync(readmePath)) throw new Error('README.md not found in cloned repo')

    const readme = fs.readFileSync(readmePath, 'utf-8')
    const topics: TopicMeta[] = []

    for (const def of theoryTopics) {
      const slug = `donnemartin-${slugifyId(def.id)}`
      const section = extractSection(readme, def.id)

      const processed = processReadmeContent(section, slug)
      this._topicBodies.set(slug, processed)

      const wordCount = section.split(/\s+/).length
      topics.push({
        slug,
        title: def.title,
        category: def.category,
        difficulty: def.difficulty,
        estimatedReadingTime: Math.max(1, Math.ceil(wordCount / 200)),
        tags: def.tags,
        prerequisites: def.prerequisites,
        relatedTopics: def.relatedTopics,
        sourceRepos: [this.name],
      })
    }

    for (const def of solutionTopics) {
      const slug = `donnemartin-${def.dir}`
      const raw = readSolutionReadme(def.dir)
      if (!raw) {
        console.log(`  WARN: solution README not found: ${def.dir}`)
        continue
      }

      const processed = processReadmeContent(raw, slug)
      this._topicBodies.set(slug, processed)

      const wordCount = raw.split(/\s+/).length
      topics.push({
        slug,
        title: def.title,
        category: 'system-design',
        difficulty: def.difficulty,
        estimatedReadingTime: Math.max(1, Math.ceil(wordCount / 200)),
        tags: def.tags,
        prerequisites: def.prerequisites,
        relatedTopics: def.relatedTopics,
        sourceRepos: [this.name],
      })
    }

    for (const def of ooTopics) {
      const slug = `donnemartin-oo-${def.dir}`
      const raw = parseIpynb(def.dir)
      if (!raw) {
        console.log(`  WARN: OO design content not found: ${def.dir}`)
        continue
      }

      const processed = processReadmeContent(raw, slug)
      this._topicBodies.set(slug, processed)

      const wordCount = raw.split(/\s+/).length
      topics.push({
        slug,
        title: def.title,
        category: 'dsa',
        difficulty: def.difficulty,
        estimatedReadingTime: Math.max(1, Math.ceil(wordCount / 200)),
        tags: def.tags,
        prerequisites: [],
        relatedTopics: [],
        sourceRepos: [this.name],
      })
    }

    this._topics = topics
    console.log(`  Donnemartin topics: ${topics.length}`)
    return topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    return this._topicBodies.get(slug) ?? ''
  }
}
