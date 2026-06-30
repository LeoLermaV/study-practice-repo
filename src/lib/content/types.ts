export type Category = 'system-design' | 'dsa' | 'cs-fundamentals' | 'behavioral' | 'ddia'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface NeetcodeRoadmap {
  group: string
  order: number
  isBlind75: boolean
}

export interface LeetcodePatterns {
  patterns: string[]
  companies: { name: string; frequency: number }[]
}

export interface TopicMeta {
  slug: string
  title: string
  category: Category
  difficulty: Difficulty
  estimatedReadingTime: number
  tags: string[]
  prerequisites: string[]
  relatedTopics: string[]
  sourceRepos: string[]
  neetcodeRoadmap?: NeetcodeRoadmap
  leetcodePatterns?: LeetcodePatterns
}

export interface TopicGraphEdge {
  source: string
  target: string
  type: 'prerequisite' | 'related'
}

export interface TopicGraph {
  nodes: TopicMeta[]
  edges: TopicGraphEdge[]
}

export interface PracticeNote {
  text: string
  timestamp: number
}

export interface ProgressEntry {
  slug: string
  readAt: number | null
  studiedAt: number | null
  practicedAt: number | null
  practiceNotes: PracticeNote[]
  reviewCount: number
  nextReviewDue: number
}

export interface StudyStats {
  currentStreak: number
  longestStreak: number
  totalRead: number
  totalStudied: number
  totalPracticed: number
  topicsDueForReview: number
  recentlyStudied: { slug: string; lastTouched: number }[]
}
