import PaymentsService from '@/domain/payments/payments.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	return requireServerAuth(async ({ session }) => {
		const body = await request.json();
		const requestMetadata = body.metadata;
		const paymentsService = new PaymentsService();
		const checkoutSession = await paymentsService.createSessionCheckout({
			...requestMetadata,
			userId: session.user.id,
		});
		if (!checkoutSession?.client_secret) {
			throw new Error('Checkout session not found');
		}
		return NextResponse.json({ clientSecret: checkoutSession.client_secret });
	});
}

export async function DELETE(request: Request) {
	return requireServerAuth(async () => {
		const body = await request.json();
		const requestMetadata = body.metadata;
		const paymentsService = new PaymentsService();
		await paymentsService.deleteSessionCheckout(requestMetadata.sessionId);
		console.log('TODO : Revoke checkout session in backend');
		return NextResponse.json({ message: 'Checkout session deleted' });
	});
}
