import StripeGateway from './gateways/stripe';
import PaymentsRepository from './payments.repository';

export default class PaymentsService {
	private gateway: StripeGateway;
	constructor(
		private repository: PaymentsRepository = new PaymentsRepository(),
	) {
		this.gateway = new StripeGateway();
	}

	async createSessionCheckout(metadata: any = {}) {
		const items = [
			{
				price: await this.gateway.getOrCreatePrice(
					'Product test ABC',
					14,
					'BRL',
					'one_time',
				),
				quantity: 1,
			},
		];
		const checkoutSession = await this.gateway.createSessionCheckout(
			'payment',
			items,
			metadata,
		);
		return checkoutSession;
	}

	async deleteSessionCheckout(sessionId: string) {
		// TODO: Implement delete session checkout
		return { message: `Checkout session ${sessionId} deleted` };
	}
}
