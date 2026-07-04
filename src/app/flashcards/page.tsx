'use client'

import { useEffect, useState } from 'react'
import type { TopicMeta, Category } from '@/lib/content/types'
import { CardDeck } from '@/components/flashcards/CardDeck'

export default function FlashcardsPage() {
  const [topics, setTopics] = useState<TopicMeta[]>([])
  const [category, setCategory] = useState<Category>('system-design')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => {
        if (data?.documents) setTopics(data.documents as TopicMeta[])
      })
  }, [])

  const filtered = topics.filter((t) => t.category === category)
  const catNames: Record<Category, string> = {
    'system-design': 'System Design',
    dsa: 'DS&A',
    ddia: 'DDIA',
    'cs-fundamentals': 'CS Fundamentals',
    behavioral: 'Behavioral',
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!started ? (
        <div className="flex flex-col items-center py-16 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Flashcards</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Study with spaced repetition. Choose a category to begin.
          </p>

          <div className="grid gap-3 w-full max-w-sm mb-8">
            {(['system-design', 'ddia', 'dsa', 'cs-fundamentals', 'behavioral'] as Category[]).map((c) => {
              const count = topics.filter((t) => t.category === c).length
              if (count === 0) return null
              return (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setStarted(true) }}
                  className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4 text-left hover:bg-secondary transition-colors duration-200"
                >
                  <span className="font-medium">{catNames[c]}</span>
                  <span className="text-xs text-ink-faint">{count} topics</span>
                </button>
              )
            })}
          </div>

          <p className="text-xs text-ink-faint max-w-sm text-center leading-relaxed">
            Each topic becomes a flashcard. Rate your recall to schedule the next review.
            Use keyboard: <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px]">Space</kbd> to flip,{' '}
            <kbd className="px-1 py-0.5 rounded bg-secondary text-foreground text-[10px]">1-4</kbd> to rate.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold tracking-tight">
              Flashcards — {catNames[category]}
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
