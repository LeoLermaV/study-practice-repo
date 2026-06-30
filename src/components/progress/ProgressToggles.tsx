'use client'

import { useEffect, useState } from 'react'
import type { ProgressEntry, PracticeNote } from '@/lib/content/types'
import { getProgress, markRead, markStudied, markPracticed, addPracticeNote, removePracticeNote } from '@/lib/progress/db'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Eye, BookMarked, CheckCircle, Plus, X } from 'lucide-react'

interface ProgressTogglesProps {
  slug: string
}

export function ProgressToggles({ slug }: ProgressTogglesProps) {
  const [entry, setEntry] = useState<ProgressEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  useEffect(() => {
    getProgress(slug).then((e) => {
      setEntry(e ?? null)
      setLoading(false)
    })
  }, [slug])

  const handleRead = async () => {
    const result = await markRead(slug)
    setEntry(result)
  }

  const handleStudied = async () => {
    const result = await markStudied(slug)
    setEntry(result)
  }

  const handlePracticed = async () => {
    const result = await markPracticed(slug)
    setEntry(result)
    setNoteText('')
    setNoteDialogOpen(true)
  }

  const handleAddNote = () => {
    setNoteText('')
    setNoteDialogOpen(true)
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
    const result = await removePracticeNote(slug, timestamp)
    setEntry(result)
  }

  if (loading) return <div className="h-8 w-64 animate-pulse rounded bg-muted" />

  const read = !!entry?.readAt
  const studied = !!entry?.studiedAt
  const practiced = !!entry?.practicedAt
  const notes = entry?.practiceNotes ?? []

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Progress:</span>

        <ToggleButton active={read} color="text-blue-500" borderColor="border-blue-500" onClick={handleRead}>
          <Eye className="h-3.5 w-3.5" />
          Read
        </ToggleButton>

        <ToggleButton active={studied} color="text-amber-500" borderColor="border-amber-500" onClick={handleStudied}>
          <BookMarked className="h-3.5 w-3.5" />
          Studied
        </ToggleButton>

        <ToggleButton active={practiced} color="text-emerald-500" borderColor="border-emerald-500" onClick={handlePracticed}>
          <CheckCircle className="h-3.5 w-3.5" />
          Practiced
        </ToggleButton>

        {practiced && (
          <Button variant="ghost" size="icon-sm" onClick={handleAddNote} className="text-muted-foreground">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

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
            <DialogTitle>Practice Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="What did you practice? (LeetCode link, problem name, mock interview notes...)"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Skip</Button>
            <Button onClick={handleSaveNote} disabled={!noteText.trim() || noteLoading}>
              {noteLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ToggleButton({
  active,
  color,
  borderColor,
  onClick,
  children,
}: {
  active: boolean
  color: string
  borderColor: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] ${
        active
          ? `${color} border-${borderColor.replace('border-', '')} bg-[#1c1c1c]`
          : 'border-[#262626] text-[#999999] hover:border-[#3d3d3d] hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
