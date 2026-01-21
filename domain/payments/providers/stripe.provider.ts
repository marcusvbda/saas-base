import { PLANS } from '@/constants/plans';
import {
	PaymentProviderInterface,
	PaymentProviderConfig,
	CreateCustomerParams,
	CreateCustomerResult,
	CreateSubscriptionParams,
	CreateSubscriptionResult,
	CreatePaymentMethodParams,
	PaymentMethod,
	SubscriptionStatus,
} from '../payments.service';
import Stripe from 'stripe';

export interface CancelSubscriptionParams {
	subscriptionId: string;
	immediately?: boolean;
}

export interface UpdateSubscriptionParams {
	subscriptionId: string;
	planId?: string;
	paymentMethodId?: string;
	metadata?: Record<string, string>;
}

export class StripePaymentProvider implements PaymentProviderInterface {
	private stripe: Stripe;
	private config: PaymentProviderConfig;

	constructor(config: PaymentProviderConfig) {
		if (config.provider !== 'stripe') {
			throw new Error('Invalid provider. Expected "stripe"');
		}

		if (!config.apiKey) {
			throw new Error('Stripe API key is required');
		}

		this.config = config;
		this.stripe = new Stripe(this.config.apiKey, {
			apiVersion: '2025-12-15.clover',
		});
	}

	async createCustomer(
		params: CreateCustomerParams,
	): Promise<CreateCustomerResult> {
		if (params.email) {
			const existingCustomers = await this.stripe.customers.search({
				query: `email:'${params.email}'`,
				limit: 1,
			});

			if (existingCustomers.data.length > 0) {
				return {
					customerId: existingCustomers.data[0].id,
				};
			}
		}

		const customersByMetadata = await this.stripe.customers.search({
			query: `metadata['userId']:'${params.userId}'`,
			limit: 1,
		});

		if (customersByMetadata.data.length > 0) {
			return {
				customerId: customersByMetadata.data[0].id,
			};
		}

		const customer = await this.stripe.customers.create({
			email: params.email,
			name: params.name,
			metadata: {
				userId: params.userId,
				...(params.metadata || {}),
			},
		});

		return {
			customerId: customer.id,
		};
	}

	private async getOrCreateProduct(planId: string): Promise<Stripe.Product> {
		const productName = `Plan ${planId}`;

		const existingProducts = await this.stripe.products.search({
			query: `name:'${productName}' AND active:'true'`,
			limit: 1,
		});

		if (existingProducts.data.length > 0) {
			return existingProducts.data[0];
		}

		return await this.stripe.products.create({
			name: productName,
			metadata: {
				planId,
			},
		});
	}

	private async getOrCreatePrice(
		productId: string,
		planId: string,
		currency: string,
	): Promise<Stripe.Price> {
		const unitAmount = this.getPlanAmount(
			planId,
			currency.toUpperCase() as 'BRL' | 'USD',
		);

		let allPrices: Stripe.Price[] = [];
		let hasMore = true;
		let startingAfter: string | undefined = undefined;

		while (hasMore) {
			const searchParams: any = {
				query: `product:'${productId}' AND active:'true'`,
				limit: 100,
			};

			if (startingAfter) {
				searchParams.starting_after = startingAfter;
			}

			const result = await this.stripe.prices.search(searchParams);
			allPrices = allPrices.concat(result.data);
			hasMore = result.has_more;
			if (result.data.length > 0) {
				startingAfter = result.data[result.data.length - 1].id;
			}
		}

		const matchingPrice = allPrices.find(
			(price) =>
				price.currency === currency.toLowerCase() &&
				price.unit_amount === unitAmount &&
				price.recurring?.interval === 'month' &&
				price.recurring?.interval_count === 1,
		);

		if (matchingPrice) {
			return matchingPrice;
		}

		return await this.stripe.prices.create({
			currency: currency.toLowerCase(),
			product: productId,
			recurring: {
				interval: 'month',
			},
			unit_amount: unitAmount,
			metadata: {
				planId,
			},
		});
	}

	async createSubscription(
		params: CreateSubscriptionParams,
	): Promise<CreateSubscriptionResult> {
		const product = await this.getOrCreateProduct(params.planId);

		const price = await this.getOrCreatePrice(
			product.id,
			params.planId,
			params.currency,
		);

		const subscriptionData: any = {
			customer: params.customerId,
			items: [
				{
					price: price.id,
				},
			],
			metadata: {
				userId: params.userId,
				planId: params.planId,
				...(params.metadata || {}),
			},
		};

		if (params.paymentMethodId) {
			try {
				await this.stripe.paymentMethods.retrieve(params.paymentMethodId);
				subscriptionData.default_payment_method = params.paymentMethodId;
				subscriptionData.collection_method = 'charge_automatically';
			} catch (error: any) {
				if (error.code === 'resource_missing') {
					throw new Error(
						`Payment method ${params.paymentMethodId} not found. Please provide a valid payment method ID.`,
					);
				}
				throw error;
			}
		}

		const subscriptionResponse =
			await this.stripe.subscriptions.create(subscriptionData);
		const subscription = subscriptionResponse as unknown as Stripe.Subscription;

		if (subscription.latest_invoice && params.paymentMethodId) {
			const invoiceId =
				typeof subscription.latest_invoice === 'string'
					? subscription.latest_invoice
					: subscription.latest_invoice.id;

			const invoiceResponse = await this.stripe.invoices.retrieve(invoiceId);
			const invoice = invoiceResponse as unknown as Stripe.Invoice;

			if (invoice.status !== 'paid') {
				await this.stripe.invoices.pay(invoiceId, {
					payment_method: params.paymentMethodId,
				});
			}
		}

		let clientSecret: string | undefined;
		if (subscription.status === 'incomplete' && subscription.latest_invoice) {
			const latestInvoice =
				typeof subscription.latest_invoice === 'string'
					? await this.stripe.invoices.retrieve(subscription.latest_invoice, {
							expand: ['payment_intent'],
						})
					: subscription.latest_invoice;

			const invoiceWithPaymentIntent = latestInvoice as Stripe.Invoice & {
				payment_intent?: Stripe.PaymentIntent | string | null;
			};

			if (
				invoiceWithPaymentIntent.payment_intent &&
				typeof invoiceWithPaymentIntent.payment_intent !== 'string' &&
				invoiceWithPaymentIntent.payment_intent !== null
			) {
				clientSecret =
					invoiceWithPaymentIntent.payment_intent.client_secret ?? undefined;
			}
		}

		const subscriptionDataObj = subscription as any;
		let currentPeriodStartTimestamp = subscriptionDataObj.current_period_start;
		let currentPeriodEndTimestamp = subscriptionDataObj.current_period_end;

		if (
			currentPeriodStartTimestamp == null ||
			currentPeriodEndTimestamp == null ||
			typeof currentPeriodStartTimestamp !== 'number' ||
			typeof currentPeriodEndTimestamp !== 'number' ||
			isNaN(currentPeriodStartTimestamp) ||
			isNaN(currentPeriodEndTimestamp)
		) {
			const now = Math.floor(Date.now() / 1000);
			currentPeriodStartTimestamp = now;
			currentPeriodEndTimestamp = now + 30 * 24 * 60 * 60;
		}

		return {
			subscriptionId: subscription.id,
			providerSubscriptionId: subscription.id,
			status: this.mapStripeStatusToSubscriptionStatus(subscription.status),
			clientSecret,
			currentPeriodStart: new Date(currentPeriodStartTimestamp * 1000),
			currentPeriodEnd: new Date(currentPeriodEndTimestamp * 1000),
			customerId: subscription.customer as string,
			paymentMethodId: subscription.default_payment_method as
				| string
				| undefined,
		};
	}

	async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
		if (params.immediately) {
			await this.stripe.subscriptions.cancel(params.subscriptionId);
		} else {
			await this.stripe.subscriptions.update(params.subscriptionId, {
				cancel_at_period_end: true,
			});
		}
	}

	async updateSubscription(
		params: UpdateSubscriptionParams,
	): Promise<CreateSubscriptionResult> {
		const updateData: any = {};

		if (params.paymentMethodId) {
			updateData.default_payment_method = params.paymentMethodId;
		}

		if (params.metadata) {
			updateData.metadata = params.metadata;
		}

		const subscription = await this.stripe.subscriptions.retrieve(
			params.subscriptionId,
		);

		if (params.planId && params.planId !== subscription.metadata.planId) {
			const subscriptionItem = subscription.items.data[0];
			const product = await this.getOrCreateProduct(params.planId);
			const price = await this.getOrCreatePrice(
				product.id,
				params.planId,
				subscription.currency,
			);
			await this.stripe.subscriptionItems.update(subscriptionItem.id, {
				price: price.id,
			});
			updateData.metadata = {
				...subscription.metadata,
				planId: params.planId,
				...(params.metadata || {}),
			};
		}

		const updatedSubscriptionResponse = await this.stripe.subscriptions.update(
			params.subscriptionId,
			updateData,
		);
		const updatedSubscription =
			updatedSubscriptionResponse as unknown as Stripe.Subscription;

		return {
			subscriptionId: updatedSubscription.id,
			providerSubscriptionId: updatedSubscription.id,
			status: this.mapStripeStatusToSubscriptionStatus(
				updatedSubscription.status,
			),
			currentPeriodStart: new Date(
				(updatedSubscription as any).current_period_start * 1000,
			),
			currentPeriodEnd: new Date(
				(updatedSubscription as any).current_period_end * 1000,
			),
			customerId: updatedSubscription.customer as string,
			paymentMethodId: updatedSubscription.default_payment_method as
				| string
				| undefined,
		};
	}

	async createPaymentMethod(
		params: CreatePaymentMethodParams,
	): Promise<PaymentMethod> {
		await this.stripe.paymentMethods.attach(params.paymentMethodId, {
			customer: params.customerId,
		});

		if (params.setAsDefault) {
			await this.stripe.customers.update(params.customerId, {
				invoice_settings: {
					default_payment_method: params.paymentMethodId,
				},
			});
		}

		const paymentMethod = await this.stripe.paymentMethods.retrieve(
			params.paymentMethodId,
		);

		return {
			id: paymentMethod.id,
			type: paymentMethod.type === 'card' ? 'card' : 'other',
			last4: paymentMethod.card?.last4,
			brand: paymentMethod.card?.brand,
			expMonth: paymentMethod.card?.exp_month,
			expYear: paymentMethod.card?.exp_year,
			isDefault: params.setAsDefault || false,
		};
	}

	private mapStripeStatusToSubscriptionStatus(
		stripeStatus: string,
	): SubscriptionStatus {
		const statusMap: Record<string, SubscriptionStatus> = {
			active: 'active',
			canceled: 'canceled',
			past_due: 'past_due',
			trialing: 'trialing',
			incomplete: 'incomplete',
			incomplete_expired: 'incomplete_expired',
			unpaid: 'unpaid',
			paused: 'paused',
		};

		return statusMap[stripeStatus] || 'incomplete';
	}

	private getPlanAmount(planId: string, currency: 'BRL' | 'USD'): number {
		const plan = PLANS.find((p: any) => p.id === planId);
		if (plan && plan.price) {
			return (plan.price[currency] || 0) * 100;
		}
		return 0;
	}
}
