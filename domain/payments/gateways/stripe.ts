import Stripe from 'stripe';

export default class StripeGateway {
	private stripe: Stripe;

	constructor() {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	}

	async createSessionCheckout(
		mode: 'subscription' | 'payment',
		items: { price: string; quantity: number }[],
		metadata: any = {},
	) {
		const stripeSession = await this.stripe.checkout.sessions.create({
			ui_mode: 'embedded',
			line_items: items,
			metadata: {
				...metadata,
			},
			return_url: process.env.STRIPE_WEBHOOK_SECRET!,
			mode,
		});
		return stripeSession;
	}

	async findProductByName(name: string) {
		const existingProducts = await this.stripe.products.search({
			query: `name:'${name}' AND active:'true'`,
			limit: 1,
		});
		return existingProducts.data.length > 0
			? existingProducts.data[0].id
			: null;
	}

	async createProduct(name: string) {
		const product = await this.stripe.products.create({
			name,
			active: true,
		});
		return product.id;
	}

	async findProductPrice(
		productId: string,
		amount: number,
		currency: string,
		interval: string,
	) {
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

			const existingPrices = await this.stripe.prices.search(searchParams);
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
	}

	async createPrice(
		productId: string,
		amount: number,
		currency: string,
		interval: string,
	) {
		const payload: any = {
			product: productId,
			unit_amount: amount * 100,
			currency: currency.toLowerCase(),
			active: true,
		};
		if (interval !== 'one_time') {
			payload.recurring = { interval };
		}
		const price = await this.stripe.prices.create(payload);
		return price.id;
	}

	async getOrCreatePrice(
		name: string,
		amount: number,
		currency: string,
		interval: string,
	) {
		let productId = await this.findProductByName(name);
		if (!productId) {
			productId = await this.createProduct(name);
		}
		let priceId = await this.findProductPrice(
			productId,
			amount,
			currency,
			interval,
		);
		if (!priceId) {
			priceId = await this.createPrice(productId, amount, currency, interval);
		}

		return priceId;
	}
}
