import { NextResponse } from 'next/server';
import StripeGateway from './gateways/stripe';
import PaymentsRepository from './payments.repository';
import UserService from '../users/users.service';
import { DEFAULT_PLAN, PLANS } from '@/constants/plans';

export default class PaymentsService {
	private gateway: StripeGateway;
	private userService: UserService;
	constructor(
		private repository: PaymentsRepository = new PaymentsRepository(),
	) {
		this.gateway = new StripeGateway();
		this.userService = new UserService();
	}

	async prepareItems(metadata: any, currency: 'BRL' | 'USD') {
		const { resource_type, resource_id } = metadata;
		const resources: any = {
			plan_subscription: async () => {
				const splitted = resource_id.split('|');
				const planName = splitted[1];
				const planConfig = PLANS.find((p) => p.id === planName);
				if (!planConfig) {
					throw new Error(`Unknown plan: ${planName}`);
				}
				const amount = planConfig.price[currency];
				const items = [
					{
						price: await this.gateway.getOrCreatePrice(
							planConfig.name,
							amount,
							currency,
							'month',
						),
						quantity: 1,
					},
				];
				return items;
			},
		};
		const result = await resources[resource_type]();
		return result;
	}

	async createSessionCheckout(metadata: any = {}, currency: 'BRL' | 'USD') {
		const items = await this.prepareItems(metadata, currency);
		const checkoutSession = await this.gateway.createSessionCheckout(
			'subscription',
			items,
			metadata,
		);
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
		return await this.repository.findCheckoutSessionBySubscriptionId(subscriptionId);
	}

	async findCheckoutSessionByUserIdAndType(userId: string, resourceType: string) {
		return await this.repository.findCheckoutSessionByUserIdAndType(userId, resourceType);
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
		currency: 'BRL' | 'USD',
	): Promise<void> {
		if (newPlan === DEFAULT_PLAN) {
			throw new Error('Use cancel subscription to switch to free');
		}
		const subscription = await this.userService.getSubscriptionByUserId(userId);
		if (!subscription) {
			throw new Error('No active subscription to change');
		}
		if (subscription.plan === newPlan) {
			return;
		}
		const planConfig = PLANS.find((p) => p.id === newPlan);
		if (!planConfig) {
			throw new Error(`Unknown plan: ${newPlan}`);
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
		);
		await this.userService.upsertSubscription(userId, {
			plan: newPlan,
			subscription_id: subscription.subscription_id,
		});
	}

	async processResultSessionCheckout(stripeSession: any, session: any) {
		const status: string = stripeSession.payment_status;
		const resourceType = session.resource_type;
		const resourceId = session.resource_id;
		const subscriptionId = stripeSession.subscription;

		const resources = {
			plan_subscription: async () => {
				if (status !== 'paid') {
					return NextResponse.json(
						{ error: 'Payment not paid' },
						{ status: 400 },
					);
				}
				const splitted = resourceId.split('|');
				const planName = splitted[1];
				const userId = splitted[0];
				await this.userService.upsertSubscription(userId, {
					plan: planName,
					subscription_id: subscriptionId,
				});
				const message = JSON.stringify({
					type: 'success',
					message: 'Plan updated successfully',
				});
				const encodedMessage = encodeURIComponent(message);
				const redirectUrl = new URL(
					`${process.env.NEXT_PUBLIC_APP_URL}/settings`,
				);
				redirectUrl.searchParams.set('message', encodedMessage);
				redirectUrl.searchParams.set('section', 'plan');
				return NextResponse.redirect(redirectUrl.toString());
			},
		};

		const result = await resources[resourceType]();
		return result;
	}
}
