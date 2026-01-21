/* eslint-disable @typescript-eslint/no-require-imports */
import {
	PaymentProviderInterface,
	PaymentProviderConfig,
	CreateCustomerParams,
	CreateCustomerResult,
	CreateSubscriptionParams,
	CreateSubscriptionResult,
	CancelSubscriptionParams,
	UpdateSubscriptionParams,
	CreatePaymentMethodParams,
	PaymentMethod,
	SubscriptionStatus,
} from '../types';
import Stripe from 'stripe';

export class StripePaymentProvider implements PaymentProviderInterface {
	private stripe: Stripe;
	private config: PaymentProviderConfig;

	constructor(config: PaymentProviderConfig) {
		if (!Stripe) {
			throw new Error(
				'Stripe package is not installed. Please install it with: npm install stripe',
			);
		}

		if (config.provider !== 'stripe') {
			throw new Error('Invalid provider. Expected "stripe"');
		}

		if (!config.apiKey) {
			throw new Error('Stripe API key is required');
		}

		this.config = config;
		this.stripe = new Stripe(config.apiKey, {
			apiVersion: '2025-12-15.clover',
		});
	}

	async createCustomer(
		params: CreateCustomerParams,
	): Promise<CreateCustomerResult> {
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

	async createSubscription(
		params: CreateSubscriptionParams,
	): Promise<CreateSubscriptionResult> {
		const subscriptionData: any = {
			customer: params.customerId,
			items: [
				{
					price_data: {
						currency: params.currency.toLowerCase(),
						product_data: {
							name: `Plan ${params.planId}`,
						},
						recurring: {
							interval: 'month',
						},
						unit_amount: this.getPlanAmount(params.planId, params.currency),
					} as any, // Type assertion necessário porque product_data pode não estar no tipo PriceData
				},
			],
			metadata: {
				userId: params.userId,
				planId: params.planId,
				...(params.metadata || {}),
			},
		};

		if (params.paymentMethodId) {
			subscriptionData.default_payment_method = params.paymentMethodId;
		}

		const subscriptionResponse =
			await this.stripe.subscriptions.create(subscriptionData);
		const subscription = subscriptionResponse as unknown as Stripe.Subscription;

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

		return {
			subscriptionId: subscription.id,
			providerSubscriptionId: subscription.id,
			status: this.mapStripeStatusToSubscriptionStatus(subscription.status),
			clientSecret,
			currentPeriodStart: new Date(
				(subscription as any).current_period_start * 1000,
			),
			currentPeriodEnd: new Date(
				(subscription as any).current_period_end * 1000,
			),
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
			// Criar um novo price com product primeiro
			const price = await this.stripe.prices.create({
				currency: subscription.currency,
				product_data: {
					name: `Plan ${params.planId}`,
				},
				recurring: {
					interval: 'month',
				},
				unit_amount: this.getPlanAmount(
					params.planId,
					subscription.currency.toUpperCase() as 'BRL' | 'USD',
				),
			});
			// Atualizar o subscription item com o novo price_id
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

	async getSubscription(providerSubscriptionId: string): Promise<{
		status: SubscriptionStatus;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		canceledAt?: Date;
	}> {
		const subscriptionResponse = await this.stripe.subscriptions.retrieve(
			providerSubscriptionId,
		);
		const subscription = subscriptionResponse as unknown as Stripe.Subscription;

		return {
			status: this.mapStripeStatusToSubscriptionStatus(subscription.status),
			currentPeriodStart: new Date(
				(subscription as any).current_period_start * 1000,
			),
			currentPeriodEnd: new Date(
				(subscription as any).current_period_end * 1000,
			),
			canceledAt: (subscription as any).canceled_at
				? new Date((subscription as any).canceled_at * 1000)
				: undefined,
		};
	}

	async createPaymentMethod(
		params: CreatePaymentMethodParams,
	): Promise<PaymentMethod> {
		// No Stripe, o payment method já é criado no frontend
		// Aqui apenas anexamos ao customer
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

	async validateWebhook(
		payload: string | Buffer,
		signature: string,
	): Promise<boolean> {
		if (!this.config.webhookSecret) {
			throw new Error('Webhook secret is required for webhook validation');
		}

		try {
			this.stripe.webhooks.constructEvent(
				payload,
				signature,
				this.config.webhookSecret,
			);
			return true;
		} catch (error) {
			return false;
		}
	}

	async handleWebhook(event: any): Promise<{
		type: string;
		subscriptionId?: string;
		customerId?: string;
		data: any;
	}> {
		const eventType = event.type;
		const data = event.data.object;

		let subscriptionId: string | undefined;
		let customerId: string | undefined;

		if (data.subscription) {
			subscriptionId = data.subscription;
		} else if (data.id && eventType.includes('subscription')) {
			subscriptionId = data.id;
		}

		if (data.customer) {
			customerId = data.customer;
		}

		return {
			type: eventType,
			subscriptionId,
			customerId,
			data,
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
		// Valores em centavos (Stripe usa centavos)
		// Busca dos planos definidos nas constantes
		try {
			const { PLANS } = require('@/constants/plans');
			const plan = PLANS.find((p: any) => p.id === planId);
			if (plan && plan.price) {
				return (plan.price[currency] || 0) * 100; // Converter para centavos
			}
		} catch (error) {
			// Se não conseguir importar, usa valores padrão
		}

		// Fallback para valores padrão
		const planPrices: Record<string, Record<'BRL' | 'USD', number>> = {
			free: { BRL: 0, USD: 0 },
			basic: { BRL: 2900, USD: 1000 }, // R$ 29.00 ou $10.00
			pro: { BRL: 7900, USD: 2500 }, // R$ 79.00 ou $25.00
		};

		return planPrices[planId]?.[currency] || 0;
	}
}
