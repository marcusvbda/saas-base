import type { SettingsUpdateInput } from '@/types/settings';
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

	async upsertSettings(userId: string, data: SettingsUpdateInput): Promise<void> {
		const settings = await this.repository.findSettingsByUserId(userId);
		if (settings) {
			await this.repository.updateSettings(settings.id, data);
			return;
		}
		await this.repository.createSettings(userId, data);
	}
}
