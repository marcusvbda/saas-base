import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/domain/user/user.service';

export async function POST(request: NextRequest) {
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
