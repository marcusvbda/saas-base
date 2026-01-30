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

	private readonly columns =
		'`id`, `session_id`, `resource_id`, `resource_type`, `status`, `created_at`, `updated_at`';

	async findCheckoutSession(sessionId: string) {
		return await this.findOne(
			`SELECT ${this.columns} FROM \`checkout_sessions\` WHERE \`session_id\` = :session_id`,
			{ session_id: sessionId },
		);
	}

	async updateCheckoutSession(sessionId: string, status: string) {
		return await this.execute(
			'UPDATE `checkout_sessions` SET `status` = :status, `updated_at` = CURRENT_TIMESTAMP WHERE `session_id` = :session_id',
			{ session_id: sessionId, status },
		);
	}

	async findCheckoutSessionBySubscriptionId(subscriptionId: string) {
		return await this.findOne(
			`SELECT ${this.columns} FROM \`checkout_sessions\` WHERE \`resource_id\` LIKE :subscription_id AND \`resource_type\` = :resource_type`,
			{
				subscription_id: `%|${subscriptionId}%`,
				resource_type: 'plan_subscription',
			},
		);
	}

	async findCheckoutSessionByUserIdAndType(userId: string, resourceType: string) {
		return await this.findOne(
			`SELECT ${this.columns} FROM \`checkout_sessions\` WHERE \`resource_id\` LIKE :userId AND \`resource_type\` = :resource_type ORDER BY \`created_at\` DESC LIMIT 1`,
			{ userId: `${userId}%`, resource_type: resourceType },
		);
	}
}
