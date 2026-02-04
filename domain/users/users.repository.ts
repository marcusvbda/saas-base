import Repository from '@/database/repository';

type BillingData = {
	card_number?: string | null;
	card_holder_name?: string | null;
	card_expiry_month?: string | null;
	card_expiry_year?: string | null;
	card_cvv?: string | null;
};
const userColumns =
	'`id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`';
const verificationColumns =
	'`id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`';
const userBillingColumns =
	'`id`, `user_id`, `card_number`, `card_holder_name`, `card_expiry_month`, `card_expiry_year`, `card_cvv`';
const userSubscriptionColumns =
	'`id`, `user_id`, `subscription_id`, `plan`, `stripe_customer_id`, `status`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `created_at`, `updated_at`';

export default class UserRepository extends Repository {
	async findById(id: string) {
		return await this.findOne(
			`SELECT ${userColumns} FROM \`user\` WHERE id = :id`,
			{ id },
		);
	}

	async findByEmail(email: string) {
		return await this.findOne(
			`SELECT ${userColumns} FROM \`user\` WHERE email = :email`,
			{ email },
		);
	}

	async updatePassword(userId: string, hashedPassword: string) {
		await this.execute(
			"UPDATE `account` SET `password` = :password, `updatedAt` = CURRENT_TIMESTAMP WHERE `userId` = :userId AND `providerId` = 'credential'",
			{ password: hashedPassword, userId },
		);
	}

	async createUserVerification(userId: string, token: string) {
		await this.execute(
			"INSERT INTO `verification` (`id`, `identifier`, `value`, `expiresAt`) VALUES (gen_random_uuid(), :identifier, :value, NOW() + INTERVAL '1 hour')",
			{
				identifier: `reset-password:${userId}`,
				value: token,
			},
		);
	}

	async findPasswordVerificationToken(token: string) {
		return await this.findOne(
			`SELECT ${verificationColumns} FROM \`verification\` WHERE \`value\` = :token AND \`expiresAt\` > NOW()`,
			{ token },
		);
	}

	async deletePasswordVerificationToken(token: string) {
		await this.execute('DELETE FROM `verification` WHERE `value` = :token', {
			token,
		});
	}

	async verifyUserById(userId: string) {
		await this.execute(
			'UPDATE `user` SET `emailVerified` = TRUE WHERE `id` = :userId',
			{ userId },
		);
	}

	async updateUserData(userId: string, data: { name?: string }) {
		if (!data.name) {
			return;
		}
		await this.execute(
			'UPDATE `user` SET `name` = :name WHERE `id` = :userId',
			{ name: data.name, userId },
		);
	}

	async findBillingByUserId(userId: string) {
		return await this.findOne(
			`SELECT ${userBillingColumns} FROM \`user_billing\` WHERE \`user_id\` = :userId`,
			{ userId },
		);
	}

	async createBilling(userId: string, data: BillingData) {
		const allowedFields = [
			'card_number',
			'card_holder_name',
			'card_expiry_month',
			'card_expiry_year',
			'card_cvv',
		] as const;

		const fields: string[] = ['user_id'];
		const values: string[] = [':userId'];
		const params: Record<string, any> = { userId };

		for (const field of allowedFields) {
			if (data[field] !== undefined) {
				fields.push(field);
				values.push(`:${field}`);
				params[field] = data[field] ?? null;
			}
		}

		await this.execute(
			`INSERT INTO \`user_billing\` (\`${fields.join('`, `')}\`) VALUES (${values.join(', ')})`,
			params,
		);
	}

	async updateBilling(id: number, data: BillingData) {
		const allowedFields = [
			'card_number',
			'card_holder_name',
			'card_expiry_month',
			'card_expiry_year',
			'card_cvv',
		] as const;

		const updates: string[] = [];
		const params: Record<string, any> = { id };

		for (const field of allowedFields) {
			if (data[field] !== undefined) {
				updates.push(`\`${field}\` = :${field}`);
				params[field] = data[field] ?? null;
			}
		}

		if (updates.length === 0) {
			return;
		}

		await this.execute(
			`UPDATE \`user_billing\` SET ${updates.join(', ')} WHERE \`id\` = :id`,
			params,
		);
	}

	async getSubscriptionByUserId(userId: string) {
		return await this.findOne(
			`SELECT ${userSubscriptionColumns} FROM \`user_subscriptions\` WHERE \`user_id\` = :userId ORDER BY \`updated_at\` DESC`,
			{ userId },
		);
	}

	async getSubscriptionBySubscriptionId(subscriptionId: string) {
		return await this.findOne(
			`SELECT ${userSubscriptionColumns} FROM \`user_subscriptions\` WHERE \`subscription_id\` = :subscriptionId`,
			{ subscriptionId },
		);
	}

	async deleteSubscriptionBySubscriptionId(subscriptionId: string) {
		await this.execute(
			'DELETE FROM `user_subscriptions` WHERE `subscription_id` = :subscriptionId',
			{ subscriptionId },
		);
	}

	async createSubscription(
		userId: string,
		data: {
			plan: string;
			subscription_id: string;
			stripe_customer_id?: string | null;
			status?: string;
			current_period_start?: Date | null;
			current_period_end?: Date | null;
			cancel_at_period_end?: boolean;
		},
	) {
		await this.execute(
			`INSERT INTO \`user_subscriptions\` (
				\`user_id\`, \`plan\`, \`subscription_id\`,
				\`stripe_customer_id\`, \`status\`,
				\`current_period_start\`, \`current_period_end\`, \`cancel_at_period_end\`
			) VALUES (
				:userId, :plan, :subscription_id,
				:stripe_customer_id, :status,
				:current_period_start, :current_period_end, :cancel_at_period_end
			)`,
			{
				userId,
				plan: data.plan,
				subscription_id: data.subscription_id,
				stripe_customer_id: data.stripe_customer_id ?? null,
				status: data.status ?? 'active',
				current_period_start: data.current_period_start ?? null,
				current_period_end: data.current_period_end ?? null,
				cancel_at_period_end: data.cancel_at_period_end ?? false,
			},
		);
	}

	async updateSubscription(
		id: number,
		data: {
			plan?: string;
			subscription_id?: string;
			stripe_customer_id?: string | null;
			status?: string;
			current_period_start?: Date | null;
			current_period_end?: Date | null;
			cancel_at_period_end?: boolean;
		},
	) {
		const allowed: (keyof typeof data)[] = [
			'plan',
			'subscription_id',
			'stripe_customer_id',
			'status',
			'current_period_start',
			'current_period_end',
			'cancel_at_period_end',
		];
		const updates: string[] = [];
		const params: Record<string, unknown> = { id };

		for (const k of allowed) {
			const v = data[k];
			if (v === undefined) continue;
			if (k === 'cancel_at_period_end') {
				updates.push('`cancel_at_period_end` = :cancel_at_period_end');
				params.cancel_at_period_end = Boolean(v);
				continue;
			}
			updates.push(`\`${k}\` = :${k}`);
			params[k as string] = v;
		}

		if (updates.length === 0) return;

		updates.push('`updated_at` = CURRENT_TIMESTAMP');
		await this.execute(
			`UPDATE \`user_subscriptions\` SET ${updates.join(', ')} WHERE \`id\` = :id`,
			params,
		);
	}
}
