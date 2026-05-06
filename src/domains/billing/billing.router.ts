import { router } from '@/lib/trpc/server'
import { authedProcedure } from '@/lib/trpc/middleware'
import { env } from '@/lib/env'
import { PLAN_CONFIG } from '@/domains/plans/plans.config'
import { createCheckoutSchema } from './billing.schemas'
import { createCheckoutSession, openBillingPortal } from './billing.service'

const PRICE_ID_MAP = {
  STRIPE_PRICE_PRO_USD:      env.STRIPE_PRICE_PRO_USD,
  STRIPE_PRICE_BUSINESS_USD: env.STRIPE_PRICE_BUSINESS_USD,
} as const satisfies Record<
  Exclude<(typeof PLAN_CONFIG)[keyof typeof PLAN_CONFIG]['priceIdEnvKey'], null>,
  string
>

export const billingRouter = router({
  getPlans: authedProcedure.query(() => {
    return (Object.keys(PLAN_CONFIG) as Array<keyof typeof PLAN_CONFIG>).map(
      (planKey) => {
        const config = PLAN_CONFIG[planKey]
        return {
          key: planKey,
          nameKey:        config.nameKey,
          descriptionKey: config.descriptionKey,
          price:          config.price,
          // priceIdEnvKey intentionally omitted — resolve server-side, never send env key names
          priceId: config.priceIdEnvKey !== null
            ? PRICE_ID_MAP[config.priceIdEnvKey]
            : null,
          featureKeys: [...config.featureKeys],
        }
      },
    )
  }),

  createCheckout: authedProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      return createCheckoutSession(ctx.userId, input.plan)
    }),

  openPortal: authedProcedure.mutation(async ({ ctx }) => {
    return openBillingPortal(ctx.userId)
  }),
})
