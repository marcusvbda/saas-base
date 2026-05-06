'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  function toggle() {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.cookie = `theme=${next}; path=/; max-age=${COOKIE_MAX_AGE}`
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
