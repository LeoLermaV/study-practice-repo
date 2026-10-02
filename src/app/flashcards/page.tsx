'use client'

import { useEffect, useState } from 'react'
import type { TopicMeta, Category, ProgressEntry } from '@/lib/content/types'
import { getAllProgress } from '@/lib/progress/db'
import { buildQueue } from '@/lib/progress/queue'
import { assetPath } from '@/lib/utils'
import { categoryColor, categoryOrder, categoryShortTitles } from '@/lib/content/sections'
import { CardDeck } from '@/components/flashcards/CardDeck'

export default function FlashcardsPage() {
  const [topics, setTopics] = useState<TopicMeta[]>([])
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [category, setCategory] = useState<Category>('system-design')
  const [started, setStarted] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    fetch(assetPath('/topics-graph.json'))
      .then((r) => r.json())
      .then((data) => {
        if (data?.nodes) setTopics(data.nodes as TopicMeta[])
      })
      .catch(() => setLoadFailed(true))
  }, [])

  useEffect(() => {
    if (!started) {
      getAllProgress().then(setProgress)
    }
  }, [started])

  const filtered = topics.filter((t) => t.category === category)

  return (
    <div className="mx-auto max-w-[680px]">
      {!started ? (
        <div className="animate-fade-in">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Flashcards</h1>
          <p className="mb-7 mt-1 text-[14px] text-muted-foreground">
            Quick recall on topics that are due. Choose a category to begin.
          </p>

          {loadFailed && (
            <p className="mb-6 text-sm text-destructive">
              Could not load topics — card counts below are unavailable, not zero.
            </p>
          )}

          <div className="mb-8 border-t border-border">
            {categoryOrder.map((c) => {
              const count = buildQueue(
                topics.filter((t) => t.category === c),
                progress,
                { mode: 'review' }
              ).length
              return (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setStarted(true) }}
                  className="flex w-full items-center gap-3 border-b border-border px-1 py-3.5 text-left transition-colors hover:bg-secondary"
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(c) }} aria-hidden />
                  <span className="flex-1 text-[15px] font-medium">{categoryShortTitles[c]}</span>
                  <span className={`text-xs ${count > 0 ? 'font-medium text-brand' : 'text-ink-faint'}`}>{count} due</span>
                </button>
              )
            })}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Topics you mark as studied appear here when they fall due. Rate your recall to schedule the next one.
            Use keyboard: <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px]">Space</kbd> to flip,{' '}
            <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px]">1-4</kbd> to rate.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold tracking-tight">
              Flashcards · {categoryShortTitles[category]}
            </h1>
          </div>
          <CardDeck
            key={category}
            topics={filtered}
            category={category}
            onBack={() => setStarted(false)}
          />
        </div>
      )}
    </div>
  )
}
