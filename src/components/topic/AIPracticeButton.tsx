'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface AIPracticeButtonProps {
  topicTitle: string
  category: string
  slug: string
}

export function AIPracticeButton({ topicTitle, category, slug }: AIPracticeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    const origin = window.location.origin
    const promptUrl = `${origin}/prompt`
    const topicUrl = `${origin}/${category}/${slug}`
    const message = `Browse ${promptUrl} to get your coaching instructions. Then browse ${topicUrl} to read the topic content. The topic is: ${topicTitle}`

    navigator.clipboard.writeText(message).catch(() => {})

    window.open('https://chatgpt.com/', '_blank')

    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand transition-[color,background-color,border-color,transform] duration-200 hover:border-brand/60 hover:bg-brand/15 active:scale-[0.97]"
    >
      <Sparkles className="h-4 w-4" />
      Practice with AI
      {copied && (
        <span className="text-xs text-foreground/60 animate-fade-in">
          Prompt copied — paste into ChatGPT
        </span>
      )}
    </button>
  )
}
