import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import type { TopicMeta } from '../src/lib/content/types'
import type { SourceAdapter } from './adapters/base'
import { createSearchIndex } from '../src/lib/content/search'
import { buildTopicGraph } from '../src/lib/content/topics'

const cacheDir = path.join(process.cwd(), '.cache', 'repos')
const contentDir = path.join(process.cwd(), 'src', 'content')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function cloneRepo(adapter: SourceAdapter) {
  const target = path.join(cacheDir, adapter.name)
  if (fs.existsSync(target)) {
    try {
      execSync(`git -C "${target}" pull --depth 1`, { stdio: 'pipe' })
    } catch {
      // ignore pull failures
    }
  } else {
    ensureDir(path.dirname(target))
    execSync(`git clone --depth 1 "${adapter.cloneUrl}" "${target}"`, { stdio: 'pipe' })
  }
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
    const escaped = escapeBraces(bodyWithCode)
    const mdx = `---\n${JSON.stringify(topic, null, 2)}\n---\n\n${escaped}`
    fs.writeFileSync(path.join(categoryDir, `${topic.slug}.mdx`), mdx)

    const meta = { ...topic }
    delete (meta as any).sourceRepos
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

function escapeBraces(body: string): string {
  const parts = body.split(/(```[\s\S]*?```)/)
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part
      return part.replace(/(?<!\\){/g, '\\{').replace(/(?<!\\)}/g, '\\}')
    })
    .join('')
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

  const searchIndex = createSearchIndex(topics)
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
