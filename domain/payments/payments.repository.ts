import Repository from '@/db/repository';
import { Subscription, PaymentProvider, SubscriptionStatus } from './types';

export default class PaymentsRepository extends Repository {
	async createSubscription(data: {
		user_id: string;
		provider: PaymentProvider;
		provider_subscription_id: string;
		provider_customer_id: string;
		plan_id: string;
		status: SubscriptionStatus;
		current_period_start: Date;
		current_period_end: Date;
		provider_payment_method_id?: string;
		metadata?: Record<string, any>;
	}) {
		const result = await this.execute(
			`INSERT INTO \`subscriptions\` (
				\`user_id\`,
				\`provider\`,
				\`provider_subscription_id\`,
				\`provider_customer_id\`,
				\`plan_id\`,
				\`status\`,
				\`current_period_start\`,
				\`current_period_end\`,
				\`provider_payment_method_id\`,
				\`metadata\`
			) VALUES (
				:user_id,
				:provider,
				:provider_subscription_id,
				:provider_customer_id,
				:plan_id,
				:status,
				:current_period_start,
				:current_period_end,
				:provider_payment_method_id,
				:metadata
			)`,
			{
				user_id: data.user_id,
				provider: data.provider,
				provider_subscription_id: data.provider_subscription_id,
				provider_customer_id: data.provider_customer_id,
				plan_id: data.plan_id,
				status: data.status,
				current_period_start: data.current_period_start,
				current_period_end: data.current_period_end,
				provider_payment_method_id: data.provider_payment_method_id ?? null,
				metadata: data.metadata ? JSON.stringify(data.metadata) : null,
			},
		);

		return result;
	}

	async findSubscriptionById(id: number): Promise<Subscription | null> {
		const subscription = await this.findOne(
			'SELECT * FROM `subscriptions` WHERE `id` = :id',
			{ id },
		);

		if (!subscription) return null;

		return this.mapSubscription(subscription);
	}

	async findSubscriptionByProviderId(
		provider: PaymentProvider,
		providerSubscriptionId: string,
	): Promise<Subscription | null> {
		const subscription = await this.findOne(
			'SELECT * FROM `subscriptions` WHERE `provider` = :provider AND `provider_subscription_id` = :provider_subscription_id',
			{
				provider,
				provider_subscription_id: providerSubscriptionId,
			},
		);

		if (!subscription) return null;

		return this.mapSubscription(subscription);
	}

	async findActiveSubscriptionByUserId(
		userId: string,
	): Promise<Subscription | null> {
		const subscription = await this.findOne(
			"SELECT * FROM `subscriptions` WHERE `user_id` = :user_id AND `status` IN ('active', 'trialing') ORDER BY `created_at` DESC LIMIT 1",
			{ user_id: userId },
		);

		if (!subscription) return null;

		return this.mapSubscription(subscription);
	}

	async findSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
		const subscriptions = await this.execute(
			'SELECT * FROM `subscriptions` WHERE `user_id` = :user_id ORDER BY `created_at` DESC',
			{ user_id: userId },
		);

		return Array.isArray(subscriptions[0])
			? subscriptions[0].map((sub: any) => this.mapSubscription(sub))
			: [];
	}

	async updateSubscription(
		id: number,
		data: {
			status?: SubscriptionStatus;
			current_period_start?: Date;
			current_period_end?: Date;
			provider_payment_method_id?: string;
			plan_id?: string;
			metadata?: Record<string, any>;
			canceled_at?: Date | null;
		},
	) {
		const updates: string[] = [];
		const params: Record<string, any> = { id };

		if (data.status !== undefined) {
			updates.push('`status` = :status');
			params.status = data.status;
		}

		if (data.current_period_start !== undefined) {
			updates.push('`current_period_start` = :current_period_start');
			params.current_period_start = data.current_period_start;
		}

		if (data.current_period_end !== undefined) {
			updates.push('`current_period_end` = :current_period_end');
			params.current_period_end = data.current_period_end;
		}

		if (data.provider_payment_method_id !== undefined) {
			updates.push(
				'`provider_payment_method_id` = :provider_payment_method_id',
			);
			params.provider_payment_method_id =
				data.provider_payment_method_id ?? null;
		}

		if (data.plan_id !== undefined) {
			updates.push('`plan_id` = :plan_id');
			params.plan_id = data.plan_id;
		}

		if (data.metadata !== undefined) {
			updates.push('`metadata` = :metadata');
			params.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
		}

		if (data.canceled_at !== undefined) {
			updates.push('`canceled_at` = :canceled_at');
			params.canceled_at = data.canceled_at ?? null;
		}

		if (updates.length === 0) {
			return;
		}

		await this.execute(
			`UPDATE \`subscriptions\` SET ${updates.join(', ')} WHERE \`id\` = :id`,
			params,
		);
	}

	async deleteSubscription(id: number) {
		await this.execute('DELETE FROM `subscriptions` WHERE `id` = :id', { id });
	}

	private mapSubscription(row: any): Subscription {
		return {
			id: row.id,
			user_id: row.user_id,
			provider: row.provider as PaymentProvider,
			provider_subscription_id: row.provider_subscription_id,
			provider_customer_id: row.provider_customer_id,
			plan_id: row.plan_id,
			status: row.status as SubscriptionStatus,
			current_period_start: new Date(row.current_period_start),
			current_period_end: new Date(row.current_period_end),
			provider_payment_method_id: row.provider_payment_method_id ?? undefined,
			metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
			created_at: new Date(row.created_at),
			updated_at: new Date(row.updated_at),
			canceled_at: row.canceled_at ? new Date(row.canceled_at) : undefined,
		};
	}
}
