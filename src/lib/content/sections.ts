import type { Category, TopicMeta } from './types'

/** The fields grouping needs. Pages pass slimmer objects than a full TopicMeta. */
export type GroupableTopic = Pick<TopicMeta, 'slug' | 'title' | 'difficulty' | 'tags'> &
  Partial<Pick<TopicMeta, 'sortOrder' | 'neetcodeRoadmap' | 'leetcodePatterns'>>

export interface SectionDef {
  label: string
  description: string
  /** Topics whose slug starts with this are grouped here. */
  slugPrefix?: string
  /** Explicit members, shown in this order. */
  slugs: string[]
  /** Metadata-based membership, for sources whose slugs share no prefix. */
  match?: (topic: GroupableTopic) => boolean
  /** Order for prefix/match sections. Defaults to sortOrder, then title. */
  sort?: (a: GroupableTopic, b: GroupableTopic) => number
  /** An alternative topic set the section can be switched to (e.g. Blind 75). */
  variant?: { label: string; match: (topic: GroupableTopic) => boolean }
}

export function sectionId(label: string): string {
  return 'section-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const categoryOrder: Category[] = ['system-design', 'dsa', 'ddia', 'cs-fundamentals', 'behavioral']

export const categoryTitles: Record<string, string> = {
  'system-design': 'System Design',
  dsa: 'Data Structures & Algorithms',
  'cs-fundamentals': 'CS Fundamentals',
  behavioral: 'Behavioral',
  ddia: 'Designing Data-Intensive Applications',
}

export const categoryShortTitles: Record<Category, string> = {
  'system-design': 'System Design',
  dsa: 'DS&A',
  ddia: 'DDIA',
  'cs-fundamentals': 'CS Fundamentals',
  behavioral: 'Behavioral',
}

/** CSS colour for a category's identifying dot. */
export function categoryColor(category: string): string {
  return `var(--cat-${category})`
}

export const utilitySlugs = new Set([
  'table-of-contents', 'references', 'next-steps',
])

export const hiddenSlugs = new Set([
  'donnemartin-system-design-topics-start-here', 'donnemartin-performance-vs-scalability',
  'donnemartin-latency-vs-throughput', 'donnemartin-availability-vs-consistency',
  'donnemartin-consistency-patterns', 'donnemartin-availability-patterns',
  'donnemartin-domain-name-system', 'donnemartin-content-delivery-network',
  'donnemartin-load-balancer', 'donnemartin-reverse-proxy-web-server',
  'donnemartin-application-layer', 'donnemartin-database', 'donnemartin-cache',
  'donnemartin-asynchronism', 'donnemartin-communication', 'donnemartin-security',
])


function byOrderThenTitle(a: GroupableTopic, b: GroupableTopic): number {
  const diff = (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
  return diff !== 0 ? diff : a.title.localeCompare(b.title)
}

function byNeetcodeOrder(a: GroupableTopic, b: GroupableTopic): number {
  const diff = (a.neetcodeRoadmap?.order ?? 999) - (b.neetcodeRoadmap?.order ?? 999)
  return diff !== 0 ? diff : a.title.localeCompare(b.title)
}

/** The chapter overview page leads its chapter; sections follow in book order. */
function ddiaChapterFirst(n: number) {
  const overview = `ddia-ch${n}`
  return (a: GroupableTopic, b: GroupableTopic): number => {
    if (a.slug === overview) return -1
    if (b.slug === overview) return 1
    return byOrderThenTitle(a, b)
  }
}

const ddiaChapters: [number, string, string][] = [
  [1, 'Reliable, Scalable, and Maintainable Applications', 'Thinking about data systems, reliability, scalability, and maintainability.'],
  [2, 'Data Models and Query Languages', 'Relational vs document models, NoSQL, query languages, and graph data models.'],
  [3, 'Storage and Retrieval', 'Indexes, LSM-trees, B-trees, column-oriented storage, and data warehousing.'],
  [4, 'Encoding and Evolution', 'Serialization formats, dataflow through databases, services, and message passing.'],
  [5, 'Replication', 'Leader-based, multi-leader, and leaderless replication. Consistency guarantees.'],
  [6, 'Partitioning', 'Key-range and hash-based partitioning, rebalancing, and request routing.'],
  [7, 'Transactions', 'ACID, read committed, snapshot isolation, serial execution, and SSI.'],
  [8, 'The Trouble with Distributed Systems', 'Unreliable networks, clocks, process pauses, and the system model.'],
  [9, 'Consistency and Consensus', 'Linearizability, total order broadcast, 2PC, consensus algorithms, and coordination services.'],
  [10, 'Batch Processing', 'Unix tools, MapReduce, join strategies, and the output of batch workflows.'],
  [11, 'Stream Processing', 'Message brokers, partitioned logs, event sourcing, stream joins, and fault tolerance.'],
  [12, 'The Future of Data Systems', 'Unbundling databases, dataflow, integrity, and the end-to-end argument.'],
]

export const sectionsByCategory: Record<string, SectionDef[]> = {
  'system-design': [
    {
      label: 'Getting Started',
      description: 'What system design is and how interviews work.',
      slugs: ['what-is-system-design', 'system-design-interviews'],
    },
    {
      label: 'Foundations',
      description: 'Core networking concepts everything else depends on.',
      slugs: ['ip', 'osi-model', 'tcp-and-udp', 'domain-name-system-dns', 'load-balancing'],
    },
    {
      label: 'Infrastructure',
      description: 'How systems scale — caching, CDNs, proxies, and availability patterns.',
      slugs: ['clustering', 'caching', 'content-delivery-network-cdn', 'proxy', 'availability', 'scalability', 'storage'],
    },
    {
      label: 'Data Layer',
      description: 'Databases, consistency models, replication, and partitioning strategies.',
      slugs: [
        'databases-and-dbms', 'sql-databases', 'nosql-databases', 'sql-vs-nosql-databases',
        'database-replication', 'indexes', 'normalization-and-denormalization',
        'acid-and-base-consistency-models', 'cap-theorem', 'pacelc-theorem',
        'transactions', 'distributed-transactions',
        'sharding', 'consistent-hashing', 'database-federation',
      ],
    },
    {
      label: 'Architecture',
      description: 'Service communication, messaging, and architectural patterns.',
      slugs: [
        'n-tier-architecture', 'message-brokers', 'message-queues', 'publish-subscribe',
        'enterprise-service-bus-esb',
        'monoliths-and-microservices', 'event-driven-architecture-eda',
        'event-sourcing', 'command-and-query-responsibility-segregation-cqrs',
        'api-gateway', 'rest-graphql-grpc', 'long-polling-websockets-server-sent-events-sse',
      ],
    },
    {
      label: 'Advanced Infrastructure',
      description: 'Resilience, rate limiting, service discovery, and operational tooling.',
      slugs: [
        'geohashing-and-quadtrees', 'circuit-breaker', 'rate-limiting', 'service-discovery',
        'sla-slo-sli', 'disaster-recovery', 'virtual-machines-vms-and-containers',
      ],
    },
    {
      label: 'Security',
      description: 'Authentication, authorization, and transport security protocols.',
      slugs: ['oauth-2-0-and-openid-connect-oidc', 'single-sign-on-sso', 'ssl-tls-mtls'],
    },
    {
      label: 'Case Studies',
      description: 'Apply everything by studying real-world system designs.',
      slugs: ['url-shortener', 'whatsapp', 'twitter', 'netflix', 'uber'],
    },
    {
      label: 'Interview Practice',
      description: 'Step-by-step solution walkthroughs with diagrams. Attempt after learning the theory.',
      slugs: [
        'donnemartin-pastebin', 'donnemartin-twitter', 'donnemartin-web_crawler',
        'donnemartin-mint', 'donnemartin-social_graph', 'donnemartin-query_cache',
        'donnemartin-sales_rank', 'donnemartin-scaling_aws',
      ],
    },
  ],

  dsa: [
    {
      label: 'hello-algo',
      description: 'Book-quality prose explanations covering all major data structures and algorithms.',
      slugPrefix: 'hello-algo-',
      slugs: [],
    },
    {
      label: 'Advanced Algorithms',
      description: 'Shortest paths, minimum spanning trees, and classic two-pointer techniques not covered elsewhere.',
      slugs: [
        'shortest-paths', 'minimum-spanning-tree', 'fast-slow-pointers', 'kadanes-algorithm',
        'sliding-window-template',
        'sliding-window-longest-substring-without-repeating',
        'sliding-window-longest-repeating-character-replacement',
        'sliding-window-minimum-window-substring',
      ],
    },
    {
      label: 'Cheatsheets',
      description: 'Quick reference guides with time complexity tables, corner cases, and essential LeetCode questions.',
      slugPrefix: 'cheatsheet-',
      slugs: [],
    },
    {
      label: 'Python Practice — Easy',
      description: 'Python fundamentals: loops, lists, strings, sets, dicts, digit manipulation, and built-in helpers.',
      slugs: [
        'python-practice-easy-loops-and-conditions',
        'python-practice-easy-lists-and-comprehensions',
        'python-practice-easy-string-operations',
        'python-practice-easy-sets-and-predicates',
        'python-practice-easy-dictionaries-and-counting',
        'python-practice-easy-digit-manipulation',
        'python-practice-easy-sorting-and-builtins',
      ],
    },
    {
      label: 'Python Practice — Medium',
      description: 'Early- to mid-pattern DSA concepts applied in Python: stacks and sliding window.',
      slugs: [
        'python-practice-easy-stacks',
        'python-practice-medium-sliding-window',
      ],
    },
    {
      label: 'Python Practice — Hard',
      description: 'Late-pattern DSA concepts: bit manipulation, math, and geometry tricks.',
      slugs: [
        'python-practice-easy-bitwise-and-math',
      ],
    },
    {
      label: 'LeetCode Hints',
      description: 'Practice problems with syntax refreshers and solution hints to get you started. Each topic maps to a specific LeetCode Easy problem.',
      slugPrefix: 'leetcode-hint-',
      slugs: [],
    },
    {
      label: 'Problem Lists',
      description: 'Curated LeetCode problems organized by pattern, with company frequency data.',
      slugs: [],
      match: (t) => t.leetcodePatterns !== undefined,
    },
    {
      label: 'NeetCode Roadmap',
      description: 'The NeetCode 150 problem groups in roadmap order. Switch to Blind 75 for the shorter list.',
      slugs: [],
      match: (t) => t.neetcodeRoadmap !== undefined && !t.neetcodeRoadmap.isBlind75,
      sort: byNeetcodeOrder,
      variant: {
        label: 'Blind 75',
        match: (t) => t.neetcodeRoadmap?.isBlind75 === true,
      },
    },
    {
      label: 'Object-Oriented Design',
      description: 'Classic OO design interview questions: parking lot, LRU cache, call center, and more.',
      slugPrefix: 'donnemartin-oo-',
      slugs: [],
    },
  ],

  behavioral: [
    {
      label: 'Interview Guides',
      description: 'How to prepare for behavioral interviews with the STAR method.',
      slugs: ['behavioral-interview-guide', 'behavioral-rubrics', 'behavioral-questions', 'behavioral-senior', 'self-introduction', 'final-questions'],
    },
    {
      label: 'Career & Negotiation',
      description: 'Resume, compensation, and salary negotiation.',
      slugs: ['resume-guide', 'understanding-compensation', 'salary-negotiation', 'negotiation-rules', 'choosing-between-companies'],
    },
  ],

  'cs-fundamentals': [
    {
      label: 'Coding Interview Prep',
      description: 'Everything you need to prepare for coding interviews at top tech companies.',
      slugs: [
        'coding-interview-prep', 'picking-a-language', 'study-plan',
        'interview-cheatsheet', 'problem-solving-techniques',
        'mock-interviews', 'interview-rubrics',
      ],
    },
  ],

  ddia: ddiaChapters.map(([n, title, description]) => ({
    label: `Chapter ${n} — ${title}`,
    description,
    slugs: [],
    match: (t: GroupableTopic) => t.slug === `ddia-ch${n}` || t.slug.startsWith(`ddia-ch${n}-`),
    sort: ddiaChapterFirst(n),
  })),
}

export function isListedTopic(slug: string): boolean {
  return !utilitySlugs.has(slug) && !hiddenSlugs.has(slug)
}

export interface GroupedSection<T extends GroupableTopic> {
  id: string
  label: string
  description: string
  topics: T[]
  /** Present only for sections with a variant; the alternative topic set. */
  variant?: { label: string; topics: T[] }
}

export interface GroupedCategory<T extends GroupableTopic> {
  sections: GroupedSection<T>[]
  /** Topics no section claims. Empty when sections.ts is complete. */
  leftovers: T[]
}

const difficultyRank: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

function belongs(def: SectionDef, topic: GroupableTopic): boolean {
  if (def.slugPrefix && topic.slug.startsWith(def.slugPrefix)) return true
  if (def.match?.(topic)) return true
  return def.slugs.includes(topic.slug)
}

/**
 * The single source of truth for how a category's topics are grouped and
 * ordered. The library, the review list, and topic-page prev/next all use it,
 * so a topic cannot sit in one place in the list and another in navigation.
 * A topic belongs to the first section that claims it.
 */
export function groupTopics<T extends GroupableTopic>(category: string, topics: T[]): GroupedCategory<T> {
  const defs = sectionsByCategory[category] ?? []
  const claimed = new Set<string>()

  const take = (predicate: (t: T) => boolean): T[] => {
    const out: T[] = []
    for (const t of topics) {
      if (!claimed.has(t.slug) && predicate(t)) {
        claimed.add(t.slug)
        out.push(t)
      }
    }
    return out
  }

  const sections: GroupedSection<T>[] = []
  for (const def of defs) {
    const members = take((t) => belongs(def, t))
    if (def.slugs.length > 0 && !def.slugPrefix && !def.match) {
      members.sort((a, b) => def.slugs.indexOf(a.slug) - def.slugs.indexOf(b.slug))
    } else {
      members.sort(def.sort ?? byOrderThenTitle)
    }

    let variant: GroupedSection<T>['variant']
    if (def.variant) {
      const alt = take(def.variant.match).sort(def.sort ?? byOrderThenTitle)
      if (alt.length > 0) variant = { label: def.variant.label, topics: alt }
    }

    if (members.length > 0 || variant) {
      sections.push({ id: sectionId(def.label), label: def.label, description: def.description, topics: members, variant })
    }
  }

  const leftovers = topics
    .filter((t) => !claimed.has(t.slug))
    .sort((a, b) => (difficultyRank[a.difficulty] ?? 0) - (difficultyRank[b.difficulty] ?? 0) || a.title.localeCompare(b.title))

  return { sections, leftovers }
}

/**
 * Reading order for prev/next. Chapter summaries stay out of the in-section
 * sequence (they recap what was just read); they and anything unsectioned
 * follow at the end so every page is still reachable.
 */
export function orderedSlugs(category: string, topics: GroupableTopic[]): string[] {
  const { sections, leftovers } = groupTopics(category, topics)
  const ordered: string[] = []
  const seen = new Set<string>()
  const push = (slug: string) => {
    if (!seen.has(slug)) {
      seen.add(slug)
      ordered.push(slug)
    }
  }
  for (const section of sections) {
    for (const t of [...section.topics, ...(section.variant?.topics ?? [])]) {
      if (!t.tags.includes('chapter-summary')) push(t.slug)
    }
  }
  for (const t of leftovers) push(t.slug)
  for (const t of topics) push(t.slug)
  return ordered
}
