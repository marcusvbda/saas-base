'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Link, usePathname } from '@/i18n/navigation'

const SETTINGS_NAV = [
  { href: '/settings/profile', labelKey: 'nav.profile' },
  { href: '/settings/billing', labelKey: 'nav.billing' },
] as const

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const pathname = usePathname()

  return (
    <div className="flex gap-8">
      <nav className="w-48 shrink-0 space-y-1">
        {SETTINGS_NAV.map(({ href, labelKey }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
