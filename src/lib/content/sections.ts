export interface SectionDef {
  label: string
  description: string
  icon?: string
  slugPrefix?: string
  slugs: string[]
}

export function sectionId(label: string): string {
  return 'section-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const categoryTitles: Record<string, string> = {
  'system-design': 'System Design',
  dsa: 'Data Structures & Algorithms',
  'cs-fundamentals': 'CS Fundamentals',
  behavioral: 'Behavioral',
  ddia: 'Designing Data-Intensive Applications',
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

export const sectionsByCategory: Record<string, SectionDef[]> = {
  'system-design': [
    {
      label: 'Getting Started',
      description: 'What system design is and how interviews work.',
      icon: 'BookOpen',
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
      icon: 'Target',
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

  ddia: [
    {
      label: 'Chapter 1 — Reliable, Scalable, and Maintainable Applications',
      description: 'Thinking about data systems, reliability, scalability, and maintainability.',
      slugPrefix: 'ddia-ch1-',
      slugs: [],
    },
    {
      label: 'Chapter 2 — Data Models and Query Languages',
      description: 'Relational vs document models, NoSQL, query languages, and graph data models.',
      slugPrefix: 'ddia-ch2-',
      slugs: [],
    },
    {
      label: 'Chapter 3 — Storage and Retrieval',
      description: 'Indexes, LSM-trees, B-trees, column-oriented storage, and data warehousing.',
      slugPrefix: 'ddia-ch3-',
      slugs: [],
    },
    {
      label: 'Chapter 4 — Encoding and Evolution',
      description: 'Serialization formats, dataflow through databases, services, and message passing.',
      slugPrefix: 'ddia-ch4-',
      slugs: [],
    },
    {
      label: 'Chapter 5 — Replication',
      description: 'Leader-based, multi-leader, and leaderless replication. Consistency guarantees.',
      slugPrefix: 'ddia-ch5-',
      slugs: [],
    },
    {
      label: 'Chapter 6 — Partitioning',
      description: 'Key-range and hash-based partitioning, rebalancing, and request routing.',
      slugPrefix: 'ddia-ch6-',
      slugs: [],
    },
    {
      label: 'Chapter 7 — Transactions',
      description: 'ACID, read committed, snapshot isolation, serial execution, and SSI.',
      slugPrefix: 'ddia-ch7-',
      slugs: [],
    },
    {
      label: 'Chapter 8 — The Trouble with Distributed Systems',
      description: 'Unreliable networks, clocks, process pauses, and the system model.',
      slugPrefix: 'ddia-ch8-',
      slugs: [],
    },
    {
      label: 'Chapter 9 — Consistency and Consensus',
      description: 'Linearizability, total order broadcast, 2PC, consensus algorithms, and coordination services.',
      slugPrefix: 'ddia-ch9-',
      slugs: [],
    },
    {
      label: 'Chapter 10 — Batch Processing',
      description: 'Unix tools, MapReduce, join strategies, and the output of batch workflows.',
      slugPrefix: 'ddia-ch10-',
      slugs: [],
    },
    {
      label: 'Chapter 11 — Stream Processing',
      description: 'Message brokers, partitioned logs, event sourcing, stream joins, and fault tolerance.',
      slugPrefix: 'ddia-ch11-',
      slugs: [],
    },
    {
      label: 'Chapter 12 — The Future of Data Systems',
      description: 'Unbundling databases, dataflow, integrity, and the end-to-end argument.',
      slugPrefix: 'ddia-ch12-',
      slugs: [],
    },
  ],
}
