import Repository from '@/database/repository';

export type RepositoryIntegrationStatus =
	| 'pending'
	| 'connected'
	| 'disconnected';

export type RepositoryIntegrationType =
	| 'repository'
	| 'task_manager'
	| 'communication_provider';

/** project id (string) -> branch names to ignore */
export type IgnoredBranchesByProject = Record<string, string[]>;

export type RepositoryIntegration = {
	id: number;
	user_id: string;
	provider: string;
	type: RepositoryIntegrationType;
	token: string;
	status: RepositoryIntegrationStatus;
	projects: number[] | null;
	ignored_branches: IgnoredBranchesByProject | null;
	created_at: string;
	updated_at: string;
};

export type RepositoryIntegrationInput = {
	provider: string;
	type?: RepositoryIntegrationType;
	token: string;
	status?: RepositoryIntegrationStatus;
	projects?: number[] | null;
	ignored_branches?: IgnoredBranchesByProject | null;
};

export default class IntegrationsRepository extends Repository {
	private readonly columns =
		'`id`, `user_id`, `provider`, `type`, `token`, `status`, `projects`, `ignored_branches`, `created_at`, `updated_at`';

	private parseIntegration(row: any): RepositoryIntegration {
		return {
			...row,
			projects: row.projects
				? typeof row.projects === 'string'
					? JSON.parse(row.projects)
					: row.projects
				: null,
			ignored_branches: (() => {
				const raw = row.ignored_branches
					? typeof row.ignored_branches === 'string'
						? JSON.parse(row.ignored_branches)
						: row.ignored_branches
					: null;
				if (!raw) return null;
				// Legacy: was array of branch names; now we store per project
				if (Array.isArray(raw)) return {};
				return raw as IgnoredBranchesByProject;
			})(),
		};
	}

	async findById(id: string) {
		const row = await this.findOne(
			`SELECT ${this.columns} FROM \`repository_integrations\` WHERE \`id\` = :id`,
			{ id },
		);
		return row ? this.parseIntegration(row) : null;
	}

	async findAllByUserId(userId: string) {
		return await this.db
			.execute(
				`SELECT ${this.columns} FROM \`repository_integrations\` WHERE \`user_id\` = :userId ORDER BY \`created_at\` DESC`,
				{ userId },
			)
			.then(([rows]: unknown[]) =>
				(rows as any[]).map((row) => this.parseIntegration(row)),
			);
	}

	async findAllByUserIdAndType(
		userId: string,
		type: RepositoryIntegrationType,
	): Promise<RepositoryIntegration[]> {
		return await this.db
			.execute(
				`SELECT ${this.columns} FROM \`repository_integrations\` WHERE \`user_id\` = :userId AND \`type\` = :type ORDER BY \`created_at\` DESC`,
				{ userId, type },
			)
			.then(([rows]: unknown[]) =>
				(rows as any[]).map((row) => this.parseIntegration(row)),
			);
	}

	async findByIdForUser(userId: string, id: number) {
		const row = await this.findOne(
			`SELECT ${this.columns} FROM \`repository_integrations\` WHERE \`user_id\` = :userId AND \`id\` = :id`,
			{ userId, id },
		);
		return row ? this.parseIntegration(row) : null;
	}

	async create(
		userId: string,
		data: RepositoryIntegrationInput,
	): Promise<number> {
		const type = data.type ?? 'repository';
		const result = (await this.execute(
			`INSERT INTO \`repository_integrations\` (\`user_id\`, \`provider\`, \`type\`, \`token\`, \`status\`, \`projects\`, \`ignored_branches\`)
       VALUES (:userId, :provider, :type, :token, :status, :projects, :ignored_branches)`,
			{
				userId,
				provider: data.provider,
				type,
				token: data.token,
				status: 'pending',
				projects: data.projects ? JSON.stringify(data.projects) : null,
				ignored_branches: data.ignored_branches
					? JSON.stringify(data.ignored_branches)
					: null,
			},
		)) as { insertId?: number };
		return result.insertId ?? 0;
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
			'projects',
			'ignored_branches',
		];
		const updates: string[] = [];
		const params: Record<string, unknown> = { id, userId };

		for (const key of allowed) {
			const value = data[key];
			if (value === undefined) continue;
			if (key === 'projects' || key === 'ignored_branches') {
				updates.push(`\`${key}\` = :${key}`);
				params[key] = value ? JSON.stringify(value) : null;
			} else {
				updates.push(`\`${key}\` = :${key}`);
				params[key] = value;
			}
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
