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
		await this.db.execute(
			'INSERT INTO `user_settings` (`user_id`, `timezone`) VALUES (:userId, :timezone)',
			{ userId, ...data },
		);
	}

	async updateSettings(id: number, data: any) {
		await this.db.execute(
			'UPDATE `user_settings` SET `timezone` = :timezone WHERE `id` = :id',
			{ id, ...data },
		);
	}
}
