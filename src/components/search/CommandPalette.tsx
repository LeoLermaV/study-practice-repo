'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import type { TopicMeta } from '@/lib/content/types'
import { BookOpen, BookText, Code2, Cpu, Users } from 'lucide-react'

const categoryIcons: Record<string, React.ReactNode> = {
  'system-design': <BookOpen className="h-4 w-4" />,
  dsa: <Code2 className="h-4 w-4" />,
  'cs-fundamentals': <Cpu className="h-4 w-4" />,
  behavioral: <Users className="h-4 w-4" />,
  ddia: <BookText className="h-4 w-4" />,
}

const categoryNames: Record<string, string> = {
  'system-design': 'System Design',
  dsa: 'DS&A',
  'cs-fundamentals': 'CS Fundamentals',
  behavioral: 'Behavioral',
  ddia: 'DDIA',
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [topics, setTopics] = useState<TopicMeta[]>([])
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => {
        if (data?.documents) setTopics(data.documents as TopicMeta[])
      })
  }, [])

  const grouped = topics.reduce<Record<string, TopicMeta[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search 432 topics..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(grouped).map(([cat, catTopics]) => (
          <CommandGroup key={cat} heading={categoryNames[cat] ?? cat}>
            {catTopics.map((topic) => (
              <CommandItem
                key={topic.slug}
                value={`${topic.title} ${topic.tags.join(' ')}`}
                onSelect={() => {
                  setOpen(false)
                  router.push(`/${topic.category}/${topic.slug}`)
                }}
              >
                <span className="text-[#999999] shrink-0">{categoryIcons[topic.category] ?? null}</span>
                <span className="flex-1 truncate">{topic.title}</span>
                <span className="text-xs text-[#666] shrink-0">{topic.estimatedReadingTime}m</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
