'use client'

import { useEffect, useState } from 'react'
import type { ProgressEntry } from '@/lib/content/types'
import { getProgress, markStudied, removeFromRotation, rateReview, addPracticeNote, removePracticeNote } from '@/lib/progress/db'
import { isInRotation } from '@/lib/progress/queue'
import type { Rating } from '@/lib/progress/scheduler'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { BookMarked, Plus, Undo2, X } from 'lucide-react'

const DAY_MS = 86_400_000

const RATINGS: { rating: Rating; label: string; className: string }[] = [
  { rating: 'again', label: 'Forgot', className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  { rating: 'hard', label: 'Shaky', className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' },
  { rating: 'good', label: 'Solid', className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
  { rating: 'easy', label: 'Easy', className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
]

function dueLabel(nextReviewDue: number, now: number): string {
  const days = Math.round((nextReviewDue - now) / DAY_MS)
  if (days <= 0) return 'Due for review — how well did you remember it?'
  if (days === 1) return 'In review · due tomorrow'
  return `In review · due in ${days} days`
}

interface ProgressTogglesProps {
  slug: string
}

export function ProgressToggles({ slug }: ProgressTogglesProps) {
  const [entry, setEntry] = useState<ProgressEntry | null>(null)
  const [now, setNow] = useState(0)
  const [loading, setLoading] = useState(true)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  useEffect(() => {
    getProgress(slug).then((e) => {
      setEntry(e ?? null)
      setNow(Date.now())
      setLoading(false)
    })
  }, [slug])

  // `now` is captured once on load; the returned entry carries the new due date,
  // so the label stays correct without re-reading the clock during a handler.
  const handleAddToReview = async () => {
    setEntry(await markStudied(slug))
  }

  const handleRate = async (rating: Rating) => {
    setEntry(await rateReview(slug, rating))
  }

  const handleRemove = async () => {
    setEntry(await removeFromRotation(slug))
  }

  const handleSaveNote = async () => {
    const text = noteText.trim()
    if (!text) return
    setNoteLoading(true)
    const result = await addPracticeNote(slug, text)
    setEntry(result)
    setNoteText('')
    setNoteDialogOpen(false)
    setNoteLoading(false)
  }

  const handleDeleteNote = async (timestamp: number) => {
    setEntry(await removePracticeNote(slug, timestamp))
  }

  if (loading) return <div className="h-9 w-64 animate-pulse rounded bg-muted" />

  const inRotation = isInRotation(entry ?? undefined)
  const notes = entry?.practiceNotes ?? []

  return (
    <div>
      {!inRotation ? (
        <button
          onClick={handleAddToReview}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-xs font-medium text-brand transition-[color,background-color,border-color,transform] duration-200 hover:border-brand/60 hover:bg-brand/15 active:scale-[0.97]"
        >
          <BookMarked className="h-3.5 w-3.5" />
          Add to review
        </button>
      ) : (
        <div>
          <p className="mb-2 text-xs text-ink-faint">{dueLabel(entry!.nextReviewDue, now)}</p>
          <div className="flex flex-wrap items-center gap-2">
            {RATINGS.map(({ rating, label, className }) => (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                className={`inline-flex min-h-9 items-center rounded-full px-4 py-2 text-xs font-medium transition-[color,background-color,transform] duration-200 active:scale-[0.97] ${className}`}
              >
                {label}
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => { setNoteText(''); setNoteDialogOpen(true) }}
              className="text-muted-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            <button
              onClick={handleRemove}
              title="Remove this topic from the review rotation"
              className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-2 text-xs text-ink-faint transition-colors duration-200 hover:text-foreground"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-2 space-y-1">
          {notes.map((note) => (
            <div key={note.timestamp} className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs">
              <span className="flex-1 text-muted-foreground">{note.text}</span>
              <button
                onClick={() => handleDeleteNote(note.timestamp)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Anything worth remembering next time you review this..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={!noteText.trim() || noteLoading}>
              {noteLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
