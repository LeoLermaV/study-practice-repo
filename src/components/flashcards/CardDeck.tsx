'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TopicMeta, Category } from '@/lib/content/types'
import { rateReview } from '@/lib/progress/db'
import { buildQueue, type QueueItem } from '@/lib/progress/queue'
import type { Rating } from '@/lib/progress/scheduler'
import { categoryShortTitles } from '@/lib/content/sections'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, ExternalLink, RotateCcw } from 'lucide-react'

const RATING_LABELS: Record<Rating, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' }

interface CardDeckProps {
  topics: TopicMeta[]
  category: Category
  onBack: () => void
}

export function CardDeck({ topics, category, onBack }: CardDeckProps) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [ratings, setRatings] = useState<string[]>([])
  const [startTime] = useState(() => Date.now())
  const [endTime, setEndTime] = useState<number | null>(null)

  useEffect(() => {
    import('@/lib/progress/db').then(({ getAllProgress }) => {
      getAllProgress().then((progress) => {
        setQueue(buildQueue(topics, progress, { mode: 'review' }))
      })
    })
  }, [topics])

  const handleRate = useCallback(async (rating: Rating) => {
    const item = queue[current]
    if (!item) return

    setRatings((prev) => [...prev, rating])
    await rateReview(item.topic.slug, rating)

    if (current < queue.length - 1) {
      setCurrent((c) => c + 1)
      setFlipped(false)
    } else {
      setEndTime(Date.now())
      setShowSummary(true)
    }
  }, [current, queue])

  const handleFlip = useCallback(() => {
    if (!showSummary) setFlipped((f) => !f)
  }, [showSummary])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (showSummary) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
      if (e.key === '1') handleRate('again')
      if (e.key === '2') handleRate('hard')
      if (e.key === '3') handleRate('good')
      if (e.key === '4') handleRate('easy')
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [handleRate, showSummary, current])

  if (showSummary) {
    const elapsed = Math.round(((endTime ?? startTime) - startTime) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60

    return (
      <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">Session complete</h2>
        <p className="text-muted-foreground text-sm mb-8">
          {queue.length} cards in {mins}m {secs.toString().padStart(2, '0')}s
        </p>

        <div className="mb-8 flex gap-6">
          {(['again', 'hard', 'good', 'easy'] as const).map((r) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="font-mono text-lg font-semibold tabular-nums">{ratings.filter((x) => x === r).length}</span>
              <span className="text-[11px] text-ink-faint">{RATING_LABELS[r]}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => { setCurrent(0); setFlipped(false); setShowSummary(false); setRatings([]) }}>
            <RotateCcw className="h-4 w-4" />
            Study again
          </Button>
        </div>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <BookOpen className="h-12 w-12 text-ink-faint/60 mb-4" />
        <h2 className="text-lg font-semibold mb-1">No cards available</h2>
        <p className="text-sm text-muted-foreground mb-6">Study some topics first to build your flashcard queue.</p>
        <Link href={`/${category}`}>
          <Button variant="secondary">
            Browse {categoryShortTitles[category]}
          </Button>
        </Link>
      </div>
    )
  }

  const item = queue[current]

  return (
    <div className="flex flex-col items-center animate-fade-in" style={{ perspective: '1200px' }}>
      <div className="w-full max-w-lg mb-6" onClick={handleFlip} style={{ cursor: 'pointer' }}>
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: 260,
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl bg-card border border-border flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="text-xl font-semibold text-center leading-snug">{item.topic.title}</h2>
            <p className="text-xs text-ink-faint mt-6">Tap or press space to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-card border border-border flex flex-col p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.topic.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] rounded-full">{tag}</Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
              <span className="capitalize">{item.topic.difficulty}</span>
              <span>{item.topic.estimatedReadingTime} min read</span>
            </div>

            <Link
              href={`/${category}/${item.topic.slug}`}
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline mb-6"
              target="_blank"
            >
              Open full topic <ExternalLink className="h-3 w-3" />
            </Link>

            <div className="mt-auto">
              <p className="text-xs text-ink-faint mb-2">How well did you know this?</p>
              <div className="grid grid-cols-4 gap-2">
                {(['again', 'hard', 'good', 'easy'] as const).map((ease, i) => (
                  <button
                    key={ease}
                    onClick={(e) => { e.stopPropagation(); handleRate(ease) }}
                    className={`flex flex-col items-center rounded-lg border py-2 text-xs font-medium transition-colors active:scale-[0.97] ${
                      ease === 'good'
                        ? 'border-brand bg-brand text-brand-foreground hover:opacity-90'
                        : 'border-border hover:border-border-strong hover:bg-secondary'
                    }`}
                  >
                    {RATING_LABELS[ease]}
                    <span className={`font-mono text-[10.5px] font-normal ${ease === 'good' ? 'opacity-75' : 'text-ink-faint'}`}>{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-ink-faint">
        <span>Card {current + 1} of {queue.length}</span>
        <div className="flex gap-0.5">
          {queue.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-4 rounded-full transition-colors ${
                i <= current ? 'bg-brand' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
