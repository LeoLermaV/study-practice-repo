'use client'

import type { Difficulty } from '@/lib/content/types'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

const difficultyColors: Record<Difficulty, string> = {
  beginner: 'text-emerald-400/90 bg-emerald-400/10',
  intermediate: 'text-amber-400/90 bg-amber-400/10',
  advanced: 'text-rose-400/90 bg-rose-400/10',
}

interface TopicHeaderProps {
  title: string
  difficulty: Difficulty
  estimatedReadingTime: number
  tags: string[]
}

export function TopicHeader({ title, difficulty, estimatedReadingTime, tags }: TopicHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[26px] leading-[1.2] md:text-[32px] md:leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3.5">
          <Badge className={`capitalize rounded-full ${difficultyColors[difficulty]}`} variant="secondary">
            {difficulty}
          </Badge>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
            <Clock className="h-3.5 w-3.5 text-ink-faint" />
            {estimatedReadingTime} min read
          </span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs rounded-full border-border/70 text-muted-foreground">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
