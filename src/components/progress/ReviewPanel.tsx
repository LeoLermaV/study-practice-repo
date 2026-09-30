'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { ProgressEntry } from '@/lib/content/types'
import { addPracticeNote, getProgress, markStudied, rateReview, removeFromRotation, removePracticeNote } from '@/lib/progress/db'
import { onProgressChanged } from '@/lib/progress/events'
import { isInRotation } from '@/lib/progress/queue'
import { RECALL_OPTIONS, formatDueIn, formatInterval, previewIntervals, type RecallRating } from '@/lib/progress/recall'
import { isDue } from '@/lib/progress/status'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface TopicProgress {
  loaded: boolean
  entry: ProgressEntry | null
  now: number
}

/** One topic's progress, kept in step with changes made anywhere on the page. */
function useTopicProgress(slug: string): [TopicProgress, (entry: ProgressEntry) => void] {
  const [state, setState] = useState<TopicProgress>({ loaded: false, entry: null, now: 0 })

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getProgress(slug)
        .then((entry) => { if (!cancelled) setState({ loaded: true, entry: entry ?? null, now: Date.now() }) })
        .catch(() => { if (!cancelled) setState({ loaded: true, entry: null, now: Date.now() }) })
    }
    load()
    const off = onProgressChanged(load)
    return () => { cancelled = true; off() }
  }, [slug])

  return [state, (entry) => setState({ loaded: true, entry, now: Date.now() })]
}

/** Compact schedule state for the topic header. Renders nothing for new topics. */
export function ReviewStatus({ slug }: { slug: string }) {
  const [{ loaded, entry, now }] = useTopicProgress(slug)
  if (!loaded || !entry || !isInRotation(entry)) return null
  if (isDue(entry, now)) {
    return <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Due for re-reading</span>
  }
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
      In review · next {formatDueIn(entry.nextReviewDue, now)}
    </span>
  )
}

/**
 * End-of-article action. New topic: mark as studied. Due topic: rate recall,
 * which reschedules it. In rotation but not due: show when it returns.
 */
export function ReviewPanel({ slug, title }: { slug: string; title: string }) {
  const [{ loaded, entry, now }, setEntry] = useTopicProgress(slug)
  const [rateEarly, setRateEarly] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  if (!loaded) return <div className="h-[132px] animate-pulse rounded-xl bg-secondary" />

  const run = async (action: () => Promise<ProgressEntry>, message?: (e: ProgressEntry) => string) => {
    setBusy(true)
    try {
      const next = await action()
      setEntry(next)
      setConfirmation(message ? message(next) : null)
      setRateEarly(false)
    } finally {
      setBusy(false)
    }
  }

  const rate = (rating: RecallRating) =>
    run(() => rateReview(slug, rating), (e) => `Saved. ${title} comes back ${formatDueIn(e.nextReviewDue, Date.now())}.`)

  const saveNote = async () => {
    const text = noteText.trim()
    if (!text) return
    await run(() => addPracticeNote(slug, text))
    setNoteText('')
    setNoteOpen(false)
  }

  const inRotation = isInRotation(entry ?? undefined)
  const due = inRotation && isDue(entry!, now)
  const notes = entry?.practiceNotes ?? []

  return (
    <section aria-label="Review" className="rounded-xl border border-border bg-card p-5">
      {!inRotation ? (
        <>
          <h2 className="text-[15px] font-semibold">Done with this topic?</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Mark it as studied and it comes back for a quick re-read tomorrow, then at growing intervals.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => markStudied(slug), () => `Added to your re-reading schedule. First re-read tomorrow.`)}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Mark as studied
          </button>
        </>
      ) : due || rateEarly ? (
        <>
          <h2 className="text-[15px] font-semibold">How much did you still remember?</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Your answer sets when this topic comes back.</p>
          <RecallButtons entry={entry!} now={now} busy={busy} onRate={rate} />
          {rateEarly && (
            <button type="button" onClick={() => setRateEarly(false)} className="mt-3 text-[13px] text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          )}
        </>
      ) : (
        <>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Check className="size-4 text-brand" aria-hidden />
            In your re-reading schedule
          </h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {confirmation ?? `Next re-read ${formatDueIn(entry!.nextReviewDue, now)}.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
            <button type="button" onClick={() => { setConfirmation(null); setRateEarly(true) }} className="font-medium text-brand hover:underline">
              Re-read early? Rate it now
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => removeFromRotation(slug))}
              title="Take this topic out of the re-reading schedule. Its history is kept."
              className="text-muted-foreground hover:text-foreground"
            >
              Remove from review
            </button>
          </div>
        </>
      )}

      <div className="mt-5 border-t border-border pt-4">
        {notes.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {notes.map((note) => (
              <li key={note.timestamp} className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-[13px]">
                <span className="flex-1 whitespace-pre-wrap text-foreground">{note.text}</span>
                <button
                  type="button"
                  onClick={() => run(() => removePracticeNote(slug, note.timestamp))}
                  aria-label="Delete note"
                  className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => { setNoteText(''); setNoteOpen(true) }}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-3.5" />
          {notes.length > 0 ? 'Add another note' : 'Add a note for next time'}
        </button>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Anything worth remembering next time you re-read this"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={saveNote} disabled={!noteText.trim() || busy}>{busy ? 'Saving…' : 'Save note'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function RecallButtons({ entry, now, busy, onRate }: { entry: ProgressEntry; now: number; busy: boolean; onRate: (r: RecallRating) => void }) {
  const intervals = previewIntervals(entry, now)
  // Early SM-2 steps are fixed (1 day, then 6), so the answers can share a date.
  const same = new Set(Object.values(intervals)).size === 1
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {RECALL_OPTIONS.map(({ rating, label }) => (
          <button
            key={rating}
            type="button"
            disabled={busy}
            onClick={() => onRate(rating)}
            className={cn(
              'flex h-14 flex-col items-center justify-center rounded-lg border text-sm font-medium leading-tight transition-colors disabled:opacity-60',
              rating === 'easy'
                ? 'border-brand bg-brand text-brand-foreground hover:opacity-90'
                : 'border-border hover:border-border-strong hover:bg-secondary'
            )}
          >
            {label}
            <span className={cn('mt-0.5 font-mono text-[11.5px] font-normal', rating === 'easy' ? 'opacity-80' : 'text-ink-faint')}>
              {formatInterval(intervals[rating])}
            </span>
          </button>
        ))}
      </div>
      {same && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          All three bring it back in {formatInterval(intervals.good)}. Your answer still sets how quickly the gaps grow after that.
        </p>
      )}
    </>
  )
}
