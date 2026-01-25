import Repository from '@/database/repository';

export default class WebhooksRepository extends Repository {
	async insertWebhookEvent(eventId: string, eventType: string) {
		await this.execute(
			'INSERT INTO `stripe_webhook_events` (`event_id`, `event_type`) VALUES (:event_id, :event_type)',
			{ event_id: eventId, event_type: eventType },
		);
	}

	async findWebhookEvent(eventId: string) {
		return await this.findOne(
			'SELECT * FROM `stripe_webhook_events` WHERE `event_id` = :event_id',
			{ event_id: eventId },
		);
	}
}
