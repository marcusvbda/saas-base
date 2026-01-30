import { currencyFromLocale } from '@/helpers/common';
import PaymentsService, {
	ALLOWED_RESOURCE_TYPES,
} from '@/domain/payments/payments.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const { allowed, retryAfter } = checkRateLimit(
		getClientIdentifier(request),
		'api:checkout:post',
	);
	if (!allowed) {
		const res = NextResponse.json(
			{ error: { message: 'Too many requests' } },
			{ status: 429 },
		);
		if (retryAfter != null) res.headers.set('Retry-After', String(retryAfter));
		return res;
	}
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
		const paymentsService = new PaymentsService();
		const checkoutSession = await paymentsService.createSessionCheckout({
			metadata,
			currency,
			locale: locale === 'pt' || locale === 'pt-BR' ? 'pt' : 'en',
			customerEmail: session.user.email ?? undefined,
			customerMetadata: { userId: session.user.id },
		});
		if (!checkoutSession?.client_secret) {
			return NextResponse.json(
				{ error: 'Checkout session could not be created' },
				{ status: 500 },
			);
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
