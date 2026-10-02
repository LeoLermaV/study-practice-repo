'use client'

import { Sparkles } from 'lucide-react'
import { buildAIPrompt } from '@/lib/ai-practice/coach-prompt'

interface AIPracticeButtonProps {
  topicTitle: string
  topicContent: string
}

export function AIPracticeButton({ topicTitle, topicContent }: AIPracticeButtonProps) {
  const handleClick = () => {
    const message = buildAIPrompt(topicTitle, topicContent)

    window.open(`https://chatgpt.com/?q=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
    >
      <Sparkles className="size-3.5" />
      Practice with AI
    </button>
  )
}
