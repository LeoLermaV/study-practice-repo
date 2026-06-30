import fs from 'fs'
import path from 'path'
import type { TopicMeta } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')

interface LeetcodeQuestion {
  id: number
  title: string
  slug: string
  pattern: string[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  premium: boolean
  companies: { name: string; frequency: number }[]
}

export class SeanprashadAdapter implements SourceAdapter {
  name = 'seanprashad-leetcode-patterns'
  cloneUrl = 'https://github.com/seanprashad/leetcode-patterns.git'

  private data: LeetcodeQuestion[] = []
  private _topics: TopicMeta[] | null = null
  private _rawData: LeetcodeQuestion[] = []

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    const filePath = path.join(cacheDir, this.name, 'src', 'data', 'questions.json')
    if (!fs.existsSync(filePath)) throw new Error('questions.json not found')
    this._rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8')).data
    console.log(`  Raw questions: ${this._rawData.length}`)

    const patternMap = new Map<string, LeetcodeQuestion[]>()
    for (const q of this._rawData) {
      for (const p of q.pattern) {
        if (!patternMap.has(p)) patternMap.set(p, [])
        patternMap.get(p)!.push(q)
      }
    }

    const topics: TopicMeta[] = []
    for (const [name, questions] of patternMap) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const avgDifficulty = questions.reduce((acc, q) => {
        if (q.difficulty === 'Easy') return acc + 1
        if (q.difficulty === 'Medium') return acc + 2
        return acc + 3
      }, 0) / questions.length

      topics.push({
        slug,
        title: name,
        category: 'dsa',
        difficulty: avgDifficulty < 1.5 ? 'beginner' : avgDifficulty < 2.5 ? 'intermediate' : 'advanced',
        estimatedReadingTime: Math.ceil((questions.length * 2) / 5),
        tags: ['leetcode', ...name.toLowerCase().split(' ')],
        prerequisites: [],
        relatedTopics: [],
        sourceRepos: [this.name],
        leetcodePatterns: {
          patterns: [name],
          companies: this.getTopCompanies(questions),
        },
      })
    }

    this._topics = topics
    return topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    const topic = this._topics!.find((t) => t.slug === slug)
    if (!topic) return ''

    const questions = this._rawData.filter((q) => q.pattern.includes(topic.title))

    let md = `## ${topic.title}\n\n`
    md += `### Overview\n\n`
    md += `This pattern covers LeetCode problems tagged with **${topic.title}**. `
    md += `There are **${questions.length}** questions in this pattern. `
    md += `\n\n### Questions\n\n`
    md += `| # | Title | Difficulty | Premium |\n`
    md += `|---|---|:---:|:---:|\n`

    for (const q of questions) {
      const url = `https://leetcode.com/problems/${q.slug}/`
      md += `| ${q.id} | [${q.title}](${url}) | ${q.difficulty} | ${q.premium ? '🔒' : ''} |\n`
    }

    if (questions.some((q) => q.companies.length > 0)) {
      const companyMap = new Map<string, number>()
      for (const q of questions) {
        for (const c of q.companies) {
          companyMap.set(c.name, (companyMap.get(c.name) ?? 0) + c.frequency)
        }
      }
      const sorted = [...companyMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      md += `\n### Top Companies\n\n`
      for (const [name] of sorted) {
        md += `- ${name}\n`
      }
    }

    return md
  }

  private getTopCompanies(questions: LeetcodeQuestion[]): { name: string; frequency: number }[] {
    const map = new Map<string, number>()
    for (const q of questions) {
      for (const c of q.companies) {
        map.set(c.name, (map.get(c.name) ?? 0) + c.frequency)
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, frequency]) => ({ name, frequency }))
  }
}
