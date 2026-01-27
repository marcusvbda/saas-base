import UserService from '@/domain/users/users.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextResponse } from 'next/server';
import PaymentsService from '@/domain/payments/payments.service';

export async function DELETE() {
	return requireServerAuth(async ({ session }) => {
		const userService = new UserService();
		const result = await userService.cancelSubscription(session.user.id, true);
		if (!result) {
			return NextResponse.json(
				{ error: 'No active subscription to cancel' },
				{ status: 400 },
			);
		}
		return NextResponse.json({
			message: 'Subscription will cancel at period end',
			cancelAtPeriodEnd: result.cancelAtPeriodEnd,
			currentPeriodEnd: result.currentPeriodEnd?.toISOString() ?? null,
		});
	});
}

export async function PATCH(request: Request) {
	return requireServerAuth(async ({ session }) => {
		const body = (await request.json()) as {
			plan?: string;
			currency?: 'BRL' | 'USD';
			reactivate?: boolean;
		};
		const { plan, currency, reactivate } = body;

		if (reactivate === true) {
			const userService = new UserService();
			const ok = await userService.reactivateSubscription(session.user.id);
			if (!ok) {
				return NextResponse.json(
					{ error: 'No subscription to reactivate or not set to cancel at period end' },
					{ status: 400 },
				);
			}
			return NextResponse.json({
				message: 'Subscription reactivated',
			});
		}

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
