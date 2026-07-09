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
import { sectionsByCategory, categoryTitles } from '@/lib/content/sections'

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
    <article className="max-w-[680px] mx-auto animate-fade-in">
      <div className="mb-6">
        <Link
          href={`/${category}`}
          className="inline-flex min-h-8 items-center gap-1.5 -ml-1 pr-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {categoryTitles[category] ?? category}
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-5">
        <TopicHeader
          title={meta.title}
          difficulty={meta.difficulty}
          estimatedReadingTime={meta.estimatedReadingTime}
          tags={meta.tags}
        />
        <ProgressToggles slug={slug} />
      </header>

      {meta.prerequisites.length > 0 && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Prerequisites</span>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {meta.prerequisites.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs rounded-full capitalize hover:bg-accent transition-colors duration-200 max-w-full h-auto whitespace-normal text-left">
                <Link href={`/${category}/${p}`}>{p.replace(/-/g, ' ')}</Link>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {meta.relatedTopics.length > 0 && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Related</span>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {meta.relatedTopics.map((r) => (
              <Badge key={r} variant="outline" className="text-xs rounded-full capitalize hover:bg-secondary transition-colors duration-200 max-w-full h-auto whitespace-normal text-left">
                <Link href={`/${category}/${r}`}>{r.replace(/-/g, ' ')}</Link>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator className="mt-8 mb-10 bg-border/60" />

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
            <div className="mt-10 p-5 rounded-xl bg-card/60 border border-border/60">
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="h-4 w-4 text-brand" />
                <span className="text-sm font-semibold">Quick Reference</span>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3">
                Related references and Python patterns for this topic.
              </p>
              <div className="grid gap-1">
                {suppTopics.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${category}/${t.slug}`}
                    className="flex min-h-11 items-center justify-between gap-3 -mx-2 px-3 py-2.5 rounded-lg hover:bg-secondary/70 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-xs text-ink-faint tabular-nums shrink-0">{t.estimatedReadingTime} min</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })()
      )}

      <Separator className="my-10 bg-border/60" />

      <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
        {prev ? (
          <Link
            href={`/${category}/${prev.slug}`}
            className="group flex flex-col gap-1 rounded-xl border border-border/60 bg-card/60 p-4 hover:bg-card hover:border-border transition-colors duration-200"
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              <ChevronLeft className="h-3 w-3" />
              Previous
            </span>
            <span className="text-sm font-medium capitalize text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {prev.slug.replace(/-/g, ' ')}
            </span>
          </Link>
        ) : <div className="hidden sm:block" />}
        {next ? (
          <Link
            href={`/${category}/${next.slug}`}
            className="group flex flex-col gap-1 items-end text-right rounded-xl border border-border/60 bg-card/60 p-4 hover:bg-card hover:border-border transition-colors duration-200"
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Next
              <ChevronRight className="h-3 w-3" />
            </span>
            <span className="text-sm font-medium capitalize text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {next.slug.replace(/-/g, ' ')}
            </span>
          </Link>
        ) : <div className="hidden sm:block" />}
      </nav>
    </article>
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
