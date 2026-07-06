import fs from 'fs'
import path from 'path'
import type { TopicMeta, Difficulty } from '../../src/lib/content/types'
import type { SourceAdapter } from './base'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')
const repoName = 'krahets-hello-algo'
const englishDir = path.join(cacheDir, repoName, 'en', 'docs')
const rawBase = 'https://raw.githubusercontent.com/krahets/hello-algo/main/en/docs'

interface NavEntry {
  title: string
  file: string
  chapterIndex: number
  sectionIndex: number
  chapterTitle: string
}

const CHAPTER_DIFFICULTY: Record<number, Difficulty> = {
  1: 'beginner', 2: 'beginner', 3: 'beginner', 4: 'beginner',
  5: 'beginner', 6: 'intermediate', 7: 'intermediate', 8: 'intermediate',
  9: 'intermediate', 10: 'intermediate', 11: 'intermediate',
  12: 'advanced', 13: 'advanced', 14: 'advanced', 15: 'advanced',
}

const CHAPTER_TAGS: Record<number, string[]> = {
  1: ['algorithms', 'introduction'],
  2: ['complexity-analysis', 'big-o'],
  3: ['data-structures'],
  4: ['array', 'linked-list'],
  5: ['stack', 'queue'],
  6: ['hash-table', 'hashing'],
  7: ['tree', 'binary-tree'],
  8: ['heap', 'priority-queue'],
  9: ['graph'],
  10: ['searching', 'binary-search'],
  11: ['sorting'],
  12: ['divide-and-conquer'],
  13: ['backtracking'],
  14: ['dynamic-programming'],
  15: ['greedy'],
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
}

function parseNavContents(yaml: string): NavEntry[] {
  const entries: NavEntry[] = []
  const lines = yaml.split('\n')
  let currentChapter = 0
  let currentChapterTitle = ''

  for (const line of lines) {
    const trimmed = line.trim()

    const chapterMatch = trimmed.match(/^-\s*Chapter\s+(\d+)\.\s+(.+?):*$/)
    if (chapterMatch) {
      currentChapter = parseInt(chapterMatch[1], 10)
      currentChapterTitle = chapterMatch[2].replace(/:+$/, '').trim()
      continue
    }

    const sectionMatch = trimmed.match(
      /^-\s+(?:(\d+)\.(\d+)\s+)?(.+?):\s+([^\s]+\.(?:md|assets))$/
    )
    if (sectionMatch && currentChapter >= 1 && currentChapter <= 15) {
      const sectionNumber = sectionMatch[2] ? parseInt(sectionMatch[2], 10) : 0
      let title = sectionMatch[3].trim()
      const file = sectionMatch[4]

      if (!file.endsWith('.md')) continue

      if (file.endsWith('/index.md')) continue

      if (file.endsWith('/summary.md')) {
        title = `${currentChapterTitle}: Summary`
      }

      if (file.startsWith('chapter_appendix/')) continue
      if (file.startsWith('chapter_reference/')) continue

      title = title.replace(/\s*\*$/, '').trim()

      entries.push({
        title,
        file,
        chapterIndex: currentChapter,
        sectionIndex: sectionNumber,
        chapterTitle: currentChapterTitle,
      })
    }
  }

  return entries
}

function processMultilangTabs(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    const langMatch = line.match(/^=== "([^"]+)"$/)
    if (!langMatch) {
      result.push(line)
      i++
      continue
    }

    const tabs: { lang: string; body: string[] }[] = []
    let currentLang = langMatch[1]
    let currentBody: string[] = []
    i++

    while (i < lines.length) {
      const nextLine = lines[i]

      const nextLangMatch = nextLine.match(/^=== "([^"]+)"$/)
      if (nextLangMatch) {
        tabs.push({ lang: currentLang, body: currentBody })
        currentLang = nextLangMatch[1]
        currentBody = []
        i++
        continue
      }

      if (nextLine === '' || nextLine.startsWith('    ')) {
        currentBody.push(nextLine.startsWith('    ') ? nextLine.slice(4) : nextLine)
        i++
        continue
      }

      if (nextLine.startsWith('===')) {
        tabs.push({ lang: currentLang, body: currentBody })
        currentBody = []
        i++
        continue
      }

      break
    }

    tabs.push({ lang: currentLang, body: currentBody })

    const pythonTab = tabs.find((t) => t.lang === 'Python')
    if (pythonTab) {
      result.push(...pythonTab.body)
    } else {
      for (const tab of tabs) {
        result.push(...tab.body)
      }
    }
  }

  return result.join('\n')
}

function processContent(raw: string, chapterDir: string): string {
  let result = raw

  result = result.replace(/^---[\s\S]*?^---\n*/m, '')

  result = result.replace(/^<head>[\s\S]*?^<\/head>\n*/m, '')

  result = processMultilangTabs(result)

  result = result.replace(/^\?{3,}\s+\S+.*\n/gm, '')

  result = result.replace(
    /^!!!\s*(\w+)\s+"?(.+?)"?$/gm,
    (_match, _type: string, title: string) => `> **${title}**`
  )

  result = result.replace(
    /"?\?{3,}\s+\S+\s+"?(.+?)"?$/gm,
    (_match, title: string) => `> **Interactive:** ${title}`
  )

  result = result.split('\n').filter((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('https://pythontutor.com/')) return false
    if (trimmed.startsWith('http://pythontutor.com/')) return false
    return true
  }).join('\n')

  result = result.replace(
    /```src\s*\n[\s\S]*?\n```\n?/g,
    ''
  )

  result = result.replace(
    /```src.*?\n[\s\S]*?\n```/g,
    ''
  )

  result = result.replace(/^\s*```src.*$/gm, '')

  result = result.replace(
    /\]\(([^)]+\.md)\)/g,
    (_match) => {
      return ']()'
    }
  )

  result = result.replace(
    /\]\(([^)]+\.(?:png|jpg|jpeg|gif|svg))\)/g,
    (_match, assetPath: string) => {
      return `](https://raw.githubusercontent.com/krahets/hello-algo/main/en/docs/${chapterDir}/${assetPath})`
    }
  )

  result = result.split('\n').filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return true
    if (trimmed.startsWith('<<<SKIP')) return false
    if (trimmed === '---' && line.trim() === '---' && line === '---') return false
    return true
  }).join('\n')

  result = result.replace(/\n{4,}/g, '\n\n').trim()

  result = result.replace(
    /<p\s+align="center">\s*Table\s+<id>\s*&nbsp;(.+?)<\/p>/g,
    (_match, caption: string) => `*Table: ${caption}*`
  )

  result = result.replace(/<id>/g, 'ID')

  const htmlPlaceholders: [RegExp, string][] = [
    [/<u>/g, '\x00PU_U\x00'],
    [/<\/u>/g, '\x00PU_/U\x00'],
    [/<p>/g, '\x00PU_P\x00'],
    [/<\/p>/g, '\x00PU_/P\x00'],
    [/<div>/g, '\x00PU_DIV\x00'],
    [/<\/div>/g, '\x00PU_/DIV\x00'],
    [/<br>/g, '\x00PU_BR\x00'],
    [/<table>/g, '\x00PU_TABLE\x00'],
    [/<\/table>/g, '\x00PU_/TABLE\x00'],
    [/<tr>/g, '\x00PU_TR\x00'],
    [/<\/tr>/g, '\x00PU_/TR\x00'],
    [/<td>/g, '\x00PU_TD\x00'],
    [/<\/td>/g, '\x00PU_/TD\x00'],
    [/<th>/g, '\x00PU_TH\x00'],
    [/<\/th>/g, '\x00PU_/TH\x00'],
  ]

  for (const [pattern, placeholder] of htmlPlaceholders) {
    result = result.replace(pattern, placeholder)
  }

  result = result.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const restoreHtml: [string, string][] = [
    ['\x00PU_U\x00', '<u>'],
    ['\x00PU_/U\x00', '</u>'],
    ['\x00PU_P\x00', '<p>'],
    ['\x00PU_/P\x00', '</p>'],
    ['\x00PU_DIV\x00', '<div>'],
    ['\x00PU_/DIV\x00', '</div>'],
    ['\x00PU_BR\x00', '<br>'],
    ['\x00PU_TABLE\x00', '<table>'],
    ['\x00PU_/TABLE\x00', '</table>'],
    ['\x00PU_TR\x00', '<tr>'],
    ['\x00PU_/TR\x00', '</tr>'],
    ['\x00PU_TD\x00', '<td>'],
    ['\x00PU_/TD\x00', '</td>'],
    ['\x00PU_TH\x00', '<th>'],
    ['\x00PU_/TH\x00', '</th>'],
  ]

  const restoreMap = new Map(restoreHtml)
  const placeholderPattern = new RegExp(
    Array.from(restoreMap.keys())
      .map((p) => p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .join('|'),
    'g'
  )
  result = result.replace(placeholderPattern, (match) => restoreMap.get(match) || match)

  result = result.replace(/<p\s+align="center">/g, '<p>')

  return result || '*Content adapted from hello-algo*'
}

export class HelloAlgoAdapter implements SourceAdapter {
  name = 'krahets-hello-algo'
  cloneUrl = 'https://github.com/krahets/hello-algo.git'

  private _topics: TopicMeta[] | null = null
  private _topicBodies: Map<string, string> = new Map()

  async topics(): Promise<TopicMeta[]> {
    if (this._topics) return this._topics

    const mkdocsPath = path.join(cacheDir, repoName, 'en', 'mkdocs.yml')
    if (!fs.existsSync(mkdocsPath)) throw new Error('en/mkdocs.yml not found in cloned repo')

    const yaml = fs.readFileSync(mkdocsPath, 'utf-8')
    const allEntries = parseNavContents(yaml)

    const sectionEntries = allEntries.filter((e) => e.sectionIndex > 0 || !e.file.endsWith('/summary.md'))
    const summaryEntries = allEntries.filter((e) => e.file.endsWith('/summary.md'))
    const contentEntries = [...sectionEntries, ...summaryEntries]

    contentEntries.sort((a, b) => {
      if (a.chapterIndex !== b.chapterIndex) return a.chapterIndex - b.chapterIndex
      if (a.sectionIndex !== b.sectionIndex) return a.sectionIndex - b.sectionIndex
      return 0
    })

    console.log(`  Nav entries parsed: ${allEntries.length}`)
    console.log(`  Content topics: ${contentEntries.length}`)

    const topics: TopicMeta[] = []
    const processed: NavEntry[] = []
    let sortIndex = 0

    for (const entry of contentEntries) {
      const slug = toSlug(`hello-algo-${entry.chapterTitle}-${entry.title}`.replace(/[:\s]+/g, '-'))
      const finalSlug = slug.replace(/--+/g, '-').replace(/^-|-$/g, '')

      const filePath = path.join(englishDir, entry.file)
      let body = ''
      if (fs.existsSync(filePath)) {
        body = fs.readFileSync(filePath, 'utf-8')
      } else {
        continue
      }

      const chapterDir = path.dirname(entry.file)
      const processedBody = processContent(body, chapterDir)
      this._topicBodies.set(finalSlug, processedBody)

      const wordCount = body.split(/\s+/).length
      const readingTime = Math.max(1, Math.ceil(wordCount / 200))

      const baseTags = CHAPTER_TAGS[entry.chapterIndex] ?? ['dsa', 'algorithms']
      const specificTag = toSlug(entry.title)

      const prereqs = processed
        .filter((p) => p.chapterIndex < entry.chapterIndex || (p.chapterIndex === entry.chapterIndex && p.sectionIndex < entry.sectionIndex))
        .slice(-4)
        .map((p) => toSlug(`hello-algo-${p.chapterTitle}-${p.title}`.replace(/[:\s]+/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '')))

      const related = processed
        .filter((p) => p !== entry)
        .slice(-4)
        .map((p) => toSlug(`hello-algo-${p.chapterTitle}-${p.title}`.replace(/[:\s]+/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '')))

      topics.push({
        slug: finalSlug,
        title: entry.title,
        category: 'dsa',
        difficulty: CHAPTER_DIFFICULTY[entry.chapterIndex] ?? 'intermediate',
        estimatedReadingTime: readingTime,
        tags: [...new Set([...baseTags, specificTag, 'hello-algo'])],
        prerequisites: prereqs.filter(Boolean),
        relatedTopics: related.filter(Boolean),
        sourceRepos: [this.name],
        sortOrder: sortIndex++,
      })

      processed.push(entry)
    }

    this._topics = topics
    return topics
  }

  async content(slug: string): Promise<string> {
    if (!this._topics) await this.topics()
    return this._topicBodies.get(slug) ?? ''
  }
}
