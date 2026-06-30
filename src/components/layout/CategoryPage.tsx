'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { TopicMeta, Category } from '@/lib/content/types'
import { categoryTitles, sectionsByCategory, sectionId, type SectionDef } from '@/lib/content/sections'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, ChevronRight, BookOpen, Target } from 'lucide-react'

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
      matched.sort((a, b) => a.title.localeCompare(b.title))
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

  return (
    <div className="max-w-4xl animate-fade-in">
      {filterSection ? (
        <>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">{categoryTitle}</h1>
          <p className="text-[#999999] mb-4">
            {filteredTopics} topics in {filteredSectionsWithTopics.length} section{filteredSectionsWithTopics.length !== 1 ? 's' : ''}
            {' — '}
            <Link href={`/${category}`} className="text-[#0099ff] underline underline-offset-2 hover:opacity-80 transition-opacity">
              View all {totalTopics} topics across {activeSections.length} sections
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">{categoryTitle}</h1>
          <p className="text-[#999999] mb-8">
            {totalTopics} topics across {activeSections.length} sections
          </p>
        </>
      )}

      {filteredSectionsWithTopics.length === 0 && filterSection && (
        <p className="text-sm text-[#999999]">Section not found.</p>
      )}

      {filteredSectionsWithTopics.map(({ section, topics: secTopics }) => {
        return (
          <div key={section.label} id={sectionId(section.label)} className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              {section.icon ? iconMap[section.icon] : null}
              <h2 className="text-xl font-semibold tracking-tight">{section.label}</h2>
              <span className="text-sm text-[#999999] ml-auto">{secTopics.length} topics</span>
            </div>
            <p className="text-sm text-[#999999] mb-4">{section.description}</p>
            <div className="grid gap-2">
              {secTopics.map((topic) => (
                <Link key={topic.slug} href={`/${category}/${topic.slug}`}>
                  <Card className="transition-colors duration-200 hover:bg-[#1c1c1c] hover:-translate-y-0.5">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-sm truncate">{topic.title}</h3>
                          <Badge variant="secondary" className="text-[10px] capitalize shrink-0 rounded-full px-2 py-0">
                            {topic.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#999999]">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {topic.estimatedReadingTime} min
                          </span>
                          <span>{topic.tags.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#999999] shrink-0 ml-3" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {!filterSection && leftovers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-1 tracking-tight">Additional Resources</h2>
          <p className="text-sm text-[#999999] mb-4">Other topics that may be useful.</p>
          <div className="grid gap-2">
            {leftovers.map((topic) => (
              <Link key={topic.slug} href={`/${category}/${topic.slug}`}>
                <Card className="transition-colors duration-200 hover:bg-[#1c1c1c] hover:-translate-y-0.5">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{topic.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-[#999999]">
                        <Clock className="h-3 w-3" />
                        {topic.estimatedReadingTime} min
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#999999] shrink-0 ml-3" />
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
