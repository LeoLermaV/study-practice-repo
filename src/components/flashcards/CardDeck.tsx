'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { TopicMeta, Category } from '@/lib/content/types'
import { markRead, markStudied, markPracticed, addPracticeNote } from '@/lib/progress/db'
import { buildFlashcardQueue, nextReviewDue, type FlashcardItem } from '@/lib/progress/flashcards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, ExternalLink, RotateCcw } from 'lucide-react'

const categoryNames: Record<string, string> = {
  'system-design': 'System Design',
  dsa: 'DS&A',
  ddia: 'DDIA',
  'cs-fundamentals': 'CS Fundamentals',
  behavioral: 'Behavioral',
}

interface CardDeckProps {
  topics: TopicMeta[]
  category: Category
  onBack: () => void
}

export function CardDeck({ topics, category, onBack }: CardDeckProps) {
  const [queue, setQueue] = useState<FlashcardItem[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [ratings, setRatings] = useState<string[]>([])
  const [startTime] = useState(Date.now())

  useEffect(() => {
    import('@/lib/progress/db').then(({ getAllProgress }) => {
      getAllProgress().then((progress) => {
        setQueue(buildFlashcardQueue(topics, progress))
      })
    })
  }, [topics])

  const handleRate = useCallback(async (ease: 'again' | 'hard' | 'good' | 'easy') => {
    const item = queue[current]
    if (!item) return

    const slug = item.topic.slug
    setRatings((prev) => [...prev, ease])

    if (ease === 'again') {
      await markRead(slug)
    } else if (ease === 'hard' || ease === 'good') {
      await markStudied(slug)
    } else {
      await markPracticed(slug)
    }

    if (current < queue.length - 1) {
      setCurrent((c) => c + 1)
      setFlipped(false)
    } else {
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
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const agains = ratings.filter((r) => r === 'again').length
    const hards = ratings.filter((r) => r === 'hard').length
    const goods = ratings.filter((r) => r === 'good').length
    const easys = ratings.filter((r) => r === 'easy').length

    return (
      <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Session Complete</h2>
        <p className="text-[#999999] text-sm mb-8">
          {queue.length} cards in {mins}m {secs.toString().padStart(2, '0')}s
        </p>

        <div className="flex gap-4 mb-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-red-500">{agains}</span>
            <span className="text-[10px] text-[#666] uppercase">Again</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-yellow-500">{hards}</span>
            <span className="text-[10px] text-[#666] uppercase">Hard</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-green-500">{goods}</span>
            <span className="text-[10px] text-[#666] uppercase">Good</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-emerald-500">{easys}</span>
            <span className="text-[10px] text-[#666] uppercase">Easy</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => { setCurrent(0); setFlipped(false); setShowSummary(false); setRatings([]) }}>
            <RotateCcw className="h-4 w-4" />
            Study Again
          </Button>
        </div>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <BookOpen className="h-12 w-12 text-[#333] mb-4" />
        <h2 className="text-lg font-semibold mb-1">No cards available</h2>
        <p className="text-sm text-[#999999] mb-6">Study some topics first to build your flashcard queue.</p>
        <Link href={`/${category}`}>
          <Button variant="secondary">
            Browse {categoryNames[category] ?? category}
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
            className="absolute inset-0 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h2 className="text-xl font-semibold text-center leading-snug">{item.topic.title}</h2>
            <p className="text-xs text-[#666] mt-6">Tap or press space to reveal</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.topic.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] rounded-full">{tag}</Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4 text-xs text-[#999999]">
              <span className={`capitalize ${
                item.topic.difficulty === 'beginner' ? 'text-green-500' :
                item.topic.difficulty === 'intermediate' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {item.topic.difficulty}
              </span>
              <span>{item.topic.estimatedReadingTime} min read</span>
            </div>

            <Link
              href={`/${category}/${item.topic.slug}`}
              className="inline-flex items-center gap-1 text-xs text-[#0099ff] hover:underline mb-6"
              target="_blank"
            >
              Open full topic <ExternalLink className="h-3 w-3" />
            </Link>

            <div className="mt-auto">
              <p className="text-xs text-[#666] mb-2">How well did you know this?</p>
              <div className="grid grid-cols-4 gap-2">
                {(['again', 'hard', 'good', 'easy'] as const).map((ease, i) => (
                  <button
                    key={ease}
                    onClick={(e) => { e.stopPropagation(); handleRate(ease) }}
                    className={`rounded-lg py-2 text-xs font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] ${
                      ease === 'again' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                      ease === 'hard' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' :
                      ease === 'good' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                      'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    }`}
                  >
                    {ease === 'again' ? `${i + 1} Again` :
                     ease === 'hard' ? `${i + 1} Hard` :
                     ease === 'good' ? `${i + 1} Good` :
                     `${i + 1} Easy`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-[#666]">
        <span>Card {current + 1} of {queue.length}</span>
        <div className="flex gap-0.5">
          {queue.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-4 rounded-full transition-colors ${
                i <= current ? 'bg-[#0099ff]' : 'bg-[#262626]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
