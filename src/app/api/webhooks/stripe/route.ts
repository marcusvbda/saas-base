import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { db } from '@/lib/prisma'
import type { Plan } from '@prisma/client'

function priceIdToPlan(priceId: string): Plan | null {
  if (priceId === env.STRIPE_PRICE_PRO_USD) return 'PRO'
  if (priceId === env.STRIPE_PRICE_BUSINESS_USD) return 'BUSINESS'
  return null
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id
  if (!userId) return

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
  const priceId = lineItems.data[0]?.price?.id
  const plan: Plan = priceId ? (priceIdToPlan(priceId) ?? 'FREE') : 'FREE'

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id

  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const priceId = subscription.items.data[0]?.price.id
  const plan: Plan = priceId ? (priceIdToPlan(priceId) ?? 'FREE') : 'FREE'

  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: { plan },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  await db.user.update({
    where: { stripeCustomerId: customerId },
    data: { plan: 'FREE' },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        // Ignore all other events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe-webhook] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
