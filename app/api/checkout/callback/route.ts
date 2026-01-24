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
