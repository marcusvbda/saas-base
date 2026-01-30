import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/domain/users/users.service';
import {
	checkRateLimit,
	getClientIdentifier,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
	const { allowed, retryAfter } = checkRateLimit(
		getClientIdentifier(request),
		'api:auth:forgot-password',
	);
	if (!allowed) {
		const res = NextResponse.json(
			{ error: { message: 'Too many requests' } },
			{ status: 429 },
		);
		if (retryAfter != null) res.headers.set('Retry-After', String(retryAfter));
		return res;
	}
	const body = await request.json();
	const { email } = body;
	if (!email) {
		return NextResponse.json(
			{ error: { message: 'Email is required' } },
			{ status: 400 },
		);
	}
	const userService = new UserService();
	await userService.sendPasswordResetEmail(email);
	return NextResponse.json({ data: { success: true } });
}
