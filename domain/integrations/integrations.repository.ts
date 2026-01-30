import Repository from '@/database/repository';
import { publishJson } from '@/lib/qstash';

export type RepositoryIntegrationStatus =
	| 'pending'
	| 'connected'
	| 'disconnected';

export type RepositoryIntegration = {
	id: number;
	user_id: string;
	provider: string;
	token: string;
	status: RepositoryIntegrationStatus;
	created_at: string;
	updated_at: string;
};

export type RepositoryIntegrationInput = {
	provider: string;
	token: string;
	status?: RepositoryIntegrationStatus;
};

export default class IntegrationsRepository extends Repository {
	async findById(id: string) {
		return await this.findOne(
			'SELECT * FROM `repository_integrations` WHERE `id` = :id',
			{ id },
		);
	}

	async findAllByUserId(userId: string) {
		return await this.db
			.execute(
				'SELECT * FROM `repository_integrations` WHERE `user_id` = :userId ORDER BY `created_at` DESC',
				{ userId },
			)
			.then(([rows]: any) => rows as RepositoryIntegration[]);
	}

	async findByIdForUser(userId: string, id: number) {
		return await this.findOne(
			'SELECT * FROM `repository_integrations` WHERE `user_id` = :userId AND `id` = :id',
			{ userId, id },
		);
	}

	async create(userId: string, data: RepositoryIntegrationInput) {
		const result = await this.execute(
			`INSERT INTO \`repository_integrations\` (\`user_id\`, \`provider\`, \`token\`, \`status\`)
       VALUES (:userId, :provider, :token, :status)`,
			{
				userId,
				provider: data.provider,
				token: data.token,
				status: 'pending',
			},
		);

		await publishJson({
			service: 'IntegrationsService',
			action: 'validateTokenStatus',
			payload: { id: result.insertId },
		});
	}

	async update(
		id: number,
		userId: string,
		data: Partial<RepositoryIntegrationInput>,
	) {
		const allowed: (keyof RepositoryIntegrationInput)[] = [
			'provider',
			'token',
			'status',
		];
		const updates: string[] = [];
		const params: Record<string, unknown> = { id, userId };

		for (const key of allowed) {
			const value = data[key];
			if (value === undefined) continue;
			updates.push(`\`${key}\` = :${key}`);
			params[key] = value;
		}

		if (!updates.length) return;

		await this.execute(
			`UPDATE \`repository_integrations\`
       SET ${updates.join(', ')}, \`updated_at\` = CURRENT_TIMESTAMP
       WHERE \`id\` = :id AND \`user_id\` = :userId`,
			params,
		);
	}

	async delete(id: number, userId: string) {
		await this.execute(
			'DELETE FROM `repository_integrations` WHERE `id` = :id AND `user_id` = :userId',
			{ id, userId },
		);
	}
}
