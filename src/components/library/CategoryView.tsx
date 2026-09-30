'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Search, X } from 'lucide-react'
import type { Category } from '@/lib/content/types'
import type { LibraryCategory, LibrarySection, LibraryTopic } from '@/lib/content/library'
import { categoryTitles } from '@/lib/content/sections'
import { cn } from '@/lib/utils'
import { isDue, topicStatus, type TopicStatus } from '@/lib/progress/status'
import type { ProgressState } from '@/lib/progress/useProgress'
import { readLocalStorage, useLocalStorage } from '@/lib/useLocalStorage'
import { StatusIcon } from './StatusIcon'
import { countStudied, sectionTopics } from './utils'

const OPEN_SECTIONS_KEY = 'library:open-sections'
/** Sections longer than this start collapsed. */
const LARGE_SECTION = 20

type StatusFilter = 'all' | TopicStatus

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Not started' },
  { key: 'read', label: 'In progress' },
  { key: 'studied', label: 'Studied' },
]

function parseOpenState(raw: string | null): Record<string, boolean> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

export function CategoryView({ category, progress }: { category: LibraryCategory; progress: ProgressState }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [rawOpen, setRawOpen] = useLocalStorage(OPEN_SECTIONS_KEY)
  const openState = useMemo(() => parseOpenState(rawOpen), [rawOpen])
  const [variantOn, setVariantOn] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const key = (sectionId: string) => `${category.id}:${sectionId}`

  // Honour #section links (and the legacy ?section= form): open that section and scroll to it.
  useEffect(() => {
    const target = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('section') || ''
    if (!target || !category.sections.some((s) => s.id === target)) return
    const current = parseOpenState(readLocalStorage(OPEN_SECTIONS_KEY))
    setRawOpen(JSON.stringify({ ...current, [`${category.id}:${target}`]: true }))
    requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }))
  }, [category, setRawOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const filtering = q !== '' || filter !== 'all'
  const statusOf = (slug: string) => topicStatus(progress.bySlug.get(slug))

  const visible = category.sections
    .map((section) => {
      const showVariant = Boolean(section.variant && variantOn[section.id])
      const base = showVariant && section.variant ? section.variant.topics : section.topics
      const topics = base.filter(
        (t) => (!q || t.title.toLowerCase().includes(q)) && (filter === 'all' || statusOf(t.slug) === filter)
      )
      return { section, base, topics, showVariant }
    })
    .filter((v) => !filtering || v.topics.length > 0)

  const isOpen = (s: LibrarySection) => filtering || (openState[key(s.id)] ?? s.topics.length <= LARGE_SECTION)
  const allOpen = visible.every((v) => isOpen(v.section))

  const setOpen = (patch: Record<string, boolean>) => {
    setRawOpen(JSON.stringify({ ...openState, ...patch }))
  }

  const studied = countStudied(category, progress)
  const started = progress.loaded && category.sections.some((s) => sectionTopics(s).some((t) => statusOf(t.slug) !== 'new'))
  const nextUp = started
    ? category.sections.flatMap((s) => s.topics).find((t) => !t.recap && statusOf(t.slug) === 'new')
    : undefined

  return (
    <div className="animate-fade-in">
      <header className="mb-4">
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-balance md:text-[26px]">
          {categoryTitles[category.id]}
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          {category.total} topics
          {progress.loaded && <> · {studied} studied</>}
          {' · '}
          {category.sections.length} {category.sections.length === 1 ? 'section' : 'sections'}
        </p>
        {nextUp && (
          <Link
            href={`/${category.id}/${nextUp.slug}`}
            className="mt-3 inline-flex max-w-full items-center gap-1.5 text-[13.5px] text-brand hover:underline"
          >
            <span className="shrink-0 text-muted-foreground">Next up:</span>
            <span className="truncate font-medium">{nextUp.title}</span>
            <ArrowRight className="size-3.5 shrink-0" />
          </Link>
        )}
      </header>

      <div className="sticky top-14 z-10 -mx-1 flex flex-wrap items-center gap-2 bg-background px-1 py-2.5">
        <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-ink-faint focus-within:border-brand">
          <Search className="size-4 shrink-0" />
          <input
            ref={inputRef}
            id="library-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${category.title}`}
            aria-label={`Filter ${categoryTitles[category.id]} topics`}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear filter" className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden rounded border border-border px-1.5 font-mono text-[11px] text-muted-foreground sm:inline">/</kbd>
        </label>
        <div role="group" aria-label="Show" className="flex gap-0.5 rounded-lg border border-border bg-card p-[3px] max-sm:w-full">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-7 whitespace-nowrap rounded-md px-2.5 text-[13px] transition-colors max-sm:flex-1 max-sm:px-1',
                filter === f.key ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!filtering && (
          <button
            type="button"
            onClick={() => setOpen(Object.fromEntries(visible.map((v) => [key(v.section.id), !allOpen])))}
            className="h-9 px-1.5 text-[13px] text-muted-foreground hover:text-foreground max-sm:ml-auto max-sm:h-7"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <p>No topics match these filters.</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setFilter('all') }}
            className="mt-2 font-medium text-brand hover:underline"
          >
            Show all {category.total} topics
          </button>
        </div>
      ) : (
        <div>
          {visible.map(({ section, base, topics, showVariant }) => {
            const open = isOpen(section)
            const done = base.filter((t) => statusOf(t.slug) === 'studied').length
            return (
              <section key={section.id} id={section.id} className="scroll-mt-32 border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpen({ [key(section.id)]: !open })}
                  aria-expanded={open}
                  disabled={filtering}
                  className="grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2.5 py-3.5 text-left disabled:cursor-default"
                >
                  <ChevronRight className={cn('size-3.5 text-ink-faint transition-transform', open && 'rotate-90')} aria-hidden />
                  <span className="text-[15px] font-semibold tracking-[-0.01em]">{section.label}</span>
                  <span className="flex items-center gap-2.5 text-xs text-ink-faint">
                    <span className="hidden h-[3px] w-14 overflow-hidden rounded bg-border sm:block" aria-hidden>
                      <span className="block h-full bg-brand" style={{ width: `${base.length ? (done / base.length) * 100 : 0}%` }} />
                    </span>
                    <span className="font-mono tabular-nums">
                      {filtering ? `${topics.length} of ${base.length}` : `${done}/${base.length}`}
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="pb-3 sm:pl-[26px]">
                    <p className="-mt-1.5 mb-2 text-[13px] text-muted-foreground">{section.description}</p>
                    {section.variant && (
                      <div role="group" aria-label="Topic set" className="mb-2 flex gap-1.5">
                        {[false, true].map((v) => (
                          <button
                            key={String(v)}
                            type="button"
                            aria-pressed={showVariant === v}
                            onClick={() => setVariantOn((prev) => ({ ...prev, [section.id]: v }))}
                            className={cn(
                              'h-7 rounded-full border px-3 text-[12.5px] transition-colors',
                              showVariant === v ? 'border-foreground font-medium text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {v ? section.variant!.label : 'All groups'}
                          </button>
                        ))}
                      </div>
                    )}
                    <ul>
                      {topics.map((t) => (
                        <TopicRow
                          key={t.slug}
                          topic={t}
                          category={category.id}
                          status={statusOf(t.slug)}
                          due={isDue(progress.bySlug.get(t.slug), progress.now)}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TopicRow({ topic, category, status, due }: { topic: LibraryTopic; category: Category; status: TopicStatus; due: boolean }) {
  return (
    <li>
      <Link
        href={`/${category}/${topic.slug}`}
        prefetch={false}
        className="-mx-2.5 grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary max-sm:py-2.5"
      >
        <StatusIcon status={status} />
        <span className={cn('flex min-w-0 items-center gap-2 text-[14.5px]', status === 'studied' ? 'text-muted-foreground' : 'text-foreground')}>
          <span className="truncate">{topic.title}</span>
          {topic.recap && (
            <span className="shrink-0 rounded-full border border-border px-1.5 text-[10.5px] leading-4 text-ink-faint">Recap</span>
          )}
        </span>
        <span className="flex items-center gap-2.5 whitespace-nowrap text-xs text-ink-faint">
          {due && <span className="rounded-full bg-brand/10 px-2 py-px text-[11px] font-medium text-brand">Due</span>}
          <span className="font-mono tabular-nums max-sm:hidden">{topic.minutes} min</span>
        </span>
      </Link>
    </li>
  )
}
