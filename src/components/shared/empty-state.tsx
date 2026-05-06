'use client'

import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
  action?: {
    labelKey: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, titleKey, descriptionKey, action }: EmptyStateProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t(titleKey)}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{t(descriptionKey)}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          {t(action.labelKey)}
        </Button>
      )}
    </div>
  )
}
