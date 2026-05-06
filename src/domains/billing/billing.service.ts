import { TRPCError } from '@trpc/server'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { db } from '@/lib/prisma'

const PLAN_PRICE_IDS = {
  PRO:      env.STRIPE_PRICE_PRO_USD,
  BUSINESS: env.STRIPE_PRICE_BUSINESS_USD,
} as const satisfies Record<'PRO' | 'BUSINESS', string>

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true },
  })

  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  })

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export async function createCheckoutSession(
  userId: string,
  plan: 'PRO' | 'BUSINESS',
): Promise<{ url: string }> {
  const customerId = await getOrCreateStripeCustomer(userId)
  const priceId = PLAN_PRICE_IDS[plan]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    client_reference_id: userId,
    metadata: { userId },
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
  })

  if (!session.url) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

  return { url: session.url }
}

export async function openBillingPortal(userId: string): Promise<{ url: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'no_stripe_customer' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  return { url: session.url }
}
