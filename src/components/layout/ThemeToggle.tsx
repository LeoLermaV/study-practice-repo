'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHydrated } from '@/lib/useLocalStorage'

/**
 * Flips between light and dark. The app follows the system setting until this
 * is used; Settings → Appearance returns it to System.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useHydrated()

  const dark = mounted && resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
        className
      )}
    >
      {mounted ? (dark ? <Sun className="size-4" /> : <Moon className="size-4" />) : <span className="size-4" />}
    </button>
  )
}
