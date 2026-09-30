'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import type { TopicMeta } from '@/lib/content/types'
import { categoryColor, categoryOrder, categoryShortTitles, isListedTopic } from '@/lib/content/sections'
import { matchTopic } from '@/lib/content/matchTopic'
import { assetPath } from '@/lib/utils'
import { onOpenSearch } from './openSearch'

type PaletteTopic = Pick<TopicMeta, 'slug' | 'title' | 'category' | 'tags'> & { estimatedReadingTime?: number }

// Items carry the slug as their (unique) value and [title, ...tags] as keywords.
const paletteFilter = (value: string, search: string, keywords?: string[]) =>
  matchTopic(keywords?.[0] ?? value, keywords?.slice(1) ?? [], search)

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [topics, setTopics] = useState<PaletteTopic[]>([])
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    const off = onOpenSearch(() => setOpen(true))
    return () => {
      document.removeEventListener('keydown', down)
      off()
    }
  }, [])

  useEffect(() => {
    fetch(assetPath('/search-index.json'))
      .then((r) => r.json())
      .then((data) => {
        // MiniSearch's serialised index keeps each document's stored fields here.
        const stored = data?.storedFields ? (Object.values(data.storedFields) as PaletteTopic[]) : []
        setTopics(stored.filter((t) => t.slug && isListedTopic(t.slug)))
      })
      .catch(() => setTopics([]))
  }, [])

  const grouped = categoryOrder
    .map((cat) => [cat, topics.filter((t) => t.category === cat)] as const)
    .filter(([, list]) => list.length > 0)

  return (
    <CommandDialog open={open} onOpenChange={setOpen} filter={paletteFilter} title="Search topics" description="Search all topics by title or tag">
      <CommandInput placeholder="Search all topics" />
      <CommandList>
        <CommandEmpty>No topics match.</CommandEmpty>
        {grouped.map(([cat, catTopics]) => (
          <CommandGroup key={cat} heading={categoryShortTitles[cat]}>
            {catTopics.map((topic) => (
              <CommandItem
                key={topic.slug}
                value={topic.slug}
                keywords={[topic.title, ...(topic.tags ?? [])]}
                onSelect={() => {
                  setOpen(false)
                  router.push(`/${topic.category}/${topic.slug}`)
                }}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(topic.category) }} aria-hidden />
                <span className="flex-1 truncate">{topic.title}</span>
                {topic.estimatedReadingTime !== undefined && (
                  <span className="shrink-0 font-mono text-xs text-ink-faint tabular-nums">{topic.estimatedReadingTime} min</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
