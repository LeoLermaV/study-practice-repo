'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStudyStats, getAllProgress } from '@/lib/progress/db'
import type { StudyStats, TopicMeta, Category } from '@/lib/content/types'
import { buildDailyQueue, type QueueItem } from '@/lib/progress/queue'
import { autoPull } from '@/lib/progress/sync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, BookText, Code2, Cpu, Users, ArrowRight, TrendingUp, Flame } from 'lucide-react'

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">FAANG Study</h1>
        <p className="text-[#999999] mt-2 text-[15px]">Interview preparation platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Read" value={stats?.totalRead ?? 0} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Streak" value={`${stats?.currentStreak ?? 0}d`} />
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Studied" value={stats?.totalStudied ?? 0} />
        <StatCard icon={<ArrowRight className="h-4 w-4" />} label="Due" value={stats?.topicsDueForReview ?? 0} />
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 tracking-tight">Today&apos;s Queue</h2>
        <div className="grid gap-2">
          {queue.length === 0 && (
            <p className="text-sm text-[#999999]">Nothing due. Start a new topic!</p>
          )}
          {queue.map((item) => (
            <Link key={item.topic.slug} href={`/${item.topic.category}/${item.topic.slug}`}>
              <Card className="transition-colors duration-200 hover:bg-[#1c1c1c] hover:-translate-y-0.5">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={item.topic.category} />
                    <div>
                      <p className="font-medium text-sm">{item.topic.title}</p>
                      <p className="text-xs text-[#999999] capitalize">{item.reason}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs rounded-full">{item.topic.difficulty}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/system-design">
          <Card className="spotlight-violet hover-lift border-0 relative overflow-hidden group cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <BookOpen className="h-5 w-5" />
                System Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80">
                Architecture patterns, distributed systems, databases, networking
              </p>
            </CardContent>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5 pointer-events-none" />
          </Card>
        </Link>
        <Link href="/ddia">
          <Card className="hover-lift group cursor-pointer transition-colors duration-200 hover:bg-[#1c1c1c]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookText className="h-5 w-5" />
                DDIA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#999999]">
                Book study — Designing Data-Intensive Applications, 12 chapters
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dsa">
          <Card className="spotlight-magenta hover-lift border-0 relative overflow-hidden group cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Code2 className="h-5 w-5" />
                DS&A
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80">
                Data structures, algorithms, LeetCode patterns, NeetCode 150
              </p>
            </CardContent>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5 pointer-events-none" />
          </Card>
        </Link>
        <Link href="/cs-fundamentals">
          <Card className="hover-lift group cursor-pointer transition-colors duration-200 hover:bg-[#1c1c1c]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cpu className="h-5 w-5" />
                CS Fundamentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#999999]">
                Networking, operating systems, databases, concurrency
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/behavioral">
          <Card className="hover-lift group cursor-pointer transition-colors duration-200 hover:bg-[#1c1c1c]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Behavioral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#999999]">
                STAR method, common questions, resume, negotiation
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="hover-lift">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1c1c1c] text-[#0099ff]">
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-[#999999]">{label}</p>
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
  return <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1c1c1c] text-[#0099ff]">{icons[category ?? 'dsa']}</div>
}
