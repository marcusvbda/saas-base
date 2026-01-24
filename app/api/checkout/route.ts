import PaymentsService from '@/domain/payments/payments.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	return requireServerAuth(async () => {
		const body = await request.json();
		const { metadata } = body;
		const paymentsService = new PaymentsService();
		const checkoutSession =
			await paymentsService.createSessionCheckout(metadata);
		if (!checkoutSession?.client_secret) {
			throw new Error('Checkout session not found');
		}
		return NextResponse.json({
			clientSecret: checkoutSession.client_secret,
			sessionId: checkoutSession.id,
		});
	});
}

export async function DELETE(request: Request) {
	return requireServerAuth(async () => {
		const body = await request.json();
		const requestMetadata = body.metadata;
		const paymentsService = new PaymentsService();
		await paymentsService.deleteSessionCheckout(requestMetadata.sessionId);
		return NextResponse.json({ message: 'Checkout session deleted' });
	});
}
