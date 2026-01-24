import { NextResponse } from 'next/server';
import StripeGateway from './gateways/stripe';
import PaymentsRepository from './payments.repository';
import UserService from '../users/users.service';

export default class PaymentsService {
	private gateway: StripeGateway;
	private userService: UserService;
	constructor(
		private repository: PaymentsRepository = new PaymentsRepository(),
	) {
		this.gateway = new StripeGateway();
		this.userService = new UserService();
	}

	async createSessionCheckout(metadata: any = {}) {
		const items = [
			{
				price: await this.gateway.getOrCreatePrice(
					'Product test ABC',
					14,
					'BRL',
					'month',
				),
				quantity: 1,
			},
		];
		console.log(4444, 'subscription');
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

	async findCheckoutSessionBySessionId(sessionId: string) {
		return await this.repository.findCheckoutSession(sessionId);
	}

	async retrieveSessionCheckout(sessionId: string) {
		const session = await this.gateway.retrieveSessionCheckout(sessionId);
		return session;
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
