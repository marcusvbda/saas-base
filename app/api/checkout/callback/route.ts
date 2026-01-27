import PaymentsService from '@/domain/payments/payments.service';
import { NextRequest, NextResponse } from 'next/server';

function redirectToSettings(
	success: boolean,
	message?: string,
): NextResponse {
	const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
	const url = new URL(`${baseUrl}/settings`);
	url.searchParams.set('section', 'plan');
	if (message) {
		url.searchParams.set(
			'message',
			encodeURIComponent(
				JSON.stringify({
					type: success ? 'success' : 'error',
					message,
				}),
			),
		);
	}
	return NextResponse.redirect(url.toString());
}

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
			return redirectToSettings(
				false,
				'Checkout session not found. If you completed payment, your plan will update shortly.',
			);
		}

		const stripeSession =
			await paymentsService.retrieveSessionCheckout(sessionId);
		const paymentStatus = String(stripeSession.payment_status ?? '');

		if (paymentStatus !== 'paid') {
			await paymentsService.updateCheckoutSessionStatus(
				sessionId,
				paymentStatus || 'pending',
			);
			return redirectToSettings(
				false,
				'Payment not completed. Please try again or contact support.',
			);
		}

		await paymentsService.updateCheckoutSessionStatus(sessionId, 'paid');
		return paymentsService.processResultSessionCheckout(
			stripeSession,
			session,
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Unknown error';
		return redirectToSettings(false, msg);
	}
}
