'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MiniSearch from 'minisearch'
import type { TopicMeta, Category } from '@/lib/content/types'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search as SearchIcon, BookOpen, BookText, Code2, Cpu, Users, Clock } from 'lucide-react'

const categoryIcons: Record<Category, React.ReactNode> = {
  'system-design': <BookOpen className="h-4 w-4" />,
  'dsa': <Code2 className="h-4 w-4" />,
  'cs-fundamentals': <Cpu className="h-4 w-4" />,
  'behavioral': <Users className="h-4 w-4" />,
  'ddia': <BookText className="h-4 w-4" />,
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TopicMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => {
        if (data?.documents) {
          const miniSearch = MiniSearch.loadJSON(JSON.stringify(data), {
            fields: ['title', 'tags'],
            storeFields: ['slug', 'title', 'category', 'difficulty', 'tags'],
          })
          if (query) {
            setResults(miniSearch.search(query, { prefix: true, fuzzy: 0.2 }) as unknown as TopicMeta[])
          }
        }
        setLoading(false)
      })
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => {
        if (!data?.documents) return
        const miniSearch = MiniSearch.loadJSON(JSON.stringify(data), {
          fields: ['title', 'tags'],
          storeFields: ['slug', 'title', 'category', 'difficulty', 'tags'],
        })
        if (value) {
          setResults(miniSearch.search(value, { prefix: true, fuzzy: 0.2 }) as unknown as TopicMeta[])
        } else {
          setResults([])
        }
      })
  }, [])

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 tracking-tight">Search</h1>
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading search index...</p>}

      <div className="grid gap-2">
        {results.map((topic) => (
          <Link key={`${topic.category}-${topic.slug}`} href={`/${topic.category}/${topic.slug}`}>
            <Card className="transition-colors duration-200 hover:bg-secondary hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="text-muted-foreground">
                  {categoryIcons[topic.category as Category]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{topic.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{topic.category}</span>
                    <span>·</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full">{topic.difficulty}</Badge>
                    <span>·</span>
                    <span>{topic.estimatedReadingTime} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {query && !loading && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
        )}
      </div>
    </div>
  )
}
