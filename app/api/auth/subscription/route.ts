import UserService from '@/domain/users/users.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';
import PaymentsService from '@/domain/payments/payments.service';

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

export async function PATCH(request: Request) {
	return requireServerAuth(async ({ session }) => {
		const body = await request.json();
		const { plan, currency } = body as {
			plan?: string;
			currency?: 'BRL' | 'USD';
		};
		if (!plan || !currency) {
			return NextResponse.json(
				{ error: 'plan and currency are required' },
				{ status: 400 },
			);
		}
		const paymentsService = new PaymentsService();
		try {
			await paymentsService.changePlan(session.user.id, plan, currency);
			return NextResponse.json(
				{ message: 'Plan updated successfully', plan },
				{ status: 200 },
			);
		} catch (e) {
			const message = (e as Error).message;
			return NextResponse.json({ error: message }, { status: 400 });
		}
	});
}
