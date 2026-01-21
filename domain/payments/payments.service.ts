import PaymentsRepository from './payments.repository';
import { StripePaymentProvider } from './providers/stripe.provider';

// Types and Interfaces
export type PaymentProvider = 'stripe' | 'paypal' | 'mercadopago';

export type SubscriptionStatus =
	| 'active'
	| 'canceled'
	| 'past_due'
	| 'trialing'
	| 'incomplete'
	| 'incomplete_expired'
	| 'unpaid'
	| 'paused';

export interface PaymentProviderConfig {
	provider: PaymentProvider;
	apiKey: string;
	apiSecret?: string;
	webhookSecret?: string;
	[key: string]: any;
}

export interface CreateCustomerParams {
	userId: string;
	email: string;
	name?: string;
	metadata?: Record<string, string>;
}

export interface CreateCustomerResult {
	customerId: string;
}

export interface CreateSubscriptionParams {
	userId: string;
	planId: string;
	currency: 'BRL' | 'USD';
	paymentMethodId?: string;
	customerId?: string;
	metadata?: Record<string, string>;
}

export interface CreateSubscriptionResult {
	subscriptionId: string;
	providerSubscriptionId: string;
	status: SubscriptionStatus;
	clientSecret?: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	customerId: string;
	paymentMethodId?: string;
}

export interface CreatePaymentMethodParams {
	customerId: string;
	paymentMethodId: string;
	setAsDefault?: boolean;
}

export interface PaymentMethod {
	id: string;
	type: 'card' | 'bank_account' | 'other';
	last4?: string;
	brand?: string;
	expMonth?: number;
	expYear?: number;
	isDefault: boolean;
}

export interface PaymentProviderInterface {
	createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult>;
	createSubscription(
		params: CreateSubscriptionParams,
	): Promise<CreateSubscriptionResult>;
	cancelSubscription(params: {
		subscriptionId: string;
		immediately?: boolean;
	}): Promise<void>;
	updateSubscription(params: {
		subscriptionId: string;
		planId?: string;
		paymentMethodId?: string;
		metadata?: Record<string, string>;
	}): Promise<CreateSubscriptionResult>;
	createPaymentMethod(
		params: CreatePaymentMethodParams,
	): Promise<PaymentMethod>;
}

export interface IPlan {
	planId: string;
	currency: string;
	metadata: Record<string, string>;
}

export interface ISubscribeParams {
	customerDetails: CreateCustomerParams;
	plan: IPlan;
}

export interface IStripePaymentCard {
	token: string;
}

export interface ICreateSubscription {
	paymentMethodId: string;
	customerId: string;
}

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

export default class PaymentsService {
	protected repository: PaymentsRepository;
	protected provider: PaymentProviderInterface | null = null;
	protected providerConfig: PaymentProviderConfig | null = null;

	constructor(protected selectedProvider: string = 'stripe') {
		this.repository = new PaymentsRepository();
		this.makeProvider();
	}

	makeProvider() {
		if (this.selectedProvider === 'stripe') {
			this.providerConfig = {
				provider: 'stripe' as const,
				apiKey: process.env.STRIPE_SECRET_KEY!,
				webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			};
			this.provider = new StripePaymentProvider(this.providerConfig);
			return;
		}

		throw new Error(`Unknown payment provider: ${this.selectedProvider}`);
	}

	selectProvider(provider: string) {
		this.selectedProvider = provider;
		this.makeProvider();
	}

	async subscribe({ customerDetails, plan }: ISubscribeParams) {
		if (this.selectedProvider === 'stripe') {
			const customer = await this.provider!.createCustomer(customerDetails);
			// Tokens de teste: https://stripe.com/docs/testing#cards
			// tok_visa, tok_mastercard, tok_amex, etc.
			const paymentMethod = await this.createPaymenMethod(
				{
					token: 'tok_visa',
				},
				customer.customerId,
			);

			const subscription = await this.createSubscription({
				paymentMethodId: paymentMethod?.id,
				customerId: customer.customerId,
				planId: plan.planId,
				currency: plan.currency as 'BRL' | 'USD',
				metadata: plan.metadata,
				userId: customerDetails.userId,
			});

			return {
				subscription,
				paymentMethod,
				customer,
			};
		}
	}

	async createPaymenMethod(
		paymentCard: IStripePaymentCard,
		customerId: string,
	) {
		if (this.selectedProvider === 'stripe') {
			const stripe = (this.provider as any).stripe;
			const paymentMethodCreated = await stripe.paymentMethods.create({
				type: 'card',
				card: {
					...paymentCard,
				},
			});
			const paymentMethod = await this.provider!.createPaymentMethod({
				customerId,
				paymentMethodId: paymentMethodCreated.id,
			});
			return paymentMethod;
		}
	}

	async createSubscription(params: CreateSubscriptionParams) {
		const subscriptionResult = await this.provider!.createSubscription(params);
		return subscriptionResult;
	}

	async cancelSubscription(params: CancelSubscriptionParams) {
		if (this.selectedProvider === 'stripe') {
			await this.provider!.cancelSubscription(params);
			return;
		}
		throw new Error(
			`Cancel subscription not implemented for provider: ${this.selectedProvider}`,
		);
	}

	async updateSubscription(params: UpdateSubscriptionParams) {
		if (this.selectedProvider === 'stripe') {
			const subscriptionResult =
				await this.provider!.updateSubscription(params);
			return subscriptionResult;
		}
		throw new Error(
			`Update subscription not implemented for provider: ${this.selectedProvider}`,
		);
	}
}

// usage example
// const paymentService = new PaymentsService();
// 	await paymentService.subscribe({
// 		customerDetails: {
// 			userId: session.user.id,
// 			email: session.user.email || 'user@example.com',
// 			name: session.user.name || 'User',
// 		},
// 		plan: {
// 			planId: 'basic',
// 			currency: 'BRL',
// 			metadata: {
// 				email: session.user.email || 'user@example.com',
// 				name: session.user.name || 'User',
// 			},
// 		},
// 	});
