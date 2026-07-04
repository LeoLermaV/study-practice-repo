import fs from 'fs'
import path from 'path'
import { compileMDX } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { readTopicMeta, getTopicFiles } from '@/lib/content/fs'
import type { TopicMeta, Category } from '@/lib/content/types'
import { TopicHeader } from '@/components/topic/TopicHeader'
import { ProgressToggles } from '@/components/progress/ProgressToggles'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import remarkGfm from 'remark-gfm'
import { sectionsByCategory } from '@/lib/content/sections'

const supplementMap: Record<string, string[]> = {
  'load-balancing': ['donnemartin-load-balancer'],
  'caching': ['donnemartin-cache'],
  'content-delivery-network-cdn': ['donnemartin-content-delivery-network'],
  'domain-name-system-dns': ['donnemartin-domain-name-system'],
  'cap-theorem': ['donnemartin-availability-vs-consistency', 'donnemartin-consistency-patterns'],
  'availability': ['donnemartin-availability-patterns'],
  'proxy': ['donnemartin-reverse-proxy-web-server'],
  'monoliths-and-microservices': ['donnemartin-application-layer'],
  'tcp-and-udp': ['donnemartin-communication'],
  'rest-graphql-grpc': ['donnemartin-communication'],
  'long-polling-websockets-server-sent-events-sse': ['donnemartin-communication'],
  'ssl-tls-mtls': ['donnemartin-security'],
  'oauth-2-0-and-openid-connect-oidc': ['donnemartin-security'],
  'single-sign-on-sso': ['donnemartin-security'],
  'databases-and-dbms': ['donnemartin-database'],
  'sql-databases': ['donnemartin-database'],
  'nosql-databases': ['donnemartin-database'],
  'sql-vs-nosql-databases': ['donnemartin-database'],
  'sharding': ['donnemartin-database'],
  'sliding-window': ['python-practice-medium-sliding-window', 'sliding-window-template'],
}

interface TopicPageProps {
  category: Category
  slug: string
}

export async function TopicPageContent({ category, slug }: TopicPageProps) {
  const meta = readTopicMeta(category, slug) as TopicMeta | null
  if (!meta) return <div>Topic not found</div>

  const filePath = path.join(process.cwd(), 'src', 'content', category, `${slug}.mdx`)
  const source = fs.readFileSync(filePath, 'utf-8')

  const frontmatterEnd = source.indexOf('---', 3)
  let body = source.slice(frontmatterEnd + 3).trim()

  body = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  const orderedSlugs = buildOrderedSlugs(category)
  const currentIdx = orderedSlugs.indexOf(slug)
  const prev = currentIdx > 0 ? { slug: orderedSlugs[currentIdx - 1] } : null
  const next = currentIdx < orderedSlugs.length - 1 ? { slug: orderedSlugs[currentIdx + 1] } : null

  return (
    <div className="max-w-[680px] mx-auto animate-fade-in">
      <div className="mb-6">
        <Link
          href={`/${category}`}
          className="inline-flex items-center gap-1 text-sm text-[#999999] hover:text-[#0099ff] transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <TopicHeader
          title={meta.title}
          difficulty={meta.difficulty}
          estimatedReadingTime={meta.estimatedReadingTime}
          tags={meta.tags}
        />
        <ProgressToggles slug={slug} />
      </div>

      {meta.prerequisites.length > 0 && (
        <div className="mb-6 p-4 bg-[#141414] rounded-xl">
          <span className="text-sm font-medium">Prerequisites</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {meta.prerequisites.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs rounded-full hover:bg-[#262626] transition-colors duration-200">
                <Link href={`/${category}/${p}`}>{p.replace(/-/g, ' ')}</Link>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {meta.relatedTopics.length > 0 && (
        <div className="mb-6 p-4 bg-[#141414] rounded-xl">
          <span className="text-sm font-medium">Related</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {meta.relatedTopics.map((r) => (
              <Badge key={r} variant="outline" className="text-xs rounded-full hover:bg-[#1c1c1c] transition-colors duration-200">
                <Link href={`/${category}/${r}`}>{r.replace(/-/g, ' ')}</Link>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator className="mb-8" />

      <div className="topic-content max-w-none">
        <MDXBody slug={slug} source={body} />
      </div>

      {meta.prerequisites.length > 0 && meta.prerequisites[0].startsWith('donnemartin-') ? null : (
        (() => {
          const suppSlugs = supplementMap[slug]
          if (!suppSlugs) return null
          const suppTopics = suppSlugs
            .map((s) => readTopicMeta<TopicMeta & { slug: string }>(category, s))
            .filter((t): t is TopicMeta & { slug: string } => t !== null)
          if (suppTopics.length === 0) return null
          return (
            <div className="mt-8 p-5 rounded-xl bg-[#141414] border border-[#262626]">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-[#0099ff]" />
                <span className="text-sm font-medium">Quick Reference</span>
              </div>
              <p className="text-xs text-[#999999] mb-3">
                Related references and Python patterns for this topic.
              </p>
              <div className="grid gap-2">
                {suppTopics.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${category}/${t.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1c1c1c] transition-colors duration-200"
                  >
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-xs text-[#999999]">{t.estimatedReadingTime} min</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })()
      )}

      <Separator className="my-8" />

      <div className="flex items-center justify-between">
        {prev ? (
          <Link
            href={`/${category}/${prev.slug}`}
            className="inline-flex items-center gap-1 text-sm text-[#999999] hover:text-[#0099ff] transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
            {prev.slug.replace(/-/g, ' ')}
          </Link>
        ) : <div />}
        {next ? (
          <Link
            href={`/${category}/${next.slug}`}
            className="inline-flex items-center gap-1 text-sm text-[#999999] hover:text-[#0099ff] transition-colors duration-200"
          >
            {next.slug.replace(/-/g, ' ')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : <div />}
      </div>
    </div>
  )
}

const mdxCache = new Map<string, React.ReactNode>()

async function MDXBody({ slug, source }: { slug: string; source: string }) {
  const cached = mdxCache.get(slug)
  if (cached !== undefined) return <>{cached}</>

  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
    components: {
      a: (props: any) => {
        const href = props.href || ''
        if (href.startsWith('http')) {
          return <a {...props} target="_blank" rel="noopener noreferrer" />
        }
        return <a {...props} />
      },
    },
  })
  mdxCache.set(slug, content)
  return <>{content}</>
}

function buildOrderedSlugs(category: string): string[] {
  const sections = sectionsByCategory[category]
  if (!sections) {
    return getTopicFiles(category).map((f) => f.slug).sort()
  }

  const allFiles = getTopicFiles(category)
  const allSlugs = new Set(allFiles.map((f) => f.slug))
  const ordered: string[] = []
  const seen = new Set<string>()

  for (const section of sections) {
    if (section.slugPrefix) {
      const prefix = section.slugPrefix
      const matched = allFiles
        .filter((f) => f.slug.startsWith(prefix))
        .sort((a, b) => a.slug.localeCompare(b.slug))
      for (const f of matched) {
        if (!seen.has(f.slug)) {
          ordered.push(f.slug)
          seen.add(f.slug)
        }
      }
    } else {
      for (const s of section.slugs) {
        if (allSlugs.has(s) && !seen.has(s)) {
          ordered.push(s)
          seen.add(s)
        }
      }
    }
  }

  for (const f of allFiles) {
    if (!seen.has(f.slug)) ordered.push(f.slug)
    seen.add(f.slug)
  }

  return ordered
}
