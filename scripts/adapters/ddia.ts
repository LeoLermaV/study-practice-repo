import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import type { TopicMeta, Difficulty } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

interface DDIAChapter {
  number: number
  title: string
  sections: string[]
  difficulty: Difficulty
}

const chapters: DDIAChapter[] = [
  {
    number: 1,
    title: 'Reliable, Scalable, and Maintainable Applications',
    difficulty: 'beginner',
    sections: [
      'Thinking About Data Systems',
      'Reliability — Hardware Faults',
      'Reliability — Software Errors',
      'Reliability — Human Errors',
      'Scalability — Describing Load',
      'Scalability — Describing Performance',
      'Scalability — Approaches for Coping with Load',
      'Maintainability — Operability',
      'Maintainability — Simplicity',
      'Maintainability — Evolvability',
    ],
  },
  {
    number: 2,
    title: 'Data Models and Query Languages',
    difficulty: 'beginner',
    sections: [
      'Relational Model Versus Document Model',
      'The Birth of NoSQL',
      'The Object-Relational Mismatch',
      'Many-to-One and Many-to-Many Relationships',
      'Are Document Databases Repeating History?',
      'Relational Versus Document Databases Today',
      'Declarative Queries on the Web',
      'MapReduce Querying',
      'Graph-Like Data Models',
      'Property Graphs and Cypher',
      'Triple-Stores and SPARQL',
      'Datalog',
    ],
  },
  {
    number: 3,
    title: 'Storage and Retrieval',
    difficulty: 'intermediate',
    sections: [
      'Hash Indexes',
      'SSTables and LSM-Trees',
      'B-Trees',
      'Comparing B-Trees and LSM-Trees',
      'Other Indexing Structures',
      'Transaction Processing or Analytics?',
      'Data Warehousing',
      'Stars and Snowflakes — Schemas for Analytics',
      'Column-Oriented Storage',
      'Column Compression and Sort Order',
      'Writing to Column-Oriented Storage',
      'Aggregation — Data Cubes and Materialized Views',
    ],
  },
  {
    number: 4,
    title: 'Encoding and Evolution',
    difficulty: 'intermediate',
    sections: [
      'Formats for Encoding Data',
      'JSON, XML, and Binary Variants',
      'Thrift and Protocol Buffers',
      'Avro',
      'The Merits of Schemas',
      'Dataflow Through Databases',
      'Dataflow Through Services — REST and RPC',
      'Message-Passing Dataflow',
    ],
  },
  {
    number: 5,
    title: 'Replication',
    difficulty: 'intermediate',
    sections: [
      'Leaders and Followers',
      'Synchronous Versus Asynchronous Replication',
      'Setting Up New Followers',
      'Handling Node Outages',
      'Implementation of Replication Logs',
      'Problems with Replication Lag',
      'Reading Your Own Writes',
      'Monotonic Reads',
      'Consistent Prefix Reads',
      'Solutions for Replication Lag',
      'Multi-Leader Replication',
      'Handling Write Conflicts',
      'Multi-Leader Replication Topologies',
      'Leaderless Replication',
      'Writing When a Node Is Down',
      'Limitations of Quorum Consistency',
      'Sloppy Quorums and Hinted Handoff',
      'Detecting Concurrent Writes',
    ],
  },
  {
    number: 6,
    title: 'Partitioning',
    difficulty: 'intermediate',
    sections: [
      'Partitioning and Replication',
      'Partitioning by Key Range',
      'Partitioning by Hash of Key',
      'Skewed Workloads and Hot Spots',
      'Partitioning Secondary Indexes by Document',
      'Partitioning Secondary Indexes by Term',
      'Rebalancing Partitions',
      'Strategies for Rebalancing',
      'Automatic or Manual Rebalancing',
      'Request Routing',
      'Parallel Query Execution',
    ],
  },
  {
    number: 7,
    title: 'Transactions',
    difficulty: 'advanced',
    sections: [
      'The Slippery Concept of a Transaction',
      'Meaning of ACID',
      'Single-Object and Multi-Object Operations',
      'Read Committed',
      'Snapshot Isolation and Repeatable Read',
      'Preventing Lost Updates',
      'Write Skew and Phantoms',
      'Actual Serial Execution',
      'Two-Phase Locking (2PL)',
      'Serializable Snapshot Isolation (SSI)',
    ],
  },
  {
    number: 8,
    title: 'The Trouble with Distributed Systems',
    difficulty: 'advanced',
    sections: [
      'Faults and Partial Failures',
      'Cloud Computing and Supercomputing',
      'Unreliable Networks',
      'Network Faults in Practice',
      'Detecting Faults',
      'Timeouts and Unbounded Delays',
      'Synchronous Versus Asynchronous Networks',
      'Unreliable Clocks',
      'Monotonic Versus Time-of-Day Clocks',
      'Clock Synchronization and Accuracy',
      'Relying on Synchronized Clocks',
      'Process Pauses',
      'Knowledge, Truth, and Lies',
      'The Truth Is Defined by the Majority',
      'Byzantine Faults',
      'System Model and Reality',
    ],
  },
  {
    number: 9,
    title: 'Consistency and Consensus',
    difficulty: 'advanced',
    sections: [
      'Consistency Guarantees',
      'What Makes a System Linearizable?',
      'Relying on Linearizability',
      'Implementing Linearizable Systems',
      'The Cost of Linearizability',
      'Ordering and Causality',
      'Sequence Number Ordering',
      'Total Order Broadcast',
      'Atomic Commit and Two-Phase Commit (2PC)',
      'Distributed Transactions in Practice',
      'Fault-Tolerant Consensus',
      'Membership and Coordination Services',
    ],
  },
  {
    number: 10,
    title: 'Batch Processing',
    difficulty: 'intermediate',
    sections: [
      'Batch Processing with Unix Tools',
      'The Unix Philosophy',
      'MapReduce and Distributed Filesystems',
      'MapReduce Job Execution',
      'Reduce-Side Joins and Grouping',
      'Map-Side Joins',
      'The Output of Batch Workflows',
      'Comparing Hadoop to Distributed Databases',
      'Materialization of Intermediate State',
      'Graphs and Iterative Processing',
      'High-Level APIs and Languages',
    ],
  },
  {
    number: 11,
    title: 'Stream Processing',
    difficulty: 'advanced',
    sections: [
      'Transmitting Event Streams',
      'Messaging Systems',
      'Partitioned Logs',
      'Keeping Systems in Sync',
      'Change Data Capture',
      'Event Sourcing',
      'State, Streams, and Immutability',
      'Uses of Stream Processing',
      'Reasoning About Time',
      'Stream Joins',
      'Fault Tolerance',
    ],
  },
  {
    number: 12,
    title: 'The Future of Data Systems',
    difficulty: 'advanced',
    sections: [
      'Combining Specialized Tools by Deriving Data',
      'Batch and Stream Processing',
      'Unbundling Databases',
      'Composing Data Storage Technologies',
      'Designing Applications Around Dataflow',
      'Observing Derived State',
      'The End-to-End Argument for Databases',
      'Enforcing Constraints',
      'Timeliness and Integrity',
      'Trust but Verify',
    ],
  },
]

const RELATED_EXISTING_SLUGS: Record<number, string[]> = {
  1: ['availability', 'scalability', 'load-balancing'],
  2: ['sql-databases', 'nosql-databases', 'sql-vs-nosql-databases'],
  3: ['indexes', 'storage'],
  4: ['rest-graphql-grpc', 'api-gateway'],
  5: ['database-replication', 'availability'],
  6: ['sharding', 'consistent-hashing'],
  7: ['acid-and-base-consistency-models', 'transactions', 'distributed-transactions', 'cap-theorem'],
  8: ['cap-theorem', 'availability'],
  9: ['cap-theorem', 'pacelc-theorem'],
  10: [],
  11: ['message-queues', 'event-driven-architecture', 'event-sourcing', 'publish-subscribe'],
  12: [],
}

function chapterSlug(num: number): string {
  return `ddia-ch${num}`
}

function sectionSlug(chapterNum: number, sectionTitle: string): string {
  const cleaned = sectionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `ddia-ch${chapterNum}-${cleaned}`
}

function estimateReadingTime(title: string): number {
  const wordCount = title.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount * 3))
}

export class DDIAAdapter implements SourceAdapter {
  name = 'ddia'
  cloneUrl = '' // No repo needed — we generate from the TOC

  private _topics: TopicMeta[] | null = null
  private referencesByChapter: Map<number, string[]> = new Map()
  private refsDir = path.join(process.cwd(), '.cache', 'repos', 'ept-ddia-references')
  private referencesUrl = 'https://github.com/ept/ddia-references'

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  private async ensureReferences() {
    if (!fs.existsSync(this.refsDir)) {
      this.ensureDir(path.dirname(this.refsDir))
      execSync(`git clone --depth 1 "${this.referencesUrl}" "${this.refsDir}"`, { stdio: 'pipe' })
    }
    this.parseReferences()
  }

  private parseReferences() {
    for (let ch = 1; ch <= 12; ch++) {
      const file = path.join(this.refsDir, `chapter-${String(ch).padStart(2, '0')}-refs.md`)
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      const entries: string[] = []
      let current: string[] | null = null
      for (const line of lines) {
        if (/^\d+\.\s+/.test(line)) {
          if (current) entries.push(current.join(' '))
          current = [line.replace(/^\d+\.\s+/, '').trim()]
        } else if (current && line.trim()) {
          current.push(line.trim())
        }
      }
      if (current) entries.push(current.join(' '))
      this.referencesByChapter.set(ch, entries)
    }
  }

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    try { await this.ensureReferences() } catch { /* references are optional */ }

    const topics: TopicMeta[] = []

    for (const chapter of chapters) {
      const chSlug = chapterSlug(chapter.number)

      topics.push({
        slug: chSlug,
        title: `Ch. ${chapter.number}: ${chapter.title}`,
        category: 'ddia',
        difficulty: chapter.difficulty,
        estimatedReadingTime: 15,
        tags: ['ddia', `chapter-${chapter.number}`, ...chapter.title.toLowerCase().split(' ').slice(0, 3)],
        prerequisites: chapter.number > 1 ? [chapterSlug(chapter.number - 1)] : ['what-is-system-design'],
        relatedTopics: [...(RELATED_EXISTING_SLUGS[chapter.number] ?? [])],
        sourceRepos: [this.name],
      })

      for (const section of chapter.sections) {
        const secSlug = sectionSlug(chapter.number, section)
        topics.push({
          slug: secSlug,
          title: section,
          category: 'ddia',
          difficulty: chapter.difficulty,
          estimatedReadingTime: estimateReadingTime(section),
          tags: ['ddia', `chapter-${chapter.number}`, ...section.toLowerCase().split(' ').slice(0, 3)],
          prerequisites: [chSlug],
          relatedTopics: [...(RELATED_EXISTING_SLUGS[chapter.number] ?? [])],
          sourceRepos: [this.name],
        })
      }
    }

    this._topics = topics
    return topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    const topic = this._topics!.find((t) => t.slug === slug)
    if (!topic) return ''

    const chMatch = slug.match(/^ddia-ch(\d+)(?:-(.+))?$/)
    if (!chMatch) return ''

    const chNum = parseInt(chMatch[1])
    const chapter = chapters.find((c) => c.number === chNum)
    if (!chapter) return ''

    const sectionTitle = chMatch[2]

    let md = `## ${topic.title}\n\n`

    if (!sectionTitle) {
      md += `### Chapter Overview\n\n`
      md += `This chapter covers the following topics:\n\n`
      for (const section of chapter.sections) {
        const secSlug = sectionSlug(chapter.number, section)
        md += `- [${section}](${secSlug})\n`
      }

      md += `\n### Key Concepts\n\n`
      md += `*DDIA Chapter ${chNum} — part of "${topic.title.replace(/^Ch\. \d+: /, '')}"*\n\n`
      md += `### Related Topics\n\n`
      const related = RELATED_EXISTING_SLUGS[chNum] ?? []
      if (related.length > 0) {
        for (const r of related) {
          md += `- [${r.replace(/-/g, ' ')}](/system-design/${r})\n`
        }
      } else {
        md += '_No existing topics mapped yet._\n'
      }

      const refs = this.referencesByChapter.get(chNum) ?? []
      if (refs.length > 0) {
        md += `\n### References\n\n`
        for (let i = 0; i < refs.length; i++) {
          md += `${i + 1}.  ${refs[i]}\n\n`
        }
      } else {
        md += `\n### References\n\n`
        md += `From *Designing Data-Intensive Applications* by Martin Kleppmann\n`
      }
    } else {
      md += `*Section of [Ch. ${chNum}: ${chapter.title}](${chapterSlug(chNum)})*\n\n`

      const sectionIndex = chapter.sections.findIndex(
        (s) => sectionSlug(chapter.number, s) === slug
      )

      if (sectionIndex > 0) {
        const prev = chapter.sections[sectionIndex - 1]
        md += `← [${prev}](${sectionSlug(chapter.number, prev)})\n\n`
      }
      if (sectionIndex < chapter.sections.length - 1) {
        const next = chapter.sections[sectionIndex + 1]
        md += `→ [${next}](${sectionSlug(chapter.number, next)})\n\n`
      }

      const refs = this.referencesByChapter.get(chNum) ?? []
      md += `\n### Notes\n\n`
      md += `Content from *Designing Data-Intensive Applications*, Ch. ${chNum}.\n`
      if (refs.length > 0) {
        md += `\n📚 See [Ch. ${chNum} References](/ddia/${chapterSlug(chNum)}) for papers and further reading.\n`
      }
      md += `\nRefer to the book for detailed explanations, diagrams, and examples.\n\n`
    }

    return md
  }
}
