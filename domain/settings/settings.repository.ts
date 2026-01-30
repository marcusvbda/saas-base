import Repository from '@/database/repository';

type SettingsData = {
	timezone?: string | null;
	plan?: string | null;
	card_number?: string | null;
	card_holder_name?: string | null;
	card_expiry_month?: string | null;
	card_expiry_year?: string | null;
	card_cvv?: string | null;
};

/** Columns that exist in user_settings table (migration 1_user_settings.sql). */
const USER_SETTINGS_COLUMNS = '`id`, `user_id`, `timezone`';

/** Fields allowed for insert/update; only timezone exists in current schema. */
const ALLOWED_FIELDS = ['timezone'] as const;

export default class SettingsRepository extends Repository {
	async findSettingsByUserId(userId: string) {
		return await this.findOne(
			`SELECT ${USER_SETTINGS_COLUMNS} FROM \`user_settings\` WHERE \`user_id\` = :userId`,
			{ userId },
		);
	}

	async createSettings(userId: string, data: SettingsData) {
		const allowedFields = ALLOWED_FIELDS;

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
			`INSERT INTO \`user_settings\` (\`${fields.join('`, `')}\`) VALUES (${values.join(', ')})`,
			params,
		);
	}

	async updateSettings(id: number, data: SettingsData) {
		const allowedFields = ALLOWED_FIELDS;

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
			`UPDATE \`user_settings\` SET ${updates.join(', ')} WHERE \`id\` = :id`,
			params,
		);
	}
}
