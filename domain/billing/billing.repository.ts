import Repository from '@/services/db/repository';

export default class BillingRepository extends Repository {

	async findBillingByUserId(userId: string) {
		const [rows] = await this.db.execute(
			'SELECT * FROM `user_billing` WHERE `user_id` = :userId',
			{ userId },
		);
		return rows[0] || null;
	}

	async createBilling(userId: string, data: any) {
		const fields: string[] = ['user_id'];
		const values: string[] = [':userId'];
		const params: any = { userId };

		if (data.card_number !== undefined) {
			fields.push('card_number');
			values.push(':card_number');
			params.card_number = data.card_number ?? null;
		}

		if (data.card_holder_name !== undefined) {
			fields.push('card_holder_name');
			values.push(':card_holder_name');
			params.card_holder_name = data.card_holder_name ?? null;
		}

		if (data.card_expiry_month !== undefined) {
			fields.push('card_expiry_month');
			values.push(':card_expiry_month');
			params.card_expiry_month = data.card_expiry_month ?? null;
		}

		if (data.card_expiry_year !== undefined) {
			fields.push('card_expiry_year');
			values.push(':card_expiry_year');
			params.card_expiry_year = data.card_expiry_year ?? null;
		}

		if (data.card_cvv !== undefined) {
			fields.push('card_cvv');
			values.push(':card_cvv');
			params.card_cvv = data.card_cvv ?? null;
		}

		await this.db.execute(
			`INSERT INTO \`user_billing\` (\`${fields.join('`, `')}\`) VALUES (${values.join(', ')})`,
			params,
		);
	}

	async updateBilling(id: number, data: any) {
		const updates: string[] = [];
		const params: any = { id };

		if (data.card_number !== undefined) {
			updates.push('`card_number` = :card_number');
			params.card_number = data.card_number ?? null;
		}

		if (data.card_holder_name !== undefined) {
			updates.push('`card_holder_name` = :card_holder_name');
			params.card_holder_name = data.card_holder_name ?? null;
		}

		if (data.card_expiry_month !== undefined) {
			updates.push('`card_expiry_month` = :card_expiry_month');
			params.card_expiry_month = data.card_expiry_month ?? null;
		}

		if (data.card_expiry_year !== undefined) {
			updates.push('`card_expiry_year` = :card_expiry_year');
			params.card_expiry_year = data.card_expiry_year ?? null;
		}

		if (data.card_cvv !== undefined) {
			updates.push('`card_cvv` = :card_cvv');
			params.card_cvv = data.card_cvv ?? null;
		}

		if (updates.length === 0) {
			return;
		}

		await this.db.execute(
			`UPDATE \`user_billing\` SET ${updates.join(', ')} WHERE \`id\` = :id`,
			params,
		);
	}
}
