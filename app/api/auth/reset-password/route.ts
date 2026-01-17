import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/domain/user/user.service';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { token, newPassword } = body;

	if (!token || !newPassword) {
		return NextResponse.json(
			{ error: { message: 'Token and new password are required' } },
			{ status: 400 },
		);
	}
	const userService = new UserService();
	const success = await userService.updatePasswordByToken(token, newPassword);
	if (!success) {
		return NextResponse.json(
			{ error: { message: 'Failed to update password' } },
			{ status: 400 },
		);
	}

	return NextResponse.json({ data: { success: true } }, { status: 200 });
}
