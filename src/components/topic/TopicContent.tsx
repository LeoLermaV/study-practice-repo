'use client'

import { cn } from '@/lib/utils'

interface TopicContentProps {
  content: React.ReactNode
  className?: string
}

export function TopicContent({ content, className }: TopicContentProps) {
  return (
    <div className={cn('topic-content max-w-none', className)}>
      {content}
    </div>
  )
}
