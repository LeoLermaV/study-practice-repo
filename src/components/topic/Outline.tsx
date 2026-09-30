'use client'

import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { OutlineItem } from '@/lib/content/outline'
import { cn } from '@/lib/utils'

/** Outlines shorter than this are not worth showing. */
export const MIN_OUTLINE = 3

function OutlineLinks({ items, active }: { items: OutlineItem[]; active?: string | null }) {
  return (
    <ol className="space-y-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? 'location' : undefined}
            className={cn(
              'block rounded-md py-1 text-[13px] leading-snug transition-colors',
              item.depth === 3 ? 'pl-5' : 'pl-2',
              active === item.id ? 'font-medium text-brand' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

/** Collapsible outline above the article, for screens without the side rail. */
export function OutlineDisclosure({ items }: { items: OutlineItem[] }) {
  if (items.length < MIN_OUTLINE) return null
  const sections = items.filter((i) => i.depth === 2).length || items.length
  return (
    <details className="group mb-8 rounded-lg border border-border xl:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 text-ink-faint transition-transform group-open:rotate-90" aria-hidden />
        On this page
        <span className="ml-auto font-normal text-ink-faint">{sections} sections</span>
      </summary>
      <div className="border-t border-border px-1.5 py-2">
        <OutlineLinks items={items} />
      </div>
    </details>
  )
}

/**
 * Sticky outline in the right margin on wide screens, highlighting the
 * section being read. Place inside a `relative` article.
 */
export function OutlineRail({ items }: { items: OutlineItem[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (items.length < MIN_OUTLINE) return
    let frame = 0
    const update = () => {
      frame = 0
      // The last heading that has scrolled past the top bar is the current section.
      let current: string | null = null
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 140) current = item.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  if (items.length < MIN_OUTLINE) return null
  return (
    <aside aria-label="On this page" className="absolute left-full top-0 ml-10 hidden h-full w-52 xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-6">
        <p className="mb-2 pl-2 text-xs font-medium text-ink-faint">On this page</p>
        <OutlineLinks items={items} active={active} />
      </div>
    </aside>
  )
}
