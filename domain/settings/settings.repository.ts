import { database } from '@/lib/db/connection';

export default class SettingsRepository {
	constructor(private db: any = database) {
		//
	}

	async findSettingsByUserId(userId: number) {
		const [rows] = await this.db.execute(
			'SELECT * FROM `user_settings` WHERE `user_id` = :userId',
			{ userId },
		);
		return rows[0] || null;
	}

	async createSettings(userId: number, data: any) {
		const fields: string[] = ['user_id'];
		const values: string[] = [':userId'];
		const params: any = { userId };

		if (data.timezone !== undefined) {
			fields.push('timezone');
			values.push(':timezone');
			params.timezone = data.timezone ?? null;
		}

		if (data.plan !== undefined) {
			fields.push('plan');
			values.push(':plan');
			params.plan = data.plan ?? null;
		}

		await this.db.execute(
			`INSERT INTO \`user_settings\` (\`${fields.join('`, `')}\`) VALUES (${values.join(', ')})`,
			params,
		);
	}

	async updateSettings(id: number, data: any) {
		const updates: string[] = [];
		const params: any = { id };

		if (data.timezone !== undefined) {
			updates.push('`timezone` = :timezone');
			params.timezone = data.timezone ?? null;
		}

		if (data.plan !== undefined) {
			updates.push('`plan` = :plan');
			params.plan = data.plan ?? null;
		}

		if (updates.length === 0) {
			return;
		}

		await this.db.execute(
			`UPDATE \`user_settings\` SET ${updates.join(', ')} WHERE \`id\` = :id`,
			params,
		);
	}
}
