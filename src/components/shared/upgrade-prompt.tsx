'use client'

import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/lib/i18n/navigation'

interface UpgradePromptProps {
  size: 'inline' | 'card'
}

export function UpgradePrompt({ size }: UpgradePromptProps) {
  const t = useTranslations('gates')

  if (size === 'inline') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950">
        <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="text-amber-700 dark:text-amber-300">{t('limitReached')}</span>
        <Link
          href="/settings/billing"
          className="ml-auto shrink-0 font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
        >
          {t('upgradeCta')}
        </Link>
      </div>
    )
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-base">{t('upgradeRequired')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('limitReached')}</p>
        <Button asChild size="sm">
          <Link href="/settings/billing">{t('upgradeCta')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
