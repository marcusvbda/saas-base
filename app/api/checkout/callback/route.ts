import PaymentsService from '@/domain/payments/payments.service';
import UserService from '@/domain/users/users.service';
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

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const allowedEvents = ['invoice_payment.paid'];
		const isEvent = body?.object === 'event';
		const isAllowedEvent = allowedEvents.includes(body?.type);
		if (!isEvent || !isAllowedEvent) {
			return NextResponse.json(
				{ message: 'Webhook not allowed' },
				{ status: 400 },
			);
		}
		const paymentsService = new PaymentsService();
		const userService = new UserService();
		const invoice: any = await paymentsService.retrieveInvoice(
			body.data.object.invoice,
		);
		const subscriptionIdFromInvoice =
			invoice?.parent?.subscription_details?.subscription;
		const subscription = await paymentsService.retrieveSubscription(
			subscriptionIdFromInvoice,
		);
		const metadata = subscription?.metadata || {};

		console.log(metadata);

		return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}
