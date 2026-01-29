import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

const services: Record<string, () => Promise<{ new (): any }>> = {
	IntegrationsService: async () =>
		(await import('@/domain/integrations/integrations.service')).default,
};

export const POST = verifySignatureAppRouter(async (req: Request) => {
	const body = await req.json();
	const { service, action, payload } = body;

	const serviceLoader = services[service];
	if (!serviceLoader) {
		return NextResponse.json(
			{ success: false, error: 'Service inválido' },
			{ status: 400 },
		);
	}

	const ServiceClass = await serviceLoader();
	const serviceInstance = new ServiceClass();

	if (typeof serviceInstance[action] !== 'function') {
		return NextResponse.json(
			{ success: false, error: 'Action inválida' },
			{ status: 400 },
		);
	}

	const result = await serviceInstance[action](payload);

	return NextResponse.json({ success: true, result });
});
