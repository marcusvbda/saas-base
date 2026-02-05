import { db } from '@/database';
import { stripeWebhookEvents } from '@/database/schema';
import { eq } from 'drizzle-orm';

export default class WebhooksRepository {
	async insertWebhookEvent(eventId: string, eventType: string) {
		await db.insert(stripeWebhookEvents).values({
			eventId,
			eventType,
		});
	}

	async findWebhookEvent(eventId: string) {
		const rows = await db
			.select()
			.from(stripeWebhookEvents)
			.where(eq(stripeWebhookEvents.eventId, eventId))
			.limit(1);
		return rows[0] ?? null;
	}
}
