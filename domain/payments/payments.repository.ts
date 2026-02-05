import { db } from '@/database';
import { checkoutSessions } from '@/database/schema';
import { eq, and, sql, like } from 'drizzle-orm';

export default class PaymentsRepository {
	async createCheckoutSession(params: {
		session_id: string;
		resource_id: string;
		resource_type: string;
	}) {
		const [row] = await db
			.insert(checkoutSessions)
			.values({
				sessionId: params.session_id,
				resourceId: params.resource_id,
				resourceType: params.resource_type,
			})
			.returning({ id: checkoutSessions.id });
		return { insertId: row?.id ?? 0 };
	}

	async deleteCheckoutSession(sessionId: string) {
		await db
			.delete(checkoutSessions)
			.where(eq(checkoutSessions.sessionId, sessionId));
	}

	async findCheckoutSession(sessionId: string) {
		const rows = await db
			.select()
			.from(checkoutSessions)
			.where(eq(checkoutSessions.sessionId, sessionId))
			.limit(1);
		return rows[0] ?? null;
	}

	async updateCheckoutSession(sessionId: string, status: string) {
		await db
			.update(checkoutSessions)
			.set({ status, updatedAt: new Date() })
			.where(eq(checkoutSessions.sessionId, sessionId));
	}

	async findCheckoutSessionBySubscriptionId(subscriptionId: string) {
		const rows = await db
			.select()
			.from(checkoutSessions)
			.where(
				and(
					like(checkoutSessions.resourceId, `%|${subscriptionId}%`),
					eq(checkoutSessions.resourceType, 'plan_subscription'),
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	async findCheckoutSessionByUserIdAndType(
		userId: string,
		resourceType: string,
	) {
		const rows = await db
			.select()
			.from(checkoutSessions)
			.where(
				and(
					like(checkoutSessions.resourceId, `${userId}%`),
					eq(checkoutSessions.resourceType, resourceType),
				),
			)
			.orderBy(sql`${checkoutSessions.createdAt} DESC`)
			.limit(1);
		return rows[0] ?? null;
	}
}
