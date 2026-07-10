'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { TopicMeta, Category, ProgressEntry } from '@/lib/content/types'
import { categoryTitles, sectionsByCategory, sectionId, type SectionDef } from '@/lib/content/sections'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, ChevronRight, BookOpen, Target, CheckCircle } from 'lucide-react'
import { getAllProgress } from '@/lib/progress/db'
import { cn } from '@/lib/utils'

const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 }

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
}

interface TopicWithSlug extends TopicMeta {
  slug: string
}

function sortBySlugOrder(slugs: string[], topic: TopicWithSlug): number {
  const idx = slugs.indexOf(topic.slug)
  return idx >= 0 ? idx : 999
}

export function CategoryPageContent({
  category,
  topics,
}: {
  category: Category
  topics: TopicWithSlug[]
}) {
  const searchParams = useSearchParams()
  const filterSection = searchParams.get('section') ?? undefined

  const [progressMap, setProgressMap] = useState<Map<string, ProgressEntry> | null>(null)
  const scrollTargetRef = useRef<HTMLAnchorElement>(null)
  const hasScrolled = useRef(false)

  useEffect(() => {
    getAllProgress().then((entries) => {
      const map = new Map<string, ProgressEntry>()
      for (const e of entries) map.set(e.slug, e)
      setProgressMap(map)
    })
  }, [])

  useEffect(() => {
    if (progressMap && scrollTargetRef.current && !hasScrolled.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      hasScrolled.current = true
    }
  }, [progressMap])

  const sections = sectionsByCategory[category]
  if (!sections) {
    return <div>Category not found</div>
  }

  const allTopicMap = new Map<string, TopicWithSlug>()
  for (const t of topics) {
    allTopicMap.set(t.slug, t)
  }

  function topicsForSection(section: SectionDef): TopicWithSlug[] {
    if (section.slugPrefix) {
      const matched: TopicWithSlug[] = []
      for (const [slug, topic] of allTopicMap) {
        if (slug.startsWith(section.slugPrefix)) matched.push(topic)
      }
      matched.sort((a, b) => {
        const aOrder = a.sortOrder ?? 999
        const bOrder = b.sortOrder ?? 999
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.title.localeCompare(b.title)
      })
      return matched
    }
    const matched: TopicWithSlug[] = []
    for (const slug of section.slugs) {
      const topic = allTopicMap.get(slug)
      if (topic) matched.push(topic)
    }
    matched.sort((a, b) => sortBySlugOrder(section.slugs, a) - sortBySlugOrder(section.slugs, b))
    return matched
  }

  const assignedSlugs = new Set<string>()
  const renderedSections = sections.map((section) => {
    const secTopics = topicsForSection(section)
    for (const t of secTopics) assignedSlugs.add(t.slug)
    return { section, topics: secTopics }
  })

  const leftovers: TopicWithSlug[] = []
  for (const [slug, topic] of allTopicMap) {
    if (!assignedSlugs.has(slug)) leftovers.push(topic)
  }
  leftovers.sort((a, b) => (difficultyOrder[a.difficulty] ?? 0) - (difficultyOrder[b.difficulty] ?? 0))

  const categoryTitle = categoryTitles[category] ?? category
  const totalTopics = allTopicMap.size

  const activeSections = renderedSections.filter((s) => s.topics.length > 0)
  const filteredSections = filterSection
    ? activeSections.filter((s) => sectionId(s.section.label) === filterSection)
    : activeSections

  const filteredSectionsWithTopics = filteredSections.filter((s) => s.topics.length > 0)
  const filteredTopics = filteredSectionsWithTopics.reduce((sum, s) => sum + s.topics.length, 0)

  let firstUnreadSlug: string | null = null
  if (progressMap) {
    for (const { topics: secTopics } of filteredSectionsWithTopics) {
      const found = secTopics.find((t) => !progressMap.get(t.slug)?.readAt)
      if (found) { firstUnreadSlug = found.slug; break }
    }
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      {filterSection ? (
        <>
          <h1 className="text-[26px] md:text-[28px] font-semibold mb-1.5 tracking-[-0.02em]">{categoryTitle}</h1>
          <p className="text-[15px] text-muted-foreground mb-6">
            {filteredTopics} topics in {filteredSectionsWithTopics.length} section{filteredSectionsWithTopics.length !== 1 ? 's' : ''}
            {' — '}
            <Link href={`/${category}`} className="text-brand underline underline-offset-2 hover:opacity-80 transition-opacity">
              View all {totalTopics} topics across {activeSections.length} sections
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-[26px] md:text-[28px] font-semibold mb-1.5 tracking-[-0.02em]">{categoryTitle}</h1>
          <p className="text-[15px] text-muted-foreground mb-10">
            {totalTopics} topics across {activeSections.length} sections
          </p>
        </>
      )}

      {filteredSectionsWithTopics.length === 0 && filterSection && (
        <p className="text-sm text-muted-foreground">Section not found.</p>
      )}

      {filteredSectionsWithTopics.map(({ section, topics: secTopics }) => {
        const firstUnreadIdx = !progressMap ? -1 : secTopics.findIndex(
          (t) => !progressMap.get(t.slug)?.readAt
        )
        return (
          <div key={section.label} id={sectionId(section.label)} className="mb-12">
            <div className="flex items-center gap-2 mb-1">
              {section.icon ? iconMap[section.icon] : null}
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{section.label}</h2>
              <span className="text-xs text-ink-faint tabular-nums ml-auto">{secTopics.length} topics</span>
            </div>
            <p className="text-[13px] text-muted-foreground mb-4">{section.description}</p>
            <div className="grid gap-2">
              {secTopics.map((topic, idx) => {
                const isRead = progressMap?.get(topic.slug)?.readAt != null
                const isFirstUnread = idx === firstUnreadIdx
                const isScrollTarget = topic.slug === firstUnreadSlug
                return (
                  <Link
                    key={topic.slug}
                    href={`/${category}/${topic.slug}`}
                    className="min-w-0"
                    ref={isScrollTarget ? scrollTargetRef : undefined}
                  >
                    <Card className={cn(
                      'transition-colors duration-200 hover:bg-secondary/50 hover:border-border',
                      isRead && 'opacity-60',
                      isFirstUnread && 'ring-1 ring-brand/25 bg-brand/[0.04]'
                    )}>
                      <CardContent className="flex min-h-14 items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-medium text-sm truncate">{topic.title}</h3>
                            {topic.tags.includes('chapter-summary') && (
                              <Badge variant="outline" className="text-[10px] shrink-0 rounded-full px-2 py-0 text-ink-faint border-ink-faint/30">
                                recap
                              </Badge>
                            )}
                            {isFirstUnread && (
                              <Badge className="text-[10px] shrink-0 rounded-full px-2 py-0 bg-brand/15 text-brand border-brand/25">
                                Next up
                              </Badge>
                            )}
                            {isRead ? (
                              <Badge className="text-[10px] shrink-0 rounded-full px-2 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                <CheckCircle className="h-3 w-3 mr-0.5" />
                                read
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] capitalize shrink-0 rounded-full px-2 py-0">
                                {topic.difficulty}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {topic.estimatedReadingTime} min
                            </span>
                            <span>{topic.tags.slice(0, 2).join(', ')}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-ink-faint shrink-0 ml-3" />
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {!filterSection && leftovers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[17px] font-semibold mb-1 tracking-[-0.01em]">Additional Resources</h2>
          <p className="text-sm text-muted-foreground mb-4">Other topics that may be useful.</p>
          <div className="grid gap-2">
            {leftovers.map((topic) => (
              <Link key={topic.slug} href={`/${category}/${topic.slug}`} className="min-w-0">
                <Card className="transition-colors duration-200 hover:bg-secondary/50 hover:border-border">
                  <CardContent className="flex min-h-14 items-center justify-between px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{topic.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {topic.estimatedReadingTime} min
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-faint shrink-0 ml-3" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
