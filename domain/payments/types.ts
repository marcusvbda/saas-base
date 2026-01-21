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
	[key: string]: any; // Para permitir configurações específicas de cada provider
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
	clientSecret?: string; // Para confirmação de pagamento (Stripe)
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	customerId: string;
	paymentMethodId?: string;
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

export interface Subscription {
	id: number;
	user_id: string;
	provider: PaymentProvider;
	provider_subscription_id: string;
	provider_customer_id: string;
	plan_id: string;
	status: SubscriptionStatus;
	current_period_start: Date;
	current_period_end: Date;
	provider_payment_method_id?: string;
	metadata?: Record<string, any>;
	created_at: Date;
	updated_at: Date;
	canceled_at?: Date;
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
	/**
	 * Cria um cliente no provider de pagamento
	 */
	createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult>;

	/**
	 * Cria uma assinatura recorrente
	 */
	createSubscription(
		params: CreateSubscriptionParams,
	): Promise<CreateSubscriptionResult>;

	/**
	 * Cancela uma assinatura
	 */
	cancelSubscription(params: CancelSubscriptionParams): Promise<void>;

	/**
	 * Atualiza uma assinatura (mudança de plano, método de pagamento, etc.)
	 */
	updateSubscription(
		params: UpdateSubscriptionParams,
	): Promise<CreateSubscriptionResult>;

	/**
	 * Busca uma assinatura pelo ID do provider
	 */
	getSubscription(providerSubscriptionId: string): Promise<{
		status: SubscriptionStatus;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		canceledAt?: Date;
	}>;

	/**
	 * Cria ou atualiza um método de pagamento
	 */
	createPaymentMethod(
		params: CreatePaymentMethodParams,
	): Promise<PaymentMethod>;

	/**
	 * Valida webhook do provider
	 */
	validateWebhook(
		payload: string | Buffer,
		signature: string,
	): Promise<boolean>;

	/**
	 * Processa eventos de webhook
	 */
	handleWebhook(event: any): Promise<{
		type: string;
		subscriptionId?: string;
		customerId?: string;
		data: any;
	}>;
}
