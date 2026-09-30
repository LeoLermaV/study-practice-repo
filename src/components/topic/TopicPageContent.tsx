import fs from 'fs'
import path from 'path'
import { compileMDX } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import { readTopicMeta } from '@/lib/content/fs'
import { findTopic, placeTopic, type TopicRef } from '@/lib/content/library'
import { categoryColor, categoryShortTitles } from '@/lib/content/sections'
import type { TopicMeta, Category } from '@/lib/content/types'
import { AIPracticeButton } from '@/components/topic/AIPracticeButton'
import { ReviewPanel, ReviewStatus } from '@/components/progress/ReviewPanel'

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

function resolve(slugs: string[], exclude: string): TopicRef[] {
  const seen = new Set<string>([exclude])
  const out: TopicRef[] = []
  for (const s of slugs) {
    if (seen.has(s)) continue
    seen.add(s)
    const ref = findTopic(s)
    if (ref) out.push(ref)
  }
  return out
}

const refHref = (r: TopicRef) => `/${r.category}/${r.slug}`

export async function TopicPageContent({ category, slug }: TopicPageProps) {
  const meta = readTopicMeta(category, slug) as TopicMeta | null
  if (!meta) return <div>Topic not found</div>

  const filePath = path.join(process.cwd(), 'src', 'content', category, `${slug}.mdx`)
  const source = fs.readFileSync(filePath, 'utf-8')

  const frontmatterEnd = source.indexOf('---', 3)
  let body = source.slice(frontmatterEnd + 3).trim()

  body = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  const placement = placeTopic(category, slug)
  const prerequisites = resolve(meta.prerequisites, slug)
  const related = resolve(meta.relatedTopics, slug).filter((r) => !prerequisites.some((p) => p.slug === r.slug))
  // Quick Reference pages are themselves donnemartin theory; don't nest references inside them.
  const supplements = meta.prerequisites[0]?.startsWith('donnemartin-') ? [] : resolve(supplementMap[slug] ?? [], slug)

  return (
    <article className="mx-auto max-w-[680px] animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Library</Link>
        <span aria-hidden className="text-ink-faint">/</span>
        <Link href={`/${category}`} className="flex items-center gap-1.5 hover:text-foreground">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: categoryColor(category) }} aria-hidden />
          {categoryShortTitles[category]}
        </Link>
        {placement.sectionLabel && placement.sectionId && (
          <>
            <span aria-hidden className="text-ink-faint">/</span>
            <Link href={`/${category}#${placement.sectionId}`} className="hover:text-foreground">
              {placement.sectionLabel}
            </Link>
          </>
        )}
      </nav>

      <header className="mb-9 border-b border-border pb-6">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-balance md:text-[34px]">
          {meta.title}
        </h1>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
          <ReviewStatus slug={slug} />
          <span className="tabular-nums">{meta.estimatedReadingTime} min read</span>
          <span className="capitalize">{meta.difficulty}</span>
          <span className="sm:ml-auto">
            <AIPracticeButton topicTitle={meta.title} topicContent={body} />
          </span>
        </div>
        {prerequisites.length > 0 && (
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            <span className="text-ink-faint">Before this: </span>
            {prerequisites.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ', '}
                <Link href={refHref(p)} className="text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground">
                  {p.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="topic-content max-w-none">
        <MDXBody slug={slug} source={body} />
      </div>

      {supplements.length > 0 && (
        <aside className="mt-10 rounded-xl border border-border p-4">
          <h2 className="text-[13px] font-medium">Quick reference</h2>
          <p className="mb-2 mt-0.5 text-[13px] text-muted-foreground">Related references and Python patterns for this topic.</p>
          <ul>
            {supplements.map((t) => (
              <li key={t.slug}>
                <Link href={refHref(t)} className="-mx-2 flex min-h-10 items-center justify-between gap-3 rounded-lg px-2 py-2 text-[14px] transition-colors hover:bg-secondary">
                  <span>{t.title}</span>
                  <span className="shrink-0 font-mono text-xs text-ink-faint tabular-nums">{t.minutes} min</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="mt-10">
        <ReviewPanel key={slug} slug={slug} title={meta.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-[13px] font-medium text-muted-foreground">Related topics</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={refHref(r)} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-[14px] transition-colors hover:bg-secondary">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(r.category) }} aria-hidden />
                  <span className="truncate">{r.title}</span>
                  {r.category !== category && (
                    <span className="ml-auto shrink-0 text-xs text-ink-faint">{categoryShortTitles[r.category]}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Previous and next topic" className="mt-10 grid grid-cols-2 gap-3 border-t border-border pt-6">
        {placement.prev ? (
          <Link href={refHref(placement.prev)} className="group min-w-0 rounded-xl border border-border p-3.5 transition-colors hover:border-border-strong">
            <span className="flex items-center gap-1 text-xs text-ink-faint">
              <ChevronLeft className="size-3" aria-hidden />
              Previous
            </span>
            <span className="mt-0.5 block truncate text-[14px] font-medium">{placement.prev.title}</span>
          </Link>
        ) : <span />}
        {placement.next ? (
          <Link href={refHref(placement.next)} className="group min-w-0 rounded-xl border border-border p-3.5 text-right transition-colors hover:border-border-strong">
            <span className="flex items-center justify-end gap-1 text-xs text-ink-faint">
              Next
              <ChevronRight className="size-3" aria-hidden />
            </span>
            <span className="mt-0.5 block truncate text-[14px] font-medium">{placement.next.title}</span>
          </Link>
        ) : <span />}
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
      mdxOptions: { remarkPlugins: [remarkGfm], format: 'md' },
    },
    components: {
      a: (props: React.ComponentProps<'a'>) => {
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
