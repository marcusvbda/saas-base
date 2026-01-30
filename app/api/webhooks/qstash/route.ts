import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { executeServiceAction } from '@/domain';

export const POST = verifySignatureAppRouter(async (req: Request) => {
	const body = await req.json();
	const { service, action, payload } = body;
	const result = await executeServiceAction(service, action, payload);
	return NextResponse.json({ success: true, result });
});
