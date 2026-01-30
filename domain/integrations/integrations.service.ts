import { pusher } from '@/lib/pusher';
import IntegrationsRepository, {
	RepositoryIntegration,
	RepositoryIntegrationInput,
} from './integrations.repository';
import { publishJson } from '@/lib/qstash';

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
		await this.repository.create(userId, data);
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

		await publishJson({
			service: 'IntegrationsService',
			action: 'validateTokenStatus',
			payload: { id, token: data.token },
		});
	}

	async deleteIntegration(userId: string, id: number): Promise<void> {
		const existing = await this.repository.findByIdForUser(userId, id);
		if (!existing) {
			throw new Error('Integration not found');
		}
		await this.repository.delete(id, userId);
	}

	async validateTokenStatus(payload: {
		id: string | number;
		token: string;
		userId: string;
	}) {
		const integration = await this.repository.findById(payload.id as string);
		if (integration) {
			this.repository.update(
				integration.id as number,
				integration.user_id as string,
				{
					status: 'connected',
				},
			);

			//"on-integration-status-update"
			pusher.trigger(
				`integration-${integration.id}`,
				'on-integration-status-update',
				{
					...integration,
					status: 'connected',
				},
			);
		}
	}
}
