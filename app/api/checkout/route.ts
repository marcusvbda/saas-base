import { currencyFromLocale } from '@/helpers/common';
import PaymentsService, {
	ALLOWED_RESOURCE_TYPES,
} from '@/domain/payments/payments.service';
import StripeGateway from '@/domain/payments/gateways/stripe';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	return requireServerAuth(async ({ session }) => {
		const body = (await request.json()) as {
			metadata?: { resource_type?: string; resource_id?: string };
			currency?: 'BRL' | 'USD';
			locale?: string;
		};
		const metadata = body.metadata ?? {};
		const locale = (body.locale ?? 'en').toString();
		const currency = body.currency ?? currencyFromLocale(locale);
		const resourceId = metadata.resource_id;
		if (
			!metadata.resource_type ||
			!ALLOWED_RESOURCE_TYPES.includes(metadata?.resource_type || '')
		) {
			return NextResponse.json(
				{ error: 'Unsupported resource type' },
				{ status: 400 },
			);
		}
		if (!resourceId) {
			return NextResponse.json(
				{ error: 'metadata.resource_id is required' },
				{ status: 400 },
			);
		}
		const stripeGateway = new StripeGateway();
		const customerId = await stripeGateway.findOrCreateCustomer(
			session.user.email ?? '',
			{ userId: session.user.id },
		);
		const paymentsService = new PaymentsService();
		const checkoutSession = await paymentsService.createSessionCheckout({
			metadata,
			currency,
			locale: locale === 'pt' || locale === 'pt-BR' ? 'pt' : 'en',
			customerId,
		});
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
		const body = (await request.json()) as {
			metadata?: { sessionId?: string };
		};
		const sessionId = body.metadata?.sessionId;
		if (!sessionId) {
			return NextResponse.json(
				{ error: 'metadata.sessionId is required' },
				{ status: 400 },
			);
		}
		const paymentsService = new PaymentsService();
		await paymentsService.deleteSessionCheckout(sessionId);
		return NextResponse.json({ message: 'Checkout session deleted' });
	});
}
