'use client'

import type { Difficulty } from '@/lib/content/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock } from 'lucide-react'

const difficultyColors: Record<Difficulty, string> = {
  beginner: 'text-white bg-[#1c1c1c]',
  intermediate: 'text-white bg-[#1c1c1c]',
  advanced: 'text-white bg-[#1c1c1c]',
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
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge className={difficultyColors[difficulty]} variant="secondary">
            {difficulty}
          </Badge>
          <span className="flex items-center gap-1 text-sm text-[#999999]">
            <Clock className="h-3.5 w-3.5" />
            {estimatedReadingTime} min
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs rounded-full">
            {tag}
          </Badge>
        ))}
      </div>

      <Separator />
    </div>
  )
}
