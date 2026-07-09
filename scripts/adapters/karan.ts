import fs from 'fs'
import path from 'path'
import type { TopicMeta, Difficulty } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')

const CHAPTER_PROGRESSION: Record<string, Difficulty> = {
  'what-is-system-design': 'beginner',
  'system-design': 'beginner',
  'ip': 'beginner',
  'osi-model': 'beginner',
  'tcp-and-udp': 'beginner',
  'domain-name-system': 'beginner',
  'load-balancing': 'beginner',
  'clustering': 'beginner',
  'caching': 'intermediate',
  'content-delivery-network': 'intermediate',
  'proxy': 'intermediate',
  'availability': 'intermediate',
  'scalability': 'intermediate',
  'storage': 'intermediate',
  'databases-and-dbms': 'intermediate',
  'sql-databases': 'intermediate',
  'nosql-databases': 'intermediate',
  'sql-vs-nosql': 'intermediate',
  'database-replication': 'intermediate',
  'indexes': 'intermediate',
  'normalization-and-denormalization': 'intermediate',
  'acid-and-base': 'advanced',
  'cap-theorem': 'advanced',
  'paceclc-theorem': 'advanced',
  'transactions': 'advanced',
  'distributed-transactions': 'advanced',
  'sharding': 'advanced',
  'consistent-hashing': 'advanced',
  'database-federation': 'advanced',
  'n-tier-architecture': 'intermediate',
  'message-brokers': 'intermediate',
  'message-queues': 'intermediate',
  'publish-subscribe': 'intermediate',
  'enterprise-service-bus': 'advanced',
  'monoliths-and-microservices': 'intermediate',
  'event-driven-architecture': 'advanced',
  'event-sourcing': 'advanced',
  'cqrs': 'advanced',
  'api-gateway': 'intermediate',
  'rest-graphql-grpc': 'intermediate',
  'long-polling-websockets-sse': 'intermediate',
  'geohashing-and-quadtrees': 'advanced',
  'circuit-breaker': 'advanced',
  'rate-limiting': 'advanced',
  'service-discovery': 'advanced',
  'sla-slo-sli': 'advanced',
  'disaster-recovery': 'advanced',
  'vms-and-containers': 'intermediate',
  'oauth-2-and-oidc': 'advanced',
  'single-sign-on': 'advanced',
  'ssl-tls-mtls': 'advanced',
  'url-shortener': 'advanced',
  'whatsapp': 'advanced',
  'twitter': 'advanced',
  'netflix': 'advanced',
  'uber': 'advanced',
}

const KNOWN_TAGS: Record<string, string[]> = {
  'ip': ['networking', 'protocols'],
  'osi-model': ['networking', 'protocols'],
  'tcp-and-udp': ['networking', 'protocols', 'transport'],
  'domain-name-system': ['networking', 'dns'],
  'load-balancing': ['networking', 'architecture', 'scalability'],
  'caching': ['performance', 'architecture', 'databases'],
  'content-delivery-network': ['networking', 'performance'],
  'availability': ['architecture', 'distributed-systems'],
  'cap-theorem': ['distributed-systems', 'databases', 'consistency'],
  'consistent-hashing': ['distributed-systems', 'scalability', 'databases'],
  'message-queues': ['architecture', 'async', 'distributed-systems'],
  'sharding': ['databases', 'scalability', 'distributed-systems'],
  'database-replication': ['databases', 'distributed-systems', 'availability'],
  'rest-graphql-grpc': ['api', 'networking', 'architecture'],
  'monoliths-and-microservices': ['architecture', 'patterns'],
}

function inferTags(slug: string): string[] {
  if (KNOWN_TAGS[slug]) return KNOWN_TAGS[slug]
  return ['system-design', slug.replace(/-/g, ' ')]
}

function inferPrerequisites(topics: { slug: string; order: number }[]): Map<string, string[]> {
  const prereqs = new Map<string, string[]>()
  for (let i = 0; i < topics.length; i++) {
    const related: string[] = []
    if (i > 0) related.push(topics[i - 1].slug)
    if (i > 1) related.push(topics[i - 2].slug)
    prereqs.set(topics[i].slug, related)
  }
  return prereqs
}

const PREREQ_OVERRIDES: Record<string, string[]> = {
  'system-design-interviews': ['what-is-system-design'],
}

export class KaranAdapter implements SourceAdapter {
  name = 'karanpratapsingh-system-design'
  cloneUrl = 'https://github.com/karanpratapsingh/system-design.git'

  private parsedTopics: { slug: string; title: string; body: string; order: number }[] = []
  private allTopics: TopicMeta[] = []

  async topics(): Promise<TopicMeta[]> {
    const filePath = path.join(cacheDir, this.name, 'README.md')
    if (!fs.existsSync(filePath)) throw new Error('README.md not found in cloned repo')
    const content = fs.readFileSync(filePath, 'utf-8')

    const sections = content.split(/(?=^# )/m)
    const topicSections = sections.filter((s) => {
      const firstLine = s.trim().split('\n')[0]
      const lower = firstLine.toLowerCase()
      return firstLine.startsWith('# ') && firstLine.trim() !== '# System Design'
        && !lower.includes('table of contents')
        && !lower.includes('next steps')
        && !lower.includes('references')
    })

    this.parsedTopics = []
    for (const section of topicSections) {
      const lines = section.trim().split('\n')
      const titleLine = lines[0].replace(/^# /, '').trim()
      const body = lines.slice(1).join('\n').trim()
      const slug = titleLine
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      if (body) {
        this.parsedTopics.push({ slug, title: titleLine, body, order: this.parsedTopics.length })
      }
    }

    const orderMap = new Map(this.parsedTopics.map((t) => [t.slug, t.order]))
    const prereqs = inferPrerequisites(this.parsedTopics)
    for (const [slug, override] of Object.entries(PREREQ_OVERRIDES)) {
      prereqs.set(slug, override)
    }

    this.allTopics = this.parsedTopics.map((t) => {
      const related = this.parsedTopics
        .filter((other) => other.order !== t.order && other.slug !== t.slug)
        .slice(-3)
        .map((other) => other.slug)

      return {
        slug: t.slug,
        title: t.title,
        category: 'system-design' as const,
        difficulty: CHAPTER_PROGRESSION[t.slug] ?? 'intermediate',
        estimatedReadingTime: Math.ceil(t.body.split(/\s+/).length / 200),
        tags: inferTags(t.slug),
        prerequisites: prereqs.get(t.slug) ?? [],
        relatedTopics: related,
        sourceRepos: [this.name],
      }
    })

    return this.allTopics
  }

  async content(slug: string): Promise<string> {
    if (this.parsedTopics.length === 0) await this.topics()
    const topic = this.parsedTopics.find((t) => t.slug === slug)
    if (!topic) return ''
    return topic.body
  }
}
