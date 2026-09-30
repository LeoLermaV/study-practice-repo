import fs from 'fs'
import path from 'path'
import type { TopicMeta } from '../src/lib/content/types'
import type { SourceAdapter } from './adapters/base'
import { createSearchIndex } from '../src/lib/content/search'
import { extractHeadings } from '../src/lib/content/headings'
import { prepareMarkdown, usesInlineDollarMath } from '../src/lib/content/markdown'
import { syncSource } from './git-source'
import { buildTopicGraph } from '../src/lib/content/topics'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')
const contentDir = path.join(process.cwd(), 'src', 'content')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function cloneRepo(adapter: SourceAdapter) {
  const target = path.join(cacheDir, adapter.name)
  syncSource(adapter.name, adapter.cloneUrl, target)
  return target
}

async function ingestAdapter(adapter: SourceAdapter) {
  console.log(`\n--- ${adapter.name} ---`)
  if (adapter.cloneUrl) cloneRepo(adapter)
  const topics = await adapter.topics()
  console.log(`  ${topics.length} topics parsed`)

  for (const topic of topics) {
    const categoryDir = path.join(contentDir, topic.category)
    ensureDir(categoryDir)

    const body = await adapter.content(topic.slug)
    const bodyWithCode = convertIndentedCodeBlocks(body)
    const escaped = prepareMarkdown(bodyWithCode, usesInlineDollarMath(topic.slug))
    const mdx = `---\n${JSON.stringify(topic, null, 2)}\n---\n\n${escaped}`
    fs.writeFileSync(path.join(categoryDir, `${topic.slug}.mdx`), mdx)

    const meta: Partial<TopicMeta> = { ...topic }
    delete meta.sourceRepos
    fs.writeFileSync(
      path.join(categoryDir, `${topic.slug}.json`),
      JSON.stringify(meta, null, 2)
    )
  }
}

function convertIndentedCodeBlocks(body: string): string {
  const lines = body.split('\n')
  const result: string[] = []
  let inIndentedBlock = false
  let inFencedBlock = false
  let fencedDelimiter = ''
  let codeLines: string[] = []

  function flushCode() {
    if (codeLines.length > 0) {
      result.push('```python')
      result.push(...codeLines)
      result.push('```')
      codeLines = []
    }
    inIndentedBlock = false
  }

  function isFenceLine(line: string): boolean {
    const trimmed = line.trimStart()
    return trimmed.startsWith('```') || trimmed.startsWith('~~~')
  }

  function fenceDelimiter(line: string): string {
    const trimmed = line.trimStart()
    const match = trimmed.match(/^(`{3,}|~{3,})/)
    return match ? match[1] : ''
  }

  function fenceClosed(delimiter: string): boolean {
    return inFencedBlock && fencedDelimiter.length > 0
      && delimiter.startsWith(fencedDelimiter)
  }

  for (const line of lines) {
    if (isFenceLine(line)) {
      const delim = fenceDelimiter(line)
      if (!inFencedBlock) {
        flushCode()
        inFencedBlock = true
        fencedDelimiter = delim
      } else if (fenceClosed(delim)) {
        inFencedBlock = false
        fencedDelimiter = ''
      }
      result.push(line)
      continue
    }

    if (inFencedBlock) {
      result.push(line)
      continue
    }

    const isIndented = line.startsWith('    ')
    const isEmpty = line.trim() === ''

    if (isEmpty) {
      if (inIndentedBlock) {
        codeLines.push('')
      } else {
        result.push(line)
      }
    } else if (isIndented) {
      if (!inIndentedBlock) {
        inIndentedBlock = true
      }
      codeLines.push(line.slice(4))
    } else {
      flushCode()
      result.push(line)
    }
  }
  flushCode()

  return result.join('\n')
}

/**
 * Progress is stored by slug, so a slug that disappears (an upstream rename)
 * orphans whatever was studied under it. Compares with the previous local
 * index so a pin bump shows exactly what moved.
 */
function reportRemovedSlugs(slugs: string[]) {
  const previousFile = path.join(process.cwd(), 'public', 'search-index.json')
  if (!fs.existsSync(previousFile)) return
  try {
    const previous = JSON.parse(fs.readFileSync(previousFile, 'utf-8')) as { storedFields?: Record<string, { slug?: string }> }
    const before = new Set(Object.values(previous.storedFields ?? {}).map((d) => d.slug).filter((s): s is string => Boolean(s)))
    const now = new Set(slugs)
    const removed = [...before].filter((s) => !now.has(s)).sort()
    const added = [...now].filter((s) => !before.has(s)).length
    if (removed.length > 0) {
      console.warn(`\n  ! ${removed.length} topic slug(s) no longer exist. Progress stored under them will show as missing:`)
      for (const s of removed) console.warn(`    - ${s}`)
    }
    if (removed.length > 0 || added > 0) console.log(`  Slugs: ${added} added, ${removed.length} removed since the last ingest`)
  } catch {
    // An unreadable previous index just means nothing to compare with.
  }
}

async function main() {
  const { KaranAdapter } = await import('./adapters/karan')
  const { SeanprashadAdapter } = await import('./adapters/seanprashad')
  const { NeetcodeAdapter } = await import('./adapters/neetcode')
  const { DDIAAdapter } = await import('./adapters/ddia')
  const { HelloAlgoAdapter } = await import('./adapters/hello-algo')
  const { YangshunAdapter } = await import('./adapters/yangshun')
  const { DonnemartinAdapter } = await import('./adapters/donnemartin')
  const { PythonPracticeAdapter } = await import('./adapters/python-practice')
  const { LeetCodeHintsAdapter } = await import('./adapters/leetcode-hints')
  const { DsaSupplementsAdapter } = await import('./adapters/dsa-supplements')

  const adapters: SourceAdapter[] = [
    new KaranAdapter(),
    new SeanprashadAdapter(),
    new NeetcodeAdapter(),
    new DDIAAdapter(),
    new HelloAlgoAdapter(),
    new YangshunAdapter(),
    new DonnemartinAdapter(),
    new PythonPracticeAdapter(),
    new LeetCodeHintsAdapter(),
    new DsaSupplementsAdapter(),
  ]

  for (const adapter of adapters) {
    await ingestAdapter(adapter)
  }

  console.log('\n--- Building indexes ---')
  const { getAllTopics } = await import('../src/lib/content/topics')
  const topics = getAllTopics()
  console.log(`  Total topics: ${topics.length}`)

  // Section headings make topics findable by what they cover, not only their title.
  const documents = topics.map((t) => {
    const file = path.join(contentDir, t.category, `${t.slug}.mdx`)
    const body = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : ''
    return { ...t, headings: extractHeadings(body).join(' · ') }
  })
  reportRemovedSlugs(topics.map((t) => t.slug))
  const searchIndex = createSearchIndex(documents)
  ensureDir(path.join(process.cwd(), 'public'))
  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'search-index.json'),
    JSON.stringify(searchIndex)
  )

  const graph = buildTopicGraph()
  fs.writeFileSync(
    path.join(process.cwd(), 'public', 'topics-graph.json'),
    JSON.stringify(graph, null, 2)
  )

  console.log('\nDone!')
}

main().catch(console.error)
