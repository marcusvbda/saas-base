import { pusher } from '@/lib/pusher';
import { ConflictError, NotFoundError } from '@/domain/errors';
import IntegrationsRepository, {
	RepositoryIntegration,
	RepositoryIntegrationInput,
	RepositoryIntegrationType,
} from './integrations.repository';

const SINGLE_INSTANCE_TYPES: RepositoryIntegrationType[] = [
	'task_manager',
	'communication_provider',
];

export default class IntegrationsService {
	constructor(
		private repository: IntegrationsRepository = new IntegrationsRepository(),
	) {}

	async listUserIntegrations(userId: string): Promise<RepositoryIntegration[]> {
		return this.repository.findAllByUserId(userId);
	}

	async listUserIntegrationsByType(
		userId: string,
		type: RepositoryIntegrationType,
	): Promise<RepositoryIntegration[]> {
		return this.repository.findAllByUserIdAndType(userId, type);
	}

	async createIntegration(
		userId: string,
		data: RepositoryIntegrationInput,
	): Promise<{ id: number }> {
		const type = (data.type ?? 'repository') as RepositoryIntegrationType;
		if (SINGLE_INSTANCE_TYPES.includes(type)) {
			const existing = await this.repository.findAllByUserIdAndType(
				userId,
				type,
			);
			if (existing.length > 0) {
				throw new ConflictError(
					type === 'task_manager'
						? 'Task manager integration already exists'
						: 'Communication provider integration already exists',
				);
			}
		}
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
		const integration = await this.repository.findById(String(payload.id));
		if (!integration) return;

		let status: 'connected' | 'disconnected' = 'disconnected';

		if (integration.provider === 'gitlab') {
			status = (await this.validateGitLabToken(integration.token))
				? 'connected'
				: 'disconnected';
		} else if (integration.provider === 'notion') {
			status = (await this.validateNotionToken(integration.token))
				? 'connected'
				: 'disconnected';
		} else if (integration.provider === 'slack') {
			status = (await this.validateSlackToken(integration.token))
				? 'connected'
				: 'disconnected';
		}

		await this.repository.update(
			integration.id,
			integration.user_id,
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

	private async validateNotionToken(token: string): Promise<boolean> {
		try {
			const res = await fetch('https://api.notion.com/v1/users/me', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Notion-Version': '2022-06-28',
				},
			});
			return res.ok;
		} catch {
			return false;
		}
	}

	private async validateSlackToken(token: string): Promise<boolean> {
		try {
			const res = await fetch('https://slack.com/api/auth.test', {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) return false;
			const json = (await res.json()) as { ok?: boolean };
			return json.ok === true;
		} catch {
			return false;
		}
	}

	async fetchGitLabProjects(
		integrationId: number,
		userId: string,
	): Promise<Array<{ id: number; name: string; path_with_namespace: string }>> {
		const integration = await this.repository.findByIdForUser(
			userId,
			integrationId,
		);
		if (!integration || integration.provider !== 'gitlab') {
			throw new NotFoundError('GitLab integration not found');
		}
		if (integration.status !== 'connected') {
			throw new Error('Integration not connected');
		}

		const baseUrl = process.env.GITLAB_API_URL || 'https://gitlab.com';
		try {
			const res = await fetch(
				`${baseUrl}/api/v4/projects?membership=true&per_page=100`,
				{
					headers: { 'PRIVATE-TOKEN': integration.token },
				},
			);
			if (!res.ok) throw new Error('Failed to fetch projects');
			const projects = await res.json();
			return projects.map((p: any) => ({
				id: p.id,
				name: p.name,
				path_with_namespace: p.path_with_namespace,
			}));
		} catch {
			throw new Error('Failed to fetch GitLab projects');
		}
	}

	async fetchGitLabBranches(
		integrationId: number,
		userId: string,
		projectId: number,
		search?: string,
	): Promise<Array<{ name: string }>> {
		const integration = await this.repository.findByIdForUser(
			userId,
			integrationId,
		);
		if (!integration || integration.provider !== 'gitlab') {
			throw new NotFoundError('GitLab integration not found');
		}
		if (integration.status !== 'connected') {
			throw new Error('Integration not connected');
		}

		const baseUrl = process.env.GITLAB_API_URL || 'https://gitlab.com';
		const perPage = 100;
		const allBranches: Array<{ name: string }> = [];
		let page = 1;
		const searchParam =
			search && search.trim().length >= 2
				? `&search=${encodeURIComponent(search.trim())}`
				: '';
		try {
			for (;;) {
				const res = await fetch(
					`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/repository/branches?per_page=${perPage}&page=${page}${searchParam}`,
					{
						headers: { 'PRIVATE-TOKEN': integration.token },
					},
				);
				if (!res.ok) throw new Error('Failed to fetch branches');
				const branches = (await res.json()) as Array<{ name: string }>;
				if (branches.length === 0) break;
				for (const b of branches) {
					allBranches.push({ name: b.name });
				}
				if (branches.length < perPage) break;
				page += 1;
			}
			return allBranches;
		} catch {
			throw new Error('Failed to fetch GitLab branches');
		}
	}
}
