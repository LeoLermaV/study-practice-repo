'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import MiniSearch from 'minisearch'
import type { TopicMeta, Category } from '@/lib/content/types'
import { assetPath } from '@/lib/utils'
import { categoryColor, categoryShortTitles, isListedTopic } from '@/lib/content/sections'
import { Search as SearchIcon } from 'lucide-react'

type Hit = Pick<TopicMeta, 'slug' | 'title' | 'category' | 'difficulty' | 'estimatedReadingTime'>

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<MiniSearch<Hit> | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(assetPath('/search-index.json'))
      .then((r) => r.text())
      .then((json) => {
        if (cancelled) return
        setIndex(
          MiniSearch.loadJSON<Hit>(json, {
            fields: ['title', 'tags'],
            storeFields: ['slug', 'title', 'category', 'difficulty', 'estimatedReadingTime'],
          })
        )
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const results = useMemo(() => {
    const q = query.trim()
    if (!index || !q) return []
    return (index.search(q, { prefix: true, fuzzy: 0.2 }) as unknown as Hit[]).filter((h) => isListedTopic(h.slug))
  }, [index, query])

  return (
    <div className="mx-auto max-w-[680px] animate-fade-in">
      <h1 className="mb-5 text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Search</h1>
      <label className="mb-5 flex h-11 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-ink-faint focus-within:border-brand">
        <SearchIcon className="size-4 shrink-0" />
        <input
          id="search-page-input"
          type="search"
          placeholder="Search all topics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-ink-faint"
        />
      </label>

      {!index && !failed && <p className="text-sm text-muted-foreground">Loading search index…</p>}
      {failed && <p className="text-sm text-destructive">The search index could not be loaded. Reload the page to try again.</p>}

      <ul className="border-t border-border empty:border-t-0">
        {results.map((topic) => (
          <li key={`${topic.category}-${topic.slug}`} className="border-b border-border">
            <Link href={`/${topic.category}/${topic.slug}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-1 py-3 transition-colors hover:bg-secondary">
              <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(topic.category) }} aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium">{topic.title}</span>
                <span className="text-[12.5px] text-muted-foreground">
                  {categoryShortTitles[topic.category as Category]} · <span className="capitalize">{topic.difficulty}</span>
                </span>
              </span>
              <span className="font-mono text-xs text-ink-faint tabular-nums">{topic.estimatedReadingTime} min</span>
            </Link>
          </li>
        ))}
      </ul>
      {query.trim() && index && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No topics match &ldquo;{query.trim()}&rdquo;.</p>
      )}
    </div>
  )
}
