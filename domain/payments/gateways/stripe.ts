import { BusinessRuleError } from '@/domain/errors';
import Stripe from 'stripe';

export type CheckoutSessionOptions = {
	mode: 'subscription' | 'payment';
	items: { price: string; quantity: number }[];
	metadata: Record<string, string>;
	customerId?: string | null;
	customerEmail?: string | null;
	locale?: 'pt' | 'en' | 'auto';
};

export default class StripeGateway {
	private stripe: Stripe;

	constructor() {
		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
	}

	async findOrCreateCustomer(
		email: string,
		metadata?: Record<string, string>,
	): Promise<string> {
		const existing = await this.stripe.customers.list({
			email,
			limit: 1,
		});
		if (existing.data.length > 0) {
			return existing.data[0].id;
		}
		const customer = await this.stripe.customers.create({
			email,
			metadata: metadata ?? {},
		});
		return customer.id;
	}

	/**
	 * Returns the currency of the customer's existing subscription/invoice if any.
	 * Stripe does not allow mixing currencies on a single customer.
	 */
	async getCustomerCurrency(customerId: string): Promise<string | null> {
		const subscriptions = await this.stripe.subscriptions.list({
			customer: customerId,
			status: 'all',
			limit: 1,
		});
		const currency =
			subscriptions.data[0]?.items?.data?.[0]?.price?.currency ?? null;
		return currency ? String(currency).toLowerCase() : null;
	}

	async createSessionCheckout(options: CheckoutSessionOptions) {
		const {
			mode,
			items,
			metadata,
			customerId,
			customerEmail,
			locale = 'auto',
		} = options;

		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
		const returnUrl = `${baseUrl}/api/checkout/callback?session_id={CHECKOUT_SESSION_ID}`;

		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			ui_mode: 'embedded',
			line_items: items,
			metadata,
			subscription_data: { metadata },
			return_url: returnUrl,
			mode,
			locale: locale === 'auto' ? undefined : locale,
		};

		if (customerId) {
			sessionParams.customer = customerId;
		} else if (customerEmail) {
			sessionParams.customer_email = customerEmail;
		}

		const stripeSession =
			await this.stripe.checkout.sessions.create(sessionParams);
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

	async retrieveSessionCheckout(sessionId: string) {
		const session = await this.stripe.checkout.sessions.retrieve(sessionId);
		return session;
	}

	async cancelSubscription(
		subscriptionId: string,
		cancelAtPeriodEnd = true,
	): Promise<void> {
		if (cancelAtPeriodEnd) {
			await this.stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: true,
			});
		} else {
			await this.stripe.subscriptions.cancel(subscriptionId);
		}
	}

	async reactivateSubscription(subscriptionId: string): Promise<void> {
		await this.stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: false,
		});
	}

	async updateSubscription(
		subscriptionId: string,
		newPriceId: string,
		metadata?: Record<string, string>,
	): Promise<void> {
		const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
		const itemId = sub.items.data[0]?.id;
		if (!itemId) {
			throw new BusinessRuleError('Subscription has no items');
		}
		const updateParams: Stripe.SubscriptionUpdateParams = {
			items: [
				{
					id: itemId,
					price: newPriceId,
				},
			],
			proration_behavior: 'create_prorations',
		};
		if (metadata) {
			updateParams.metadata = metadata;
		}
		await this.stripe.subscriptions.update(subscriptionId, updateParams);
	}

	async retrieveInvoice(invoiceId: string) {
		const invoice = await this.stripe.invoices.retrieve(invoiceId);
		return invoice;
	}

	async retrieveSubscription(
		subscriptionId: string,
	): Promise<Stripe.Subscription> {
		const subscription =
			await this.stripe.subscriptions.retrieve(subscriptionId);
		return subscription as Stripe.Subscription;
	}
}
