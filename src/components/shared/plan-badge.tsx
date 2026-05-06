'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import type { Plan } from '@prisma/client'

const PLAN_CLASS: Record<Plan, string> = {
  FREE:     'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  PRO:      'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  BUSINESS: 'bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
}

interface PlanBadgeProps {
  plan: Plan
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const t = useTranslations('plans')
  const nameKey = plan.toLowerCase() as 'free' | 'pro' | 'business'

  return (
    <Badge className={PLAN_CLASS[plan]}>
      {t(`${nameKey}.name`)}
    </Badge>
  )
}
