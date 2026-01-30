/**
 * Stripe webhook handler.
 *
 * Subscribe to these events in Stripe Dashboard → Developers → Webhooks:
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - charge.refunded
 */
import PaymentsService from '@/domain/payments/payments.service';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
	const { allowed, retryAfter } = checkRateLimit(
		getClientIdentifier(req),
		'api:webhooks:stripe',
	);
	if (!allowed) {
		const res = NextResponse.json(
			{ error: 'Too many requests' },
			{ status: 429 },
		);
		if (retryAfter != null) res.headers.set('Retry-After', String(retryAfter));
		return res;
	}
	let event: Stripe.Event;
	try {
		const signature = (await headers()).get('stripe-signature');
		const secret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!signature || !secret) {
			return NextResponse.json(
				{ error: 'Missing webhook signature or secret' },
				{ status: 400 },
			);
		}
		const body = await req.text();
		event = stripe.webhooks.constructEvent(body, signature, secret);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Unknown error';
		return NextResponse.json(
			{ error: `Webhook verification failed: ${msg}` },
			{ status: 400 },
		);
	}

	const paymentsService = new PaymentsService();
	const isNew = await paymentsService.ensureWebhookIdempotency(
		event.id,
		event.type,
	);
	if (!isNew) {
		return NextResponse.json({ received: true }, { status: 200 });
	}

	try {
		await paymentsService.handleWebhookEvent(event);
	} catch (err) {
		console.error('Stripe webhook handler error:', err);
		return NextResponse.json(
			{ error: 'Webhook handler failed' },
			{ status: 500 },
		);
	}

	return NextResponse.json({ received: true }, { status: 200 });
}
