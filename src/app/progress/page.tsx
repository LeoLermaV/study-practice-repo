'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { get } from 'idb-keyval'
import { getStudyStats, getAllProgress } from '@/lib/progress/db'
import type { StudyStats, ProgressEntry, TopicMeta, Category } from '@/lib/content/types'
import { assetPath } from '@/lib/utils'
import { categoryColor, categoryOrder, categoryShortTitles } from '@/lib/content/sections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STUDY_LOG_KEY = 'study-log'
const INITIAL_ROWS = 20

type Stage = 'read' | 'studied' | 'practiced'

const STAGES: Stage[] = ['read', 'studied', 'practiced']

const stageStyle: Record<Stage, { label: string; dot: string }> = {
  read: { label: 'Read', dot: 'bg-brand/40' },
  studied: { label: 'Studied', dot: 'bg-brand' },
  practiced: { label: 'Rated', dot: 'bg-foreground/70' },
}

const categories: Category[] = categoryOrder

interface ActivityRow {
  slug: string
  title: string
  category: Category
  stage: Stage
  lastTouched: number
}

function furthestStage(entry: ProgressEntry): Stage | null {
  if (entry.practicedAt) return 'practiced'
  if (entry.studiedAt) return 'studied'
  if (entry.readAt) return 'read'
  return null
}

function lastTouched(entry: ProgressEntry): number {
  return Math.max(entry.readAt ?? 0, entry.studiedAt ?? 0, entry.practicedAt ?? 0)
}

export default function ProgressPage() {
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [studyDates, setStudyDates] = useState<Set<string>>(new Set())
  const [allProgress, setAllProgress] = useState<ProgressEntry[]>([])
  const [topicIndex, setTopicIndex] = useState<Map<string, TopicMeta> | null>(null)
  const [filter, setFilter] = useState<Stage | 'all'>('all')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    getStudyStats().then(setStats)
    get(STUDY_LOG_KEY).then((dates: string[] | undefined) => {
      if (dates) setStudyDates(new Set(dates))
    })
    getAllProgress().then(setAllProgress)

    fetch(assetPath('/topics-graph.json'))
      .then((res) => res.json())
      .then((data: { nodes: TopicMeta[] }) => {
        setTopicIndex(new Map(data.nodes.map((n) => [n.slug, n])))
      })
      .catch(() => setTopicIndex(new Map()))
  }, [])

  const activity = useMemo<ActivityRow[]>(() => {
    if (!topicIndex) return []
    const rows: ActivityRow[] = []
    for (const entry of allProgress) {
      const stage = furthestStage(entry)
      const meta = topicIndex.get(entry.slug)
      // Content can be re-ingested out from under stored progress.
      if (!stage || !meta) continue
      rows.push({
        slug: entry.slug,
        title: meta.title,
        category: meta.category,
        stage,
        lastTouched: lastTouched(entry),
      })
    }
    return rows.sort((a, b) => b.lastTouched - a.lastTouched)
  }, [allProgress, topicIndex])

  const filtered = useMemo(
    () => (filter === 'all' ? activity : activity.filter((r) => r.stage === filter)),
    [activity, filter]
  )

  const byCategory = useMemo(() => {
    const acc = new Map<Category, { read: number; studied: number; practiced: number; total: number }>()
    for (const cat of categories) acc.set(cat, { read: 0, studied: 0, practiced: 0, total: 0 })
    if (!topicIndex) return acc

    for (const meta of topicIndex.values()) {
      const d = acc.get(meta.category)
      if (d) d.total++
    }
    for (const entry of allProgress) {
      const meta = topicIndex.get(entry.slug)
      if (!meta) continue
      const d = acc.get(meta.category)
      if (!d) continue
      if (entry.readAt) d.read++
      if (entry.studiedAt) d.studied++
      if (entry.practicedAt) d.practiced++
    }
    return acc
  }, [allProgress, topicIndex])

  if (!stats) return <div className="mx-auto max-w-3xl"><p className="text-muted-foreground">Loading…</p></div>

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

  const heatmapCells: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const key = d.toDateString()
    heatmapCells.push({ date: key, count: studyDates.has(key) ? 1 : 0 })
  }

  const dayNames = ['Mon', '', 'Wed', '', 'Fri', '', '']
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_ROWS)

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <h1 className="mb-6 text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Progress</h1>

      <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-xl border border-border bg-card p-5 md:grid-cols-4">
        <StatCard label="day streak" value={stats.currentStreak} />
        <StatCard label="read" value={stats.totalRead} />
        <StatCard label="in review" value={stats.totalStudied} />
        <StatCard label="due today" value={stats.topicsDueForReview} />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-[15px] font-semibold">Recent activity</CardTitle>
          <div className="flex items-center gap-1">
            <FilterChip label="All" active={filter === 'all'} onClick={() => { setFilter('all'); setExpanded(false) }} />
            {STAGES.map((s) => (
              <FilterChip
                key={s}
                label={stageStyle[s].label}
                active={filter === s}
                onClick={() => { setFilter(s); setExpanded(false) }}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {!topicIndex ? (
            <p className="text-sm text-muted-foreground">Loading topics...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {activity.length === 0
                ? 'Nothing studied yet. Open a topic and press Mark as studied at the end of the page.'
                : `No topics marked ${stageStyle[filter as Stage].label.toLowerCase()}.`}
            </p>
          ) : (
            <>
              <div className="space-y-1">
                {visible.map((row) => (
                  <Link
                    key={row.slug}
                    href={`/${row.category}/${row.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors duration-200"
                  >
                    <span className="font-medium truncate">{row.title}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${stageStyle[row.stage].dot}`} />
                        {stageStyle[row.stage].label}
                      </span>
                      <span className="text-xs text-ink-faint tabular-nums w-14 text-right">
                        {formatTimeAgo(row.lastTouched)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              {filtered.length > INITIAL_ROWS && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 ml-auto block text-xs text-brand hover:opacity-80 transition-opacity"
                >
                  {expanded ? 'Show less' : `Show all ${filtered.length} →`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Study activity, last 12 months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 pt-2">
              {dayNames.map((d, i) => (
                <span key={i} className="text-[10px] text-ink-faint h-3 leading-3">{d}</span>
              ))}
            </div>
            <div className="flex gap-0.5 flex-wrap">
              {heatmapCells.map((cell, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    cell.count > 0 ? 'bg-brand/60' : 'bg-secondary'
                  }`}
                  title={cell.date}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-faint">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-secondary" />
            <div className="w-3 h-3 rounded-sm bg-brand/30" />
            <div className="w-3 h-3 rounded-sm bg-brand/60" />
            <div className="w-3 h-3 rounded-sm bg-brand" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">By category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat) => {
            const d = byCategory.get(cat)
            if (!d || d.total === 0) return null
            const studiedPct = Math.round((d.studied / d.total) * 100)
            const readPct = Math.round((d.read / d.total) * 100)
            return (
              <div key={cat}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor(cat) }} aria-hidden />
                    {categoryShortTitles[cat]}
                  </span>
                  <span className="font-mono text-xs text-ink-faint tabular-nums">{d.studied}/{d.total} studied</span>
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="bg-brand transition-all" style={{ width: `${studiedPct}%` }} />
                  <div className="bg-brand/35 transition-all" style={{ width: `${Math.max(0, readPct - studiedPct)}%` }} />
                </div>
                <div className="mt-1 flex gap-3 text-[11px] text-ink-faint">
                  <span>Read {d.read}</span>
                  <span>Studied {d.studied}</span>
                  {d.practiced > 0 && <span>Rated {d.practiced}</span>}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Due in the next 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {dueForecast.map(({ day, count }) => {
              const label = day === 0 ? 'Today' : day === 1 ? 'Tom.' : day >= 6 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] : `${day}d`
              return (
                <div key={day} className="flex flex-col items-center gap-1 flex-1">
                  <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">{count}</span>
                  <div className={`w-full h-16 rounded-md ${count > 0 ? 'bg-secondary' : 'bg-card'} flex items-end`}>
                    {count > 0 && (
                      <div
                        className="w-full bg-brand/40 rounded-md transition-all"
                        style={{ height: `${Math.min(100, count * 25)}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-ink-faint">{label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs transition-colors duration-200 ${
        active ? 'bg-secondary text-foreground' : 'text-ink-faint hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
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
