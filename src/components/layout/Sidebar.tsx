'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  BookOpen, BookText, Code2, Cpu, Users, Home, Search, BarChart3, Settings, GitGraph,
  ChevronRight, ChevronDown, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { sectionsByCategory, sectionId, type SectionDef } from '@/lib/content/sections'

const catKeys: [string, string][] = [
  ['system-design', 'System Design'],
  ['dsa', 'DS&A'],
  ['ddia', 'DDIA'],
  ['cs-fundamentals', 'CS Fundamentals'],
  ['behavioral', 'Behavioral'],
]

const catRoute: Record<string, string> = {
  'system-design': 'system-design',
  dsa: 'dsa',
  ddia: 'ddia',
  'cs-fundamentals': 'cs-fundamentals',
  behavioral: 'behavioral',
}

function countTopics(section: SectionDef): number {
  if (section.slugPrefix) return 0
  return section.slugs.length
}

function totalCategoryTopics(cat: string): number {
  const sections = sectionsByCategory[cat]
  if (!sections) return 0
  return sections.reduce((sum, s) => sum + countTopics(s), 0)
}

export function Sidebar() {
  const pathname = usePathname()
  const [manualExpanded, setManualExpanded] = useState<string | null>(null)

  const categoryMatch = pathname.match(/^\/(system-design|dsa|ddia|cs-fundamentals|behavioral)/)
  const activeCat = categoryMatch?.[1] ?? null
  const activeRoute = activeCat ? catRoute[activeCat] : null

  function toggleExpand(cat: string) {
    if (manualExpanded === cat) {
      setManualExpanded(null)
    } else {
      setManualExpanded(cat)
    }
  }

  function isExpanded(cat: string): boolean {
    if (manualExpanded !== null) return manualExpanded === cat
    return activeCat === cat
  }

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-[#262626] bg-[#090909] pb-9">
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0099ff]/15">
            <BookOpen className="h-4 w-4 text-[#0099ff]" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">FAANG</span>
            <span className="text-xs font-medium tracking-wider text-[#666] uppercase">Study</span>
          </div>
        </Link>
      </div>

      <div className="h-px mx-5 bg-gradient-to-r from-[#0099ff]/40 via-[#6a4cf5]/20 to-transparent" />

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="flex flex-col gap-0.5">
          <NavItem href="/" label="Home" icon={Home} pathname={pathname} exact />

          {catKeys.map(([cat, label]) => {
            const active = pathname === `/${catRoute[cat]}` || pathname.startsWith(`/${catRoute[cat]}/`)
            const expanded = isExpanded(cat)
            const sections = sectionsByCategory[cat] ?? []
            const total = totalCategoryTopics(cat)

            return (
              <div key={cat}>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                    active
                      ? 'bg-[#1c1c1c] text-white'
                      : 'text-[#999999] hover:bg-[#1c1c1c] hover:text-white'
                  )}
                >
                  <CatIcon cat={cat} />
                  <Link href={`/${catRoute[cat]}`} className="flex-1 truncate">
                    {label}
                  </Link>
                  {total > 0 && (
                    <span className="text-xs text-[#555]">{total}</span>
                  )}
                  {sections.length > 0 && (
                    <button
                      onClick={(e) => { e.preventDefault(); toggleExpand(cat) }}
                      className="shrink-0 p-0.5 rounded hover:bg-[#262626] transition-colors"
                    >
                      {expanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-[#666]" />
                        : <ChevronRight className="h-3.5 w-3.5 text-[#666]" />
                      }
                    </button>
                  )}
                </div>

                {expanded && sections.length > 0 && (
                  <div className="ml-2 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-[#262626] pl-2">
                    {sections.map((section) => (
                      <Link
                        key={section.label}
                        href={`/${catRoute[cat]}?section=${sectionId(section.label)}`}
                        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-[#888] hover:text-white hover:bg-[#141414] transition-colors duration-200"
                      >
                        <span className="truncate">{section.label.replace(/^Chapter \d+ — /, '')}</span>
                        {countTopics(section) > 0 && (
                          <span className="text-[10px] text-[#555] ml-auto">{countTopics(section)}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <Separator className="my-3" />

        <nav className="flex flex-col gap-0.5">
          <NavItem href="/graph" label="Graph" icon={GitGraph} pathname={pathname} />
          <NavItem href="/flashcards" label="Flashcards" icon={Sparkles} pathname={pathname} />
          <NavItem href="/search" label="Search" icon={Search} pathname={pathname} hint="⌘K" />
          <NavItem href="/progress" label="Progress" icon={BarChart3} pathname={pathname} />
          <NavItem href="/settings" label="Settings" icon={Settings} pathname={pathname} />
        </nav>
      </div>
    </aside>
  )
}

function NavItem({
  href, label, icon: Icon, pathname, exact, hint,
}: {
  href: string
  label: string
  icon: typeof Home
  pathname: string
  exact?: boolean
  hint?: string
}) {
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-[#1c1c1c] text-white'
          : 'text-[#999999] hover:bg-[#1c1c1c] hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] text-[#555]">{hint}</span>}
    </Link>
  )
}

function CatIcon({ cat }: { cat: string }) {
  const icons: Record<string, typeof Home> = {
    'system-design': BookOpen,
    dsa: Code2,
    ddia: BookText,
    'cs-fundamentals': Cpu,
    behavioral: Users,
  }
  const Icon = icons[cat] ?? BookOpen
  return <Icon className="h-4 w-4 shrink-0" />
}
