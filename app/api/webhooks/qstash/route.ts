import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { executeServiceAction } from '@/domain';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export const POST = verifySignatureAppRouter(async (req: Request) => {
	const { allowed, retryAfter } = checkRateLimit(
		getClientIdentifier(req),
		'api:webhooks:qstash',
	);
	if (!allowed) {
		const res = NextResponse.json(
			{ error: 'Too many requests' },
			{ status: 429 },
		);
		if (retryAfter != null) res.headers.set('Retry-After', String(retryAfter));
		return res;
	}
	const body = await req.json();
	const { service, action, payload } = body;
	const result = await executeServiceAction(service, action, payload);
	return NextResponse.json({ success: true, result });
});
