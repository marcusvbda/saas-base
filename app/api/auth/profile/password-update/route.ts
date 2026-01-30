import UserService from '@/domain/users/users.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { domainErrorToNextResponse } from '@/lib/domain-error-to-http';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
	password: z.string().min(1, 'Password is required'),
});

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const body = await request.json();
			const parsed = bodySchema.safeParse(body);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: { message: 'Invalid payload' } },
					{ status: 400 },
				);
			}
			const { password } = parsed.data;
			const userService = new UserService();
			await userService.updatePassword(session.user.id, password);

			return NextResponse.json({ data: { success: true } }, { status: 200 });
		} catch (error) {
			return domainErrorToNextResponse(error);
		}
	});
}
