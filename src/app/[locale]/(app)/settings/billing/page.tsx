'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { PlanBadge } from '@/components/shared/plan-badge'
import { LimitIndicator } from '@/components/shared/limit-indicator'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function BillingPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()

  const { data: me } = trpc.users.me.useQuery()
  const { data: plans = [] } = trpc.billing.getPlans.useQuery()
  const { data: projects = [] } = trpc.projects.list.useQuery()

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success(t('billing.upgradeSuccess'))
    }
  }, [searchParams, t])

  const ownedCount = projects.filter((p) =>
    p.members.some((m) => m.role === 'OWNER'),
  ).length

  const checkout = trpc.billing.createCheckout.useMutation({
    onSuccess: ({ url }) => { window.location.href = url },
    onError: (err) => toast.error(err.message),
  })

  const portal = trpc.billing.openPortal.useMutation({
    onSuccess: ({ url }) => { window.location.href = url },
    onError: (err) => toast.error(err.message),
  })

  const currentPlan = me?.plan ?? 'FREE'
  const hasSubscription = currentPlan !== 'FREE'
  const maxProjects = currentPlan === 'FREE' ? 1 : currentPlan === 'PRO' ? 10 : 999

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('nav.billing')} />

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{t('billing.currentPlan')}:</span>
          {me && <PlanBadge plan={me.plan} />}
        </div>
        <LimitIndicator current={ownedCount} max={maxProjects} labelKey="limits.projects" />
        {hasSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
          >
            {portal.isPending ? t('common.loading') : t('billing.manageBilling')}
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      <h2 className="text-lg font-semibold mb-4">{t('billing.plansTitle')}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlan
          return (
            <Card key={plan.key} className={isCurrent ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{t(plan.nameKey)}</CardTitle>
                  {isCurrent && (
                    <Badge className="text-xs shrink-0">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {t('billing.currentPlanBadge')}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {t(plan.descriptionKey)}
                </CardDescription>
                <p className="text-2xl font-bold mt-1">
                  {plan.price.usd === 0 ? 'Free' : `$${plan.price.usd}/mo`}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1">
                  {plan.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-1.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      {t(fk)}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.priceId && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      checkout.mutate({ plan: plan.key as 'PRO' | 'BUSINESS' })
                    }
                    disabled={checkout.isPending}
                  >
                    {checkout.isPending ? t('common.loading') : t('billing.upgrade')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
