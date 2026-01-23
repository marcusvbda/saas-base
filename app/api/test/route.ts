import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
	return requireServerAuth(async ({ session }) => {
		const gateway = await getGateway();
		const items = [
			{
				price: await getOrCreatePrice(gateway),
				quantity: 1,
			},
		];
		const checkoutSession = await createCheckout(
			'subscription',
			items,
			session,
			gateway,
		);
		//only client secret is needed
		return NextResponse.json({ clientSecret: checkoutSession.client_secret });
	});
}

const getGateway = async () => {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	return stripe;
};

const createCheckout = async (
	_mode: 'subscription' | 'payment',
	items: { price: string; quantity: number }[],
	session: { user: { id: string; email: string } },
	gateway: Stripe,
) => {
	const stripeSession = await gateway.checkout.sessions.create({
		mode: 'subscription',
		ui_mode: 'embedded',
		line_items: items,
		metadata: {
			user_id: session.user.id,
			email: session.user.email,
		},
		return_url: process.env.STRIPE_WEBHOOK_SECRET!,
	});
	return stripeSession;
};

const getOrCreatePrice = async (_gateway: Stripe) => {
	//create price if not exists
	return 'price_1Ss4DaQLCAaP1igg96XO8lS5';
};
