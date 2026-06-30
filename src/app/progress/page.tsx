'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from 'idb-keyval'
import { getStudyStats, getAllProgress } from '@/lib/progress/db'
import type { StudyStats, ProgressEntry, PracticeNote, Category } from '@/lib/content/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, BookOpen, TrendingUp, RefreshCw, Eye, BookMarked, CheckCircle } from 'lucide-react'

const STUDY_LOG_KEY = 'study-log'

function slugToCategory(slug: string): Category {
  if (slug.startsWith('ddia-')) return 'ddia'
  if (slug.startsWith('behavioral-')) return 'behavioral'
  if (slug.startsWith('hello-algo-') || slug.startsWith('cheatsheet-')) return 'dsa'
  if (['coding-interview-prep', 'interview-cheatsheet', 'interview-rubrics', 'picking-a-language',
       'study-plan', 'problem-solving-techniques', 'mock-interviews'].includes(slug)) return 'cs-fundamentals'
  if (slug.startsWith('donnemartin-') || slug.match(/^\d-d-/) || slug.match(/^[a-z]+(?:-blind75)?$/)) return 'dsa'
  return 'system-design'
}

export default function ProgressPage() {
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [recentNotes, setRecentNotes] = useState<{ slug: string; note: PracticeNote }[]>([])
  const [studyDates, setStudyDates] = useState<Set<string>>(new Set())
  const [allProgress, setAllProgress] = useState<ProgressEntry[]>([])

  useEffect(() => {
    getStudyStats().then(setStats)
    get(STUDY_LOG_KEY).then((dates: string[] | undefined) => {
      if (dates) setStudyDates(new Set(dates))
    })
    getAllProgress().then((all) => {
      setAllProgress(all)
      const notes: { slug: string; note: PracticeNote }[] = []
      for (const entry of all) {
        for (const note of entry.practiceNotes) {
          notes.push({ slug: entry.slug, note })
        }
      }
      notes.sort((a, b) => b.note.timestamp - a.note.timestamp)
      setRecentNotes(notes.slice(0, 10))
    })
  }, [])

  if (!stats) return <div className="max-w-3xl mx-auto"><p className="text-muted-foreground">Loading...</p></div>

  const totalActive = stats.totalRead + stats.totalStudied + stats.totalPracticed
  const progressPct = totalActive > 0 ? Math.round((stats.totalPracticed / totalActive) * 100) : 0

  // Due forecast: next 7 days
  const now = Date.now()
  const dueForecast: { day: number; count: number }[] = []
  for (let d = 0; d < 7; d++) {
    const dayStart = new Date()
    dayStart.setDate(dayStart.getDate() + d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 86400000)
    const count = allProgress.filter((p) =>
      p.nextReviewDue >= dayStart.getTime() && p.nextReviewDue < dayEnd.getTime()
    ).length
    dueForecast.push({ day: d, count })
  }

  // Mastery per category
  const categories: Category[] = ['system-design', 'dsa', 'ddia', 'cs-fundamentals', 'behavioral']
  const byCategory = new Map<Category, { read: number; studied: number; practiced: number; total: number }>()
  for (const cat of categories) byCategory.set(cat, { read: 0, studied: 0, practiced: 0, total: 0 })
  for (const entry of allProgress) {
    const cat = slugToCategory(entry.slug)
    const d = byCategory.get(cat)
    if (d) {
      if (entry.readAt) d.read++
      if (entry.studiedAt) d.studied++
      if (entry.practicedAt) d.practiced++
      d.total++
    }
  }

  // Heatmap: last 52 weeks
  const heatmapCells: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const key = d.toDateString()
    heatmapCells.push({ date: key, count: studyDates.has(key) ? 1 : 0 })
  }

  const dayNames = ['Mon', '', 'Wed', '', 'Fri', '', '']
  const catNames: Record<string, string> = {
    'system-design': 'System Design',
    dsa: 'DS&A',
    ddia: 'DDIA',
    'cs-fundamentals': 'CS Fundamentals',
    behavioral: 'Behavioral',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Progress</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Flame className="h-5 w-5" />} label="Current Streak" value={`${stats.currentStreak} days`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Read" value={`${stats.totalRead}`} />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Studied" value={`${stats.totalStudied}`} />
        <StatCard icon={<RefreshCw className="h-5 w-5" />} label="Due for Review" value={`${stats.topicsDueForReview}`} />
      </div>

      {/* Heatmap */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Study Activity (12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 pt-2">
              {dayNames.map((d) => (
                <span key={d} className="text-[10px] text-[#555] h-3 leading-3">{d}</span>
              ))}
            </div>
            <div className="flex gap-0.5 flex-wrap">
              {heatmapCells.map((cell, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    cell.count > 0 ? 'bg-[#0099ff]/60' : 'bg-[#1c1c1c]'
                  }`}
                  title={cell.date}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-[#555]">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-[#1c1c1c]" />
            <div className="w-3 h-3 rounded-sm bg-[#0099ff]/30" />
            <div className="w-3 h-3 rounded-sm bg-[#0099ff]/60" />
            <div className="w-3 h-3 rounded-sm bg-[#0099ff]" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Mastery per category */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Mastery by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat) => {
            const d = byCategory.get(cat)
            if (!d || d.total === 0) return null
            const practicedPct = Math.round((d.practiced / d.total) * 100)
            const studiedPct = Math.round((d.studied / d.total) * 100)
            const readPct = Math.round((d.read / d.total) * 100)
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{catNames[cat] ?? cat}</span>
                  <span className="text-xs text-[#666]">{d.practiced}/{d.total}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-[#1c1c1c]">
                  <div className="bg-[#0099ff] transition-all" style={{ width: `${readPct}%` }} />
                  <div className="bg-amber-500 transition-all" style={{ width: `${Math.max(0, studiedPct - readPct)}%` }} />
                  <div className="bg-emerald-500 transition-all" style={{ width: `${Math.max(0, practicedPct - studiedPct)}%` }} />
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-[#666]">
                  <span>Read: {d.read}</span>
                  <span>Studied: {d.studied}</span>
                  <span>Practiced: {d.practiced}</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Due forecast */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Due Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {dueForecast.map(({ day, count }) => {
              const label = day === 0 ? 'Today' : day === 1 ? 'Tom.' : day >= 6 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] : `${day}d`
              return (
                <div key={day} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-bold text-[#999999]">{count}</span>
                  <div className={`w-full h-16 rounded-md ${count > 0 ? 'bg-[#1c1c1c]' : 'bg-[#141414]'} flex items-end`}>
                    {count > 0 && (
                      <div
                        className="w-full bg-[#0099ff]/40 rounded-md transition-all"
                        style={{ height: `${Math.min(100, count * 25)}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-[#555]">{label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {stats.recentlyStudied.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Recently Studied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentlyStudied.map(({ slug, lastTouched }) => (
                <Link
                  key={slug}
                  href={`/${slugToCategory(slug)}/${slug}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[#1c1c1c] transition-colors duration-200"
                >
                  <span className="font-medium truncate">{slug.replace(/-/g, ' ')}</span>
                  <span className="text-xs text-[#666] shrink-0 ml-3">
                    {formatTimeAgo(lastTouched)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
