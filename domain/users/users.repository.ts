import Repository from '@/db/repository';

type BillingData = {
	card_number?: string | null;
	card_holder_name?: string | null;
	card_expiry_month?: string | null;
	card_expiry_year?: string | null;
	card_cvv?: string | null;
};
export default class UserRepository extends Repository {
	async findById(id: string) {
		return await this.findOne('SELECT * FROM `user` WHERE id = :id', { id });
	}

	async findByEmail(email: string) {
		return await this.findOne('SELECT * FROM `user` WHERE email = :email', {
			email,
		});
	}

	async updatePassword(userId: string, hashedPassword: string) {
		await this.execute(
			"UPDATE `account` SET `password` = :password, `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `userId` = :userId AND `providerId` = 'credential'",
			{ password: hashedPassword, userId },
		);
	}

	async createUserVerification(userId: string, token: string) {
		await this.execute(
			'INSERT INTO `verification` (`id`, `identifier`, `value`, `expiresAt`) VALUES (UUID(), :identifier, :value, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
			{
				identifier: `reset-password:${userId}`,
				value: token,
			},
		);
	}

	async findPasswordVerificationToken(token: string) {
		return await this.findOne(
			'SELECT * FROM `verification` WHERE `value` = :token AND `expiresAt` > NOW()',
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
			'SELECT * FROM `user_billing` WHERE `user_id` = :userId',
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
}
