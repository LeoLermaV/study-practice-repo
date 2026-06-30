import fs from 'fs'
import path from 'path'
import type { TopicMeta, Difficulty, Category } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')
const repoName = 'yangshun-tech-interview-handbook'
const contentDir = path.join(cacheDir, repoName, 'apps', 'website', 'contents')

interface ContentMapping {
  id: string
  slug: string
  title: string
  category: Category
  difficulty: Difficulty
  tags: string[]
  prerequisites: string[]
  relatedTopics: string[]
  estimatedReadingTime: number
}

const contentMappings: ContentMapping[] = [
  // ── Behavioral ──────────────────────────────────────────
  {
    id: 'behavioral-interview',
    slug: 'behavioral-interview-guide',
    title: 'Behavioral Interview Guide',
    category: 'behavioral',
    difficulty: 'beginner',
    tags: ['behavioral', 'star-method', 'preparation'],
    prerequisites: [],
    relatedTopics: ['behavioral-questions', 'self-introduction', 'final-questions'],
    estimatedReadingTime: 12,
  },
  {
    id: 'behavioral-interview-rubrics',
    slug: 'behavioral-rubrics',
    title: 'How FAANG Evaluates Behavioral Interviews',
    category: 'behavioral',
    difficulty: 'intermediate',
    tags: ['behavioral', 'rubrics', 'evaluation'],
    prerequisites: ['behavioral-interview-guide'],
    relatedTopics: ['behavioral-questions'],
    estimatedReadingTime: 8,
  },
  {
    id: 'behavioral-interview-questions',
    slug: 'behavioral-questions',
    title: '30 Common Behavioral Questions',
    category: 'behavioral',
    difficulty: 'intermediate',
    tags: ['behavioral', 'questions', 'practice'],
    prerequisites: ['behavioral-interview-guide'],
    relatedTopics: ['behavioral-interview-guide', 'self-introduction', 'final-questions'],
    estimatedReadingTime: 15,
  },
  {
    id: 'behavioral-interview-senior-candidates',
    slug: 'behavioral-senior',
    title: 'Behavioral Interviews for Senior Candidates',
    category: 'behavioral',
    difficulty: 'advanced',
    tags: ['behavioral', 'senior', 'staff', 'leadership'],
    prerequisites: ['behavioral-interview-guide'],
    relatedTopics: ['behavioral-interview-guide'],
    estimatedReadingTime: 6,
  },
  {
    id: 'self-introduction',
    slug: 'self-introduction',
    title: 'How to Introduce Yourself',
    category: 'behavioral',
    difficulty: 'beginner',
    tags: ['behavioral', 'self-introduction', 'opening'],
    prerequisites: ['behavioral-interview-guide'],
    relatedTopics: ['behavioral-interview-guide', 'final-questions'],
    estimatedReadingTime: 5,
  },
  {
    id: 'final-questions',
    slug: 'final-questions',
    title: 'Questions to Ask Your Interviewer',
    category: 'behavioral',
    difficulty: 'beginner',
    tags: ['behavioral', 'questions', 'closing'],
    prerequisites: ['behavioral-interview-guide'],
    relatedTopics: ['behavioral-interview-guide', 'self-introduction'],
    estimatedReadingTime: 4,
  },

  // ── Career / Negotiation → behavioral ──────────────────
  {
    id: 'resume',
    slug: 'resume-guide',
    title: 'FAANG-Ready Resume Guide',
    category: 'behavioral',
    difficulty: 'beginner',
    tags: ['resume', 'career', 'preparation'],
    prerequisites: [],
    relatedTopics: ['behavioral-interview-guide'],
    estimatedReadingTime: 10,
  },
  {
    id: 'understanding-compensation',
    slug: 'understanding-compensation',
    title: 'Understanding Compensation',
    category: 'behavioral',
    difficulty: 'intermediate',
    tags: ['compensation', 'negotiation', 'salary', 'rsu'],
    prerequisites: [],
    relatedTopics: ['salary-negotiation', 'negotiation-rules', 'choosing-between-companies'],
    estimatedReadingTime: 8,
  },
  {
    id: 'negotiation',
    slug: 'salary-negotiation',
    title: 'Salary Negotiation Guide',
    category: 'behavioral',
    difficulty: 'intermediate',
    tags: ['negotiation', 'salary', 'offer'],
    prerequisites: ['understanding-compensation'],
    relatedTopics: ['negotiation-rules', 'choosing-between-companies'],
    estimatedReadingTime: 10,
  },
  {
    id: 'negotiation-rules',
    slug: 'negotiation-rules',
    title: 'Negotiation Rules and Strategies',
    category: 'behavioral',
    difficulty: 'intermediate',
    tags: ['negotiation', 'strategies', 'offer'],
    prerequisites: ['understanding-compensation'],
    relatedTopics: ['salary-negotiation', 'choosing-between-companies'],
    estimatedReadingTime: 6,
  },
  {
    id: 'choosing-between-companies',
    slug: 'choosing-between-companies',
    title: 'Choosing Between Companies',
    category: 'behavioral',
    difficulty: 'beginner',
    tags: ['career', 'decision', 'offer'],
    prerequisites: ['understanding-compensation'],
    relatedTopics: ['salary-negotiation', 'negotiation-rules'],
    estimatedReadingTime: 5,
  },

  // ── CS Fundamentals ─────────────────────────────────────
  {
    id: 'coding-interview-prep',
    slug: 'coding-interview-prep',
    title: 'Coding Interview Preparation',
    category: 'cs-fundamentals',
    difficulty: 'beginner',
    tags: ['coding', 'preparation', 'study-plan'],
    prerequisites: [],
    relatedTopics: ['study-plan', 'picking-a-language'],
    estimatedReadingTime: 10,
  },
  {
    id: 'coding-interview-cheatsheet',
    slug: 'interview-cheatsheet',
    title: 'Coding Interview Cheatsheet',
    category: 'cs-fundamentals',
    difficulty: 'intermediate',
    tags: ['coding', 'cheatsheet', 'best-practices'],
    prerequisites: ['coding-interview-prep'],
    relatedTopics: ['problem-solving-techniques', 'interview-rubrics'],
    estimatedReadingTime: 8,
  },
  {
    id: 'coding-interview-techniques',
    slug: 'problem-solving-techniques',
    title: 'Problem-Solving Techniques',
    category: 'cs-fundamentals',
    difficulty: 'intermediate',
    tags: ['coding', 'techniques', 'problem-solving'],
    prerequisites: ['coding-interview-prep'],
    relatedTopics: ['interview-cheatsheet', 'interview-rubrics'],
    estimatedReadingTime: 7,
  },
  {
    id: 'programming-languages-for-coding-interviews',
    slug: 'picking-a-language',
    title: 'Choosing a Language for Interviews',
    category: 'cs-fundamentals',
    difficulty: 'beginner',
    tags: ['coding', 'language', 'python', 'java'],
    prerequisites: ['coding-interview-prep'],
    relatedTopics: ['coding-interview-prep'],
    estimatedReadingTime: 5,
  },
  {
    id: 'coding-interview-study-plan',
    slug: 'study-plan',
    title: '3-Month Study Plan',
    category: 'cs-fundamentals',
    difficulty: 'intermediate',
    tags: ['coding', 'study-plan', 'preparation'],
    prerequisites: ['coding-interview-prep', 'picking-a-language'],
    relatedTopics: ['coding-interview-prep', 'problem-solving-techniques'],
    estimatedReadingTime: 6,
  },
  {
    id: 'mock-interviews',
    slug: 'mock-interviews',
    title: 'Mock Interviews',
    category: 'cs-fundamentals',
    difficulty: 'intermediate',
    tags: ['coding', 'mock-interviews', 'practice'],
    prerequisites: ['problem-solving-techniques', 'interview-cheatsheet'],
    relatedTopics: ['interview-rubrics'],
    estimatedReadingTime: 5,
  },
  {
    id: 'coding-interview-rubrics',
    slug: 'interview-rubrics',
    title: 'How FAANG Evaluates Coding Interviews',
    category: 'cs-fundamentals',
    difficulty: 'advanced',
    tags: ['coding', 'rubrics', 'evaluation', 'faang'],
    prerequisites: ['coding-interview-prep'],
    relatedTopics: ['interview-cheatsheet', 'problem-solving-techniques', 'mock-interviews'],
    estimatedReadingTime: 7,
  },

  // ── DS&A Cheatsheets ────────────────────────────────────
  {
    id: 'algorithms/array',
    slug: 'cheatsheet-array',
    title: 'Array Cheatsheet',
    category: 'dsa',
    difficulty: 'beginner',
    tags: ['array', 'cheatsheet', 'interview'],
    prerequisites: [],
    relatedTopics: ['cheatsheet-string', 'cheatsheet-hash-table', 'cheatsheet-two-pointers', 'cheatsheet-sliding-window'],
    estimatedReadingTime: 6,
  },
  {
    id: 'algorithms/string',
    slug: 'cheatsheet-string',
    title: 'String Cheatsheet',
    category: 'dsa',
    difficulty: 'beginner',
    tags: ['string', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-array'],
    estimatedReadingTime: 6,
  },
  {
    id: 'algorithms/hash-table',
    slug: 'cheatsheet-hash-table',
    title: 'Hash Table Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['hash-table', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-array', 'cheatsheet-string'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/recursion',
    slug: 'cheatsheet-recursion',
    title: 'Recursion Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['recursion', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-tree', 'cheatsheet-dp'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/sorting-searching',
    slug: 'cheatsheet-sorting-searching',
    title: 'Sorting and Searching Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['sorting', 'searching', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-binary', 'cheatsheet-heap'],
    estimatedReadingTime: 7,
  },
  {
    id: 'algorithms/matrix',
    slug: 'cheatsheet-matrix',
    title: 'Matrix Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['matrix', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-array', 'cheatsheet-graph'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/linked-list',
    slug: 'cheatsheet-linked-list',
    title: 'Linked List Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['linked-list', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-stack', 'cheatsheet-queue'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/queue',
    slug: 'cheatsheet-queue',
    title: 'Queue Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['queue', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-stack', 'cheatsheet-linked-list'],
    estimatedReadingTime: 4,
  },
  {
    id: 'algorithms/stack',
    slug: 'cheatsheet-stack',
    title: 'Stack Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['stack', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-queue', 'cheatsheet-linked-list'],
    estimatedReadingTime: 4,
  },
  {
    id: 'algorithms/interval',
    slug: 'cheatsheet-interval',
    title: 'Interval Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['interval', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array', 'cheatsheet-sorting-searching'],
    relatedTopics: ['cheatsheet-array', 'cheatsheet-sorting-searching'],
    estimatedReadingTime: 4,
  },
  {
    id: 'algorithms/tree',
    slug: 'cheatsheet-tree',
    title: 'Tree Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['tree', 'binary-tree', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-recursion', 'cheatsheet-queue'],
    relatedTopics: ['cheatsheet-graph', 'cheatsheet-heap', 'cheatsheet-trie'],
    estimatedReadingTime: 7,
  },
  {
    id: 'algorithms/graph',
    slug: 'cheatsheet-graph',
    title: 'Graph Cheatsheet',
    category: 'dsa',
    difficulty: 'advanced',
    tags: ['graph', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-tree', 'cheatsheet-recursion'],
    relatedTopics: ['cheatsheet-tree', 'cheatsheet-dp'],
    estimatedReadingTime: 7,
  },
  {
    id: 'algorithms/heap',
    slug: 'cheatsheet-heap',
    title: 'Heap Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['heap', 'priority-queue', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array', 'cheatsheet-sorting-searching'],
    relatedTopics: ['cheatsheet-tree', 'cheatsheet-sorting-searching'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/trie',
    slug: 'cheatsheet-trie',
    title: 'Trie Cheatsheet',
    category: 'dsa',
    difficulty: 'advanced',
    tags: ['trie', 'prefix-tree', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-tree'],
    relatedTopics: ['cheatsheet-tree', 'cheatsheet-string'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/dynamic-programming',
    slug: 'cheatsheet-dp',
    title: 'Dynamic Programming Cheatsheet',
    category: 'dsa',
    difficulty: 'advanced',
    tags: ['dynamic-programming', 'dp', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-recursion', 'cheatsheet-array'],
    relatedTopics: ['cheatsheet-greedy', 'cheatsheet-recursion'],
    estimatedReadingTime: 8,
  },
  {
    id: 'algorithms/binary',
    slug: 'cheatsheet-binary',
    title: 'Binary Cheatsheet',
    category: 'dsa',
    difficulty: 'advanced',
    tags: ['binary', 'bit-manipulation', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-math'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/math',
    slug: 'cheatsheet-math',
    title: 'Math Cheatsheet',
    category: 'dsa',
    difficulty: 'intermediate',
    tags: ['math', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-array'],
    relatedTopics: ['cheatsheet-binary', 'cheatsheet-geometry'],
    estimatedReadingTime: 5,
  },
  {
    id: 'algorithms/geometry',
    slug: 'cheatsheet-geometry',
    title: 'Geometry Cheatsheet',
    category: 'dsa',
    difficulty: 'advanced',
    tags: ['geometry', 'cheatsheet', 'interview'],
    prerequisites: ['cheatsheet-math'],
    relatedTopics: ['cheatsheet-math'],
    estimatedReadingTime: 4,
  },
]

function processContent(raw: string): string {
  let result = raw

  result = result.replace(/^---[\s\S]*?^---\n*/m, '')

  result = result.replace(/^<head>[\s\S]*?^<\/head>\n*/gm, '')

  result = result.replace(/^import .+ from .+;?\n*/gm, '')

  result = result.replace(/<\s*InDocAd\s*\/>/g, '')

  result = result.replace(/<\s*AlgorithmCourses\s*\/>/g, '')
  result = result.replace(/<\s*QuestionList\s*\/>/g, '')

  result = result.replace(/\{require\('[^']+'\)\.[a-z]+\}/g, '')
  result = result.replace(/\{require\('[^']+'\)\}/g, '')

  result = result.replace(/\sstyle=\{[\s\S]*?\}/g, '')

  result = result.replace(/<img[\s\S]*?\/>/g, '')

  result = result.replace(/<div\s+className="[^"]*">\n?/g, '')
  result = result.replace(/<\/div>\n?/g, '')
  result = result.replace(/<div>/g, '')
  result = result.replace(/<\/?figure[^>]*>/g, '')
  result = result.replace(/<\/?figcaption[^>]*>/g, '')

  result = result.replace(/<!--[\s\S]*?-->/g, '')

  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  result = result.replace(/^[ \t]*\n{3,}/gm, '\n')

  return result.trim()
}

export class YangshunAdapter implements SourceAdapter {
  name = 'yangshun-tech-interview-handbook'
  cloneUrl = 'https://github.com/yangshun/tech-interview-handbook.git'

  private _topics: TopicMeta[] | null = null
  private _topicBodies: Map<string, string> = new Map()

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    const topics: TopicMeta[] = []

    for (const mapping of contentMappings) {
      const filePath = path.join(contentDir, `${mapping.id}.md`)
      if (!fs.existsSync(filePath)) {
        console.log(`  WARN: file not found: ${mapping.id}.md`)
        continue
      }

      const raw = fs.readFileSync(filePath, 'utf-8')
      const processed = processContent(raw)
      this._topicBodies.set(mapping.slug, processed)

      const wordCount = raw.split(/\s+/).length
      const readingTime = Math.max(1, Math.ceil(wordCount / 200))

      topics.push({
        slug: mapping.slug,
        title: mapping.title,
        category: mapping.category,
        difficulty: mapping.difficulty,
        estimatedReadingTime: readingTime,
        tags: mapping.tags,
        prerequisites: mapping.prerequisites,
        relatedTopics: mapping.relatedTopics,
        sourceRepos: [this.name],
      })
    }

    this._topics = topics
    console.log(`  Yangshun topics: ${topics.length}`)
    return topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    return this._topicBodies.get(slug) ?? ''
  }
}
