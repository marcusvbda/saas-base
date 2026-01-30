import type Stripe from 'stripe';
import { BusinessRuleError, ValidationError } from '@/domain/errors';
import StripeGateway from './gateways/stripe';
import PaymentsRepository from './payments.repository';
import WebhooksRepository from './webhooks.repository';
import UserService from '../users/users.service';
import { DEFAULT_PLAN, PLANS } from '@/constants/plans';

export type ProcessCheckoutResult = {
	redirectPath: string;
};

const WEBHOOK_EVENTS = [
	'checkout.session.completed',
	'invoice.payment_succeeded',
	'invoice.payment_failed',
	'customer.subscription.updated',
	'customer.subscription.deleted',
	'charge.refunded',
] as const;

export const ALLOWED_RESOURCE_TYPES = ['plan_subscription'];

export default class PaymentsService {
	private gateway: StripeGateway;
	private userService: UserService;
	constructor(
		private repository: PaymentsRepository = new PaymentsRepository(),
		private webhooksRepo: WebhooksRepository = new WebhooksRepository(),
	) {
		this.gateway = new StripeGateway();
		this.userService = new UserService();
	}

	async prepareItems(
		metadata: Record<string, string>,
		currency: 'BRL' | 'USD',
	): Promise<{ price: string; quantity: number }[]> {
		const { resource_type, resource_id } = metadata;
		if (resource_type !== 'plan_subscription') {
			throw new ValidationError(`Unknown resource_type: ${resource_type}`);
		}
		const planName = resource_id.split('|')[1];
		const planConfig = PLANS.find((p) => p.id === planName);
		if (!planConfig) {
			throw new BusinessRuleError(`Unknown plan: ${planName}`);
		}
		const amount = planConfig.price[currency];
		const priceId = await this.gateway.getOrCreatePrice(
			planConfig.name,
			amount,
			currency,
			'month',
		);
		return [{ price: priceId, quantity: 1 }];
	}

	async createSessionCheckout(params: {
		metadata: Record<string, string>;
		currency: 'BRL' | 'USD';
		locale?: 'pt' | 'en' | 'auto';
		customerId?: string | null;
		customerEmail?: string | null;
		customerMetadata?: Record<string, string>;
	}) {
		const {
			metadata,
			currency: requestedCurrency,
			locale = 'auto',
			customerId: providedCustomerId,
			customerEmail,
			customerMetadata,
		} = params;

		let customerId = providedCustomerId ?? null;
		if (customerEmail && !customerId) {
			customerId = await this.gateway.findOrCreateCustomer(
				customerEmail,
				customerMetadata ?? {},
			);
		}

		// Stripe does not allow mixing currencies on a single customer.
		// If this customer already has a subscription (or invoice), use its currency.
		let currency = requestedCurrency;
		if (customerId) {
			const existingCurrency =
				await this.gateway.getCustomerCurrency(customerId);
			if (existingCurrency) {
				currency =
					existingCurrency === 'brl' ? 'BRL' : 'USD';
			}
		}

		const items = await this.prepareItems(metadata, currency);
		const checkoutSession = await this.gateway.createSessionCheckout({
			mode: 'subscription',
			items,
			metadata,
			customerId,
			customerEmail,
			locale: locale === 'auto' ? undefined : locale,
		});
		await this.repository.createCheckoutSession({
			...metadata,
			session_id: checkoutSession.id,
		});
		return checkoutSession;
	}

	async deleteSessionCheckout(sessionId: string) {
		await this.repository.deleteCheckoutSession(sessionId);
	}

	async updateCheckoutSessionStatus(sessionId: string, status: string) {
		await this.repository.updateCheckoutSession(sessionId, status);
	}

	async findCheckoutSessionBySubscriptionId(subscriptionId: string) {
		return await this.repository.findCheckoutSessionBySubscriptionId(
			subscriptionId,
		);
	}

	async findCheckoutSessionByUserIdAndType(
		userId: string,
		resourceType: string,
	) {
		return await this.repository.findCheckoutSessionByUserIdAndType(
			userId,
			resourceType,
		);
	}

	async findCheckoutSessionBySessionId(sessionId: string) {
		return await this.repository.findCheckoutSession(sessionId);
	}

	async retrieveSessionCheckout(sessionId: string) {
		const session = await this.gateway.retrieveSessionCheckout(sessionId);
		return session;
	}

	async changePlan(
		userId: string,
		newPlan: string,
		_requestCurrency: 'BRL' | 'USD',
	): Promise<void> {
		if (newPlan === DEFAULT_PLAN) {
			throw new BusinessRuleError(
				'Use cancel subscription to switch to free',
			);
		}
		const subscription = await this.userService.getSubscriptionByUserId(userId);
		if (!subscription) {
			throw new BusinessRuleError('No active subscription to change');
		}
		const status = (subscription as { status?: string }).status ?? 'active';
		const periodEnd = (subscription as { current_period_end?: Date | null })
			?.current_period_end;
		const hasAccess =
			status === 'active' ||
			status === 'trialing' ||
			status === 'past_due' ||
			(status === 'canceled' &&
				periodEnd != null &&
				new Date(periodEnd) > new Date());
		if (!hasAccess) {
			throw new BusinessRuleError(
				'Subscription is not active; renew to change plan',
			);
		}
		if ((subscription as { plan?: string }).plan === newPlan) {
			return;
		}

		const stripeSub = await this.gateway.retrieveSubscription(
			subscription.subscription_id,
		);
		const firstItem = (stripeSub as { items?: { data?: { price?: { currency?: string } }[] } })
			?.items?.data?.[0];
		const currencyCode = (firstItem?.price?.currency ?? 'usd').toUpperCase();
		const currency: 'BRL' | 'USD' =
			currencyCode === 'BRL' ? 'BRL' : 'USD';

		const planConfig = PLANS.find((p) => p.id === newPlan);
		if (!planConfig) {
			throw new BusinessRuleError(`Unknown plan: ${newPlan}`);
		}
		const amount = planConfig.price[currency];
		const priceId = await this.gateway.getOrCreatePrice(
			planConfig.name,
			amount,
			currency,
			'month',
		);
		await this.gateway.updateSubscription(
			subscription.subscription_id,
			priceId,
			{ resource_id: `${userId}|${newPlan}`, resource_type: 'plan_subscription' },
		);

		const updatedSub = await this.gateway.retrieveSubscription(
			subscription.subscription_id,
		);
		const start = (updatedSub as { current_period_start?: number })
			.current_period_start;
		const end = (updatedSub as { current_period_end?: number }).current_period_end;

		await this.userService.upsertSubscription(userId, {
			plan: newPlan,
			subscription_id: subscription.subscription_id,
			current_period_start:
				start != null ? new Date(start * 1000) : undefined,
			current_period_end: end != null ? new Date(end * 1000) : undefined,
		});
	}

	async processResultSessionCheckout(
		stripeSession: {
			payment_status?: string;
			subscription?: string | { id: string } | null;
			customer?: string | { id: string } | null;
		},
		session: { resource_type: string; resource_id: string },
	): Promise<ProcessCheckoutResult> {
		const status: string = String(stripeSession.payment_status ?? '');
		const resourceType = session.resource_type;
		const resourceId = session.resource_id;
		const subRef = stripeSession.subscription;
		const subscriptionId =
			typeof subRef === 'string'
				? subRef
				: (subRef && typeof subRef === 'object' && 'id' in subRef
						? subRef.id
						: null);
		const customerId =
			typeof stripeSession.customer === 'string'
				? stripeSession.customer
				: (stripeSession.customer as { id?: string } | undefined)?.id ?? null;

		if (!ALLOWED_RESOURCE_TYPES.includes(resourceType)) {
			throw new ValidationError('Unsupported resource type');
		}

		if (status !== 'paid') {
			throw new BusinessRuleError('Payment not paid');
		}

		if (!subscriptionId) {
			throw new ValidationError('No subscription in session');
		}

		const extra: {
			stripeCustomerId?: string | null;
			currentPeriodStart?: Date | null;
			currentPeriodEnd?: Date | null;
		} = { stripeCustomerId: customerId };

		try {
			const sub = await this.gateway.retrieveSubscription(subscriptionId);
			const start = (sub as { current_period_start?: number })
				.current_period_start;
			const end = (sub as { current_period_end?: number }).current_period_end;
			if (start != null && end != null) {
				extra.currentPeriodStart = new Date(start * 1000);
				extra.currentPeriodEnd = new Date(end * 1000);
			}
		} catch {
			// keep only customer id if subscription fetch fails
		}

		await this.processResultInvoice(resourceId, subscriptionId, extra);

		const message = JSON.stringify({
			type: 'success',
			message: 'Plan updated successfully',
		});
		const redirectPath = `/settings?message=${encodeURIComponent(message)}&section=plan`;
		return { redirectPath };
	}

	async processResultInvoice(
		resourceId: string,
		subscriptionId: string,
		extra?: {
			stripeCustomerId?: string | null;
			currentPeriodStart?: Date | null;
			currentPeriodEnd?: Date | null;
		},
	) {
		const [userId, planName] = resourceId.split('|');
		if (!userId || !planName) {
			throw new ValidationError('Invalid resource_id');
		}
		
		// Build update data, preserving null values (don't convert to undefined)
		const updateData: {
			plan: string;
			subscription_id: string;
			stripe_customer_id?: string | null;
			current_period_start?: Date | null;
			current_period_end?: Date | null;
		} = {
			plan: planName,
			subscription_id: subscriptionId,
		};
		
		if (extra?.stripeCustomerId !== undefined) {
			updateData.stripe_customer_id = extra.stripeCustomerId;
		}
		if (extra?.currentPeriodStart !== undefined) {
			updateData.current_period_start = extra.currentPeriodStart;
		}
		if (extra?.currentPeriodEnd !== undefined) {
			updateData.current_period_end = extra.currentPeriodEnd;
		}
		
		await this.userService.upsertSubscription(userId, updateData);
	}

	async retrieveInvoice(invoiceId: string) {
		return await this.gateway.retrieveInvoice(invoiceId);
	}

	async retrieveSubscription(subscriptionId: string) {
		return await this.gateway.retrieveSubscription(subscriptionId);
	}

	async ensureWebhookIdempotency(
		eventId: string,
		eventType: string,
	): Promise<boolean> {
		try {
			await this.webhooksRepo.insertWebhookEvent(eventId, eventType);
			return true;
		} catch (err: unknown) {
			const mysqlErr = err as { code?: string; errno?: number };
			if (mysqlErr?.code === 'ER_DUP_ENTRY' || mysqlErr?.errno === 1062) {
				return false;
			}
			throw err;
		}
	}

	async handleWebhookEvent(event: Stripe.Event): Promise<void> {
		if (
			!WEBHOOK_EVENTS.includes(event.type as (typeof WEBHOOK_EVENTS)[number])
		) {
			return;
		}

		switch (event.type) {
			case 'checkout.session.completed':
				await this.handleCheckoutSessionCompleted(
					event.data.object as Stripe.Checkout.Session,
				);
				break;
			case 'invoice.payment_succeeded':
				await this.handleInvoicePaymentSucceeded(
					event.data.object as Stripe.Invoice,
				);
				break;
			case 'invoice.payment_failed':
				await this.handleInvoicePaymentFailed(
					event.data.object as Stripe.Invoice,
				);
				break;
			case 'customer.subscription.updated':
				await this.handleSubscriptionUpdated(
					event.data.object as Stripe.Subscription,
				);
				break;
			case 'customer.subscription.deleted':
				await this.handleSubscriptionDeleted(
					event.data.object as Stripe.Subscription,
				);
				break;
			case 'charge.refunded':
				await this.handleChargeRefunded(event.data.object as Stripe.Charge);
				break;
			default:
				break;
		}
	}

	private async handleCheckoutSessionCompleted(
		session: Stripe.Checkout.Session,
	) {
		const subId =
			typeof session.subscription === 'string'
				? session.subscription
				: (session.subscription?.id ?? null);
		const metadata = (session.metadata ?? {}) as Record<string, string>;
		const resourceId = metadata.resource_id;
		const resourceType = metadata.resource_type;

		if (resourceType !== 'plan_subscription' || !resourceId || !subId) {
			return;
		}

		const customerId =
			typeof session.customer === 'string'
				? session.customer
				: (session.customer?.id ?? null);

		const extra: {
			stripeCustomerId?: string | null;
			currentPeriodStart?: Date | null;
			currentPeriodEnd?: Date | null;
		} = { stripeCustomerId: customerId };

		try {
			const sub = await this.gateway.retrieveSubscription(subId);
			const start = (sub as { current_period_start?: number })
				.current_period_start;
			const end = (sub as { current_period_end?: number }).current_period_end;
			if (start != null && end != null) {
				extra.currentPeriodStart = new Date(start * 1000);
				extra.currentPeriodEnd = new Date(end * 1000);
			}
		} catch {
			// keep only customer id
		}

		await this.processResultInvoice(resourceId, subId, extra);
	}

	private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
		const subRef = (invoice as { subscription?: string | { id?: string } })
			.subscription;
		const subId = typeof subRef === 'string' ? subRef : (subRef?.id ?? null);
		if (!subId) return;

		const sub = await this.gateway.retrieveSubscription(subId);
		const metadata = (sub?.metadata ?? {}) as Record<string, string>;
		const resourceId = metadata.resource_id;
		if (!resourceId) return;

		const customerId =
			typeof invoice.customer === 'string'
				? invoice.customer
				: (invoice.customer?.id ?? null);

		const start = (sub as { current_period_start?: number })
			.current_period_start;
		const end = (sub as { current_period_end?: number }).current_period_end;

		const extra: {
			stripeCustomerId?: string | null;
			currentPeriodStart?: Date | null;
			currentPeriodEnd?: Date | null;
		} = { stripeCustomerId: customerId };
		if (start != null && end != null) {
			extra.currentPeriodStart = new Date(start * 1000);
			extra.currentPeriodEnd = new Date(end * 1000);
		}

		await this.processResultInvoice(resourceId, subId, extra);

		const row = await this.userService.getSubscriptionBySubscriptionId(subId);
		if (row) {
			await this.userService.updateSubscriptionStatus(row.user_id, 'active');
		}
	}

	private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
		const subRef = (invoice as { subscription?: string | { id?: string } })
			.subscription;
		const subId = typeof subRef === 'string' ? subRef : (subRef?.id ?? null);
		if (!subId) return;

		const row = await this.userService.getSubscriptionBySubscriptionId(subId);
		if (row) {
			await this.userService.updateSubscriptionStatus(row.user_id, 'past_due');
		}
	}

	private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
		const subId = subscription.id;
		const metadata = (subscription.metadata ?? {}) as Record<string, string>;
		const resourceId = metadata.resource_id;
		const resourceType = metadata.resource_type;

		const statusMap: Record<string, string> = {
			active: 'active',
			past_due: 'past_due',
			unpaid: 'unpaid',
			canceled: 'canceled',
			incomplete: 'incomplete',
			incomplete_expired: 'canceled',
			trialing: 'active',
			paused: 'active',
		};
		const status = subscription.status
			? (statusMap[subscription.status] ?? 'active')
			: undefined;

		const sub = subscription as {
			current_period_start?: number;
			current_period_end?: number;
			cancel_at_period_end?: boolean;
		};

		const row = await this.userService.getSubscriptionBySubscriptionId(subId);

		if (row) {
			await this.userService.updateSubscriptionFields(row.id, {
				status,
				current_period_start:
					sub.current_period_start != null
						? new Date(sub.current_period_start * 1000)
						: undefined,
				current_period_end:
					sub.current_period_end != null
						? new Date(sub.current_period_end * 1000)
						: undefined,
				cancel_at_period_end: sub.cancel_at_period_end ?? undefined,
			});
			return;
		}

		if (resourceType !== 'plan_subscription' || !resourceId) return;

		const [userId, planName] = resourceId.split('|');
		if (!userId || !planName) return;

		await this.userService.upsertSubscription(userId, {
			plan: planName,
			subscription_id: subId,
			status: status ?? 'active',
			current_period_start:
				sub.current_period_start != null
					? new Date(sub.current_period_start * 1000)
					: undefined,
			current_period_end:
				sub.current_period_end != null
					? new Date(sub.current_period_end * 1000)
					: undefined,
			cancel_at_period_end: sub.cancel_at_period_end ?? undefined,
		});
	}

	private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
		const row = await this.userService.getSubscriptionBySubscriptionId(
			subscription.id,
		);
		if (row) {
			await this.userService.updateSubscriptionStatus(row.user_id, 'canceled');
		}
	}

	private async handleChargeRefunded(charge: Stripe.Charge) {
		const invRef = (charge as { invoice?: string | { id?: string } }).invoice;
		const invoiceId =
			typeof invRef === 'string' ? invRef : (invRef?.id ?? null);
		if (!invoiceId) return;

		const invoice = await this.gateway.retrieveInvoice(invoiceId);
		const subRef = (invoice as { subscription?: string | { id?: string } })
			.subscription;
		const subId = typeof subRef === 'string' ? subRef : (subRef?.id ?? null);
		if (!subId) return;

		const row = await this.userService.getSubscriptionBySubscriptionId(subId);
		if (!row) return;

		if (charge.refunded) {
			try {
				await this.gateway.cancelSubscription(subId, false);
			} catch (err) {
				console.error('Failed to cancel subscription after refund:', err);
			}
			await this.userService.updateSubscriptionStatus(
				(row as { user_id: string }).user_id,
				'canceled',
			);
		}
		// Partial refund: keep subscription; no status change.
	}
}
