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
    const escaped = body.replace(/(?<!\\){/g, '\\{').replace(/(?<!\\)}/g, '\\}')
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
