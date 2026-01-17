import UserService from '@/domain/user/user.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get('token') || '';
	if (!token) {
		return NextResponse.json(
			{ error: { message: 'Token is required' } },
			{ status: 400 },
		);
	}
	const userService = new UserService();
	await userService.verifyEmailByToken(token);
	return NextResponse.redirect(new URL('/sign-in', request.url));
}
