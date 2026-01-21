import PaymentsRepository from './payments.repository';
import {
	PaymentProvider,
	PaymentProviderConfig,
	PaymentProviderInterface,
	CreateSubscriptionParams,
	CreateSubscriptionResult,
	CancelSubscriptionParams,
	UpdateSubscriptionParams,
	CreateCustomerParams,
	CreateCustomerResult,
	CreatePaymentMethodParams,
	PaymentMethod,
	Subscription,
} from './types';
import { StripePaymentProvider } from './providers/stripe.provider';

export default class PaymentsService {
	constructor(
		private repository: PaymentsRepository = new PaymentsRepository(),
	) {
		//
	}

	private createProvider(
		config: PaymentProviderConfig,
	): PaymentProviderInterface {
		switch (config.provider) {
			case 'stripe':
				return new StripePaymentProvider(config);
			default:
				throw new Error(`Unknown payment provider: ${config.provider}`);
		}
	}

	async createCustomer(
		config: PaymentProviderConfig,
		params: CreateCustomerParams,
	): Promise<CreateCustomerResult> {
		const provider = this.createProvider(config);
		return await provider.createCustomer(params);
	}

	async createSubscription(
		config: PaymentProviderConfig,
		params: CreateSubscriptionParams,
	): Promise<CreateSubscriptionResult & { id: number }> {
		const provider = this.createProvider(config);

		let customerId = params.customerId;
		if (!customerId) {
			if (!params.metadata?.email) {
				throw new Error(
					'Email is required to create customer. Pass it in metadata.email or provide customerId',
				);
			}
			const customer = await provider.createCustomer({
				userId: params.userId,
				email: params.metadata.email,
				name: params.metadata.name,
				metadata: params.metadata,
			});
			customerId = customer.customerId;
		}

		const subscriptionResult = await provider.createSubscription({
			...params,
			customerId,
		});

		const dbResult = await this.repository.createSubscription({
			user_id: params.userId,
			provider: config.provider,
			provider_subscription_id: subscriptionResult.providerSubscriptionId,
			provider_customer_id: customerId,
			plan_id: params.planId,
			status: subscriptionResult.status,
			current_period_start: subscriptionResult.currentPeriodStart,
			current_period_end: subscriptionResult.currentPeriodEnd,
			provider_payment_method_id: subscriptionResult.paymentMethodId,
			metadata: params.metadata,
		});

		return {
			...subscriptionResult,
			id: (dbResult as any).insertId,
		};
	}

	async cancelSubscription(
		config: PaymentProviderConfig,
		params: CancelSubscriptionParams,
	): Promise<void> {
		const subscription = await this.repository.findSubscriptionById(
			parseInt(params.subscriptionId),
		);

		if (!subscription) {
			throw new Error('Subscription not found');
		}

		const provider = this.createProvider(config);
		await provider.cancelSubscription({
			subscriptionId: subscription.provider_subscription_id,
			immediately: params.immediately,
		});

		await this.repository.updateSubscription(subscription.id, {
			status: 'canceled',
			canceled_at: params.immediately ? new Date() : null,
		});
	}

	async updateSubscription(
		config: PaymentProviderConfig,
		params: UpdateSubscriptionParams,
	): Promise<CreateSubscriptionResult> {
		const subscription = await this.repository.findSubscriptionById(
			parseInt(params.subscriptionId),
		);

		if (!subscription) {
			throw new Error('Subscription not found');
		}

		const provider = this.createProvider(config);
		const updatedSubscription = await provider.updateSubscription({
			subscriptionId: subscription.provider_subscription_id,
			planId: params.planId,
			paymentMethodId: params.paymentMethodId,
			metadata: params.metadata,
		});

		await this.repository.updateSubscription(subscription.id, {
			status: updatedSubscription.status,
			current_period_start: updatedSubscription.currentPeriodStart,
			current_period_end: updatedSubscription.currentPeriodEnd,
			provider_payment_method_id: updatedSubscription.paymentMethodId,
			plan_id: params.planId || subscription.plan_id,
			metadata: params.metadata,
		});

		return updatedSubscription;
	}

	async getSubscriptionById(id: number): Promise<Subscription | null> {
		return await this.repository.findSubscriptionById(id);
	}

	async getSubscriptionByProviderId(
		provider: PaymentProvider,
		providerSubscriptionId: string,
	): Promise<Subscription | null> {
		return await this.repository.findSubscriptionByProviderId(
			provider,
			providerSubscriptionId,
		);
	}

	async getActiveSubscriptionByUserId(
		userId: string,
	): Promise<Subscription | null> {
		return await this.repository.findActiveSubscriptionByUserId(userId);
	}

	async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
		return await this.repository.findSubscriptionsByUserId(userId);
	}

	async syncSubscriptionStatus(
		config: PaymentProviderConfig,
		subscriptionId: number,
	): Promise<Subscription> {
		const subscription =
			await this.repository.findSubscriptionById(subscriptionId);

		if (!subscription) {
			throw new Error('Subscription not found');
		}

		const provider = this.createProvider(config);
		const providerSubscription = await provider.getSubscription(
			subscription.provider_subscription_id,
		);

		// Atualizar no banco de dados
		await this.repository.updateSubscription(subscription.id, {
			status: providerSubscription.status,
			current_period_start: providerSubscription.currentPeriodStart,
			current_period_end: providerSubscription.currentPeriodEnd,
			canceled_at: providerSubscription.canceledAt,
		});

		const updated = await this.repository.findSubscriptionById(subscriptionId);
		if (!updated) {
			throw new Error('Subscription not found after update');
		}

		return updated;
	}

	async createPaymentMethod(
		config: PaymentProviderConfig,
		params: CreatePaymentMethodParams,
	): Promise<PaymentMethod> {
		const provider = this.createProvider(config);
		return await provider.createPaymentMethod(params);
	}

	async validateWebhook(
		config: PaymentProviderConfig,
		payload: string | Buffer,
		signature: string,
	): Promise<boolean> {
		const provider = this.createProvider(config);
		return await provider.validateWebhook(payload, signature);
	}

	async handleWebhook(
		config: PaymentProviderConfig,
		event: any,
	): Promise<{ type: string; subscription?: Subscription }> {
		const provider = this.createProvider(config);
		const webhookResult = await provider.handleWebhook(event);

		let subscription: Subscription | null = null;

		if (webhookResult.subscriptionId) {
			subscription = await this.repository.findSubscriptionByProviderId(
				config.provider,
				webhookResult.subscriptionId,
			);

			if (subscription) {
				const providerSubscription = await provider.getSubscription(
					webhookResult.subscriptionId,
				);

				await this.repository.updateSubscription(subscription.id, {
					status: providerSubscription.status,
					current_period_start: providerSubscription.currentPeriodStart,
					current_period_end: providerSubscription.currentPeriodEnd,
					canceled_at: providerSubscription.canceledAt,
				});

				subscription = await this.repository.findSubscriptionById(
					subscription.id,
				);
			}
		}

		return {
			type: webhookResult.type,
			subscription: subscription || undefined,
		};
	}
}
