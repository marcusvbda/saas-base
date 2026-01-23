import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
	return requireServerAuth(async ({ session }) => {
		const gateway = await getGateway();
		const items = [
			{
				price: await getOrCreatePrice(
					gateway,
					'Product test ABC',
					14,
					'BRL',
					'one_time',
				),
				quantity: 1,
			},
		];
		const checkoutSession = await createCheckout(
			'payment',
			items,
			session,
			gateway,
		);
		return NextResponse.json({ clientSecret: checkoutSession.client_secret });
	});
}

const getGateway = async () => {
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	return stripe;
};

const createCheckout = async (
	mode: 'subscription' | 'payment',
	items: { price: string; quantity: number }[],
	session: { user: { id: string; email: string } },
	gateway: Stripe,
) => {
	const stripeSession = await gateway.checkout.sessions.create({
		ui_mode: 'embedded',
		line_items: items,
		metadata: {
			user_id: session.user.id,
			email: session.user.email,
		},
		return_url: process.env.STRIPE_WEBHOOK_SECRET!,
		mode,
	});
	return stripeSession;
};

const findProductByName = async (gateway: Stripe, name: string) => {
	const existingProducts = await gateway.products.search({
		query: `name:'${name}' AND active:'true'`,
		limit: 1,
	});
	return existingProducts.data.length > 0 ? existingProducts.data[0].id : null;
};

const createProduct = async (gateway: Stripe, name: string) => {
	const product = await gateway.products.create({
		name,
		active: true,
	});
	return product.id;
};

const findProductPrice = async (
	productId: string,
	gateway: Stripe,
	amount: number,
	currency: string,
	interval: string,
) => {
	const amountInCents = amount * 100;
	const normalizedCurrency = currency.toLowerCase();
	let allPrices: Stripe.Price[] = [];
	let hasMore = true;
	let page: string | undefined = undefined;

	while (hasMore) {
		const searchParams: Stripe.PriceSearchParams = {
			query: `product:'${productId}' AND active:'true'`,
			limit: 100,
		};
		if (page) {
			(searchParams as any).page = page;
		}

		const existingPrices = await gateway.prices.search(searchParams);
		allPrices = allPrices.concat(existingPrices.data);
		hasMore = existingPrices.has_more;
		page = existingPrices.next_page as string | undefined;
	}

	const matchingPrice = allPrices.find((price) => {
		if (
			price.unit_amount !== amountInCents ||
			price.currency !== normalizedCurrency
		) {
			return false;
		}
		return (
			price.type === interval ||
			(price?.recurring?.interval === interval && price?.type === 'recurring')
		);
	});

	return matchingPrice ? matchingPrice.id : null;
};

const createPrice = async (
	productId: string,
	gateway: Stripe,
	amount: number,
	currency: string,
	interval: string,
) => {
	const payload: any = {
		product: productId,
		unit_amount: amount * 100,
		currency: currency.toLowerCase(),
		active: true,
	};
	if (interval !== 'one_time') {
		payload.recurring = { interval };
	}
	const price = await gateway.prices.create(payload);
	return price.id;
};

const getOrCreatePrice = async (
	gateway: Stripe,
	name: string,
	amount: number,
	currency: string,
	interval: string,
) => {
	let productId = await findProductByName(gateway, name);
	if (!productId) {
		productId = await createProduct(gateway, name);
	}
	let priceId = await findProductPrice(
		productId,
		gateway,
		amount,
		currency,
		interval,
	);
	if (!priceId) {
		priceId = await createPrice(productId, gateway, amount, currency, interval);
	}

	return priceId;
};
