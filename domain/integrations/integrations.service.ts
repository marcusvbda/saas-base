import IntegrationsRepository, {
	RepositoryIntegration,
	RepositoryIntegrationInput,
} from './integrations.repository';

export default class IntegrationsService {
	constructor(
		private repository: IntegrationsRepository = new IntegrationsRepository(),
	) {
		//
	}

	async listUserIntegrations(userId: string): Promise<RepositoryIntegration[]> {
		return this.repository.findAllByUserId(userId);
	}

	async createIntegration(
		userId: string,
		data: RepositoryIntegrationInput,
	): Promise<void> {
		// Por padrão começamos como "pending" até validar o token
		await this.repository.create(userId, {
			...data,
			status: data.status ?? 'pending',
		});
	}

	async updateIntegration(
		userId: string,
		id: number,
		data: Partial<RepositoryIntegrationInput>,
	): Promise<void> {
		const existing = await this.repository.findByIdForUser(userId, id);
		if (!existing) {
			throw new Error('Integration not found');
		}
		await this.repository.update(id, userId, data);
	}

	async deleteIntegration(userId: string, id: number): Promise<void> {
		const existing = await this.repository.findByIdForUser(userId, id);
		if (!existing) {
			throw new Error('Integration not found');
		}
		await this.repository.delete(id, userId);
	}

	async validateTokenStatus(payload: { id: string | number; token: string }) {
		console.log('validateTokenStatus', payload);
	}
}
