import UserService from '@/domain/users/users.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const body = await request.json();
			const { password } = body;

			if (!password) {
				return NextResponse.json(
					{ error: { message: 'Password is required' } },
					{ status: 400 },
				);
			}
			const userService = new UserService();
			await userService.updatePassword(session.user.id, password);

			return NextResponse.json({ data: { success: true } }, { status: 200 });
		} catch (error: any) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 400 },
			);
		}
	});
}
