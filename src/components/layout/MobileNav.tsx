'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, BookOpen, BookText, Code2, Cpu, Users, Home, Search, BarChart3, Settings, GitGraph, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { sectionsByCategory } from '@/lib/content/sections'

const navItems: { href: string; label: string; icon: typeof Home; count?: number }[] = [
  { href: '/', label: 'Home', icon: Home },
  {
    href: '/system-design',
    label: 'System Design',
    icon: BookOpen,
    count: sectionsByCategory['system-design']?.reduce((s, sec) => s + (sec.slugPrefix ? 0 : sec.slugs.length), 0) ?? 0,
  },
  {
    href: '/ddia',
    label: 'DDIA',
    icon: BookText,
    count: sectionsByCategory['ddia']?.length ?? 0,
  },
  {
    href: '/dsa',
    label: 'DS&A',
    icon: Code2,
    count: sectionsByCategory['dsa']?.length ?? 0,
  },
  {
    href: '/cs-fundamentals',
    label: 'CS Fundamentals',
    icon: Cpu,
    count: sectionsByCategory['cs-fundamentals']?.reduce((s, sec) => s + sec.slugs.length, 0) ?? 0,
  },
  {
    href: '/behavioral',
    label: 'Behavioral',
    icon: Users,
    count: sectionsByCategory['behavioral']?.reduce((s, sec) => s + sec.slugs.length, 0) ?? 0,
  },
  { href: '/graph', label: 'Graph', icon: GitGraph },
  { href: '/flashcards', label: 'Flashcards', icon: Sparkles },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[#262626] bg-[#090909] px-4 h-14">
      <Link href="/" className="font-semibold text-lg tracking-tight">
        FAANG Study
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="inline-flex items-center justify-center rounded-full size-9 hover:bg-[#1c1c1c] transition-colors">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 pt-14 bg-[#090909] border-[#262626]">
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-[#1c1c1c] text-white'
                      : 'text-[#999999] hover:bg-[#1c1c1c] hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-xs text-[#666]">{item.count}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
