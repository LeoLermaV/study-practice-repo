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
      onClick={handleClick}
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand transition-[color,background-color,border-color,transform] duration-200 hover:border-brand/60 hover:bg-brand/15 active:scale-[0.97]"
    >
      <Sparkles className="h-4 w-4" />
      Practice with AI
    </button>
  )
}
