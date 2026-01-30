import { pusher } from '@/lib/pusher';
import { NotFoundError } from '@/domain/errors';
import IntegrationsRepository, {
	RepositoryIntegration,
	RepositoryIntegrationInput,
} from './integrations.repository';

export default class IntegrationsService {
	constructor(
		private repository: IntegrationsRepository = new IntegrationsRepository(),
	) {}

	async listUserIntegrations(userId: string): Promise<RepositoryIntegration[]> {
		return this.repository.findAllByUserId(userId);
	}

	async createIntegration(
		userId: string,
		data: RepositoryIntegrationInput,
	): Promise<{ id: number }> {
		const id = await this.repository.create(userId, data);
		return { id };
	}

	async updateIntegration(
		userId: string,
		id: number,
		data: Partial<RepositoryIntegrationInput>,
	): Promise<void> {
		const existing = await this.repository.findByIdForUser(userId, id);
		if (!existing) {
			throw new NotFoundError('Integration not found');
		}
		await this.repository.update(id, userId, data);
	}

	async deleteIntegration(userId: string, id: number): Promise<void> {
		const existing = await this.repository.findByIdForUser(userId, id);
		if (!existing) {
			throw new NotFoundError('Integration not found');
		}
		await this.repository.delete(id, userId);
	}

	async validateTokenStatus(payload: { id: string | number }): Promise<void> {
		const integration = await this.repository.findById(payload.id as string);
		if (!integration) return;

		let status: 'connected' | 'disconnected' = 'disconnected';

		if (integration.provider === 'gitlab') {
			const isValid = await this.validateGitLabToken(integration.token);
			status = isValid ? 'connected' : 'disconnected';
		}

		await this.repository.update(
			integration.id as number,
			integration.user_id as string,
			{ status },
		);

		pusher.trigger(
			`integration-${integration.id}`,
			'on-integration-status-update',
			{ status },
		);
	}

	private async validateGitLabToken(token: string): Promise<boolean> {
		const baseUrl = process.env.GITLAB_API_URL || 'https://gitlab.com';
		try {
			const res = await fetch(`${baseUrl}/api/v4/user`, {
				headers: { 'PRIVATE-TOKEN': token },
			});
			return res.ok;
		} catch {
			return false;
		}
	}
}
