import PaymentsService from '@/domain/payments/payments.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const sessionId = request.nextUrl.searchParams.get('session_id');
		if (!sessionId) {
			return NextResponse.json(
				{ error: 'session_id is required' },
				{ status: 400 },
			);
		}

		const paymentsService = new PaymentsService();
		const session =
			await paymentsService.findCheckoutSessionBySessionId(sessionId);

		if (!session) {
			return NextResponse.json(
				{ error: 'Checkout session not found' },
				{ status: 404 },
			);
		}

		const stripeSession =
			await paymentsService.retrieveSessionCheckout(sessionId);
		const paymentStatus = String(stripeSession.payment_status ?? '');

		if (paymentStatus === 'paid') {
			await paymentsService.updateCheckoutSessionStatus(sessionId, 'paid');
		}

		return paymentsService.processResultSessionCheckout(stripeSession, session);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Unknown error';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
