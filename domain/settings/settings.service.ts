import SettingsRepository from './settings.repository';

export default class SettingsService {
	constructor(
		private repository: SettingsRepository = new SettingsRepository(),
	) {
		//
	}

	async getSettingsByUserId(userId: number) {
		return this.repository.findSettingsByUserId(userId);
	}

	async upsertSettings(userId: number, data: any) {
		try {
			const settings = await this.repository.findSettingsByUserId(userId);
			if (settings) {
				return await this.repository.updateSettings(settings.id, data);
			}
			await this.repository.createSettings(userId, data);
		} catch (error) {
			throw error;
		}
	}
}
