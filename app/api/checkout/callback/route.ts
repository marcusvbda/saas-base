import PaymentsService from '@/domain/payments/payments.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const sessionId = searchParams.get('session_id');
		if (!sessionId) {
			return NextResponse.json(
				{ error: 'Session ID is required' },
				{ status: 400 },
			);
		}
		const paymentsService = new PaymentsService();
		const session =
			await paymentsService.findCheckoutSessionBySessionId(sessionId);
		if (!session) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}
		const stripeSession =
			await paymentsService.retrieveSessionCheckout(sessionId);

		const status: string = stripeSession.payment_status;
		if (status === 'paid') {
			await paymentsService.updateCheckoutSessionStatus(sessionId, 'paid');
		}

		return await paymentsService.processResultSessionCheckout(
			stripeSession,
			session,
		);
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}

export const PAID_EVENT = 'invoice.paid';
export const FAILED_EVENT = 'invoice.payment_failed';
export const REFUNDED_EVENT = 'refund.created';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const allowedEvents = [PAID_EVENT, FAILED_EVENT, REFUNDED_EVENT];

		const isEvent = body?.object === 'event';
		const eventType: string = body?.type || '';
		const isAllowedEvent = allowedEvents.includes(eventType);
		if (!isEvent || !isAllowedEvent) {
			return NextResponse.json(
				{ message: 'Webhook not allowed' },
				{ status: 400 },
			);
		}
		const paymentsService = new PaymentsService();

		if (eventType.startsWith('invoice.')) {
			const invoice: any = await paymentsService.retrieveInvoice(
				body?.data?.object?.id,
			);

			const subscriptionIdFromInvoice =
				invoice?.parent?.subscription_details?.subscription;

			if (subscriptionIdFromInvoice) {
				const subscription = await paymentsService.retrieveSubscription(
					subscriptionIdFromInvoice,
				);

				if (subscription) {
					if (eventType === PAID_EVENT) {
						const metadata = subscription?.metadata || {};
						const resourceId = metadata.resource_id;
						if (resourceId) {
							await paymentsService.processResultInvoice(
								resourceId,
								subscriptionIdFromInvoice,
							);
						}
					}
					if (eventType === REFUNDED_EVENT) {
						console.log('refunded', subscription);
					}
				}
			}
		}

		if (eventType.startsWith('refund.')) {
			console.log('refund');
		}

		return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}
