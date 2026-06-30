import fs from 'fs'
import path from 'path'
import type { TopicMeta } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')

interface NeetcodeProblem {
  problem: string
  pattern: string
  difficulty: string
  premium: boolean
  blind75: boolean
  neetcode150: boolean
  link: string
  video?: string
  code?: string
}

export class NeetcodeAdapter implements SourceAdapter {
  name = 'neetcode-leetcode'
  cloneUrl = 'https://github.com/neetcode-gh/leetcode.git'

  private _topics: TopicMeta[] | null = null
  private _data: NeetcodeProblem[] = []

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    const filePath = path.join(cacheDir, this.name, '.problemSiteData.json')
    if (!fs.existsSync(filePath)) throw new Error('.problemSiteData.json not found')

    const allData: any[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    this._data = allData.filter((p) => p.neetcode150)

    console.log(`  NeetCode 150 problems: ${this._data.length}`)

    const groupMap = new Map<string, NeetcodeProblem[]>()
    for (const p of this._data) {
      if (!groupMap.has(p.pattern)) groupMap.set(p.pattern, [])
      groupMap.get(p.pattern)!.push(p)
    }

    const topics: TopicMeta[] = []

    for (const [groupName, problems] of groupMap) {
      const slug = groupName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const difficulties = problems.map((p) => p.difficulty)
      const avg = difficulties.reduce((acc, d) => {
        if (d === 'Easy') return acc + 1
        if (d === 'Medium') return acc + 2
        return acc + 3
      }, 0) / problems.length

      topics.push({
        slug,
        title: groupName,
        category: 'dsa',
        difficulty: avg < 1.5 ? 'beginner' : avg < 2.5 ? 'intermediate' : 'advanced',
        estimatedReadingTime: Math.ceil(problems.length * 3 / 5),
        tags: [...groupName.toLowerCase().split(' '), 'neetcode', 'leetcode'],
        prerequisites: [],
        relatedTopics: [],
        sourceRepos: [this.name],
        neetcodeRoadmap: {
          group: groupName,
          order: problems.findIndex((p) => p.blind75),
          isBlind75: problems.some((p) => p.blind75),
        },
      })
    }

    for (const [groupName, problems] of groupMap) {
      const slug = groupName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const blindCount = problems.filter((p) => p.blind75).length
      if (blindCount > 0) {
        topics.push({
          slug: `${slug}-blind75`,
          title: `${groupName} — Blind 75`,
          category: 'dsa',
          difficulty: 'intermediate',
          estimatedReadingTime: Math.ceil(blindCount * 3 / 5),
          tags: [...groupName.toLowerCase().split(' '), 'neetcode', 'blind75'],
          prerequisites: [slug],
          relatedTopics: [],
          sourceRepos: [this.name],
          neetcodeRoadmap: {
            group: groupName,
            order: 1,
            isBlind75: true,
          },
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

    const problems = this._data.filter((p) => {
      const pSlug = p.pattern.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return pSlug === slug || `${pSlug}-blind75` === slug
    })

    let md = `## ${topic.title}\n\n`

    if (topic.neetcodeRoadmap?.isBlind75) {
      md += `### Blind 75 — Essential Problems\n\n`
    } else {
      md += `### NeetCode 150 — Complete List\n\n`
    }

    md += `| Problem | Difficulty | Blind 75 | LeetCode |\n`
    md += `|---|---|:---:|:---:|\n`

    for (const p of problems) {
      const leetcodeUrl = `https://leetcode.com/problems/${p.link}`
      const youtubeLink = p.video ? ` [▶](https://youtube.com/watch?v=${p.video})` : ''
      md += `| ${p.problem}${youtubeLink} | ${p.difficulty} | ${p.blind75 ? '✅' : ''} | [Link](${leetcodeUrl}) |\n`
    }

    md += `\n### Study Resources\n\n`
    md += `- [NeetCode.io Roadmap](https://neetcode.io/roadmap)\n`
    md += `- YouTube solutions by NeetCode for each problem\n`

    return md
  }
}
