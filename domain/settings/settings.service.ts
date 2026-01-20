import SettingsRepository from './settings.repository';

export default class SettingsService {
	constructor(
		private repository: SettingsRepository = new SettingsRepository(),
	) {
		//
	}

	async getSettingsByUserId(userId: string) {
		return this.repository.findSettingsByUserId(userId);
	}

	async upsertSettings(userId: string, data: any) {
		const settings = await this.repository.findSettingsByUserId(userId);
		if (settings) {
			return await this.repository.updateSettings(settings.id, data);
		}
		await this.repository.createSettings(userId, data);
	}
}
