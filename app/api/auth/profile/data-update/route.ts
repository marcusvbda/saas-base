import UserService from '@/domain/users/users.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const body = await request.json();
			const { name } = body;
			if (!name) {
				return NextResponse.json(
					{ error: { message: 'Name is required' } },
					{ status: 400 },
				);
			}

			const userService = new UserService();
			await userService.updateUserData(session.user.id, { name });
			return NextResponse.json({ data: { success: true } }, { status: 200 });
		} catch (error: any) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 400 },
			);
		}
	});
}
