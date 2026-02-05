import { db } from '@/database';
import { repositoryIntegrations } from '@/database/schema';
import { eq, and, desc } from 'drizzle-orm';

export type RepositoryIntegrationStatus =
	| 'pending'
	| 'connected'
	| 'disconnected';

export type RepositoryIntegrationType = 'repository' | 'ai';

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
	base_url: string | null;
	model: string | null;
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
	base_url?: string | null;
	model?: string | null;
};

function toIntegration(
	row: typeof repositoryIntegrations.$inferSelect,
): RepositoryIntegration {
	const projects = row.projects
		? typeof row.projects === 'string'
			? JSON.parse(row.projects as string)
			: row.projects
		: null;
	let ignoredBranches = row.ignoredBranches
		? typeof row.ignoredBranches === 'string'
			? JSON.parse(row.ignoredBranches as string)
			: row.ignoredBranches
		: null;
	if (ignoredBranches && Array.isArray(ignoredBranches)) {
		ignoredBranches = {};
	}
	return {
		id: row.id,
		user_id: row.userId,
		provider: row.provider,
		type: row.type as RepositoryIntegrationType,
		token: row.token,
		status: row.status as RepositoryIntegrationStatus,
		projects: projects as number[] | null,
		ignored_branches: ignoredBranches as IgnoredBranchesByProject | null,
		base_url: row.baseUrl ?? null,
		model: row.model ?? null,
		created_at: row.createdAt.toISOString?.() ?? String(row.createdAt),
		updated_at: row.updatedAt.toISOString?.() ?? String(row.updatedAt),
	};
}

export default class IntegrationsRepository {
	async findById(id: string) {
		const rows = await db
			.select()
			.from(repositoryIntegrations)
			.where(eq(repositoryIntegrations.id, parseInt(id, 10)))
			.limit(1);
		return rows[0] ? toIntegration(rows[0]) : null;
	}

	async findAllByUserId(userId: string) {
		const rows = await db
			.select()
			.from(repositoryIntegrations)
			.where(eq(repositoryIntegrations.userId, userId))
			.orderBy(desc(repositoryIntegrations.createdAt));
		return rows.map(toIntegration);
	}

	async findAllByUserIdAndType(
		userId: string,
		type: RepositoryIntegrationType,
	): Promise<RepositoryIntegration[]> {
		const rows = await db
			.select()
			.from(repositoryIntegrations)
			.where(
				and(
					eq(repositoryIntegrations.userId, userId),
					eq(repositoryIntegrations.type, type),
				),
			)
			.orderBy(desc(repositoryIntegrations.createdAt));
		return rows.map(toIntegration);
	}

	async findFirstByUserIdAndType(
		userId: string,
		type: RepositoryIntegrationType,
	): Promise<RepositoryIntegration | null> {
		const list = await this.findAllByUserIdAndType(userId, type);
		return list[0] ?? null;
	}

	async findByIdForUser(userId: string, id: number) {
		const rows = await db
			.select()
			.from(repositoryIntegrations)
			.where(
				and(
					eq(repositoryIntegrations.userId, userId),
					eq(repositoryIntegrations.id, id),
				),
			)
			.limit(1);
		return rows[0] ? toIntegration(rows[0]) : null;
	}

	async create(
		userId: string,
		data: RepositoryIntegrationInput,
	): Promise<number> {
		const type = data.type ?? 'repository';
		const status = (type === 'ai' ? 'connected' : 'pending') as
			| 'pending'
			| 'connected';
		const [row] = await db
			.insert(repositoryIntegrations)
			.values({
				userId,
				provider: data.provider,
				type,
				token: data.token,
				status,
				projects: data.projects ?? null,
				ignoredBranches: data.ignored_branches ?? null,
				baseUrl: data.base_url ?? null,
				model: data.model ?? null,
			})
			.returning({ id: repositoryIntegrations.id });
		return row?.id ?? 0;
	}

	async update(
		id: number,
		userId: string,
		data: Partial<RepositoryIntegrationInput>,
	) {
		const updates: Partial<typeof repositoryIntegrations.$inferInsert> = {};
		if (data.provider !== undefined) updates.provider = data.provider;
		if (data.token !== undefined) updates.token = data.token;
		if (data.status !== undefined) updates.status = data.status as 'pending';
		if (data.projects !== undefined) updates.projects = data.projects;
		if (data.ignored_branches !== undefined)
			updates.ignoredBranches = data.ignored_branches;
		if (data.base_url !== undefined) updates.baseUrl = data.base_url;
		if (data.model !== undefined) updates.model = data.model;
		if (Object.keys(updates).length === 0) return;
		updates.updatedAt = new Date();
		await db
			.update(repositoryIntegrations)
			.set(updates)
			.where(
				and(
					eq(repositoryIntegrations.id, id),
					eq(repositoryIntegrations.userId, userId),
				),
			);
	}

	async delete(id: number, userId: string) {
		await db
			.delete(repositoryIntegrations)
			.where(
				and(
					eq(repositoryIntegrations.id, id),
					eq(repositoryIntegrations.userId, userId),
				),
			);
	}
}
