'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStudyStats, getAllProgress } from '@/lib/progress/db'
import type { StudyStats, TopicMeta, Category } from '@/lib/content/types'
import { buildDailyQueue, type QueueItem } from '@/lib/progress/queue'
import { autoPull } from '@/lib/progress/sync'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, BookText, Code2, Cpu, Users, ArrowRight, TrendingUp, Flame, ChevronRight } from 'lucide-react'

const categoryCards: {
  href: string
  title: string
  description: string
  icon: typeof BookOpen
  tint: string
  chip: string
}[] = [
  {
    href: '/system-design',
    title: 'System Design',
    description: 'Architecture patterns, distributed systems, databases, networking',
    icon: BookOpen,
    tint: 'tint-blue',
    chip: 'bg-chart-1/10 text-chart-1',
  },
  {
    href: '/ddia',
    title: 'DDIA',
    description: 'Book study — Designing Data-Intensive Applications, 12 chapters',
    icon: BookText,
    tint: 'tint-violet',
    chip: 'bg-chart-2/10 text-chart-2',
  },
  {
    href: '/dsa',
    title: 'DS&A',
    description: 'Data structures, algorithms, LeetCode patterns, NeetCode 150',
    icon: Code2,
    tint: 'tint-magenta',
    chip: 'bg-chart-3/10 text-chart-3',
  },
  {
    href: '/cs-fundamentals',
    title: 'CS Fundamentals',
    description: 'Networking, operating systems, databases, concurrency',
    icon: Cpu,
    tint: 'tint-orange',
    chip: 'bg-chart-4/10 text-chart-4',
  },
  {
    href: '/behavioral',
    title: 'Behavioral',
    description: 'STAR method, common questions, resume, negotiation',
    icon: Users,
    tint: 'tint-coral',
    chip: 'bg-chart-5/10 text-chart-5',
  },
]

export function HomeClient({ topics }: { topics: TopicMeta[] }) {
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])

  useEffect(() => {
    autoPull().then(() => {
      getStudyStats().then(setStats)
      getAllProgress().then((progress) => {
        setQueue(buildDailyQueue(topics, progress))
      })
    })
  }, [topics])

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-10">
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-[-0.02em]">FAANG Study</h1>
        <p className="text-muted-foreground mt-1.5 text-[15px]">Interview preparation platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Read" value={stats?.totalRead ?? 0} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Streak" value={`${stats?.currentStreak ?? 0}d`} />
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Studied" value={stats?.totalStudied ?? 0} />
        <StatCard icon={<ArrowRight className="h-4 w-4" />} label="Due" value={stats?.topicsDueForReview ?? 0} />
      </div>

      <div className="mb-12">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint mb-4">
          Today&apos;s Queue
        </h2>
        <div className="grid gap-2">
          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing due. Start a new topic!</p>
          )}
          {queue.map((item) => (
            <Link key={item.topic.slug} href={`/${item.topic.category}/${item.topic.slug}`}>
              <Card className="transition-colors duration-200 hover:bg-secondary/50 hover:border-border">
                <CardContent className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon category={item.topic.category} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.topic.title}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs rounded-full capitalize hidden sm:inline-flex">
                      {item.topic.difficulty}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-ink-faint" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint mb-4">
        Library
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categoryCards.map(({ href, title, description, icon: Icon, tint, chip }) => (
          <Link key={href} href={href}>
            <Card className={`${tint} hover-lift group h-full cursor-pointer hover:border-border transition-colors duration-200`}>
              <CardContent className="flex items-start gap-4 p-5">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold flex items-center gap-1.5">
                    {title}
                    <ChevronRight className="h-3.5 w-3.5 text-ink-faint opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground mt-1">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center size-9 shrink-0 rounded-lg bg-brand/10 text-brand">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[22px] leading-7 font-semibold tracking-[-0.01em] tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryIcon({ category }: { category: Category }) {
  const icons: Record<Category, React.ReactNode> = {
    'system-design': <BookOpen className="h-4 w-4" />,
    dsa: <Code2 className="h-4 w-4" />,
    'cs-fundamentals': <Cpu className="h-4 w-4" />,
    behavioral: <Users className="h-4 w-4" />,
    ddia: <BookText className="h-4 w-4" />,
  }
  return (
    <div className="flex items-center justify-center size-8 shrink-0 rounded-lg bg-brand/10 text-brand">
      {icons[category ?? 'dsa']}
    </div>
  )
}
