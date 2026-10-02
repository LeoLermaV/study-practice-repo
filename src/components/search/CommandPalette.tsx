'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { categoryColor, categoryOrder, categoryShortTitles, isListedTopic } from '@/lib/content/sections'
import { matchTopic } from '@/lib/content/matchTopic'
import { loadSearchData, lookupHref, type LookupTopic, type SearchData } from '@/lib/content/topicLookup'
import { onOpenSearch } from './openSearch'

const MAX_TITLE_HITS = 40
const MAX_HEADING_HITS = 12

interface Results {
  byTitle: LookupTopic[]
  byHeading: LookupTopic[]
}

/**
 * Title and tag matches first (every word must match, word starts rank
 * highest), then topics that only mention the words in a section heading,
 * so "quorum" finds the DDIA sections that explain quorums.
 */
function search(data: SearchData, topics: LookupTopic[], query: string): Results {
  const byTitle = topics
    .map((t) => ({ t, score: matchTopic(t.title, t.tags ?? [], query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.t.title.localeCompare(b.t.title))
    .slice(0, MAX_TITLE_HITS)
    .map((r) => r.t)
  const seen = new Set(byTitle.map((t) => t.slug))
  const byHeading: LookupTopic[] = []
  for (const hit of data.index.search(query, { fields: ['headings'], combineWith: 'AND', prefix: true, fuzzy: 0.15 })) {
    const t = data.lookup.get(String(hit.id))
    if (!t || seen.has(t.slug) || !isListedTopic(t.slug)) continue
    seen.add(t.slug)
    byHeading.push(t)
    if (byHeading.length >= MAX_HEADING_HITS) break
  }
  return { byTitle, byHeading }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [data, setData] = useState<SearchData | null>(null)
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
    loadSearchData().then(setData).catch(() => setData(null))
  }, [])

  const topics = useMemo(() => (data ? [...data.lookup.values()].filter((t) => isListedTopic(t.slug)) : []), [data])
  const q = query.trim()
  const results = useMemo(() => (data && q ? search(data, topics, q) : null), [data, topics, q])

  const go = (t: LookupTopic) => {
    setOpen(false)
    setQuery('')
    router.push(lookupHref(t))
  }

  const item = (t: LookupTopic, showCategory: boolean) => (
    <CommandItem key={t.slug} value={t.slug} onSelect={() => go(t)}>
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(t.category) }} aria-hidden />
      <span className="flex-1 truncate">{t.title}</span>
      {showCategory && <span className="shrink-0 text-xs text-ink-faint">{categoryShortTitles[t.category]}</span>}
      {!showCategory && t.estimatedReadingTime !== undefined && (
        <span className="shrink-0 font-mono text-xs text-ink-faint tabular-nums">{t.estimatedReadingTime} min</span>
      )}
    </CommandItem>
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => { setOpen(next); if (!next) setQuery('') }}
      shouldFilter={false}
      title="Search topics"
      description="Search all topics by title, tag or section heading"
    >
      <CommandInput placeholder="Search all topics" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{data ? 'No topics match.' : 'Loading topics…'}</CommandEmpty>
        {results ? (
          <>
            {results.byTitle.length > 0 && (
              <CommandGroup heading="Topics">{results.byTitle.map((t) => item(t, true))}</CommandGroup>
            )}
            {results.byHeading.length > 0 && (
              <CommandGroup heading="In section headings">{results.byHeading.map((t) => item(t, true))}</CommandGroup>
            )}
          </>
        ) : (
          categoryOrder.map((cat) => {
            const list = topics.filter((t) => t.category === cat)
            return list.length > 0 ? (
              <CommandGroup key={cat} heading={categoryShortTitles[cat]}>
                {list.map((t) => item(t, false))}
              </CommandGroup>
            ) : null
          })
        )}
      </CommandList>
    </CommandDialog>
  )
}
