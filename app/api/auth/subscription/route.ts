import UserService from '@/domain/users/users.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';

export async function DELETE() {
	return requireServerAuth(async ({ session }) => {
		const userService = new UserService();
		await userService.cancelSubscription(session.user.id);
		return NextResponse.json(
			{ message: 'Subscription canceled' },
			{ status: 200 },
		);
	});
}
