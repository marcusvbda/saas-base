'use client'

import { useTranslations } from 'next-intl'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface LimitIndicatorProps {
  current: number
  max: number
  labelKey: string
}

export function LimitIndicator({ current, max, labelKey }: LimitIndicatorProps) {
  const t = useTranslations()
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0

  const barColor =
    pct >= 100 ? 'bg-red-500' :
    pct >= 80  ? 'bg-amber-500' :
                 'bg-emerald-500'

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground">
        {t(labelKey, { current, max })}
      </p>
      <Progress
        value={pct}
        className={cn('h-2 [&>div]:transition-colors', `[&>div]:${barColor}`)}
      />
    </div>
  )
}
