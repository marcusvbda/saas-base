import Repository from '@/database/repository';

export default class PaymentsRepository extends Repository {
	async createCheckoutSession(params: any) {
		return await this.execute(
			'INSERT INTO `checkout_sessions` (`session_id`, `resource_id`, `resource_type`) VALUES (:session_id, :resource_id, :resource_type)',
			params,
		);
	}

	async deleteCheckoutSession(sessionId: string) {
		return await this.execute(
			'DELETE FROM `checkout_sessions` WHERE `session_id` = :session_id',
			{ session_id: sessionId },
		);
	}
}
